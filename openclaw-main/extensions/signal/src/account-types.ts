import type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";

export type SignalAccountConfig = Omit<
  Exclude<NonNullable<SkillSetConfig["channels"]>["signal"], undefined>,
  "accounts"
>;
