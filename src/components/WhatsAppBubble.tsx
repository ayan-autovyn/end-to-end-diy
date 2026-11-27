import { CheckCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Message } from "@/lib/store";

/** Renders `*bold*` markers used in WhatsApp message text. */
function renderText(text: string) {
  return text.split("\n").map((line, i) => (
    <p key={i} className={line === "" ? "h-2" : ""}>
      {line.split(/(\*[^*]+\*|https?:\/\/\S+)/g).map((part, j) => {
        const trackingId = part.match(/^https?:\/\/[^/]+\/track\/([^/?#]+)\/?(?:[?#].*)?$/)?.[1];
        return trackingId ? (
          <Link key={j} to="/track/$leadId" params={{ leadId: trackingId }} className="font-semibold text-info underline">Open live tracking</Link>
        ) : part.startsWith("http") ? (
          <a key={j} href={part} className="font-semibold text-info underline">Open live tracking</a>
        ) : part.startsWith("*") && part.endsWith("*") ? (
          <strong key={j} className="font-semibold">{part.slice(1, -1)}</strong>
        ) : (
          part
        );
      })}
    </p>
  ));
}

export function WhatsAppBubble({ message }: { message: Message }) {
  return (
    <div className="rounded-xl border bg-[oklch(0.93_0.03_150)] p-3">
      {/* WhatsApp-style chat background */}
      <div className="flex items-center gap-2 text-xs font-semibold text-success">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-[10px] font-bold text-success-foreground">WA</span>
        {message.to}
      </div>
      <div className="mt-2 max-w-[92%] rounded-lg rounded-tl-none bg-card p-3 shadow-sm">
        <div className="text-[13px] leading-snug text-card-foreground">{renderText(message.text)}</div>
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          {message.at}
          <CheckCheck className="h-3.5 w-3.5 text-info" />
        </div>
      </div>
    </div>
  );
}
