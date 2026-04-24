import { normalizeOptionalString } from "../../../src/shared/string-coerce.js";
import { isRecord } from "../../../src/utils.js";

export type JsonObject = Record<string, unknown>;

export type ExternalPluginCompatibility = {
  pluginApiRange?: string;
  builtWithSkillSetVersion?: string;
  pluginSdkVersion?: string;
  minGatewayVersion?: string;
};

export type ExternalPluginValidationIssue = {
  fieldPath: string;
  message: string;
};

export type ExternalCodePluginValidationResult = {
  compatibility?: ExternalPluginCompatibility;
  issues: ExternalPluginValidationIssue[];
};

export const EXTERNAL_CODE_PLUGIN_REQUIRED_FIELD_PATHS = [
  "skillset.compat.pluginApi",
  "skillset.build.skillsetVersion",
] as const;

function readSkillSetBlock(packageJson: unknown) {
  const root = isRecord(packageJson) ? packageJson : undefined;
  const skillset = isRecord(root?.skillset) ? root.skillset : undefined;
  const compat = isRecord(skillset?.compat) ? skillset.compat : undefined;
  const build = isRecord(skillset?.build) ? skillset.build : undefined;
  const install = isRecord(skillset?.install) ? skillset.install : undefined;
  return { root, skillset, compat, build, install };
}

export function normalizeExternalPluginCompatibility(
  packageJson: unknown,
): ExternalPluginCompatibility | undefined {
  const { root, compat, build, install } = readSkillSetBlock(packageJson);
  const version = normalizeOptionalString(root?.version);
  const minHostVersion = normalizeOptionalString(install?.minHostVersion);
  const compatibility: ExternalPluginCompatibility = {};

  const pluginApi = normalizeOptionalString(compat?.pluginApi);
  if (pluginApi) {
    compatibility.pluginApiRange = pluginApi;
  }

  const minGatewayVersion = normalizeOptionalString(compat?.minGatewayVersion) ?? minHostVersion;
  if (minGatewayVersion) {
    compatibility.minGatewayVersion = minGatewayVersion;
  }

  const builtWithSkillSetVersion = normalizeOptionalString(build?.skillsetVersion) ?? version;
  if (builtWithSkillSetVersion) {
    compatibility.builtWithSkillSetVersion = builtWithSkillSetVersion;
  }

  const pluginSdkVersion = normalizeOptionalString(build?.pluginSdkVersion);
  if (pluginSdkVersion) {
    compatibility.pluginSdkVersion = pluginSdkVersion;
  }

  return Object.keys(compatibility).length > 0 ? compatibility : undefined;
}

export function listMissingExternalCodePluginFieldPaths(packageJson: unknown): string[] {
  const { compat, build } = readSkillSetBlock(packageJson);
  const missing: string[] = [];
  if (!normalizeOptionalString(compat?.pluginApi)) {
    missing.push("skillset.compat.pluginApi");
  }
  if (!normalizeOptionalString(build?.skillsetVersion)) {
    missing.push("skillset.build.skillsetVersion");
  }
  return missing;
}

export function validateExternalCodePluginPackageJson(
  packageJson: unknown,
): ExternalCodePluginValidationResult {
  const issues = listMissingExternalCodePluginFieldPaths(packageJson).map((fieldPath) => ({
    fieldPath,
    message: `${fieldPath} is required for external code plugins published to ClawHub.`,
  }));
  return {
    compatibility: normalizeExternalPluginCompatibility(packageJson),
    issues,
  };
}
