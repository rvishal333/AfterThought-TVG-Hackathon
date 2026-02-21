import { Zap, ArrowRight } from 'lucide-react';

const columns = [
    {
        title: 'Platform',
        links: ['Customer Experience', 'Workforce Experience', 'Business Experience', 'Grid Experience', 'Vertical AI'],
    },
    {
        title: 'Industry',
        links: ['Electric Utilities', 'Gas Utilities', 'Water Utilities', 'Renewable Energy', 'C&I Customers'],
    },
    {
        title: 'Company',
        links: ['About Us', 'Careers', 'Press', 'Partners', 'Contact'],
    },
    {
        title: 'Resources',
        links: ['Documentation', 'API Reference', 'Case Studies', 'Blog', 'Webinars'],
    },
];

export default function Footer() {
    return (
        <footer style={{ background: 'var(--color-bg)' }}>
            {/* Gradient top edge instead of hard border */}
            <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(56,189,248,0.15), rgba(91,127,255,0.15), transparent)' }} />
            {/* Footer links */}
            <div
                style={{ maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '56px', paddingBottom: '56px' }}
            >
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-5">
                            <Zap size={18} style={{ color: 'var(--color-accent-cyan)' }} />
                            <span className="text-base font-bold text-white">AfterThought</span>
                        </div>
                        <p
                            className="text-sm leading-relaxed mb-6"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            The industry's first AI-native grid platform.
                        </p>
                        {/* Social */}
                        <div className="flex items-center gap-2">
                            {['Li', 'YT', 'X'].map((label) => (
                                <a
                                    key={label}
                                    href="#"
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                                    style={{
                                        background: 'var(--color-surface-light)',
                                        color: 'var(--color-text-muted)',
                                        border: '1px solid var(--color-border)',
                                        textDecoration: 'none',
                                        transition: 'var(--transition)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = 'white';
                                        e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--color-text-muted)';
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                    }}
                                >
                                    {label}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {columns.map((col) => (
                        <div key={col.title}>
                            <h4
                                className="text-xs font-semibold uppercase tracking-wider mb-5"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                {col.title}
                            </h4>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="text-sm"
                                            style={{
                                                color: 'var(--color-text-secondary)',
                                                textDecoration: 'none',
                                                transition: 'var(--transition)',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div
                    className="mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                >
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        © {new Date().getFullYear()} AfterThought Inc. All rights reserved.
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Engine development paused — Frontend Preview Only.
                    </p>
                </div>
            </div>
        </footer>
    );
}
