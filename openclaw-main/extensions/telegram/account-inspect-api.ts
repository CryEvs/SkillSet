import type { SkillSetConfig } from "./runtime-api.js";
import { inspectTelegramAccount } from "./src/account-inspect.js";

export function inspectTelegramReadOnlyAccount(cfg: SkillSetConfig, accountId?: string | null) {
  return inspectTelegramAccount({ cfg, accountId });
}
