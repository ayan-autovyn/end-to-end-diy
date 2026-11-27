import { describe, expect, it } from "vitest";
import { PSF_STEPS, nextStep } from "@/lib/psf";

describe("PSF voice bot flow", () => {
  it("starts with the 0–10 rating followed by the four requested questions", () => {
    expect(PSF_STEPS[0]?.id).toBe("nps");
    expect(PSF_STEPS[0]?.options).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(nextStep("nps", {})?.id).toBe("running");
    expect(nextStep("running", { running: "Yes" })?.id).toBe("clean");
    expect(nextStep("clean", {})?.id).toBe("staff");
    expect(nextStep("staff", {})?.id).toBe("time");
    expect(nextStep("time", {})).toBeUndefined();
  });

  it("contains no questions beyond the rating, four service questions and conditional issue reason", () => {
    expect(PSF_STEPS.map((step) => step.id)).toEqual([
      "nps",
      "running",
      "runningIssue",
      "clean",
      "staff",
      "time",
    ]);
  });

  it("asks the issue reason only when the vehicle is not running good", () => {
    expect(nextStep("running", { running: "No" })?.id).toBe("runningIssue");
    expect(nextStep("runningIssue", { running: "No" })?.id).toBe("clean");
    expect(nextStep("running", { running: "Yes" })?.id).toBe("clean");
  });
});
