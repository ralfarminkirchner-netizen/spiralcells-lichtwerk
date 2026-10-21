// Nur lesend: Textanker und Faden-Ziele gegen die Testkette nachrechnen.
import {readFileSync} from 'node:fs';
const APP = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/';
const {materialParagraphs, alignParagraphs} = await import(APP + 'materialraum.js');
const datei = process.argv[2] || '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json';
const S = JSON.parse(readFileSync(datei, 'utf8'));
const V = new Map(S.variants.map(v => [v.id, v]));
const WT = new Map(S.worktrees.map(w => [w.id, w]));
const WK = new Map(S.works.map(w => [w.id, w]));
const werkVon = id => { const v = V.get(id); return v && WT.get(v.worktree_id) ? WK.get(WT.get(v.worktree_id).work_id) : null; };

// wörtlich aus stoff.js übernommen (Z. 47–58)
const norm = t => String(t || '').toLowerCase().replace(/[„“"'»«‚‘’*_#>`]/g, ' ').replace(/\s+/g, ' ').trim();
function verorte(teil, absaetze){
  const t = norm(teil); if(t.length < 3) return null;
  const kopf = a => norm(a.heading || (String(a.text).match(/^\s{0,3}#{1,6}\s+(.*)$/m) || [])[1] || '');
  const treffer = absaetze.filter(a => (' ' + norm(a.text) + ' ').includes(' ' + t + ' ') || norm(a.text).includes(t));
  if(treffer.length){ const k = treffer.find(a => kopf(a) && kopf(a).includes(t)) || treffer[0];
    return {index: k.index, art: 'wörtlich', mehrfach: treffer.length, alle: treffer.map(a => a.index)}; }
  for(const a of absaetze){ const h = kopf(a);
    if(h && h.length >= 3 && (h === t || h.includes(t) || (t.includes(h) && h.length >= 8))) return {index: a.index, art: 'abschnitt', mehrfach: 1}; }
  return null;
}
const finde = label => S.variants.filter(v => String(v.label).startsWith(label));

const zeigeVerwendungen = v => {
  const abs = materialParagraphs(v.content);
  console.log(`\n== „${v.label}“ in „${werkVon(v.id)?.title}“, ${abs.length} Passagen`);
  abs.forEach(a => console.log(`  [${a.index}] ${JSON.stringify(String(a.text).slice(0, 90))}${a.heading ? ' heading=' + JSON.stringify(a.heading) : ''}`));
  for(const e of S.edges){ if(!e.usage) continue;
    const raus = e.from_variant_id === v.id; if(!raus && e.to_variant_id !== v.id) continue;
    const teil = raus ? e.usage.from_part : e.usage.to_part, fremd = raus ? e.to_variant_id : e.from_variant_id;
    console.log(`  ${raus ? 'raus' : 'rein'} ${e.edge_type} ↔ „${V.get(fremd)?.label}“ | teil=${JSON.stringify(teil)} | fremdTeil=${JSON.stringify(raus ? e.usage.to_part : e.usage.from_part)} | compat=${e.usage.compatibility}`);
    console.log('     verorte(teil) =', JSON.stringify(verorte(teil, abs)));
  }
};
for(const v of finde('Befund · Zeitspirale ist die Lebenserschließung')) zeigeVerwendungen(v);

// Faden ins Genealogical Spiral: Kanten mit Verwendung, deren Ziel im Werk Genealogical Spiral liegt
console.log('\n== Kanten mit Verwendung, die ins Werk „Genealogical Spiral“ zeigen');
for(const e of S.edges){ if(!e.usage) continue; const wz = werkVon(e.to_variant_id), wv = werkVon(e.from_variant_id);
  if(!wz || !/Genealogical/i.test(wz.title)) continue;
  const ziel = V.get(e.to_variant_id), abs = materialParagraphs(ziel.content);
  console.log(`  von „${V.get(e.from_variant_id).label}“ (${wv?.title}) ${e.edge_type} → „${ziel.label}“ derived_from=${ziel.derived_from ? 'ja' : 'nein'}`);
  console.log('   usage', JSON.stringify(e.usage));
  console.log('   Ziel-Passagen:'); abs.forEach(a => console.log(`    [${a.index}] ${JSON.stringify(String(a.text).slice(0, 100))}`));
  console.log('   verorte(to_part) =', JSON.stringify(verorte(e.usage.to_part, abs)));
}
