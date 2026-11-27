import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock, Phone, PhoneCall } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { formatCountdown, markCalled, useSession, useStore } from "@/lib/store";

export const Route = createFileRoute("/advisor/callbacks")({
  head: () => ({ meta: [{ title: "Callback requests · TVS Moto Sole" }, { name: "description", content: "Manage customer callback requests from the TVS feedback voice bot." }, { property: "og:title", content: "Callback requests · TVS Moto Sole" }, { property: "og:description", content: "Manage customer callback requests from the TVS feedback voice bot." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Callbacks,
});

function Callbacks() {
  const sid = useSession();
  const leads = useStore((s) => s.leads);
  const cbs = useStore((s) => s.callbacks);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!sid) return <Shell title="Callbacks"><p className="text-sm">Please <Link to="/advisor" className="font-semibold text-accent underline">log in</Link> first.</p></Shell>;
  const mine = cbs.map((c) => ({ c, l: leads.find((l) => l.id === c.leadId) })).filter((x) => x.l?.advisorId === sid);
  return (
    <Shell title="Callbacks">
      <Link to="/advisor" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <h1 className="font-display text-2xl font-extrabold">Callback requests</h1>
      <p className="mt-1 text-sm text-muted-foreground">Customers who asked the AI voice bot for a call from you during PSF. Each customer is told they will hear from you in 2 minutes.</p>
      <div className="mt-5 space-y-3">
        {mine.length === 0 && <p className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">No callback requests.</p>}
        {mine.map(({ c, l }) => {
          if (!l) return null;
          const left = Math.max(0, Math.ceil((c.dueAt - Date.now()) / 1000));
          return (
            <div key={c.id} className={`rounded-2xl border bg-card p-4 ${c.status === "Called" ? "opacity-60" : ""}`}>
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent"><PhoneCall className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="truncate font-semibold">{l.name}</p><p className="truncate text-xs text-muted-foreground">+91 {l.phone} · {l.regNo}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.status === "Pending" ? "bg-warning/25" : "bg-success/15 text-success"}`}>{c.status}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Requested at {c.at} · during "{c.step}"</p>
              {c.status === "Pending" && (
                <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${left === 0 ? "text-destructive" : "text-accent"}`}>
                  <Clock className="h-3.5 w-3.5" /> {left === 0 ? "Call due now — customer is waiting" : `Customer expects your call in ${formatCountdown(left)}`}
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={`tel:+91${l.phone}`} className="flex items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground"><Phone className="h-4 w-4" /> Call</a>
                <Button variant="outline" disabled={c.status === "Called"} onClick={() => markCalled(c.id)}><Check className="h-4 w-4" /> Mark called</Button>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
