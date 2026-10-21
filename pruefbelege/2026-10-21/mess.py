import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('L')
for spec in sys.argv[2:]:
    name, box = spec.split('=')
    x0,y0,x1,y1 = map(int, box.split(','))
    c = im.crop((x0,y0,x1,y1)); px = list(c.getdata()); px.sort()
    n = len(px)
    print(f'{name:28s} max {px[-1]:3d}  p95 {px[int(n*0.95)]:3d}  >=200: {sum(1 for v in px if v>=200):4d}  >=240: {sum(1 for v in px if v>=240):4d}')
