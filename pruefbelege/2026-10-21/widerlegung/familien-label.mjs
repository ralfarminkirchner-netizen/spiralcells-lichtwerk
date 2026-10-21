// Nur lesen: welche Familiennamen zeigt der große Übernahmefächer, wie lang, und wie sehen die Labels aller Übernahmereihen aus?
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const {bestand, menschlich} = await import(ROOT + '/app/js/daten.js');
const {wuchs} = await import(ROOT + '/app/js/wuchs.js');
for(const kette of ['kette-gewebe']){
  const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${kette}/state.json`, 'utf8')));
  for(const m of B.monde){ const W = wuchs(m);
    if(W.familie && W.familie.some(Boolean)){ const z = new Map(); W.familie.forEach(f => f && z.set(f, (z.get(f)||0)+1)); console.log('Mond', m.titel, [...z].map(([f,c]) => `${f} (${[...f].length} Z., ${c})`).join(' | ')); }
    const reihen = m.samen.filter((s, i) => W.art[i] === 'reihe');
    if(reihen.length > 5) console.log('  Reihen in', m.titel, reihen.length, 'Beispiele:', reihen.slice(0, 4).map(s => s.label).join(' || '));
  }
  // Labels im ganzen Bestand, die eine Kennung oder einen Pfad enthalten
  let k = 0; for(const m of B.monde) for(const s of m.samen) if(menschlich(s.label) !== s.label){ k++; if(k <= 5) console.log('  roh≠menschlich:', m.titel, '|', s.label.slice(0, 100)); }
  console.log(kette, 'Labels, die menschlich() ändert:', k);
}
