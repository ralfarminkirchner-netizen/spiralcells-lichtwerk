import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand, menschlich} = await import(ROOT + 'app/js/daten.js');
const familieVon = s => { const l = String(s.label || ''), a = [l.indexOf(' · '), l.indexOf(' ('), l.length].filter(x => x > 0); return a.length ? l.slice(0, Math.min(...a)).trim() : ''; };
for(const f of ['testdaten/kette-gewebe/state.json', 'testdaten/state.json']){
  const B = bestand(JSON.parse(readFileSync(ROOT + f, 'utf8'))); const diff = new Set();
  for(const m of B.monde) for(const s of m.samen){ const x = familieVon(s); if(x && menschlich(x) !== x) diff.add(x + '  →  ' + menschlich(x)); }
  console.log(f, diff.size); for(const d of [...diff].slice(0, 8)) console.log('  ', d);
}
