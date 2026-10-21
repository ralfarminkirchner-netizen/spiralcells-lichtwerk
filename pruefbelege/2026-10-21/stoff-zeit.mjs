import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {W} = await import(ROOT + 'app/js/welt.js');
const {Zelle} = await import(ROOT + 'app/js/zelle.js');
const S = await import('./stoff-kopie.mjs');
const {materialParagraphs, alignParagraphs} = await import(ROOT + 'app/js/materialraum.js');
W.B = bestand(JSON.parse(readFileSync(ROOT + process.argv[2], 'utf8')));
const zeiten = [];
for(const m of W.B.monde){ if(!m.samen.length) continue; W.Z = new Zelle(m, {ohneAufzug: true});
  for(let si = 0; si < m.samen.length; si++){ const v = m.samen[si].fassung;
    S.setzeZ({mond: m, v, si, modus: 'vergleich', vergleich: null, stelle: null});
    const t0 = performance.now(); let k, vs; try{ k = S.kandidaten(); vs = S.vorschlag(); }catch(e){ console.log('WIRFT', m.titel, si, e.message); continue; }
    const dt = performance.now() - t0; zeiten.push([dt, m.titel, v.label, k.length, (typeof v.content === 'string' ? v.content.length : JSON.stringify(v.content || '').length)]);
    // ruhiger Vergleich: was baueRuhig zusätzlich prüft (alle Kandidaten, nicht nur 24)
    if(vs){ const o = W.B.fassungen.get(vs); const t1 = performance.now(); const paare = alignParagraphs(materialParagraphs(v.content), materialParagraphs(o.content)); const {anteil} = S.abgleich(paare);
      if(S.kaumGemeinsam(paare, anteil)){ const t2 = performance.now(); const andere = S.kandidaten().filter(x => x.id !== o.id && S.teilenWortlaut(v, W.B.fassungen.get(x.id))); zeiten.at(-1).push('ruhig', (performance.now() - t2).toFixed(0) + 'ms', andere.length); } }
  } }
zeiten.sort((a, b) => b[0] - a[0]);
console.log('Fassungen geprüft:', zeiten.length);
for(const z of zeiten.slice(0, 12)) console.log(z[0].toFixed(0) + 'ms', '|', z[1].slice(0, 40), '|', String(z[2]).slice(0, 50), '| Kandidaten', z[3], '| Zeichen', z[4], z.slice(5).join(' '));
