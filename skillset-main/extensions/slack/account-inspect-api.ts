import type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";
import { inspectSlackAccount } from "./src/account-inspect.js";

export function inspectSlackReadOnlyAccount(cfg: SkillSetConfig, accountId?: string | null) {
  return inspectSlackAccount({ cfg, accountId });
}
