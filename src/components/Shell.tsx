import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { TvsLogo } from "@/components/TvsLogo";
import { Home, ClipboardList, UserCog, ShieldCheck, MonitorPlay } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/diy", label: "DIY Form", icon: ClipboardList },
  { to: "/advisor", label: "Advisor", icon: UserCog },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
  { to: "/live", label: "Live board", icon: MonitorPlay },
] as const;

export function Shell({ children, title }: { children: ReactNode; title?: string; narrow?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted sm:py-8">
      {/* Phone frame */}
      <div className="relative h-dvh w-full overflow-hidden bg-background sm:h-[844px] sm:w-[400px] sm:rounded-[3rem] sm:border-[10px] sm:border-foreground sm:shadow-2xl">
        <div className="pointer-events-none absolute left-1/2 top-2 z-30 hidden h-6 w-28 -translate-x-1/2 rounded-full bg-foreground sm:block" />
        <div className="flex h-full flex-col">
          <header className="shrink-0 bg-primary pt-3 text-primary-foreground sm:pt-10">
            <div className="flex items-center justify-between gap-3 px-4 pb-3">
              <Link to="/" className="flex min-w-0 items-center gap-2">
                <TvsLogo className="h-5 w-auto" chip />
              </Link>
              {title && <span className="truncate text-[10px] uppercase tracking-widest opacity-80">{title}</span>}
            </div>
            <div className="stripe h-1" />
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6">{children}</main>
          <nav className="grid shrink-0 grid-cols-5 border-t bg-card">
            {TABS.map((t) => (
              <Link key={t.to} to={t.to} activeOptions={{ exact: t.to === "/" }} className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-muted-foreground" activeProps={{ className: "text-primary" }}>
                <t.icon className="h-5 w-5" />
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="hidden shrink-0 justify-center bg-card pb-2 pt-1 sm:flex">
            <div className="h-1 w-32 rounded-full bg-foreground/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
