import { describe, expect, it } from "vitest";
import {
  ensureSkillSetExecMarkerOnProcess,
  markSkillSetExecEnv,
  SKILLSET_CLI_ENV_VALUE,
  SKILLSET_CLI_ENV_VAR,
} from "./skillset-exec-env.js";

describe("markSkillSetExecEnv", () => {
  it("returns a cloned env object with the exec marker set", () => {
    const env = { PATH: "/usr/bin", SKILLSET_CLI: "0" };
    const marked = markSkillSetExecEnv(env);

    expect(marked).toEqual({
      PATH: "/usr/bin",
      SKILLSET_CLI: SKILLSET_CLI_ENV_VALUE,
    });
    expect(marked).not.toBe(env);
    expect(env.SKILLSET_CLI).toBe("0");
  });
});

describe("ensureSkillSetExecMarkerOnProcess", () => {
  it.each([
    {
      name: "mutates and returns the provided process env",
      env: { PATH: "/usr/bin" } as NodeJS.ProcessEnv,
    },
    {
      name: "overwrites an existing marker on the provided process env",
      env: { PATH: "/usr/bin", [SKILLSET_CLI_ENV_VAR]: "0" } as NodeJS.ProcessEnv,
    },
  ])("$name", ({ env }) => {
    expect(ensureSkillSetExecMarkerOnProcess(env)).toBe(env);
    expect(env[SKILLSET_CLI_ENV_VAR]).toBe(SKILLSET_CLI_ENV_VALUE);
  });

  it("defaults to mutating process.env when no env object is provided", () => {
    const previous = process.env[SKILLSET_CLI_ENV_VAR];
    delete process.env[SKILLSET_CLI_ENV_VAR];

    try {
      expect(ensureSkillSetExecMarkerOnProcess()).toBe(process.env);
      expect(process.env[SKILLSET_CLI_ENV_VAR]).toBe(SKILLSET_CLI_ENV_VALUE);
    } finally {
      if (previous === undefined) {
        delete process.env[SKILLSET_CLI_ENV_VAR];
      } else {
        process.env[SKILLSET_CLI_ENV_VAR] = previous;
      }
    }
  });
});
