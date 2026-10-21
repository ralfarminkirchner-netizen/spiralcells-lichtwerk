// Nur lesend: Wie oft hängen Randnotizen an einer kurzen Passage (Überschrift/Titelzeile), auf die weiterer Text folgt?
import {readFileSync} from 'node:fs';
const APP = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/';
const {materialParagraphs} = await import(APP + 'materialraum.js');
const S = JSON.parse(readFileSync(process.argv[2], 'utf8'));
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
let mitRand = 0, kurzMitRand = 0, ersteKurz = 0, notenGesamt = 0; const faelle = [];
for(const v of S.variants){
  const abs = materialParagraphs(v.content); if(!abs.length) continue;
  const pro = new Map();
  for(const e of S.edges){ if(!e.usage) continue;
    let teil; if(e.from_variant_id === v.id) teil = e.usage.from_part; else if(e.to_variant_id === v.id) teil = e.usage.to_part; else continue;
    const vo = verorte(teil, abs); if(!vo) continue; pro.set(vo.index, (pro.get(vo.index) || 0) + 1); notenGesamt++; }
  if(!pro.size) continue; mitRand++;
  for(const [i, n] of pro){ const a = abs.find(x => x.index === i); const len = String(a.text).length;
    if(len < 80 && i < abs.length - 1){ kurzMitRand++; if(i === 0) ersteKurz++; faelle.push(`${JSON.stringify(v.label.slice(0,60))} P${i+1} (${len} Z.) ${n} Notiz(en): ${JSON.stringify(String(a.text).slice(0,60))}`); } }
}
console.log({fassungen: S.variants.length, mitRand, notenVerortet: notenGesamt, kurzePassagenMitRandVorWeiteremText: kurzMitRand, davonErstePassage: ersteKurz});
faelle.forEach(f => console.log(' ', f));
