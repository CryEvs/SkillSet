import type { SkillSetConfig } from "../../config/types.skillset.js";
import type { RuntimeEnv } from "../../runtime.js";

export type ChannelPairingAdapter = {
  idLabel: string;
  normalizeAllowEntry?: (entry: string) => string;
  notifyApproval?: (params: {
    cfg: SkillSetConfig;
    id: string;
    accountId?: string;
    runtime?: RuntimeEnv;
  }) => Promise<void>;
};
