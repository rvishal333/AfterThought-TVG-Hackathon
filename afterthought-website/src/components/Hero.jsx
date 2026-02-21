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
    return {
        ref,
        style: {
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
        },
    };
}

export default function Hero() {
    const r1 = useReveal(0);
    const r2 = useReveal(150);
    const r3 = useReveal(300);
    const r4 = useReveal(450);

    // Scroll fade effect for the globe
    const [scrollOpacity, setScrollOpacity] = useState(0.6);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            // Fade out over the first 800px of scroll
            const newOpacity = Math.max(0, 0.6 - (scrollY / 800) * 0.6);
            setScrollOpacity(newOpacity);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        // Initial setup
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section
            className="relative flex flex-col items-center justify-center text-center overflow-hidden"
            style={{ minHeight: '100vh', background: 'var(--color-bg)' }}
        >
            {/* ═══ Earth Image ═══ */}
            <div style={{
                position: 'absolute',
                bottom: '-35%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '110vw',
                maxWidth: '1200px',
                aspectRatio: '1 / 1',
                zIndex: 1,
            }}>
                <img
                    src="/earth-grid.png"
                    alt="Earth with power grid lines"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        opacity: scrollOpacity,
                        transition: 'opacity 0.1s ease-out',
                        maskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, black 30%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, black 30%, transparent 70%)',
                    }}
                />
            </div>

            {/* Ambient glow orbs */}
            <div className="glow-orb" style={{ width: '500px', height: '500px', left: '-10%', bottom: '0%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />
            <div className="glow-orb" style={{ width: '400px', height: '400px', right: '-5%', bottom: '10%', background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)' }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, maxWidth: '896px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px' }}>
                {/* Badge */}
                <div ref={r1.ref} style={{ ...r1.style, marginBottom: '32px' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '8px 20px', borderRadius: '100px',
                        background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)',
                        fontSize: '13px', fontWeight: 500, letterSpacing: '0.14em',
                        color: 'var(--color-accent-cyan)', textTransform: 'uppercase',
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 8px rgba(56,189,248,0.6)' }} />
                        Infrastructure Simulation Engine
                    </span>
                </div>

                {/* Heading */}
                <h1 ref={r2.ref} style={{ ...r2.style, color: 'white', marginBottom: '28px' }} className="text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.08] tracking-tight">
                    Cities Don't Fail<br />
                    <span style={{ color: 'var(--color-text-secondary)' }}>Because One System Breaks</span>
                </h1>
                <p ref={r2.ref} className="text-xl md:text-2xl font-light" style={{ ...r2.style, color: 'var(--color-accent-cyan)', marginBottom: '20px', marginTop: '-12px' }}>
                    Make Disaster an Afterthought. Use today's data to prepare for the future.
                </p>

                {/* Subtitle */}
                <div ref={r3.ref} style={{ ...r3.style, marginBottom: '44px' }}>
                    <p className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.2em' }}>
                        Simulate  ·  Analyze  ·  Prevent
                    </p>
                </div>

                {/* CTAs */}
                <div ref={r4.ref} style={{ ...r4.style, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <a href="http://localhost:5175" target="_blank" rel="noopener noreferrer" className="btn-pill btn-pill-white" style={{ padding: '16px 36px', fontSize: '15px' }}>Launch Simulation Engine →</a>
                    <a href="#platform" className="btn-pill btn-pill-light" style={{ padding: '16px 36px', fontSize: '15px' }}>See How It Works →</a>
                </div>
            </div>

            {/* Bottom fade */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px', background: 'linear-gradient(to bottom, transparent, var(--color-bg))', zIndex: 2 }} />

            <style>{`
                @keyframes slowSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </section>
    );
}
