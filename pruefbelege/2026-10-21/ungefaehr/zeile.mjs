import {readFileSync} from 'node:fs';
const A = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/';
const {bestand} = await import(A + 'daten.js');
const {materialParagraphs} = await import(A + 'materialraum.js');
const {verorte} = await import(A + 'stoff.js');
for(const k of ['kette-gewebe', 'kette-claude']){
  let state; try{ state = JSON.parse(readFileSync(`/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/${k}/state.json`, 'utf8')); }catch(e){ console.log(k, 'fehlt'); continue; }
  const B = bestand(state);
  const idx = new Map(B.monde.map((m, i) => [m.id, i])), buendel = new Map();
  for(const e of B.roh.edges){ const a = idx.get(B.werkVon(e.from_variant_id)), b = idx.get(B.werkVon(e.to_variant_id)); if(a == null || b == null || a === b) continue;
    const fliesst = e.edge_type === 'remixt-aus' || e.edge_type === 'erweitert';
    const von = fliesst ? b : a, nach = fliesst ? a : b, kk = `${von}>${nach}:${e.edge_type}`;
    const f = buendel.get(kk) || {von, nach, typ: e.edge_type, kanten: [], verwendung: 0}; f.kanten.push(e); if(e.usage) f.verwendung++; buendel.set(kk, f); }
  const faeden = [...buendel.values()]; for(const f of faeden) f.kanten.sort((p, q) => (q.usage ? 1 : 0) - (p.usage ? 1 : 0));
  console.log('==', k, 'Fäden', faeden.length);
  let n = {gar: 0, eindeutig: 0, ungefaehr: 0, kein: 0};
  faeden.forEach((f, fi) => f.kanten.forEach((e, ki) => { const u = e.usage; if(!u || !u.to_part) return;
    const v = B.fassungen.get(e.to_variant_id), wo = v ? verorte(u.to_part, materialParagraphs(v.content)) : null;
    const ungefaehr = !!wo && (wo.art !== 'wörtlich' || wo.mehrfach > 1);
    n.gar++; if(!wo) n.kein++; else if(ungefaehr) n.ungefaehr++; else n.eindeutig++;
    console.log(`F${fi} k${ki} ${B.monde[f.von].titel.slice(0,30)} -> ${B.monde[f.nach].titel.slice(0,40)} | ${e.edge_type} | to_part=${JSON.stringify(String(u.to_part).slice(0,50))} | wo=${JSON.stringify(wo)} | ungefaehr=${ungefaehr} | erreichbar(k=${ki})`);
  }));
  console.log(n);
}
