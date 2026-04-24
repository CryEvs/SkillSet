import type { MarkdownTableMode } from "./types.base.js";
import type { SkillSetConfig } from "./types.skillset.js";

export type ResolveMarkdownTableModeParams = {
  cfg?: Partial<SkillSetConfig>;
  channel?: string | null;
  accountId?: string | null;
};

export type ResolveMarkdownTableMode = (
  params: ResolveMarkdownTableModeParams,
) => MarkdownTableMode;
