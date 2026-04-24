import { beforeEach, describe, expect, it, vi } from "vitest";

type DiscoverSkillSetPlugins = typeof import("./discovery.js").discoverSkillSetPlugins;
type LoadPluginManifest = typeof import("./manifest.js").loadPluginManifest;
type ResolveManifestProviderAuthChoices =
  typeof import("./provider-auth-choices.js").resolveManifestProviderAuthChoices;

const discoverSkillSetPlugins = vi.hoisted(() =>
  vi.fn<DiscoverSkillSetPlugins>(() => ({ candidates: [], diagnostics: [] })),
);
vi.mock("./discovery.js", () => ({
  discoverSkillSetPlugins,
}));

const loadPluginManifest = vi.hoisted(() => vi.fn<LoadPluginManifest>());
vi.mock("./manifest.js", async () => {
  const actual = await vi.importActual<typeof import("./manifest.js")>("./manifest.js");
  return {
    ...actual,
    loadPluginManifest,
  };
});

const resolveManifestProviderAuthChoices = vi.hoisted(() =>
  vi.fn<ResolveManifestProviderAuthChoices>(() => []),
);
vi.mock("./provider-auth-choices.js", () => ({
  resolveManifestProviderAuthChoices,
}));

import {
  resolveProviderInstallCatalogEntries,
  resolveProviderInstallCatalogEntry,
} from "./provider-install-catalog.js";

describe("provider install catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    discoverSkillSetPlugins.mockReturnValue({
      candidates: [],
      diagnostics: [],
    });
    resolveManifestProviderAuthChoices.mockReturnValue([]);
  });

  it("merges manifest auth-choice metadata with discovery install metadata", () => {
    discoverSkillSetPlugins.mockReturnValue({
      candidates: [
        {
          idHint: "openai",
          origin: "bundled",
          rootDir: "/repo/extensions/openai",
          source: "/repo/extensions/openai/index.ts",
          workspaceDir: "/repo",
          packageName: "@skillset/openai",
          packageDir: "/repo/extensions/openai",
          packageManifest: {
            install: {
              npmSpec: "@skillset/openai@1.2.3",
              defaultChoice: "npm",
              expectedIntegrity: "sha512-openai",
            },
          },
        },
      ],
      diagnostics: [],
    });
    loadPluginManifest.mockReturnValue({
      ok: true,
      manifestPath: "/repo/extensions/openai/skillset.plugin.json",
      manifest: {
        id: "openai",
        configSchema: {
          type: "object",
        },
      },
    });
    resolveManifestProviderAuthChoices.mockReturnValue([
      {
        pluginId: "openai",
        providerId: "openai",
        methodId: "api-key",
        choiceId: "openai-api-key",
        choiceLabel: "OpenAI API key",
        groupId: "openai",
        groupLabel: "OpenAI",
      },
    ]);

    expect(resolveProviderInstallCatalogEntries()).toEqual([
      {
        pluginId: "openai",
        providerId: "openai",
        methodId: "api-key",
        choiceId: "openai-api-key",
        choiceLabel: "OpenAI API key",
        groupId: "openai",
        groupLabel: "OpenAI",
        label: "OpenAI",
        origin: "bundled",
        install: {
          npmSpec: "@skillset/openai@1.2.3",
          localPath: "extensions/openai",
          defaultChoice: "npm",
          expectedIntegrity: "sha512-openai",
        },
      },
    ]);
  });

  it("falls back to workspace-relative local path when install metadata is sparse", () => {
    discoverSkillSetPlugins.mockReturnValue({
      candidates: [
        {
          idHint: "demo-provider",
          origin: "workspace",
          rootDir: "/repo/extensions/demo-provider",
          source: "/repo/extensions/demo-provider/index.ts",
          workspaceDir: "/repo",
          packageName: "@vendor/demo-provider",
          packageDir: "/repo/extensions/demo-provider",
          packageManifest: {},
        },
      ],
      diagnostics: [],
    });
    loadPluginManifest.mockReturnValue({
      ok: true,
      manifestPath: "/repo/extensions/demo-provider/skillset.plugin.json",
      manifest: {
        id: "demo-provider",
        configSchema: {
          type: "object",
        },
      },
    });
    resolveManifestProviderAuthChoices.mockReturnValue([
      {
        pluginId: "demo-provider",
        providerId: "demo-provider",
        methodId: "api-key",
        choiceId: "demo-provider-api-key",
        choiceLabel: "Demo Provider API key",
      },
    ]);

    expect(resolveProviderInstallCatalogEntries()).toEqual([
      {
        pluginId: "demo-provider",
        providerId: "demo-provider",
        methodId: "api-key",
        choiceId: "demo-provider-api-key",
        choiceLabel: "Demo Provider API key",
        label: "Demo Provider API key",
        origin: "workspace",
        install: {
          localPath: "extensions/demo-provider",
          defaultChoice: "local",
        },
      },
    ]);
  });

  it("resolves one installable auth choice by id", () => {
    discoverSkillSetPlugins.mockReturnValue({
      candidates: [
        {
          idHint: "vllm",
          origin: "config",
          rootDir: "/Users/test/.skillset/extensions/vllm",
          source: "/Users/test/.skillset/extensions/vllm/index.js",
          packageName: "@skillset/vllm",
          packageDir: "/Users/test/.skillset/extensions/vllm",
          packageManifest: {
            install: {
              npmSpec: "@skillset/vllm@2.0.0",
              expectedIntegrity: "sha512-vllm",
            },
          },
        },
      ],
      diagnostics: [],
    });
    loadPluginManifest.mockReturnValue({
      ok: true,
      manifestPath: "/Users/test/.skillset/extensions/vllm/skillset.plugin.json",
      manifest: {
        id: "vllm",
        configSchema: {
          type: "object",
        },
      },
    });
    resolveManifestProviderAuthChoices.mockReturnValue([
      {
        pluginId: "vllm",
        providerId: "vllm",
        methodId: "server",
        choiceId: "vllm",
        choiceLabel: "vLLM",
        groupLabel: "vLLM",
      },
    ]);

    expect(resolveProviderInstallCatalogEntry("vllm")).toEqual({
      pluginId: "vllm",
      providerId: "vllm",
      methodId: "server",
      choiceId: "vllm",
      choiceLabel: "vLLM",
      groupLabel: "vLLM",
      label: "vLLM",
      origin: "config",
      install: {
        npmSpec: "@skillset/vllm@2.0.0",
        expectedIntegrity: "sha512-vllm",
        defaultChoice: "npm",
      },
    });
  });

  it("exposes trusted registry npm specs without requiring an exact version or integrity pin", () => {
    discoverSkillSetPlugins.mockReturnValue({
      candidates: [
        {
          idHint: "vllm",
          origin: "config",
          rootDir: "/Users/test/.skillset/extensions/vllm",
          source: "/Users/test/.skillset/extensions/vllm/index.js",
          packageName: "@skillset/vllm",
          packageDir: "/Users/test/.skillset/extensions/vllm",
          packageManifest: {
            install: {
              npmSpec: "@skillset/vllm",
            },
          },
        },
      ],
      diagnostics: [],
    });
    loadPluginManifest.mockReturnValue({
      ok: true,
      manifestPath: "/Users/test/.skillset/extensions/vllm/skillset.plugin.json",
      manifest: {
        id: "vllm",
        configSchema: {
          type: "object",
        },
      },
    });
    resolveManifestProviderAuthChoices.mockReturnValue([
      {
        pluginId: "vllm",
        providerId: "vllm",
        methodId: "server",
        choiceId: "vllm",
        choiceLabel: "vLLM",
      },
    ]);

    expect(resolveProviderInstallCatalogEntry("vllm")).toEqual({
      pluginId: "vllm",
      providerId: "vllm",
      methodId: "server",
      choiceId: "vllm",
      choiceLabel: "vLLM",
      label: "vLLM",
      origin: "config",
      install: {
        npmSpec: "@skillset/vllm",
        defaultChoice: "npm",
      },
    });
  });

  it("does not expose npm install specs from untrusted package metadata", () => {
    discoverSkillSetPlugins.mockReturnValue({
      candidates: [
        {
          idHint: "demo-provider",
          origin: "global",
          rootDir: "/Users/test/.skillset/extensions/demo-provider",
          source: "/Users/test/.skillset/extensions/demo-provider/index.js",
          packageName: "@vendor/demo-provider",
          packageDir: "/Users/test/.skillset/extensions/demo-provider",
          packageManifest: {
            install: {
              npmSpec: "@vendor/demo-provider@1.2.3",
              expectedIntegrity: "sha512-demo",
            },
          },
        },
      ],
      diagnostics: [],
    });
    loadPluginManifest.mockReturnValue({
      ok: true,
      manifestPath: "/Users/test/.skillset/extensions/demo-provider/skillset.plugin.json",
      manifest: {
        id: "demo-provider",
        configSchema: {
          type: "object",
        },
      },
    });
    resolveManifestProviderAuthChoices.mockReturnValue([
      {
        pluginId: "demo-provider",
        providerId: "demo-provider",
        methodId: "api-key",
        choiceId: "demo-provider-api-key",
        choiceLabel: "Demo Provider API key",
      },
    ]);

    expect(resolveProviderInstallCatalogEntries()).toEqual([]);
  });

  it("skips untrusted workspace install candidates when requested", () => {
    discoverSkillSetPlugins.mockReturnValue({
      candidates: [
        {
          idHint: "demo-provider",
          origin: "workspace",
          rootDir: "/repo/extensions/demo-provider",
          source: "/repo/extensions/demo-provider/index.ts",
          workspaceDir: "/repo",
          packageName: "@vendor/demo-provider",
          packageDir: "/repo/extensions/demo-provider",
          packageManifest: {
            install: {
              npmSpec: "@vendor/demo-provider",
            },
          },
        },
      ],
      diagnostics: [],
    });

    expect(
      resolveProviderInstallCatalogEntries({
        config: {
          plugins: {
            enabled: false,
          },
        },
        includeUntrustedWorkspacePlugins: false,
      }),
    ).toEqual([]);
    expect(loadPluginManifest).not.toHaveBeenCalled();
  });

  it("skips untrusted workspace candidates without id hints before manifest load", () => {
    discoverSkillSetPlugins.mockReturnValue({
      candidates: [
        {
          idHint: "",
          origin: "workspace",
          rootDir: "/repo/extensions/demo-provider",
          source: "/repo/extensions/demo-provider/index.ts",
          workspaceDir: "/repo",
          packageName: "@vendor/demo-provider",
          packageDir: "/repo/extensions/demo-provider",
          packageManifest: {
            install: {
              npmSpec: "@vendor/demo-provider",
            },
          },
        },
      ],
      diagnostics: [],
    });

    expect(
      resolveProviderInstallCatalogEntries({ includeUntrustedWorkspacePlugins: false }),
    ).toEqual([]);
    expect(loadPluginManifest).not.toHaveBeenCalled();
  });
});
