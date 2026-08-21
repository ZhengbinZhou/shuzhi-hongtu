#!/usr/bin/env python3
"""Strengthen the existing verified line-art assets without changing composition.

The current WebP files are treated as the sole visual source. The transformation
only increases the opacity and local continuity of marks that already exist, so
architecture, perspective, cropping, and landmark details remain unchanged.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


BACKGROUND = (248, 239, 222)
INK = (154, 56, 48)
EXCLUDED = {"JGS05-bajiaolou.webp", "JGS07-dajing.webp"}


def estimate_ink_mask(image: Image.Image) -> Image.Image:
    """Estimate the existing red-ink opacity by projection onto the site palette."""
    rgb = image.convert("RGB")
    pixels = list(rgb.getdata())
    direction = tuple(bg - ink for bg, ink in zip(BACKGROUND, INK))
    denominator = sum(value * value for value in direction)
    mask = []
    for pixel in pixels:
        displacement = tuple(bg - value for bg, value in zip(BACKGROUND, pixel))
        alpha = sum(a * b for a, b in zip(displacement, direction)) / denominator
        mask.append(max(0, min(255, round(alpha * 255))))
    result = Image.new("L", rgb.size)
    result.putdata(mask)
    return result


def strengthen(image: Image.Image) -> Image.Image:
    mask = estimate_ink_mask(image)

    # Reveal faint verified traces and give existing contours slightly more
    # continuity. No new edge detection or generative reconstruction is used.
    boosted = mask.point(
        lambda value: min(255, round(255 * ((value / 255) ** 0.72) * 1.04))
    )
    nearby = boosted.filter(ImageFilter.MaxFilter(3)).point(
        lambda value: round(value * 0.34)
    )
    final_mask = ImageChops.lighter(boosted, nearby)

    background = Image.new("RGB", image.size, BACKGROUND)
    ink = Image.new("RGB", image.size, INK)
    return Image.composite(ink, background, final_mask)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project", type=Path)
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Write enhanced copies here instead of replacing project assets.",
    )
    args = parser.parse_args()

    source_dir = args.project.resolve() / "public" / "landmarks"
    destination_dir = args.output_dir.resolve() if args.output_dir else source_dir
    destination_dir.mkdir(parents=True, exist_ok=True)

    processed = 0
    for source in sorted(source_dir.glob("*.webp")):
        if source.name in EXCLUDED:
            continue
        image = Image.open(source)
        output = strengthen(image)
        destination = destination_dir / source.name
        output.save(destination, "WEBP", quality=92, method=6)
        processed += 1
        print(f"{source.name} -> {destination}")

    if processed != 42:
        raise RuntimeError(f"Expected to strengthen 42 images, processed {processed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
