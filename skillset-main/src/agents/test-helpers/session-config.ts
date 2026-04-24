import type { SkillSetConfig } from "../../config/types.skillset.js";

export function createPerSenderSessionConfig(
  overrides: Partial<NonNullable<SkillSetConfig["session"]>> = {},
): NonNullable<SkillSetConfig["session"]> {
  return {
    mainKey: "main",
    scope: "per-sender",
    ...overrides,
  };
}
