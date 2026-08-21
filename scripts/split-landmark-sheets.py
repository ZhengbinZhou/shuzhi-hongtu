from pathlib import Path
from PIL import Image

SHEETS = [
    (
        Path("/workspace/shujing-art/landmarks-a.png"),
        [
            "R01-yeping.webp", "R02-hongjing.webp",
            "R03-soviet-museum.webp", "R04-ersuda.webp",
            "R05-military-commission.webp", "R06-soviet-park.webp",
            "N01-bayi-museum.webp", "N02-bayi-tower.webp",
        ],
    ),
    (
        Path("/workspace/shujing-art/landmarks-b.png"),
        [
            "N03-new-fourth-army.webp", "N04-helong-headquarters.webp",
            "A01-anyuan-museum.webp", "A02-workers-club.webp",
            "A03-autumn-harvest-plaza.webp", "S01-shangrao-memorial.webp",
            "S02-maojialing-prison.webp", "S03-fangzhimin-memorial.webp",
        ],
    ),
    (
        Path("/workspace/shujing-art/landmarks-c.png"),
        [
            "XG1-general-park.webp", "XG2-changgang-museum.webp",
            "XG3-lianjiang-academy.webp", "ND1-ningdu-museum.webp",
            "ND2-xiaobu-sites.webp", "XW1-xunwu-museum.webp",
            "XW2-xunwu-site.webp", "LS1-lushan-meeting.webp",
        ],
    ),
]

OUTPUT = Path("public/landmarks")
CANVAS = (800, 520)

for source, filenames in SHEETS:
    image = Image.open(source).convert("RGB")
    width, height = image.size
    cell_width, cell_height = width / 2, height / 4

    for index, filename in enumerate(filenames):
        column, row = index % 2, index // 2
        margin = max(5, round(min(cell_width, cell_height) * 0.012))
        box = (
            round(column * cell_width) + margin,
            round(row * cell_height) + margin,
            round((column + 1) * cell_width) - margin,
            round((row + 1) * cell_height) - margin,
        )
        panel = image.crop(box)
        panel.thumbnail((CANVAS[0] - 24, CANVAS[1] - 18), Image.Resampling.LANCZOS)
        background = Image.new("RGB", CANVAS, panel.getpixel((2, 2)))
        background.paste(panel, ((CANVAS[0] - panel.width) // 2, (CANVAS[1] - panel.height) // 2))
        background.save(OUTPUT / filename, "WEBP", quality=91, method=6)

print("Created 24 dedicated landmark images.")
