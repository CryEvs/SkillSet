import {
  describeImageWithModel as describeImageWithModelImpl,
  transcribeFirstAudio as transcribeFirstAudioImpl,
} from "skillset/plugin-sdk/media-runtime";

type DescribeImageWithModel =
  typeof import("skillset/plugin-sdk/media-runtime").describeImageWithModel;
type TranscribeFirstAudio = typeof import("skillset/plugin-sdk/media-runtime").transcribeFirstAudio;

export async function describeImageWithModel(
  ...args: Parameters<DescribeImageWithModel>
): ReturnType<DescribeImageWithModel> {
  return await describeImageWithModelImpl(...args);
}

export async function transcribeFirstAudio(
  ...args: Parameters<TranscribeFirstAudio>
): ReturnType<TranscribeFirstAudio> {
  return await transcribeFirstAudioImpl(...args);
}
