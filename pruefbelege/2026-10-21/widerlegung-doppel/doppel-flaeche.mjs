// Widerlegungsversuch: Doppelklick auf Bündel oder Dach. Treffer wie bedienung.js:325-334 nachgebaut,
// mit Türen, Köpfen (0.6), Knoten (im Überblick leer) und einer Näherung der Namensfelder (trefferName).
// Fläche: alle Klickpunkte, an denen der erste Klick (U.dach = null) das Ziel wählt;
// davon der Anteil, an dem das dblclick danach (U.dach gesetzt, Lagen des letzten Bilds) ein Werk öffnet.
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const W_ = +(process.argv[2] || 800), H_ = +(process.argv[3] || 600); globalThis.innerWidth = W_; globalThis.innerHeight = H_;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const L = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
L.CAM.cssW = W_; L.CAM.cssH = H_;
const name = b => b === 'mitte' ? N.baum.mitte.name : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;

function treffer(sx, sy, dach, namen){
  for(const r of namen) if(sx >= r.l - 8 && sx <= r.r + 8 && sy >= r.t - 8 && sy <= r.b + 8) return r.ziel;
  const kand = [], d2 = h => h && h[2] > 0 ? (h[0] - sx) ** 2 + (h[1] - sy) ** 2 : Infinity, nimm = (h, r, x) => { const d = d2(h); if(d < r * r) kand.push([d / (r * r), x]); };
  U.tueren.forEach((h, i) => nimm(h, 30, {art: 'tuer', i}));
  U.monde.forEach((h, i) => nimm(h, 30, {art: 'mond', i}));
  U.knoten.forEach((h, i) => nimm(h, 26, {art: 'faden', i}));
  if(dach == null) U.buendelKnoten.forEach((h, i) => nimm(h, 28, {art: 'buendel', i}));
  if(dach == null){ U.daecherSchirm.forEach((h, i) => nimm(h, 46, {art: 'dach', i})); nimm(U.mitteSchirm, 46, {art: 'mitte'}); nimm(U.ohneSchirm, 46, {art: 'ohne'}); }
  let bk = -1, bd = 40 * 40; for(let i = 0; i < 5; i++){ const h = U.bigHeads[i]; if(!h || h[2] <= 0) continue; const d = (h[0] - sx) ** 2 + (h[1] - sy) ** 2; if(d < bd){ bd = d; bk = i; } }
  if(bk >= 0) kand.push([0.6, {art: 'kopf', i: bk}]);
  kand.sort((a, b) => a[0] - b[0]); return kand.length ? kand[0][1] : null;
}
const gleich = (a, b) => a && b && a.art === b.art && (a.i ?? null) === (b.i ?? null);
const n = 12, sum = new Map();
for(let k = 0; k < n; k++){
  Object.assign(U, {netK: 1, netT: 1, netDir: 1, kelchK: 0, dach: null, dachK: 0, dachZiel: null, flug: null, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: k / n * 2 * Math.PI / 0.012, sel: null, hover: null, solo: -1});
  U.monde = []; U.knoten = []; U.buendelKnoten = []; U.daecherSchirm = []; U.tueren = []; U.bigHeads = U.bigHeads || [];
  L.setCamera(regie(U, null, N, false), W_, H_); baueNetz(N, U, 0, 1, -1, 0);
  // Namensfelder nach haupt.js:493-497 (Breite geschätzt: 12 px Schrift, .3em Sperrung)
  const namen = []; const breite = (s, fs, ls) => s.length * fs * (0.62 + ls);
  const lab = (p, nm, ziel, unter, fs, ls) => { if(!p || p[2] <= 0) return; const bw = breite(nm, fs, ls), px = Math.min(Math.max(p[0], 12 + bw / 2), W_ - 12 - bw / 2);
    const y0 = unter ? p[1] + 10 : p[1] - 14 - 16; if(y0 < 60 || y0 > H_ - 64) return; namen.push({l: px - bw / 2, r: px + bw / 2, t: y0, b: y0 + 16, ziel}); };
  lab(U.mitteSchirm, N.baum.mitte.name, {art: 'mitte'}, true, 13, 0.42);
  N.daecher.forEach((d, j) => lab(U.daecherSchirm[j], d.name, {art: 'dach', i: j}, false, 12, 0.3));
  lab(U.ohneSchirm, 'ohne Dach', {art: 'ohne'}, false, 10, 0.24);
  const ziele = [...U.daecherSchirm.map((p, j) => [name(j), p, {art: 'dach', i: j}, j]), ['Zentrale (Mitte)', U.mitteSchirm, {art: 'mitte'}, 'mitte'], ['ohne Dach', U.ohneSchirm, {art: 'ohne'}, 'ohne'],
    ...U.buendelKnoten.map((p, bi) => p ? ['Bündel ' + name(N.buendel[bi].von) + '→' + name(N.buendel[bi].nach), p, {art: 'buendel', i: bi}, N.buendel[bi].von] : null).filter(Boolean)];
  for(const [nm, p, ziel, bezirk] of ziele){ if(!p || p[2] <= 0) continue;
    const z = sum.get(nm) || {flaeche: 0, falsch: 0, mitteFalsch: 0, mitteN: 0, werke: new Map()};
    const R = ziel.art === 'buendel' ? 28 : 46;
    for(let dx = -R; dx <= R; dx += 2) for(let dy = -R; dy <= R; dy += 2){ if(dx * dx + dy * dy > R * R) continue;
      const sx = p[0] + dx, sy = p[1] + dy; if(sx < 0 || sy < 0 || sx > W_ || sy > H_) continue;
      const t1 = treffer(sx, sy, null, namen); if(!gleich(t1, ziel)) continue;   // erster und zweiter Klick wählen das Ziel, der zweite fährt hinein
      z.flaeche++;
      const t2 = treffer(sx, sy, bezirk, namen);
      if(t2 && t2.art === 'mond'){ z.falsch++; const ti = B.monde[t2.i].titel; z.werke.set(ti, (z.werke.get(ti) || 0) + 1);
        const eigen = N.bezirk(t2.i) === bezirk; z.eigen = (z.eigen || 0) + (eigen ? 1 : 0); }
      if(dx === 0 && dy === 0){ z.mitteN++; if(t2 && t2.art === 'mond') z.mitteFalsch++; } }
    sum.set(nm, z); } }
console.log(`${W_}x${H_}, ${n} Drehlagen. Anteil der Fläche, die das Ziel wählt, an der das folgende dblclick ein Werk öffnet:`);
for(const [nm, z] of sum){ if(!z.flaeche) continue;
  const top = [...z.werke].sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]).join(' | ');
  console.log(`${nm.padEnd(40)} ${(100 * z.falsch / z.flaeche).toFixed(0).padStart(3)} %  (Mittelpunkt: ${z.mitteFalsch}/${z.mitteN}; davon Werk im betretenen Bezirk: ${z.falsch ? (100 * (z.eigen || 0) / z.falsch).toFixed(0) : '-'} %)  ${top}`); }
