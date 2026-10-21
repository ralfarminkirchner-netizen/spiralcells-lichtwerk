// Doppelklick: zweiter Klick fährt hinein (U.dach gesetzt), das folgende dblclick-Ereignis prüft treffer() mit den Lagen des letzten Bilds
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
const n = 12; const zaehl = new Map();
for(let k = 0; k < n; k++){
  Object.assign(U, {netK: 1, netT: 1, netDir: 1, kelchK: 0, dach: null, dachK: 0, dachZiel: null, flug: null, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: k / n * 2 * Math.PI / 0.012, sel: null, hover: null, solo: -1});
  U.monde = []; U.knoten = []; U.buendelKnoten = []; U.daecherSchirm = []; U.tueren = [];
  L.setCamera(regie(U, null, N, false), W_, H_); baueNetz(N, U, 0, 1, -1, 0);
  const ziele = [...U.daecherSchirm.map((p, j) => [name(j), p]), ['Zentrale (Mitte)', U.mitteSchirm], ['ohne Dach', U.ohneSchirm], ...U.buendelKnoten.map((p, bi) => ['Bündel ' + name(N.buendel[bi].von) + '→' + name(N.buendel[bi].nach), p])];
  for(const [nm, p] of ziele){ if(!p || p[2] <= 0) continue; let best = -1, bd = 30 * 30;
    U.monde.forEach((h, i) => { if(!h || h[2] <= 0) return; const d = (h[0] - p[0]) ** 2 + (h[1] - p[1]) ** 2; if(d < bd){ bd = d; best = i; } });
    // treffer() mit U.dach gesetzt: Türen, Monde, Knoten; Knoten im Überblick nur für gewählte Fäden -> leer
    if(best >= 0){ const z = zaehl.get(nm) || {n: 0, werke: new Set()}; z.n++; z.werke.add(B.monde[best].titel); zaehl.set(nm, z); } } }
for(const [nm, z] of zaehl) console.log(`${W_}x${H_} Doppelklick auf ${nm}: in ${z.n} von ${n} Drehlagen öffnet das dblclick danach ein Werk: ${[...z.werke].slice(0, 3).join(' | ')}`);
