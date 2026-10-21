// Welche werkübergreifenden Kanten mit to_part finden ihren Teil (verorte), welche nicht?
import fs from 'node:fs';
const root = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
globalThis.document = {querySelector(){return null}, createElement(){return {}}};
const {materialParagraphs} = await import(root + '/app/js/materialraum.js');
const {verorte} = await import(root + '/app/js/stoff.js');
const s = JSON.parse(fs.readFileSync(`${root}/testdaten/kette-gewebe/state.json`, 'utf8'));
const V = new Map(s.variants.map(v => [v.id, v])), WT = new Map(s.worktrees.map(w => [w.id, w])), WK = new Map(s.works.map(w => [w.id, w]));
const werkVon = id => { const v = V.get(id); const w = v && WT.get(v.worktree_id); return w ? w.work_id : null; };
for(const e of s.edges){ const a = werkVon(e.from_variant_id), b = werkVon(e.to_variant_id); if(!a || !b || a === b || !e.usage || !e.usage.to_part) continue;
  const v = V.get(e.to_variant_id), wo = verorte(e.usage.to_part, materialParagraphs(v.content));
  console.log(wo ? 'FUND ' + wo.art + ' x' + wo.mehrfach : 'OHNE', '|', (WK.get(a)||{}).title, '->', (WK.get(b)||{}).title, '|', e.usage.to_part.slice(0, 70)); }
