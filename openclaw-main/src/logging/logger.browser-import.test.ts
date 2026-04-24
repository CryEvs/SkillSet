import { afterEach, describe, expect, it, vi } from "vitest";
import { importFreshModule } from "../../test/helpers/import-fresh.js";

type LoggerModule = typeof import("./logger.js");

const originalGetBuiltinModule = (
  process as NodeJS.Process & { getBuiltinModule?: (id: string) => unknown }
).getBuiltinModule;

async function importBrowserSafeLogger(params?: {
  resolvePreferredSkillSetTmpDir?: ReturnType<typeof vi.fn>;
}): Promise<{
  module: LoggerModule;
  resolvePreferredSkillSetTmpDir: ReturnType<typeof vi.fn>;
}> {
  const resolvePreferredSkillSetTmpDir =
    params?.resolvePreferredSkillSetTmpDir ??
    vi.fn(() => {
      throw new Error("resolvePreferredSkillSetTmpDir should not run during browser-safe import");
    });

  vi.doMock("../infra/tmp-skillset-dir.js", async () => {
    const actual = await vi.importActual<typeof import("../infra/tmp-skillset-dir.js")>(
      "../infra/tmp-skillset-dir.js",
    );
    return {
      ...actual,
      resolvePreferredSkillSetTmpDir,
    };
  });

  Object.defineProperty(process, "getBuiltinModule", {
    configurable: true,
    value: undefined,
  });

  const module = await importFreshModule<LoggerModule>(
    import.meta.url,
    "./logger.js?scope=browser-safe",
  );
  return { module, resolvePreferredSkillSetTmpDir };
}

describe("logging/logger browser-safe import", () => {
  afterEach(() => {
    vi.doUnmock("../infra/tmp-skillset-dir.js");
    Object.defineProperty(process, "getBuiltinModule", {
      configurable: true,
      value: originalGetBuiltinModule,
    });
  });

  it("does not resolve the preferred temp dir at import time when node fs is unavailable", async () => {
    const { module, resolvePreferredSkillSetTmpDir } = await importBrowserSafeLogger();

    expect(resolvePreferredSkillSetTmpDir).not.toHaveBeenCalled();
    expect(module.DEFAULT_LOG_DIR).toBe("/tmp/skillset");
    expect(module.DEFAULT_LOG_FILE).toBe("/tmp/skillset/skillset.log");
  });

  it("disables file logging when imported in a browser-like environment", async () => {
    const { module, resolvePreferredSkillSetTmpDir } = await importBrowserSafeLogger();

    expect(module.getResolvedLoggerSettings()).toMatchObject({
      level: "silent",
      file: "/tmp/skillset/skillset.log",
    });
    expect(module.isFileLogLevelEnabled("info")).toBe(false);
    expect(() => module.getLogger().info("browser-safe")).not.toThrow();
    expect(resolvePreferredSkillSetTmpDir).not.toHaveBeenCalled();
  });
});
