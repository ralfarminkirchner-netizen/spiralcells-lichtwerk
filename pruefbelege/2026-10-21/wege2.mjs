import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const W_ = +(process.argv[3] || 800), H_ = +(process.argv[4] || 600);
globalThis.innerWidth = W_; globalThis.innerHeight = H_;
const state = process.argv[2] || ROOT + 'testdaten/kette-gewebe/state.json';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {materialParagraphs} = await import(ROOT + 'app/js/materialraum.js');
const L = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(state, 'utf8')));
const O = JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8'));
const N = new Netz(B, O);
L.CAM.cssW = W_; L.CAM.cssH = H_;
const name = b => b === 'mitte' ? N.baum.mitte.name : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
function setze(dach, sel){
  Object.assign(U, {netK: 1, netT: 1, netDir: 1, kelchK: 0, kelchT: 0, dach, dachK: dach == null ? 0 : 1, dachZiel: null, flug: null, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 0, kelchZeit: 0, sel, hover: null, solo: -1});
  U.monde = []; U.knoten = []; U.buendelKnoten = []; U.daecherSchirm = []; U.tueren = []; U.bigHeads = [];
  const cam = regie(U, null, N, false); L.setCamera(cam, W_, H_); baueNetz(N, U, 0, 1, -1, 0);
}
const im = p => p && p[2] > 0 && p[0] >= 0 && p[0] <= W_ && p[1] >= 0 && p[1] <= H_;
function treffer(sx, sy){
  const kand = [], d2 = h => h && h[2] > 0 ? (h[0] - sx) ** 2 + (h[1] - sy) ** 2 : Infinity, nimm = (h, r, x) => { const d = d2(h); if(d < r * r) kand.push([d / (r * r), x]); };
  U.tueren.forEach((h, i) => nimm(h, 30, {art: 'tuer', i}));
  U.monde.forEach((h, i) => nimm(h, 30, {art: 'mond', i}));
  U.knoten.forEach((h, i) => nimm(h, 26, {art: 'faden', i}));
  if(U.dach == null) U.buendelKnoten.forEach((h, i) => nimm(h, 28, {art: 'buendel', i}));
  if(U.dach == null){ U.daecherSchirm.forEach((h, i) => nimm(h, 46, {art: 'dach', i})); nimm(U.mitteSchirm, 46, {art: 'mitte'}); nimm(U.ohneSchirm, 46, {art: 'ohne'}); }
  kand.sort((a, b) => a[0] - b[0]); return kand.length ? kand[0][1] : null;
}
console.log('Bild', W_, 'x', H_);
// Bündel → Dach → erster Faden
for(const [bi, x] of N.buendel.entries()){ const fi = x.faeden[0]; setze(x.von, {art: 'faden', i: fi}); const p = U.knoten[fi];
  console.log(`Bündel ${bi} ${name(x.von)}→${name(x.nach)} (${x.faeden.length} Fäden, ${x.kanten} Kanten): Knoten des gewählten Fadens ${p.slice(0,2).map(Math.round).join(',')} ${im(p) ? 'im Bild' : 'AUSSERHALB'}`); }
// In jedem Bezirk: welche seiner Fäden sind auf dem Knoten antippbar und im Bild?
for(const b of ['mitte', ...N.daecher.map((_, j) => j), 'ohne']){ if(b === 'ohne' && !N.L.ohne) continue; setze(b, null);
  const fs = N.faeden.map((f, fi) => [f, fi]).filter(([f]) => f.bzVon === b || f.bzNach === b); if(!fs.length) continue;
  const aus = fs.filter(([f, fi]) => !im(U.knoten[fi])).length, verdeckt = fs.filter(([f, fi]) => { const p = U.knoten[fi]; if(!im(p)) return false; const t = treffer(p[0], p[1]); return !(t && t.art === 'faden' && t.i === fi); });
  console.log(`Bezirk ${name(b)}: ${fs.length} Fäden, ${aus} Knoten außerhalb des Bilds, ${verdeckt.length} im Bild aber nicht antippbar` + (verdeckt.length ? ': ' + verdeckt.map(([f, fi]) => { const p = U.knoten[fi], t = treffer(p[0], p[1]); return fi + '→' + t.art + (t.art === 'mond' ? ' „' + B.monde[t.i].titel + '“' : ' ' + t.i); }).join('; ') : '')); }
// Keim-Ziele: zeigt die Lesefläche dieselbe Fassung, die der Faden meint?
let kz = 0, falsch = 0, kanten = 0;
for(const [fi, f] of N.faeden.entries()) for(const e of f.kanten){ kanten++;
  const u = e.usage, mt = !!(u && u.to_part), ziel = mt ? e.to_variant_id : e.from_variant_id, m = B.mondVon.get(B.werkVon(ziel));
  if(m.samen.some(s => s.id === ziel)) continue; if(!m.keim.some(v => v.id === ziel)) continue; kz++;
  if(m.keim[m.keim.length - 1].id !== ziel){ falsch++; console.log(`Faden ${fi}: Ziel ist eine frühere Ausgangsfrage in „${m.titel}“ (${m.keim.length} Fassungen); Lesefläche zeigt die jüngste`); } }
console.log({kanten, keimZiele: kz, aeltereKeime: falsch});
// Mit Teil: wird die Stelle gefunden?
const stoff = await import(ROOT + 'app/js/stoff.js').catch(e => null);
console.log('stoff in node:', !!stoff);
