// Zählt Fäden (Werkpaar+Typ+Richtung) mit mehr als einer Kante, nach netz.js:69-75
import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const V = new Map(s.variants.map(v => [v.id, v])), T = new Map(s.worktrees.map(t => [t.id, t]));
const werkVon = vid => { const v = V.get(vid); const t = v && T.get(v.worktree_id); return t ? t.work_id : null; };
const titel = new Map(s.works.map(w => [w.id, w.title]));
const b = new Map();
for (const e of s.edges) { const a = werkVon(e.from_variant_id), c = werkVon(e.to_variant_id); if (!a || !c || a === c) continue;
  const fl = e.edge_type === 'remixt-aus' || e.edge_type === 'erweitert'; const von = fl ? c : a, nach = fl ? a : c, k = `${von}>${nach}:${e.edge_type}`;
  const f = b.get(k) || { von, nach, typ: e.edge_type, kanten: [] }; f.kanten.push(e); b.set(k, f); }
const fs2 = [...b.values()];
const mehr = fs2.filter(f => f.kanten.length > 1);
console.log('Fäden gesamt', fs2.length, 'mit >1 Kante', mehr.length, 'Kanten darin', mehr.reduce((a, f) => a + f.kanten.length, 0), 'nur per Taste erreichbar', mehr.reduce((a, f) => a + f.kanten.length - 1, 0));
for (const f of mehr) { const mitU = f.kanten.filter(e => e.usage).length;
  const ziele = new Set(f.kanten.map(e => (e.usage && e.usage.to_part) ? e.to_variant_id : e.from_variant_id));
  console.log(`${titel.get(f.von)} -> ${titel.get(f.nach)} [${f.typ}] Kanten ${f.kanten.length}, mit usage ${mitU}, verschiedene Ziel-Fassungen ${ziele.size}`); }
