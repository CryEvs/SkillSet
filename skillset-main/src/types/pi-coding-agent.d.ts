export type SkillSetPiCodingAgentSkillSourceAugmentation = never;

declare module "@mariozechner/pi-coding-agent" {
  interface Skill {
    // SkillSet relies on the source identifier returned by pi skill loaders.
    source: string;
  }
}
