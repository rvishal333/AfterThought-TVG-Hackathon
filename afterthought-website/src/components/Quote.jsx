import { useEffect, useRef, useState } from 'react';

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

export default function Quote() {
    const r1 = useReveal(0);
    const r2 = useReveal(200);

    return (
        <section className="relative" style={{ background: 'var(--color-bg)' }}>
            <div className="glow-orb" style={{
                width: '500px', height: '500px', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(91,127,255,0.06) 0%, transparent 60%)',
            }} />

            <div style={{ maxWidth: '896px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '140px', paddingBottom: '140px', textAlign: 'center' }}>
                <div ref={r1.ref} style={r1.style}>
                    <p style={{ fontSize: '48px', lineHeight: 1, fontWeight: 700, color: '#5B7FFF', opacity: 0.5 }}>"</p>
                    <blockquote
                        className="text-2xl md:text-3xl lg:text-4xl font-light leading-[1.4] tracking-tight mb-10"
                        style={{ color: 'white' }}
                    >
                        We believe the future of energy management lies at the intersection of
                        <span style={{ color: 'var(--color-accent-cyan)' }}> vertical AI</span>,
                        <span style={{ color: 'var(--color-accent-blue)' }}> spatial intelligence</span>,
                        and
                        <span style={{ color: 'var(--color-accent-purple)' }}> human-centered design</span>.
                    </blockquote>
                </div>

                <div ref={r2.ref} style={r2.style}>
                    <p className="text-sm font-medium" style={{ color: 'white' }}>AfterThought Founding Team</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Building the connected OS for the energy industry
                    </p>
                </div>
            </div>
        </section>
    );
}
