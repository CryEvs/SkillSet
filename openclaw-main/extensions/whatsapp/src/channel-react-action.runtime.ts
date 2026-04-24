import { readStringOrNumberParam, readStringParam } from "skillset/plugin-sdk/channel-actions";
import type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";

export { resolveReactionMessageId } from "skillset/plugin-sdk/channel-actions";
export { handleWhatsAppAction } from "./action-runtime.js";
export { isWhatsAppGroupJid, normalizeWhatsAppTarget } from "./normalize.js";
export { readStringOrNumberParam, readStringParam, type SkillSetConfig };
