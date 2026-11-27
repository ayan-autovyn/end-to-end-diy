import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AI_CALL_WAIT_MS, useAiCallCountdown } from "@/lib/use-ai-call-countdown";

afterEach(() => vi.useRealTimers());

describe("DIY Agentic AI call countdown", () => {
  it("waits exactly two minutes before the outbound call can connect", () => {
    vi.useFakeTimers();
    expect(AI_CALL_WAIT_MS).toBe(120_000);
    const { result, rerender, unmount } = renderHook(() => useAiCallCountdown(true));
    expect(result.current).toBe(120);
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current).toBe(60);
    rerender();
    act(() => vi.advanceTimersByTime(59_000));
    expect(result.current).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(0);
    unmount();
  });

  it("does not schedule a countdown for customer-initiated inbound calls", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useAiCallCountdown(false));
    act(() => vi.advanceTimersByTime(120_000));
    expect(result.current).toBe(120);
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });
});