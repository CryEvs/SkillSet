// Private runtime barrel for the bundled Google Chat extension.
// Keep this barrel thin and avoid broad plugin-sdk surfaces during bootstrap.

export { DEFAULT_ACCOUNT_ID } from "skillset/plugin-sdk/account-id";
export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readReactionParams,
  readStringParam,
} from "skillset/plugin-sdk/channel-actions";
export { buildChannelConfigSchema } from "skillset/plugin-sdk/channel-config-primitives";
export type {
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "skillset/plugin-sdk/channel-contract";
export { missingTargetError } from "skillset/plugin-sdk/channel-feedback";
export {
  createAccountStatusSink,
  runPassiveAccountLifecycle,
} from "skillset/plugin-sdk/channel-lifecycle";
export { createChannelPairingController } from "skillset/plugin-sdk/channel-pairing";
export { createChannelReplyPipeline } from "skillset/plugin-sdk/channel-reply-pipeline";
export {
  evaluateGroupRouteAccessForPolicy,
  resolveDmGroupAccessWithLists,
  resolveSenderScopedGroupPolicy,
} from "skillset/plugin-sdk/channel-policy";
export { PAIRING_APPROVED_MESSAGE } from "skillset/plugin-sdk/channel-status";
export { chunkTextForOutbound } from "skillset/plugin-sdk/text-chunking";
export type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  isDangerousNameMatchingEnabled,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "skillset/plugin-sdk/config-runtime";
export { fetchRemoteMedia, resolveChannelMediaMaxBytes } from "skillset/plugin-sdk/media-runtime";
export { loadOutboundMediaFromUrl } from "skillset/plugin-sdk/outbound-media";
export type { PluginRuntime } from "skillset/plugin-sdk/runtime-store";
export { fetchWithSsrFGuard } from "skillset/plugin-sdk/ssrf-runtime";
export {
  GoogleChatConfigSchema,
  type GoogleChatAccountConfig,
  type GoogleChatConfig,
} from "skillset/plugin-sdk/googlechat-runtime-shared";
export { extractToolSend } from "skillset/plugin-sdk/tool-send";
export { resolveInboundMentionDecision } from "skillset/plugin-sdk/channel-inbound";
export { resolveInboundRouteEnvelopeBuilderWithRuntime } from "skillset/plugin-sdk/inbound-envelope";
export { resolveWebhookPath } from "skillset/plugin-sdk/webhook-path";
export {
  registerWebhookTargetWithPluginRoute,
  resolveWebhookTargetWithAuthOrReject,
  withResolvedWebhookRequestPipeline,
} from "skillset/plugin-sdk/webhook-targets";
export {
  createWebhookInFlightLimiter,
  readJsonWebhookBodyOrReject,
  type WebhookInFlightLimiter,
} from "skillset/plugin-sdk/webhook-request-guards";
export { setGoogleChatRuntime } from "./src/runtime.js";
