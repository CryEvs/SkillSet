import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { syncPluginVersions } from "../../scripts/sync-plugin-versions.js";
import { cleanupTempDirs, makeTempDir } from "../../test/helpers/temp-dir.js";

const tempDirs: string[] = [];

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

describe("syncPluginVersions", () => {
  afterEach(() => {
    cleanupTempDirs(tempDirs);
  });

  it("preserves workspace skillset devDependencies and plugin host floors", () => {
    const rootDir = makeTempDir(tempDirs, "skillset-sync-plugin-versions-");

    writeJson(path.join(rootDir, "package.json"), {
      name: "skillset",
      version: "2026.4.1",
    });
    writeJson(path.join(rootDir, "extensions/bluebubbles/package.json"), {
      name: "@skillset/bluebubbles",
      version: "2026.3.30",
      devDependencies: {
        skillset: "workspace:*",
      },
      peerDependencies: {
        skillset: ">=2026.3.30",
      },
      skillset: {
        install: {
          minHostVersion: ">=2026.3.30",
        },
        compat: {
          pluginApi: ">=2026.3.30",
        },
        build: {
          skillsetVersion: "2026.3.30",
        },
      },
    });

    const summary = syncPluginVersions(rootDir);
    const updatedPackage = JSON.parse(
      fs.readFileSync(path.join(rootDir, "extensions/bluebubbles/package.json"), "utf8"),
    ) as {
      version?: string;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      skillset?: {
        install?: {
          minHostVersion?: string;
        };
        compat?: {
          pluginApi?: string;
        };
        build?: {
          skillsetVersion?: string;
        };
      };
    };

    expect(summary.updated).toContain("@skillset/bluebubbles");
    expect(updatedPackage.version).toBe("2026.4.1");
    expect(updatedPackage.devDependencies?.skillset).toBe("workspace:*");
    expect(updatedPackage.peerDependencies?.skillset).toBe(">=2026.4.1");
    expect(updatedPackage.skillset?.install?.minHostVersion).toBe(">=2026.3.30");
    expect(updatedPackage.skillset?.compat?.pluginApi).toBe(">=2026.4.1");
    expect(updatedPackage.skillset?.build?.skillsetVersion).toBe("2026.4.1");
  });
});
