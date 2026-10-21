// Nur lesend: ab netZeit 0 (Seitenstart, und dauerhaft bei reduzierter Bewegung) – wie lange kreuzt SEiN→Mitte den Namen?
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const VW = +(process.argv[2] || 800), VH = +(process.argv[3] || 600);
globalThis.innerWidth = VW; globalThis.innerHeight = VH;
const {bestand} = await import(ROOT + '/app/js/daten.js');
const {CAM, setCamera, toScreen} = await import(ROOT + '/app/js/licht.js');
const {Netz, baueNetz} = await import(ROOT + '/app/js/netz.js');
const {Zelle} = await import(ROOT + '/app/js/zelle.js');
const {regie} = await import(ROOT + '/app/js/regie.js');
const {U} = await import(ROOT + '/app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/kette-gewebe/state.json`, 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(`${ROOT}/app/ordnung.json`, 'utf8')));
CAM.cssW = VW; CAM.cssH = VH; const DPR = VW < 700 ? 1.5 : 2;
const zi = B.monde.findIndex(m => m.titel.startsWith('Zentrale')), Z = new Zelle(B.monde[zi], {origin: N.pos[zi], ohneAufzug: true});
U.RM = false; U.netK = 1; U.netT = 1; U.netDir = 1; U.dach = null; U.dachK = 0; U.dachZiel = null; U.kelchK = 0; U.sel = null; U.hover = null; U.solo = -1;
const x = N.buendel.find(b => b.von !== 'mitte' && b.nach === 'mitte'), za = N.bezirkZiel(x.von), zb = N.bezirkZiel(x.nach);
const mix = (a, b, t) => a + (b - a) * t;
function bogen(ca, Ra, cb, Rb){ const dx = cb[0] - ca[0], dz = cb[2] - ca[2], dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl;
  const A = [ca[0] + ux * Ra, ca[2] + uz * Ra], Bq = [cb[0] - ux * Rb, cb[2] - uz * Rb], d = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), quer = d * 0.12, lift = d * 0.12 + 0.6;
  return t => { const w = Math.sin(Math.PI * t); return [mix(A[0], Bq[0], t) - uz * quer * w, w * lift, mix(A[1], Bq[1], t) + ux * quer * w]; }; }
const pt = bogen(za.mitte, za.R, zb.mitte, zb.R), BW = VW < 700 ? 65 : 72;
let ende = null;
for(let t = 0; t <= 120; t += 0.5){ U.netZeit = t; setCamera(regie(U, Z, N, false), VW * DPR, VH * DPR); baueNetz(N, U, 12.3, 1, zi, 0);
  const p = U.mitteSchirm, px = Math.min(Math.max(p[0], 12 + BW / 2), VW - 12 - BW / 2), r = {x: px - BW / 2, y: p[1] + 10};
  let hit = null; for(let k = 0; k <= 200; k++){ const s = toScreen(...pt(k / 200)); if(s[0] > r.x + 3 && s[0] < r.x + BW - 3 && s[1] > r.y + 2 && s[1] < r.y + 14){ hit = s; break; } }
  if(t === 0) console.log(`${VW}x${VH} t=0: Name x ${r.x.toFixed(0)}–${(r.x + BW).toFixed(0)}, y ${r.y.toFixed(0)}–${(r.y + 16).toFixed(0)}; ${x.von === 'mitte' ? 'Mitte' : N.daecher[x.von].name}→Mitte kreuzt bei`, hit && hit.slice(0, 2).map(v => v.toFixed(0)));
  if(!hit && ende == null){ ende = t; }
}
console.log(`Kreuzung ab Start bis netZeit ≈ ${ende} s (danach dreht die Kamera weiter); bei reduzierter Bewegung bleibt yaw auf dem Startwert: dauerhaft.`);
