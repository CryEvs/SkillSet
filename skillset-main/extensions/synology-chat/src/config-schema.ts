import { buildChannelConfigSchema } from "skillset/plugin-sdk/channel-config-schema";
import { z } from "skillset/plugin-sdk/zod";

export const SynologyChatChannelConfigSchema = buildChannelConfigSchema(
  z
    .object({
      dangerouslyAllowNameMatching: z.boolean().optional(),
      dangerouslyAllowInheritedWebhookPath: z.boolean().optional(),
    })
    .passthrough(),
);
