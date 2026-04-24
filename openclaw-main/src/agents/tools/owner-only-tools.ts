export const SKILLSET_OWNER_ONLY_CORE_TOOL_NAMES = ["cron", "gateway", "nodes"] as const;

const SKILLSET_OWNER_ONLY_CORE_TOOL_NAME_SET: ReadonlySet<string> = new Set(
  SKILLSET_OWNER_ONLY_CORE_TOOL_NAMES,
);

export function isSkillSetOwnerOnlyCoreToolName(toolName: string): boolean {
  return SKILLSET_OWNER_ONLY_CORE_TOOL_NAME_SET.has(toolName);
}
