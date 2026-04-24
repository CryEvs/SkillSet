import type { ChannelDoctorConfigMutation } from "skillset/plugin-sdk/channel-contract";
import type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";
import { normalizeCompatibilityConfig as normalizeCompatibilityConfigImpl } from "./doctor.js";

export function normalizeCompatibilityConfig({
  cfg,
}: {
  cfg: SkillSetConfig;
}): ChannelDoctorConfigMutation {
  return normalizeCompatibilityConfigImpl({ cfg });
}
