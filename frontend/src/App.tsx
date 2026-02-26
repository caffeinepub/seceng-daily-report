import ReportForm from './components/ReportForm';

export default function App() {
    const year = new Date().getFullYear();
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown-app';
    const utmContent = encodeURIComponent(hostname);

    return (
        <div className="min-h-screen flex flex-col bg-background">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-30 border-b border-border bg-card/98 backdrop-blur-sm"
                style={{ boxShadow: '0 2px 16px 0 rgba(0,0,0,0.6)' }}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center gap-0">
                    <div className="flex flex-col justify-center leading-tight py-2">
                        <span
                            className="font-bold text-base sm:text-lg text-foreground tracking-widest uppercase"
                            style={{ fontFamily: 'Oswald, system-ui, sans-serif' }}
                        >
                            Security Engineering Inc.
                        </span>
                        <span className="text-xs text-muted-foreground font-medium tracking-[0.18em] uppercase">
                            Daily Field Report System
                        </span>
                    </div>
                    <div className="ml-auto hidden sm:flex items-center gap-2 px-2.5 py-1 self-center rounded border border-border bg-secondary/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-80" style={{ animation: 'pulse 2s infinite' }} />
                        <span className="text-xs text-muted-foreground font-medium tracking-wide">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            </header>

            {/* ── Hero banner ─────────────────────────────────────────────── */}
            <div className="w-full border-b border-border bg-secondary/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1
                            className="text-xl sm:text-2xl font-bold text-foreground tracking-wide uppercase"
                            style={{ fontFamily: 'Oswald, system-ui, sans-serif' }}
                        >
                            New Daily Report
                        </h1>
                        <p className="text-xs text-muted-foreground max-w-lg">
                            Complete all required fields{' '}
                            <span className="text-primary font-semibold">(*)</span>{' '}
                            then generate a professionally formatted PDF.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-card shrink-0">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                            Ready
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Main ────────────────────────────────────────────────────── */}
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4">
                <ReportForm />
            </main>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <footer className="border-t border-border bg-card mt-2">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span
                                className="text-xs font-bold tracking-widest uppercase text-foreground/80"
                                style={{ fontFamily: 'Oswald, system-ui, sans-serif' }}
                            >
                                Security Engineering Inc.
                            </span>
                            <span className="text-xs text-muted-foreground">
                                © {year} — Confidential Field Reports
                            </span>
                        </div>
                        <div className="w-full sm:hidden border-t border-border" />
                        <p className="text-xs text-muted-foreground">
                            Built with{' '}
                            <span className="text-red-400" aria-label="love">♥</span>{' '}
                            using{' '}
                            <a
                                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${utmContent}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:opacity-80 font-semibold transition-all"
                            >
                                caffeine.ai
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
