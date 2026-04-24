import type { SkillSetConfig } from "skillset/plugin-sdk/browser-config-runtime";
import {
  normalizePluginsConfig,
  resolveEffectiveEnableState,
} from "skillset/plugin-sdk/browser-config-runtime";

export function isDefaultBrowserPluginEnabled(cfg: SkillSetConfig): boolean {
  return resolveEffectiveEnableState({
    id: "browser",
    origin: "bundled",
    config: normalizePluginsConfig(cfg.plugins),
    rootConfig: cfg,
    enabledByDefault: true,
  }).enabled;
}
