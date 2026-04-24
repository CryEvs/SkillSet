import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { withTempDir } from "./test-helpers/temp-dir.js";
import {
  ensureDir,
  resolveConfigDir,
  resolveHomeDir,
  resolveUserPath,
  shortenHomeInString,
  shortenHomePath,
  sleep,
} from "./utils.js";

describe("ensureDir", () => {
  it("creates nested directory", async () => {
    await withTempDir({ prefix: "skillset-test-" }, async (tmp) => {
      const target = path.join(tmp, "nested", "dir");
      await ensureDir(target);
      expect(fs.existsSync(target)).toBe(true);
    });
  });
});

describe("sleep", () => {
  it("resolves after delay using fake timers", async () => {
    vi.useFakeTimers();
    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

describe("resolveConfigDir", () => {
  it("prefers ~/.skillset when legacy dir is missing", async () => {
    await withTempDir({ prefix: "skillset-config-dir-" }, async (root) => {
      const newDir = path.join(root, ".skillset");
      await fs.promises.mkdir(newDir, { recursive: true });
      const resolved = resolveConfigDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(newDir);
    });
  });

  it("expands SKILLSET_STATE_DIR using the provided env", () => {
    const env = {
      HOME: "/tmp/skillset-home",
      SKILLSET_STATE_DIR: "~/state",
    } as NodeJS.ProcessEnv;

    expect(resolveConfigDir(env)).toBe(path.resolve("/tmp/skillset-home", "state"));
  });

  it("falls back to the config file directory when only SKILLSET_CONFIG_PATH is set", () => {
    const env = {
      HOME: "/tmp/skillset-home",
      SKILLSET_CONFIG_PATH: "~/profiles/dev/skillset.json",
    } as NodeJS.ProcessEnv;

    expect(resolveConfigDir(env)).toBe(path.resolve("/tmp/skillset-home", "profiles", "dev"));
  });
});

describe("resolveHomeDir", () => {
  it("prefers SKILLSET_HOME over HOME", () => {
    vi.stubEnv("SKILLSET_HOME", "/srv/skillset-home");
    vi.stubEnv("HOME", "/home/other");

    expect(resolveHomeDir()).toBe(path.resolve("/srv/skillset-home"));

    vi.unstubAllEnvs();
  });
});

describe("shortenHomePath", () => {
  it("uses $SKILLSET_HOME prefix when SKILLSET_HOME is set", () => {
    vi.stubEnv("SKILLSET_HOME", "/srv/skillset-home");
    vi.stubEnv("HOME", "/home/other");

    expect(shortenHomePath(`${path.resolve("/srv/skillset-home")}/.skillset/skillset.json`)).toBe(
      "$SKILLSET_HOME/.skillset/skillset.json",
    );

    vi.unstubAllEnvs();
  });
});

describe("shortenHomeInString", () => {
  it("uses $SKILLSET_HOME replacement when SKILLSET_HOME is set", () => {
    vi.stubEnv("SKILLSET_HOME", "/srv/skillset-home");
    vi.stubEnv("HOME", "/home/other");

    expect(
      shortenHomeInString(`config: ${path.resolve("/srv/skillset-home")}/.skillset/skillset.json`),
    ).toBe("config: $SKILLSET_HOME/.skillset/skillset.json");

    vi.unstubAllEnvs();
  });
});

describe("resolveUserPath", () => {
  it("expands ~ to home dir", () => {
    expect(resolveUserPath("~", {}, () => "/Users/thoffman")).toBe(path.resolve("/Users/thoffman"));
  });

  it("expands ~/ to home dir", () => {
    expect(resolveUserPath("~/skillset", {}, () => "/Users/thoffman")).toBe(
      path.resolve("/Users/thoffman", "skillset"),
    );
  });

  it("resolves relative paths", () => {
    expect(resolveUserPath("tmp/dir")).toBe(path.resolve("tmp/dir"));
  });

  it("prefers SKILLSET_HOME for tilde expansion", () => {
    vi.stubEnv("SKILLSET_HOME", "/srv/skillset-home");
    vi.stubEnv("HOME", "/home/other");

    expect(resolveUserPath("~/skillset")).toBe(path.resolve("/srv/skillset-home", "skillset"));

    vi.unstubAllEnvs();
  });

  it("uses the provided env for tilde expansion", () => {
    const env = {
      HOME: "/tmp/skillset-home",
      SKILLSET_HOME: "/srv/skillset-home",
    } as NodeJS.ProcessEnv;

    expect(resolveUserPath("~/skillset", env)).toBe(path.resolve("/srv/skillset-home", "skillset"));
  });

  it("keeps blank paths blank", () => {
    expect(resolveUserPath("")).toBe("");
    expect(resolveUserPath("   ")).toBe("");
  });

  it("returns empty string for undefined/null input", () => {
    expect(resolveUserPath(undefined as unknown as string)).toBe("");
    expect(resolveUserPath(null as unknown as string)).toBe("");
  });
});
