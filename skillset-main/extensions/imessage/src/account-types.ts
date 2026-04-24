import type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";

export type IMessageAccountConfig = Omit<
  NonNullable<NonNullable<SkillSetConfig["channels"]>["imessage"]>,
  "accounts" | "defaultAccount"
>;
