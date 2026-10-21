// Nur lesen: wo unterscheidet sich zeige() (stoff.js:61-63) von menschlich() auf usage-Texten? Getrennt nach Faden (Werkgrenze) und innen.
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const {menschlich} = await import(ROOT + '/app/js/daten.js');
const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
const zeige = t => menschlich(t)
  .replace(/\b[a-z]+(?:-[a-z]+)+-(20\d{2})(\d{2})(\d{2})\b/g, (_, y, mo, d) => `Runde vom ${Number(d)}. ${MON[Number(mo) - 1] || ''}`.trim())
  .replace(/(?:Library\/)?Mobile Documents\/[^\s<>"'`)\]]+/g, x => x.split(/[\/:]/).filter(Boolean).pop() || '[Ablage]');
const S = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const wt = new Map(S.worktrees.map(w => [w.id, w.work_id])), werkVon = new Map(S.variants.map(v => [v.id, wt.get(v.worktree_id)]));
let faden = 0, innen = 0, fd = 0, id = 0;
for(const e of S.edges){ if(!e.usage) continue; const a = werkVon.get(e.from_variant_id), b = werkVon.get(e.to_variant_id), quer = a && b && a !== b;
  quer ? faden++ : innen++;
  for(const f of ['from_part', 'to_part', 'purpose']){ const t = e.usage[f]; if(typeof t !== 'string') continue; const m = menschlich(t), z = zeige(t);
    if(m !== z){ quer ? fd++ : id++; console.log(`${quer ? 'FADEN' : 'innen'} ${f}: ${m.slice(0,100)}\n   zeige: ${z.slice(0,100)}`); } } }
console.log(`usage-Kanten über Werkgrenze: ${faden}, innen: ${innen}; Unterschiede Faden: ${fd}, innen: ${id}`);
