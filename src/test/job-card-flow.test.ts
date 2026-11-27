import { describe, expect, it } from "vitest";
import { CALLBACK_WAIT_MS, STAGES, advisorMessage, completeStage, createLead, formatCountdown, jcCreatedMessage, markDelivered, markJcCreated, requestCallback, useStore } from "@/lib/store";
import { PSF_STEPS } from "@/lib/psf";
import { renderHook } from "@testing-library/react";

const snap = () => renderHook(() => useStore((s) => s)).result.current;

describe("job card flow", () => {
  it("JC Open is the first pipeline step and is completed by the JC Created tap", () => {
    expect(STAGES[0]).toBe("JC Open");
    const l = createLead({ name: "Test User", regNo: "GA 01 X 1", phone: "9000000001", odometer: "", issue: "", channel: "Created by SA", model: "Jupiter", vehicleDate: "2024-01-01" }, "sa1");
    expect(snap().leads.find((x) => x.id === l.id)!.stagesDone).toBe(0);
    markJcCreated(l.id);
    expect(snap().leads.find((x) => x.id === l.id)!.stagesDone).toBe(1);
  });
  it("stages can't start until JC is created, then each stage nudges the customer", () => {
    const l = createLead({ name: "Test User", regNo: "GA 01 X 1", phone: "9000000001", odometer: "", issue: "", channel: "Created by SA", model: "Jupiter", vehicleDate: "2024-01-01" }, "sa1");
    completeStage(l.id);
    expect(snap().leads.find((x) => x.id === l.id)!.stagesDone).toBe(0);
    markJcCreated(l.id);
    expect(snap().whatsapp[0]!.text).toContain(`/track/${l.id}`);
    completeStage(l.id);
    expect(snap().whatsapp[0]!.text).toContain("Bay");
  });
  it("Ready for delivery is the last stage, and Delivered only follows it", () => {
    expect([...STAGES]).toEqual(["JC Open", "Washing", "Bay", "Ready for delivery"]);
    const l = createLead({ name: "Test User", regNo: "GA 01 X 1", phone: "9000000001", odometer: "", issue: "", channel: "Created by SA", model: "Jupiter", vehicleDate: "2024-01-01" }, "sa1");
    const id = l.id;
    const status = () => snap().leads.find((x) => x.id === id)!.status;
    const done = () => snap().leads.find((x) => x.id === id)!.stagesDone;
    markJcCreated(id);
    markDelivered(id);
    expect(status()).toBe("Open");
    completeStage(id);
    completeStage(id);
    expect(done()).toBe(3);
    expect(status()).toBe("In Progress");
    completeStage(id);
    expect(done()).toBe(4);
    expect(status()).toBe("Ready for delivery");
    markDelivered(id);
    expect(status()).toBe("Delivered");
  });
  it("records a callback request", () => {
    requestCallback("JC-1001", "Cost");
    expect(snap().callbacks[0]).toMatchObject({ leadId: "JC-1001", step: "Cost", status: "Pending" });
  });
  it("promises the customer an SA call back within 2 minutes", () => {
    expect(CALLBACK_WAIT_MS).toBe(120_000);
    expect(formatCountdown(120)).toBe("2:00");
    const before = Date.now();
    requestCallback("JC-1002", "Recommend score");
    const cb = snap().callbacks[0]!;
    expect(cb.dueAt - before).toBeGreaterThanOrEqual(CALLBACK_WAIT_MS - 5);
    expect(cb.dueAt - before).toBeLessThanOrEqual(CALLBACK_WAIT_MS + 500);
  });
  it("PSF has no appointment question", () => {
    expect(PSF_STEPS.some((s) => s.id === "appointment")).toBe(false);
  });
  it("does not show the internal JC ID in advisor or customer messages", () => {
    const lead = snap().leads[0]!;
    expect(advisorMessage(lead)).not.toContain(lead.id);
    expect(jcCreatedMessage(lead).replace(/https?:\/\/\S+/g, "")).not.toContain(lead.id);
  });
});

import { READY_REPLY_WAIT_MS } from "@/lib/store";
describe("ready for delivery", () => {
  it("marking the Ready for delivery stage sends the WhatsApp and waits 5 minutes for a reply before the AI call", () => {
    expect(READY_REPLY_WAIT_MS).toBe(300_000);
    const l = createLead({ name: "Ready User", regNo: "GA 09 R 1", phone: "9000000009", odometer: "", issue: "", channel: "Created by SA" }, "sa1");
    markJcCreated(l.id);
    for (let i = 1; i < STAGES.length - 1; i++) completeStage(l.id);
    expect(snap().leads.find((x) => x.id === l.id)!.stagesDone).toBe(3);
    const before = Date.now();
    expect(completeStage(l.id)).not.toBeNull();
    const s = snap();
    expect(s.whatsapp[0]!.text).toContain("Ready for Delivery");
    const lead = s.leads.find((x) => x.id === l.id)!;
    expect(lead.status).toBe("Ready for delivery");
    const due = lead.readyDueAt!;
    expect(due - before).toBeGreaterThanOrEqual(READY_REPLY_WAIT_MS - 5);
  });
  it("moving into the Ready for delivery stage nudges the customer", () => {
    const l = createLead({ name: "Quiet User", regNo: "GA 09 Q 1", phone: "9000000008", odometer: "", issue: "", channel: "Created by SA" }, "sa1");
    markJcCreated(l.id);
    completeStage(l.id);
    const afterBayNudge = snap().whatsapp.length;
    expect(snap().whatsapp[0]!.text).toContain("Bay");
    completeStage(l.id);
    expect(snap().whatsapp.length).toBe(afterBayNudge + 1);
    expect(snap().whatsapp[0]!.text).toContain("Ready for delivery");
    expect(snap().leads.find((x) => x.id === l.id)!.stagesDone).toBe(3);
  });
});
