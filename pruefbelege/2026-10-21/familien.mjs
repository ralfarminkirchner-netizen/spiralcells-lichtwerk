import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand, kurz, menschlich} = await import(ROOT + 'app/js/daten.js');
const {wuchs} = await import(ROOT + 'app/js/wuchs.js');
for(const datei of ['testdaten/kette-gewebe/state.json']){
  const B = bestand(JSON.parse(readFileSync(ROOT + datei, 'utf8')));
  for(const m of B.monde){ const W = wuchs(m); const fam = new Map(); W.familie.forEach((f, i) => { if(f){ const k = W.eltern[i] + ':' + f; fam.set(k, (fam.get(k) || 0) + 1); } });
    if(fam.size) console.log(m.titel, '→', [...fam].map(([k, n]) => k.split(':').slice(1).join(':') + ' (' + n + ')').join(' | ')); }
  // Kennungsartiges in Familiennamen?
}
console.log(String(kurz).slice(0, 300));
