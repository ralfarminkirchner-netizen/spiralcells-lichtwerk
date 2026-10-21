// Nur lesen: alle Kanten mit usage, deren Texte einen Runden-Slug tragen; und ob sie Werkgrenzen kreuzen.
import {readFileSync} from 'node:fs';
const p = process.argv[2];
const S = JSON.parse(readFileSync(p, 'utf8'));
const wt = new Map((S.worktrees || []).map(w => [w.id, w.work_id])); const werkVon = new Map((S.variants || []).map(v => [v.id, wt.get(v.worktree_id)]));
const titel = new Map((S.works || []).map(w => [w.id, w.title]));
const re = /\b[a-z]+(?:-[a-z]+)+-20\d{6}\b/;
let n = 0, nu = 0;
for(const e of S.edges || []){ if(!e.usage) continue; nu++;
  const a = werkVon.get(e.from_variant_id), b = werkVon.get(e.to_variant_id);
  for(const f of ['from_part', 'to_part', 'purpose', 'limits', 'conditions']){ const t = e.usage[f]; if(typeof t === 'string' && re.test(t)){ n++;
    console.log(`${f}: ${t.slice(0,120)}\n   ${titel.get(a)} -> ${titel.get(b)} ${a === b ? '(innen)' : '(FADEN)'}`); } } }
console.log(`usage-Kanten: ${nu}, Treffer: ${n}`);
// Alle usage-Feldnamen
const felder = new Set(); for(const e of S.edges || []) if(e.usage) Object.keys(e.usage).forEach(k => felder.add(k)); console.log([...felder].join(', '));
