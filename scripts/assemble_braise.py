"""Build the stereo review from recorded Foley and the numbered Eevee frames."""
import argparse
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CINE = ROOT / "assets/cinematic"
parser = argparse.ArgumentParser()
parser.add_argument("output", type=Path, help="MP4 review destination")
parser.add_argument("--sound-only", action="store_true")
parser.add_argument("--revision", choices=("r03","r04","r05"), default="r03")
args = parser.parse_args()
args.output.parent.mkdir(exist_ok=True, parents=True)
audio_dir = CINE / "audio"
mix = audio_dir / "braise-review.wav"

# Source start, duration, event time, gain and stereo position (-1 = left).
# Each shoe contact comes from a different passage of the field recording.
cues = [
    ("exterior-embers", 20, 16, 0, 2.4, .34),
    ("door-handle-open", .18, .44, 1.00, .94, -.13),
    ("door-handle-open", .98, .82, 1.31, .49, -.13),
    ("footsteps-interior", 8.43, .55, 2.77, .99, -.1),
    ("footsteps-interior", 22.45, .54, 3.37, .58, .1),
    ("footsteps-interior", 46.48, .51, 3.92, .72, -.1),
    ("footsteps-interior", 33.04, .53, 4.50, 1.1, .1),
    ("footsteps-interior", 50.13, .49, 5.32, .98, -.1),
    ("footsteps-interior", 53.95, .48, 6.0, .87, .1),
    ("chair-drag", 2.40, 1.07, 6.56, .38, .16),
    ("footsteps-interior", 8.41, .55, 8.19, .84, -.16),
    ("footsteps-interior", 46.49, .49, 8.77, .56, .08),
    ("footsteps-interior", 22.49, .51, 9.36, .49, -.1),
    ("chair-drag", 7.44, .43, 10.42, .13, 0),
    ("power-click", 0, .22, 12.00, .45, .10),
    ("boot286", .12, 3.92, 12.08, .47, .05),
]
filters = []
command = ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y"]
for i, (source, start, length, at, gain, position) in enumerate(cues):
    command.extend(["-ss", str(start), "-t", str(length), "-i", str(audio_dir / "source" / (source + ".mp3"))])
    ms = round(at * 1000)
    tone = "lowpass=f=700," if source == "exterior-embers" else ""
    tail = .21 if source in ("boot286", "exterior-embers") else .035
    filters.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=mono,{tone}highpass=f=45,"
                   f"afade=t=in:d=0.008,afade=t=out:st={length-tail}:d={tail},"
                   f"volume={gain},pan=stereo|c0={.8-.19*position}*c0|c1={.8+.19*position}*c0,"
                   f"adelay={ms}|{ms}[a{i}]")
filters.append("".join(f"[a{i}]" for i in range(len(cues))) +
               f"amix=inputs={len(cues)}:normalize=0,alimiter=limit=0.93:level=0:latency=1,apad=whole_dur=16[mix]")
subprocess.run(command + ["-filter_complex", ";".join(filters), "-map", "[mix]", "-t", "16", "-c:a", "pcm_s24le", str(mix)], check=True)
if not args.sound_only:
    frames = CINE / ("braise-" + args.revision)
    for frame in range(1, 481):
        if not (frames / f"f_{frame:04d}.png").is_file():
            raise FileNotFoundError(f"Missing Blender frame {frame}")
    # The final nine frames match the actual desktop capture, with the monitor already filling the lens.
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
        "-framerate", "30", "-start_number", "1", "-i", str(frames/"f_%04d.png"),
        "-loop", "1", "-framerate", "30", "-i", str(CINE/"source_assets/generated/desktop-review.png"),
        "-i", str(mix), "-filter_complex",
        "[0:v]setsar=1,format=yuv444p[a];[1:v]scale=854:480,setsar=1,format=yuv444p[b];"
        "[a][b]xfade=transition=fade:duration=0.26:offset=15.70,format=yuv420p[v]",
        "-map", "[v]", "-map", "2:a", "-t", "16", "-c:v", "libx264", "-crf", "16",
        "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        str(args.output)], check=True)

