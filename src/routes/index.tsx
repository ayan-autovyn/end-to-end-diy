import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, Wrench, ShieldCheck, ArrowRight, Bot, MessageCircle, Repeat } from "lucide-react";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TVS Moto Sole · DIY Job Card & Service" },
      { name: "description", content: "Scan, create your job card and track service at the TVS Moto Sole service station in Goa." },
      { property: "og:title", content: "TVS Moto Sole · DIY Job Card & Service" },
      { property: "og:description", content: "Scan, create your job card and track service at the TVS Moto Sole service station in Goa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const apps = [
  { to: "/diy" as const, icon: QrCode, tag: "Customer", title: "DIY Job Card", body: "What opens when a rider scans the QR standee: verify mobile, then fill a form or talk to the AI bot." },
  { to: "/advisor" as const, icon: Wrench, tag: "Service Advisor", title: "Advisor App", body: "OTP login, assigned leads by status, stage-by-stage service tracking, Ready for delivery and Delivered." },
  { to: "/admin" as const, icon: ShieldCheck, tag: "Admin", title: "Admin Console", body: "Onboard advisors, toggle active and availability for round-robin, and watch WhatsApp notifications." },
];

function Index() {
  return (
    <Shell>
      <section className="grid-bg relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-primary-foreground">
        <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-accent">Goa · Event service station</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-[1.05]">Scan. Book. Ride out serviced.</h1>
        <p className="mt-5 max-w-xl text-primary-foreground/80">One flow from QR scan to post-service feedback — DIY job cards, AI voice bot, round-robin allocation and live service tracking.</p>
        <div className="mt-8 flex flex-wrap gap-6 text-sm text-primary-foreground/80">
          <span className="flex items-center gap-2"><Bot className="h-4 w-4 text-accent" /> Agentic AI voice bot</span>
          <span className="flex items-center gap-2"><Repeat className="h-4 w-4 text-accent" /> Round-robin allocation</span>
          <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-accent" /> WhatsApp alerts</span>
        </div>
      </section>
      <section className="mt-8 grid gap-4">
        {apps.map((a) => (
          <Link key={a.to} to={a.to} className="group rounded-xl border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
            <div className="flex items-center justify-between">
              <a.icon className="h-8 w-8 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{a.tag}</span>
            </div>
            <h2 className="mt-6 font-display text-2xl font-extrabold">{a.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{a.body}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
        ))}
      </section>
    </Shell>
  );
}
