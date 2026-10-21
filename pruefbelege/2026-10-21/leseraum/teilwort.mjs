// Nur lesend: Wo verortet verorte() einen Teil nur als Wortstück (ohne Wortgrenze)? Gegen beide Testketten.
import {readFileSync} from 'node:fs';
const APP = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/';
const {materialParagraphs} = await import(APP + 'materialraum.js');
const norm = t => String(t || '').toLowerCase().replace(/[„“"'»«‚‘’*_#>`]/g, ' ').replace(/\s+/g, ' ').trim();
function verorte(teil, absaetze){   // wörtlich aus stoff.js Z. 49–58
  const t = norm(teil); if(t.length < 3) return null;
  const kopf = a => norm(a.heading || (String(a.text).match(/^\s{0,3}#{1,6}\s+(.*)$/m) || [])[1] || '');
  const treffer = absaetze.filter(a => (' ' + norm(a.text) + ' ').includes(' ' + t + ' ') || norm(a.text).includes(t));
  if(treffer.length){ const k = treffer.find(a => kopf(a) && kopf(a).includes(t)) || treffer[0];
    return {index: k.index, art: 'wörtlich', mehrfach: treffer.length, k}; }
  for(const a of absaetze){ const h = kopf(a);
    if(h && h.length >= 3 && (h === t || h.includes(t) || (t.includes(h) && h.length >= 8))) return {index: a.index, art: 'abschnitt', mehrfach: 1}; }
  return null;
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ganzesWort = (t, text) => new RegExp('(^|[^\\p{L}\\p{N}])' + esc(norm(t)) + '($|[^\\p{L}\\p{N}])', 'u').test(norm(text));
for(const datei of process.argv.slice(2)){
  const S = JSON.parse(readFileSync(datei, 'utf8')), V = new Map(S.variants.map(v => [v.id, v]));
  console.log('\n###', datei.split('/').slice(-2).join('/'));
  let n = 0, nur = 0;
  for(const e of S.edges){ if(!e.usage) continue;
    for(const [teil, vid, seite] of [[e.usage.from_part, e.from_variant_id, 'from'], [e.usage.to_part, e.to_variant_id, 'to']]){
      if(!teil) continue; const v = V.get(vid); if(!v) continue; const abs = materialParagraphs(v.content), r = verorte(teil, abs); if(!r || r.art !== 'wörtlich') continue; n++;
      if(!ganzesWort(teil, r.k.text)){ nur++;
        const nt = norm(r.k.text), p = nt.indexOf(norm(teil));
        console.log(`  ${seite}_part ${JSON.stringify(teil)} in „${v.label.slice(0, 50)}“ → Passage ${r.index + 1} (mehrfach ${r.mehrfach}) nur als Wortstück: …${nt.slice(Math.max(0, p - 25), p + norm(teil).length + 25)}…`); }
    }
  }
  console.log(`  wörtlich verortet: ${n}, davon nur als Wortstück: ${nur}`);
}
