import { vi } from "vitest";

const registryJitiMocks = vi.hoisted(() => ({
  createJiti: vi.fn(),
  discoverSkillSetPlugins: vi.fn(),
  loadPluginManifestRegistry: vi.fn(),
}));

vi.mock("jiti", () => ({
  createJiti: (...args: Parameters<typeof registryJitiMocks.createJiti>) =>
    registryJitiMocks.createJiti(...args),
}));

vi.mock("../discovery.js", () => ({
  discoverSkillSetPlugins: (
    ...args: Parameters<typeof registryJitiMocks.discoverSkillSetPlugins>
  ) => registryJitiMocks.discoverSkillSetPlugins(...args),
}));

vi.mock("../manifest-registry.js", () => ({
  loadPluginManifestRegistry: (
    ...args: Parameters<typeof registryJitiMocks.loadPluginManifestRegistry>
  ) => registryJitiMocks.loadPluginManifestRegistry(...args),
}));

export function resetRegistryJitiMocks(): void {
  registryJitiMocks.createJiti.mockReset();
  registryJitiMocks.discoverSkillSetPlugins.mockReset();
  registryJitiMocks.loadPluginManifestRegistry.mockReset();
  registryJitiMocks.discoverSkillSetPlugins.mockReturnValue({
    candidates: [],
    diagnostics: [],
  });
  registryJitiMocks.createJiti.mockImplementation(
    (_modulePath: string, _options?: Record<string, unknown>) => () => ({ default: {} }),
  );
}

export function getRegistryJitiMocks() {
  return registryJitiMocks;
}
