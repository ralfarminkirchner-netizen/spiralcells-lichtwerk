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
const TMP = [0, 0, 0];
for(const m of B.monde.filter(m => m.samen.length > 60)){
  const Z = new Zelle(m, {ohneAufzug: true}); L.setCamera(regie(U, Z, null, false), W_, H_);
  const fam = Z.W.familie ? [...new Set(Z.W.familie.filter(Boolean))] : [];
  console.log(`„${m.titel}“ traum=${m.traumfeld} Familien: ${fam.slice(0, 8).join(', ')}`);
  const rows = [];
  for(let i = 0; i < m.samen.length; i++){ Z.mittePos(i, TMP); const c = L.toScreen(...TMP); let fern = 0, maxd = 0;
    for(let g = Z.seedFirst[i]; g < Z.seedFirst[i] + Z.seedCount[i]; g++){ Z.kornPos(g, TMP); const s = L.toScreen(...TMP); const d = Math.hypot(s[0] - c[0], s[1] - c[1]); maxd = Math.max(maxd, d); if(d > 25.6) fern++; }
    rows.push({i, label: m.samen[i].label.slice(0, 50), art: Z.W.art[i], koerner: Z.seedCount[i], fern, maxd: Math.round(maxd)}); }
  rows.sort((a, b) => b.koerner - a.koerner); console.table(rows.slice(0, 5));
}
