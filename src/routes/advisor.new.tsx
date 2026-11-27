import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLead, useSession } from "@/lib/store";

export const Route = createFileRoute("/advisor/new")({
  head: () => ({ meta: [{ title: "Create lead · TVS Moto Sole" }, { name: "description", content: "Add a customer lead for TVS vehicle service." }, { property: "og:title", content: "Create lead · TVS Moto Sole" }, { property: "og:description", content: "Add a customer lead for TVS vehicle service." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: NewLead,
});

function NewLead() {
  const sid = useSession();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", regNo: "", phone: "", model: "", vehicleDate: "", issue: "" });
  if (!sid) return <Shell title="Create lead"><p className="text-sm">Please <Link to="/advisor" className="font-semibold text-accent underline">log in</Link> first.</p></Shell>;
  return (
    <Shell title="Create lead">
      <Link to="/advisor" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h1 className="font-display text-2xl font-extrabold">Create lead</h1>
        <p className="mt-1 text-sm text-muted-foreground">For customers who didn't complete the DIY job card. The lead is assigned to you.</p>
        <form className="mt-5 space-y-3.5" onSubmit={(e) => { e.preventDefault(); const l = createLead({ ...f, regNo: f.regNo.toUpperCase(), odometer: "", channel: "Created by SA" }, sid); toast.success("Lead created"); navigate({ to: "/advisor/$leadId", params: { leadId: l.id } }); }}>
          <F label="Customer name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Full name" /></F>
          <F label="Registration number"><Input required value={f.regNo} onChange={(e) => setF({ ...f, regNo: e.target.value.toUpperCase() })} placeholder="GA 01 AB 1234" /></F>
          <F label="Mobile number"><div className="flex"><span className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm">+91</span><Input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className="rounded-l-none" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })} placeholder="10-digit number" /></div></F>
          <F label="Model name"><Input required value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} placeholder="e.g. TVS Jupiter" /></F>
          <F label="Vehicle date"><Input required type="date" value={f.vehicleDate} onChange={(e) => setF({ ...f, vehicleDate: e.target.value })} /></F>
          <F label="Customer issue (optional)"><Textarea rows={2} value={f.issue} onChange={(e) => setF({ ...f, issue: e.target.value })} /></F>
          <Button type="submit" size="lg" className="w-full">Create lead</Button>
        </form>
      </div>
    </Shell>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
