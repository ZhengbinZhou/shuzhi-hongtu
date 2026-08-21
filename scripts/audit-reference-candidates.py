#!/usr/bin/env python3
"""Download visual-reference candidates for the 44 landmark audit.

The files are research inputs only. They are kept outside the public site assets
and must be manually reviewed before any image-generation/editing step.
"""

from __future__ import annotations

import html
import json
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image


LANDMARKS = {
    "J01": "井冈山革命博物馆 外观",
    "J02": "井冈山革命烈士陵园 外观",
    "J03": "茨坪革命旧址群 外观",
    "J04": "黄洋界哨口 纪念碑 实景",
    "J05": "茅坪八角楼 毛泽东旧居 外观",
    "J06": "小井红军医院旧址 外观",
    "J07": "大井毛泽东同志旧居 外观",
    "J08": "井冈山会师纪念馆 外观",
    "J09": "井冈山挑粮小道 实景",
    "J10": "井冈山柏露红色教育区 实景",
    "Y01": "中央红军长征集结出发地纪念园 外观",
    "Y02": "中央红军长征出发纪念馆 外观",
    "Y03": "于都东门渡口 实景",
    "Y04": "中央红军长征出发纪念碑 外观",
    "Y05": "于都红四军军部旧址 葛氏宗祠 外观",
    "Y06": "于都中共赣南省委旧址 外观",
    "Y07": "于都赣南省苏维埃政府旧址 外观",
    "Y08": "于都祁禄山红军小道 实景",
    "Y09": "于都长征历史步道 实景",
    "Y10": "于都潭头村 实景",
    "R01": "瑞金叶坪革命旧址群 外观",
    "R02": "瑞金沙洲坝红井 革命旧址群 实景",
    "R03": "中央革命根据地历史博物馆 外观",
    "R04": "瑞金二苏大革命旧址 中央大礼堂 外观",
    "R05": "瑞金中央革命军事委员会旧址 外观",
    "R06": "瑞金中华苏维埃纪念园 外观",
    "N01": "南昌八一起义纪念馆 外观",
    "N02": "八一南昌起义纪念塔 外观",
    "N03": "南昌新四军军部旧址陈列馆 外观",
    "N04": "南昌贺龙指挥部旧址 外观",
    "A01": "安源路矿工人运动纪念馆 外观",
    "A02": "安源路矿工人俱乐部旧址 外观",
    "A03": "萍乡秋收起义广场 纪念碑 实景",
    "S01": "上饶集中营革命烈士纪念馆 外观",
    "S02": "上饶茅家岭监狱旧址 外观",
    "S03": "弋阳方志敏纪念馆 外观",
    "XG1": "兴国将军园 外观",
    "XG2": "兴国长冈乡调查纪念馆 外观",
    "XG3": "兴国潋江书院 毛泽东旧居 外观",
    "ND1": "宁都起义纪念馆 外观",
    "ND2": "宁都小布红色旧址群 外观",
    "XW1": "寻乌调查纪念馆 外观",
    "XW2": "毛泽东寻乌调查旧址 外观",
    "LS1": "庐山会议旧址 外观",
}

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/150 Safari/537.36"


def fetch(url: str, timeout: int = 20) -> bytes:
    process = subprocess.run(
        [
            "curl", "-L", "--fail", "--silent", "--show-error",
            "--retry", "2", "--retry-delay", "1", "--max-time", str(timeout),
            "-A", UA, url,
        ],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    return process.stdout


def candidates(query: str) -> list[dict[str, str]]:
    encoded = urllib.parse.quote(query)
    source = fetch(f"https://duckduckgo.com/?q={encoded}&iax=images&ia=images").decode("utf-8", "ignore")
    token_match = re.search(r'vqd="([^"]+)"', source)
    if not token_match:
        return []
    token = token_match.group(1)
    api_url = f"https://duckduckgo.com/i.js?l=zh-cn&o=json&q={encoded}&vqd={token}"
    state = json.loads(fetch(api_url).decode("utf-8", "ignore"))
    results = state.get("results", [])
    return [
        {
            "image_url": row.get("thumbnail") or row.get("image") or "",
            "original_image_url": row.get("image") or "",
            "page_url": row.get("url") or "",
            "title": row.get("title") or "",
        }
        for row in results
        if row.get("image") or row.get("thumbnail")
    ]


def collect_one(root: Path, spot_id: str, query: str, limit: int) -> tuple[str, dict[str, object]]:
    spot_dir = root / spot_id
    spot_dir.mkdir(exist_ok=True)
    accepted = []
    try:
        rows = candidates(query)
    except Exception as exc:
        return spot_id, {"query": query, "candidates": [], "error": str(exc)}
    for row in rows:
        if len(accepted) >= limit:
            break
        try:
            payload = fetch(row["image_url"], timeout=12)
            with Image.open(BytesIO(payload)) as image:
                image.load()
                if image.width < 300 or image.height < 200:
                    continue
                image = image.convert("RGB")
                out = spot_dir / f"candidate-{len(accepted) + 1}.jpg"
                image.thumbnail((1600, 1200), Image.Resampling.LANCZOS)
                image.save(out, quality=90)
                accepted.append({**row, "file": str(out), "size": [image.width, image.height]})
        except Exception:
            continue
    return spot_id, {"query": query, "candidates": accepted}


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/landmark-reference-candidates")
    root.mkdir(parents=True, exist_ok=True)
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    manifest: dict[str, dict[str, object]] = {}
    completed = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(collect_one, root, spot_id, query, limit) for spot_id, query in LANDMARKS.items()]
        for future in as_completed(futures):
            spot_id, result = future.result()
            manifest[spot_id] = result
            completed += 1
            print(f"[{completed:02d}/{len(LANDMARKS)}] {spot_id}: {len(result['candidates'])} candidates", flush=True)
    (root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
