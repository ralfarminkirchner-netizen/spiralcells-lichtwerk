import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const W_ = 800, H_ = 600; globalThis.innerWidth = W_; globalThis.innerHeight = H_;
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
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for(let g = 0; g < Z.G; g++){ Z.kornPos(g, T); const s = L.toScreen(...T); x0 = Math.min(x0, s[0]); x1 = Math.max(x1, s[0]); y0 = Math.min(y0, s[1]); y1 = Math.max(y1, s[1]); }
  // Abstand benachbarter Blattmitten
  const c = m.samen.map((_, i) => { Z.mittePos(i, T); return L.toScreen(...T); }); let nn = [];
  for(let i = 0; i < c.length; i++){ let b = 1e9; for(let j = 0; j < c.length; j++) if(j !== i) b = Math.min(b, Math.hypot(c[i][0] - c[j][0], c[i][1] - c[j][1])); nn.push(b); } nn.sort((a, b) => a - b);
  console.log(`„${m.titel}“: Körner von x ${x0|0}–${x1|0}, y ${y0|0}–${y1|0}; nächste Blattmitte Median ${nn[nn.length >> 1].toFixed(1)} px`); }
