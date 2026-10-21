// Wie oft landet ein Faden (Kante mit usage.to_part) ohne Fund im Wortlaut? (folgeFaden, haupt.js:202-212)
import fs from 'node:fs';
const root = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
globalThis.document = {querySelector(){return null}, createElement(){return {}}};
const {materialParagraphs} = await import(root + '/app/js/materialraum.js');
const {verorte} = await import(root + '/app/js/stoff.js');
for(const name of ['kette-gewebe', 'kette-claude']){
  const s = JSON.parse(fs.readFileSync(`${root}/testdaten/${name}/state.json`, 'utf8'));
  const V = new Map(s.variants.map(v => [v.id, v]));
  let mitTeil = 0, ohne = 0, wort = 0, ungefaehr = 0;
  for(const e of s.edges){ const u = e.usage; if(!u || !u.to_part) continue; mitTeil++;
    const v = V.get(e.to_variant_id); const wo = v ? verorte(u.to_part, materialParagraphs(v.content)) : null;
    if(!wo) ohne++; else if(wo.art !== 'wörtlich' || wo.mehrfach > 1) ungefaehr++; else wort++; }
  console.log(name, {kanten: s.edges.length, mitTeil, wörtlich: wort, ungefaehr, ohneFund: ohne});
}
