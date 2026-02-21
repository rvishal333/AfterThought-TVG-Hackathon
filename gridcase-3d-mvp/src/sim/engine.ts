import {
  PlanVersion,
  Project,
  Scenario,
  SimulationResult,
  ComparisonDelta,
  FilingSnapshot,
  GridNode,
  GridEdge,
  EventLogEntry,
  Zone,
} from '../types/grid';
import { mockZones, mockNodes, mockEdges } from '../data/mockAustin';
import { mulberry32, generateRunId, pearsonCorrelation, clamp } from '../utils/math';

// ─── Project application ──────────────────────────────────────────────────────

export function applyProject(plan: PlanVersion, project: Project): PlanVersion {
  const alreadyAdded = plan.projects.some((p) => p.id === project.id);
  if (alreadyAdded) return plan;
  return {
    ...plan,
    id: `${plan.id}-p${project.id}`,
    projects: [...plan.projects, project],
    createdAt: new Date().toISOString(),
  };
}

export function removeProject(plan: PlanVersion, projectId: string): PlanVersion {
  return {
    ...plan,
    id: plan.id.replace(`-p${projectId}`, ''),
    projects: plan.projects.filter((p) => p.id !== projectId),
    createdAt: new Date().toISOString(),
  };
}

// ─── Simulation helpers ───────────────────────────────────────────────────────

function getEffectiveNodes(plan: PlanVersion): GridNode[] {
  return mockNodes.map((node) => {
    let capacity = node.capacityMW;
    let status = node.status;

    for (const proj of plan.projects) {
      if (proj.nodeId === node.id || proj.zoneId === node.zoneId) {
        if (proj.effects.capacityBoostMW) {
          capacity += proj.effects.capacityBoostMW;
        }
      }
    }

    // EV adoption rate increases demand, so nodes under EV zones see capacity stress
    const evLoad = plan.assumptions.evAdoptionRate * 0.1 * capacity;
    capacity = Math.max(capacity - evLoad * 0.1, capacity * 0.85); // net effect

    return { ...node, capacityMW: capacity, status };
  });
}

function getEffectiveEdges(_plan: PlanVersion): GridEdge[] {
  return mockEdges.map((edge) => ({ ...edge }));
}

function getZoneBaseLoad(zoneId: string, plan: PlanVersion): number {
  const zone = mockZones.find((z) => z.id === zoneId);
  if (!zone) return 0;

  let load = zone.baseLoadMW;

  // Population growth impact
  load *= 1 + plan.assumptions.populationGrowthRate / 100;

  // EV adoption increases residential zone loads
  load *= 1 + plan.assumptions.evAdoptionRate * 0.25;

  // Demand reduction from smart meters / demand-response projects
  for (const proj of plan.projects) {
    if (proj.zoneId === zoneId && proj.effects.demandReductionFactor) {
      load *= 1 - proj.effects.demandReductionFactor;
    }
  }

  return load;
}

function getZoneVulnerability(zoneId: string, plan: PlanVersion): number {
  const zone = mockZones.find((z) => z.id === zoneId);
  if (!zone) return 0.5;

  let vuln = zone.vulnerability;
  for (const proj of plan.projects) {
    if (proj.zoneId === zoneId && proj.effects.vulnerabilityReduction) {
      vuln = Math.max(0, vuln - proj.effects.vulnerabilityReduction);
    }
  }
  return vuln;
}

function getCascadeResistance(nodeId: string, plan: PlanVersion): number {
  const node = mockNodes.find((n) => n.id === nodeId);
  if (!node) return 0;

  let resistance = 0;
  for (const proj of plan.projects) {
    if ((proj.nodeId === nodeId || proj.zoneId === node.zoneId) && proj.effects.cascadeResistance) {
      resistance += proj.effects.cascadeResistance;
    }
  }
  return clamp(resistance, 0, 0.8);
}

export function isShielded(nodeId: string, plan: PlanVersion): boolean {
  return getReliabilityBuffer(nodeId, plan) >= 0.25;
}

function getReliabilityBuffer(nodeId: string, plan: PlanVersion): number {
  const node = mockNodes.find((n) => n.id === nodeId);
  if (!node) return 0;

  let score = 0;
  for (const proj of plan.projects) {
    if (proj.nodeId === nodeId || proj.zoneId === node.zoneId) {
      if (proj.effects.capacityBoostMW) {
        score += Math.min(0.35, (proj.effects.capacityBoostMW / node.capacityMW) * 0.25);
      }
      if (proj.effects.vulnerabilityReduction) {
        score += proj.effects.vulnerabilityReduction * 0.9;
      }
      if (proj.effects.cascadeResistance) {
        score += proj.effects.cascadeResistance * 0.8;
      }
      if (proj.effects.recoverySpeedBoost) {
        score += proj.effects.recoverySpeedBoost * 0.35;
      }
      if (proj.effects.demandReductionFactor) {
        score += proj.effects.demandReductionFactor * 0.7;
      }
    }
  }
  return clamp(score, 0, 0.85);
}

function getRecoveryChance(nodeId: string, plan: PlanVersion): number {
  const node = mockNodes.find((n) => n.id === nodeId);
  if (!node) return 0.03;

  let base = 0.08;
  for (const proj of plan.projects) {
    if ((proj.nodeId === nodeId || proj.zoneId === node.zoneId) && proj.effects.recoverySpeedBoost) {
      base += proj.effects.recoverySpeedBoost * 0.18;
    }
    if ((proj.nodeId === nodeId || proj.zoneId === node.zoneId) && proj.effects.vulnerabilityReduction) {
      base += proj.effects.vulnerabilityReduction * 0.09;
    }
    if ((proj.nodeId === nodeId || proj.zoneId === node.zoneId) && proj.effects.cascadeResistance) {
      base += proj.effects.cascadeResistance * 0.06;
    }
  }
  return clamp(base, 0, 0.75);
}

// Breadth-first cascade propagation
function cascadeFailure(
  originNodeId: string,
  edges: GridEdge[],
  nodes: GridNode[],
  nodeStatuses: Map<string, 'operational' | 'failed'>,
  t: number,
  eventLog: EventLogEntry[],
  rng: () => number,
  plan: PlanVersion,
  cascadeCounter: { count: number },
): void {
  const queue = [originNodeId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const connectedEdges = edges.filter(
      (e) =>
        e.status === 'operational' &&
        (e.fromNodeId === currentId || e.toNodeId === currentId),
    );

    for (const edge of connectedEdges) {
      const neighborId =
        edge.fromNodeId === currentId ? edge.toNodeId : edge.fromNodeId;
      if (nodeStatuses.get(neighborId) === 'failed') continue;

      const neighbor = nodes.find((n) => n.id === neighborId);
      if (!neighbor) continue;

      // Shielded nodes absorb cascade without failing
      if (isShielded(neighborId, plan)) continue;

      const cascadeResistance = getCascadeResistance(neighborId, plan);
      const neighborVulnerability = getZoneVulnerability(neighbor.zoneId, plan);
      const baseProbability = neighbor.critical ? 0.25 : 0.15;
      const effectiveProbability =
        baseProbability * (0.35 + neighborVulnerability) * (1 - cascadeResistance);

      if (rng() < effectiveProbability) {
        nodeStatuses.set(neighborId, 'failed');
        cascadeCounter.count++;
        eventLog.push({
          timestep: t,
          type: 'CASCADE_FAIL',
          nodeId: neighborId,
          fromNodeId: currentId,
          message: `Cascade failure: ${neighbor.label} failed due to overload from upstream failure`,
          severity: 'critical',
        });
        queue.push(neighborId);
      }
    }
  }
}

// ─── Main simulation ──────────────────────────────────────────────────────────

export function runSimulation(
  plan: PlanVersion,
  scenario: Scenario,
  seed: number,
): SimulationResult {
  const rng = mulberry32(seed);
  const nodes = getEffectiveNodes(plan);
  const edges = getEffectiveEdges(plan);

  const nodeStatuses = new Map<string, 'operational' | 'failed'>();
  nodes.forEach((n) => nodeStatuses.set(n.id, 'operational'));

  const nodeUptimeHours = new Map<string, number>();
  nodes.forEach((n) => nodeUptimeHours.set(n.id, 0));

  const zoneOutageHours = new Map<string, number>();
  mockZones.forEach((z) => zoneOutageHours.set(z.id, 0));

  const nodeStatusHistory: Record<string, ('operational' | 'failed')[]> = {};
  nodes.forEach((n) => { nodeStatusHistory[n.id] = []; });

  const eventLog: EventLogEntry[] = [];
  let peakStressLevel = 0;
  const cascadeCounter = { count: 0 };

  const alreadyWarnedOverload = new Set<string>();
  const failedAtTimestep = new Map<string, number>();

  for (let t = 0; t < scenario.durationHours; t++) {
    const demandMultiplier = scenario.demandCurve[t] ?? 1.0;
    const weatherStress = scenario.weatherStressCurve[t] ?? 0;

    // ── Evaluate each node ──────────────────────────────────────────────────
    for (const node of nodes) {
      if (nodeStatuses.get(node.id) === 'failed') continue;

      const zone = mockZones.find((z) => z.id === node.zoneId)!;
      const baseLoad = getZoneBaseLoad(node.zoneId, plan) * demandMultiplier;

      // Heat sensitivity amplifies cooling load in heat dome scenarios
      const heatAmplifier = scenario.id === 'sc-heat-dome'
        ? 1 + zone.heatSensitivity * weatherStress * 0.6
        : 1.0;
      const zoneLoad = baseLoad * heatAmplifier;

      const vuln = getZoneVulnerability(node.zoneId, plan);
      const reliabilityBuffer = getReliabilityBuffer(node.id, plan);

      // Old infrastructure suffers greater capacity loss during freezes
      const freezeAgeAmplifier = scenario.id === 'sc-freeze'
        ? 1 + zone.infraAgeIndex * 0.4
        : 1.0;
      const effectiveCapacity = node.capacityMW * (1 - weatherStress * 0.4 * vuln * freezeAgeAmplifier);
      const stressRatio = zoneLoad / effectiveCapacity;

      peakStressLevel = Math.max(peakStressLevel, stressRatio);

      // Overload warning at 85% capacity
      const warningThreshold = 0.85 + reliabilityBuffer * 0.08;
      if (stressRatio > warningThreshold && !alreadyWarnedOverload.has(node.id)) {
        alreadyWarnedOverload.add(node.id);
        eventLog.push({
          timestep: t,
          type: 'OVERLOAD_WARNING',
          nodeId: node.id,
          zoneId: node.zoneId,
          message: `${node.label} approaching capacity (${(stressRatio * 100).toFixed(0)}% stressed)`,
          severity: 'warning',
        });
      }

      // Shielded nodes are immune to load-driven and shoulder failures
      if (isShielded(node.id, plan)) {
        if (stressRatio >= 1.0 && !alreadyWarnedOverload.has(`shield-${node.id}`)) {
          alreadyWarnedOverload.add(`shield-${node.id}`);
          eventLog.push({
            timestep: t,
            type: 'ZONE_SHIELDED',
            nodeId: node.id,
            zoneId: node.zoneId,
            message: `${node.label} protected — project investments absorbed overload (stress=${(stressRatio * 100).toFixed(0)}%)`,
            severity: 'info',
          });
        }
        // Skip failure roll — continue to flood risk check below
      } else {
        // Node failure at > 100% capacity, modulated by vulnerability and randomness
        const failureThreshold = 1.0 + rng() * 0.15 + reliabilityBuffer * 0.25;
        const shoulderThreshold = 0.92 + reliabilityBuffer * 0.07;
        const shoulderFailureProbability =
          0.12 * vuln * (1 - reliabilityBuffer) * (1 - reliabilityBuffer * 0.7);
        if (
          stressRatio >= failureThreshold ||
          (stressRatio > shoulderThreshold && rng() < shoulderFailureProbability)
        ) {
          nodeStatuses.set(node.id, 'failed');
          failedAtTimestep.set(node.id, t);

          eventLog.push({
            timestep: t,
            type: 'NODE_FAIL',
            nodeId: node.id,
            zoneId: node.zoneId,
            message: `${node.label} failed — load exceeded capacity (stress=${(stressRatio * 100).toFixed(0)}%)`,
            severity: 'critical',
          });

          // Cascade propagation
          cascadeFailure(node.id, edges, nodes, nodeStatuses, t, eventLog, rng, plan, cascadeCounter);
        }
      }

      // Flood damage: discrete failure during storm stress peaks — shielded zones are immune
      if (
        scenario.id === 'sc-freeze' &&
        weatherStress > 0.5 &&
        nodeStatuses.get(node.id) === 'operational' &&
        !isShielded(node.id, plan)
      ) {
        const floodProb = zone.floodRisk * (weatherStress - 0.5) * 2;
        if (rng() < floodProb) {
          nodeStatuses.set(node.id, 'failed');
          failedAtTimestep.set(node.id, t);
          eventLog.push({
            timestep: t,
            type: 'FLOOD_DAMAGE',
            nodeId: node.id,
            zoneId: node.zoneId,
            message: `${node.label} damaged by flooding — storm stress exceeded drainage capacity`,
            severity: 'critical',
          });
          cascadeFailure(node.id, edges, nodes, nodeStatuses, t, eventLog, rng, plan, cascadeCounter);
        }
      }
    }

    // ── Recovery attempt ────────────────────────────────────────────────────
    for (const node of nodes) {
      if (nodeStatuses.get(node.id) !== 'failed') continue;

      const failedAt = failedAtTimestep.get(node.id) ?? t;
      const hoursFailed = t - failedAt;

      // Recovery possible only after minimum 2 hours down
      if (hoursFailed >= 2) {
        const recoveryChance = getRecoveryChance(node.id, plan);
        if (rng() < recoveryChance) {
          nodeStatuses.set(node.id, 'operational');
          failedAtTimestep.delete(node.id);

          eventLog.push({
            timestep: t,
            type: 'NODE_RECOVER',
            nodeId: node.id,
            zoneId: node.zoneId,
            message: `${node.label} restored after ${hoursFailed}h outage`,
            severity: 'info',
          });
        }
      }
    }

    // ── Track uptime / outage ───────────────────────────────────────────────
    const zoneFailed = new Map<string, boolean>();
    for (const node of nodes) {
      const status = nodeStatuses.get(node.id) as 'operational' | 'failed';
      nodeStatusHistory[node.id].push(status);

      if (status === 'operational') {
        nodeUptimeHours.set(node.id, (nodeUptimeHours.get(node.id) ?? 0) + 1);
      } else {
        zoneFailed.set(node.zoneId, true);
      }
    }

    // Zone-level outage: any failed node contributes to zone outage
    for (const [zoneId, failed] of zoneFailed) {
      if (failed) {
        zoneOutageHours.set(zoneId, (zoneOutageHours.get(zoneId) ?? 0) + 1);
      }
    }
  }

  // ── Compute metrics ─────────────────────────────────────────────────────────
  const totalPossibleUptime = nodes.length * scenario.durationHours;
  const actualUptime = Array.from(nodeUptimeHours.values()).reduce((s, v) => s + v, 0);
  const stabilityScore = clamp(actualUptime / totalPossibleUptime, 0, 1);

  // Equity: Pearson correlation between outage hours and inverse income
  const zones = mockZones;
  const outages = zones.map((z) => zoneOutageHours.get(z.id) ?? 0);
  const invIncomes = zones.map((z) => 1 / z.medianIncome);
  const corr = pearsonCorrelation(outages, invIncomes);
  // positive corr = low-income zones have more outages = less equitable
  const equityScore = clamp(1 - Math.max(0, corr), 0, 1);

  const totalCapexUSD = plan.projects.reduce((s, p) => s + p.capexUSD, 0);
  const totalOutageHours = Array.from(zoneOutageHours.values()).reduce((s, v) => s + v, 0);
  // Cost efficiency: stability gain per $100M spent
  const costEfficiency =
    totalCapexUSD > 0
      ? clamp((stabilityScore * 100) / (totalCapexUSD / 1_000_000), 0, 10)
      : stabilityScore * 10;

  const nodesFailedCount = nodes.filter(
    (n) => nodeStatusHistory[n.id].some((s) => s === 'failed'),
  ).length;

  return {
    id: generateRunId(plan.id, scenario.id, seed),
    planVersionId: plan.id,
    scenarioId: scenario.id,
    seed,
    metrics: {
      stabilityScore,
      equityScore,
      costEfficiency,
      totalOutageHours,
      peakStressLevel: clamp(peakStressLevel, 0, 2),
      nodesFailedCount,
      cascadeCount: cascadeCounter.count,
    },
    outageByZone: Object.fromEntries(zoneOutageHours),
    nodeStatusHistory,
    eventLog,
    createdAt: new Date().toISOString(),
  };
}

// ─── Compare two results ──────────────────────────────────────────────────────

export function compareResults(
  base: SimulationResult,
  alt: SimulationResult,
): ComparisonDelta {
  const outageByZoneDelta: Record<string, number> = {};
  const improvedZones: string[] = [];
  const worsenedZones: string[] = [];

  const allZoneIds = new Set([
    ...Object.keys(base.outageByZone),
    ...Object.keys(alt.outageByZone),
  ]);

  for (const zoneId of allZoneIds) {
    const baseHours = base.outageByZone[zoneId] ?? 0;
    const altHours = alt.outageByZone[zoneId] ?? 0;
    const delta = altHours - baseHours;
    outageByZoneDelta[zoneId] = delta;
    if (delta < -0.5) improvedZones.push(zoneId);
    else if (delta > 0.5) worsenedZones.push(zoneId);
  }

  return {
    baseResultId: base.id,
    altResultId: alt.id,
    metricDeltas: {
      stabilityScore: alt.metrics.stabilityScore - base.metrics.stabilityScore,
      equityScore: alt.metrics.equityScore - base.metrics.equityScore,
      costEfficiency: alt.metrics.costEfficiency - base.metrics.costEfficiency,
      totalOutageHours: alt.metrics.totalOutageHours - base.metrics.totalOutageHours,
    },
    outageByZoneDelta,
    improvedZones,
    worsenedZones,
  };
}

// ─── Export snapshot ──────────────────────────────────────────────────────────

export function exportSnapshot(
  plan: PlanVersion,
  scenario: Scenario,
  result: SimulationResult,
  delta?: ComparisonDelta,
): FilingSnapshot {
  const snapshotId = `snap_${Date.now().toString(36)}_${result.id}`;
  return {
    snapshotId,
    generatedAt: new Date().toISOString(),
    planVersion: plan,
    scenario,
    result,
    delta,
    auditTrail: {
      runId: result.id,
      seed: result.seed,
      planVersionId: result.planVersionId,
      scenarioId: result.scenarioId,
      toolVersion: 'afterthought-0.1.0',
    },
  };
}

// ─── Helpers for UI ───────────────────────────────────────────────────────────

export function getZoneById(id: string): Zone | undefined {
  return mockZones.find((z) => z.id === id);
}

export function getZoneUtilityResilience(zoneId: string, plan: PlanVersion): number {
  let boost = 0;
  for (const proj of plan.projects) {
    if (proj.zoneId === zoneId && proj.effects.utilityResilienceBoost) {
      boost += proj.effects.utilityResilienceBoost;
    }
  }
  return clamp(boost, 0, 1);
}

export function getTotalCapex(plan: PlanVersion): number {
  return plan.projects.reduce((s, p) => s + p.capexUSD, 0);
}

export function getBudgetRemaining(plan: PlanVersion): number {
  return plan.assumptions.budgetCapUSD - getTotalCapex(plan);
}
