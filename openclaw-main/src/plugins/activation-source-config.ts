import {
  getRuntimeConfigSnapshot,
  getRuntimeConfigSourceSnapshot,
} from "../config/runtime-snapshot.js";
import type { SkillSetConfig } from "../config/types.skillset.js";

export function resolvePluginActivationSourceConfig(params: {
  config?: SkillSetConfig;
  activationSourceConfig?: SkillSetConfig;
}): SkillSetConfig {
  if (params.activationSourceConfig !== undefined) {
    return params.activationSourceConfig;
  }
  const sourceSnapshot = getRuntimeConfigSourceSnapshot();
  if (sourceSnapshot && params.config === getRuntimeConfigSnapshot()) {
    return sourceSnapshot;
  }
  return params.config ?? {};
}
