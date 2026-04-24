// Private runtime barrel for the bundled Mattermost extension.
// Keep this barrel thin and generic-only.

export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelPlugin,
  ChatType,
  HistoryEntry,
  SkillSetConfig,
  SkillSetPluginApi,
  PluginRuntime,
} from "skillset/plugin-sdk/core";
export type { RuntimeEnv } from "skillset/plugin-sdk/runtime";
export type { ReplyPayload } from "skillset/plugin-sdk/reply-runtime";
export type { ModelsProviderData } from "skillset/plugin-sdk/command-auth";
export type {
  BlockStreamingCoalesceConfig,
  DmPolicy,
  GroupPolicy,
} from "skillset/plugin-sdk/config-runtime";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createDedupeCache,
  parseStrictPositiveInteger,
  resolveClientIp,
  isTrustedProxyAddress,
} from "skillset/plugin-sdk/core";
export { buildComputedAccountStatusSnapshot } from "skillset/plugin-sdk/channel-status";
export { createAccountStatusSink } from "skillset/plugin-sdk/channel-lifecycle";
export { buildAgentMediaPayload } from "skillset/plugin-sdk/agent-media-payload";
export {
  buildModelsProviderData,
  listSkillCommandsForAgents,
  resolveControlCommandGate,
  resolveStoredModelOverride,
} from "skillset/plugin-sdk/command-auth";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  isDangerousNameMatchingEnabled,
  loadSessionStore,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  resolveStorePath,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "skillset/plugin-sdk/config-runtime";
export { formatInboundFromLabel } from "skillset/plugin-sdk/channel-inbound";
export { logInboundDrop } from "skillset/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "skillset/plugin-sdk/channel-pairing";
export {
  DM_GROUP_ACCESS_REASON,
  readStoreAllowFromForDmPolicy,
  resolveDmGroupAccessWithLists,
  resolveEffectiveAllowFromLists,
} from "skillset/plugin-sdk/channel-policy";
export { evaluateSenderGroupAccessForPolicy } from "skillset/plugin-sdk/group-access";
export { createChannelReplyPipeline } from "skillset/plugin-sdk/channel-reply-pipeline";
export { logTypingFailure } from "skillset/plugin-sdk/channel-feedback";
export { loadOutboundMediaFromUrl } from "skillset/plugin-sdk/outbound-media";
export { rawDataToString } from "skillset/plugin-sdk/browser-node-runtime";
export { chunkTextForOutbound } from "skillset/plugin-sdk/text-chunking";
export {
  DEFAULT_GROUP_HISTORY_LIMIT,
  buildPendingHistoryContextFromMap,
  clearHistoryEntriesIfEnabled,
  recordPendingHistoryEntryIfEnabled,
} from "skillset/plugin-sdk/reply-history";
export { normalizeAccountId, resolveThreadSessionKeys } from "skillset/plugin-sdk/routing";
export { resolveAllowlistMatchSimple } from "skillset/plugin-sdk/allow-from";
export { registerPluginHttpRoute } from "skillset/plugin-sdk/webhook-targets";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
} from "skillset/plugin-sdk/webhook-ingress";
export {
  applyAccountNameToChannelSection,
  applySetupAccountConfigPatch,
  migrateBaseNameToDefaultAccount,
} from "skillset/plugin-sdk/setup";
export {
  getAgentScopedMediaLocalRoots,
  resolveChannelMediaMaxBytes,
} from "skillset/plugin-sdk/media-runtime";
export { normalizeProviderId } from "skillset/plugin-sdk/provider-model-shared";
export { setMattermostRuntime } from "./src/runtime.js";
