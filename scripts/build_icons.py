"""Build 02-G01 blue gradient SVG logo and opaque PNG installation icons."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
base = [(135, 0), (152, 17), (95, 74), (78, 57)]
polygons = []
for rotation in range(4):
    for offset in (0, 26, 52):
        points = [(x + offset, y + offset) for x, y in base]
        for _ in range(rotation):
            points = [(270-y, x) for x,y in points]
        polygons.append(points)
svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 270" role="img" aria-label="三川工方 02-G01 藍色漸層標誌">',
       '<defs><linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#174DAA"/><stop offset="1" stop-color="#23BDD0"/></linearGradient></defs>',
       '<g fill="url(#blue)">']
svg += ['<polygon points="'+ ' '.join(f'{x},{y}' for x,y in points)+'"/>' for points in polygons]
svg += ['</g></svg>']
(root/'logo-02-g01.svg').write_text('\n'.join(svg)+'\n')
for size in (180, 512):
    edge = size * 4
    padding = edge * .12
    factor = (edge - 2*padding) / 270
    mask = Image.new('L', (edge,edge))
    draw = ImageDraw.Draw(mask)
    for points in polygons:
        draw.polygon([(padding+x*factor,padding+y*factor) for x,y in points],fill=255)
    gradient = Image.new('RGB',(edge,edge))
    pixels = gradient.load()
    first, last = (23,77,170), (35,189,208)
    for y in range(edge):
        for x in range(edge):
            t=max(0,min(1,(x+y-2*padding)/(2*(edge-2*padding))))
            pixels[x,y]=tuple(round(a+(b-a)*t) for a,b in zip(first,last))
    image = Image.new('RGB',(edge,edge),'#FFFFFF')
    image.paste(gradient,(0,0),mask)
    image.resize((size,size),Image.Resampling.LANCZOS).save(root/f'icon-{size}.png')
