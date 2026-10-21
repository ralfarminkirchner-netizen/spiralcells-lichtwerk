import json, math, sys
d = json.load(open(sys.argv[1])); k, cx, cy = 165, 399, 299
def s(p): return (cx + k*p[0], cy + k*p[2])
def dist(P, A, B):
    vx, vy = B[0]-A[0], B[1]-A[1]; L2 = vx*vx+vy*vy or 1; t = max(0, min(1, ((P[0]-A[0])*vx + (P[1]-A[1])*vy)/L2))
    return math.hypot(A[0]+t*vx-P[0], A[1]+t*vy-P[1])
ziele = {'senkrecht x367 y280-347': ((367,285),(367,343)), 'senkrecht x465 y280-360': ((465,285),(465,355)),
         'waagerecht y348 x390-470': ((395,348),(465,348)), 'schräg 373,263-427,290': ((375,264),(425,289))}
for name, (P1, P2) in ziele.items():
    cand = []
    for g in d['seg']:
        A, B = s(g['a']), s(g['b'])
        e = max(dist(P1, A, B), dist(P2, A, B), dist(((P1[0]+P2[0])/2, (P1[1]+P2[1])/2), A, B))
        if e < 6: cand.append((round(e,1), g['t'], g['i'], g['p'], round(g['al'],3), f"{A[0]:.0f},{A[1]:.0f}->{B[0]:.0f},{B[1]:.0f}", round(math.hypot(g['a'][0]-g['b'][0], g['a'][2]-g['b'][2])/d['R'],2)))
    cand.sort(); print(name); [print('   ', c) for c in cand[:5]] if cand else print('    keine Linie innerhalb 6 px')
