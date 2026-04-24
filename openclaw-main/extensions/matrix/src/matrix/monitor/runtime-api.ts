// Narrow Matrix monitor helper seam.
// Keep monitor internals off the broad package runtime-api barrel so monitor
// tests and shared workers do not pull unrelated Matrix helper surfaces.

export type { NormalizedLocation } from "skillset/plugin-sdk/channel-location";
export type { PluginRuntime, RuntimeLogger } from "skillset/plugin-sdk/plugin-runtime";
export type { BlockReplyContext, ReplyPayload } from "skillset/plugin-sdk/reply-runtime";
export type { MarkdownTableMode, SkillSetConfig } from "skillset/plugin-sdk/config-runtime";
export type { RuntimeEnv } from "skillset/plugin-sdk/runtime";
export {
  addAllowlistUserEntriesFromConfigEntry,
  buildAllowlistResolutionSummary,
  canonicalizeAllowlistWithResolvedIds,
  formatAllowlistMatchMeta,
  patchAllowlistUsersInConfigEntries,
  summarizeMapping,
} from "skillset/plugin-sdk/allow-from";
export {
  createReplyPrefixOptions,
  createTypingCallbacks,
} from "skillset/plugin-sdk/channel-reply-options-runtime";
export { formatLocationText, toLocationContext } from "skillset/plugin-sdk/channel-location";
export { getAgentScopedMediaLocalRoots } from "skillset/plugin-sdk/agent-media-payload";
export { logInboundDrop, logTypingFailure } from "skillset/plugin-sdk/channel-logging";
export { resolveAckReaction } from "skillset/plugin-sdk/channel-feedback";
export {
  buildChannelKeyCandidates,
  resolveChannelEntryMatch,
} from "skillset/plugin-sdk/channel-targets";
