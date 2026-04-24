import { createConfigIO, getRuntimeConfigSnapshot, type SkillSetConfig } from "../config/config.js";

export function loadBrowserConfigForRuntimeRefresh(): SkillSetConfig {
  return getRuntimeConfigSnapshot() ?? createConfigIO().loadConfig();
}
