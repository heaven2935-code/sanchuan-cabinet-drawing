"""Validate installed assets, including corruption missed by PNG headers."""
import json
import re
import struct
import zlib
from pathlib import Path
from urllib.parse import urlsplit
from PIL import Image

root = Path(__file__).resolve().parents[1]
html = (root/'index.html').read_text()
manifest_link = re.search(r'<link rel="manifest" href="([^"]+)"', html).group(1)
manifest = json.loads((root/urlsplit(manifest_link).path).read_text())
touch = re.search(r'<link rel="apple-touch-icon" sizes="180x180" href="([^"]+)"', html).group(1)
assert urlsplit(touch).query == urlsplit(manifest_link).query == 'v=1.4.0'
assert manifest['display'] == 'standalone'
assert manifest['start_url'] == manifest['scope'] == './'
for icon in manifest['icons']:
    assert urlsplit(icon['src']).query == 'v=1.4.0'
    path = root/urlsplit(icon['src']).path
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    pos = 8
    types = []
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos+4])[0]
        chunk = data[pos+4:pos+8+length]
        assert len(data[pos+8:pos+8+length]) == length
        crc = struct.unpack('>I', data[pos+8+length:pos+12+length])[0]
        assert zlib.crc32(chunk) & 0xffffffff == crc, path
        types.append(chunk[:4])
        pos += 12+length
    assert pos == len(data) and types[-1] == b'IEND'
    with Image.open(path) as image: image.verify()
    with Image.open(path) as image:
        image.load()
        assert image.size == tuple(map(int, icon['sizes'].split('x')))
        assert image.mode == 'RGB'
assert urlsplit(touch).path == urlsplit(manifest['icons'][0]['src']).path
print('PASS: PNG CRC, decoding, sizes, and installation URLs')
