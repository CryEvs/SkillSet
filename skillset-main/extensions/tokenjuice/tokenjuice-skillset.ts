declare module "tokenjuice/skillset" {
  export function createTokenjuiceSkillSetEmbeddedExtension(): Parameters<
    import("skillset/plugin-sdk/plugin-entry").SkillSetPluginApi["registerEmbeddedExtensionFactory"]
  >[0];
}
