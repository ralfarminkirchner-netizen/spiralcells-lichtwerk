import sys, json, math
from PIL import Image
img, js = sys.argv[1], sys.argv[2]
k, cx, cy = float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
im = Image.open(img).convert('L'); W,H = im.size; px = im.load()
d = json.load(open(js))
def s(p): return (cx + k*p[0], cy + k*p[2])
def mittel(A, B, off, nx, ny):
    v = []
    for i in range(15, 86):
        t = i/100; x, y = A[0]+(B[0]-A[0])*t + nx*off, A[1]+(B[1]-A[1])*t + ny*off
        xi, yi = int(round(x)), int(round(y))
        if 0 <= xi < W and 0 <= yi < H: v.append(px[xi, yi])
    return sum(v)/len(v) if v else 0
rows = []
for g in d['seg']:
    A, B = s(g['a']), s(g['b']); L = math.hypot(B[0]-A[0], B[1]-A[1])
    if L < 25: continue
    nx, ny = -(B[1]-A[1])/L, (B[0]-A[0])/L
    on = max(mittel(A, B, o, nx, ny) for o in (-1, 0, 1)); nb = [mittel(A, B, o, nx, ny) for o in (-7, -6, -5, 5, 6, 7)]
    rows.append((on - sum(nb)/len(nb), g['t'], g['i'], g['p'], round(g['al'],3), round(L), f"{A[0]:.0f},{A[1]:.0f}->{B[0]:.0f},{B[1]:.0f}", round(math.hypot(g['a'][0]-g['b'][0], g['a'][2]-g['b'][2])/d['R'],2)))
rows.sort(reverse=True)
for r in rows[:25]: print(f'Kontrast {r[0]:+.1f}  {r[1]:8s} {r[2]:>3}->{r[3]:>3} alpha {r[4]:<6} {r[5]:>4}px {r[6]}  Länge {r[7]}R')
print('...'); 
for t in ['stiel','wechsel','faden','lese']:
    xs = [r[0] for r in rows if r[1]==t]; print(t, 'Anzahl', len(xs), 'sichtbar (>+3)', sum(1 for x in xs if x > 3))
