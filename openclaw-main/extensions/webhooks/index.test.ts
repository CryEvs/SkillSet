import { describe, expect, it, vi } from "vitest";
import { createTestPluginApi } from "../../test/helpers/plugins/plugin-api.js";
import type { SkillSetPluginApi } from "./api.js";
import plugin from "./index.js";

function createApi(params?: {
  pluginConfig?: SkillSetPluginApi["pluginConfig"];
  registerHttpRoute?: SkillSetPluginApi["registerHttpRoute"];
  logger?: SkillSetPluginApi["logger"];
}): SkillSetPluginApi {
  return createTestPluginApi({
    id: "webhooks",
    name: "Webhooks",
    source: "test",
    pluginConfig: params?.pluginConfig ?? {},
    runtime: {
      taskFlow: {
        bindSession: vi.fn(({ sessionKey }: { sessionKey: string }) => ({ sessionKey })),
      },
    } as unknown as SkillSetPluginApi["runtime"],
    registerHttpRoute: params?.registerHttpRoute ?? vi.fn(),
    logger:
      params?.logger ??
      ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      } as SkillSetPluginApi["logger"]),
  });
}

describe("webhooks plugin registration", () => {
  it("registers SecretRef-backed routes synchronously", () => {
    const registerHttpRoute = vi.fn();

    const result = plugin.register(
      createApi({
        pluginConfig: {
          routes: {
            zapier: {
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "SKILLSET_WEBHOOK_SECRET",
              },
            },
          },
        },
        registerHttpRoute,
      }),
    );

    expect(result).toBeUndefined();
    expect(registerHttpRoute).toHaveBeenCalledTimes(1);
    expect(registerHttpRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/plugins/webhooks/zapier",
        auth: "plugin",
        match: "exact",
        replaceExisting: true,
      }),
    );
  });
});
