import { useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Zone, GridNode, GridEdge, Project } from '../types/grid';
import { mockZones, mockNodes, mockEdges } from '../data/mockAustin';
import { isShielded, getZoneUtilityResilience } from '../sim/engine';
import { usePlanStore } from '../stores/planStore';
import { useSimulationStore } from '../stores/simulationStore';
import LayerLegend from './LayerLegend';

// ─── Color helpers ────────────────────────────────────────────────────────────
function vulnerabilityColor(v: number): string {
  if (v < 0.3)  return '#22c55e';
  if (v < 0.55) return '#eab308';
  if (v < 0.75) return '#f97316';
  return '#ef4444';
}
function incomeColor(income: number): string {
  const norm = Math.min(income / 130000, 1);
  if (norm > 0.7)  return '#22d3ee';
  if (norm > 0.45) return '#60a5fa';
  if (norm > 0.25) return '#a78bfa';
  return '#f472b6';
}
function infraAgeColor(age: number): string {
  if (age < 0.35) return '#4ade80';
  if (age < 0.60) return '#facc15';
  if (age < 0.80) return '#fb923c';
  return '#f87171';
}

const INFRA_UPGRADE_TYPES = new Set([
  'substation_upgrade',
  'grid_hardening',
  'underground_cable',
  'transmission_upgrade',
  'community_microgrid',
]);

function infraAgeTier(age: number): number {
  if (age < 0.35) return 0;
  if (age < 0.60) return 1;
  if (age < 0.80) return 2;
  return 3;
}

function infraAgeForTier(tier: number): number {
  if (tier <= 0) return 0.2;
  if (tier === 1) return 0.5;
  if (tier === 2) return 0.7;
  return 0.9;
}

function effectiveInfraAgeIndex(zone: Zone, projects: Project[]): number {
  const baseTier = infraAgeTier(zone.infraAgeIndex);
  const hasInfraUpgrade = projects.some((p) => p.zoneId === zone.id && INFRA_UPGRADE_TYPES.has(p.type));
  if (!hasInfraUpgrade || baseTier === 0) return zone.infraAgeIndex;
  return infraAgeForTier(baseTier - 1);
}

function effectiveVulnerabilityIndex(zone: Zone, projects: Project[]): number {
  let vulnerability = zone.vulnerability;
  for (const project of projects) {
    if (project.zoneId === zone.id && project.effects.vulnerabilityReduction) {
      vulnerability = Math.max(0, vulnerability - project.effects.vulnerabilityReduction);
    }
  }
  return Math.min(1, Math.max(0, vulnerability));
}

function outageBaseColor(outageRatio: number): string {
  if (outageRatio <= 0)   return '#1e3a5f';
  if (outageRatio < 0.2)  return '#1d4ed8';
  if (outageRatio < 0.5)  return '#f97316';
  return '#dc2626';
}

// Utility disruption: driven by outage hours (post-sim), always green pre-sim
function utilitiesColor(outageHours: number | null, _zone: Zone, utilityResilience = 0): string {
  if (outageHours === null) return '#22c55e';
  const scale = 1 + utilityResilience * 2;
  if (outageHours >= 12 * scale) return '#dc2626';
  if (outageHours >= 4  * scale) return '#f97316';
  if (outageHours >= 1  * scale) return '#fbbf24';
  return '#22c55e';
}

// ─── Weather effects ──────────────────────────────────────────────────────────

const SNOW_COUNT = 500;

function SnowSystem() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(SNOW_COUNT * 3);
    const vel = new Float32Array(SNOW_COUNT);
    for (let i = 0; i < SNOW_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = Math.random() * 22;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      vel[i] = 1.2 + Math.random() * 0.8;
    }
    return { positions: pos, velocities: vel };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useFrame(({ clock }, delta) => {
    if (!pointsRef.current) return;
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < SNOW_COUNT; i++) {
      arr[i * 3]     += Math.sin(clock.elapsedTime * 0.4 + i * 0.7) * 0.006;
      arr[i * 3 + 1] -= velocities[i] * delta;
      if (arr[i * 3 + 1] < -0.5) {
        arr[i * 3 + 1] = 20 + Math.random() * 3;
        arr[i * 3]     = (Math.random() - 0.5) * 26;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.045} color="#dbeafe" transparent opacity={0.75} sizeAttenuation />
    </points>
  );
}

// Heat rings over the three hottest zones (Rundberg, East Austin, Montopolis)
const HEAT_RING_POSITIONS: [number, number][] = [
  [0,   9],    // Rundberg world X,Z
  [4.5, 0],    // East Austin
  [4.5, 3.75], // Montopolis
];

function HeatHaze() {
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef<number[]>(HEAT_RING_POSITIONS.map((_, i) => i / HEAT_RING_POSITIONS.length));

  useFrame((_, delta) => {
    ringsRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      phaseRef.current[i] = (phaseRef.current[i] + delta * 0.18) % 1;
      const p = phaseRef.current[i];
      mesh.position.y = 0.3 + p * 3.5;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = p < 0.15
        ? (p / 0.15) * 0.055           // fade in
        : (1 - (p - 0.15) / 0.85) * 0.055; // fade out
    });
  });

  return (
    <>
      {HEAT_RING_POSITIONS.map(([x, z], i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) ringsRef.current[i] = el; }}
          position={[x, 0.3, z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[1.6 + i * 0.4, 0.06, 8, 48]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.05} />
        </mesh>
      ))}
    </>
  );
}

function WeatherParticles() {
  const scenarioId = usePlanStore((s) => s.selectedScenarioId);
  if (scenarioId === 'sc-freeze')    return <SnowSystem />;
  if (scenarioId === 'sc-heat-dome') return <HeatHaze />;
  return null;
}

// ─── Futuristic background ────────────────────────────────────────────────────

function StarField() {
  const positions = useMemo(() => {
    const count = 900;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.55;          // upper hemisphere only
      const r = 65 + Math.random() * 55;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return pos;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points geometry={geometry}>
      <pointsMaterial size={0.18} color="#bfdbfe" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

// Deterministic LCG seeded random
function makeLcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

type BuildingSpec = {
  x: number; z: number; h: number; bw: number; bd: number;
  accent: string; hasRing: boolean; hasSpire: boolean;
};

function FuturisticBuilding({ x, z, h, bw, bd, accent, hasRing, hasSpire }: BuildingSpec) {
  // Three-tier stepped silhouette
  const h1 = h * 0.58;
  const h2 = h * 0.28;
  const h3 = h * 0.14;
  const w2 = bw * 0.70; const d2 = bd * 0.70;
  const w3 = bw * 0.46; const d3 = bd * 0.46;

  // Window strips — up to 7 horizontal bands across the full building height
  const stripCount = Math.min(7, Math.max(2, Math.floor(h / 0.55)));
  const stripYs = Array.from({ length: stripCount }, (_, i) =>
    0.3 + (i / (stripCount - 1)) * (h - 0.5),
  );

  return (
    <group position={[x, 0, z]}>
      {/* ── Base tier ── */}
      <mesh position={[0, h1 / 2, 0]}>
        <boxGeometry args={[bw, h1, bd]} />
        <meshStandardMaterial color="#040a16" emissive={accent} emissiveIntensity={0.14} metalness={0.82} roughness={0.28} />
      </mesh>
      {/* ── Mid setback ── */}
      <mesh position={[0, h1 + h2 / 2, 0]}>
        <boxGeometry args={[w2, h2, d2]} />
        <meshStandardMaterial color="#060d1c" emissive={accent} emissiveIntensity={0.20} metalness={0.88} roughness={0.22} />
      </mesh>
      {/* ── Crown tier ── */}
      <mesh position={[0, h1 + h2 + h3 / 2, 0]}>
        <boxGeometry args={[w3, h3, d3]} />
        <meshStandardMaterial color="#07101f" emissive={accent} emissiveIntensity={0.38} metalness={0.92} roughness={0.12} />
      </mesh>

      {/* ── Window strips on front & back face ── */}
      {stripYs.map((sy, i) => {
        const ww = sy < h1 ? bw - 0.08 : sy < h1 + h2 ? w2 - 0.08 : w3 - 0.06;
        const dOff = sy < h1 ? bd : sy < h1 + h2 ? d2 : d3;
        return (
          <group key={i}>
            <mesh position={[0, sy,  dOff / 2 + 0.01]}>
              <boxGeometry args={[ww, 0.055, 0.012]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.1} transparent opacity={0.7} />
            </mesh>
            <mesh position={[0, sy, -(dOff / 2 + 0.01)]}>
              <boxGeometry args={[ww, 0.055, 0.012]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.1} transparent opacity={0.7} />
            </mesh>
          </group>
        );
      })}

      {/* ── Accent halo ring at the first setback ── */}
      {hasRing && (
        <mesh position={[0, h1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[Math.max(bw, bd) * 0.60, 0.038, 6, 36]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.0} />
        </mesh>
      )}

      {/* ── Antenna spire ── */}
      {hasSpire && (
        <group position={[0, h, 0]}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.042, 1.4, 6]} />
            <meshStandardMaterial color="#0f1e30" emissive={accent} emissiveIntensity={0.45} metalness={0.96} roughness={0.05} />
          </mesh>
          {/* Blinking tip */}
          <mesh position={[0, 0.72, 0]}>
            <sphereGeometry args={[0.042, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function BackgroundCity() {
  const specs = useMemo<BuildingSpec[]>(() => {
    const rand = makeLcg(0xdeadbeef);
    const palette = ['#0ea5e9', '#06b6d4', '#7c3aed', '#3b82f6', '#22d3ee', '#f472b6', '#38bdf8'];
    const result: BuildingSpec[] = [];

    const add = (x: number, z: number) => {
      const h    = 4 + rand() * 22;
      const bw   = 1.0 + rand() * 2.8;
      const bd   = 1.0 + rand() * 2.8;
      const accent  = palette[Math.floor(rand() * palette.length)];
      const hasRing  = rand() > 0.52;
      const hasSpire = rand() > 0.42 && h > 10;
      result.push({ x, z, h, bw, bd, accent, hasRing, hasSpire });
    };

    for (let i = 0; i < 22; i++) add((rand() - 0.5) * 60, -(26 + rand() * 20));  // back
    for (let i = 0; i < 14; i++) add(-(23 + rand() * 22), (rand() - 0.5) * 50);  // left
    for (let i = 0; i < 14; i++) add( 23 + rand() * 22,  (rand() - 0.5) * 50);  // right
    return result;
  }, []);

  return (
    <>
      {specs.map((s, i) => <FuturisticBuilding key={i} {...s} />)}
    </>
  );
}

// Flying car configs — radius, angular speed, start phase, altitude, accent color
const CAR_CONFIGS: { radius: number; speed: number; phase: number; altitude: number; color: string }[] = [
  { radius: 18, speed: 0.18, phase: 0,                   altitude: 12, color: '#38bdf8' },
  { radius: 22, speed: 0.12, phase: Math.PI * 0.4,       altitude: 16, color: '#22d3ee' },
  { radius: 26, speed: 0.08, phase: Math.PI * 0.8,       altitude: 10, color: '#a78bfa' },
  { radius: 16, speed: 0.22, phase: Math.PI * 1.2,       altitude: 20, color: '#34d399' },
  { radius: 28, speed: 0.10, phase: Math.PI * 1.6,       altitude: 14, color: '#60a5fa' },
  { radius: 20, speed: 0.15, phase: Math.PI * 0.2,       altitude: 18, color: '#f472b6' },
  { radius: 24, speed: 0.09, phase: Math.PI * 1.0,       altitude: 22, color: '#fb923c' },
  { radius: 15, speed: 0.25, phase: Math.PI * 0.6,       altitude: 11, color: '#4ade80' },
];

function FlyingCar({ radius, speed, phase, altitude, color }: typeof CAR_CONFIGS[0]) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime * speed + phase;
    groupRef.current.position.set(
      Math.cos(t) * radius,
      altitude + Math.sin(t * 2.1 + phase) * 0.85,
      Math.sin(t) * radius,
    );
    groupRef.current.rotation.y = -(t + Math.PI / 2);
    // Slight banking into the turn
    groupRef.current.rotation.z = Math.sin(clock.elapsedTime * speed * 2 + phase) * 0.12;
  });

  return (
    <group ref={groupRef}>
      {/* ── FUSELAGE ── */}
      {/* Main body */}
      <mesh>
        <boxGeometry args={[0.95, 0.19, 0.30]} />
        <meshStandardMaterial color="#0b1520" emissive={color} emissiveIntensity={0.14} metalness={0.96} roughness={0.04} />
      </mesh>
      {/* Nose taper */}
      <mesh position={[0.55, 0, 0]}>
        <boxGeometry args={[0.24, 0.13, 0.21]} />
        <meshStandardMaterial color="#0d1f32" emissive={color} emissiveIntensity={0.10} metalness={0.96} roughness={0.04} />
      </mesh>
      {/* Tail boom */}
      <mesh position={[-0.55, -0.02, 0]}>
        <boxGeometry args={[0.22, 0.11, 0.19]} />
        <meshStandardMaterial color="#0b1520" emissive={color} emissiveIntensity={0.08} metalness={0.92} roughness={0.08} />
      </mesh>
      {/* Belly keel stripe */}
      <mesh position={[0.05, -0.11, 0]}>
        <boxGeometry args={[0.75, 0.04, 0.14]} />
        <meshStandardMaterial color="#05101a" emissive={color} emissiveIntensity={0.28} metalness={0.9} roughness={0.04} />
      </mesh>

      {/* ── COCKPIT ── */}
      <mesh position={[0.2, 0.16, 0]}>
        <boxGeometry args={[0.34, 0.12, 0.23]} />
        <meshStandardMaterial color="#0284c7" transparent opacity={0.48} emissive="#0ea5e9" emissiveIntensity={0.45} metalness={0.25} roughness={0.0} />
      </mesh>
      {/* Canopy frame strip */}
      <mesh position={[0.2, 0.22, 0]}>
        <boxGeometry args={[0.36, 0.02, 0.25]} />
        <meshStandardMaterial color="#0f2540" emissive={color} emissiveIntensity={0.3} metalness={0.98} roughness={0.02} />
      </mesh>

      {/* ── SWEPT WINGS ── */}
      {/* Left wing */}
      <mesh position={[-0.1, -0.025, 0.38]} rotation={[0, -0.22, 0.06]}>
        <boxGeometry args={[0.65, 0.038, 0.34]} />
        <meshStandardMaterial color="#091420" emissive={color} emissiveIntensity={0.10} metalness={0.92} roughness={0.10} />
      </mesh>
      {/* Right wing */}
      <mesh position={[-0.1, -0.025, -0.38]} rotation={[0, 0.22, -0.06]}>
        <boxGeometry args={[0.65, 0.038, 0.34]} />
        <meshStandardMaterial color="#091420" emissive={color} emissiveIntensity={0.10} metalness={0.92} roughness={0.10} />
      </mesh>
      {/* Left winglet fin */}
      <mesh position={[-0.34, 0.06, 0.60]} rotation={[0.08, -0.28, 0]}>
        <boxGeometry args={[0.16, 0.15, 0.03]} />
        <meshStandardMaterial color="#0c1a2a" emissive={color} emissiveIntensity={0.55} metalness={0.9} roughness={0.04} />
      </mesh>
      {/* Right winglet fin */}
      <mesh position={[-0.34, 0.06, -0.60]} rotation={[-0.08, 0.28, 0]}>
        <boxGeometry args={[0.16, 0.15, 0.03]} />
        <meshStandardMaterial color="#0c1a2a" emissive={color} emissiveIntensity={0.55} metalness={0.9} roughness={0.04} />
      </mesh>
      {/* Tail horizontal stabiliser */}
      <mesh position={[-0.56, 0.02, 0]} rotation={[0, 0, 0.05]}>
        <boxGeometry args={[0.18, 0.028, 0.36]} />
        <meshStandardMaterial color="#08131e" emissive={color} emissiveIntensity={0.12} metalness={0.92} roughness={0.08} />
      </mesh>

      {/* ── ENGINE NACELLES ── */}
      {/* Left nacelle */}
      <mesh position={[-0.12, -0.08, 0.58]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.065, 0.058, 0.38, 10]} />
        <meshStandardMaterial color="#040e1a" emissive={color} emissiveIntensity={0.18} metalness={0.96} roughness={0.04} />
      </mesh>
      {/* Left intake ring */}
      <mesh position={[0.09, -0.08, 0.58]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.068, 0.013, 6, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} />
      </mesh>
      {/* Left exhaust ring */}
      <mesh position={[-0.20, -0.08, 0.58]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.060, 0.015, 6, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.8} />
      </mesh>

      {/* Right nacelle */}
      <mesh position={[-0.12, -0.08, -0.58]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.065, 0.058, 0.38, 10]} />
        <meshStandardMaterial color="#040e1a" emissive={color} emissiveIntensity={0.18} metalness={0.96} roughness={0.04} />
      </mesh>
      {/* Right intake ring */}
      <mesh position={[0.09, -0.08, -0.58]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.068, 0.013, 6, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} />
      </mesh>
      {/* Right exhaust ring */}
      <mesh position={[-0.20, -0.08, -0.58]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.060, 0.015, 6, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.8} />
      </mesh>

      {/* ── LIGHTS ── */}
      {/* Twin headlights */}
      <mesh position={[0.68, 0.01,  0.07]}>
        <sphereGeometry args={[0.028, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} />
      </mesh>
      <mesh position={[0.68, 0.01, -0.07]}>
        <sphereGeometry args={[0.028, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} />
      </mesh>
      {/* Tail strobe */}
      <mesh position={[-0.66, 0, 0]}>
        <sphereGeometry args={[0.034, 6, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.5} />
      </mesh>
      {/* Port nav light (red) */}
      <mesh position={[-0.30, -0.02, -0.62]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
      </mesh>
      {/* Starboard nav light (green) */}
      <mesh position={[-0.30, -0.02, 0.62]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

function FlyingCars() {
  return (
    <>
      {CAR_CONFIGS.map((cfg, i) => (
        <FlyingCar key={i} {...cfg} />
      ))}
    </>
  );
}

// ─── Zone info panel (floats above clicked zone) ──────────────────────────────

function StatRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 9, marginBottom: 3 }}>
      <span style={{ color: '#475569' }}>{label}</span>
      <span style={{ color: warn ? '#f97316' : '#94a3b8', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function ZoneInfoPanel({
  zone, outageHours, shielded, projects, onClose,
}: {
  zone: Zone;
  outageHours: number | null;
  shielded: boolean;
  projects: Project[];
  onClose: () => void;
}) {
  const zoneProjects = projects.filter((p) => p.zoneId === zone.id);
  const cx = zone.polygon2D.reduce((s, [x]) => s + x, 0) / zone.polygon2D.length;
  const cz = zone.polygon2D.reduce((s, [, z]) => s + z, 0) / zone.polygon2D.length;
  const panelPos: [number, number, number] = [cx, 4.2, -cz];

  return (
    <Html position={panelPos} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(8, 14, 28, 0.93)',
        border: '1px solid #1e293b',
        borderRadius: 10,
        padding: '10px 13px',
        minWidth: 165,
        backdropFilter: 'blur(14px)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.65)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#e2e8f0' }}>
            {zone.name}
          </span>
          {shielded && (
            <span style={{ color: '#22d3ee', fontSize: 8, fontWeight: 700, marginLeft: 6 }}>◆ PROTECTED</span>
          )}
        </div>

        {outageHours !== null && (
          <StatRow label="Outage hours" value={`${outageHours}h`} warn={outageHours > 0} />
        )}
        <StatRow
          label="Vulnerability"
          value={(zone.vulnerability * 100).toFixed(0) + '%'}
          warn={zone.vulnerability > 0.5}
        />
        <StatRow
          label="Infra age"
          value={(zone.infraAgeIndex * 100).toFixed(0) + '%'}
          warn={zone.infraAgeIndex > 0.6}
        />
        <StatRow
          label="Heat sensitivity"
          value={(zone.heatSensitivity * 100).toFixed(0) + '%'}
          warn={zone.heatSensitivity > 0.65}
        />
        <StatRow
          label="Flood risk"
          value={(zone.floodRisk * 100).toFixed(0) + '%'}
          warn={zone.floodRisk > 0.4}
        />
        <StatRow
          label="Population"
          value={zone.population.toLocaleString()}
        />
        <StatRow
          label="Median income"
          value={`$${(zone.medianIncome / 1000).toFixed(0)}k`}
          warn={zone.medianIncome < 50000}
        />

        {zoneProjects.length > 0 && (
          <div style={{ marginTop: 8, borderTop: '1px solid #1e293b', paddingTop: 7 }}>
            <div style={{ fontSize: 8, color: '#475569', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 5 }}>
              INVESTMENTS
            </div>
            {zoneProjects.map((p) => (
              <div key={p.id} style={{ fontSize: 9, color: '#64748b', marginBottom: 3 }}>
                · {p.name}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 8,
            fontSize: 8,
            color: '#334155',
            textAlign: 'right',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          onClick={onClose}
        >
          ✕ close
        </div>
      </div>
    </Html>
  );
}

// ─── Zone Mesh (elevation-driven, smooth color lerp) ─────────────────────────
interface ZoneMeshProps {
  zone: Zone;
  color: string;
  depth: number;
  isSelected: boolean;
  shielded: boolean;
  onClick: () => void;
}

function ZoneMesh({ zone, color, depth, isSelected, shielded, onClick }: ZoneMeshProps) {
  const meshRef        = useRef<THREE.Mesh>(null);
  const targetColorRef = useRef(new THREE.Color(color));

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    zone.polygon2D.forEach(([x, z], i) => {
      if (i === 0) s.moveTo(x, z);
      else s.lineTo(x, z);
    });
    s.lineTo(zone.polygon2D[0][0], zone.polygon2D[0][1]);
    return s;
  }, [zone]);

  const geometry = useMemo(
    () => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }),
    [shape, depth],
  );

  const centroid = useMemo<[number, number, number]>(() => {
    const ax = zone.polygon2D.reduce((s, [x]) => s + x, 0) / zone.polygon2D.length;
    const az = zone.polygon2D.reduce((s, [, z]) => s + z, 0) / zone.polygon2D.length;
    return [ax, depth + 0.15, -az];
  }, [zone, depth]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    targetColorRef.current.set(color);
    mat.color.lerp(targetColorRef.current, Math.min(1, delta * 5));
    mat.emissive.set(isSelected ? '#ffffff' : '#000000');
    mat.emissiveIntensity = isSelected ? 0.15 : 0;
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        receiveShadow
      >
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Border — edges only, no internal triangulation lines */}
      <lineSegments
        geometry={useMemo(() => new THREE.EdgesGeometry(geometry), [geometry])}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <lineBasicMaterial
          color={isSelected ? '#ffffff' : '#334155'}
          transparent
          opacity={0.45}
        />
      </lineSegments>

      {/* Label */}
      <Html position={centroid} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#e2e8f0',
          fontSize: '9px',
          fontWeight: 700,
          textShadow: '0 0 6px #000',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          textAlign: 'center',
        }}>
          {zone.name}
          {shielded && (
            <div style={{ color: '#22d3ee', fontSize: '7px', marginTop: 2, letterSpacing: '0.05em' }}>
              ◆ PROTECTED
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ─── Node Sphere ──────────────────────────────────────────────────────────────
function NodeSphere({
  node, status, onClick,
}: { node: GridNode; status: 'operational' | 'failed'; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = status === 'failed' ? '#ef4444' : node.critical ? '#f59e0b' : '#3b82f6';
  const [x, , z] = node.position;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = status === 'failed'
      ? 0.6 + Math.sin(clock.elapsedTime * 5) * 0.35
      : 0.45;
  });

  const radius = node.critical ? 0.32 : 0.22;

  return (
    <mesh
      ref={meshRef}
      position={[x, 0.05, -z]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      renderOrder={1}
    >
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.45}
        roughness={0.1}
        metalness={0.6}
        transparent
        opacity={status === 'failed' ? 0.95 : 0.75}
        depthTest={false}
      />
    </mesh>
  );
}

// ─── Grid Edge Line (width scaled by capacity) ────────────────────────────────
const MAX_EDGE_FLOW = 130; // highest maxFlowMW in the dataset (e-04 downtown→westlake)

function GridEdgeLine({
  edge, fromNode, toNode, fromStatus, toStatus,
}: {
  edge: GridEdge; fromNode: GridNode; toNode: GridNode;
  fromStatus: 'operational' | 'failed'; toStatus: 'operational' | 'failed';
}) {
  const bothFailed = fromStatus === 'failed' && toStatus === 'failed';
  const anyFailed  = fromStatus === 'failed' || toStatus === 'failed';
  const color = edge.status === 'failed' || bothFailed ? '#ef4444' : anyFailed ? '#f97316' : '#3b82f6';
  const [fx, , fz] = fromNode.position;
  const [tx, , tz] = toNode.position;

  const points = useMemo(
    () => [new THREE.Vector3(fx, 0.05, -fz), new THREE.Vector3(tx, 0.05, -tz)],
    [fx, fz, tx, tz],
  );

  // Width scales with line capacity — backbone lines are visually heavier
  const normalizedCapacity = edge.maxFlowMW / MAX_EDGE_FLOW;
  const baseWidth = 1.5 + normalizedCapacity * 4.0;
  const lineWidth = anyFailed ? Math.max(1.5, baseWidth * 0.6) : baseWidth;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={anyFailed ? 0.85 : 0.5}
      depthTest={false}
    />
  );
}

// ─── Scene Contents ───────────────────────────────────────────────────────────
function SceneContents({
  selectedZoneId, setSelectedZoneId,
}: { selectedZoneId: string | null; setSelectedZoneId: (id: string | null) => void }) {
  const layerMode = usePlanStore((s) => s.layerMode);
  const currentPlan = usePlanStore((s) => s.currentPlan);
  const projects = currentPlan.projects;
  const { nodeStatusAtTime, currentResult, timelinePosition } = useSimulationStore();

  const outagePrefixByZone = useMemo(() => {
    if (!currentResult) return null;

    const zoneIds = mockZones.map((z) => z.id);
    const zoneNodeIds: Record<string, string[]> = Object.fromEntries(zoneIds.map((id) => [id, []]));
    for (const node of mockNodes) {
      zoneNodeIds[node.zoneId].push(node.id);
    }

    const sampleHistory = Object.values(currentResult.nodeStatusHistory)[0];
    const hours = sampleHistory?.length ?? 0;
    const prefix: Record<string, number[]> = Object.fromEntries(zoneIds.map((id) => [id, new Array<number>(hours).fill(0)]));

    for (let t = 0; t < hours; t++) {
      for (const zoneId of zoneIds) {
        const failedThisHour = zoneNodeIds[zoneId].some((nodeId) => {
          const history = currentResult.nodeStatusHistory[nodeId];
          return history?.[t] === 'failed';
        });
        const prev = t > 0 ? prefix[zoneId][t - 1] : 0;
        prefix[zoneId][t] = prev + (failedThisHour ? 1 : 0);
      }
    }

    return prefix;
  }, [currentResult]);

  const outageByZoneAtTime = useMemo(() => {
    if (!currentResult || !outagePrefixByZone) return null;

    const sampleHistory = Object.values(currentResult.nodeStatusHistory)[0];
    const hours = sampleHistory?.length ?? 0;
    if (hours === 0) return Object.fromEntries(mockZones.map((z) => [z.id, 0]));

    const idx = Math.max(0, Math.min(Math.floor(timelinePosition), hours - 1));
    return Object.fromEntries(
      mockZones.map((z) => [z.id, outagePrefixByZone[z.id]?.[idx] ?? 0]),
    );
  }, [currentResult, outagePrefixByZone, timelinePosition]);

  const maxOutageHours = useMemo(
    () => (!outageByZoneAtTime ? 1 : Math.max(1, ...Object.values(outageByZoneAtTime))),
    [outageByZoneAtTime],
  );

  const shieldedZoneIds = useMemo(() => {
    const shielded = new Set<string>();
    for (const zone of mockZones) {
      const zoneNodes = mockNodes.filter((n) => n.zoneId === zone.id);
      if (zoneNodes.some((n) => isShielded(n.id, currentPlan))) {
        shielded.add(zone.id);
      }
    }
    return shielded;
  }, [currentPlan]);

  const utilityResilienceByZone = useMemo(
    () => Object.fromEntries(mockZones.map((z) => [z.id, getZoneUtilityResilience(z.id, currentPlan)])),
    [currentPlan],
  );

  const getColor = useCallback(
    (zone: Zone) => {
      switch (layerMode) {
        case 'income':        return incomeColor(zone.medianIncome);
        case 'vulnerability': return vulnerabilityColor(effectiveVulnerabilityIndex(zone, projects));
        case 'infra-age':     return infraAgeColor(effectiveInfraAgeIndex(zone, projects));
        case 'utilities':     return utilitiesColor(outageByZoneAtTime ? (outageByZoneAtTime[zone.id] ?? 0) : null, zone, utilityResilienceByZone[zone.id] ?? 0);
        default:              return outageBaseColor((outageByZoneAtTime?.[zone.id] ?? 0) / maxOutageHours);
      }
    },
    [layerMode, projects, outageByZoneAtTime, maxOutageHours, utilityResilienceByZone],
  );

  const getDepth = useCallback(
    (zone: Zone): number => {
      const outageRatio = (outageByZoneAtTime?.[zone.id] ?? 0) / maxOutageHours;
      switch (layerMode) {
        case 'outage':        return 0.15 + outageRatio * 2.5;
        case 'vulnerability': return 0.15 + effectiveVulnerabilityIndex(zone, projects) * 2.0;
        case 'infra-age':     return 0.15 + effectiveInfraAgeIndex(zone, projects) * 1.8;
        case 'income':        return 0.15 + (1 - Math.min(zone.medianIncome / 130_000, 1)) * 1.6;
        case 'utilities': {
          const oh = outageByZoneAtTime ? (outageByZoneAtTime[zone.id] ?? 0) : 0;
          return 0.15 + Math.min(oh / 24, 1) * 2.0;
        }
        default: return 0.25;
      }
    },
    [layerMode, projects, outageByZoneAtTime, maxOutageHours],
  );

  const getNodeStatus = useCallback(
    (node: GridNode): 'operational' | 'failed' => {
      if (!currentResult) return node.status === 'failed' ? 'failed' : 'operational';
      return nodeStatusAtTime(node.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentResult, nodeStatusAtTime, timelinePosition],
  );

  const selectedZone = selectedZoneId ? mockZones.find((z) => z.id === selectedZoneId) : null;

  return (
    <>
      <fog attach="fog" args={['#050b17', 38, 90]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} color="#60a5fa" />
      <gridHelper args={[30, 30, '#1e293b', '#0f172a']} position={[0, -0.05, 0]} />

      {/* Futuristic backdrop — clearly outside the interactive grid */}
      <StarField />
      <BackgroundCity />
      <FlyingCars />

      <WeatherParticles />

      {mockZones.map((zone) => (
        <ZoneMesh
          key={zone.id}
          zone={zone}
          color={getColor(zone)}
          depth={getDepth(zone)}
          isSelected={zone.id === selectedZoneId}
          shielded={shieldedZoneIds.has(zone.id)}
          onClick={() => setSelectedZoneId(zone.id === selectedZoneId ? null : zone.id)}
        />
      ))}

      {mockNodes.map((node) => (
        <NodeSphere
          key={node.id}
          node={node}
          status={getNodeStatus(node)}
          onClick={() => setSelectedZoneId(node.zoneId === selectedZoneId ? null : node.zoneId)}
        />
      ))}

      {mockEdges.map((edge) => {
        const from = mockNodes.find((n) => n.id === edge.fromNodeId);
        const to   = mockNodes.find((n) => n.id === edge.toNodeId);
        if (!from || !to) return null;
        return (
          <GridEdgeLine
            key={edge.id}
            edge={edge}
            fromNode={from}
            toNode={to}
            fromStatus={getNodeStatus(from)}
            toStatus={getNodeStatus(to)}
          />
        );
      })}

      {/* Floating stats panel for selected zone */}
      {selectedZone && (
        <ZoneInfoPanel
          zone={selectedZone}
          outageHours={outageByZoneAtTime ? (outageByZoneAtTime[selectedZone.id] ?? null) : null}
          shielded={shieldedZoneIds.has(selectedZone.id)}
          projects={projects}
          onClose={() => setSelectedZoneId(null)}
        />
      )}
    </>
  );
}

// ─── Layer toggle bar ─────────────────────────────────────────────────────────
function LayerToggleBar() {
  const { layerMode, setLayerMode } = usePlanStore();
  const modes: { key: typeof layerMode; label: string }[] = [
    { key: 'outage',        label: 'Outage' },
    { key: 'income',        label: 'Income' },
    { key: 'vulnerability', label: 'Vulnerability' },
    { key: 'infra-age',     label: 'Infra Age' },
    { key: 'utilities',     label: 'Utilities' },
  ];

  return (
    <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, zIndex: 10 }}>
      {modes.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setLayerMode(key)}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            border: `1px solid ${layerMode === key ? '#3b82f6' : '#1e293b'}`,
            background: layerMode === key ? '#1d4ed8' : 'rgba(10,15,30,0.82)',
            color: layerMode === key ? '#fff' : '#64748b',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Viewport3D() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const timelinePosition = useSimulationStore((s) => s.timelinePosition);
  void timelinePosition;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <LayerToggleBar />
      <Canvas
        camera={{ position: [0, 22, 18], fov: 40, near: 0.1, far: 500 }}
        shadows
        style={{ background: '#050b17' }}
      >
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={60}
          enablePan
          panSpeed={0.8}
          zoomSpeed={0.8}
        />
        <SceneContents selectedZoneId={selectedZoneId} setSelectedZoneId={setSelectedZoneId} />
      </Canvas>
      <LayerLegend />
    </div>
  );
}
