from PIL import Image
import sys
S='/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/standbilder/'
f, x0, x1, y0, y1 = sys.argv[1], *map(int, sys.argv[2:6])
im=Image.open(S+f).convert('L')
for y in range(y0,y1):
    row=[im.getpixel((x,y)) for x in range(x0,x1)]
    print(y, max(row), sum(1 for v in row if v>60), ''.join('#' if v>90 else ('+' if v>55 else ('.' if v>30 else ' ')) for v in row))
