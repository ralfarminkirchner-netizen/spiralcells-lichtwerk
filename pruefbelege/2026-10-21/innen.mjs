import {N, B} from './lage.mjs';
console.log('\n--- Fäden innerhalb FASKA');
N.faeden.forEach((f, fi) => { if(f.bzVon !== 0 || f.bzNach !== 0) return; const A = N.pos[f.von], Bp = N.pos[f.nach], d = Math.hypot(A[0] - Bp[0], A[2] - Bp[2]);
  console.log(fi, B.monde[f.von].titel, '->', B.monde[f.nach].titel, f.typ, 'kanten', f.kanten.length, 'verw', f.verwendung, 'd', d.toFixed(2), 'n', Math.round(Math.min(140, Math.max(18, d * 5))), 'rM nach', N.rM[f.nach].toFixed(2)); });
