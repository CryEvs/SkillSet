import { describe, expect, it } from "vitest";
import {
  shouldEagerRegisterSubcommands,
  shouldRegisterPrimaryCommandOnly,
  shouldRegisterPrimarySubcommandOnly,
  shouldSkipPluginCommandRegistration,
} from "./command-registration-policy.js";

describe("command-registration-policy", () => {
  it("matches primary command registration policy", () => {
    expect(shouldRegisterPrimaryCommandOnly(["node", "skillset", "status"])).toBe(true);
    expect(shouldRegisterPrimaryCommandOnly(["node", "skillset", "status", "--help"])).toBe(true);
    expect(shouldRegisterPrimaryCommandOnly(["node", "skillset", "-V"])).toBe(false);
    expect(shouldRegisterPrimaryCommandOnly(["node", "skillset", "acp", "-v"])).toBe(true);
  });

  it("matches plugin registration skip policy", () => {
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "skillset", "--help"],
        primary: null,
        hasBuiltinPrimary: false,
      }),
    ).toBe(true);
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "skillset", "config", "--help"],
        primary: "config",
        hasBuiltinPrimary: true,
      }),
    ).toBe(true);
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "skillset", "voicecall", "--help"],
        primary: "voicecall",
        hasBuiltinPrimary: false,
      }),
    ).toBe(false);
  });

  it("matches lazy subcommand registration policy", () => {
    expect(shouldEagerRegisterSubcommands({ SKILLSET_DISABLE_LAZY_SUBCOMMANDS: "1" })).toBe(true);
    expect(shouldEagerRegisterSubcommands({ SKILLSET_DISABLE_LAZY_SUBCOMMANDS: "0" })).toBe(false);
    expect(shouldRegisterPrimarySubcommandOnly(["node", "skillset", "acp"], {})).toBe(true);
    expect(shouldRegisterPrimarySubcommandOnly(["node", "skillset", "acp", "--help"], {})).toBe(
      true,
    );
    expect(
      shouldRegisterPrimarySubcommandOnly(["node", "skillset", "acp"], {
        SKILLSET_DISABLE_LAZY_SUBCOMMANDS: "1",
      }),
    ).toBe(false);
  });
});
