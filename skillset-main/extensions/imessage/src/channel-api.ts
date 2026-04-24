import { formatTrimmedAllowFromEntries } from "skillset/plugin-sdk/channel-config-helpers";
import type { ChannelStatusIssue } from "skillset/plugin-sdk/channel-contract";
import { PAIRING_APPROVED_MESSAGE } from "skillset/plugin-sdk/channel-status";
import {
  DEFAULT_ACCOUNT_ID,
  getChatChannelMeta,
  type ChannelPlugin,
  type SkillSetConfig,
} from "skillset/plugin-sdk/core";
import { resolveChannelMediaMaxBytes } from "skillset/plugin-sdk/media-runtime";
import { collectStatusIssuesFromLastError } from "skillset/plugin-sdk/status-helpers";
import {
  resolveIMessageConfigAllowFrom,
  resolveIMessageConfigDefaultTo,
} from "./config-accessors.js";
import { looksLikeIMessageTargetId, normalizeIMessageMessagingTarget } from "./normalize.js";
export { chunkTextForOutbound } from "skillset/plugin-sdk/text-chunking";

export {
  collectStatusIssuesFromLastError,
  DEFAULT_ACCOUNT_ID,
  formatTrimmedAllowFromEntries,
  getChatChannelMeta,
  looksLikeIMessageTargetId,
  normalizeIMessageMessagingTarget,
  PAIRING_APPROVED_MESSAGE,
  resolveChannelMediaMaxBytes,
  resolveIMessageConfigAllowFrom,
  resolveIMessageConfigDefaultTo,
};

export type { ChannelPlugin, ChannelStatusIssue, SkillSetConfig };
