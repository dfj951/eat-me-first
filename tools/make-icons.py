# Generates the app icons with no image library — just zlib and struct.
#
# The mark: a round piece of food with a bite taken out of it. Reads at
# 32 pixels on a home screen, which the three coloured bars it replaced
# did not. Drawn at three times the size and averaged down, because
# without anti-aliasing a circle at this scale looks like a cog.
#
#   python tools/make-icons.py

import struct
import zlib
import os

BG = (0x11, 0x18, 0x20)      # the app's ink
FOOD = (0xF0, 0x70, 0x5F)    # the same red that means "eat this now"

SS = 3                       # supersampling factor


def draw(size):
    """Return `size` rows of RGB tuples."""
    big = size * SS

    # the food itself
    cx, cy, r = big * 0.46, big * 0.54, big * 0.34
    # and the bite out of its top right
    bx, by, br = big * 0.78, big * 0.26, big * 0.20

    rows = []
    for y in range(size):
        row = []
        for x in range(size):
            hits = 0
            for sy in range(SS):
                for sx in range(SS):
                    px = x * SS + sx + 0.5
                    py = y * SS + sy + 0.5
                    inside = (px - cx) ** 2 + (py - cy) ** 2 <= r * r
                    bitten = (px - bx) ** 2 + (py - by) ** 2 <= br * br
                    if inside and not bitten:
                        hits += 1

            # blend the food colour over the background by coverage
            weight = hits / (SS * SS)
            row.append(tuple(
                round(BG[i] + (FOOD[i] - BG[i]) * weight) for i in range(3)
            ))
        rows.append(row)
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
    print('wrote', os.path.basename(path), f'({len(png)} bytes)')


here = os.path.dirname(os.path.abspath(__file__))
public = os.path.join(here, '..', 'public')
os.makedirs(public, exist_ok=True)

for s in (192, 512):
    write_png(os.path.join(public, f'icon-{s}.png'), draw(s))
