// Nur lesend: Ziel-Fassung der Durkheim→Radcliffe-Brown-Kanten, Wortlaut nach „Institution“/„Stabil“ durchsuchen
import {readFileSync} from 'node:fs';
const APP = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/';
const {materialParagraphs} = await import(APP + 'materialraum.js');
const S = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for(const x of S.edges.filter(e => e.usage && /Strukturfunktionalismus|Institutionen und ihr/.test(e.usage.to_part || ''))){
  const v = S.variants.find(v => v.id === x.to_variant_id), c = typeof v.content === 'string' ? v.content : JSON.stringify(v.content);
  const abs = materialParagraphs(v.content);
  console.log('ZIEL', v.label, '| Zeichen', c.length, '| Passagen', abs.length);
  console.log('to_part:', x.usage.to_part);
  console.log('Treffer „Institution“:', (c.match(/.{0,50}[Ii]nstitution.{0,50}/g) || []).slice(0, 4));
  console.log('Treffer „Stabil“:', (c.match(/.{0,50}[Ss]tabil.{0,50}/g) || []).slice(0, 4));
  console.log('Überschriften:', abs.filter(a => a.heading).map(a => a.heading).slice(0, 12));
}
