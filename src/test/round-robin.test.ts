import { describe, expect, it } from "vitest";
import { pickRoundRobin, type Advisor } from "@/lib/store";

const a = (id: string, active = true, available = true): Advisor => ({ id, name: id, phone: id, active, available });

describe("round-robin allocation", () => {
  it("cycles through advisors in order", () => {
    const list = [a("x"), a("y")];
    expect([0, 1, 2].map((i) => pickRoundRobin(list, i).id)).toEqual(["x", "y", "x"]);
  });
  it("skips inactive or unavailable advisors", () => {
    expect(pickRoundRobin([a("x", false), a("y", true, false), a("z")], 0).id).toBe("z");
  });
  it("returns null when nobody is eligible", () => {
    expect(pickRoundRobin([a("x", false)], 0).id).toBeNull();
  });
});
