import { Camera, Clock, FileCheck, Shield } from "lucide-react";
import ReportForm from "./components/ReportForm";

export default function App() {
  const appId = encodeURIComponent(
    window.location.hostname || "security-engineering-field-report",
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded bg-accent-yellow shrink-0">
            <Shield className="w-6 h-6 text-background" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-foreground leading-none font-display">
              DAILY REPORT
            </h1>
            <p className="text-sm text-muted-foreground tracking-wider uppercase mt-0.5">
              SECURITY ENGINEERING INC
            </p>
          </div>
        </div>
      </header>

      {/* Hero Banner / Submenu */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <p className="text-sm text-muted-foreground uppercase tracking-widest mb-4">
            Field Documentation System
          </p>
          <div className="flex flex-wrap gap-5">
            {[
              { icon: Clock, label: "Time Tracking" },
              { icon: FileCheck, label: "Job Reports" },
              { icon: Camera, label: "Site Photos" },
              { icon: Shield, label: "PDF Export" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 text-sm text-muted-foreground"
              >
                <Icon className="w-4.5 h-4.5 text-accent-yellow" />
                <span className="font-medium tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <ReportForm />
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Security Engineering Inc. © {new Date().getFullYear()}</span>
          <span>
            Built with <span className="text-accent-yellow">♥</span> using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-yellow hover:underline"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
