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

const metrics = [
    { label: 'Faster Grid Mapping', value: 90, suffix: '%' },
    { label: 'Reduced Ops Cost', value: 40, suffix: '%' },
    { label: 'Nodes Rendered', value: 1, suffix: 'M+' },
    { label: 'Data Security', value: 100, suffix: '%' },
];

function Counter({ target, suffix }) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);
    const animated = useRef(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !animated.current) {
                animated.current = true;
                const start = performance.now();
                const dur = 2200;
                const animate = (now) => {
                    const p = Math.min((now - start) / dur, 1);
                    const e = 1 - Math.pow(1 - p, 4);
                    setValue(Math.round(e * target));
                    if (p < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);
    return <span ref={ref}>{value}{suffix}</span>;
}

export default function MetricsBar() {
    const r = useReveal(0);

    return (
        <section style={{ background: 'var(--color-bg)' }}>
            <div style={{ maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '32px', paddingBottom: '32px' }}>
                <div ref={r.ref} style={r.style}>
                    <div
                        className="grid grid-cols-2 lg:grid-cols-4"
                        style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}
                    >
                        {metrics.map((m, i) => (
                            <div key={m.label} className="p-8 lg:p-10 text-center"
                                style={{
                                    borderRight: (i === 1 || i === 3) ? 'none' : '1px solid var(--color-border)',
                                    borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none',
                                }}
                            >
                                <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                                    {m.label}
                                </p>
                                <p className="text-4xl lg:text-5xl font-bold tracking-tight" style={{ color: 'white' }}>
                                    <Counter target={m.value} suffix={m.suffix} />
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
