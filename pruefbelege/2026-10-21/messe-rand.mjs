// Nur lesend: wie viele Passagen mit Rand hat eine Fassung höchstens (randFliessen erzwingt je eine Layout-Runde)
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand} = await import(ROOT + '/app/js/daten.js');
const {materialParagraphs} = await import(ROOT + '/app/js/materialraum.js');
const {verorte} = await import(ROOT + '/app/js/stoff.js');
for(const K of ['kette-gewebe', 'kette-claude']){
  const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${K}/state.json`, 'utf8')));
  const proV = new Map(); for(const e of B.roh.edges){ if(!e.usage) continue; for(const [vid, teil] of [[e.from_variant_id, e.usage.from_part], [e.to_variant_id, e.usage.to_part]]){ if(!proV.has(vid)) proV.set(vid, []); proV.get(vid).push(teil); } }
  let best = null, maxP = 0;
  for(const [vid, teile] of proV){ const v = B.fassungen.get(vid); if(!v) continue; const abs = materialParagraphs(v.content); maxP = Math.max(maxP, abs.length);
    const t0 = performance.now(); const stellen = new Set(teile.map(t => verorte(t, abs)).filter(Boolean).map(x => x.index)); const dt = performance.now() - t0;
    if(!best || stellen.size > best.r) best = {r: stellen.size, P: abs.length, u: teile.length, label: v.label, dt}; }
  let gr = 0; for(const v of B.fassungen.values()) gr = Math.max(gr, materialParagraphs(v.content).length);
  console.log(K, 'Kanten mit Verwendung:', B.roh.edges.filter(e => e.usage).length, '| meiste Passagen mit Rand in einer Fassung:', best, '| größte Passagenzahl einer Fassung:', gr);
}
