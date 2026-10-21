// Nur lesen: Familiennamen kommen roh aus dem Label (wuchs.js familieVon), ohne menschlich()/kurz(). Wo würde das etwas ändern?
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const {bestand, menschlich} = await import(ROOT + '/app/js/daten.js');
const {wuchs} = await import(ROOT + '/app/js/wuchs.js');
for(const kette of ['kette-gewebe', 'kette-claude']){
  const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${kette}/state.json`, 'utf8')));
  const familieVon = s => { const l = String(s.label || ''), a = [l.indexOf(' · '), l.indexOf(' ('), l.length].filter(x => x > 0); return a.length ? l.slice(0, Math.min(...a)).trim() : ''; };
  let n = 0, laengste = '';
  for(const m of B.monde){ for(const s of m.samen){ const f = familieVon(s); if(f.length > laengste.length) laengste = f; if(menschlich(f) !== f){ n++; if(n <= 8) console.log(`${kette} | „${m.titel}“ | roh: ${f}  →  menschlich: ${menschlich(f)}`); } } }
  console.log(`${kette}: ${n} Namensanfänge, die menschlich() verändern würde; längster Namensanfang ${laengste.length} Zeichen: ${laengste.slice(0, 120)}`);
  // Welche Monde lösen reihenLage aus (Fächer > 20 Kinder mit > 20 Reihen-Kindern)?
  for(const m of B.monde){ const W = wuchs(m); const gross = W.kinder.filter(ks => ks.length > 20 && ks.filter(k => W.art[k] === 'reihe').length > 20).length; if(gross) console.log(`   reihenLage in „${m.titel}“: ${gross} Fächer`); }
}
