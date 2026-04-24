import { transcribeFirstAudio as transcribeFirstAudioImpl } from "skillset/plugin-sdk/media-runtime";

type TranscribeFirstAudio = typeof import("skillset/plugin-sdk/media-runtime").transcribeFirstAudio;

export async function transcribeFirstAudio(
  ...args: Parameters<TranscribeFirstAudio>
): ReturnType<TranscribeFirstAudio> {
  return await transcribeFirstAudioImpl(...args);
}
