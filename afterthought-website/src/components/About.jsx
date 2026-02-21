import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Layers } from 'lucide-react';

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

export default function About() {
    const r1 = useReveal(0);
    const r2 = useReveal(150);
    const r3 = useReveal(300);

    return (
        <section className="relative" style={{ background: 'var(--color-bg)' }}>
            <div className="glow-orb" style={{ width: '500px', height: '500px', right: '-10%', top: '20%', background: 'radial-gradient(circle, rgba(91,127,255,0.07) 0%, transparent 70%)' }} />

            <div style={{ maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '140px', paddingBottom: '140px' }}>
                {/* Centered header */}
                <div ref={r1.ref} style={{ ...r1.style, textAlign: 'center', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '64px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)', color: '#38BDF8', marginBottom: '24px', marginLeft: 'auto', marginRight: 'auto' }}>
                        <Layers size={20} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-medium leading-[1.1] tracking-tight" style={{ color: 'var(--color-text-secondary)' }}>
                        Infrastructure Fails{' '}
                        <span style={{ color: 'white' }}>When Systems Are Planned in Silos</span>
                    </h2>
                </div>

                {/* Two-column body */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    <div ref={r2.ref} style={r2.style}>
                        <p className="text-base leading-[1.9]" style={{ color: 'var(--color-text-secondary)' }}>
                            In 2021, the Texas freeze left <strong style={{ color: 'white' }}>4.5 million homes without power</strong>.
                            Water systems failed. Pipes burst. Transit shut down. It wasn't just a power
                            outage — it was a <strong style={{ color: 'white' }}>cascading infrastructure failure</strong>.
                            Today, cities still plan power, water, and transit in silos. As we electrify
                            transit, expand renewables, and face more extreme weather, the complexity
                            is compounding. Energy usage has grown 5× in the past decade and is expected
                            to grow <strong style={{ color: 'white' }}>50× in the next</strong>.
                        </p>
                    </div>
                    <div ref={r3.ref} style={r3.style}>
                        <p className="text-base leading-[1.9] mb-10" style={{ color: 'var(--color-text-secondary)' }}>
                            AfterThought is a <strong style={{ color: 'white' }}>multi-system urban simulation platform</strong>
                            {' '}that models how power grids, water, HVAC, and emergency services interact
                            under strain. Planners select infrastructure projects, run 6-month scenario
                            simulations with cascading failure physics, and see which communities are
                            protected — and which are left behind. AI-powered project generation lets
                            anyone propose ideas and instantly see their impact.
                        </p>
                        <a href="http://localhost:5175" target="_blank" rel="noopener noreferrer" className="btn-pill btn-pill-light" style={{ padding: '14px 32px', fontSize: '15px', marginTop: '4px' }}>
                            Launch the Simulation
                            <ArrowRight size={16} />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
