// Nur lesend: Verortung der Verwendungen an „Befund · Zeitspirale …“ nachrechnen
import {readFileSync} from 'node:fs';
const APP = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/';
const {materialParagraphs} = await import(APP + 'materialraum.js');
const datei = process.argv[2];
const S = JSON.parse(readFileSync(datei, 'utf8'));
const V = new Map(S.variants.map(v => [v.id, v]));
const norm = t => String(t || '').toLowerCase().replace(/[„“"'»«‚‘’*_#>`]/g, ' ').replace(/\s+/g, ' ').trim();
function verorte(teil, absaetze){
  const t = norm(teil); if(t.length < 3) return null;
  const kopf = a => norm(a.heading || (String(a.text).match(/^\s{0,3}#{1,6}\s+(.*)$/m) || [])[1] || '');
  const treffer = absaetze.filter(a => (' ' + norm(a.text) + ' ').includes(' ' + t + ' ') || norm(a.text).includes(t));
  if(treffer.length){ const k = treffer.find(a => kopf(a) && kopf(a).includes(t)) || treffer[0];
    return {index: k.index, art: 'wörtlich', mehrfach: treffer.length, alle: treffer.map(a=>a.index)}; }
  for(const a of absaetze){ const h = kopf(a);
    if(h && h.length >= 3 && (h === t || h.includes(t) || (t.includes(h) && h.length >= 8))) return {index: a.index, art: 'abschnitt', mehrfach: 1}; }
  return null;
}
for(const v of S.variants.filter(v => String(v.label).startsWith('Bauauftrag · Aufteilung im Verbund'))){
  const abs = materialParagraphs(v.content);
  console.log('==', v.label, abs.length, 'Passagen');
  abs.slice(0,4).forEach(a => console.log(' [' + a.index + ']', JSON.stringify(String(a.text).slice(0,120)), 'heading=', a.heading, 'role=', a.role, 'structured=', a.structured));
  let pro = {};
  for(const e of S.edges){ if(!e.usage) continue;
    const raus = e.from_variant_id === v.id; if(!raus && e.to_variant_id !== v.id) continue;
    const teil = raus ? e.usage.from_part : e.usage.to_part;
    const vo = verorte(teil, abs);
    console.log(' ', raus?'raus':'rein', e.edge_type, '→', V.get(raus?e.to_variant_id:e.from_variant_id)?.label, '| teil=', JSON.stringify(teil), '| fremdTeil=', JSON.stringify(raus?e.usage.to_part:e.usage.from_part), '| purpose=', JSON.stringify(e.usage.purpose), '| compat=', e.usage.compatibility, '| verorte=', JSON.stringify(vo));
    if(vo) pro[vo.index]=(pro[vo.index]||0)+1;
  }
  console.log(' pro Passage:', pro);
}
