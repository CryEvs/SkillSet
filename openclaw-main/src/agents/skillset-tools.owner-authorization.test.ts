import { describe, expect, it } from "vitest";
import {
  isSkillSetOwnerOnlyCoreToolName,
  SKILLSET_OWNER_ONLY_CORE_TOOL_NAMES,
} from "./tools/owner-only-tools.js";

describe("createSkillSetTools owner authorization", () => {
  it("marks owner-only core tool names", () => {
    expect(SKILLSET_OWNER_ONLY_CORE_TOOL_NAMES).toEqual(["cron", "gateway", "nodes"]);
    expect(isSkillSetOwnerOnlyCoreToolName("cron")).toBe(true);
    expect(isSkillSetOwnerOnlyCoreToolName("gateway")).toBe(true);
    expect(isSkillSetOwnerOnlyCoreToolName("nodes")).toBe(true);
  });

  it("keeps canvas non-owner-only", () => {
    expect(isSkillSetOwnerOnlyCoreToolName("canvas")).toBe(false);
  });
});
