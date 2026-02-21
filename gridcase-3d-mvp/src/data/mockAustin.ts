import { Zone, GridNode, GridEdge, Project, Scenario, Assumptions } from '../types/grid';

// ─── Zones (Austin-like neighborhoods in grid-unit space) ─────────────────────
// Coordinate system: X = east-west, Z = north-south, Y = height (up)
// polygon2D uses [x, z] pairs for ground-plane footprint
export const mockZones: Zone[] = [
  {
    id: 'z-downtown',
    name: 'Downtown',
    polygon2D: [[-2.5, -1.5], [2.5, -1.5], [2.5, 1.5], [-2.5, 1.5]],
    population: 42000,
    medianIncome: 78000,
    infraAgeIndex: 0.65,
    baseLoadMW: 85,
    vulnerability: 0.35,
    heatSensitivity: 0.55,
    floodRisk: 0.20,
  },
  {
    id: 'z-east',
    name: 'East Austin',
    polygon2D: [[2.5, -2], [6.5, -2], [6.5, 2], [2.5, 2]],
    population: 55000,
    medianIncome: 52000,
    infraAgeIndex: 0.78,
    baseLoadMW: 70,
    vulnerability: 0.62,
    heatSensitivity: 0.70,
    floodRisk: 0.55,
  },
  {
    id: 'z-south',
    name: 'South Congress',
    polygon2D: [[-2.5, -4.5], [2.5, -4.5], [2.5, -1.5], [-2.5, -1.5]],
    population: 38000,
    medianIncome: 68000,
    infraAgeIndex: 0.55,
    baseLoadMW: 60,
    vulnerability: 0.30,
    heatSensitivity: 0.60,
    floodRisk: 0.30,
  },
  {
    id: 'z-north',
    name: 'North Loop',
    polygon2D: [[-2.5, 1.5], [2.5, 1.5], [2.5, 4.5], [-2.5, 4.5]],
    population: 47000,
    medianIncome: 61000,
    infraAgeIndex: 0.60,
    baseLoadMW: 65,
    vulnerability: 0.40,
    heatSensitivity: 0.75,
    floodRisk: 0.25,
  },
  {
    id: 'z-westlake',
    name: 'Westlake',
    polygon2D: [[-8, -2], [-4.5, -2], [-4.5, 2], [-8, 2]],
    population: 28000,
    medianIncome: 120000,
    infraAgeIndex: 0.35,
    baseLoadMW: 75,
    vulnerability: 0.18,
    heatSensitivity: 0.45,
    floodRisk: 0.15,
  },
  {
    id: 'z-mueller',
    name: 'Mueller',
    polygon2D: [[2.5, 2], [6.5, 2], [6.5, 5.5], [2.5, 5.5]],
    population: 33000,
    medianIncome: 72000,
    infraAgeIndex: 0.30,
    baseLoadMW: 45,
    vulnerability: 0.22,
    heatSensitivity: 0.65,
    floodRisk: 0.50,
  },
  {
    id: 'z-hyde-park',
    name: 'Hyde Park',
    polygon2D: [[-2.5, 4.5], [2.5, 4.5], [2.5, 7.5], [-2.5, 7.5]],
    population: 29000,
    medianIncome: 85000,
    infraAgeIndex: 0.70,
    baseLoadMW: 40,
    vulnerability: 0.28,
    heatSensitivity: 0.72,
    floodRisk: 0.20,
  },
  {
    id: 'z-rundberg',
    name: 'Rundberg',
    polygon2D: [[-2.5, -10.5], [2.5, -10.5], [2.5, -7.5], [-2.5, -7.5]],
    population: 41000,
    medianIncome: 38000,
    infraAgeIndex: 0.85,
    baseLoadMW: 55,
    vulnerability: 0.82,
    heatSensitivity: 0.82,
    floodRisk: 0.45,
  },
  {
    id: 'z-montopolis',
    name: 'Montopolis',
    polygon2D: [[2.5, -5.5], [6.5, -5.5], [6.5, -2], [2.5, -2]],
    population: 31000,
    medianIncome: 41000,
    infraAgeIndex: 0.80,
    baseLoadMW: 48,
    vulnerability: 0.75,
    heatSensitivity: 0.78,
    floodRisk: 0.60,
  },
  {
    id: 'z-buda',
    name: 'Buda / Kyle',
    polygon2D: [[-2.5, -7.5], [2.5, -7.5], [2.5, -4.5], [-2.5, -4.5]],
    population: 52000,
    medianIncome: 58000,
    infraAgeIndex: 0.40,
    baseLoadMW: 72,
    vulnerability: 0.35,
    heatSensitivity: 0.68,
    floodRisk: 0.35,
  },
  {
    id: 'z-cedar-park',
    name: 'Cedar Park',
    polygon2D: [[-8, 2], [-4.5, 2], [-4.5, 5.5], [-8, 5.5]],
    population: 44000,
    medianIncome: 88000,
    infraAgeIndex: 0.32,
    baseLoadMW: 58,
    vulnerability: 0.20,
    heatSensitivity: 0.55,
    floodRisk: 0.18,
  },
  {
    id: 'z-pflugerville',
    name: 'Pflugerville',
    polygon2D: [[6.5, 2], [10.5, 2], [10.5, 5.5], [6.5, 5.5]],
    population: 60000,
    medianIncome: 64000,
    infraAgeIndex: 0.45,
    baseLoadMW: 80,
    vulnerability: 0.42,
    heatSensitivity: 0.70,
    floodRisk: 0.38,
  },
  {
    id: 'z-manor',
    name: 'Manor',
    polygon2D: [[6.5, -2], [10.5, -2], [10.5, 2], [6.5, 2]],
    population: 24000,
    medianIncome: 45000,
    infraAgeIndex: 0.72,
    baseLoadMW: 36,
    vulnerability: 0.65,
    heatSensitivity: 0.65,
    floodRisk: 0.42,
  },
  {
    id: 'z-bee-cave',
    name: 'Bee Cave',
    polygon2D: [[-8, -5.5], [-4.5, -5.5], [-4.5, -2], [-8, -2]],
    population: 20000,
    medianIncome: 135000,
    infraAgeIndex: 0.28,
    baseLoadMW: 55,
    vulnerability: 0.15,
    heatSensitivity: 0.48,
    floodRisk: 0.22,
  },
  {
    id: 'z-sunset-valley',
    name: 'Sunset Valley',
    polygon2D: [[-5.5, -7.5], [-2.5, -7.5], [-2.5, -4.5], [-5.5, -4.5]],
    population: 18000,
    medianIncome: 95000,
    infraAgeIndex: 0.42,
    baseLoadMW: 30,
    vulnerability: 0.22,
    heatSensitivity: 0.52,
    floodRisk: 0.20,
  },
];

// ─── Grid Nodes (substations) ─────────────────────────────────────────────────
export const mockNodes: GridNode[] = [
  {
    id: 'n-downtown-core',
    label: 'Downtown Core',
    zoneId: 'z-downtown',
    position: [0, 0.5, 0],
    capacityMW: 150,
    critical: true,
    status: 'operational',
  },
  {
    id: 'n-east-sub',
    label: 'East Substation',
    zoneId: 'z-east',
    position: [4.5, 0.5, 0],
    capacityMW: 90,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-south-sub',
    label: 'South Congress Sub',
    zoneId: 'z-south',
    position: [0, 0.5, -3],
    capacityMW: 80,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-north-sub',
    label: 'North Loop Sub',
    zoneId: 'z-north',
    position: [0, 0.5, 3],
    capacityMW: 85,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-westlake-sub',
    label: 'Westlake Sub',
    zoneId: 'z-westlake',
    position: [-6, 0.5, 0],
    capacityMW: 110,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-mueller-sub',
    label: 'Mueller Sub',
    zoneId: 'z-mueller',
    position: [4.5, 0.5, 3.8],
    capacityMW: 70,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-hyde-park-sub',
    label: 'Hyde Park Sub',
    zoneId: 'z-hyde-park',
    position: [0, 0.5, 6],
    capacityMW: 60,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-rundberg-sub',
    label: 'Rundberg Sub',
    zoneId: 'z-rundberg',
    position: [0, 0.5, -9],
    capacityMW: 55,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-montopolis-sub',
    label: 'Montopolis Sub',
    zoneId: 'z-montopolis',
    position: [4.5, 0.5, -3.8],
    capacityMW: 60,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-buda-sub',
    label: 'Buda Sub',
    zoneId: 'z-buda',
    position: [0, 0.5, -6],
    capacityMW: 90,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-cedar-park-sub',
    label: 'Cedar Park Sub',
    zoneId: 'z-cedar-park',
    position: [-6, 0.5, 3.8],
    capacityMW: 80,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-pflugerville-sub',
    label: 'Pflugerville Sub',
    zoneId: 'z-pflugerville',
    position: [8.5, 0.5, 3.8],
    capacityMW: 100,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-manor-sub',
    label: 'Manor Sub',
    zoneId: 'z-manor',
    position: [8.5, 0.5, 0],
    capacityMW: 55,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-bee-cave-sub',
    label: 'Bee Cave Sub',
    zoneId: 'z-bee-cave',
    position: [-6, 0.5, -3.8],
    capacityMW: 75,
    critical: false,
    status: 'operational',
  },
  {
    id: 'n-sunset-valley-sub',
    label: 'Sunset Valley Sub',
    zoneId: 'z-sunset-valley',
    position: [-4.0, 0.5, -6.0],
    capacityMW: 45,
    critical: false,
    status: 'operational',
  },
];

// ─── Grid Edges ───────────────────────────────────────────────────────────────
export const mockEdges: GridEdge[] = [
  { id: 'e-01', fromNodeId: 'n-downtown-core', toNodeId: 'n-east-sub',         maxFlowMW: 120, status: 'operational' },
  { id: 'e-02', fromNodeId: 'n-downtown-core', toNodeId: 'n-south-sub',        maxFlowMW: 100, status: 'operational' },
  { id: 'e-03', fromNodeId: 'n-downtown-core', toNodeId: 'n-north-sub',        maxFlowMW: 100, status: 'operational' },
  { id: 'e-04', fromNodeId: 'n-downtown-core', toNodeId: 'n-westlake-sub',     maxFlowMW: 130, status: 'operational' },
  { id: 'e-05', fromNodeId: 'n-east-sub',      toNodeId: 'n-mueller-sub',      maxFlowMW: 80,  status: 'operational' },
  { id: 'e-06', fromNodeId: 'n-east-sub',      toNodeId: 'n-montopolis-sub',   maxFlowMW: 70,  status: 'operational' },
  { id: 'e-07', fromNodeId: 'n-east-sub',      toNodeId: 'n-manor-sub',        maxFlowMW: 60,  status: 'operational' },
  { id: 'e-08', fromNodeId: 'n-north-sub',     toNodeId: 'n-hyde-park-sub',    maxFlowMW: 75,  status: 'operational' },
  { id: 'e-09', fromNodeId: 'n-north-sub',     toNodeId: 'n-mueller-sub',      maxFlowMW: 70,  status: 'operational' },
  { id: 'e-10', fromNodeId: 'n-hyde-park-sub', toNodeId: 'n-rundberg-sub',     maxFlowMW: 60,  status: 'operational' },
  { id: 'e-11', fromNodeId: 'n-hyde-park-sub', toNodeId: 'n-cedar-park-sub',   maxFlowMW: 65,  status: 'operational' },
  { id: 'e-12', fromNodeId: 'n-cedar-park-sub',toNodeId: 'n-westlake-sub',     maxFlowMW: 85,  status: 'operational' },
  { id: 'e-13', fromNodeId: 'n-westlake-sub',  toNodeId: 'n-bee-cave-sub',     maxFlowMW: 80,  status: 'operational' },
  { id: 'e-14', fromNodeId: 'n-south-sub',     toNodeId: 'n-buda-sub',         maxFlowMW: 90,  status: 'operational' },
  { id: 'e-15', fromNodeId: 'n-south-sub',     toNodeId: 'n-montopolis-sub',   maxFlowMW: 65,  status: 'operational' },
  { id: 'e-16', fromNodeId: 'n-mueller-sub',   toNodeId: 'n-pflugerville-sub', maxFlowMW: 90,  status: 'operational' },
  { id: 'e-17', fromNodeId: 'n-manor-sub',     toNodeId: 'n-pflugerville-sub', maxFlowMW: 75,  status: 'operational' },
  { id: 'e-18', fromNodeId: 'n-montopolis-sub',toNodeId: 'n-buda-sub',         maxFlowMW: 55,  status: 'operational' },
  { id: 'e-19', fromNodeId: 'n-bee-cave-sub',  toNodeId: 'n-south-sub',        maxFlowMW: 60,  status: 'operational' },
  { id: 'e-20', fromNodeId: 'n-rundberg-sub',  toNodeId: 'n-pflugerville-sub', maxFlowMW: 50,  status: 'operational' },
  { id: 'e-21', fromNodeId: 'n-bee-cave-sub',  toNodeId: 'n-sunset-valley-sub', maxFlowMW: 40, status: 'operational' },
];

// ─── Project Catalog ──────────────────────────────────────────────────────────
export const mockProjectCatalog: Project[] = [
  {
    id: 'p-dt-upgrade',
    name: 'Downtown Substation Upgrade',
    type: 'substation_upgrade',
    zoneId: 'z-downtown',
    nodeId: 'n-downtown-core',
    capexUSD: 45_000_000,
    effects: { capacityBoostMW: 60, cascadeResistance: 0.3 },
    description: 'Expand transformer capacity and add redundant switching at downtown core hub.',
  },
  {
    id: 'p-east-solar',
    name: 'East Austin Solar Farm',
    type: 'solar_farm',
    zoneId: 'z-east',
    nodeId: 'n-east-sub',
    capexUSD: 28_000_000,
    effects: { capacityBoostMW: 35, vulnerabilityReduction: 0.15 },
    description: '20 MW AC solar array with local injection at East Substation.',
  },
  {
    id: 'p-mont-battery',
    name: 'Montopolis Battery Storage',
    type: 'battery_storage',
    zoneId: 'z-montopolis',
    nodeId: 'n-montopolis-sub',
    capexUSD: 22_000_000,
    effects: { capacityBoostMW: 25, recoverySpeedBoost: 0.4, vulnerabilityReduction: 0.2 },
    description: '4-hour 25 MW battery system to buffer outages in this high-vulnerability corridor.',
  },
  {
    id: 'p-rund-hardening',
    name: 'Rundberg Grid Hardening',
    type: 'grid_hardening',
    zoneId: 'z-rundberg',
    nodeId: 'n-rundberg-sub',
    capexUSD: 18_000_000,
    effects: { capacityBoostMW: 20, cascadeResistance: 0.45, vulnerabilityReduction: 0.30 },
    description: 'Reconductoring aging feeders and adding sectionalizing switches in the Rundberg corridor.',
  },
  {
    id: 'p-mueller-ev',
    name: 'Mueller EV Smart Charging Hub',
    type: 'ev_charging',
    zoneId: 'z-mueller',
    nodeId: 'n-mueller-sub',
    capexUSD: 12_000_000,
    effects: { demandReductionFactor: 0.08, capacityBoostMW: 10 },
    description: 'Managed EV charging with V2G capability to shift load during peak stress.',
  },
  {
    id: 'p-west-cable',
    name: 'Westlake Underground Cable',
    type: 'underground_cable',
    zoneId: 'z-westlake',
    nodeId: 'n-westlake-sub',
    capexUSD: 35_000_000,
    effects: { capacityBoostMW: 30, cascadeResistance: 0.5, vulnerabilityReduction: 0.12 },
    description: 'Replace overhead transmission with underground cable to eliminate weather-related outages.',
  },
  {
    id: 'p-east-smart',
    name: 'East Austin Smart Meters',
    type: 'smart_meter',
    zoneId: 'z-east',
    capexUSD: 8_000_000,
    effects: { demandReductionFactor: 0.12 },
    description: 'Advanced metering infrastructure with demand-response automation for 18,000 customers.',
  },
  {
    id: 'p-manor-tx',
    name: 'Manor–Pflugerville Transmission',
    type: 'transmission_upgrade',
    zoneId: 'z-manor',
    nodeId: 'n-manor-sub',
    capexUSD: 30_000_000,
    effects: { capacityBoostMW: 45, cascadeResistance: 0.2 },
    description: 'Upgrade 138 kV line to 345 kV between Manor and Pflugerville to relieve eastern congestion.',
  },
  {
    id: 'p-mont-microgrid',
    name: 'Montopolis Community Microgrid',
    type: 'community_microgrid',
    zoneId: 'z-montopolis',
    capexUSD: 16_000_000,
    effects: { capacityBoostMW: 15, vulnerabilityReduction: 0.35, recoverySpeedBoost: 0.5, cascadeResistance: 0.25 },
    description: 'Islanding-capable microgrid serving 3,200 low-income households with 72-hour backup.',
  },
  {
    id: 'p-buda-solar-storage',
    name: 'Buda Solar + Storage Campus',
    type: 'solar_storage',
    zoneId: 'z-buda',
    nodeId: 'n-buda-sub',
    capexUSD: 40_000_000,
    effects: { capacityBoostMW: 50, vulnerabilityReduction: 0.18, cascadeResistance: 0.15 },
    description: '30 MW solar paired with 6-hour battery storage to support southern growth corridor.',
  },
  {
    id: 'p-cedar-upgrade',
    name: 'Cedar Park Substation Upgrade',
    type: 'substation_upgrade',
    zoneId: 'z-cedar-park',
    nodeId: 'n-cedar-park-sub',
    capexUSD: 25_000_000,
    effects: { capacityBoostMW: 30, cascadeResistance: 0.2 },
    description: 'Add second transformer bank at Cedar Park to eliminate N-1 vulnerability.',
  },
  {
    id: 'p-pflug-solar',
    name: 'Pflugerville Solar Farm',
    type: 'solar_farm',
    zoneId: 'z-pflugerville',
    nodeId: 'n-pflugerville-sub',
    capexUSD: 32_000_000,
    effects: { capacityBoostMW: 40, vulnerabilityReduction: 0.12 },
    description: '25 MW AC solar farm on I-130 corridor to serve fast-growing northeast load.',
  },
  {
    id: 'p-north-loop-upgrade',
    name: 'North Loop Reliability Upgrade',
    type: 'substation_upgrade',
    zoneId: 'z-north',
    nodeId: 'n-north-sub',
    capexUSD: 24_000_000,
    effects: { capacityBoostMW: 55, cascadeResistance: 0.35, vulnerabilityReduction: 0.20 },
    description: 'Adds transformer redundancy and sectionalized feeders at North Loop to absorb evening peak volatility.',
  },
  {
    id: 'p-south-hardening',
    name: 'South Congress Grid Hardening',
    type: 'grid_hardening',
    zoneId: 'z-south',
    nodeId: 'n-south-sub',
    capexUSD: 21_000_000,
    effects: { capacityBoostMW: 40, cascadeResistance: 0.35, vulnerabilityReduction: 0.18 },
    description: 'Rebuilds stressed feeders and protection relays in South Congress to reduce overload-triggered trips.',
  },
  {
    id: 'p-hyde-underground',
    name: 'Hyde Park Underground Feeder',
    type: 'underground_cable',
    zoneId: 'z-hyde-park',
    nodeId: 'n-hyde-park-sub',
    capexUSD: 19_000_000,
    effects: { capacityBoostMW: 30, cascadeResistance: 0.40, vulnerabilityReduction: 0.15 },
    description: 'Undergrounds the Hyde Park feeder ring to increase local resilience and cut weather-driven interruptions.',
  },
  {
    id: 'p-bee-cave-upgrade',
    name: 'Bee Cave Reliability Link',
    type: 'transmission_upgrade',
    zoneId: 'z-bee-cave',
    nodeId: 'n-bee-cave-sub',
    capexUSD: 22_000_000,
    effects: { capacityBoostMW: 35, cascadeResistance: 0.30, vulnerabilityReduction: 0.10, demandReductionFactor: 0.06 },
    description: 'Upgrades Bee Cave tie-line capacity and local controls to prevent edge-of-capacity operation during peaks.',
  },
  {
    id: 'p-rundberg-storage',
    name: 'Rundberg Storage & Reclose Hub',
    type: 'battery_storage',
    zoneId: 'z-rundberg',
    nodeId: 'n-rundberg-sub',
    capexUSD: 27_000_000,
    effects: { capacityBoostMW: 65, vulnerabilityReduction: 0.25, cascadeResistance: 0.35, recoverySpeedBoost: 0.8, demandReductionFactor: 0.10 },
    description: 'Adds a local battery-reserve block with fast fault isolation and auto-reclose to stop repeated Rundberg trips.',
  },
  {
    id: 'p-pflug-hardening',
    name: 'Pflugerville Feeder Hardening',
    type: 'grid_hardening',
    zoneId: 'z-pflugerville',
    nodeId: 'n-pflugerville-sub',
    capexUSD: 20_000_000,
    effects: { capacityBoostMW: 25, vulnerabilityReduction: 0.15, cascadeResistance: 0.30, recoverySpeedBoost: 0.2 },
    description: 'Reinforces Pflugerville feeder protection to prevent inherited failures from upstream cascade conditions.',
  },

  // ── Utility resilience projects ─────────────────────────────────────────────
  {
    id: 'p-east-water-backup',
    name: 'East Austin Water Pump Backup',
    type: 'water_infrastructure',
    zoneId: 'z-east',
    capexUSD: 14_000_000,
    effects: { utilityResilienceBoost: 0.55 },
    description: 'Backup battery + diesel generators at East Austin water pumping stations to maintain pressure during multi-hour grid outages.',
  },
  {
    id: 'p-rund-emergency-hub',
    name: 'Rundberg Emergency Utility Hub',
    type: 'emergency_services',
    zoneId: 'z-rundberg',
    capexUSD: 20_000_000,
    effects: { utilityResilienceBoost: 0.75, recoverySpeedBoost: 0.3 },
    description: 'Combined backup power, water, and emergency shelter serving 8,000 residents in the Rundberg corridor.',
  },
  {
    id: 'p-mont-district-hvac',
    name: 'Montopolis District HVAC',
    type: 'district_hvac',
    zoneId: 'z-montopolis',
    capexUSD: 18_000_000,
    effects: { utilityResilienceBoost: 0.60 },
    description: 'Shared district heating and cooling plant with 72-hour backup generation protecting vulnerable residents from heat and freeze events.',
  },
  {
    id: 'p-dt-smart-water',
    name: 'Downtown Smart Water Grid',
    type: 'water_infrastructure',
    zoneId: 'z-downtown',
    capexUSD: 10_000_000,
    effects: { utilityResilienceBoost: 0.45 },
    description: 'Automated pressure management and backup pumping to maintain water service through multi-hour outages in the urban core.',
  },
  {
    id: 'p-north-cooling-hub',
    name: 'North Loop Community Cooling Hub',
    type: 'district_hvac',
    zoneId: 'z-north',
    capexUSD: 15_000_000,
    effects: { utilityResilienceBoost: 0.50 },
    description: 'District cooling center with backup power serving elderly and heat-vulnerable residents in North Loop during summer emergencies.',
  },
  {
    id: 'p-manor-water-backup',
    name: 'Manor Water Resilience System',
    type: 'water_infrastructure',
    zoneId: 'z-manor',
    capexUSD: 9_000_000,
    effects: { utilityResilienceBoost: 0.50 },
    description: 'Elevated storage tanks and backup pumps to maintain water pressure in Manor during extended grid outages.',
  },
];

// ─── Scenarios ────────────────────────────────────────────────────────────────
function buildDemandCurve(
  hours: number,
  shape: 'freeze-6mo' | 'heat-6mo' | 'ev-6mo',
): number[] {
  return Array.from({ length: hours }, (_, h) => {
    if (shape === 'freeze-6mo') {
      // 180-day winter season: high base demand, morning/evening heating peaks,
      // demand spikes during 3-day ice storm cycles (every 18 days throughout).
      const day = Math.floor(h / 24);
      const hour = h % 24;
      const progress = h / Math.max(hours - 1, 1);
      const base = 1.45 + 0.30 * Math.sin(progress * Math.PI);
      const morning = (hour >= 6 && hour <= 9) ? 0.14 + (hour - 6) * 0.04 : 0;
      const evening = (hour >= 17 && hour <= 21) ? 0.12 + (hour - 17) * 0.03 : 0;
      const night = (hour >= 0 && hour <= 5) ? -0.08 : 0;
      const freezeBoost = (day % 18) < 3 ? 0.22 : 0;
      const weekday = (day % 7 === 0 || day % 7 === 6) ? -0.03 : 0.02;
      return Math.min(2.0, Math.max(0.90, base + morning + evening + night + freezeBoost + weekday));
    }
    if (shape === 'heat-6mo') {
      // 180-day summer season: growing afternoon cooling load, demand spikes
      // during 5-day heat dome episodes (every 22 days throughout).
      const day = Math.floor(h / 24);
      const hour = h % 24;
      const progress = h / Math.max(hours - 1, 1);
      const base = 1.10 + 0.45 * Math.sin(progress * Math.PI);
      const afternoon = (hour >= 12 && hour <= 18)
        ? 0.10 + ((hour === 15 || hour === 16) ? 0.08 : 0) : 0;
      const evening = (hour >= 18 && hour <= 21) ? 0.08 : 0;
      const night = (hour >= 0 && hour <= 5) ? -0.06 : 0;
      const heatBoost = (day % 22) < 5 ? 0.25 : 0;
      const weekday = (day % 7 === 0 || day % 7 === 6) ? -0.04 : 0.02;
      return Math.min(1.95, Math.max(0.75, base + afternoon + evening + night + heatBoost + weekday));
    }
    // ev-6mo: evening charging demand grows linearly across the 180 days
    // as fleet penetration increases — peaks in final weeks.
    const day = Math.floor(h / 24);
    const hour = h % 24;
    const progress = h / Math.max(hours - 1, 1);
    const evGrowth = 1 + progress * 0.55;
    const evening = (hour >= 17 && hour <= 21) ? (0.28 + (hour - 17) * 0.06) * evGrowth : 0;
    const weekendBoost = (day % 7 === 0 || day % 7 === 6) ? 0.04 : 0;
    return Math.min(1.80, 1.05 + evening + weekendBoost);
  });
}

function buildStressCurve(
  hours: number,
  shape: 'freeze-6mo' | 'heat-6mo' | 'ev-6mo',
): number[] {
  return Array.from({ length: hours }, (_, h) => {
    if (shape === 'freeze-6mo') {
      // Seasonal cold arc peaks mid-winter; guaranteed ice storm every 18 days
      // (3-day window) plus pseudo-random secondary spikes — no activation delay.
      const day = Math.floor(h / 24);
      const hour = h % 24;
      const progress = h / Math.max(hours - 1, 1);
      const seasonalCold = 0.22 + 0.30 * Math.sin(progress * Math.PI);
      const diurnal = (hour >= 2 && hour <= 6) ? 0.06 : (hour >= 14 && hour <= 17) ? -0.04 : 0.01;
      const cyclePulse = (day % 18) < 3 ? 0.28 + seasonalCold * 0.20 : 0;
      const sig = Math.abs(Math.sin((day + 3) * 11.2137) * 41293.8) % 1;
      const randPulse = sig > 0.91 ? 0.14 + (sig - 0.91) * 1.8 : 0;
      return Math.min(0.92, seasonalCold + diurnal + cyclePulse + randPulse);
    }
    if (shape === 'heat-6mo') {
      // Spring-to-summer seasonal arc; heat dome episode every 22 days (5-day window);
      // diurnal afternoon peak; random supplemental events — no activation delay.
      const day = Math.floor(h / 24);
      const hour = h % 24;
      const progress = h / Math.max(hours - 1, 1);
      const seasonalHeat = 0.10 + 0.35 * Math.sin(progress * Math.PI);
      const diurnal = (hour >= 11 && hour <= 17) ? 0.12 : (hour >= 20 || hour <= 5) ? -0.03 : 0.02;
      const cyclePulse = (day % 22) < 5 ? 0.22 + seasonalHeat * 0.35 : 0;
      const sig = Math.abs(Math.sin((day + 7) * 8.7419) * 33847.2) % 1;
      const randPulse = sig > 0.93 ? 0.10 : 0;
      return Math.min(0.88, seasonalHeat + diurnal + cyclePulse + randPulse);
    }
    // ev-6mo: low weather stress throughout; slight mid-season uptick
    const progress = h / Math.max(hours - 1, 1);
    return 0.08 + 0.10 * Math.sin(progress * Math.PI);
  });
}

export const mockScenarios: Scenario[] = [
  {
    id: 'sc-freeze',
    name: 'Winter Freeze',
    description: '180-day winter planning horizon with periodic Arctic freeze cycles every 18 days. Ice accumulation stresses aging infrastructure, with cascading failures distributed throughout the season.',
    durationHours: 4320,
    demandCurve: buildDemandCurve(4320, 'freeze-6mo'),
    weatherStressCurve: buildStressCurve(4320, 'freeze-6mo'),
    color: '#60a5fa',
  },
  {
    id: 'sc-heat-dome',
    name: 'Summer Heat Dome',
    description: '180-day summer planning horizon with recurring heat dome episodes every 22 days. Afternoon cooling loads spike across the season as temperatures build toward peak summer.',
    durationHours: 4320,
    demandCurve: buildDemandCurve(4320, 'heat-6mo'),
    weatherStressCurve: buildStressCurve(4320, 'heat-6mo'),
    color: '#f97316',
  },
  {
    id: 'sc-ev-spike',
    name: 'EV Adoption Surge',
    description: '180-day rapid-adoption horizon. Evening charging demand grows steadily across the season as fleet penetration rises, stressing residential feeders by month 4–6.',
    durationHours: 4320,
    demandCurve: buildDemandCurve(4320, 'ev-6mo'),
    weatherStressCurve: buildStressCurve(4320, 'ev-6mo'),
    color: '#a78bfa',
  },
];

// ─── Default Assumptions ──────────────────────────────────────────────────────
export const defaultAssumptions: Assumptions = {
  evAdoptionRate: 0.15,
  populationGrowthRate: 3.2,
  renewableTarget: 0.30,
  budgetCapUSD: 150_000_000,
};

export const regulatorAssumptions: Assumptions = {
  evAdoptionRate: 0.35,
  populationGrowthRate: 4.0,
  renewableTarget: 0.50,
  budgetCapUSD: 200_000_000,
};

export const advocateAssumptions: Assumptions = {
  evAdoptionRate: 0.25,
  populationGrowthRate: 3.5,
  renewableTarget: 0.60,
  budgetCapUSD: 250_000_000,
};
