import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, MessageCircle, PhoneCall, ClipboardCheck, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { STAGES, completeStage, markDelivered, markJcCreated, markCustomerReplied, formatCountdown, READY_REPLY_WAIT_MS, updateLead, useStore, type Lead } from "@/lib/store";
import { WhatsAppBubble } from "@/components/WhatsAppBubble";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/advisor/$leadId")({
  head: () => ({
    meta: [
      { title: "Customer service details · TVS Moto Sole" },
      { name: "description", content: "Lead details and service stage tracking." },
      { property: "og:title", content: "Customer service details · TVS Moto Sole" },
      { property: "og:description", content: "Customer details, service progress and customer WhatsApp updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeadPage,
});

const DESC = ["Job card opened in DIGI and the customer notified with a tracking link", "Vehicle washing and cleaning", "Service work in the bay", "Vehicle checked and parked at the delivery counter"];

function LeadPage() {
  const { leadId } = Route.useParams();
  const lead = useStore((s) => s.leads.find((l) => l.id === leadId));
  const advisor = useStore((s) => s.advisors.find((a) => a.id === lead?.advisorId));
  const sentMessage = useStore((s) => s.whatsapp.find((m) => m.to === `Customer · ${lead?.phone}`));
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [sentOpen, setSentOpen] = useState(false);

  if (!lead) return <Shell><p>This customer lead could not be found. <Link to="/advisor" className="text-accent underline">Back</Link></p></Shell>;

  return (
    <Shell title={lead.regNo}>
      <Link to="/advisor" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All leads</Link>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0"><p className="text-xs uppercase tracking-widest text-muted-foreground">Customer details</p><h1 className="truncate font-display text-2xl font-black">{lead.name}</h1></div>
            {lead.jcCreated ? <StatusBadge status={lead.status} /> : <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">JC pending</span>}
          </div>
          {editing ? <EditForm lead={lead} onDone={() => setEditing(false)} /> : (
            <>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[["Registration", lead.regNo], ["Mobile", `+91 ${lead.phone}`], ["Model", lead.model || "—"], ["Vehicle date", lead.vehicleDate || "—"], ["Odometer", lead.odometer ? `${lead.odometer} km` : "—"], ["Created via", lead.channel], ["Advisor", advisor?.name ?? "Unassigned"], ["Received", lead.createdAt]].map(([k, v]) => (
                  <div key={k} className="min-w-0"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="truncate font-medium">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-4 rounded-lg bg-muted p-3 text-sm"><p className="text-xs text-muted-foreground">Customer issue</p>{lead.issue || "None reported"}</div>
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit customer details</Button>
            </>
          )}
        </div>

        {!lead.jcCreated ? (
          <div className="rounded-xl border-2 border-dashed border-primary/40 bg-secondary/50 p-5 text-center">
            <ClipboardCheck className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Create the job card in DIGI, then confirm here. The customer gets a WhatsApp with a live tracking link.</p>
            <Button size="lg" className="mt-4 w-full font-display text-base font-bold" onClick={() => { if (!lead.jcCreated) markJcCreated(lead.id); setSentOpen(true); }}>JC Created</Button>
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between"><h2 className="font-display text-lg font-extrabold">Service workflow</h2>
                <Link to="/track/$leadId" params={{ leadId: lead.id }} className="flex items-center gap-1 text-xs font-semibold text-accent">Customer view <ExternalLink className="h-3 w-3" /></Link></div>
              <p className="mt-1 text-xs text-muted-foreground">Each stage sends a WhatsApp nudge to the customer.</p>
              <ol className="mt-4 space-y-2">
                {STAGES.map((s, i) => {
                  const done = i < lead.stagesDone, current = i === lead.stagesDone && lead.status !== "Delivered";
                  return (
                    <li key={s} className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3 ${current ? "border-primary bg-secondary" : ""}`}>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-success text-success-foreground" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{done ? <Check className="h-4 w-4" /> : i + 1}</span>
                      <div className="min-w-0"><p className="font-semibold">{s}</p><p className="truncate text-xs text-muted-foreground">{DESC[i]}</p></div>
                      {current && <Button size="sm" onClick={() => { if (completeStage(lead.id)) setSentOpen(true); }}>{i === STAGES.length - 1 ? "Mark ready" : "Mark done"}</Button>}
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 flex flex-wrap gap-2">
                {lead.status === "Ready for delivery" && lead.readyDueAt && !lead.customerReplied && <ReplyWatch lead={lead} />}
                {lead.status === "Ready for delivery" && (
                  <Button size="lg" variant="destructive" className="flex-1 bg-accent" onClick={() => { markDelivered(lead.id); navigate({ to: "/advisor/call/$leadId", params: { leadId: lead.id }, search: { type: "feedback" } }); toast.success("Delivered"); }}>Mark Delivered</Button>
                )}
              </div>
            </div>
            {lead.psf ? (
              <div className="rounded-xl border bg-card p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">PSF by AI voice bot · {lead.psf.at}</p>
                <p className="mt-1 font-semibold">Recommend score · {lead.psf.nps}/10</p>
                <dl className="mt-3 space-y-1.5 text-sm">
                  {Object.entries(lead.psf.answers).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                  ))}
                </dl>
              </div>
            ) : lead.status === "Delivered" && (
              <Link to="/advisor/call/$leadId" params={{ leadId: lead.id }} search={{ type: "feedback" }} className="flex items-center justify-between rounded-xl border bg-card p-5">
                <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Post-service feedback</p><p className="font-semibold">Start PSF call with AI voice bot</p></div>
                <span className="text-sm font-semibold text-accent">Call</span>
              </Link>
            )}
          </>
        )}
      </div>

      <Dialog open={sentOpen} onOpenChange={setSentOpen}>
        <DialogContent className="gap-0 p-0">
          <DialogHeader className="px-5 pt-5 text-left">
            <DialogTitle className="font-display text-base font-extrabold">WhatsApp message sent to customer</DialogTitle>
            <DialogDescription className="text-xs">Prototype preview · customer update with the live tracking link.</DialogDescription>
          </DialogHeader>
          <div className="px-5 py-4">
            {sentMessage && <WhatsAppBubble message={sentMessage} />}
          </div>
          <DialogFooter className="px-5 pb-5">
            <Button className="w-full" onClick={() => setSentOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function EditForm({ lead, onDone }: { lead: Lead; onDone: () => void }) {
  const [f, setF] = useState({ name: lead.name, regNo: lead.regNo, phone: lead.phone, model: lead.model, vehicleDate: lead.vehicleDate, odometer: lead.odometer, issue: lead.issue });
  const field = (k: keyof typeof f, label: string, extra: Partial<React.ComponentProps<typeof Input>> = {}) => (
    <div className="space-y-1"><Label className="text-xs">{label}</Label><Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...extra} /></div>
  );
  return (
    <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); updateLead(lead.id, { ...f, regNo: f.regNo.toUpperCase() }); toast.success("Customer details updated"); onDone(); }}>
      {field("name", "Customer name", { required: true })}
      {field("regNo", "Registration number", { required: true })}
      {field("phone", "Mobile number", { required: true, inputMode: "numeric", pattern: "[0-9]{10}", maxLength: 10 })}
      {field("model", "Model name")}
      {field("vehicleDate", "Vehicle date", { type: "date" })}
      {field("odometer", "Odometer (km)", { inputMode: "numeric" })}
      <div className="space-y-1"><Label className="text-xs">Customer issue</Label><Textarea rows={2} value={f.issue} onChange={(e) => setF({ ...f, issue: e.target.value })} /></div>
      <div className="flex gap-2"><Button type="button" variant="ghost" className="flex-1" onClick={onDone}>Cancel</Button><Button type="submit" className="flex-1">Save</Button></div>
    </form>
  );
}

function ReplyWatch({ lead }: { lead: Lead }) {
  const navigate = useNavigate();
  const due = lead.readyDueAt ?? 0;
  const [left, setLeft] = useState(() => Math.max(0, Math.ceil((due - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, Math.ceil((due - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [due]);
  const pct = (left * 1000 * 100) / READY_REPLY_WAIT_MS;
  return (
    <div className="w-full rounded-xl border border-accent/40 bg-accent/10 p-4">
      {left > 0 ? (
        <>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <MessageCircle className="h-5 w-5 shrink-0 text-success" />
            <p className="min-w-0 text-sm font-semibold">Waiting for customer reply on WhatsApp</p>
            <span className="font-mono text-lg font-bold">{formatCountdown(left)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 text-xs text-muted-foreground">No reply in 5 min → Agentic AI bot calls the customer automatically.</p>
          <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => { markCustomerReplied(lead.id); toast.success("Customer replied — no call needed"); }}>Simulate customer reply</Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm font-semibold"><PhoneCall className="h-5 w-5 animate-pulse text-accent" /> No reply — AI voice call triggered</div>
          <Button size="sm" className="mt-3 w-full" onClick={() => navigate({ to: "/advisor/call/$leadId", params: { leadId: lead.id }, search: { type: "done" } })}>Open AI call</Button>
        </>
      )}
    </div>
  );
}
