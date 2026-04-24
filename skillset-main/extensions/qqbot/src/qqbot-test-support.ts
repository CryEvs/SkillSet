import type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";

export function makeQqbotSecretRefConfig(): SkillSetConfig {
  return {
    channels: {
      qqbot: {
        appId: "123456",
        clientSecret: {
          source: "env",
          provider: "default",
          id: "QQBOT_CLIENT_SECRET",
        },
      },
    },
  } as SkillSetConfig;
}

export function makeQqbotDefaultAccountConfig(): SkillSetConfig {
  return {
    channels: {
      qqbot: {
        defaultAccount: "bot2",
        accounts: {
          bot2: { appId: "123456" },
        },
      },
    },
  } as SkillSetConfig;
}
