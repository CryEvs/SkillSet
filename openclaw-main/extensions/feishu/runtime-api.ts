// Private runtime barrel for the bundled Feishu extension.
// Keep this barrel thin and generic-only.

export type {
  AllowlistMatch,
  AnyAgentTool,
  BaseProbeResult,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelPlugin,
  HistoryEntry,
  SkillSetConfig,
  SkillSetPluginApi,
  OutboundIdentity,
  PluginRuntime,
  ReplyPayload,
} from "skillset/plugin-sdk/core";
export type { SkillSetConfig as ClawdbotConfig } from "skillset/plugin-sdk/core";
export type { RuntimeEnv } from "skillset/plugin-sdk/runtime";
export type { GroupToolPolicyConfig } from "skillset/plugin-sdk/config-runtime";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createActionGate,
  createDedupeCache,
} from "skillset/plugin-sdk/core";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "skillset/plugin-sdk/channel-status";
export { buildAgentMediaPayload } from "skillset/plugin-sdk/agent-media-payload";
export { createChannelPairingController } from "skillset/plugin-sdk/channel-pairing";
export { createReplyPrefixContext } from "skillset/plugin-sdk/channel-reply-pipeline";
export {
  evaluateSupplementalContextVisibility,
  filterSupplementalContextItems,
  resolveChannelContextVisibilityMode,
} from "skillset/plugin-sdk/config-runtime";
export { loadSessionStore, resolveSessionStoreEntry } from "skillset/plugin-sdk/config-runtime";
export { readJsonFileWithFallback } from "skillset/plugin-sdk/json-store";
export { createPersistentDedupe } from "skillset/plugin-sdk/persistent-dedupe";
export { normalizeAgentId } from "skillset/plugin-sdk/routing";
export { chunkTextForOutbound } from "skillset/plugin-sdk/text-chunking";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "skillset/plugin-sdk/webhook-ingress";
export { setFeishuRuntime } from "./src/runtime.js";
