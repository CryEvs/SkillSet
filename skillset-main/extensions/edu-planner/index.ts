import { definePluginEntry, type SkillSetPluginApi } from "skillset/plugin-sdk/plugin-entry";
import { createEduPlannerTool } from "./src/tool.js";

export default definePluginEntry({
  id: "edu-planner",
  name: "Edu Planner",
  description:
    "Educational assistant: assignments, deadlines, STT, Ollama planning, rating, health scale, pet and loyalty.",
  register(api: SkillSetPluginApi) {
    api.registerTool(createEduPlannerTool(api), { optional: true });
  },
});

