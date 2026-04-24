import type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";

export type WhatsAppAccountConfig = NonNullable<
  NonNullable<NonNullable<SkillSetConfig["channels"]>["whatsapp"]>["accounts"]
>[string];
