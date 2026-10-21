// Nur lesend: Wohin führt „tippen liest die Stelle“ für jeden werkübergreifenden Faden mit Verwendung?
import {readFileSync} from 'node:fs';
const APP = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/';
const {materialParagraphs} = await import(APP + 'materialraum.js');
const norm = t => String(t || '').toLowerCase().replace(/[„“"'»«‚‘’*_#>`]/g, ' ').replace(/\s+/g, ' ').trim();
function verorte(teil, absaetze){ const t = norm(teil); if(t.length < 3) return null;
  const kopf = a => norm(a.heading || (String(a.text).match(/^\s{0,3}#{1,6}\s+(.*)$/m) || [])[1] || '');
  const treffer = absaetze.filter(a => (' ' + norm(a.text) + ' ').includes(' ' + t + ' ') || norm(a.text).includes(t));
  if(treffer.length){ const k = treffer.find(a => kopf(a) && kopf(a).includes(t)) || treffer[0]; return {index: k.index, art: 'wörtlich', mehrfach: treffer.length}; }
  for(const a of absaetze){ const h = kopf(a); if(h && h.length >= 3 && (h === t || h.includes(t) || (t.includes(h) && h.length >= 8))) return {index: a.index, art: 'abschnitt', mehrfach: 1}; }
  return null; }
const S = JSON.parse(readFileSync(process.argv[2], 'utf8')), V = new Map(S.variants.map(v => [v.id, v])), WT = new Map(S.worktrees.map(w => [w.id, w])), WK = new Map(S.works.map(w => [w.id, w]));
const werk = id => { const v = V.get(id); return v && WT.get(v.worktree_id) ? WK.get(WT.get(v.worktree_id).work_id) : null; };
const buendel = new Map();
for(const e of S.edges){ const a = werk(e.from_variant_id), b = werk(e.to_variant_id); if(!a || !b || a === b) continue;
  const k = `${a.title}>${b.title}:${e.edge_type}`; const f = buendel.get(k) || []; f.push(e); buendel.set(k, f); }
for(const [k, ks] of buendel){ if(!ks.some(e => e.usage)) continue; ks.sort((p, q) => (q.usage ? 1 : 0) - (p.usage ? 1 : 0));
  console.log(`\n${k}  (${ks.length} Kanten, ${ks.filter(e => e.usage).length} mit Verwendung)`);
  ks.forEach((e, i) => { const u = e.usage; if(!u){ console.log(`  ${i + 1}. ohne Verwendung → Lesefläche`); return; }
    const z = V.get(e.to_variant_id), wo = u.to_part ? verorte(u.to_part, materialParagraphs(z.content)) : null;
    console.log(`  ${i + 1}. to_part=${JSON.stringify(u.to_part)} → „${z.label.slice(0, 40)}“ ${wo ? `Passage ${wo.index + 1} ${wo.art} ×${wo.mehrfach}` : u.to_part ? 'NICHT im Wortlaut' : 'kein Teil → Lesefläche'}`); }); }
