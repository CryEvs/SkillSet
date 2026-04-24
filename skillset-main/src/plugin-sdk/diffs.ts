// Narrow plugin-sdk surface for the bundled diffs plugin.
// Keep this list additive and scoped to the bundled diffs surface.

export { definePluginEntry } from "./plugin-entry.js";
export type { SkillSetConfig } from "../config/config.js";
export { resolvePreferredSkillSetTmpDir } from "../infra/tmp-skillset-dir.js";
export type {
  AnyAgentTool,
  SkillSetPluginApi,
  SkillSetPluginConfigSchema,
  SkillSetPluginToolContext,
  PluginLogger,
} from "../plugins/types.js";
