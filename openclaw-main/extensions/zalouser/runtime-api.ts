// Private runtime barrel for the bundled Zalo Personal extension.
// Keep this barrel thin and aligned with the local extension surface.

export * from "./api.js";
export { setZalouserRuntime } from "./src/runtime.js";
export type { ReplyPayload } from "skillset/plugin-sdk/reply-runtime";
export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionAdapter,
  ChannelStatusIssue,
} from "skillset/plugin-sdk/channel-contract";
export type {
  SkillSetConfig,
  GroupToolPolicyConfig,
  MarkdownTableMode,
} from "skillset/plugin-sdk/config-runtime";
export type {
  PluginRuntime,
  AnyAgentTool,
  ChannelPlugin,
  SkillSetPluginToolContext,
} from "skillset/plugin-sdk/core";
export type { RuntimeEnv } from "skillset/plugin-sdk/runtime";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  normalizeAccountId,
} from "skillset/plugin-sdk/core";
export { chunkTextForOutbound } from "skillset/plugin-sdk/text-chunking";
export {
  isDangerousNameMatchingEnabled,
  resolveDefaultGroupPolicy,
  resolveOpenProviderRuntimeGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "skillset/plugin-sdk/config-runtime";
export {
  mergeAllowlist,
  summarizeMapping,
  formatAllowFromLowercase,
} from "skillset/plugin-sdk/allow-from";
export { resolveInboundMentionDecision } from "skillset/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "skillset/plugin-sdk/channel-pairing";
export { createChannelReplyPipeline } from "skillset/plugin-sdk/channel-reply-pipeline";
export { buildBaseAccountStatusSnapshot } from "skillset/plugin-sdk/status-helpers";
export { resolveSenderCommandAuthorization } from "skillset/plugin-sdk/command-auth";
export {
  evaluateGroupRouteAccessForPolicy,
  resolveSenderScopedGroupPolicy,
} from "skillset/plugin-sdk/group-access";
export { loadOutboundMediaFromUrl } from "skillset/plugin-sdk/outbound-media";
export {
  deliverTextOrMediaReply,
  isNumericTargetId,
  resolveSendableOutboundReplyParts,
  sendPayloadWithChunkedTextAndMedia,
  type OutboundReplyPayload,
} from "skillset/plugin-sdk/reply-payload";
export { resolvePreferredSkillSetTmpDir } from "skillset/plugin-sdk/browser-security-runtime";
