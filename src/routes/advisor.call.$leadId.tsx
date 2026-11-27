import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  MessageCircle,
  PhoneCall,
  PhoneOff,
  RotateCcw,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import {
  CALLBACK_WAIT_MS,
  formatCountdown,
  recordPsf,
  requestCallback,
  useStore,
  type Psf,
} from "@/lib/store";
import { PSF_STEPS, nextStep, type PsfAnswers } from "@/lib/psf";

type CallType = "done" | "feedback";

export const Route = createFileRoute("/advisor/call/$leadId")({
  validateSearch: (search: Record<string, unknown>): { type: CallType } => ({
    type: search["type"] === "feedback" ? "feedback" : "done",
  }),
  head: () => ({
    meta: [{ title: "AI call · TVS Moto Sole" }, { name: "description", content: "TVS service notifications and post-service feedback by voice bot." }, { property: "og:title", content: "AI call · TVS Moto Sole" }, { property: "og:description", content: "TVS service notifications and post-service feedback by voice bot." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }],
  }),
  component: CallPage,
});

type Line = { from: "bot" | "customer"; text: string };

/** Counts down the promised 2-minute wait before the service advisor calls back. */
function CallbackTimer({ dueAt }: { dueAt: number }) {
  const remaining = () => Math.max(0, Math.ceil((dueAt - Date.now()) / 1000));
  const [secsLeft, setSecsLeft] = useState(remaining);

  useEffect(() => {
    setSecsLeft(remaining());
    const timer = setInterval(() => setSecsLeft(remaining()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueAt]);

  const waiting = secsLeft > 0;
  const pct = Math.max(0, Math.min(100, (secsLeft / (CALLBACK_WAIT_MS / 1000)) * 100));

  return (
    <div className="mt-4 rounded-2xl bg-card p-4 text-card-foreground">
      <div className="flex items-center gap-3">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          {waiting && <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />}
          <PhoneCall className="relative h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {waiting ? "You will get a call in" : "Incoming call"}
          </p>
          <p className="font-display text-2xl font-black tabular-nums">
            {waiting ? formatCountdown(secsLeft) : "Your service advisor is calling now"}
          </p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {waiting
          ? "Keep your phone nearby — the advisor will call from the service center."
          : "Please pick up, the advisor is on the line."}
      </p>
    </div>
  );
}

function useCallSpeech(lines: Line[]) {
  const [supported, setSupported] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [replayCount, setReplayCount] = useState(0);
  const spokenCount = useRef(0);

  useEffect(() => {
    setSupported("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
  }, []);

  useEffect(() => {
    if (!supported) return;
    const speech = window.speechSynthesis;
    if (!voiceOn) {
      speech.cancel();
      spokenCount.current = lines.length;
      return;
    }

    const freshLines = lines.slice(spokenCount.current);
    spokenCount.current = lines.length;
    if (freshLines.length === 0) return;

    speech.cancel();
    const voices = speech.getVoices();
    const preferredVoice =
      voices.find((voice) => voice.lang === "en-IN") ??
      voices.find((voice) => voice.lang.startsWith("en"));
    freshLines.forEach((line) => {
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.lang = "en-IN";
      utterance.rate = line.from === "bot" ? 0.96 : 1.04;
      utterance.pitch = line.from === "bot" ? 0.95 : 1.1;
      if (preferredVoice) utterance.voice = preferredVoice;
      speech.speak(utterance);
    });
  }, [lines, replayCount, supported, voiceOn]);

  useEffect(
    () => () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      spokenCount.current = 0;
    },
    [],
  );

  const toggleVoice = () => {
    if (!voiceOn) spokenCount.current = Math.max(0, lines.length - 1);
    setVoiceOn((current) => !current);
  };
  const replay = () => {
    spokenCount.current = Math.max(0, lines.length - 2);
    setVoiceOn(true);
    setReplayCount((count) => count + 1);
  };

  return { supported, voiceOn, toggleVoice, replay };
}

function CallPage() {
  const { leadId } = Route.useParams();
  const { type } = Route.useSearch();
  const lead = useStore((s) => s.leads.find((l) => l.id === leadId));
  const [secs, setSecs] = useState(0);
  const [ended, setEnded] = useState(false);
  const [stepId, setStepId] = useState<string | null>(
    type === "feedback" ? PSF_STEPS[0]!.id : null,
  );
  const [answers, setAnswers] = useState<PsfAnswers>({});
  const [cbDueAt, setCbDueAt] = useState<number | null>(null);
  const [lines, setLines] = useState<Line[]>(() =>
    type === "feedback"
      ? [{ from: "bot", text: PSF_STEPS[0]!.ask(lead?.name ?? "") }]
      : [
          {
            from: "bot",
            text: "Hello! This is a notification from TVS. The service of your vehicle has been completed successfully. Your vehicle is now ready for collection. Thank you for choosing TVS!",
          },
        ],
  );
  const endRef = useRef<HTMLDivElement>(null);
  const { supported, voiceOn, toggleVoice, replay: replayVoice } = useCallSpeech(lines);

  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => setSecs((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [ended]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines, ended]);

  if (!lead)
    return (
      <Shell>
        <p>Lead not found.</p>
      </Shell>
    );
  const step = PSF_STEPS.find((s) => s.id === stepId);
  const time = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  const reply = (value: string) => {
    if (!step) return;
    const next = { ...answers, [step.id]: value };
    setAnswers(next);
    const nextStepToAsk = nextStep(step.id, next);
    const newLines: Line[] = [{ from: "customer", text: value }];
    if (nextStepToAsk) {
      newLines.push({ from: "bot", text: nextStepToAsk.ask(lead.name) });
    } else {
      newLines.push({
        from: "bot",
        text: "Thank you for your valuable feedback. Have a great day!",
      });
      const psf: Psf = {
        nps: Number(next["nps"] ?? 0),
        answers: Object.fromEntries(
          PSF_STEPS.filter((s) => s.group === "question" && next[s.id]).map((s) => [
            s.label,
            next[s.id]!,
          ]),
        ),
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      recordPsf(lead.id, psf);
      setEnded(true);
    }
    setLines((current) => [...current, ...newLines]);
    setStepId(nextStepToAsk?.id ?? null);
  };

  const callback = () => {
    if (!step) return;
    requestCallback(lead.id, step.label);
    setCbDueAt(Date.now() + CALLBACK_WAIT_MS);
    setLines((current) => [
      ...current,
      { from: "customer", text: "Can my service advisor call me back?" },
      {
        from: "bot",
        text: "Sure! I've asked your service advisor to call you back in 2 minutes. Thank you, have a great day!",
      },
    ]);
    setStepId(null);
    setEnded(true);
  };

  const hangUp = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setEnded(true);
  };

  return (
    <Shell title={type === "done" ? "Ready for delivery call" : "PSF call"}>
      <div
        className="-mx-4 -my-6 flex min-h-full flex-col px-4 py-5 text-hero-foreground"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center">
            {!ended && <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />}
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg">
              <Bot className="h-7 w-7" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest opacity-70">
              AI voice bot {type === "feedback" ? "· PSF" : ""}
            </p>
            <p className="truncate font-display text-lg font-black">{lead.name}</p>
            <p className="text-xs opacity-80">+91 {lead.phone}</p>
          </div>
          <span className="rounded-full bg-hero-foreground/15 px-3 py-1 font-mono text-xs">
            {ended ? "Ended" : time}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleVoice}
            disabled={!supported}
            aria-pressed={voiceOn}
            className="flex items-center gap-1.5 rounded-full bg-hero-foreground/15 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {supported ? (voiceOn ? "Voice on" : "Voice off") : "Voice unavailable"}
          </button>
          {supported && (
            <button
              type="button"
              onClick={replayVoice}
              className="flex items-center gap-1.5 rounded-full bg-hero-foreground/15 px-3 py-1.5 text-xs font-semibold"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Replay
            </button>
          )}
          <span className="ml-auto text-[10px] opacity-70">Device voice</span>
        </div>

        <div className="mt-5 flex-1 space-y-2.5">
          {lines.map((line, index) => (
            <div
              key={index}
              className={`flex items-end gap-2 ${line.from === "customer" ? "flex-row-reverse" : ""}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${line.from === "bot" ? "bg-accent" : "bg-card text-primary"}`}
              >
                {line.from === "bot" ? (
                  <Bot className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </span>
              <p
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${line.from === "bot" ? "rounded-bl-sm bg-hero-foreground/10" : "rounded-br-sm bg-card text-card-foreground"}`}
              >
                {line.text}
              </p>
            </div>
          ))}
        </div>

        {step && !ended && (
          <div className="mt-4 rounded-2xl bg-card p-3 text-card-foreground">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Customer says (demo)
            </p>
            <div
              className={step.id === "nps" ? "grid grid-cols-6 gap-1.5" : "flex flex-wrap gap-1.5"}
            >
              {step.options.map((option) => (
                <button
                  key={option}
                  onClick={() => reply(option)}
                  className="rounded-full border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:border-primary"
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={callback}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 py-2 text-xs font-bold text-accent"
            >
              <PhoneCall className="h-3.5 w-3.5" /> Request a call back from SA
            </button>
          </div>
        )}

        {ended && type === "feedback" && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-success/20 p-3 text-xs">
            <MessageCircle className="h-4 w-4 shrink-0" /> PSF answers saved to the customer’s
            service record.
          </div>
        )}

        {cbDueAt !== null && <CallbackTimer dueAt={cbDueAt} />}

        <div ref={endRef} className="pt-5 text-center">
          {ended ? (
            <Link
              to="/advisor/$leadId"
              params={{ leadId }}
              className="inline-flex w-full justify-center rounded-xl bg-card py-3 font-semibold text-card-foreground"
            >
              Back to job card
            </Link>
          ) : (
            <button
              onClick={hangUp}
              aria-label="End call"
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive shadow-lg"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}
