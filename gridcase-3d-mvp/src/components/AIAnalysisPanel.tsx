import { useState } from 'react';
import { usePlanStore } from '../stores/planStore';
import { mockZones } from '../data/mockAustin';
import { generateProjectEffects, type GeneratedProject } from '../services/aiService';
import type { Project, ProjectEffect } from '../types/grid';

type Status = 'idle' | 'loading' | 'preview' | 'error';

const TYPE_ICON: Record<string, string> = {
    substation_upgrade: '⚡', solar_farm: '☀️', battery_storage: '🔋',
    grid_hardening: '🔩', ev_charging: '🚗', underground_cable: '🪱',
    smart_meter: '📊', transmission_upgrade: '🗼', community_microgrid: '🏘️',
    solar_storage: '🌞', water_infrastructure: '💧', district_hvac: '❄️',
    emergency_services: '🚨', custom: '🧩',
};

export default function AIProjectBuilder() {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [zoneId, setZoneId] = useState(mockZones[0].id);
    const [budgetM, setBudgetM] = useState(20);
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState('');
    const [generated, setGenerated] = useState<GeneratedProject | null>(null);
    const [added, setAdded] = useState(false);

    const addProject = usePlanStore((s) => s.addProject);

    const canGenerate = name.trim().length > 0 && desc.trim().length > 0 && status !== 'loading';

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setStatus('loading');
        setError('');
        setGenerated(null);
        setAdded(false);

        const zone = mockZones.find((z) => z.id === zoneId);
        try {
            const result = await generateProjectEffects(name, desc, zone?.name ?? zoneId, budgetM);
            setGenerated(result);
            setStatus('preview');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
            setStatus('error');
        }
    };

    const handleAdd = () => {
        if (!generated) return;
        const project: Project = {
            id: `p-ai-${Date.now().toString(36)}`,
            name,
            type: generated.type,
            zoneId,
            capexUSD: budgetM * 1_000_000,
            effects: generated.effects,
            description: generated.refinedDescription,
        };
        addProject(project);
        setAdded(true);
    };

    const handleReset = () => {
        setName('');
        setDesc('');
        setBudgetM(20);
        setGenerated(null);
        setStatus('idle');
        setAdded(false);
        setError('');
    };

    return (
        <div>
            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Field label="Project Name">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Community Solar Garden"
                        style={inputStyle}
                    />
                </Field>

                <Field label="Description">
                    <textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Describe the project — what it does, who it serves, what infrastructure it improves…"
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Field label="Target Zone">
                        <select
                            value={zoneId}
                            onChange={(e) => setZoneId(e.target.value)}
                            style={inputStyle}
                        >
                            {mockZones.map((z) => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Budget ($M)">
                        <input
                            type="number"
                            value={budgetM}
                            onChange={(e) => setBudgetM(Math.max(1, Number(e.target.value)))}
                            min={1}
                            max={500}
                            style={inputStyle}
                        />
                    </Field>
                </div>
            </div>

            {/* Generate button */}
            <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: 10,
                    borderRadius: 8,
                    border: 'none',
                    background: !canGenerate
                        ? '#0a0f1e'
                        : status === 'loading' ? '#1e3a5f' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: !canGenerate ? '#334155' : '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: !canGenerate ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                }}
            >
                {status === 'loading' ? (
                    <><Spinner /> Generating…</>
                ) : (
                    '🧠 Generate with AI'
                )}
            </button>

            {/* Error */}
            {status === 'error' && (
                <div style={{
                    marginTop: 8, padding: '6px 10px', borderRadius: 6,
                    background: '#7f1d1d22', border: '1px solid #7f1d1d',
                    fontSize: 10, color: '#fca5a5', lineHeight: 1.5,
                }}>
                    ⚠ {error}
                </div>
            )}

            {/* Preview card */}
            {generated && status === 'preview' && (
                <div style={{
                    marginTop: 10, borderRadius: 8,
                    border: added ? '1px solid #166534' : '1px solid #6366f144',
                    background: added ? '#05200a' : '#6366f108',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid #6366f122',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14 }}>{TYPE_ICON[generated.type] ?? '🧩'}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>{name}</span>
                        </div>
                        <span style={{
                            padding: '2px 8px', borderRadius: 5,
                            background: '#0f2a10', border: '1px solid #166534',
                            fontSize: 11, fontWeight: 800, color: '#4ade80',
                        }}>
                            ${budgetM}M
                        </span>
                    </div>

                    {/* Description */}
                    <div style={{ padding: '6px 10px' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6, lineHeight: 1.5 }}>
                            {generated.refinedDescription}
                        </div>
                        <div style={{ fontSize: 9, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Type: {generated.type.replace(/_/g, ' ')}
                        </div>

                        {/* Effect tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                            <EffectTag effects={generated.effects} />
                        </div>

                        {/* Add / Added button */}
                        {!added ? (
                            <button onClick={handleAdd} style={addBtnStyle}>
                                ＋ Add to Plan
                            </button>
                        ) : (
                            <div style={{
                                textAlign: 'center', padding: '6px',
                                fontSize: 11, fontWeight: 700, color: '#4ade80',
                            }}>
                                ✓ Added to Plan
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reset link */}
            {(status === 'preview' || status === 'error') && (
                <button onClick={handleReset} style={{
                    width: '100%', marginTop: 6, padding: '4px', background: 'none',
                    border: 'none', color: '#475569', fontSize: 10, cursor: 'pointer', textDecoration: 'underline',
                }}>
                    Start over
                </button>
            )}
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3, fontWeight: 600 }}>{label}</div>
            {children}
        </div>
    );
}

function EffectTag({ effects }: { effects: ProjectEffect }) {
    const tags: { label: string; bg: string }[] = [];
    if (effects.capacityBoostMW) tags.push({ label: `+${effects.capacityBoostMW} MW`, bg: '#1d4ed8' });
    if (effects.vulnerabilityReduction) tags.push({ label: `-${(effects.vulnerabilityReduction * 100).toFixed(0)}% vuln`, bg: '#065f46' });
    if (effects.cascadeResistance) tags.push({ label: `+${(effects.cascadeResistance * 100).toFixed(0)}% cascade resist`, bg: '#78350f' });
    if (effects.demandReductionFactor) tags.push({ label: `-${(effects.demandReductionFactor * 100).toFixed(0)}% demand`, bg: '#4c1d95' });
    if (effects.recoverySpeedBoost) tags.push({ label: `+${(effects.recoverySpeedBoost * 100).toFixed(0)}% recovery`, bg: '#1e3a5f' });
    if (effects.utilityResilienceBoost) tags.push({ label: `+${(effects.utilityResilienceBoost * 100).toFixed(0)}% utility resil`, bg: '#5b2164' });

    return (
        <>
            {tags.map((t, i) => (
                <span key={i} style={{
                    fontSize: 9, padding: '2px 6px', borderRadius: 4,
                    background: t.bg, color: '#e2e8f0', fontWeight: 600,
                }}>
                    {t.label}
                </span>
            ))}
        </>
    );
}

function Spinner() {
    return (
        <span style={{
            display: 'inline-block', width: 12, height: 12,
            border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff',
            borderRadius: '50%', animation: 'aiSpin 0.6s linear infinite',
        }} />
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: 11,
    boxSizing: 'border-box',
};

const addBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px',
    borderRadius: 6,
    border: 'none',
    background: '#166534',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
};
