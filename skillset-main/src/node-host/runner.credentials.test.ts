import { describe, expect, it } from "vitest";
import type { SkillSetConfig } from "../config/config.js";
import { withEnvAsync } from "../test-utils/env.js";
import { resolveNodeHostGatewayCredentials } from "./runner.js";

function createRemoteGatewayTokenRefConfig(tokenId: string): SkillSetConfig {
  return {
    secrets: {
      providers: {
        default: { source: "env" },
      },
    },
    gateway: {
      mode: "remote",
      remote: {
        token: { source: "env", provider: "default", id: tokenId },
      },
    },
  } as SkillSetConfig;
}

async function expectNoGatewayCredentials(
  config: SkillSetConfig,
  env: Record<string, string | undefined>,
) {
  await withEnvAsync(env, async () => {
    const credentials = await resolveNodeHostGatewayCredentials({ config });
    expect(credentials.token).toBeUndefined();
    expect(credentials.password).toBeUndefined();
  });
}

describe("resolveNodeHostGatewayCredentials", () => {
  it("does not inherit gateway.remote token in local mode", async () => {
    const config = {
      gateway: {
        mode: "local",
        remote: { token: "remote-only-token" },
      },
    } as SkillSetConfig;

    await expectNoGatewayCredentials(config, {
      SKILLSET_GATEWAY_TOKEN: undefined,
      SKILLSET_GATEWAY_PASSWORD: undefined,
    });
  });

  it("ignores unresolved gateway.remote token refs in local mode", async () => {
    const config = {
      secrets: {
        providers: {
          default: { source: "env" },
        },
      },
      gateway: {
        mode: "local",
        remote: {
          token: { source: "env", provider: "default", id: "MISSING_REMOTE_GATEWAY_TOKEN" },
        },
      },
    } as SkillSetConfig;

    await expectNoGatewayCredentials(config, {
      SKILLSET_GATEWAY_TOKEN: undefined,
      SKILLSET_GATEWAY_PASSWORD: undefined,
      MISSING_REMOTE_GATEWAY_TOKEN: undefined,
    });
  });

  it("resolves remote token SecretRef values", async () => {
    const config = createRemoteGatewayTokenRefConfig("REMOTE_GATEWAY_TOKEN");

    await withEnvAsync(
      {
        SKILLSET_GATEWAY_TOKEN: undefined,
        SKILLSET_GATEWAY_PASSWORD: undefined,
        REMOTE_GATEWAY_TOKEN: "token-from-ref",
      },
      async () => {
        const credentials = await resolveNodeHostGatewayCredentials({ config });
        expect(credentials.token).toBe("token-from-ref");
      },
    );
  });

  it("prefers SKILLSET_GATEWAY_TOKEN over configured refs", async () => {
    const config = createRemoteGatewayTokenRefConfig("REMOTE_GATEWAY_TOKEN");

    await withEnvAsync(
      {
        SKILLSET_GATEWAY_TOKEN: "token-from-env",
        SKILLSET_GATEWAY_PASSWORD: undefined,
        REMOTE_GATEWAY_TOKEN: "token-from-ref",
      },
      async () => {
        const credentials = await resolveNodeHostGatewayCredentials({ config });
        expect(credentials.token).toBe("token-from-env");
      },
    );
  });

  it("throws when a configured remote token ref cannot resolve", async () => {
    const config = createRemoteGatewayTokenRefConfig("MISSING_REMOTE_GATEWAY_TOKEN");

    await withEnvAsync(
      {
        SKILLSET_GATEWAY_TOKEN: undefined,
        SKILLSET_GATEWAY_PASSWORD: undefined,
        MISSING_REMOTE_GATEWAY_TOKEN: undefined,
      },
      async () => {
        await expect(resolveNodeHostGatewayCredentials({ config })).rejects.toThrow(
          "gateway.remote.token",
        );
      },
    );
  });

  it("does not resolve remote password refs when token auth is already available", async () => {
    const config = {
      secrets: {
        providers: {
          default: { source: "env" },
        },
      },
      gateway: {
        mode: "remote",
        remote: {
          token: { source: "env", provider: "default", id: "REMOTE_GATEWAY_TOKEN" },
          password: { source: "env", provider: "default", id: "MISSING_REMOTE_GATEWAY_PASSWORD" },
        },
      },
    } as SkillSetConfig;

    await withEnvAsync(
      {
        SKILLSET_GATEWAY_TOKEN: undefined,
        SKILLSET_GATEWAY_PASSWORD: undefined,
        REMOTE_GATEWAY_TOKEN: "token-from-ref",
        MISSING_REMOTE_GATEWAY_PASSWORD: undefined,
      },
      async () => {
        const credentials = await resolveNodeHostGatewayCredentials({ config });
        expect(credentials.token).toBe("token-from-ref");
        expect(credentials.password).toBeUndefined();
      },
    );
  });
});
