import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#skillset",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#skillset",
      rawTarget: "#skillset",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "skillset-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "skillset-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "skillset-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "skillset-bot",
      rawTarget: "skillset-bot",
    });
  });
});
