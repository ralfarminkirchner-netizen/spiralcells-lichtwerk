import sys, json, math
from PIL import Image, ImageDraw
src, js, out, k, rot, mode = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5]), sys.argv[6]
cx, cy = float(sys.argv[7]), float(sys.argv[8])
crop = [int(v) for v in sys.argv[9].split(',')] if len(sys.argv) > 9 else None
d = json.load(open(js))
im = Image.open(src).convert('RGB')
S = 4
im = im.resize((im.width*S, im.height*S), Image.LANCZOS)
im = im.point(lambda v: int(255*((v/255)**(1/1.6))))
dr = ImageDraw.Draw(im)
c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
def sc(p):
    x, z = p[0]*c - p[2]*s, p[0]*s + p[2]*c
    return ((cx + k*x)*S, (cy + k*z)*S)
col = {'stiel': (255,255,255), 'wechsel': (255,0,255), 'faden': (0,255,255), 'lese': (255,255,0)}
if 'k' in mode:
    for (x,y,z,st) in d['koerner'][::3]:
        u,v = sc((x,y,z)); cc = {0:(255,140,50),1:(80,180,255),2:(100,255,120)}.get(st,(150,150,150))
        dr.ellipse((u-2,v-2,u+2,v+2), fill=cc)
for g in d['seg']:
    if g['t'][0] not in mode: continue
    a, b = sc(g['a']), sc(g['b'])
    dr.line([a, b], fill=col[g['t']], width=1)
if crop: im = im.crop(tuple(v*S for v in crop))
im.save(out, quality=92)
