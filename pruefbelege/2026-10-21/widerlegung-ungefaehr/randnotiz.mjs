import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
const {materialParagraphs} = await import(ROOT + 'app/js/materialraum.js');
const {verorte} = await import(ROOT + 'app/js/stoff.js');
for(const kette of ['kette-gewebe', 'kette-claude']){
  let st; try{ st = JSON.parse(readFileSync(ROOT + `testdaten/${kette}/state.json`, 'utf8')); }catch(e){ console.log(kette, 'fehlt'); continue; }
  const B = bestand(st);
  let ungef = 0, mitHinweis = 0;
  // Jede Kante mit Verwendung, in beide Richtungen gefolgt (Faden: to_part; Verwendung: fremdTeil)
  for(const e of B.roh.edges){ const u = e.usage; if(!u) continue;
    for(const [ziel, teil] of [[e.to_variant_id, u.to_part], [e.from_variant_id, u.from_part]]){ if(!teil) continue;
      const v = B.fassungen.get(ziel); if(!v) continue; const abs = materialParagraphs(v.content), wo = verorte(teil, abs);
      if(!wo || !(wo.art !== 'wörtlich' || wo.mehrfach > 1)) continue; ungef++;
      // Randnotiz derselben Kante in der Zielfassung (wie verwendungen()+baueLesen)
      const eigenTeil = e.to_variant_id === ziel ? u.to_part : u.from_part, vo = verorte(eigenTeil, abs);
      const ungenau = vo && vo.art === 'abschnitt' ? 'Abschnitt, nicht wörtlich' : vo && vo.mehrfach > 1 ? `steht ${vo.mehrfach}-mal im Wortlaut, hier die erste passende Stelle` : '';
      if(vo && vo.index === wo.index && ungenau) mitHinweis++;
      console.log(`${kette}: „${String(v.label).slice(0,40)}“ Teil „${String(teil).slice(0,30)}“ → Absatz ${wo.index}; Randnotiz dort: ${vo && vo.index === wo.index ? '„' + ungenau + '“' : 'KEINE'}`);
    } }
  console.log(kette, 'ungefähre Ziele:', ungef, 'davon mit Hinweis in der Randnotiz an derselben Passage:', mitHinweis);
}
