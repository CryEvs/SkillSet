import type { SkillSetConfig } from "../config/types.skillset.js";
import { normalizeOptionalString } from "../shared/string-coerce.js";

export type GatewayProbeTargetResolution = {
  gatewayMode: "local" | "remote";
  mode: "local" | "remote";
  remoteUrlMissing: boolean;
};

export function resolveGatewayProbeTarget(cfg: SkillSetConfig): GatewayProbeTargetResolution {
  const gatewayMode = cfg.gateway?.mode === "remote" ? "remote" : "local";
  const remoteUrlRaw = normalizeOptionalString(cfg.gateway?.remote?.url) ?? "";
  const remoteUrlMissing = gatewayMode === "remote" && !remoteUrlRaw;
  return {
    gatewayMode,
    mode: gatewayMode === "remote" && !remoteUrlMissing ? "remote" : "local",
    remoteUrlMissing,
  };
}
