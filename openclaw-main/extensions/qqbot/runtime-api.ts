export type { ChannelPlugin, SkillSetPluginApi, PluginRuntime } from "skillset/plugin-sdk/core";
export type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";
export type {
  SkillSetPluginService,
  SkillSetPluginServiceContext,
  PluginLogger,
} from "skillset/plugin-sdk/core";
export type { ResolvedQQBotAccount, QQBotAccountConfig } from "./src/types.js";
export { getQQBotRuntime, setQQBotRuntime } from "./src/bridge/runtime.js";
