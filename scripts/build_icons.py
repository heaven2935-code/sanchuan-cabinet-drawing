"""Rebuild lossless, opaque home-screen icons. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
for size in (180, 512):
    scale = 4
    edge = size * scale
    image = Image.new('RGB', (edge, edge), '#222a30')
    draw = ImageDraw.Draw(image)
    points = [(edge*.5, edge*.15), (edge*.85, edge*.5),
              (edge*.5, edge*.85), (edge*.15, edge*.5), (edge*.5, edge*.15)]
    draw.line(points, fill='#dfa28d', width=round(edge*.025), joint='curve')
    for y, width in ((.39, .25), (.50, .20), (.61, .30)):
        draw.rounded_rectangle((edge*(.5-width/2), edge*(y-.015),
                                edge*(.5+width/2), edge*(y+.015)),
                               radius=edge*.012, fill='#dfa28d')
    image.resize((size, size), Image.Resampling.LANCZOS).save(root / f'icon-{size}.png')
