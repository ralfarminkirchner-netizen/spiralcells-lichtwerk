import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(R + 'app/js/daten.js');
const {wuchs} = await import(R + 'app/js/wuchs.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + (process.argv[2] || 'kette-gewebe') + '/state.json', 'utf8')));
for(const m of B.monde){ const si = m.samen.findIndex(s => (s.label || '').startsWith('Befund · Zeitspirale ist die Lebenserschließung')); if(si < 0) continue;
  const W = wuchs(m), zw = W.zweige[W.zweigVon[si]], p = W.eltern[zw[0]];
  console.log('Mond', m.titel, '| Herkunft', p, '| Zweiglänge', zw.length, '| hier Nr.', zw.indexOf(si) + 1);
  zw.forEach((i, k) => console.log(String(k + 1).padStart(2), m.samen[i].label.slice(0, 60)));
}
