import { normalizeOptionalString } from "../shared/string-coerce.js";

export const DEFAULT_PLUGIN_DISCOVERY_CACHE_MS = 1000;
export const DEFAULT_PLUGIN_MANIFEST_CACHE_MS = 1000;

export function shouldUsePluginSnapshotCache(env: NodeJS.ProcessEnv): boolean {
  if (normalizeOptionalString(env.SKILLSET_DISABLE_PLUGIN_DISCOVERY_CACHE)) {
    return false;
  }
  if (normalizeOptionalString(env.SKILLSET_DISABLE_PLUGIN_MANIFEST_CACHE)) {
    return false;
  }
  const discoveryCacheMs = normalizeOptionalString(env.SKILLSET_PLUGIN_DISCOVERY_CACHE_MS);
  if (discoveryCacheMs === "0") {
    return false;
  }
  const manifestCacheMs = normalizeOptionalString(env.SKILLSET_PLUGIN_MANIFEST_CACHE_MS);
  if (manifestCacheMs === "0") {
    return false;
  }
  return true;
}

export function resolvePluginCacheMs(rawValue: string | undefined, defaultMs: number): number {
  const raw = normalizeOptionalString(rawValue);
  if (raw === "" || raw === "0") {
    return 0;
  }
  if (!raw) {
    return defaultMs;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return defaultMs;
  }
  return Math.max(0, parsed);
}

export function resolvePluginSnapshotCacheTtlMs(env: NodeJS.ProcessEnv): number {
  const discoveryCacheMs = resolvePluginCacheMs(
    env.SKILLSET_PLUGIN_DISCOVERY_CACHE_MS,
    DEFAULT_PLUGIN_DISCOVERY_CACHE_MS,
  );
  const manifestCacheMs = resolvePluginCacheMs(
    env.SKILLSET_PLUGIN_MANIFEST_CACHE_MS,
    DEFAULT_PLUGIN_MANIFEST_CACHE_MS,
  );
  return Math.min(discoveryCacheMs, manifestCacheMs);
}

export function buildPluginSnapshotCacheEnvKey(env: NodeJS.ProcessEnv): string {
  return JSON.stringify({
    SKILLSET_BUNDLED_PLUGINS_DIR: env.SKILLSET_BUNDLED_PLUGINS_DIR ?? "",
    SKILLSET_DISABLE_PLUGIN_DISCOVERY_CACHE: env.SKILLSET_DISABLE_PLUGIN_DISCOVERY_CACHE ?? "",
    SKILLSET_DISABLE_PLUGIN_MANIFEST_CACHE: env.SKILLSET_DISABLE_PLUGIN_MANIFEST_CACHE ?? "",
    SKILLSET_PLUGIN_DISCOVERY_CACHE_MS: env.SKILLSET_PLUGIN_DISCOVERY_CACHE_MS ?? "",
    SKILLSET_PLUGIN_MANIFEST_CACHE_MS: env.SKILLSET_PLUGIN_MANIFEST_CACHE_MS ?? "",
    SKILLSET_HOME: env.SKILLSET_HOME ?? "",
    SKILLSET_STATE_DIR: env.SKILLSET_STATE_DIR ?? "",
    SKILLSET_CONFIG_PATH: env.SKILLSET_CONFIG_PATH ?? "",
    HOME: env.HOME ?? "",
    USERPROFILE: env.USERPROFILE ?? "",
    VITEST: env.VITEST ?? "",
  });
}
