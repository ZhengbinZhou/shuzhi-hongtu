#!/usr/bin/env python3
"""Materialize the manually selected real-photo references for the 44 sites."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image


SELECTION = {
    "J01": 1, "J02": 1, "J03": 1, "J04": 1, "J05": 3, "J06": 1,
    "J07": 1, "J08": 1, "J09": 2, "J10": 1,
    "Y01": 3, "Y02": 1, "Y03": 2, "Y04": 1, "Y05": 2, "Y06": 2,
    "Y07": 1, "Y08": 2, "Y09": 3, "Y10": 1,
    "R01": 1, "R02": 1, "R03": 1, "R04": 1, "R05": 3, "R06": 1,
    "N01": 1, "N02": 1, "N03": 1, "N04": 1,
    "A01": 2, "A02": 2, "A03": 1,
    "S01": 1, "S02": 1, "S03": 1,
    "XG1": 1, "XG2": 2, "XG3": 2,
    "ND1": 1, "ND2": 1,
    "XW1": 1, "XW2": 3, "LS1": 1,
}


def fetch(url: str) -> bytes:
    return subprocess.run(
        ["curl", "-L", "--fail", "--silent", "--show-error", "--retry", "1",
         "--max-time", "30", "-A", "Mozilla/5.0", url],
        check=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    ).stdout


def one(spot_id: str, candidate: dict[str, object], target: Path) -> tuple[str, str]:
    source = str(candidate.get("original_image_url") or candidate.get("image_url") or "")
    try:
        payload = fetch(source)
        with Image.open(BytesIO(payload)) as image:
            image.load()
            if image.width < 400 or image.height < 240:
                raise ValueError("original too small")
            image.convert("RGB").save(target / f"{spot_id}.jpg", quality=94)
        return spot_id, "original"
    except Exception:
        shutil.copy2(str(candidate["file"]), target / f"{spot_id}.jpg")
        return spot_id, "thumbnail-fallback"


def main() -> int:
    manifest_path = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/landmark-reference-candidates/manifest.json")
    target = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/landmark-selected-references")
    target.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    provenance = {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {}
        for spot_id, candidate_number in SELECTION.items():
            candidate = manifest[spot_id]["candidates"][candidate_number - 1]
            futures[pool.submit(one, spot_id, candidate, target)] = (spot_id, candidate_number, candidate)
        for future in as_completed(futures):
            spot_id, candidate_number, candidate = futures[future]
            _, quality = future.result()
            provenance[spot_id] = {
                "candidate": candidate_number,
                "quality": quality,
                "title": candidate["title"],
                "page_url": candidate["page_url"],
                "image_url": candidate.get("original_image_url") or candidate.get("image_url"),
                "local_file": str(target / f"{spot_id}.jpg"),
            }
            print(f"{spot_id}: {quality}", flush=True)
    (target / "provenance.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
