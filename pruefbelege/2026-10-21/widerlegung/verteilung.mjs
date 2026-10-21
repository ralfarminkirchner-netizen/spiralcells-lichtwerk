// Nur lesend: wie viele Gegenüber-Kandidaten und wie lange Fassungen gibt es im Bestand?
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const {materialParagraphs} = await import(ROOT + '/app/js/materialraum.js');
for(const name of ['kette-gewebe', 'kette-claude']){
  const s = JSON.parse(readFileSync(`${ROOT}/testdaten/${name}/state.json`, 'utf8'));
  const kant = new Map(); for(const e of s.edges){ for(const id of [e.from_variant_id, e.to_variant_id]) kant.set(id, (kant.get(id) || 0) + 1); }
  const laengen = s.variants.map(v => ({n: materialParagraphs(v.content).length, c: typeof v.content === 'string' ? v.content.length : JSON.stringify(v.content || '').length, k: (kant.get(v.id) || 0), g: ((v.contribution || {}).seen_variant_ids || []).length}));
  const top = (f, n = 5) => [...laengen].sort((a, b) => f(b) - f(a)).slice(0, n).map(f);
  console.log(name, 'Fassungen', s.variants.length, 'Kanten', s.edges.length);
  console.log('  meiste Passagen:', top(x => x.n).join(', '), ' | größte Zeichen:', top(x => x.c).join(', '));
  console.log('  meiste Kanten je Fassung:', top(x => x.k).join(', '), ' | meiste gelesene:', top(x => x.g).join(', '));
  console.log('  meiste Kanten+gelesene:', top(x => x.k + x.g).join(', '));
  console.log('  Fassungen mit > 150 Passagen:', laengen.filter(x => x.n > 150).length, ' > 100:', laengen.filter(x => x.n > 100).length);
}
