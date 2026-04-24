import {
  defineBundledChannelEntry,
  loadBundledEntryExportSync,
} from "skillset/plugin-sdk/channel-entry-contract";
import type { SkillSetPluginApi } from "skillset/plugin-sdk/channel-entry-contract";
import { registerFeishuSubagentHooks } from "./subagent-hooks-api.js";

function registerFeishuDocTools(api: SkillSetPluginApi) {
  const register = loadBundledEntryExportSync<(api: SkillSetPluginApi) => void>(import.meta.url, {
    specifier: "./api.js",
    exportName: "registerFeishuDocTools",
  });
  register(api);
}

function registerFeishuChatTools(api: SkillSetPluginApi) {
  const register = loadBundledEntryExportSync<(api: SkillSetPluginApi) => void>(import.meta.url, {
    specifier: "./api.js",
    exportName: "registerFeishuChatTools",
  });
  register(api);
}

function registerFeishuWikiTools(api: SkillSetPluginApi) {
  const register = loadBundledEntryExportSync<(api: SkillSetPluginApi) => void>(import.meta.url, {
    specifier: "./api.js",
    exportName: "registerFeishuWikiTools",
  });
  register(api);
}

function registerFeishuDriveTools(api: SkillSetPluginApi) {
  const register = loadBundledEntryExportSync<(api: SkillSetPluginApi) => void>(import.meta.url, {
    specifier: "./api.js",
    exportName: "registerFeishuDriveTools",
  });
  register(api);
}

function registerFeishuPermTools(api: SkillSetPluginApi) {
  const register = loadBundledEntryExportSync<(api: SkillSetPluginApi) => void>(import.meta.url, {
    specifier: "./api.js",
    exportName: "registerFeishuPermTools",
  });
  register(api);
}

function registerFeishuBitableTools(api: SkillSetPluginApi) {
  const register = loadBundledEntryExportSync<(api: SkillSetPluginApi) => void>(import.meta.url, {
    specifier: "./api.js",
    exportName: "registerFeishuBitableTools",
  });
  register(api);
}

export default defineBundledChannelEntry({
  id: "feishu",
  name: "Feishu",
  description: "Feishu/Lark channel plugin",
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "feishuPlugin",
  },
  secrets: {
    specifier: "./secret-contract-api.js",
    exportName: "channelSecrets",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setFeishuRuntime",
  },
  registerFull(api) {
    registerFeishuSubagentHooks(api);
    registerFeishuDocTools(api);
    registerFeishuChatTools(api);
    registerFeishuWikiTools(api);
    registerFeishuDriveTools(api);
    registerFeishuPermTools(api);
    registerFeishuBitableTools(api);
  },
});
