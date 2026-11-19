"""Generate the synthetic A-17 archive signal used by the audio puzzle."""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 44_100
MORSE = ".- .---- --..."  # A17
UNIT = 0.14


def tone(freq: float, seconds: float, level: float = 0.32) -> list[float]:
    count = int(RATE * seconds)
    return [level * math.sin(2 * math.pi * freq * i / RATE) for i in range(count)]


def silence(seconds: float) -> list[float]:
    return [0.0] * int(RATE * seconds)


samples = silence(0.8)
for letter in MORSE.split():
    for index, symbol in enumerate(letter):
        samples += tone(860, UNIT * (3 if symbol == "-" else 1))
        if index < len(letter) - 1:
            samples += silence(UNIT)
    samples += silence(UNIT * 3)
samples += silence(0.8)

random.seed(1941)
for i, value in enumerate(samples):
    hum = 0.035 * math.sin(2 * math.pi * 50 * i / RATE)
    noise = random.uniform(-0.018, 0.018)
    samples[i] = max(-1, min(1, value + hum + noise))

target = Path(__file__).resolve().parents[1] / "assets" / "signal-a17.wav"
with wave.open(str(target), "wb") as output:
    output.setnchannels(1)
    output.setsampwidth(2)
    output.setframerate(RATE)
    output.writeframes(b"".join(struct.pack("<h", int(v * 32767)) for v in samples))

print(target)

