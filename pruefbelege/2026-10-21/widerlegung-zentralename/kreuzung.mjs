// Nur lesend: Wie oft kreuzt ein Bündel der Mitte den Namen „Zentrale“ im Überblick, über eine ganze Drehung der Kamera?
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const KETTE = process.argv[2] || 'kette-gewebe';
const VW = +(process.argv[3] || 800), VH = +(process.argv[4] || 600);
globalThis.innerWidth = VW; globalThis.innerHeight = VH;
const {bestand} = await import(ROOT + '/app/js/daten.js');
const {CAM, setCamera, toScreen} = await import(ROOT + '/app/js/licht.js');
const {Netz, baueNetz} = await import(ROOT + '/app/js/netz.js');
const {Zelle} = await import(ROOT + '/app/js/zelle.js');
const {regie} = await import(ROOT + '/app/js/regie.js');
const {U, W} = await import(ROOT + '/app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${KETTE}/state.json`, 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(`${ROOT}/app/ordnung.json`, 'utf8')));
CAM.cssW = VW; CAM.cssH = VH; const DPR = VW < 700 ? 1.5 : 2;
const zi = B.monde.findIndex(m => m.titel.startsWith('Zentrale'));
const Z = new Zelle(B.monde[zi], {origin: N.pos[zi], ohneAufzug: true});
W.RM = false; U.RM = false;
U.netK = 1; U.netT = 1; U.netDir = 1; U.dach = null; U.dachK = 0; U.dachZiel = null; U.kelchK = 0; U.sel = null; U.hover = null; U.solo = -1;
const name = k => k === 'mitte' ? 'Mitte' : k === 'ohne' ? 'ohne Dach' : N.daecher[k].name;
const mitB = N.buendel.map((x, bi) => [x, bi]).filter(([x]) => x.von === 'mitte' || x.nach === 'mitte');
console.log(`Kette ${KETTE} ${VW}x${VH}: Bündel ${N.buendel.length}, davon an der Mitte ${mitB.length}:`, mitB.map(([x]) => `${name(x.von)}→${name(x.nach)} (${x.kanten})`).join(', '));
// bogen() wie in netz.js Z. 252 ff.
function bogen(ca, Ra, cb, Rb){
  const dx = cb[0] - ca[0], dz = cb[2] - ca[2], dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl;
  const A = [ca[0] + ux * Ra, ca[2] + uz * Ra], Bq = [cb[0] - ux * Rb, cb[2] - uz * Rb], d = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), quer = d * 0.12, lift = d * 0.12 + 0.6;
  const mix = (a, b, t) => a + (b - a) * t;
  return t => { const w = Math.sin(Math.PI * t); return [mix(A[0], Bq[0], t) - uz * quer * w, w * lift, mix(A[1], Bq[1], t) + ux * quer * w]; };
}
const BW = Math.round(72 * (VW < 700 ? 0.9 : 1)), BH = 16;   // „Zentrale“ ist im Standbild 800x600 etwa 72 px breit
let n = 0, kreuz = 0; const treffer = new Map();
const schritte = 720;
for(let s = 0; s < schritte; s++){
  U.netZeit = s / schritte * (2 * Math.PI / 0.012);   // eine ganze Drehung (yawN wächst um 0,012 je Sekunde)
  const cam = regie(U, Z, N, false); setCamera(cam, VW * DPR, VH * DPR);
  baueNetz(N, U, 12.3, 1, zi, 0);
  const p = U.mitteSchirm; if(!p || p[2] <= 0) continue;
  const px = Math.min(Math.max(p[0], 12 + BW / 2), VW - 12 - BW / 2), r = {x: px - BW / 2, y: p[1] + 10, w: BW, h: BH};
  if(r.y < 60 || r.y > VH - 64) continue;
  n++;
  let hier = [];
  for(const [x, bi] of mitB){ const za = N.bezirkZiel(x.von), zb = N.bezirkZiel(x.nach), pt = bogen(za.mitte, za.R, zb.mitte, zb.R);
    for(let k = 0; k <= 120; k++){ const q = pt(k / 120), sc = toScreen(q[0], q[1], q[2]);
      if(sc[2] > 0 && sc[0] > r.x + 3 && sc[0] < r.x + r.w - 3 && sc[1] > r.y + 2 && sc[1] < r.y + r.h - 2){ hier.push(`${name(x.von)}→${name(x.nach)}`); break; } } }
  if(hier.length){ kreuz++; for(const h of hier) treffer.set(h, (treffer.get(h) || 0) + 1); }
  if(s === 0) console.log('Startbild: Name bei', r, 'Treffer', hier);
}
console.log(`Bilder mit sichtbarem Namen: ${n}, davon vom Bündel gekreuzt: ${kreuz} (${(100 * kreuz / Math.max(1, n)).toFixed(1)} % einer Drehung, ${(kreuz / schritte * 524).toFixed(0)} s von 524 s)`);
console.log('je Bündel:', [...treffer].map(([k, v]) => `${k}: ${v}`).join(', '));
