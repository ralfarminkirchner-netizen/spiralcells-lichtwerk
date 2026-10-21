import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(R + 'app/js/daten.js');
const {materialParagraphs} = await import(R + 'app/js/materialraum.js');
const norm = t => String(t || '').toLowerCase().replace(/[„“"'»«‚‘’*_#>`]/g, ' ').replace(/\s+/g, ' ').trim();
function verorte(teil, absaetze){
  const t = norm(teil); if(t.length < 3) return null;
  const kopf = a => norm(a.heading || (String(a.text).match(/^\s{0,3}#{1,6}\s+(.*)$/m) || [])[1] || '');
  const treffer = absaetze.filter(a => (' ' + norm(a.text) + ' ').includes(' ' + t + ' ') || norm(a.text).includes(t));
  if(treffer.length){ const k = treffer.find(a => kopf(a) && kopf(a).includes(t)) || treffer[0];
    return {index: k.index, art: 'wörtlich', mehrfach: treffer.length}; }
  for(const a of absaetze){ const h = kopf(a);
    if(h && h.length >= 3 && (h === t || h.includes(t) || (t.includes(h) && h.length >= 8))) return {index: a.index, art: 'abschnitt', mehrfach: 1}; }
  return null;
}
for(const satz of (process.argv[2] ? [process.argv[2]] : ['kette-gewebe', 'kette-claude'])){
const state = JSON.parse(readFileSync(R + 'testdaten/' + satz + '/state.json', 'utf8'));
const B = bestand(state);
const idx = new Map(B.monde.map((m, i) => [m.id, i])), buendel = new Map();
for(const e of B.roh.edges){ const a = idx.get(B.werkVon(e.from_variant_id)), b = idx.get(B.werkVon(e.to_variant_id)); if(a == null || b == null || a === b) continue;
  const fliesst = e.edge_type === 'remixt-aus' || e.edge_type === 'erweitert';
  const von = fliesst ? b : a, nach = fliesst ? a : b, k = `${von}>${nach}:${e.edge_type}`;
  const f = buendel.get(k) || {von, nach, typ: e.edge_type, kanten: [], verwendung: 0}; f.kanten.push(e); if(e.usage) f.verwendung++; buendel.set(k, f); }
const faeden = [...buendel.values()]; for(const f of faeden) f.kanten.sort((p, q) => (q.usage ? 1 : 0) - (p.usage ? 1 : 0));
console.log('==', satz, 'Fäden', faeden.length);
let n = 0, eindeutig = 0;
faeden.forEach((f, fi) => f.kanten.forEach((e, k) => { const u = e.usage; if(!u || !u.to_part) return; n++;
  const vt = B.fassungen.get(e.to_variant_id), vf = B.fassungen.get(e.from_variant_id);
  const wo = vt ? verorte(u.to_part, materialParagraphs(vt.content)) : null;
  const wf = vf && u.from_part ? verorte(u.from_part, materialParagraphs(vf.content)) : null;
  if(wo && wo.art === 'wörtlich' && wo.mehrfach === 1) eindeutig++;
  console.log(`F${fi} k${k}/${f.kanten.length} ${f.typ} „${B.monde[f.von].titel.slice(0,30)}“→„${B.monde[f.nach].titel.slice(0,30)}“\n   to_part: ${JSON.stringify(String(u.to_part).slice(0,90))} -> ${JSON.stringify(wo)}\n   from_part: ${JSON.stringify(String(u.from_part||'').slice(0,90))} -> ${JSON.stringify(wf)}`);
}));
console.log('Kanten mit to_part:', n, 'eindeutig wörtlich:', eindeutig);
}
