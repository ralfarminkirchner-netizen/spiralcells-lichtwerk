// Nur lesend: Fassung aus gewebe2-10, Verortung ihrer Verwendungen, welche Passagen einen Rand bekommen
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
globalThis.innerWidth = 1200; globalThis.innerHeight = 900;
const {bestand} = await import(ROOT + '/app/js/daten.js');
const {materialParagraphs} = await import(ROOT + '/app/js/materialraum.js');
const {verorte} = await import(ROOT + '/app/js/stoff.js');
for(const K of ['kette-gewebe', 'kette-claude']){
  const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${K}/state.json`, 'utf8')));
  for(const v of B.fassungen.values()){ if(!/Belegte gehostete Fassung/.test(v.label)) continue;
    const abs = materialParagraphs(v.content);
    console.log(K, '|', v.label, '| Passagen:', abs.length, abs.map(a => JSON.stringify(String(a.text).slice(0, 40))).join(' / '));
    for(const e of B.roh.edges){ if(!e.usage) continue;
      const teil = e.from_variant_id === v.id ? e.usage.from_part : e.to_variant_id === v.id ? e.usage.to_part : null; if(teil == null) continue;
      const wo = verorte(teil, abs); console.log('   Verwendung', e.edge_type, 'Teil', JSON.stringify(teil), '→', wo ? `Passage ${wo.index + 1} (${wo.art}, ${wo.mehrfach})` : 'ohne Fundstelle'); } } }
