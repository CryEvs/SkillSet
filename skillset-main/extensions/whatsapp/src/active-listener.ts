import type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";
import { resolveDefaultWhatsAppAccountId } from "./accounts.js";
import { getRegisteredWhatsAppConnectionController } from "./connection-controller-registry.js";
import type { ActiveWebListener, ActiveWebSendOptions } from "./inbound/types.js";

export type { ActiveWebListener, ActiveWebSendOptions } from "./inbound/types.js";

export function resolveWebAccountId(params: {
  cfg: SkillSetConfig;
  accountId?: string | null;
}): string {
  return (params.accountId ?? "").trim() || resolveDefaultWhatsAppAccountId(params.cfg);
}

export function getActiveWebListener(accountId: string): ActiveWebListener | null {
  return getRegisteredWhatsAppConnectionController(accountId)?.getActiveListener() ?? null;
}
