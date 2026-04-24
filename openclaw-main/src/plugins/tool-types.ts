import type { ToolFsPolicy } from "../agents/tool-fs-policy.js";
import type { AnyAgentTool } from "../agents/tools/common.js";
import type { SkillSetConfig } from "../config/types.skillset.js";
import type { HookEntry } from "../hooks/types.js";
import type { DeliveryContext } from "../utils/delivery-context.types.js";

/** Trusted execution context passed to plugin-owned agent tool factories. */
export type SkillSetPluginToolContext = {
  config?: SkillSetConfig;
  /** Active runtime-resolved config snapshot when one is available. */
  runtimeConfig?: SkillSetConfig;
  /** Effective filesystem policy for the active tool run. */
  fsPolicy?: ToolFsPolicy;
  workspaceDir?: string;
  agentDir?: string;
  agentId?: string;
  sessionKey?: string;
  /** Ephemeral session UUID - regenerated on /new and /reset. Use for per-conversation isolation. */
  sessionId?: string;
  browser?: {
    sandboxBridgeUrl?: string;
    allowHostControl?: boolean;
  };
  messageChannel?: string;
  agentAccountId?: string;
  /** Trusted ambient delivery route for the active agent/session. */
  deliveryContext?: DeliveryContext;
  /** Trusted sender id from inbound context (runtime-provided, not tool args). */
  requesterSenderId?: string;
  /** Whether the trusted sender is an owner. */
  senderIsOwner?: boolean;
  sandboxed?: boolean;
};

export type SkillSetPluginToolFactory = (
  ctx: SkillSetPluginToolContext,
) => AnyAgentTool | AnyAgentTool[] | null | undefined;

export type SkillSetPluginToolOptions = {
  name?: string;
  names?: string[];
  optional?: boolean;
};

export type SkillSetPluginHookOptions = {
  entry?: HookEntry;
  name?: string;
  description?: string;
  register?: boolean;
};
