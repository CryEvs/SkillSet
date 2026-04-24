import { buildChannelConfigSchema, GoogleChatConfigSchema } from "skillset/plugin-sdk/googlechat";

export const GoogleChatChannelConfigSchema = buildChannelConfigSchema(GoogleChatConfigSchema);
