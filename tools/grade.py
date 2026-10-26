"""Pastel pink evening grade shared by all clips and keyframes."""
import numpy as np
from PIL import Image

def grade(rgb, hue=0.35, desat=0.5, lift=0.10, tint=0.10):
    """rgb: HxWx3 uint8 -> uint8. Pulls orange/yellow toward rose, softens saturation, lifts toward a creamy white."""
    hsv = np.asarray(Image.fromarray(rgb).convert("HSV")).astype(np.float32)
    h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    band = np.clip(1 - np.abs(((h - 30 + 180) % 360) - 180) / 35, 0, 1)   # peaks at orange (30deg)
    h = (h + (((345 - h + 180) % 360) - 180) * band * hue) % 360
    s = s * (1 - desat * band) * (1 - 0.15 * (1 - band))
    v = np.clip(v + lift * (1 - v) * 1.2, 0, 1)
    out = np.asarray(Image.fromarray(np.stack([h / 360 * 255, s * 255, v * 255], -1).astype("uint8"), "HSV").convert("RGB")).astype(np.float32)
    pink = np.array([248, 214, 224], np.float32)                           # baby pink cream
    out = out * (1 - tint) + pink * tint * (out / 255 * 0.6 + 0.4)
    return np.clip(out, 0, 255).astype("uint8")
