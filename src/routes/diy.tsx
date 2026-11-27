import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, PhoneCall, PhoneIncoming, FileText, CheckCircle2, MessageCircle, Bike, Mic, ClipboardList } from "lucide-react";
import { Shell } from "@/components/Shell";
import { OtpStep } from "@/components/OtpStep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ACK, BOT_NUMBER, createLead, useStore, type Channel, type Lead } from "@/lib/store";
import { TvsLogo } from "@/components/TvsLogo";
import { formatCountdown } from "@/lib/store";
import { useAiCallCountdown } from "@/lib/use-ai-call-countdown";

export const Route = createFileRoute("/diy")({
  head: () => ({
    meta: [
      { title: "DIY Job Card · TVS Moto Sole" },
      { name: "description", content: "Create your service job card in minutes at the TVS Moto Sole event." },
      { property: "og:title", content: "DIY Job Card · TVS Moto Sole" },
      { property: "og:description", content: "Create your service job card in minutes at the TVS Moto Sole event." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Diy,
});

type Step = "details" | "otp" | "method" | "form" | "outbound" | "inbound" | "done";
const STEP_NO: Record<Step, number> = { details: 1, otp: 1, method: 2, form: 3, outbound: 3, inbound: 3, done: 4 };

function Diy() {
  const [step, setStep] = useState<Step>("details");
  const [c, setC] = useState({ name: "", regNo: "", phone: "" });
  const [lead, setLead] = useState<Lead | null>(null);
  const advisors = useStore((s) => s.advisors);

  const submit = (d: { odometer: string; issue: string }, channel: Channel) => {
    setLead(createLead({ ...c, ...d, channel }));
    setStep("done");
  };

  if (step === "form") {
    return (
      <Shell title="DIY Job Card" narrow>
        <DiyForm customer={c} onBack={() => setStep("method")} onSubmit={(d) => submit(d, "DIY Form")} />
      </Shell>
    );
  }

  return (
    <Shell title="DIY Job Card" narrow>
      <div className="mb-6 flex gap-1.5">
        {["Verify", "Method", "Details", "Done"].map((l, i) => (
          <div key={l} className="flex-1">
            <div className={`h-1.5 rounded-full ${i < STEP_NO[step] ? "bg-accent" : "bg-border"}`} />
            <p className={`mt-1.5 text-[11px] font-semibold uppercase tracking-wider ${i < STEP_NO[step] ? "text-foreground" : "text-muted-foreground"}`}>{l}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        {step === "details" && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep("otp"); }}>
            <TvsLogo className="mx-auto mb-4 h-8 w-auto" />
            <H title="Welcome, rider" sub="Tell us who you are to start your job card." />
            <F label="Customer name"><Input required value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} placeholder="Full name" /></F>
            <F label="Vehicle registration number"><Input required value={c.regNo} onChange={(e) => setC({ ...c, regNo: e.target.value.toUpperCase() })} placeholder="GA 01 AB 1234" /></F>
            <F label="Mobile number">
              <div className="flex"><span className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm">+91</span>
                <Input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className="rounded-l-none" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value.replace(/\D/g, "") })} placeholder="10-digit number" /></div>
            </F>
            <Button type="submit" className="w-full" size="lg">Send OTP</Button>
          </form>
        )}
        {step === "otp" && (<><H title="Verify your number" /><OtpStep phone={c.phone} onBack={() => setStep("details")} onVerified={() => setStep("method")} /></>)}
        {step === "method" && (
          <div className="space-y-3">
            <H title="How would you like to create your job card?" sub={`Hi ${c.name.split(" ")[0]}, pick one.`} />
            <Choice icon={PhoneCall} title="Get a call from AI bot" body="Receive a call from our Agentic AI bot in 2 minutes." onClick={() => setStep("outbound")} />
            <Choice icon={PhoneIncoming} title="Call the AI bot" body="Dial our number and talk to the assistant yourself." onClick={() => setStep("inbound")} />
            <Choice icon={FileText} title="Open DIY form" body="Fill in four quick fields on your phone." onClick={() => setStep("form")} />
          </div>
        )}
        {(step === "outbound" || step === "inbound") && (
          <BotCall inbound={step === "inbound"} phone={c.phone} onBack={() => setStep("method")} onDone={(d) => submit(d, step === "inbound" ? "AI Inbound Call" : "AI Outbound Call")} />
        )}
        {step === "done" && lead && (
          <div className="space-y-5 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Request submitted</p><p className="font-display text-3xl font-black">{lead.regNo}</p></div>
            <div className="rounded-xl bg-muted p-4 text-left text-sm">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-success"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp · sent to you</p>
              {ACK}
            </div>
            <p className="text-sm text-muted-foreground">Your advisor: <b className="text-foreground">{advisors.find((a) => a.id === lead.advisorId)?.name ?? "Will be assigned shortly"}</b></p>
          </div>
        )}
      </div>
    </Shell>
  );
}

function H({ title, sub }: { title: string; sub?: string }) {
  return <div className="mb-2"><h1 className="font-display text-2xl font-extrabold">{title}</h1>{sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}</div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Choice({ icon: I, title, body, onClick }: { icon: typeof Bot; title: string; body: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-start gap-4 rounded-xl border p-4 text-left transition hover:border-primary hover:bg-secondary">
      <span className="shrink-0 rounded-lg bg-primary p-2.5 text-primary-foreground"><I className="h-5 w-5" /></span>
      <span className="min-w-0"><span className="block font-semibold">{title}</span><span className="text-sm text-muted-foreground">{body}</span></span>
    </button>
  );
}


function StepCard({ n, title, sub, children }: { n: number; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">{n}</span>
        <div>
          <h2 className="font-display text-base font-bold leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function DiyForm({ customer, onSubmit, onBack }: { customer: { name: string; regNo: string; phone: string }; onSubmit: (d: { odometer: string; issue: string }) => void; onBack: () => void }) {
  const [odometer, setOdometer] = useState("");
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const issue = [note.trim(), recorded ? "🎙 Voice note recorded" : ""].filter(Boolean).join(" · ");
  const ready = odometer.length > 0 && issue.length > 0 && agreed;

  return (
    <form
      className="-my-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit({ odometer, issue });
      }}
    >
      {/* Hero */}
      <div className="grid-bg -mx-4 -mt-8 rounded-b-3xl bg-hero px-6 pb-16 pt-8 text-hero-foreground">
        <button type="button" onClick={onBack} className="mb-5 block text-sm opacity-80 transition hover:opacity-100">← Back</button>
        <TvsLogo className="h-7 w-auto" chip />
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.25em] opacity-70">DIY Job Card</p>
        <h1 className="mt-2 font-display text-3xl font-black leading-tight">Tell us what your ride needs</h1>
        <span className="mt-4 inline-block rounded-full border border-hero-foreground/25 px-3 py-1 text-xs font-medium opacity-90">Sample booking</span>
      </div>

      {/* Vehicle card */}
      <div className="-mt-12 flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-md">
        <span className="rounded-xl bg-secondary p-3 text-primary"><Bike className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-extrabold uppercase tracking-wide">TVS Apache RTR160</p>
          <p className="mt-0.5 inline-block rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider">{customer.regNo}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Service</p>
          <p className="flex items-center gap-1 font-display text-sm font-bold"><ClipboardList className="h-3.5 w-3.5" /> DIY request</p>
        </div>
      </div>

      {/* Step 1 — Odometer */}
      <StepCard n={1} title="Odometer reading" sub="Check your speedometer">
        <div className="relative">
          <Input
            inputMode="numeric"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 12450"
            className="h-12 rounded-xl bg-muted pr-12 text-base"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">km</span>
        </div>
      </StepCard>

      {/* Step 2 — Issue */}
      <StepCard n={2} title="What's the issue?" sub="Type it, or record a voice note below — sent to your advisor">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Brakes make a squeaking noise, chain feels loose…" className="rounded-xl bg-muted" rows={3} />
      </StepCard>

      {/* Step 3 — Voice note */}
      <StepCard n={3} title="Prefer to speak?" sub="Record the issue in any language">
        <div className="flex flex-col items-center py-2">
          <button
            type="button"
            onClick={() => (recording ? (setRecording(false), setRecorded(true)) : (setRecording(true), setRecorded(false)))}
            className={`rounded-full p-6 text-primary-foreground shadow-lg transition ${recording ? "animate-pulse bg-destructive" : "bg-primary hover:opacity-90"}`}
            aria-label={recording ? "Stop recording" : "Record voice note"}
          >
            <Mic className="h-8 w-8" />
          </button>
          <p className="mt-3 text-sm text-muted-foreground">{recording ? "Recording… tap to stop" : recorded ? "Voice note added · tap to re-record" : "Tap to record"}</p>
        </div>
      </StepCard>

      {/* Terms + submit */}
      <label className="flex items-center gap-2.5 px-1 text-sm">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
        <span className="text-muted-foreground">I agree to the <span className="font-semibold text-primary">Terms &amp; Conditions</span></span>
      </label>
      <Button type="submit" size="lg" disabled={!ready} className="h-13 w-full rounded-xl font-display text-base font-bold shadow-md">Submit request</Button>
    </form>
  );
}

const SCRIPT = [
  ["bot", "Hello! I'm the TVS service assistant. What's your current odometer reading?"],
  ["you", "Around 9,800 km."],
  ["bot", "Got it. Are you facing any issues with the vehicle?"],
  ["you", "The brakes make a squeaking noise."],
  ["bot", "I've noted the brake noise. Anything else?"],
  ["you", "No, that's all."],
  ["bot", "Thank you! Your job card is being created. An advisor will attend to you shortly."],
] as const;

function BotCall({ inbound, phone, onDone, onBack }: { inbound: boolean; phone: string; onDone: (d: { odometer: string; issue: string }) => void; onBack: () => void }) {
  const [dialled, setDialled] = useState(false);
  const secondsLeft = useAiCallCountdown(!inbound);
  const connected = dialled || (!inbound && secondsLeft === 0);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!connected) return;
    if (n >= SCRIPT.length) { const t = setTimeout(() => onDone({ odometer: "9800", issue: "Brakes make a squeaking noise" }), 1200); return () => clearTimeout(t); }
    const t = setTimeout(() => setN(n + 1), 1100);
    return () => clearTimeout(t);
  }, [connected, n, inbound, onDone]);

  return (
    <div className="space-y-4">
      <div className="grid-bg flex flex-col items-center rounded-xl bg-primary py-8 text-primary-foreground">
        <span className={`rounded-full bg-accent p-4 ${!connected ? "animate-pulse" : ""}`}><Bot className="h-8 w-8" /></span>
        {inbound && !connected ? (
          <><p className="mt-4 text-sm opacity-80">Dial this number to talk to our AI assistant</p>
            <a href={`tel:${BOT_NUMBER.replace(/\s/g, "")}`} className="mt-1 font-display text-2xl font-black">{BOT_NUMBER}</a></>
        ) : (
          connected ? <p className="mt-4 text-sm">Connected · AI assistant</p> : (
            <div className="mt-4 px-4 text-center">
              <p className="text-sm font-semibold">You will receive a call from the Agentic AI bot in 2 minutes</p>
              <p role="timer" aria-label="Time until AI bot call" className="mt-3 font-display text-4xl font-bold tabular-nums">{formatCountdown(secondsLeft)}</p>
              <p className="mt-2 text-xs opacity-80">Calling +91 {phone} when the timer ends</p>
            </div>
          )
        )}
      </div>
      {inbound && !connected && <Button className="w-full" onClick={() => setDialled(true)}>I've dialled — simulate call</Button>}
      {connected && (
        <div className="space-y-2">
          {SCRIPT.slice(0, n).map(([who, t], i) => (
            <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${who === "bot" ? "bg-secondary" : "ml-auto bg-primary text-primary-foreground"}`}>{t}</div>
          ))}
        </div>
      )}
      {!connected && <Button variant="ghost" className="w-full" onClick={onBack}>Choose another way</Button>}
    </div>
  );
}
