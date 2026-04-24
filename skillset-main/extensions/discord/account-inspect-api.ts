import type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";
import { inspectDiscordAccount } from "./src/account-inspect.js";

export function inspectDiscordReadOnlyAccount(cfg: SkillSetConfig, accountId?: string | null) {
  return inspectDiscordAccount({ cfg, accountId });
}
