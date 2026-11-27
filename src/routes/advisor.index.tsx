import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bike, CheckCircle2, ChevronRight, Inbox, LogOut, PhoneCall, Plus, Wrench } from "lucide-react";
import { Shell } from "@/components/Shell";
import { OtpStep } from "@/components/OtpStep";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAGES, findActiveAdvisorByPhone, setSession, useSession, useStore, type LeadStatus } from "@/lib/store";
import { TvsLogo } from "@/components/TvsLogo";

export const Route = createFileRoute("/advisor/")({
  head: () => ({
    meta: [
      { title: "Service Advisor · TVS Moto Sole" },
      { name: "description", content: "Service Advisor dashboard for assigned leads at TVS Moto Sole." },
      { property: "og:title", content: "Service Advisor · TVS Moto Sole" },
      { property: "og:description", content: "Service Advisor dashboard for assigned leads at TVS Moto Sole." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdvisorHome,
});

function AdvisorHome() {
  const sid = useSession();
  return sid ? <Dashboard sid={sid} /> : <Login />;
}

function Login() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [err, setErr] = useState("");
  return (
    <Shell title="Advisor login" narrow>
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <TvsLogo className="mb-4 h-8 w-auto" />
        <h1 className="mb-4 font-display text-2xl font-extrabold">Service Advisor login</h1>
        {step === "phone" ? (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (findActiveAdvisorByPhone(phone)) setStep("otp"); else setErr("This number isn't registered or is inactive. Ask your admin."); }}>
            <div className="space-y-1.5"><Label>Registered mobile number</Label>
              <Input inputMode="numeric" maxLength={10} value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setErr(""); }} placeholder="10-digit number" /></div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <p className="text-xs text-muted-foreground">Demo: 9876500001 (Rohan) or 9876500002 (Priya)</p>
            <Button type="submit" className="w-full" disabled={phone.length !== 10}>Send OTP</Button>
          </form>
        ) : (
          <OtpStep phone={phone} onBack={() => setStep("phone")} onVerified={() => setSession(findActiveAdvisorByPhone(phone)?.id ?? null)} />
        )}
      </div>
    </Shell>
  );
}

const FILTERS: ("All" | LeadStatus)[] = ["All", "Open", "In Progress", "Ready for delivery", "Delivered"];

function Dashboard({ sid }: { sid: string }) {
  const me = useStore((s) => s.advisors.find((a) => a.id === sid));
  const all = useStore((s) => s.leads);
  const leads = all.filter((l) => l.advisorId === sid);
  const cbs = useStore((s) => s.callbacks);
  const pendingCb = cbs.filter((c) => c.status === "Pending" && all.find((l) => l.id === c.leadId)?.advisorId === sid).length;
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const count = (s: (typeof FILTERS)[number]) => (s === "All" ? leads.length : leads.filter((l) => l.status === s).length);
  const shown = f === "All" ? leads : leads.filter((l) => l.status === f);
  const done = leads.filter((l) => l.status === "Ready for delivery" || l.status === "Delivered").length;
  const pct = leads.length ? Math.round((done / leads.length) * 100) : 0;
  return (
    <Shell title="Advisor">
      <div className="relative overflow-hidden rounded-3xl p-5 text-hero-foreground shadow-lg" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/40 blur-2xl" />
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest opacity-70">Welcome back</p>
            <h1 className="truncate font-display text-2xl font-black">{me?.name}</h1>
          </div>
          <button onClick={() => setSession(null)} className="flex items-center gap-1.5 rounded-full bg-hero-foreground/15 px-3 py-1.5 text-xs font-semibold backdrop-blur"><LogOut className="h-3.5 w-3.5" /> Log out</button>
        </div>
        <div className="relative mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <p className="font-display text-5xl font-black">{String(leads.length).padStart(2, "0")}</p>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Assigned leads · {pct}% done</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-hero-foreground/20"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link to="/advisor/new" className="flex items-center gap-2 rounded-2xl bg-accent p-3.5 text-sm font-bold text-accent-foreground shadow-md"><Plus className="h-5 w-5" /> Create lead</Link>
        <Link to="/advisor/callbacks" className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border bg-card p-3.5 text-sm font-bold"><PhoneCall className="h-5 w-5 text-accent" /><span className="truncate">Callbacks</span>{pendingCb > 0 && <span className="rounded-full bg-accent px-2 text-xs text-accent-foreground">{pendingCb}</span>}</Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {TILES.map(({ key, label, icon: Icon, tone }) => {
          const active = f === key;
          return (
            <button key={key} onClick={() => setF(active ? "All" : key)} className={`rounded-2xl border p-3.5 text-left transition ${active ? `${tone.solid} border-transparent shadow-md` : "bg-card hover:shadow-sm"}`}>
              <div className="flex items-center justify-between">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? "bg-card/20" : tone.soft}`}><Icon className="h-4 w-4" /></span>
                <span className="font-display text-2xl font-black">{count(key)}</span>
              </div>
              <p className={`mt-2 text-xs font-semibold uppercase tracking-wider ${active ? "opacity-90" : "text-muted-foreground"}`}>{label}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 mb-2 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest">{f === "All" ? "All leads" : f}</h2>
        {f !== "All" && <button onClick={() => setF("All")} className="text-xs font-semibold text-accent">Show all</button>}
      </div>
      <div className="space-y-3">
        {shown.length === 0 && <p className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">No leads here yet.</p>}
        {shown.map((l) => (
          <Link key={l.id} to="/advisor/$leadId" params={{ leadId: l.id }} className="block rounded-2xl border bg-card p-4 shadow-xs transition hover:shadow-md">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display text-sm font-black text-secondary-foreground">{l.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{l.name}</p>
                <p className="truncate text-xs text-muted-foreground">{l.regNo}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <p className="truncate rounded-lg bg-muted px-2.5 py-1 text-xs">{l.issue || "No issue reported"}</p>
              {l.jcCreated ? <StatusBadge status={l.status} /> : <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">JC pending</span>}
            </div>
            <div className="mt-3 flex gap-1">
              {STAGES.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < l.stagesDone ? "bg-success" : "bg-muted"}`} />)}
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

const TILES: { key: LeadStatus; label: string; icon: typeof Inbox; tone: { solid: string; soft: string } }[] = [
  { key: "Open", label: "Open", icon: Inbox, tone: { solid: "bg-info text-primary-foreground", soft: "bg-info/15 text-info" } },
  { key: "In Progress", label: "In progress", icon: Wrench, tone: { solid: "bg-warning text-foreground", soft: "bg-warning/20 text-foreground" } },
  { key: "Ready for delivery", label: "Ready for delivery", icon: CheckCircle2, tone: { solid: "bg-success text-success-foreground", soft: "bg-success/15 text-success" } },
  { key: "Delivered", label: "Delivered", icon: Bike, tone: { solid: "bg-violet text-primary-foreground", soft: "bg-violet/15 text-violet" } },
];
