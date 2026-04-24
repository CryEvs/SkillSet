// Private runtime barrel for the bundled Microsoft Teams extension.
// Keep this barrel thin and aligned with the local extension surface.

export * from "skillset/plugin-sdk/msteams";
export { setMSTeamsRuntime } from "./src/runtime.js";
