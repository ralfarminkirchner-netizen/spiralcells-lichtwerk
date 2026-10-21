import {readFileSync, writeFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const W_ = 800, H_ = 600; globalThis.innerWidth = W_; globalThis.innerHeight = H_;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Zelle, DT} = await import(ROOT + 'app/js/zelle.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const L = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
L.CAM.cssW = W_; L.CAM.cssH = H_;
Object.assign(U, {netK: 0, netT: 0, netDir: -1, kelchK: 0, dach: null, dachK: 0, flug: null, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 0, kelchZeit: 0, lese: false});
const T = [0, 0, 0];
const m = B.monde.find(m => m.titel.includes('Jahreskreise'));
const Z = new Zelle(m, {ohneAufzug: true}); for(let k = 0; k < 240; k++) Z.step(DT, false); L.setCamera(regie(U, Z, null, false), W_, H_);
const mitten = []; for(let i = 0; i < m.samen.length; i++){ Z.mittePos(i, T); mitten.push(L.toScreen(T[0], T[1], T[2])); }
const img = Buffer.alloc(W_ * H_ * 3);
const put = (x, y, r, g, b) => { x = Math.round(x); y = Math.round(y); if(x < 0 || y < 0 || x >= W_ || y >= H_) return; const o = (y * W_ + x) * 3; img[o] = r; img[o + 1] = g; img[o + 2] = b; };
for(let g = 0; g < Z.G; g++){ Z.kornPos(g, T); const s = L.toScreen(T[0], T[1], T[2]); let tot = true;
  for(const c of mitten) if((c[0] - s[0]) ** 2 + (c[1] - s[1]) ** 2 < 25.6 * 25.6){ tot = false; break; }
  for(let dx = -1; dx <= 1; dx++) for(let dy = -1; dy <= 1; dy++) tot ? put(s[0] + dx, s[1] + dy, 220, 60, 60) : put(s[0] + dx, s[1] + dy, 120, 220, 120); }
for(const c of mitten) for(let a = 0; a < 40; a++) put(c[0] + 25.6 * Math.cos(a / 40 * 6.283), c[1] + 25.6 * Math.sin(a / 40 * 6.283), 90, 90, 255);
writeFileSync(process.argv[2], Buffer.concat([Buffer.from(`P6 ${W_} ${H_} 255\n`), img]));
