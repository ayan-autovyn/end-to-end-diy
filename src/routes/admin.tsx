import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { addAdvisor, pickRoundRobin, updateAdvisor, useStore } from "@/lib/store";
import { TvsLogo } from "@/components/TvsLogo";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · TVS Moto Sole" },
      { name: "description", content: "Manage service advisors and round-robin allocation." },
      { property: "og:title", content: "Admin · TVS Moto Sole" },
      { property: "og:description", content: "Manage service advisors and round-robin allocation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const advisors = useStore((s) => s.advisors);
  const leads = useStore((s) => s.leads);
  const rr = useStore((s) => s.rrIndex);
  const [n, setN] = useState({ name: "", phone: "" });
  const nextId = pickRoundRobin(advisors, rr).id;

  return (
    <Shell title="Admin">
      <TvsLogo className="mb-3 h-8 w-auto" />
      <h1 className="font-display text-3xl font-black">Admin console</h1>
      <div className="mt-6 grid gap-6">
        <div className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <h2 className="font-display text-lg font-extrabold">Service Advisors</h2>
            <p className="text-sm text-muted-foreground">Only active + available advisors receive leads in round-robin order.</p>
          </div>
          <div className="divide-y">
            {advisors.map((a) => {
              const load = leads.filter((l) => l.advisorId === a.id && l.status !== "Delivered").length;
              return (
                <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.name} {nextId === a.id && <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">Next</span>}</p>
                    <p className="text-sm text-muted-foreground">+91 {a.phone} · {load} active vehicles</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-2">Active <Switch checked={a.active} onCheckedChange={(v) => updateAdvisor(a.id, { active: v, available: v ? a.available : false })} /></label>
                    <label className="flex items-center gap-2">Available <Switch disabled={!a.active} checked={a.available} onCheckedChange={(v) => updateAdvisor(a.id, { available: v })} /></label>
                  </div>
                </div>
              );
            })}
          </div>
          <form className="flex flex-wrap gap-2 border-t p-4" onSubmit={(e) => { e.preventDefault(); addAdvisor(n.name, n.phone); setN({ name: "", phone: "" }); }}>
            <Input required className="min-w-40 flex-1" placeholder="Advisor name" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} />
            <Input required className="w-40" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Mobile" value={n.phone} onChange={(e) => setN({ ...n, phone: e.target.value.replace(/\D/g, "") })} />
            <Button type="submit"><UserPlus className="h-4 w-4" /> Add</Button>
          </form>
        </div>
      </div>
    </Shell>
  );
}
