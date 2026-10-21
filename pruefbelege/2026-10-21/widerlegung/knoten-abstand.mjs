// Unabhängige Nachrechnung: Abstand des Fadenknotens (pt(0.5)) von der Dachmitte, in Dachradien,
// und ob er bei zoom 1 / zoom max (2.6, Pinch) / beim Einfahren (dachK<1) im Bild liegt.
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const W_ = +(process.argv[3] || 800), H_ = +(process.argv[4] || 600); globalThis.innerWidth = W_; globalThis.innerHeight = H_;
const state = process.argv[2] || ROOT + 'testdaten/kette-gewebe/state.json';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const L = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(state, 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
L.CAM.cssW = W_; L.CAM.cssH = H_;
const name = b => b === 'mitte' ? N.baum.mitte.name : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
const mix = (a, b, t) => a + (b - a) * t;
// Knoten unabhängig nachgebaut (fadenWeg, t = 0.5)
function knoten(f){ const A = N.pos[f.von], Bp = N.pos[f.nach]; const d = Math.hypot(A[0] - Bp[0], A[2] - Bp[2]), lift = d * 0.16 + 0.4;
  if(f.bzVon === f.bzNach) return [mix(A[0], Bp[0], .5), mix(A[1], Bp[1], .5) + lift, mix(A[2], Bp[2], .5)];
  const za = N.bezirkZiel(f.bzVon), zb = N.bezirkZiel(f.bzNach); const dx = zb.mitte[0] - za.mitte[0], dz = zb.mitte[2] - za.mitte[2], dl = Math.hypot(dx, dz), ux = dx / dl, uz = dz / dl;
  const P1 = [za.mitte[0] + ux * za.R, za.mitte[2] + uz * za.R], P2 = [zb.mitte[0] - ux * zb.R, zb.mitte[2] - uz * zb.R];
  return [(A[0] + 3 * P1[0] + 3 * P2[0] + Bp[0]) / 8, mix(A[1], Bp[1], .5) + lift, (A[2] + 3 * P1[1] + 3 * P2[1] + Bp[2]) / 8]; }
const im = p => p[2] > 0 && p[0] >= 0 && p[0] <= W_ && p[1] >= 0 && p[1] <= H_;
function kamera(dach, dachK, zoom, netZeit){ Object.assign(U, {netK: 1, netT: 1, netDir: 1, kelchK: 0, dach, dachK, dachZiel: null, flug: null, leseK: 0, zoom, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit, kelchZeit: 0});
  L.setCamera(regie(U, null, N, false), W_, H_); }
const n = 36;
console.log(`Bild ${W_}x${H_}`);
for(const x of N.buendel){ const fi = x.faeden[0], f = N.faeden[fi], z = N.bezirkZiel(x.von), k = knoten(f);
  const r = Math.hypot(k[0] - z.mitte[0], k[2] - z.mitte[2]) / z.R;
  // Prüfe, dass der Nachbau mit baueNetz übereinstimmt
  kamera(x.von, 1, 1, 0); U.sel = {art: 'faden', i: fi}; U.hover = null; U.solo = -1; U.monde = []; U.knoten = []; U.buendelKnoten = []; U.daecherSchirm = []; U.tueren = []; U.bigHeads = [];
  baueNetz(N, U, 0, 1, -1, 0); const a = U.knoten[fi], b = L.toScreen(k[0], k[1], k[2]); const gleich = Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5;
  const zaehl = (dk, zm) => { let aus = 0; for(let i = 0; i < n; i++){ kamera(x.von, dk, zm, i / n * 2 * Math.PI / 0.012); if(!im(L.toScreen(k[0], k[1], k[2]))) aus++; } return aus; };
  const andere = x.faeden.map(fj => { const kk = knoten(N.faeden[fj]); return (Math.hypot(kk[0] - z.mitte[0], kk[2] - z.mitte[2]) / z.R).toFixed(2); });
  console.log(`${name(x.von)}→${name(x.nach)}: ${x.faeden.length} Fäden; Knoten des gewählten bei ${r.toFixed(2)} R von der Dachmitte (Nachbau=baueNetz: ${gleich}); alle Fäden des Bündels: [${andere.join(', ')}] R; außerhalb zoom1: ${zaehl(1, 1)}/${n}, zoom2.6 (ganz aufgezogen): ${zaehl(1, 2.6)}/${n}, halb eingefahren dachK .5: ${zaehl(.5, 1)}/${n}`); }
