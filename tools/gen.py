"""Generate cafe tour assets on free Hugging Face ZeroGPU Spaces.

Usage:
  python gen.py image <out_name> "<prompt>" [seed]
  python gen.py video <out_name> <start_image_or_clip.mp4> "<prompt>" [seed] [seconds]

If the start is an .mp4, its last frame is used, so clips chain into one continuous take.
The HF token is read from the HF_TOKEN env var (or the Windows user environment).
"""
import os, sys, shutil, subprocess, time, json
from gradio_client import Client, handle_file

GEN = os.path.join(os.path.dirname(__file__), "..", "assets", "gen")
os.makedirs(GEN, exist_ok=True)
LOG = os.path.join(GEN, "log.jsonl")

STYLE = ("pastel pink and baby pink walls, creamy white details, soft warm evening lighting, "
         "warm glowing pendant lamps, cozy, dreamy, photorealistic, cinematic, 35mm film look")
NEG = ("people, person, crowd, faces, hands, text, letters, watermark, logo, orange tint, yellow tint, "
       "oversaturated, blurry, distorted, low quality, jpeg artifacts, static, cut, scene change")

def token():
    t = os.environ.get("HF_TOKEN")
    if not t and os.name == "nt":
        import winreg
        t = winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment"), "HF_TOKEN")[0]
    return t

def last_frame(src):
    if not src.endswith(".mp4"):
        return src
    out = src[:-4] + "_last.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-sseof", "-0.1", "-i", src, "-frames:v", "1", "-update", "1", out], check=True)
    # Re-grade toward pastel pink so the next clip keeps the palette instead of drifting orange
    import numpy as np
    from PIL import Image
    from grade import grade
    Image.fromarray(grade(np.asarray(Image.open(out).convert("RGB")))).save(out)
    return out

def log(**kw):
    with open(LOG, "a", encoding="utf-8") as f: f.write(json.dumps(kw) + "\n")

def image(name, prompt, seed=7):
    c = Client("black-forest-labs/FLUX.1-schnell", token=token(), verbose=False)
    r, s = c.predict(prompt=f"{prompt}, {STYLE}, no people, no text", seed=seed, randomize_seed=False,
                     width=1344, height=768, num_inference_steps=4, api_name="/infer")
    out = os.path.join(GEN, name + ".png")
    from PIL import Image
    Image.open(r).convert("RGB").save(out)
    return out

def video(name, start, prompt, seed=11, secs=5):
    start = last_frame(os.path.join(GEN, start) if not os.path.isabs(start) else start)
    c = Client("zerogpu-aoti/wan2-2-fp8da-aoti-faster", token=token(), verbose=False)
    v, s = c.predict(input_image=handle_file(start), prompt=f"{prompt}. {STYLE}. Empty cafe, no people.",
                     negative_prompt=NEG, steps=6, duration_seconds=secs, guidance_scale=1, guidance_scale_2=1,
                     seed=seed, randomize_seed=False, api_name="/generate_video")
    out = os.path.join(GEN, name + ".mp4")
    shutil.copy(v, out)
    return out

if __name__ == "__main__":
    kind, name = sys.argv[1], sys.argv[2]
    t = time.time()
    try:
        if kind == "image":
            out = image(name, sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 7)
        else:
            out = video(name, sys.argv[3], sys.argv[4], int(sys.argv[5]) if len(sys.argv) > 5 else 11,
                        float(sys.argv[6]) if len(sys.argv) > 6 else 5)
        log(kind=kind, name=name, ok=True, secs=round(time.time() - t), args=sys.argv[3:])
        print("OK", out, round(time.time() - t), "s")
    except Exception as e:
        log(kind=kind, name=name, ok=False, err=str(e)[:300], args=sys.argv[3:])
        print("ERR", str(e)[:500]); sys.exit(1)
