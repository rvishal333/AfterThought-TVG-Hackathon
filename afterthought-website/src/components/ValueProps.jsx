import { useEffect, useRef, useState } from 'react';
import { Cpu, Shield, Zap, BarChart3, Globe, Layers, ArrowRight } from 'lucide-react';

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

const features = [
    { icon: Cpu, title: 'Real-Time Grid Intelligence', body: 'GPU-accelerated compute simulates millions of grid nodes simultaneously. AI provides instant anomaly detection, load predictions, and capacity planning.' },
    { icon: Shield, title: 'Enterprise-Grade Security', body: 'SOC 2 Type II compliant infrastructure with end-to-end encryption, role-based access controls, and zero-trust architecture for critical energy systems.' },
    { icon: Zap, title: 'Instant Spatial Analytics', body: '3D geospatial intelligence for asset mapping, vegetation management, and infrastructure planning — operating at continental scale with sub-meter precision.' },
    { icon: BarChart3, title: 'Predictive Operations', body: 'Machine learning models trained on utility-specific datasets reduce unplanned outages by up to 60% and optimize preventive maintenance scheduling.' },
    { icon: Globe, title: 'Multi-Region Scalability', body: 'Deploy across global regions with distributed edge computing. Seamlessly scale from neighborhood microgrids to national infrastructure management.' },
    { icon: Layers, title: 'API-First Integration', body: 'Connect with SCADA, GIS, OMS, and ERP systems via RESTful and GraphQL APIs. Comprehensive SDK documentation and pre-built connectors included.' },
];

export default function ValueProps() {
    const rHeader = useReveal(0);

    return (
        <section id="solutions" className="relative" style={{ background: 'var(--color-bg)' }}>
            <div className="glow-orb" style={{ width: '600px', height: '600px', left: '-15%', top: '30%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />

            <div style={{ maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '140px', paddingBottom: '140px' }}>
                {/* Centered header */}
                <div ref={rHeader.ref} style={{ ...rHeader.style, textAlign: 'center', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '64px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)', color: '#38BDF8', marginBottom: '24px', marginLeft: 'auto', marginRight: 'auto' }}>
                        <Zap size={20} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-medium leading-[1.1] tracking-tight mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                        Purpose-Built for Utilities{' '}
                        <span style={{ color: 'white' }}>Using Vertical AI</span>
                    </h2>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                        A unified platform combining 3D spatial intelligence, machine learning,
                        and real-time grid simulation — designed exclusively for the energy sector.
                    </p>
                </div>

                {/* 3×2 Card Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    {features.map((f, i) => {
                        const Icon = f.icon;
                        const r = useReveal(i * 80);
                        return (
                            <div key={f.title} ref={r.ref} style={r.style}>
                                <div
                                    style={{
                                        padding: '32px',
                                        height: '100%',
                                        background: 'var(--color-surface-card)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-card)',
                                        transition: 'var(--transition)',
                                        cursor: 'default',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.background = 'var(--color-surface-card)';
                                    }}
                                >
                                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(91,127,255,0.1)', border: '1px solid rgba(91,127,255,0.15)', color: '#5B7FFF', marginBottom: '20px' }}>
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="text-base font-semibold mb-3" style={{ color: 'white' }}>{f.title}</h3>
                                    <p className="text-sm leading-[1.7]" style={{ color: 'var(--color-text-muted)' }}>{f.body}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
