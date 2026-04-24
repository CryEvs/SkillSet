import { loadConfig } from "skillset/plugin-sdk/config-runtime";
import { readChannelAllowFromStore } from "skillset/plugin-sdk/conversation-runtime";
import { getPluginCommandSpecs } from "skillset/plugin-sdk/plugin-runtime";
import { dispatchReplyWithBufferedBlockDispatcher } from "skillset/plugin-sdk/reply-dispatch-runtime";
import { listSkillCommandsForAgents } from "skillset/plugin-sdk/skill-commands-runtime";
import type { TelegramBotDeps } from "./bot-deps.js";
import { syncTelegramMenuCommands } from "./bot-native-command-menu.js";

export type TelegramNativeCommandDeps = Pick<
  TelegramBotDeps,
  | "dispatchReplyWithBufferedBlockDispatcher"
  | "editMessageTelegram"
  | "listSkillCommandsForAgents"
  | "loadConfig"
  | "readChannelAllowFromStore"
  | "syncTelegramMenuCommands"
> & {
  getPluginCommandSpecs?: typeof getPluginCommandSpecs;
};

let telegramSendRuntimePromise: Promise<typeof import("./send.js")> | undefined;

async function loadTelegramSendRuntime() {
  telegramSendRuntimePromise ??= import("./send.js");
  return await telegramSendRuntimePromise;
}

export const defaultTelegramNativeCommandDeps: TelegramNativeCommandDeps = {
  get loadConfig() {
    return loadConfig;
  },
  get readChannelAllowFromStore() {
    return readChannelAllowFromStore;
  },
  get dispatchReplyWithBufferedBlockDispatcher() {
    return dispatchReplyWithBufferedBlockDispatcher;
  },
  get listSkillCommandsForAgents() {
    return listSkillCommandsForAgents;
  },
  get syncTelegramMenuCommands() {
    return syncTelegramMenuCommands;
  },
  get getPluginCommandSpecs() {
    return getPluginCommandSpecs;
  },
  async editMessageTelegram(...args) {
    const { editMessageTelegram } = await loadTelegramSendRuntime();
    return await editMessageTelegram(...args);
  },
};
