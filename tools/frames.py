"""Turn a chain of generated clips into scroll-scrubbed WebP frame sequences.

Usage: python frames.py <sequence_name> <clip1>[:grade|:rev|:grade:rev] <clip2> ...
Writes assets/frames/<sequence_name>/{lg,sm}/0001.webp ... and a manifest.json.
The first frame of every clip after the first is dropped (it repeats the previous clip's last frame).
"""
import os, sys, json, subprocess, tempfile, glob
import numpy as np
from PIL import Image, ImageFilter
from grade import grade

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets")
SIZES = {"lg": 1280, "sm": 720}

def extract(clip):
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(ROOT, "gen", clip + ".mp4"),
                    os.path.join(tmp, "%04d.png")], check=True)
    return sorted(glob.glob(os.path.join(tmp, "*.png")))

def main(name, specs):
    frames = []
    for i, spec in enumerate(specs):
        clip, *opts = spec.split(":")
        fs = extract(clip)
        if "rev" in opts: fs = fs[::-1]
        if i > 0: fs = fs[1:]
        frames += [(f, "grade" in opts) for f in fs]
    out = os.path.join(ROOT, "frames", name)
    for k in SIZES: os.makedirs(os.path.join(out, k), exist_ok=True)
    for n, (f, g) in enumerate(frames, 1):
        im = np.asarray(Image.open(f).convert("RGB"))
        if g: im = grade(im)
        im = Image.fromarray(im)
        for k, w in SIZES.items():
            r = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
            if k == "lg": r = r.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
            r.save(os.path.join(out, k, f"{n:04d}.webp"), quality=78 if k == "lg" else 70, method=6)
    json.dump({"count": len(frames), "w": SIZES["lg"], "h": round(SIZES["lg"] * im.height / im.width)},
              open(os.path.join(out, "manifest.json"), "w"))
    sz = sum(os.path.getsize(p) for p in glob.glob(os.path.join(out, "*", "*.webp")))
    print(name, len(frames), "frames,", round(sz / 1e6, 1), "MB")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:])
