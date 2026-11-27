import { useSyncExternalStore } from "react";

export const STAGES = ["JC Open", "Washing", "Bay", "Ready for delivery"] as const;
export type LeadStatus = "Open" | "In Progress" | "Ready for delivery" | "Delivered";
export type Channel = "AI Outbound Call" | "AI Inbound Call" | "DIY Form" | "Created by SA";

export type Advisor = { id: string; name: string; phone: string; active: boolean; available: boolean };
export type Lead = {
  id: string; name: string; regNo: string; phone: string; model: string; vehicleDate: string; odometer: string; issue: string;
  channel: Channel; advisorId: string; jcCreated: boolean;
  status: LeadStatus; stagesDone: number; createdAt: string; psf?: Psf; readyDueAt?: number; customerReplied?: boolean;
};
export type Psf = { nps: number; answers: Record<string, string>; at: string };
/** If the customer does not reply to the ready-for-delivery WhatsApp within this window, the AI bot calls. */
export const READY_REPLY_WAIT_MS = 5 * 60 * 1000;
export type Message = { to: string; text: string; at: string };
/** Customer is promised an SA call back within this window after asking the bot. */
export const CALLBACK_WAIT_MS = 2 * 60 * 1000;
export type Callback = { id: string; leadId: string; step: string; at: string; dueAt: number; status: "Pending" | "Called" };
export const formatCountdown = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
type State = { advisors: Advisor[]; leads: Lead[]; rrIndex: number; whatsapp: Message[]; callbacks: Callback[] };

let state: State = {
  advisors: [
    { id: "sa1", name: "Rohan Naik", phone: "9876500001", active: true, available: true },
    { id: "sa2", name: "Priya Dessai", phone: "9876500002", active: true, available: true },
    { id: "sa3", name: "Anil Gaonkar", phone: "9876500003", active: false, available: false },
  ],
  leads: [
    { id: "JC-1001", name: "Kunal Shetty", regNo: "GA 01 AB 4521", phone: "9822011111", model: "TVS Apache RTR 160", vehicleDate: "2023-03-14", odometer: "12450", issue: "Rear brake feels soft", channel: "DIY Form", advisorId: "sa1", jcCreated: true, status: "In Progress", stagesDone: 2, createdAt: "10:12" },
    { id: "JC-1002", name: "Maria Fernandes", regNo: "GA 03 K 9087", phone: "9822022222", model: "TVS Jupiter", vehicleDate: "2022-11-02", odometer: "8210", issue: "Periodic service", channel: "AI Outbound Call", advisorId: "sa2", jcCreated: false, status: "Open", stagesDone: 0, createdAt: "10:25" },
    { id: "JC-1003", name: "Arjun Kamat", regNo: "MH 07 Q 3311", phone: "9822033333", model: "TVS Raider 125", vehicleDate: "2021-07-21", odometer: "23100", issue: "Noise at idle", channel: "AI Inbound Call", advisorId: "sa1", jcCreated: true, status: "Ready for delivery", stagesDone: 4, readyDueAt: Date.now() + READY_REPLY_WAIT_MS, customerReplied: false, createdAt: "09:48" },
    { id: "JC-1004", name: "Sneha Parab", regNo: "GA 07 C 1209", phone: "9822044444", model: "TVS NTORQ 125", vehicleDate: "2024-01-09", odometer: "4300", issue: "Washing only", channel: "DIY Form", advisorId: "sa2", jcCreated: true, status: "Delivered", stagesDone: 4, createdAt: "09:15" },
    { id: "JC-1005", name: "Vikram Sawant", regNo: "GA 02 M 6610", phone: "9822055555", model: "TVS Ronin", vehicleDate: "2023-09-30", odometer: "6800", issue: "Chain noise while riding", channel: "DIY Form", advisorId: "sa1", jcCreated: false, status: "Open", stagesDone: 0, createdAt: "10:40" },
  ],
  rrIndex: 0,
  whatsapp: [],
  callbacks: [{ id: "cb-1", leadId: "JC-1003", step: "Recommend score", at: "09:58", dueAt: Date.now() + CALLBACK_WAIT_MS, status: "Pending" }],
};
let nextId = 1006;
let nextCb = 2;
const listeners = new Set<() => void>();
const set = (fn: (s: State) => State) => { state = fn(state); listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}
export const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Round-robin over active + available advisors. */
export function pickRoundRobin(advisors: Advisor[], rrIndex: number): { id: string | null; next: number } {
  const pool = advisors.filter((a) => a.active && a.available);
  if (pool.length === 0) return { id: null, next: rrIndex };
  const a = pool[rrIndex % pool.length]!;
  return { id: a.id, next: rrIndex + 1 };
}

export const ACK = "Thank you for completing the DIY Job Card process. Your vehicle details have been successfully submitted. Our Service Advisor will attend to your vehicle shortly.";

export const trackUrl = (id: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/track/${id}`;

/** WhatsApp notification text sent to the service advisor when a lead is assigned. */
export function advisorMessage(lead: Lead): string {
  return `*New Lead Assigned* 🛵\n\n*Customer:* ${lead.name}\n*Vehicle:* ${lead.regNo}${lead.model ? ` · ${lead.model}` : ""}\n*Odometer:* ${lead.odometer || "—"} km\n*Customer issue:* ${lead.issue || "Not reported"}\n*Source:* ${lead.channel}\n\nPlease attend to the vehicle and create the job card.`;
}
export function jcCreatedMessage(lead: Lead): string {
  return `*Job Card Created* ✅\n\nHi ${lead.name.split(" ")[0]}, the job card for your vehicle *${lead.regNo}* has been created.\n\nTrack your vehicle live here:\n${trackUrl(lead.id)}\n\nYou can also watch live status on the big screen at the event cafeteria.`;
}
export function stageNudge(lead: Lead, stageIndex: number): string {
  return `*Service update* 🔧\n\nYour vehicle *${lead.regNo}* is now in *${STAGES[stageIndex]}* (${stageIndex + 1}/${STAGES.length}).\n\nTrack live: ${trackUrl(lead.id)}`;
}

export type LeadInput = Pick<Lead, "name" | "regNo" | "phone" | "odometer" | "issue" | "channel"> & Partial<Pick<Lead, "model" | "vehicleDate">>;

export function createLead(input: LeadInput, forceAdvisorId?: string): Lead {
  const rr = pickRoundRobin(state.advisors, state.rrIndex);
  const advisorId = forceAdvisorId ?? rr.id;
  const lead: Lead = { model: "", vehicleDate: "", ...input, id: `JC-${nextId++}`, advisorId: advisorId ?? "", jcCreated: false, status: "Open", stagesDone: 0, createdAt: now() };
  const sa = state.advisors.find((a) => a.id === advisorId);
  set((s) => ({
    ...s, rrIndex: forceAdvisorId ? s.rrIndex : rr.next, leads: [lead, ...s.leads],
    whatsapp: [
      ...(sa && !forceAdvisorId ? [{ to: `SA · ${sa.name}`, text: advisorMessage(lead), at: now() }] : []),
      ...(input.channel !== "Created by SA" ? [{ to: `Customer · ${lead.phone}`, text: ACK, at: now() }] : []),
      ...s.whatsapp,
    ],
  }));
  return lead;
}
const patch = (id: string, fn: (l: Lead) => Lead) => set((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? fn(l) : l)) }));
const send = (m: Message) => set((s) => ({ ...s, whatsapp: [m, ...s.whatsapp] }));
const leadById = (id: string) => state.leads.find((l) => l.id === id);

export const updateLead = (id: string, p: Partial<Pick<Lead, "name" | "regNo" | "phone" | "model" | "vehicleDate" | "odometer" | "issue">>) => patch(id, (l) => ({ ...l, ...p }));
export function markJcCreated(id: string) {
  const l = leadById(id);
  if (!l || l.jcCreated) return;
  patch(id, (x) => ({ ...x, jcCreated: true, stagesDone: Math.max(x.stagesDone, 1) }));
  send({ to: `Customer · ${l.phone}`, text: jcCreatedMessage(l), at: now() });
}
/** Marks the current stage done. Returns the customer WhatsApp that was sent, or null when the
 *  transition is silent (moving into "Ready for delivery" waits for the advisor's confirm). */
export function completeStage(id: string): Message | null {
  const l = leadById(id);
  if (!l || !l.jcCreated || l.stagesDone >= STAGES.length || l.status === "Delivered") return null;
  const next = l.stagesDone + 1;
  const becameReady = STAGES[next - 1] === "Ready for delivery";
  const entering = STAGES[next];
  patch(id, (x) => ({
    ...x,
    stagesDone: next,
    status: becameReady ? "Ready for delivery" : "In Progress",
    ...(becameReady ? { readyDueAt: Date.now() + READY_REPLY_WAIT_MS, customerReplied: false } : {}),
  }));
  if (becameReady) {
    const m: Message = { to: `Customer · ${l.phone}`, text: readyMessage(l), at: now() };
    send(m);
    return m;
  }
  if (entering) {
    const m: Message = { to: `Customer · ${l.phone}`, text: stageNudge(l, next), at: now() };
    send(m);
    return m;
  }
  return null;
}
export function readyMessage(lead: Lead): string {
  return `*Vehicle Ready for Delivery* 🎉\n\nHi ${lead.name.split(" ")[0]}, your vehicle *${lead.regNo}* is serviced and ready for pickup at the delivery counter.\n\nPlease reply *YES* to confirm you are coming.\n\nTrack live: ${trackUrl(lead.id)}`;
}
export const markCustomerReplied = (id: string) => patch(id, (l) => ({ ...l, customerReplied: true }));
export const markDelivered = (id: string) => patch(id, (l) => (l.status === "Ready for delivery" ? { ...l, status: "Delivered", stagesDone: STAGES.length } : l));
export const recordPsf = (id: string, psf: Psf) => patch(id, (l) => ({ ...l, psf }));
export function requestCallback(leadId: string, step: string) {
  const dueAt = Date.now() + CALLBACK_WAIT_MS;
  set((s) => ({ ...s, callbacks: [{ id: `cb-${nextCb++}`, leadId, step, at: now(), dueAt, status: "Pending" }, ...s.callbacks] }));
}
export const markCalled = (cbId: string) => set((s) => ({ ...s, callbacks: s.callbacks.map((c) => (c.id === cbId ? { ...c, status: "Called" } : c)) }));
export function addAdvisor(name: string, phone: string) {
  set((s) => ({ ...s, advisors: [...s.advisors, { id: `sa-${phone}`, name, phone, active: true, available: true }] }));
}
export function updateAdvisor(id: string, p: Partial<Advisor>) {
  set((s) => ({ ...s, advisors: s.advisors.map((a) => (a.id === id ? { ...a, ...p } : a)) }));
}

// Advisor session (mock OTP login)
let session: string | null = null;
const sl = new Set<() => void>();
export function useSession() {
  return useSyncExternalStore((l) => { sl.add(l); return () => { sl.delete(l); }; }, () => session, () => null);
}
export function setSession(id: string | null) { session = id; sl.forEach((l) => l()); }
export function findActiveAdvisorByPhone(phone: string) {
  return state.advisors.find((a) => a.phone === phone && a.active) ?? null;
}
export const DEMO_OTP = "1234";
export const BOT_NUMBER = "+91 80 4718 2026";
