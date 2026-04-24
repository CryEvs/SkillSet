import { resolveActiveTalkProviderConfig } from "../../config/talk.js";
import type { SkillSetConfig } from "../../config/types.js";

export { resolveActiveTalkProviderConfig };

export function getRuntimeConfigSnapshot(): SkillSetConfig | null {
  return null;
}
