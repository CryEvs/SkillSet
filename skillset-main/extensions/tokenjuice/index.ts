import { definePluginEntry } from "skillset/plugin-sdk/plugin-entry";
import { createTokenjuiceSkillSetEmbeddedExtension } from "./runtime-api.js";

export default definePluginEntry({
  id: "tokenjuice",
  name: "tokenjuice",
  description: "Compacts exec and bash tool results with tokenjuice reducers.",
  register(api) {
    api.registerEmbeddedExtensionFactory(createTokenjuiceSkillSetEmbeddedExtension());
  },
});
