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
                        A Purpose-Built{' '}
                        <span style={{ color: 'white' }}>Vertical AI Native</span>{' '}
                        Platform Company
                    </h2>
                </div>

                {/* Two-column body */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    <div ref={r2.ref} style={r2.style}>
                        <p className="text-base leading-[1.9]" style={{ color: 'var(--color-text-secondary)' }}>
                            AfterThought is a purpose-built AI technology company focused
                            exclusively on the energy and utility industry. Guided by our
                            <strong style={{ color: 'white' }}> People + AI</strong> philosophy,
                            we deliver human-centered, intelligent operating systems that connect
                            customers, field workers, operations, and the grid.
                        </p>
                    </div>
                    <div ref={r3.ref} style={r3.style}>
                        <p className="text-base leading-[1.9] mb-10" style={{ color: 'var(--color-text-secondary)' }}>
                            We empower energy providers worldwide to modernize operations, enhance
                            customer experiences, and build resilient, sustainable communities.
                            Our platform connects every stakeholder in the utility value chain
                            through a single intelligent operating layer.
                        </p>
                        <a href="#platform" className="btn-pill btn-pill-light" style={{ padding: '14px 32px', fontSize: '15px', marginTop: '4px' }}>
                            Our People + AI Vision
                            <ArrowRight size={16} />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
