import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {W} = await import(ROOT + 'app/js/welt.js');
const {Zelle} = await import(ROOT + 'app/js/zelle.js');
const S = await import('./stoff-kopie.mjs');
W.B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
let n = 0, fremd = 0, keiner = 0; const bsp = [];
for(const m of W.B.monde){ if(!m.samen.length) continue; W.Z = new Zelle(m, {ohneAufzug: true});
  for(let si = 0; si < m.samen.length; si++){ const v = m.samen[si].fassung; S.setzeZ({mond: m, v, si, modus: 'vergleich', vergleich: null, stelle: null});
    const vs = S.vorschlag(); n++; if(!vs){ keiner++; continue; }
    if(W.B.werkVon(vs) !== m.id){ fremd++; if(bsp.length < 4) bsp.push(`${m.titel.slice(0, 30)} / ${v.label.slice(0, 40)} → ${W.B.mondVon.get(W.B.werkVon(vs)).titel.slice(0, 30)}`); } } }
console.log({n, fremd, keiner}); console.log(bsp.join('\n'));
