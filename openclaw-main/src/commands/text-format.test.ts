import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("skillset", 16)).toBe("skillset");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("skillset-status-output", 10)).toBe("skillset-…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
