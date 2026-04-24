import { afterEach, describe, expect, it } from "vitest";
import {
  drainSystemEvents,
  peekSystemEvents,
  resetSystemEventsForTest,
} from "../infra/system-events.js";
import {
  enqueueConfigRecoveryNotice,
  formatConfigRecoveryNotice,
} from "./config-recovery-notice.js";

describe("config recovery notice", () => {
  afterEach(() => {
    resetSystemEventsForTest();
  });

  it("formats a prompt-facing warning for recovered configs", () => {
    expect(
      formatConfigRecoveryNotice({
        phase: "startup",
        reason: "startup-invalid-config",
        configPath: "/home/test/.skillset/skillset.json",
      }),
    ).toBe(
      "Config recovery warning: SkillSet restored skillset.json from the last-known-good backup during startup (startup-invalid-config). The rejected config was invalid and was preserved as a timestamped .clobbered.* file. Do not write skillset.json again unless you validate the full config first.",
    );
  });

  it("queues the notice for the main agent session", () => {
    expect(
      enqueueConfigRecoveryNotice({
        cfg: {},
        phase: "reload",
        reason: "reload-invalid-config",
        configPath: "/home/test/.skillset/skillset.json",
      }),
    ).toBe(true);

    expect(peekSystemEvents("agent:main:main")).toHaveLength(1);
    expect(drainSystemEvents("agent:main:main")[0]).toContain(
      "Do not write skillset.json again unless you validate the full config first.",
    );
  });
});
