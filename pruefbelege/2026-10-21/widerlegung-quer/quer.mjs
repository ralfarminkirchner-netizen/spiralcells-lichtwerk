import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const {Netz} = await import(R + 'app/js/netz.js');
const datei = process.argv[2] || 'kette-gewebe';
const g = JSON.parse(readFileSync(R + 'testdaten/' + datei + '/state.json', 'utf8'));
const B = bestand(g), N = new Netz(B, JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8')));
const mix = (a, b, t) => a + (b - a) * t;
function bogen(ca, Ra, cb, Rb){
  const dx = cb[0] - ca[0], dz = cb[2] - ca[2], dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl;
  const A = [ca[0] + ux * Ra, ca[2] + uz * Ra], Bq = [cb[0] - ux * Rb, cb[2] - uz * Rb], d = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), quer = d * 0.12, lift = d * 0.12 + 0.6;
  return t => { const w = Math.sin(Math.PI * t); return [mix(A[0], Bq[0], t) - uz * quer * w, w * lift, mix(A[1], Bq[1], t) + ux * quer * w]; };
}
function fadenWeg(N, f, A, Bp){
  const d = Math.hypot(A[0] - Bp[0], A[2] - Bp[2]), lift = d * 0.16 + 0.4;
  const za = f.bzVon === f.bzNach ? null : N.bezirkZiel(f.bzVon), zb = za ? N.bezirkZiel(f.bzNach) : null;
  if(!za || !zb) return t => [mix(A[0], Bp[0], t), mix(A[1], Bp[1], t) + Math.sin(Math.PI * t) * lift, mix(A[2], Bp[2], t)];
  const dx = zb.mitte[0] - za.mitte[0], dz = zb.mitte[2] - za.mitte[2], dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl;
  const P1 = [za.mitte[0] + ux * za.R, za.mitte[2] + uz * za.R], P2 = [zb.mitte[0] - ux * zb.R, zb.mitte[2] - uz * zb.R];
  return t => { const s = 1 - t, b0 = s * s * s, b1 = 3 * s * s * t, b2 = 3 * s * t * t, b3 = t * t * t;
    return [b0 * A[0] + b1 * P1[0] + b2 * P2[0] + b3 * Bp[0], mix(A[1], Bp[1], t) + Math.sin(Math.PI * t) * lift, b0 * A[2] + b1 * P1[1] + b2 * P2[1] + b3 * Bp[2]]; };
}
const name = b => b === 'mitte' ? 'Zentrale' : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
const bez = [['mitte', N.L.mitte], ...N.daecher.map((d, j) => [j, d]), ...(N.L.ohne ? [['ohne', N.L.ohne]] : [])];
console.log('Bezirke:'); for(const [k, z] of bez) console.log(' ', name(k), 'mitte', z.mitte[0].toFixed(1), z.mitte[2].toFixed(1), 'R', z.R.toFixed(1));
console.log('\nBündel (Überblick):');
for(const x of N.buendel){ const za = N.bezirkZiel(x.von), zb = N.bezirkZiel(x.nach); if(!za || !zb) continue;
  const pt = bogen(za.mitte, za.R, zb.mitte, zb.R); const hits = [];
  for(const [k, z] of bez){ if(k === x.von || k === x.nach) continue; let tief = -1, tt = 0, sum = 0;
    for(let s = 0; s <= 400; s++){ const t = s / 400, q = pt(t), dd = z.R - Math.hypot(q[0] - z.mitte[0], q[2] - z.mitte[2]); if(dd > tief){ tief = dd; tt = t; } if(dd > 0) sum++; }
    if(tief > 0) hits.push(`${name(k)} tief ${tief.toFixed(2)} (R ${z.R.toFixed(1)}, ${(100*tief/z.R).toFixed(0)}% des R) bei t=${tt.toFixed(2)}, Anteil im Kreis ${(100*sum/401).toFixed(0)}%`); }
  console.log(' ', name(x.von), '->', name(x.nach), 'typ', x.typ, 'kanten', x.kanten, hits.length ? '  SCHNITT: ' + hits.join('; ') : '  frei'); }
console.log('\nFäden über Bezirksgrenzen (einzeln, im Dach oder an der Wahl):');
for(const [fi, f] of N.faeden.entries()){ const A = N.pos[f.von], Bp = N.pos[f.nach], pt = fadenWeg(N, f, A, Bp);
  const hits = [];
  for(const [k, z] of bez){ if(k === f.bzVon || k === f.bzNach) continue; let tief = -1;
    for(let s = 0; s <= 400; s++){ const q = pt(s / 400), dd = z.R - Math.hypot(q[0] - z.mitte[0], q[2] - z.mitte[2]); if(dd > tief) tief = dd; }
    if(tief > 0) hits.push(`${name(k)} ${tief.toFixed(2)}/${z.R.toFixed(1)}`); }
  // Bereiche des eigenen/fremden Dachs, in denen weder Quelle noch Ziel liegen
  const bh = [];
  for(const dj of [f.bzVon, f.bzNach]){ if(typeof dj !== 'number') continue; const d = N.daecher[dj];
    for(const b of d.bereiche){ if(b.werke.includes(f.von) || b.werke.includes(f.nach)) continue; let tief = -1;
      for(let s = 0; s <= 400; s++){ const q = pt(s / 400), dd = b.R - Math.hypot(q[0] - b.mitte[0], q[2] - b.mitte[2]); if(dd > tief) tief = dd; }
      if(tief > 0) bh.push(`Bereich ${b.name} ${tief.toFixed(2)}/${b.R.toFixed(1)}`); } }
  // fremde Werke, an denen der Faden nah vorbeigeht
  const wh = []; for(let n = 0; n < N.N; n++){ if(n === f.von || n === f.nach || N.baum.material.has(n)) continue; let mn = 1e9;
    for(let s = 0; s <= 400; s++){ const q = pt(s / 400); mn = Math.min(mn, Math.hypot(q[0] - N.pos[n][0], q[2] - N.pos[n][2])); }
    if(mn < N.rM[n]) wh.push(`${B.monde[n].titel.slice(0, 30)} (Abstand ${mn.toFixed(2)}, rM ${N.rM[n].toFixed(2)})`); }
  if(f.bzVon === f.bzNach && !hits.length && !bh.length && !wh.length) continue;
  console.log(' ', fi, B.monde[f.von].titel.slice(0, 32), '[' + name(f.bzVon) + '] ->', B.monde[f.nach].titel.slice(0, 32), '[' + name(f.bzNach) + ']', f.typ, 'k', f.kanten.length);
  if(hits.length) console.log('     Bezirke:', hits.join('; '));
  if(bh.length) console.log('     ', bh.join('; '));
  if(wh.length) console.log('      Werke:', wh.join('; ')); }
