#!/usr/bin/env python3
"""Sample the source image at random points and emit a JSON particle manifest.

Each particle is one dot that flies from off-screen to a position on the
image. We sample N random (x, y) points uniformly across the image and
record the color at each. The runtime uses this to render colored dots
that converge onto the image.

Why random points (not a regular grid):
    A grid produces visible "rows" of particles that arrive together,
    which looks mechanical. Random points (with a minimum spacing
    constraint so they don't clump) give a more natural, organic
    reveal.

Usage:
    python scripts/particle-sample.py
"""
import json
import random
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(r"C:\Users\yashr\Downloads\file_000000008b94720bbb5914dc4ed671e1.png")
OUT_DIR = ROOT / "src" / "data" / "particle"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Number of particles. ~1400 gives a fine, halftone-like density without
# killing performance — each one is a DOM div with a transform. The
# pairing particles are smaller (3px) so the higher count reads as a
# finer grain rather than a chunkier cloud.
PARTICLE_COUNT = 1400
# Min spacing between particles (as fraction of image width). 0.012 means
# no two particles within 1.2% of the image width. Tightened from 0.022
# so the higher count actually fits — at the old spacing the rejection
# loop would have capped us near 600.
MIN_SPACING = 0.012
# Seed for deterministic output — same particles every build.
SEED = 7


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    print(f"Source: {w}x{h}")

    rng = random.Random(SEED)
    min_dx = MIN_SPACING
    min_dy = MIN_SPACING * (h / w)  # scale spacing by aspect

    particles: list[dict] = []
    attempts = 0
    max_attempts = PARTICLE_COUNT * 50
    while len(particles) < PARTICLE_COUNT and attempts < max_attempts:
        attempts += 1
        # Sample at native pixel resolution
        x = rng.uniform(0, w - 1)
        y = rng.uniform(0, h - 1)
        # Min spacing check (skip for performance — random rejection is fine)
        too_close = False
        for p in particles[-20:]:  # only check last 20 for speed
            if abs(p["x"] - x) < min_dx * w and abs(p["y"] - y) < min_dy * h:
                too_close = True
                break
        if too_close:
            continue
        # Sample color at this position (use Image.getpixel for accuracy)
        r, g, b, a = img.getpixel((int(x), int(y)))
        if a < 16:
            continue
        # Skip near-white pixels (would be invisible dots)
        if min(r, g, b) > 245:
            continue
        # Compute the "edge score" — pixels too close to the image edge
        # would land on the background wall, skip them. Use 4% margin.
        fx, fy = x / w, y / h
        if fx < 0.04 or fx > 0.96 or fy < 0.02 or fy > 0.98:
            continue
        particles.append({
            "x": round(fx, 4),
            "y": round(fy, 4),
            "r": r,
            "g": g,
            "b": b,
        })

    print(f"Sampled {len(particles)} particles in {attempts} attempts")

    # Compute the natural aspect ratio (used by the runtime to size the image)
    aspect = w / h

    manifest = {
        "slug": "portrait",
        "label": "portrait — assembles on scroll",
        "source": str(SRC.name),
        "sourceSize": [w, h],
        "aspect": aspect,
        "count": len(particles),
        "particles": particles,
    }

    out = OUT_DIR / "portrait.json"
    out.write_text(json.dumps(manifest, separators=(",", ":")))
    print(f"Wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
