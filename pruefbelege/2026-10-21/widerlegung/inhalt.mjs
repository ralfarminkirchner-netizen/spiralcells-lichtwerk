import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(R + 'app/js/daten.js');
const {materialParagraphs} = await import(R + 'app/js/materialraum.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8')));
for(const e of B.roh.edges){ const u = e.usage; if(!u || !u.to_part) continue; if(!/Strukturfunktionalismus|Gespeicherte Fassung/.test(u.to_part)) continue;
  const v = B.fassungen.get(e.to_variant_id); const ps = materialParagraphs(v.content);
  console.log('TO_PART', u.to_part, '| Fassung', v.label, '| Absätze', ps.length);
  ps.forEach(p => console.log('  ', p.index, (p.heading||''), '::', String(p.text).replace(/\s+/g,' ').slice(0,140)));
  const low = JSON.stringify(v.content).toLowerCase(); console.log('  enthält "strukturfunktional":', low.includes('strukturfunktional'), '"gespeicherte fassung":', low.includes('gespeicherte fassung'), '"institution":', low.includes('institution'));
}
