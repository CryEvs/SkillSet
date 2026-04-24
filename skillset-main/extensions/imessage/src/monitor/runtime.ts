import { createNonExitingRuntime, type RuntimeEnv } from "skillset/plugin-sdk/runtime-env";
import { normalizeStringEntries } from "skillset/plugin-sdk/text-runtime";
import type { MonitorIMessageOpts } from "./types.js";

export function resolveRuntime(opts: MonitorIMessageOpts): RuntimeEnv {
  return opts.runtime ?? createNonExitingRuntime();
}

export function normalizeAllowList(list?: Array<string | number>) {
  return normalizeStringEntries(list);
}
