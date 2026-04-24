import type { SkillSetConfig } from "../../config/types.js";

export type DirectoryConfigParams = {
  cfg: SkillSetConfig;
  accountId?: string | null;
  query?: string | null;
  limit?: number | null;
};
