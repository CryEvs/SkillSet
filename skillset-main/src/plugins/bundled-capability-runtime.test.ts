import { describe, expect, it } from "vitest";
import { buildVitestCapabilityShimAliasMap } from "./bundled-capability-runtime.js";

describe("buildVitestCapabilityShimAliasMap", () => {
  it("keeps scoped and unscoped capability shim aliases aligned", () => {
    const aliasMap = buildVitestCapabilityShimAliasMap();

    expect(aliasMap["skillset/plugin-sdk/llm-task"]).toBe(
      aliasMap["@skillset/plugin-sdk/llm-task"],
    );
    expect(aliasMap["skillset/plugin-sdk/config-runtime"]).toBe(
      aliasMap["@skillset/plugin-sdk/config-runtime"],
    );
    expect(aliasMap["skillset/plugin-sdk/media-runtime"]).toBe(
      aliasMap["@skillset/plugin-sdk/media-runtime"],
    );
    expect(aliasMap["skillset/plugin-sdk/provider-onboard"]).toBe(
      aliasMap["@skillset/plugin-sdk/provider-onboard"],
    );
    expect(aliasMap["skillset/plugin-sdk/speech-core"]).toBe(
      aliasMap["@skillset/plugin-sdk/speech-core"],
    );
  });
});
