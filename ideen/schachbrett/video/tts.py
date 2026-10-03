# -*- coding: utf-8 -*-
"""Render every narration line as its own mp3, then decode to trimmed mono PCM.

Per language it writes:
  audio/<lang>/raw/l<NN>.mp3     edge-tts output
  audio/<lang>/pcm/l<NN>.f32     48 kHz mono float32, silence trimmed
  cache/narration_<lang>.json    line + beat timeline
"""
import array
import asyncio
import json
import os
import subprocess
import sys

import edge_tts

ROOT = os.path.dirname(os.path.abspath(__file__))
SR = 48000
# keep a little room-tone either side of a trimmed line so it does not sound clipped
KEEP_HEAD = 0.012
KEEP_TAIL = 0.060
THRESH_DB = -44.0


def decode_to_pcm(mp3_path):
    """mp3 -> list of float samples, 48 kHz mono."""
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", mp3_path, "-ac", "1", "-ar", str(SR),
         "-f", "f32le", "-"], capture_output=True, check=True)
    buf = array.array("f")
    buf.frombytes(out.stdout)
    return buf


def trim(samples):
    """Trim leading/trailing silence using a short-window peak detector."""
    win = int(SR * 0.005)
    thresh = 10.0 ** (THRESH_DB / 20.0)
    n = len(samples)
    first, last = None, None
    for i in range(0, n - win, win):
        peak = 0.0
        for s in samples[i:i + win]:
            a = s if s >= 0 else -s
            if a > peak:
                peak = a
        if peak > thresh:
            if first is None:
                first = i
            last = i + win
    if first is None:
        return samples
    a = max(0, first - int(SR * KEEP_HEAD))
    b = min(n, last + int(SR * KEEP_TAIL))
    return samples[a:b]


async def synth(voice, rate, pitch, text, out_path):
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    with open(out_path, "wb") as fh:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                fh.write(chunk["data"])


async def main():
    with open(os.path.join(ROOT, "script.json"), encoding="utf-8") as fh:
        spec = json.load(fh)

    # --reuse decodes the mp3s that are already on disk instead of calling the
    # TTS service again, so the archive rebuilds without a network connection
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    reuse = "--reuse" in sys.argv

    for lang in (args or ["de", "en"]):
        voice = spec["voices"][lang]
        rate = spec["rate"][lang]
        rawdir = os.path.join(ROOT, "audio", lang, "raw")
        pcmdir = os.path.join(ROOT, "audio", lang, "pcm")
        os.makedirs(rawdir, exist_ok=True)
        os.makedirs(pcmdir, exist_ok=True)

        lines, beats = [], []
        idx = 0
        for beat in spec["beats"]:
            beat_lines = []
            for ln in beat["lines"]:
                mp3 = os.path.join(rawdir, "l%02d.mp3" % idx)
                have = os.path.exists(mp3) and os.path.getsize(mp3) > 1500
                for attempt in range(0 if (reuse and have) else 5):
                    try:
                        await synth(voice, rate, spec["pitch"], ln[lang], mp3)
                        if os.path.getsize(mp3) > 1500:
                            break
                        raise RuntimeError("short file")
                    except Exception as exc:          # noqa: BLE001
                        print("   retry %d: %s" % (attempt + 1, exc))
                        await asyncio.sleep(1.5 + 2 * attempt)
                pcm = trim(decode_to_pcm(mp3))
                with open(os.path.join(pcmdir, "l%02d.f32" % idx), "wb") as fh:
                    fh.write(pcm.tobytes())
                dur = len(pcm) / SR
                lines.append({
                    "i": idx, "beat": beat["id"], "text": ln[lang],
                    "dur": round(dur, 4), "pause": ln["pause"],
                })
                beat_lines.append(idx)
                print("  %2d %-8s %5.2fs  %s" % (idx, beat["id"], dur, ln[lang][:52]))
                idx += 1
            beats.append({"id": beat["id"], "lines": beat_lines})

        speech = sum(l["dur"] for l in lines)
        pauses = sum(l["pause"] for l in lines)
        manifest = {
            "lang": lang, "voice": voice, "title": spec["title"][lang],
            "sr": SR, "speech": round(speech, 3), "pauses": round(pauses, 3),
            "lines": lines, "beats": beats,
            "target_total": spec["target_total"],
        }
        os.makedirs(os.path.join(ROOT, "cache"), exist_ok=True)
        with open(os.path.join(ROOT, "cache", "narration_%s.json" % lang),
                  "w", encoding="utf-8") as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=1)
        print("[%s] %d lines  speech %.2fs + pauses %.2fs = %.2fs\n"
              % (lang, len(lines), speech, pauses, speech + pauses))


if __name__ == "__main__":
    asyncio.run(main())
