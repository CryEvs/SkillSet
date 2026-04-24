import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupTempDirs, makeTempDir } from "../test/helpers/temp-dir.js";

const tempRoots: string[] = [];

function withFakeCli(versionOutput: string): { root: string; cliPath: string } {
  const root = makeTempDir(tempRoots, "skillset-install-sh-");
  const cliPath = path.join(root, "skillset");
  const escapedOutput = versionOutput.replace(/'/g, "'\\''");
  fs.writeFileSync(
    cliPath,
    `#!/usr/bin/env bash
printf '%s\n' '${escapedOutput}'
`,
    "utf-8",
  );
  fs.chmodSync(cliPath, 0o755);
  return { root, cliPath };
}

function resolveInstallerVersionCases(params: {
  cliPaths: string[];
  stdinCliPath: string;
  stdinCwd: string;
}): string[] {
  const installerPath = path.join(process.cwd(), "scripts", "install.sh");
  const installerSource = fs.readFileSync(installerPath, "utf-8");
  const versionHelperStart = installerSource.indexOf("load_install_version_helpers() {");
  const versionHelperEnd = installerSource.indexOf("\nis_gateway_daemon_loaded() {");
  if (versionHelperStart < 0 || versionHelperEnd < 0) {
    throw new Error("install.sh version helper block not found");
  }
  const versionHelperSource = installerSource.slice(versionHelperStart, versionHelperEnd);
  const output = execFileSync(
    "bash",
    [
      "-c",
      `${versionHelperSource}
for skillset_bin in "\${@:3}"; do
  SKILLSET_BIN="$skillset_bin"
  resolve_skillset_version
done
(
  cd "$2"
  FAKE_SKILLSET_BIN="\${@:1:1}" bash -s <<'SKILLSET_STDIN_INSTALLER'
${versionHelperSource}
SKILLSET_BIN="$FAKE_SKILLSET_BIN"
resolve_skillset_version
SKILLSET_STDIN_INSTALLER
)`,
      "skillset-version-test",
      params.stdinCliPath,
      params.stdinCwd,
      ...params.cliPaths,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf-8",
      env: {
        ...process.env,
        SKILLSET_INSTALL_SH_NO_RUN: "1",
      },
    },
  );
  return output.trimEnd().split("\n");
}

describe("install.sh version resolution", () => {
  afterEach(() => {
    cleanupTempDirs(tempRoots);
  });

  it.runIf(process.platform !== "win32")(
    "parses CLI versions and keeps stdin helpers isolated from cwd",
    () => {
      const decorated = withFakeCli("SkillSet 2026.3.10 (abcdef0)");
      const raw = withFakeCli("SkillSet dev's build");
      const stdinFixture = withFakeCli("SkillSet 2026.3.10 (abcdef0)");

      const hostileCwd = makeTempDir(tempRoots, "skillset-install-stdin-");
      const hostileHelper = path.join(
        hostileCwd,
        "docker",
        "install-sh-common",
        "version-parse.sh",
      );
      fs.mkdirSync(path.dirname(hostileHelper), { recursive: true });
      fs.writeFileSync(
        hostileHelper,
        `#!/usr/bin/env bash
extract_skillset_semver() {
  printf '%s' 'poisoned'
}
`,
        "utf-8",
      );

      expect(
        resolveInstallerVersionCases({
          cliPaths: [decorated.cliPath, raw.cliPath],
          stdinCliPath: stdinFixture.cliPath,
          stdinCwd: hostileCwd,
        }),
      ).toEqual(["2026.3.10", "SkillSet dev's build", "2026.3.10"]);
    },
  );
});
