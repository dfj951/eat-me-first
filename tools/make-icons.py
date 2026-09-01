# Generates the app icons with no image library — just zlib and struct.
#
# The mark is the app's own visual signature: the three urgency ticks
# that run down the side of the fridge list, tallest first.
#
#   python tools/make-icons.py

import struct
import zlib
import os

BG = (0x11, 0x18, 0x20)
BARS = [
    ((0xF0, 0x70, 0x5F), 0.56),   # going off now
    ((0xDD, 0xA0, 0x44), 0.42),   # going off soon
    ((0x5D, 0xBE, 0x87), 0.30),   # fine for a while
]


def draw(size):
    """Return `size` rows of RGB bytes."""
    rows = [[BG] * size for _ in range(size)]

    bar_w = max(2, round(size * 0.13))
    gap = max(1, round(size * 0.075))
    group_w = len(BARS) * bar_w + (len(BARS) - 1) * gap
    left = (size - group_w) // 2
    baseline = round(size * 0.78)

    for i, (colour, height_ratio) in enumerate(BARS):
        x0 = left + i * (bar_w + gap)
        h = round(size * height_ratio)
        y0 = baseline - h
        for y in range(y0, baseline):
            for x in range(x0, x0 + bar_w):
                # nudge the corners in so the bars read as rounded
                near_end = y < y0 + 1 or y >= baseline - 1
                if near_end and (x == x0 or x == x0 + bar_w - 1):
                    continue
                rows[y][x] = colour
    return rows


def write_png(path, rows):
    size = len(rows)
    raw = bytearray()
    for row in rows:
        raw.append(0)                     # filter type 0: none
        for r, g, b in row:
            raw += bytes((r, g, b))

    def chunk(tag, data):
        out = struct.pack('>I', len(data)) + tag + data
        return out + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')

    with open(path, 'wb') as f:
        f.write(png)
    print('wrote', path, f'({len(png)} bytes)')


here = os.path.dirname(os.path.abspath(__file__))
public = os.path.join(here, '..', 'public')
os.makedirs(public, exist_ok=True)

for s in (192, 512):
    write_png(os.path.join(public, f'icon-{s}.png'), draw(s))
