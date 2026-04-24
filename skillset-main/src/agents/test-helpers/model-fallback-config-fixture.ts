import type { SkillSetConfig } from "../../config/types.skillset.js";

export function makeModelFallbackCfg(overrides: Partial<SkillSetConfig> = {}): SkillSetConfig {
  return {
    agents: {
      defaults: {
        model: {
          primary: "openai/gpt-4.1-mini",
          fallbacks: ["anthropic/claude-haiku-3-5"],
        },
      },
    },
    ...overrides,
  } as SkillSetConfig;
}
