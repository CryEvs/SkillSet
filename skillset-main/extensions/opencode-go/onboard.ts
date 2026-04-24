import {
  applyAgentDefaultModelPrimary,
  type SkillSetConfig,
} from "skillset/plugin-sdk/provider-onboard";

export const OPENCODE_GO_DEFAULT_MODEL_REF = "opencode-go/kimi-k2.5";

export function applyOpencodeGoProviderConfig(cfg: SkillSetConfig): SkillSetConfig {
  return cfg;
}

export function applyOpencodeGoConfig(cfg: SkillSetConfig): SkillSetConfig {
  return applyAgentDefaultModelPrimary(
    applyOpencodeGoProviderConfig(cfg),
    OPENCODE_GO_DEFAULT_MODEL_REF,
  );
}
