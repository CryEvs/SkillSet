// Narrow plugin-sdk surface for the bundled llm-task plugin.
// Keep this list additive and scoped to the bundled LLM task surface.

export { definePluginEntry } from "./plugin-entry.js";
export { resolvePreferredSkillSetTmpDir } from "../infra/tmp-skillset-dir.js";
export {
  formatThinkingLevels,
  formatXHighModelHint,
  isThinkingLevelSupported,
  normalizeThinkLevel,
  resolveSupportedThinkingLevel,
  supportsXHighThinking,
} from "../auto-reply/thinking.js";
export type { AnyAgentTool, SkillSetPluginApi } from "../plugins/types.js";
