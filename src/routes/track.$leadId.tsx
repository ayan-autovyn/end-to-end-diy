import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, MonitorPlay } from "lucide-react";
import { Shell } from "@/components/Shell";
import { STAGES, useStore } from "@/lib/store";

export const Route = createFileRoute("/track/$leadId")({
  head: () => ({ meta: [{ title: "Track your vehicle · TVS Moto Sole" }, { name: "description", content: "Live tracking of your vehicle's service." }, { property: "og:title", content: "Track your vehicle · TVS Moto Sole" }, { property: "og:description", content: "Live tracking of your vehicle's service." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Track,
});

function Track() {
  const { leadId } = Route.useParams();
  const lead = useStore((s) => s.leads.find((l) => l.id === leadId));
  if (!lead) return <Shell title="Track"><p>We couldn’t find this vehicle. Please check your tracking link.</p></Shell>;
  const done = lead.stagesDone, total = STAGES.length;
  const ready = lead.status === "Ready for delivery" || lead.status === "Delivered";
  const pct = Math.round((done / total) * 100);
  return (
    <Shell title="Live tracking">
      <div className="relative overflow-hidden rounded-3xl p-6 text-hero-foreground shadow-lg" style={{ background: "var(--gradient-hero)" }}>
        <p className="text-xs uppercase tracking-widest opacity-70">Live service status</p>
        <h1 className="mt-1 font-display text-2xl font-black">{lead.regNo}</h1>
        <p className="text-sm opacity-80">{lead.model || "Your TVS"} · {lead.name}</p>
        <div className="mt-6 flex items-center justify-center">
          <div className="relative h-36 w-36 rounded-full" style={{ background: `conic-gradient(var(--accent) ${pct * 3.6}deg, color-mix(in oklab, currentColor 18%, transparent) 0)` }}>
            <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-primary">
              <span className="font-display text-3xl font-black">{pct}%</span>
              <span className="mt-0.5 max-w-[5.5rem] text-center text-[9px] uppercase leading-tight tracking-wider opacity-70">{ready ? lead.status : done < total ? STAGES[done] : "Done"}</span>
            </div>
          </div>
        </div>
      </div>
      <ol className="relative mt-6 space-y-0 pl-2">
        {STAGES.map((s, i) => {
          const isDone = i < done, current = i === done && !ready;
          return (
            <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
              {i < total - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${isDone ? "bg-success" : "bg-border"}`} />}
              <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isDone ? "bg-success text-success-foreground" : current ? "bg-accent text-accent-foreground ring-4 ring-accent/25" : "bg-muted text-muted-foreground"}`}>{isDone ? <Check className="h-4 w-4" /> : i + 1}</span>
              <div className="pt-1"><p className={`font-semibold ${!isDone && !current ? "text-muted-foreground" : ""}`}>{s}</p>{current && <p className="text-xs font-semibold text-accent">In progress now</p>}</div>
            </li>
          );
        })}
      </ol>
      {ready && <p className="mt-6 rounded-xl bg-success/15 p-4 text-center text-sm font-semibold text-success">{lead.status === "Delivered" ? "Delivered — ride safe!" : "Your vehicle is ready for pickup 🎉"}</p>}
      <Link to="/live" className="mt-6 flex items-center gap-3 rounded-xl border bg-card p-4 text-sm"><MonitorPlay className="h-5 w-5 text-primary" /> See all vehicles on the cafeteria big screen</Link>
    </Shell>
  );
}
