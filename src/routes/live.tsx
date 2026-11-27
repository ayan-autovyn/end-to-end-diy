import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronRight, ClipboardList, Droplets, PartyPopper, Wrench, type LucideIcon } from "lucide-react";
import { TvsLogo } from "@/components/TvsLogo";
import { STAGES, useStore, type Lead } from "@/lib/store";

export const Route = createFileRoute("/live")({
  head: () => ({ meta: [{ title: "Live service board · TVS Moto Sole" }, { name: "description", content: "Live tracking of all vehicles at the TVS Moto Sole service station." }, { property: "og:title", content: "Live service board · TVS Moto Sole" }, { property: "og:description", content: "Live tracking of all vehicles at the TVS Moto Sole service station." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Live,
});

/** Visual style per stage, same order as STAGES. */
const LOOK: { icon: LucideIcon; text: string; bg: string; soft: string; ring: string }[] = [
  { icon: ClipboardList, text: "text-info", bg: "bg-info", soft: "bg-info/15", ring: "ring-info/40" },
  { icon: Droplets, text: "text-teal", bg: "bg-teal", soft: "bg-teal/15", ring: "ring-teal/40" },
  { icon: Wrench, text: "text-warning", bg: "bg-warning", soft: "bg-warning/15", ring: "ring-warning/40" },
  { icon: PartyPopper, text: "text-success", bg: "bg-success", soft: "bg-success/15", ring: "ring-success/40" },
];
const MIN_ROWS = 6;
const LAST = STAGES.length - 1;

function stageOf(l: Lead) {
  if (l.status === "Ready for delivery") return LAST;
  return Math.min(l.stagesDone, LAST);
}

function useClock() {
  const [c, setC] = useState({ t: "--:--", d: "" });
  useEffect(() => {
    const f = () => { const n = new Date(); setC({ t: n.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), d: n.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" }) }); };
    f(); const t = setInterval(f, 10000); return () => clearInterval(t);
  }, []);
  return c;
}

function Live() {
  const all = useStore((s) => s.leads);
  const clock = useClock();
  const active = all
    .filter((l) => l.jcCreated && l.status !== "Delivered")
    .map((l) => ({ lead: l, stage: stageOf(l) }))
    .sort((a, b) => b.stage - a.stage);
  const delivered = all.filter((l) => l.status === "Delivered").length;
  const counts = STAGES.map((_, i) => active.filter((a) => a.stage === i).length);
  const fillers = Math.max(0, MIN_ROWS - active.length);

  return (
    <div className="flex min-h-screen flex-col bg-board font-sans text-hero-foreground">
      {/* Header */}
      <header className="border-b border-board-line bg-hero">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 lg:px-10 lg:py-5">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" aria-label="Back" className="shrink-0 rounded-full bg-hero-foreground/10 p-2"><ArrowLeft className="h-5 w-5" /></Link>
            <TvsLogo className="h-8 w-auto shrink-0 lg:h-10" chip />
            <div className="hidden min-w-0 border-l border-hero-foreground/20 pl-4 sm:block">
              <h1 className="truncate font-display text-xl font-black tracking-tight sm:text-2xl lg:text-4xl">Live Service Board</h1>
              <p className="hidden truncate text-sm text-hero-foreground/60 sm:block">Find your vehicle number to see where it is</p>
            </div>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-accent"><span className="h-2 w-2 animate-pulse rounded-full bg-accent" />Live</p>
            <p className="font-mono text-2xl font-bold tabular-nums lg:text-5xl">{clock.t}</p>
            <p className="hidden text-xs text-hero-foreground/60 sm:block">{clock.d}</p>
          </div>
        </div>
        <div className="stripe h-1" />
      </header>

      {/* Stage pipeline */}
      <section aria-label="Vehicles per step" className="grid grid-cols-2 gap-2 px-5 pt-5 sm:grid-cols-4 lg:gap-3 lg:px-10 lg:pt-7">
        {STAGES.map((s, i) => {
          const L = LOOK[i]!; const Icon = L.icon;
          return (
            <div key={s} className={`relative flex items-center gap-3 rounded-2xl border border-board-line bg-board-panel p-3 lg:p-5 ${i === LAST ? "ring-2 ring-success/60" : ""}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl lg:h-14 lg:w-14 ${L.soft} ${L.text}`}><Icon className="h-5 w-5 lg:h-7 lg:w-7" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-hero-foreground/50">Step {i + 1}</p>
                <p className="font-display text-sm font-extrabold leading-tight lg:text-xl">{s}</p>
              </div>
              <span className={`font-display text-3xl font-black tabular-nums lg:text-5xl ${counts[i] ? L.text : "text-hero-foreground/25"}`}>{counts[i]}</span>
              {i < LAST && <ChevronRight className="absolute -right-3.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-hero-foreground/30 sm:block" />}
            </div>
          );
        })}
      </section>

      {/* Board */}
      <main className="flex-1 px-5 py-5 lg:px-10 lg:py-7">
        <div className="overflow-hidden rounded-2xl border border-board-line bg-board-panel">
          <div className="hidden grid-cols-[170px_minmax(0,0.8fr)_minmax(0,1.6fr)_190px] gap-6 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.6fr)_220px] border-b border-board-line px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-hero-foreground/50 md:grid">
            <span>Vehicle no.</span><span>Customer</span><span>Progress</span><span className="text-right">Status</span>
          </div>
          <ul>
            {active.map(({ lead, stage }) => <Row key={lead.id} lead={lead} stage={stage} />)}
            {Array.from({ length: fillers }, (_, k) => (
              <li key={`f${k}`} aria-hidden className="hidden h-[76px] grid-cols-[170px_minmax(0,0.8fr)_minmax(0,1.6fr)_190px] lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.6fr)_220px] items-center gap-6 border-b border-board-line/60 px-6 last:border-b-0 md:grid">
                <span className="h-9 w-40 rounded-md border border-dashed border-board-line" />
                <span className="h-3 w-24 rounded-full bg-board-line/50" />
                <span className="h-1.5 w-full rounded-full bg-board-line/40" />
                <span />
              </li>
            ))}
            {active.length === 0 && <li className="px-6 py-10 text-center text-hero-foreground/60 md:hidden">No vehicles in service right now</li>}
          </ul>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-board-line px-5 py-3 text-xs text-hero-foreground/60 lg:px-10 lg:text-sm">
        <span>Ready vehicles can be collected at the <b className="text-hero-foreground">delivery counter</b> · Updates also come on WhatsApp</span>
        <span className="font-semibold"><span className="font-display text-base font-black text-hero-foreground">{delivered}</span> delivered today</span>
      </footer>
    </div>
  );
}

function Row({ lead, stage }: { lead: Lead; stage: number }) {
  const L = LOOK[stage]!; const ready = stage === LAST;
  return (
    <li className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border-b border-board-line/60 px-4 py-4 last:border-b-0 md:grid-cols-[170px_minmax(0,0.8fr)_minmax(0,1.6fr)_190px] lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.6fr)_220px] md:gap-6 md:px-6 ${ready ? "bg-success/10" : ""}`}>
      <span className="w-fit whitespace-nowrap rounded-md border-2 border-board bg-plate px-3 py-1.5 font-mono text-lg font-black tracking-wider text-board shadow-[inset_0_0_0_2px_var(--plate)] lg:text-xl">{lead.regNo}</span>
      <div className="min-w-0 text-right md:text-left">
        <p className="truncate font-display text-base font-bold lg:text-lg">{lead.name.split(" ")[0]}</p>
        <p className="truncate text-xs text-hero-foreground/55 lg:text-sm">{lead.model || "TVS"}</p>
      </div>
      <Track stage={stage} />
      <div className="col-span-2 flex justify-end md:col-span-1">
        <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold ${ready ? "bg-success text-success-foreground" : `${L.soft} ${L.text}`}`}>
          {!ready && <span className={`h-2 w-2 animate-pulse rounded-full ${L.bg}`} />}
          {ready ? "Ready · Collect now" : `In ${STAGES[stage]}`}
        </span>
      </div>
    </li>
  );
}

function Track({ stage }: { stage: number }) {
  const L = LOOK[stage]!;
  return (
    <div className="col-span-2 md:col-span-1">
      <div className="flex items-center">
        {STAGES.map((s, k) => {
          const done = k < stage || (stage === LAST && k === LAST); const cur = k === stage && !done;
          return (
            <div key={s} className={`flex items-center ${k < LAST ? "flex-1" : ""}`}>
              <span title={s} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${done ? `${L.bg} text-board` : cur ? `${L.bg} text-board ring-4 ${L.ring}` : "border-2 border-board-line text-hero-foreground/40"}`}>
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : k + 1}
              </span>
              {k < LAST && <span className={`mx-1 h-1 flex-1 rounded-full ${done ? L.bg : "bg-board-line"}`} />}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 hidden grid-cols-4 text-[10px] font-semibold uppercase tracking-wider text-hero-foreground/45 xl:grid">
        {STAGES.map((s, k) => <span key={s} className={`${k === 0 ? "text-left" : k === LAST ? "text-right" : "text-center"} ${k === stage ? L.text : ""}`}>{s}</span>)}
      </div>
    </div>
  );
}
