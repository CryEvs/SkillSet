#!/usr/bin/env python3
import argparse
import json
import sys
import tempfile
import wave


def transcribe_file(path: str) -> str:
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "faster-whisper is not installed. Install with: pip install faster-whisper sounddevice"
        ) from exc

    # CPU-first mode for stable WSL execution without CUDA runtime libraries.
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(path, language="ru")
    text = " ".join(segment.text.strip() for segment in segments).strip()
    return text


def record_wav(seconds: int = 8, sample_rate: int = 16000) -> str:
    try:
        import sounddevice as sd  # type: ignore
        import numpy as np  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "sounddevice/numpy are not installed. Install with: pip install sounddevice numpy"
        ) from exc

    data = sd.rec(int(seconds * sample_rate), samplerate=sample_rate, channels=1, dtype="int16")
    sd.wait()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    with wave.open(tmp.name, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(np.asarray(data).tobytes())
    return tmp.name


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["file", "mic"], required=True)
    parser.add_argument("--file", default="")
    args = parser.parse_args()

    if args.mode == "file":
        if not args.file:
            raise RuntimeError("--file is required in file mode")
        text = transcribe_file(args.file)
        print(text)
        return 0

    wav_path = record_wav()
    text = transcribe_file(wav_path)
    print(text)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        raise SystemExit(1)

