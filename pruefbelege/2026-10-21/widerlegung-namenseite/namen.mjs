// Nachrechnung der Namenslagen im Dach FASKA nach haupt.js werkNamen() (Stand 35c59bc), Breiten geschätzt
import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const [w, h, scale, zeit, pxZ, pxB] = process.argv.slice(2).map(Number);
globalThis.innerWidth = w; globalThis.innerHeight = h;
const {bestand, kurz} = await import(R + 'app/js/daten.js');
const {Netz, baueNetz} = await import(R + 'app/js/netz.js');
const {regie} = await import(R + 'app/js/regie.js');
const {setCamera, CAM, L} = await import(R + 'app/js/licht.js');
const {U} = await import(R + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8')));
CAM.cssW = w; CAM.cssH = h;
const dach = N.daecher.findIndex(d => d.name === 'FASKA');
Object.assign(U, {netK: 1, netT: 1, dach, dachK: 1, dachZiel: null, kelchK: 0, kelchZeit: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: zeit, netDir: 1, flug: null, sel: null, hover: null, solo: -1,
  daecherSchirm: [], bereicheSchirm: [], monde: [], knoten: [], buendelKnoten: [], tueren: [], soloA: [1,1,1,1,1], bigHeads: []});
const cam = regie(U, null, N, false); setCamera(cam, w, h); L.pc = 0; baueNetz(N, U, 3, 1, -1, 0);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const belegt = [];
// Dachname FASKA zuerst (oben am Ring), 12px, Sperrung .3em
{ const p = U.daecherSchirm[dach], bw = 'FASKA'.length * 11.6; const px = clamp(p[0], 12 + bw / 2, w - 12 - bw / 2); belegt.push({x: px - bw / 2, y: p[1] - 30, w: bw, h: 16, t: 'FASKA'}); }
belegt.push({x: 14, y: 14, w: 120, h: 40, t: 'Marke (geschätzt)'});
const frei = r => !belegt.some(q => r.x < q.x + q.w + 6 && q.x < r.x + r.w + 6 && r.y < q.y + q.h + 2 && q.y < r.y + r.h + 2);
const ohneDachName = (t, d) => { const dl = d.toLowerCase(), k = t.toLowerCase(); if(k.startsWith(dl + ' ') && t.length > dl.length + 3) return t.slice(dl.length + 1).replace(/^[·:\-–]\s*/, ''); return t; };
const LAGE = ['unter', 'über', 'rechts', 'links'];
const zeige = (t, wpx, p, lagen, licht) => { const hh = 14;
  for(const [k, [dx, dy]] of lagen.entries()){ const x = clamp(p[0] - wpx / 2 + dx * (wpx / 2 + 14), 8, w - wpx - 8), y = p[1] + dy, r = {x, y, w: wpx, h: hh, t};
    if(!frei(r) || y < 56 || y > h - 70) continue; belegt.push(r); return {lage: k, r}; }
  return null; };
const d = N.daecher[dach]; const lichter = N.werkeIn(dach).map(i => ({i, p: U.monde[i], t: B.monde[i].titel}));
const f = v => Math.round(v * scale);
const aus = [];
d.bereiche.forEach((b, k) => { const p = U.bereicheSchirm[k], wpx = b.name.length * pxB; const r = zeige(b.name, wpx, p, [[0, 4], [0, 20]]);
  if(!r){ aus.push(b.name); return; }
  // liegt der Bereichsname auf einem Werklicht (Mitte im Rechteck, mit 6 px Rand)?
  const drauf = lichter.filter(l => l.p[0] > r.r.x - 6 && l.p[0] < r.r.x + r.r.w + 6 && l.p[1] > r.r.y - 6 && l.p[1] < r.r.y + 14 + 6).map(l => kurz(ohneDachName(l.t, 'FASKA'), 30));
  console.log(`Bereich ${b.name.padEnd(22)} Lage ${r.lage ? '+20' : '+4'}  Rechteck x ${f(r.r.x)}..${f(r.r.x + r.r.w)} y ${f(r.r.y)}..${f(r.r.y + 14)}  Licht darunter/darin: ${drauf.join(', ') || '–'}`); });
for(const l of lichter){ const t = kurz(ohneDachName(l.t, 'FASKA'), 30), rp = Math.min(40, N.rM[l.i] / Math.max(0.01, CAM.S) * CAM.cssH * 0.35);
  const r = zeige(t, t.length * pxZ, l.p, [[0, 6 + rp], [0, -rp - 20], [1, -7], [-1, -7]]);
  if(!r){ aus.push(t); console.log(`${t.padEnd(32)} Licht (${f(l.p[0])},${f(l.p[1])})  SCHWEIGT`); continue; }
  // nächstes fremdes Licht zur Namensmitte
  const cx = r.r.x + r.r.w / 2, cy = r.r.y + 7; let best = null;
  for(const o of lichter){ const dd = Math.hypot(o.p[0] - cx, o.p[1] - cy); if(!best || dd < best.d) best = {d: dd, t: kurz(ohneDachName(o.t, 'FASKA'), 30)}; }
  const eig = Math.hypot(l.p[0] - cx, l.p[1] - cy);
  console.log(`${t.padEnd(32)} Licht (${f(l.p[0])},${f(l.p[1])}) Lage ${LAGE[r.lage].padEnd(6)} Name x ${f(r.r.x)}..${f(r.r.x + r.r.w)} y ${f(r.r.y)}  eigenes Licht ${f(eig)} px, nächstes Licht: ${best.t} ${f(best.d)} px`); }
console.log(`Bild ${w}x${h} t=${zeit}: ${N.werkeIn(dach).length + d.bereiche.length - aus.length} von ${N.werkeIn(dach).length + d.bereiche.length} Namen; schweigen: ${aus.join(', ') || '–'}`);
