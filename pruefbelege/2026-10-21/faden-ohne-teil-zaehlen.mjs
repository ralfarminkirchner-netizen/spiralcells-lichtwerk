import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
for(const kette of ['kette-gewebe', 'kette-claude']){
  let st; try{ st = JSON.parse(readFileSync(ROOT + 'testdaten/' + kette + '/state.json', 'utf8')); }catch(e){ console.log(kette, 'fehlt'); continue; }
  const B = bestand(st);
  const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
  let ohne = 0, mit = 0; const bsp = [];
  for(const f of N.faeden){ const e = f.kanten[0], mt = !!(e.usage && e.usage.to_part); if(mt) mit++; else { ohne++; if(bsp.length < 5) bsp.push(`${B.monde[f.von].titel.slice(0,30)} -> ${B.monde[f.nach].titel.slice(0,30)} (${f.kanten.length})`); } }
  console.log(kette, {faeden: N.faeden.length, ersteKanteMitTeil: mit, ersteKanteOhneTeil: ohne}); console.log(bsp);
}
