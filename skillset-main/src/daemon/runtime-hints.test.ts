import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          SKILLSET_STATE_DIR: "/tmp/skillset-state",
          SKILLSET_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "skillset-gateway",
        windowsTaskName: "SkillSet Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/skillset-state/logs/gateway.log",
      "Launchd stderr (if installed): /tmp/skillset-state/logs/gateway.err.log",
      "Restart attempts: /tmp/skillset-state/logs/gateway-restart.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        env: {
          SKILLSET_STATE_DIR: "/tmp/skillset-state",
        },
        systemdServiceName: "skillset-gateway",
        windowsTaskName: "SkillSet Gateway",
      }),
    ).toEqual([
      "Logs: journalctl --user -u skillset-gateway.service -n 200 --no-pager",
      "Restart attempts: /tmp/skillset-state/logs/gateway-restart.log",
    ]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        env: {
          SKILLSET_STATE_DIR: "/tmp/skillset-state",
        },
        systemdServiceName: "skillset-gateway",
        windowsTaskName: "SkillSet Gateway",
      }),
    ).toEqual([
      'Logs: schtasks /Query /TN "SkillSet Gateway" /V /FO LIST',
      "Restart attempts: /tmp/skillset-state/logs/gateway-restart.log",
    ]);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "skillset gateway install",
        startCommand: "skillset gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.skillset.gateway.plist",
        systemdServiceName: "skillset-gateway",
        windowsTaskName: "SkillSet Gateway",
      }),
    ).toEqual([
      "skillset gateway install",
      "skillset gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.skillset.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "skillset gateway install",
        startCommand: "skillset gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.skillset.gateway.plist",
        systemdServiceName: "skillset-gateway",
        windowsTaskName: "SkillSet Gateway",
      }),
    ).toEqual([
      "skillset gateway install",
      "skillset gateway",
      "systemctl --user start skillset-gateway.service",
    ]);
  });
});
