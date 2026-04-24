import { describe, expect, it } from "vitest";
import type { PluginInstallRecord } from "../config/types.plugins.js";
import { resolvePluginUpdateSelection } from "./plugins-update-selection.js";

function createNpmInstall(params: {
  spec: string;
  installPath?: string;
  resolvedName?: string;
}): PluginInstallRecord {
  return {
    source: "npm",
    spec: params.spec,
    installPath: params.installPath ?? "/tmp/plugin",
    ...(params.resolvedName ? { resolvedName: params.resolvedName } : {}),
  };
}

describe("resolvePluginUpdateSelection", () => {
  it("maps an explicit unscoped npm dist-tag update to the tracked plugin id", () => {
    expect(
      resolvePluginUpdateSelection({
        installs: {
          "skillset-codex-app-server": createNpmInstall({
            spec: "skillset-codex-app-server",
            installPath: "/tmp/skillset-codex-app-server",
            resolvedName: "skillset-codex-app-server",
          }),
        },
        rawId: "skillset-codex-app-server@beta",
      }),
    ).toEqual({
      pluginIds: ["skillset-codex-app-server"],
      specOverrides: {
        "skillset-codex-app-server": "skillset-codex-app-server@beta",
      },
    });
  });

  it("maps an explicit scoped npm dist-tag update to the tracked plugin id", () => {
    expect(
      resolvePluginUpdateSelection({
        installs: {
          "voice-call": createNpmInstall({
            spec: "@skillset/voice-call",
            installPath: "/tmp/voice-call",
            resolvedName: "@skillset/voice-call",
          }),
        },
        rawId: "@skillset/voice-call@beta",
      }),
    ).toEqual({
      pluginIds: ["voice-call"],
      specOverrides: {
        "voice-call": "@skillset/voice-call@beta",
      },
    });
  });

  it("maps an explicit npm version update to the tracked plugin id", () => {
    expect(
      resolvePluginUpdateSelection({
        installs: {
          "skillset-codex-app-server": createNpmInstall({
            spec: "skillset-codex-app-server",
            installPath: "/tmp/skillset-codex-app-server",
            resolvedName: "skillset-codex-app-server",
          }),
        },
        rawId: "skillset-codex-app-server@0.2.0-beta.4",
      }),
    ).toEqual({
      pluginIds: ["skillset-codex-app-server"],
      specOverrides: {
        "skillset-codex-app-server": "skillset-codex-app-server@0.2.0-beta.4",
      },
    });
  });

  it("keeps recorded npm tags when update is invoked by plugin id", () => {
    expect(
      resolvePluginUpdateSelection({
        installs: {
          "skillset-codex-app-server": createNpmInstall({
            spec: "skillset-codex-app-server@beta",
            installPath: "/tmp/skillset-codex-app-server",
            resolvedName: "skillset-codex-app-server",
          }),
        },
        rawId: "skillset-codex-app-server",
      }),
    ).toEqual({
      pluginIds: ["skillset-codex-app-server"],
    });
  });

  it("maps a bare scoped npm package update to the tracked plugin id", () => {
    expect(
      resolvePluginUpdateSelection({
        installs: {
          "lossless-claw": createNpmInstall({
            spec: "@martian-engineering/lossless-claw@0.9.0",
            installPath: "/tmp/lossless-claw",
            resolvedName: "@martian-engineering/lossless-claw",
          }),
        },
        rawId: "@martian-engineering/lossless-claw",
      }),
    ).toEqual({
      pluginIds: ["lossless-claw"],
      specOverrides: {
        "lossless-claw": "@martian-engineering/lossless-claw",
      },
    });
  });
});
