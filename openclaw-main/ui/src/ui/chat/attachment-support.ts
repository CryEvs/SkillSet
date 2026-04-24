export const CHAT_ATTACHMENT_ACCEPT = "image/*,audio/*";

const AUDIO_MIME_BY_EXT: Readonly<Record<string, string>> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  opus: "audio/opus",
  flac: "audio/flac",
  webm: "audio/webm",
};

function getFileExtension(fileName: string | null | undefined): string {
  if (typeof fileName !== "string") {
    return "";
  }
  const trimmed = fileName.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === trimmed.length - 1) {
    return "";
  }
  return trimmed.slice(dotIndex + 1).toLowerCase();
}

export function inferAttachmentMimeType(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
): string {
  if (typeof mimeType === "string" && mimeType.trim()) {
    return mimeType;
  }
  const extension = getFileExtension(fileName);
  return AUDIO_MIME_BY_EXT[extension] ?? "application/octet-stream";
}

export function isSupportedChatAttachmentMimeType(
  mimeType: string | null | undefined,
  fileName?: string | null | undefined,
): boolean {
  const normalizedMimeType = inferAttachmentMimeType(fileName, mimeType);
  const extension = getFileExtension(fileName);
  return (
    normalizedMimeType.startsWith("image/") ||
    normalizedMimeType.startsWith("audio/") ||
    extension in AUDIO_MIME_BY_EXT
  );
}
