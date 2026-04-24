import { listSkillCommandsForAgents as listSkillCommandsForAgentsImpl } from "skillset/plugin-sdk/command-auth";

type ListSkillCommandsForAgents =
  typeof import("skillset/plugin-sdk/command-auth").listSkillCommandsForAgents;

export function listSkillCommandsForAgents(
  ...args: Parameters<ListSkillCommandsForAgents>
): ReturnType<ListSkillCommandsForAgents> {
  return listSkillCommandsForAgentsImpl(...args);
}
