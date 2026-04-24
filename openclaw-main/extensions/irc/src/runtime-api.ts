// Private runtime barrel for the bundled IRC extension.
// Keep this barrel thin and generic-only.

export type { BaseProbeResult } from "skillset/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "skillset/plugin-sdk/channel-core";
export type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";
export type { PluginRuntime } from "skillset/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "skillset/plugin-sdk/runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyBySenderConfig,
  GroupToolPolicyConfig,
  MarkdownConfig,
} from "skillset/plugin-sdk/config-runtime";
export type { OutboundReplyPayload } from "skillset/plugin-sdk/reply-payload";
export { DEFAULT_ACCOUNT_ID } from "skillset/plugin-sdk/account-id";
export { buildChannelConfigSchema } from "skillset/plugin-sdk/channel-config-primitives";
export {
  PAIRING_APPROVED_MESSAGE,
  buildBaseChannelStatusSummary,
} from "skillset/plugin-sdk/channel-status";
export { createChannelPairingController } from "skillset/plugin-sdk/channel-pairing";
export { createAccountStatusSink } from "skillset/plugin-sdk/channel-lifecycle";
export {
  readStoreAllowFromForDmPolicy,
  resolveEffectiveAllowFromLists,
} from "skillset/plugin-sdk/channel-policy";
export { resolveControlCommandGate } from "skillset/plugin-sdk/command-auth";
export { dispatchInboundReplyWithBase } from "skillset/plugin-sdk/inbound-reply-dispatch";
export { chunkTextForOutbound } from "skillset/plugin-sdk/text-chunking";
export {
  deliverFormattedTextWithAttachments,
  formatTextWithAttachmentLinks,
  resolveOutboundMediaUrls,
} from "skillset/plugin-sdk/reply-payload";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  isDangerousNameMatchingEnabled,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "skillset/plugin-sdk/config-runtime";
export { logInboundDrop } from "skillset/plugin-sdk/channel-inbound";
