// Nur lesend: rechnet Netz, Kamera und Treffer gegen eine Testkopie nach.
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const state = process.argv[2] || ROOT + 'testdaten/kette-gewebe/state.json';
const W_ = +(process.argv[3] || 800), H_ = +(process.argv[4] || 600);
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const L = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(state, 'utf8')));
const O = JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8'));
const N = new Netz(B, O);
L.CAM.cssW = W_; L.CAM.cssH = H_;
const name = b => b === 'mitte' ? N.baum.mitte.name : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;

console.log('Fäden', N.faeden.length, 'Bündel', N.buendel.length);
// 1. F nach buendelHinein: ist der nächste Faden (fi+1) im selben Bündel?
for(const [bi, x] of N.buendel.entries()){
  const f0 = x.faeden[0], next = (f0 + 1) % N.faeden.length, imB = x.faeden.includes(next);
  const fn = N.faeden[next];
  if(x.faeden.length > 1) console.log(`Bündel ${bi} ${name(x.von)}→${name(x.nach)}: Fäden ${JSON.stringify(x.faeden)}; F von ${f0} → ${next} ${imB ? 'im Bündel' : 'NICHT im Bündel: ' + name(fn.bzVon) + '→' + name(fn.bzNach)}`);
}

function setze(dach, sel){
  Object.assign(U, {netK: 1, netT: 1, netDir: 1, kelchK: 0, kelchT: 0, dach, dachK: dach == null ? 0 : 1, dachZiel: null, flug: null, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 0, kelchZeit: 0, sel, hover: null, solo: -1});
  U.monde = []; U.knoten = []; U.buendelKnoten = []; U.daecherSchirm = []; U.tueren = []; U.bigHeads = [];
  const cam = regie(U, null, N, false); L.setCamera(cam, W_, H_);
  baueNetz(N, U, 0, 1, -1, 0);
}
const im = p => p && p[2] > 0 && p[0] >= 0 && p[0] <= W_ && p[1] >= 0 && p[1] <= H_;
// Treffer wie bedienung.treffer im Netz (ohne DOM-Namen und Köpfe)
function treffer(sx, sy){
  const kand = [], d2 = h => h && h[2] > 0 ? (h[0] - sx) ** 2 + (h[1] - sy) ** 2 : Infinity, nimm = (h, r, x) => { const d = d2(h); if(d < r * r) kand.push([d / (r * r), x]); };
  U.tueren.forEach((h, i) => nimm(h, 30, {art: 'tuer', i}));
  U.monde.forEach((h, i) => nimm(h, 30, {art: 'mond', i}));
  U.knoten.forEach((h, i) => nimm(h, 26, {art: 'faden', i}));
  if(U.dach == null) U.buendelKnoten.forEach((h, i) => nimm(h, 28, {art: 'buendel', i}));
  if(U.dach == null){ U.daecherSchirm.forEach((h, i) => nimm(h, 46, {art: 'dach', i})); nimm(U.mitteSchirm, 46, {art: 'mitte'}); nimm(U.ohneSchirm, 46, {art: 'ohne'}); }
  kand.sort((a, b) => a[0] - b[0]); return kand.length ? kand[0][1] : null;
}
// 2. Überblick: Bündelknoten im Bild, durch Tippen genau auf den Knoten erreichbar?
setze(null, null);
let erreich = 0;
for(const [bi, x] of N.buendel.entries()){ const p = U.buendelKnoten[bi]; const t = p ? treffer(p[0], p[1]) : null;
  const ok = t && t.art === 'buendel' && t.i === bi; if(ok) erreich++;
  if(!ok) console.log(`Überblick: Bündel ${bi} ${name(x.von)}→${name(x.nach)} Knoten ${p ? p.slice(0, 2).map(Math.round) : '-'} ${im(p) ? '' : 'AUSSERHALB'} trifft ${t ? t.art + (t.i != null ? ' ' + (t.art === 'mond' ? B.monde[t.i].titel : t.art === 'dach' ? N.daecher[t.i].name : t.i) : '') : 'nichts'}`); }
console.log(`Überblick: ${erreich} von ${N.buendel.length} Bündeln durch Tippen auf ihren Knoten erreichbar`);
// 3. Nach buendelHinein: liegt der Knoten des gewählten ersten Fadens im Bild, und trifft ein Tippen darauf ihn?
for(const [bi, x] of N.buendel.entries()){
  const fi = x.faeden[0]; setze(x.von, {art: 'faden', i: fi});
  const p = U.knoten[fi], t = p ? treffer(p[0], p[1]) : null, ok = t && t.art === 'faden' && t.i === fi;
  if(!im(p) || !ok) console.log(`Im Dach ${name(x.von)} nach Bündel ${bi} (→${name(x.nach)}): Faden ${fi} Knoten ${p ? p.slice(0, 2).map(Math.round).join(',') : '-'} ${im(p) ? 'im Bild' : 'AUSSERHALB des Bilds'}; Tippen darauf trifft ${t ? t.art + ' ' + (t.art === 'mond' ? B.monde[t.i].titel : t.i) : 'nichts'}`);
}
// 4. Fäden mit Verwendung: Ziel der Folge (to_variant bei to_part, sonst from_variant) – Ausprägung oder Ausgangsfrage?
let mitTeil = 0, keimZiel = 0, ohneMond = 0;
for(const [fi, f] of N.faeden.entries()) for(const [k, e] of f.kanten.entries()){
  const u = e.usage, mt = !!(u && u.to_part), ziel = mt ? e.to_variant_id : e.from_variant_id, m = B.mondVon.get(B.werkVon(ziel));
  if(mt) mitTeil++;
  if(!m){ ohneMond++; continue; }
  const si = m.samen.findIndex(s => s.id === ziel), ke = m.keim.some(v => v.id === ziel);
  if(si < 0 && ke) keimZiel++;
  if(si < 0 && !ke) console.log(`Faden ${fi} Kante ${k}: Ziel weder Ausprägung noch Ausgangsfrage in „${m.titel}“`);
}
console.log({mitTeil, keimZiel, ohneMond});
// 5. Kanten, deren Richtung bei der Folge den Werk wechselt: to_part führt in f.von statt f.nach?
let gegen = 0;
for(const f of N.faeden){ for(const e of f.kanten){ const u = e.usage, mt = !!(u && u.to_part); const ziel = mt ? e.to_variant_id : e.from_variant_id;
  const zi = N.index(B.werkVon(ziel)); if(zi !== f.nach) gegen++; } }
console.log('Folgen, die im Werk am Fadenanfang (nicht an der Mündung) landen:', gegen);
// 6. Werke mit mehr als 60 Ausprägungen
for(const m of B.monde) if(m.samen.length > 60) console.log('>60:', m.titel, m.samen.length);
