import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const {Netz} = await import(R + 'app/js/netz.js');
const g = JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(g), N = new Netz(B, JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8')));
const mix = (a, b, t) => a + (b - a) * t;
function fadenWeg(N, f, A, Bp){
  const d = Math.hypot(A[0] - Bp[0], A[2] - Bp[2]), lift = d * 0.16 + 0.4;
  const za = f.bzVon === f.bzNach ? null : N.bezirkZiel(f.bzVon), zb = za ? N.bezirkZiel(f.bzNach) : null;
  if(!za || !zb) return t => [mix(A[0], Bp[0], t), mix(A[1], Bp[1], t) + Math.sin(Math.PI * t) * lift, mix(A[2], Bp[2], t)];
  const dx = zb.mitte[0] - za.mitte[0], dz = zb.mitte[2] - za.mitte[2], dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl;
  const P1 = [za.mitte[0] + ux * za.R, za.mitte[2] + uz * za.R], P2 = [zb.mitte[0] - ux * zb.R, zb.mitte[2] - uz * zb.R];
  return t => { const s = 1 - t, b0 = s * s * s, b1 = 3 * s * s * t, b2 = 3 * s * t * t, b3 = t * t * t;
    return [b0 * A[0] + b1 * P1[0] + b2 * P2[0] + b3 * Bp[0], mix(A[1], Bp[1], t) + Math.sin(Math.PI * t) * lift, b0 * A[2] + b1 * P1[1] + b2 * P2[1] + b3 * Bp[2]]; };
}
const fi = N.faeden.findIndex(f => B.monde[f.von].titel.startsWith('FASKA Eigenraum') && B.monde[f.nach].titel.startsWith('MOONFiNGERS'));
const f = N.faeden[fi]; console.log('Faden', fi, f.typ, 'kanten', f.kanten.length);
const pt = fadenWeg(N, f, N.pos[f.von], N.pos[f.nach]);
const d = N.daecher[f.bzVon]; console.log('Dach', d.name, 'R', d.R.toFixed(2));
for(const b of d.bereiche) console.log('  Bereich', b.name, 'mitte', b.mitte[0].toFixed(1), b.mitte[2].toFixed(1), 'R', b.R.toFixed(2), 'werke', b.werke.map(i => B.monde[i].titel.slice(0, 22)).join(' | '));
for(const t of ['montessori flow', 'faska flow']){ const n = B.monde.findIndex(m => m.titel === t); if(n < 0){ console.log('kein', t); continue; }
  let mn = 1e9, tt = 0, y = 0; for(let s = 0; s <= 1000; s++){ const q = pt(s / 1000), dd = Math.hypot(q[0] - N.pos[n][0], q[2] - N.pos[n][2]); if(dd < mn){ mn = dd; tt = s / 1000; y = q[1]; } }
  console.log(t, 'Bodenabstand', mn.toFixed(2), 'rM', N.rM[n].toFixed(2), 'bei t', tt, 'Höhe Faden', y.toFixed(2), 'Bezirk', N.bezirk(n)); }
// alle FASKA-Fäden
for(const [i, g2] of N.faeden.entries()) if(g2.bzVon === f.bzVon || g2.bzNach === f.bzVon) console.log('FASKA-Faden', i, B.monde[g2.von].titel.slice(0, 30), '->', B.monde[g2.nach].titel.slice(0, 30), g2.typ);
// Kurs: Austrittspunkt am Dachrand und Länge im Bereich FLOW
const fl = d.bereiche.find(b => b.name.startsWith('FLOW')); let inn = 0; for(let s = 0; s <= 1000; s++){ const q = pt(s / 1000); if(Math.hypot(q[0] - fl.mitte[0], q[2] - fl.mitte[2]) < fl.R) inn++; }
console.log('Anteil des Fadens im Bereich FLOW', (inn / 10).toFixed(1) + '%');
const dS = N.daecher[f.bzNach]; console.log('Zieldach', dS.name);
for(const b of dS.bereiche) console.log('  Bereich', b.name, 'R', b.R.toFixed(2), 'werke', b.werke.map(i => B.monde[i].titel.slice(0, 22)).join(' | '));
for(let n = 0; n < N.N; n++){ if(n === f.von || n === f.nach) continue; let mn = 1e9, tt = 0, y = 0;
  for(let s = 0; s <= 1000; s++){ const q = pt(s / 1000), dd = Math.hypot(q[0] - N.pos[n][0], q[2] - N.pos[n][2]); if(dd < mn){ mn = dd; tt = s / 1000; y = q[1]; } }
  if(mn < 2 * N.rM[n]) console.log('  nah:', B.monde[n].titel.slice(0, 30), 'Boden', mn.toFixed(2), 'rM', N.rM[n].toFixed(2), 't', tt, 'Fadenhöhe', y.toFixed(2)); }
