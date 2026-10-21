// Bereichsnamen auf Werklichtern. Über einen ganzen Umlauf der Kamera (netZeit 0..520 s): wie oft steht ein Werkname näher an einem fremden Licht als am eigenen?
// Vergleich neu (unter/über/rechts/links, 35c59bc) gegen alt (nur unter, 26356a7).
import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const [w, h] = process.argv.slice(2).map(Number); const pxZ = 7.0, pxB = 9.7;
globalThis.innerWidth = w; globalThis.innerHeight = h;
const {bestand, kurz} = await import(R + 'app/js/daten.js');
const {Netz, baueNetz} = await import(R + 'app/js/netz.js');
const {regie} = await import(R + 'app/js/regie.js');
const {setCamera, CAM, L} = await import(R + 'app/js/licht.js');
const {U} = await import(R + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8')));
CAM.cssW = w; CAM.cssH = h; const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const dach = N.daecher.findIndex(d => d.name === 'FASKA'), d = N.daecher[dach];
const ohne = t => t.toLowerCase().startsWith('faska ') ? t.slice(6) : t;
function bild(zeit, neu){
  Object.assign(U, {netK: 1, netT: 1, dach, dachK: 1, dachZiel: null, kelchK: 0, kelchZeit: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: zeit, netDir: 1, flug: null, sel: null, hover: null, solo: -1,
    daecherSchirm: [], bereicheSchirm: [], monde: [], knoten: [], buendelKnoten: [], tueren: [], soloA: [1,1,1,1,1], bigHeads: []});
  const cam = regie(U, null, N, false); setCamera(cam, w, h); L.pc = 0; baueNetz(N, U, 3, 1, -1, 0);
  const belegt = []; { const p = U.daecherSchirm[dach], bw = 58; const px = clamp(p[0], 12 + bw / 2, w - 12 - bw / 2); belegt.push({x: px - bw / 2, y: p[1] - 30, w: bw, h: 16}); }
  belegt.push({x: 14, y: 14, w: 120, h: 40});
  const frei = r => !belegt.some(q => r.x < q.x + q.w + 6 && q.x < r.x + r.w + 6 && r.y < q.y + q.h + 2 && q.y < r.y + r.h + 2);
  const zeige = (wpx, p, lagen) => { for(const [k, [dx, dy]] of lagen.entries()){ const x = clamp(p[0] - wpx / 2 + dx * (wpx / 2 + 14), 8, w - wpx - 8), y = p[1] + dy, r = {x, y, w: wpx, h: 14};
      if(!frei(r) || y < 56 || y > h - 70) continue; belegt.push(r); return {k, r}; } return null; };
  const L2 = N.werkeIn(dach).map(i => ({i, p: U.monde[i]})); let deckt = 0; const dd = [];
  d.bereiche.forEach((b, k) => { const p = U.bereicheSchirm[k]; const r = zeige(b.name.length * pxB, p, neu ? [[0, 4], [0, 20]] : [[0, -18]]); if(!r) return;
    for(const l of L2){ if(l.p[0] > r.r.x && l.p[0] < r.r.x + r.r.w && l.p[1] > r.r.y - 3 && l.p[1] < r.r.y + 14 + 3){ deckt++; dd.push(b.name + ' auf ' + kurz(ohne(B.monde[l.i].titel), 30)); } } });
  let still = 0, fremd = 0, nichtUnter = 0; const faelle = [];
  for(const l of L2){ const t = kurz(ohne(B.monde[l.i].titel), 30), rp = Math.min(40, N.rM[l.i] / Math.max(0.01, CAM.S) * CAM.cssH * 0.35);
    const r = zeige(t.length * pxZ, l.p, neu ? [[0, 6 + rp], [0, -rp - 20], [1, -7], [-1, -7]] : [[0, 10 + rp]]);
    if(!r){ still++; continue; } if(r.k) nichtUnter++;
    // Abstand Licht → Namensrechteck (kürzeste Strecke)
    const ab = p => Math.hypot(Math.max(r.r.x - p[0], 0, p[0] - r.r.x - r.r.w), Math.max(r.r.y - p[1], 0, p[1] - r.r.y - 14));
    const eig = ab(l.p); let best = null; for(const o of L2){ if(o.i === l.i) continue; const a = ab(o.p); if(!best || a < best.a) best = {a, i: o.i}; }
    if(best.a < eig){ fremd++; faelle.push(`${t} → näher an ${kurz(ohne(B.monde[best.i].titel), 30)} (${best.a.toFixed(0)} statt ${eig.toFixed(0)} px)`); } }
  return {still, fremd: deckt, nichtUnter, faelle: dd};
}
for(const neu of [false, true]){ let n = 0, sStill = 0, sFremd = 0, mitFremd = 0, mitStill = 0, sNU = 0; const bsp = new Map();
  for(let t = 0; t < 524; t += 4){ const b = bild(t, neu); n++; sStill += b.still; sFremd += b.fremd; sNU += b.nichtUnter; if(b.fremd) mitFremd++; if(b.still) mitStill++; for(const f of b.faelle) bsp.set(f, (bsp.get(f)||0)+1); }
  console.log(`${w}x${h} ${neu ? 'neu 35c59bc' : 'alt 26356a7'}: Bilder ${n}; Namen geschwiegen im Mittel ${(sStill / n).toFixed(1)} von 14 (in ${mitStill} Bildern); nicht unter dem Licht ${(sNU / n).toFixed(1)}; Bereichsname liegt auf Werklicht, je Bild ${(sFremd / n).toFixed(2)} (in ${mitFremd} von ${n} Bildern)`);
  for(const [f, c] of bsp) console.log(`   ${f}: in ${c} Bildern`); }
