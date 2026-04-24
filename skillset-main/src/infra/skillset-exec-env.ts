export const SKILLSET_CLI_ENV_VAR = "SKILLSET_CLI";
export const SKILLSET_CLI_ENV_VALUE = "1";

export function markSkillSetExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [SKILLSET_CLI_ENV_VAR]: SKILLSET_CLI_ENV_VALUE,
  };
}

export function ensureSkillSetExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[SKILLSET_CLI_ENV_VAR] = SKILLSET_CLI_ENV_VALUE;
  return env;
}
