import type { LeadStatus } from "@/lib/store";
const cls: Record<LeadStatus, string> = {
  Open: "bg-info/15 text-info",
  "In Progress": "bg-warning/25 text-foreground",
  "Ready for delivery": "bg-success/15 text-success",
  Delivered: "bg-violet/15 text-violet",
};
export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls[status]}`}>{status}</span>;
}
