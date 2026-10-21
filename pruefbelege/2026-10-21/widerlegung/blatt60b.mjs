import {readFileSync} from 'node:fs';
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
const rows = []; let tot = 0;
for(let i = 0; i < m.samen.length; i++){ Z.mittePos(i, T); const c = L.toScreen(T[0], T[1], T[2]); let fern = 0, maxd = 0;
  for(let g = Z.seedFirst[i]; g < Z.seedFirst[i] + Z.seedCount[i]; g++){ Z.kornPos(g, T); const s = L.toScreen(T[0], T[1], T[2]); const d = Math.hypot(s[0] - c[0], s[1] - c[1]); maxd = Math.max(maxd, d); if(d > 25.6) fern++; }
  tot += Z.seedCount[i]; rows.push({i, label: m.samen[i].label.slice(0, 44), art: Z.W.art[i], koerner: Z.seedCount[i], fern, maxd: Math.round(maxd), mx: Math.round(c[0]), my: Math.round(c[1])}); }
rows.sort((a, b) => b.koerner - a.koerner);
console.log('Körner gesamt', tot, 'Blätter', rows.length);
console.table(rows.slice(0, 12));
const lang = rows.filter(r => r.maxd > 60); console.log('Blätter mit Ausdehnung > 60 px:', lang.length, 'mit zusammen', lang.reduce((a, r) => a + r.koerner, 0), 'Körnern');
// Verteilung der Mitten auf dem Schirm
const mx = rows.map(r => r.mx), my = rows.map(r => r.my); console.log('Mitten x', Math.min(...mx), Math.max(...mx), 'y', Math.min(...my), Math.max(...my));
