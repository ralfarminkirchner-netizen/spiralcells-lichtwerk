import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const W_ = +(process.argv[2] || 800), H_ = +(process.argv[3] || 600); globalThis.innerWidth = W_; globalThis.innerHeight = H_;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Zelle} = await import(ROOT + 'app/js/zelle.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const L = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
L.CAM.cssW = W_; L.CAM.cssH = H_;
Object.assign(U, {netK: 0, netT: 0, netDir: -1, kelchK: 0, dach: null, dachK: 0, flug: null, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 0, kelchZeit: 0, lese: false});
const T = [0, 0, 0];
for(const m of B.monde.filter(m => m.samen.length > 60)){ const Z = new Zelle(m, {ohneAufzug: true}); L.setCamera(regie(U, Z, null, false), W_, H_);
  const c = m.samen.map((_, i) => { Z.mittePos(i, T); return L.toScreen(...T); });
  const bd0 = (16 * 1.6) ** 2, hit = new Set();
  for(let x = 0; x < W_; x += 1) for(let y = 0; y < H_; y += 1){ let best = -1, bd = bd0; for(let i = 0; i < c.length; i++){ const d = (c[i][0] - x) ** 2 + (c[i][1] - y) ** 2; if(d < bd){ bd = d; best = i; } } if(best >= 0) hit.add(best); }
  // alter Weg (Korn für Korn, 16 px)
  const g2 = []; for(let g = 0; g < Z.G; g++){ Z.kornPos(g, T); g2.push(L.toScreen(...T)); }
  const altHit = new Set(); for(let x = 0; x < W_; x += 2) for(let y = 0; y < H_; y += 2){ let best = -1, bd = 256; for(let g = 0; g < Z.G; g++){ const s = g2[g]; const d = (s[0] - x) ** 2 + (s[1] - y) ** 2; if(d < bd){ bd = d; best = Z.gSeed[g]; } } if(best >= 0) altHit.add(best); }
  console.log(`${W_}x${H_} „${m.titel}“: durch Tippen wählbar ${hit.size} von ${m.samen.length} Ausprägungen (vorher, Korn für Korn: ${altHit.size})`); }
