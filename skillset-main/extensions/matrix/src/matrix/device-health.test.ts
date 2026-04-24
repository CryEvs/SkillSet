import { describe, expect, it } from "vitest";
import { isSkillSetManagedMatrixDevice, summarizeMatrixDeviceHealth } from "./device-health.js";

describe("matrix device health", () => {
  it("detects SkillSet-managed device names", () => {
    expect(isSkillSetManagedMatrixDevice("SkillSet Gateway")).toBe(true);
    expect(isSkillSetManagedMatrixDevice("SkillSet Debug")).toBe(true);
    expect(isSkillSetManagedMatrixDevice("Element iPhone")).toBe(false);
    expect(isSkillSetManagedMatrixDevice(null)).toBe(false);
  });

  it("summarizes stale SkillSet-managed devices separately from the current device", () => {
    const summary = summarizeMatrixDeviceHealth([
      {
        deviceId: "du314Zpw3A",
        displayName: "SkillSet Gateway",
        current: true,
      },
      {
        deviceId: "BritdXC6iL",
        displayName: "SkillSet Gateway",
        current: false,
      },
      {
        deviceId: "G6NJU9cTgs",
        displayName: "SkillSet Debug",
        current: false,
      },
      {
        deviceId: "phone123",
        displayName: "Element iPhone",
        current: false,
      },
    ]);

    expect(summary.currentDeviceId).toBe("du314Zpw3A");
    expect(summary.currentSkillSetDevices).toEqual([
      expect.objectContaining({ deviceId: "du314Zpw3A" }),
    ]);
    expect(summary.staleSkillSetDevices).toEqual([
      expect.objectContaining({ deviceId: "BritdXC6iL" }),
      expect.objectContaining({ deviceId: "G6NJU9cTgs" }),
    ]);
  });
});
