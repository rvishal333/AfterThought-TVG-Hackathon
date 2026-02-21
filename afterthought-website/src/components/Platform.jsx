import { useEffect, useRef, useState } from 'react';
import { Users, Wrench, BarChart3, Cpu, CheckCircle2, Activity, Zap, ArrowRight, TrendingUp, Server, ShieldCheck } from 'lucide-react';

function useReveal(delay = 0) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setTimeout(() => setVisible(true), delay); obs.disconnect(); } },
            { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [delay]);
    return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms` } };
}

const tabs = [
    {
        id: 'cx', icon: Users, label: 'Customer Experience',
        title: 'Customer eXperience (CX)',
        desc: 'Deliver hyper-personalized, omnichannel engagement driven by Vertical AI. Empower modern energy consumers with transparent utility data, predictive billing, and actionable efficiency insights.',
        points: [
            'Next-Gen AMI Integration for real-time, high-frequency interval data streaming',
            'AI-Driven Rate Optimization engine with dynamic TOU (Time-of-Use) analysis',
            'Automated Outage Communications with predictive localized restoration times',
            'Proactive DER Advisory for rooftop solar, EV charging, and battery storage ROI',
        ],
        metrics: { health: 97.6, flow: '12,847', latency: '8.2', uptime: '99.97' },
        bars: [72, 88, 65, 91, 80, 55, 94],
    },
    {
        id: 'wx', icon: Wrench, label: 'Workforce Experience',
        title: 'Workforce eXperience (WX)',
        desc: 'Digitally augment field operations and grid maintenance crews. Our cognitive platform transforms situational awareness, automates dispatch, and enforces rigorous safety protocols.',
        points: [
            'Dynamic Routing & Dispatch powered by predictive asset failure models',
            'Augmented Reality (AR) spatial overlays for complex substation diagnostics',
            'Hands-free Voice UI for real-time field data entry in low-connectivity zones',
            'Automated Digital Twin synchronization during ongoing field maintenance events',
        ],
        metrics: { health: 99.1, flow: '3,294', latency: '14.7', uptime: '99.99' },
        bars: [60, 75, 90, 82, 68, 85, 78],
    },
    {
        id: 'bx', icon: BarChart3, label: 'Business Experience',
        title: 'Business eXperience (BX)',
        desc: 'Unify disparate legacy siloes into a single source of truth. Transform utility operations with predictive analytics that drive CapEx efficiency, reduce O&M costs, and ensure regulatory compliance.',
        points: [
            'Predictive Asset Management using machine learning failure-probability scoring',
            'Automated Capital Planning with multi-decade ROI projections per asset class',
            'Real-time Regulatory Compliance tracking and audit-ready ESG reporting',
            'Cross-departmental Executive KPIs with geospatial drill-down capabilities',
        ],
        metrics: { health: 94.8, flow: '8,512', latency: '11.3', uptime: '99.95' },
        bars: [85, 62, 78, 90, 55, 72, 88],
    },
    {
        id: 'gx', icon: Cpu, label: 'Grid Experience',
        title: 'Grid eXperience (GX)',
        desc: 'Next-generation grid command and control powered by 3D spatial intelligence. Manage the influx of renewables with a true AI-native Distributed Energy Resource Management System (DERMS).',
        points: [
            'SCADA-integrated 3D Topology Visualization of transmission and distribution',
            'AI Cascade Failure Simulation utilizing historical weather and load anomalies',
            'Advanced DERMS for orchestrating bi-directional flow from microgrids and EVs',
            'Automated Frequency Regulation and dynamic volt-VAR optimization across feeders',
        ],
        metrics: { health: 98.9, flow: '21,403', latency: '6.1', uptime: '99.98' },
        bars: [95, 80, 70, 88, 92, 65, 82],
    },
];

const logMessages = {
    cx: [
        { t: '0.01s', msg: 'Ingesting AMI interval data stream...', color: 'text-cyan-400/80' },
        { t: '0.03s', msg: 'Running TOU rate optimization model.', color: 'text-slate-500' },
        { t: '0.05s', msg: 'Customer engagement score updated.', color: 'text-blue-400/80' },
    ],
    wx: [
        { t: '0.01s', msg: 'Scanning active field crew GPS feeds...', color: 'text-cyan-400/80' },
        { t: '0.02s', msg: 'AR overlay models loaded for substation.', color: 'text-slate-500' },
        { t: '0.04s', msg: 'Digital twin sync complete.', color: 'text-blue-400/80' },
    ],
    bx: [
        { t: '0.01s', msg: 'Aggregating cross-department KPIs...', color: 'text-cyan-400/80' },
        { t: '0.03s', msg: 'CapEx projection model converged.', color: 'text-slate-500' },
        { t: '0.05s', msg: 'ESG compliance report generated.', color: 'text-blue-400/80' },
    ],
    gx: [
        { t: '0.01s', msg: 'Synchronizing grid topology models...', color: 'text-cyan-400/80' },
        { t: '0.03s', msg: 'Validating distributed ledger checksums.', color: 'text-slate-500' },
        { t: '0.05s', msg: 'Engaging real-time analytics stream.', color: 'text-blue-400/80' },
    ],
};

function MiniBarChart({ bars, tabId }) {
    return (
        <div className="flex items-end gap-1.5" style={{ height: '48px' }}>
            {bars.map((h, i) => (
                <div
                    key={`${tabId}-${i}`}
                    className="bar-grow"
                    style={{
                        width: '8px',
                        height: `${h * 0.48}px`,
                        borderRadius: '2px 2px 0 0',
                        background: i % 2 === 0
                            ? 'linear-gradient(to top, rgba(56,189,248,0.4), rgba(56,189,248,0.8))'
                            : 'linear-gradient(to top, rgba(91,127,255,0.4), rgba(91,127,255,0.8))',
                        animationDelay: `${i * 0.08}s`,
                    }}
                />
            ))}
        </div>
    );
}

function HealthRing({ value, tabId }) {
    const circumference = 2 * Math.PI * 44;
    const offset = circumference - (value / 100) * circumference;
    return (
        <div className="relative w-24 h-24 mb-4">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="44" stroke="#1e293b" strokeWidth="8" fill="none" />
                <circle
                    key={tabId}
                    cx="48" cy="48" r="44"
                    stroke="url(#healthGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{
                        transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)',
                    }}
                />
                <defs>
                    <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#5B7FFF" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-medium text-white tracking-tight">{value}</span>
                <span className="text-[9px] text-cyan-400 tracking-widest uppercase">Health</span>
            </div>
        </div>
    );
}

export default function Platform() {
    const [activeTab, setActiveTab] = useState('cx');
    const [animKey, setAnimKey] = useState(0);
    const active = tabs.find((t) => t.id === activeTab);
    const ActiveIcon = active.icon;
    const rHeader = useReveal(0);
    const rTabs = useReveal(150);
    const rContent = useReveal(200);
    const rCta = useReveal(300);

    function handleTabChange(id) {
        if (id !== activeTab) {
            setActiveTab(id);
            setAnimKey((k) => k + 1);
        }
    }

    return (
        <section id="platform" className="relative" style={{ background: 'var(--color-bg)' }}>
            <div className="glow-orb" style={{
                width: '700px', height: '700px', left: '-20%', top: '20%',
                background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 60%)',
            }} />
            <div className="glow-orb" style={{
                width: '600px', height: '600px', right: '-15%', bottom: '10%',
                background: 'radial-gradient(circle, rgba(91,127,255,0.06) 0%, transparent 60%)',
            }} />

            <div style={{ maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '140px', paddingBottom: '80px' }}>
                {/* Centered header */}
                <div ref={rHeader.ref} style={{ ...rHeader.style, textAlign: 'center', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '80px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)', color: '#38BDF8', marginBottom: '24px', marginLeft: 'auto', marginRight: 'auto', background: 'rgba(56,189,248,0.05)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a15 15 0 010 20M12 2a15 15 0 000 20M2 12h20" />
                        </svg>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-medium leading-[1.1] tracking-tight mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                        The Connected OS for{' '}
                        <span style={{ color: 'white' }}>Energy & Utilities</span>
                    </h2>
                    <p className="text-lg leading-relaxed" style={{ color: 'var(--color-text-muted)', maxWidth: '640px', margin: '0 auto' }}>
                        AfterThought's intelligent Vertical AI ecosystem unifies fragmented legacy systems—seamlessly connecting consumers, field crews, grid infrastructure, and enterprise operations into a single neural network.
                    </p>
                </div>

                {/* Tabs + Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
                    {/* Tabs */}
                    <div ref={rTabs.ref} style={rTabs.style} className="lg:col-span-4 flex flex-col gap-3">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                                    className={`platform-tab w-full flex items-center gap-4 px-6 py-5 text-left text-sm font-medium relative overflow-hidden group ${isActive ? 'platform-tab-active' : ''}`}
                                    style={{
                                        background: isActive ? 'linear-gradient(to right, rgba(56,189,248,0.08), rgba(91,127,255,0.03))' : 'rgba(255,255,255,0.01)',
                                        color: isActive ? 'white' : 'var(--color-text-muted)',
                                        border: isActive ? '1px solid rgba(56,189,248,0.3)' : '1px solid var(--color-border)',
                                        borderRadius: '16px',
                                        cursor: 'pointer', transition: 'all 0.3s ease', fontFamily: 'var(--font-body)',
                                    }}
                                >
                                    {/* Active indicator line */}
                                    {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(to bottom, #38BDF8, #5B7FFF)', borderRadius: '0 2px 2px 0' }} />}

                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isActive ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
                                        color: isActive ? 'var(--color-accent-cyan)' : 'inherit',
                                        transition: 'all 0.3s ease',
                                    }}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base tracking-wide">{tab.label}</span>
                                        {isActive && (
                                            <span className="text-[10px] tracking-wider mt-0.5" style={{ color: 'var(--color-accent-cyan)', opacity: 0.7 }}>
                                                {tab.id.toUpperCase()} MODULE
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}

                        {/* Mini stats under tabs */}
                        <div style={{ marginTop: '8px', padding: '16px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} style={{ color: '#34D399' }} />
                                    <span className="text-[11px] font-mono tracking-wider" style={{ color: 'var(--color-text-muted)' }}>ALL SYSTEMS</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <span className="text-[9px] font-mono tracking-widest" style={{ color: '#34D399' }}>NOMINAL</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Panel */}
                    <div ref={rContent.ref} style={rContent.style} className="lg:col-span-8">
                        <div key={animKey} className="tab-content-enter p-8 md:p-12 relative overflow-hidden" style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        }}>
                            {/* Subtle panel glow */}
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle at top right, rgba(91,127,255,0.06), transparent 70%)', pointerEvents: 'none' }} />

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div style={{ padding: '10px', background: 'rgba(56,189,248,0.1)', borderRadius: '12px', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}>
                                        <ActiveIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-semibold" style={{ color: 'white', letterSpacing: '-0.02em' }}>{active.title}</h3>
                                        <p className="text-[11px] font-mono tracking-wider mt-1" style={{ color: 'var(--color-accent-cyan)', opacity: 0.6 }}>
                                            MODULE v2.4 • ACTIVE
                                        </p>
                                    </div>
                                </div>

                                <p className="text-base leading-[1.8] mb-10" style={{ color: 'var(--color-text-secondary)', maxWidth: '90%' }}>
                                    {active.desc}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-12">
                                    {active.points.map((pt, i) => (
                                        <div key={`${active.id}-${i}`} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.3s ease' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                                e.currentTarget.style.borderColor = 'rgba(56,189,248,0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
                                            }}
                                        >
                                            <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent-cyan)' }} />
                                            <span className="text-sm leading-relaxed font-medium" style={{ color: 'var(--color-text-secondary)' }}>{pt}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* ── Enhanced Dashboard UI ── */}
                                <div className="w-full rounded-2xl relative overflow-hidden" style={{
                                    background: '#04060C',
                                    border: '1px solid var(--color-border)',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 10px 30px rgba(0,0,0,0.5)',
                                }}>
                                    {/* Dashboard Header Chrome */}
                                    <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
                                            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase ml-2 flex items-center gap-1.5">
                                                <Activity size={10} className="text-cyan-400" />
                                                {active.id.toUpperCase()} Node Monitor
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-mono tracking-wider text-slate-600">v2.4.1</span>
                                            <div className="flex items-center gap-2 px-2 py-0.5 rounded-sm bg-cyan-500/10 border border-cyan-500/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                                                <span className="text-[9px] font-mono tracking-widest text-cyan-400">ACTIVE</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dashboard Layout */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'var(--color-border)' }}>
                                        {/* Left: Health Ring */}
                                        <div className="p-6 flex flex-col items-center justify-center text-center">
                                            <HealthRing value={active.metrics.health} tabId={active.id} />
                                            <p className="text-xs text-slate-400 font-mono">NODE_{active.id.toUpperCase()}_01</p>
                                        </div>

                                        {/* Right: Metrics, Chart & Feed */}
                                        <div className="col-span-2 p-6 bg-white/[0.01]">
                                            {/* Metric cards */}
                                            <div className="grid grid-cols-3 gap-3 mb-5">
                                                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                    <p className="text-[10px] text-slate-500 font-mono tracking-wider mb-1">INBOUND</p>
                                                    <div className="flex items-end gap-1.5">
                                                        <span className="text-lg text-white font-medium tracking-tight">{active.metrics.flow}</span>
                                                        <span className="text-[10px] text-cyan-500 mb-0.5">req/s</span>
                                                    </div>
                                                </div>
                                                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                    <p className="text-[10px] text-slate-500 font-mono tracking-wider mb-1">LATENCY</p>
                                                    <div className="flex items-end gap-1.5">
                                                        <span className="text-lg text-white font-medium tracking-tight">{active.metrics.latency}</span>
                                                        <span className="text-[10px] text-blue-500 mb-0.5">ms</span>
                                                    </div>
                                                </div>
                                                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                    <p className="text-[10px] text-slate-500 font-mono tracking-wider mb-1">UPTIME</p>
                                                    <div className="flex items-end gap-1.5">
                                                        <span className="text-lg text-white font-medium tracking-tight">{active.metrics.uptime}</span>
                                                        <span className="text-[10px] text-emerald-500 mb-0.5">%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mini bar chart */}
                                            <div className="flex items-end justify-between mb-5 px-1">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-mono tracking-wider mb-2">THROUGHPUT (7d)</p>
                                                    <MiniBarChart bars={active.bars} tabId={active.id} />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <TrendingUp size={12} className="text-emerald-400" />
                                                    <span className="text-[10px] font-mono text-emerald-400">+12.4%</span>
                                                </div>
                                            </div>

                                            {/* Stream Logs */}
                                            <div className="space-y-2 font-mono text-[10px] tracking-wide text-slate-500 opacity-80">
                                                {(logMessages[active.id] || logMessages.gx).map((log, i) => (
                                                    <div key={`${active.id}-log-${i}`} className="flex items-center gap-3">
                                                        <span className="text-slate-600">{`t=${log.t}`}</span>
                                                        <span className={log.color}>{log.msg}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── CTA Bridge Card ── */}
                <div ref={rCta.ref} style={{ ...rCta.style, marginTop: '100px' }}>
                    <div className="cta-glow-card relative overflow-hidden" style={{
                        padding: '64px 48px',
                        borderRadius: '24px',
                        background: 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, rgba(91,127,255,0.04) 50%, rgba(139,92,246,0.04) 100%)',
                        border: '1px solid rgba(56,189,248,0.15)',
                        textAlign: 'center',
                    }}>
                        {/* Background decorative elements */}
                        <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(56,189,248,0.06), transparent 70%)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', bottom: '-50%', right: '-20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(91,127,255,0.06), transparent 70%)', pointerEvents: 'none' }} />

                        <div className="relative z-10">
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38BDF8', margin: '0 auto 24px' }}>
                                <Zap size={22} />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-medium tracking-tight mb-4" style={{ color: 'white' }}>
                                Ready to Transform Your Grid?
                            </h3>
                            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--color-text-muted)', maxWidth: '520px', margin: '0 auto 32px' }}>
                                Join the utilities already using AfterThought to modernize operations, delight customers, and build resilient energy infrastructure.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                                <a href="#demo" className="btn-pill btn-pill-white btn-shimmer" style={{ padding: '16px 36px', fontSize: '15px', fontWeight: 600, color: '#0A0A0A' }}>
                                    Schedule a Demo
                                    <ArrowRight size={16} />
                                </a>
                                <a href="#solutions" className="btn-pill btn-pill-light" style={{ padding: '16px 36px', fontSize: '15px' }}>
                                    View Solutions
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
