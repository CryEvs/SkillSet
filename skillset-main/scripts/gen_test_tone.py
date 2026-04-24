import math
import struct
import wave

out = "/home/nmnovich/projects/skillset/extensions/edu-planner/scripts/test-tone.wav"
sr = 16000
sec = 2
freq = 440

with wave.open(out, "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sr)
    for i in range(sr * sec):
        val = int(12000 * math.sin(2 * math.pi * freq * i / sr))
        wf.writeframes(struct.pack("<h", val))

print(out)
