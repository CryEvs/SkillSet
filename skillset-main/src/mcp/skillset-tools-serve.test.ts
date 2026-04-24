import { describe, expect, it } from "vitest";
import { resolveSkillSetToolsForMcp } from "./skillset-tools-serve.js";
import { createPluginToolsMcpHandlers } from "./plugin-tools-handlers.js";

describe("SkillSet tools MCP server", () => {
  it("exposes cron", async () => {
    const handlers = createPluginToolsMcpHandlers(resolveSkillSetToolsForMcp());

    const listed = await handlers.listTools();
    expect(listed).toEqual({
      tools: [
        expect.objectContaining({
          name: "cron",
          description: expect.stringContaining("Manage Gateway cron jobs"),
          inputSchema: expect.objectContaining({ type: "object" }),
        }),
      ],
    });
  });
});
