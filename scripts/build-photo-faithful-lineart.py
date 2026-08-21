#!/usr/bin/env python3
"""Build consistent card line art from the manually verified real photographs.

This deliberately uses a deterministic edge-and-tone transformation for the
bulk set: the photographed architecture remains fixed instead of being
re-imagined by a generative model.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps


WIDTH, HEIGHT = 800, 520
BACKGROUND = (248, 239, 222)
INK = (154, 56, 48)


def cover_crop(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    target_ratio = WIDTH / HEIGHT
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        new_width = round(image.height * target_ratio)
        left = (image.width - new_width) // 2
        image = image.crop((left, 0, left + new_width, image.height))
    else:
        new_height = round(image.width / target_ratio)
        top = max(0, (image.height - new_height) // 2)
        image = image.crop((0, top, image.width, top + new_height))
    return image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)


def trace_photo(source: Path) -> Image.Image:
    base = cover_crop(Image.open(source))
    gray = ImageOps.grayscale(ImageEnhance.Contrast(base).enhance(1.08))
    smooth = gray.filter(ImageFilter.MedianFilter(3))

    # Two edge scales retain both the overall silhouette and material detail.
    contour = ImageOps.autocontrast(smooth.filter(ImageFilter.FIND_EDGES), cutoff=2)
    detail = ImageOps.autocontrast(
        ImageChops.difference(smooth, smooth.filter(ImageFilter.GaussianBlur(2.0))),
        cutoff=4,
    )
    contour = contour.point(lambda value: 0 if value < 24 else min(225, int(value * 0.78)))
    detail = detail.point(lambda value: 0 if value < 34 else min(150, int(value * 0.62)))
    ink_mask = ImageChops.lighter(contour, detail).filter(ImageFilter.GaussianBlur(0.25))

    # Very light monochrome tone anchors large walls, roofs, trees, and terrain.
    tone = ImageOps.invert(smooth).point(lambda value: min(44, int(value * 0.18)))
    mask = ImageChops.lighter(ink_mask, tone)
    background = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    ink = Image.new("RGB", (WIDTH, HEIGHT), INK)
    return Image.composite(ink, background, mask)


def mapping(page_source: Path) -> dict[str, str]:
    text = page_source.read_text(encoding="utf-8")
    return {
        spot_id: image_path.removeprefix("/landmarks/")
        for spot_id, image_path in re.findall(r'\{id:"([^"]+)".*?image:"([^"]+)"', text)
    }


def main() -> int:
    project = Path(sys.argv[1]).resolve()
    references = Path(sys.argv[2]).resolve()
    overrides = Path(sys.argv[3]).resolve() if len(sys.argv) > 3 else None
    files = mapping(project / "app/page.tsx")
    if len(files) != 44:
        raise RuntimeError(f"Expected 44 landmarks, found {len(files)}")
    for spot_id, filename in files.items():
        override = overrides / f"{spot_id}.png" if overrides else None
        if override and override.exists():
            output = cover_crop(Image.open(override))
        else:
            output = trace_photo(references / f"{spot_id}.jpg")
        destination = project / "public/landmarks" / filename
        output.save(destination, "WEBP", quality=90, method=6)
        print(f"{spot_id} -> {destination.relative_to(project)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
