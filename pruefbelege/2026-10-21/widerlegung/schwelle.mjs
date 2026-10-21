// Nur lesend: lässt die Schwelle wortAnteil >= 0,1 bei langen, fremden Texten überhaupt etwas weg? Und was kostet ein langes, fremdes Paar?
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const {materialParagraphs, alignParagraphs} = await import(ROOT + '/app/js/materialraum.js');
const s = JSON.parse(readFileSync(`${ROOT}/testdaten/kette-gewebe/state.json`, 'utf8'));
const abs = []; for(const v of s.variants){ if(typeof v.content !== 'string' || /^\s*[\[{<]/.test(v.content)) continue; for(const p of v.content.split(/\n[ \t]*\n+/)) if(p.length > 200 && p.length < 1500 && !/^\s*[#|`-]/.test(p)) abs.push(p); }
const woerter = t => new Set((t.toLocaleLowerCase('de').match(/[\p{L}\p{N}]+/gu) || []).filter(x => x.length > 1));
const dice = (a, b) => { const A = woerter(a), B = woerter(b); let n = 0; for(const w of A) if(B.has(w)) n++; return 2 * n / (A.size + B.size); };
for(const n of [20, 64, 150]){
  const a = abs.slice(0, n).join('\n\n'), b = abs.slice(abs.length - n).join('\n\n');   // fremde Absätze, keine Überarbeitung
  const t = performance.now(); const pa = materialParagraphs(a), pb = materialParagraphs(b); const paare = alignParagraphs(pa, pb); const dt = performance.now() - t;
  console.log(`${n} gegen ${n} fremde Passagen: wortAnteil ${dice(a, b).toFixed(2)}, gepaart ${paare.filter(p => p.a && p.b).length}, align ${dt.toFixed(1)} ms`);
}
// Kurz gegen lang: was kostet eine kurze Gegenlese gegen ein langes Kapitel?
{ const a = abs.slice(0, 300).join('\n\n'), b = abs.slice(400, 410).join('\n\n'); const t = performance.now(); alignParagraphs(materialParagraphs(a), materialParagraphs(b));
  console.log(`300 gegen 10 Passagen: wortAnteil ${dice(a, b).toFixed(2)}, align ${(performance.now() - t).toFixed(1)} ms`); }
