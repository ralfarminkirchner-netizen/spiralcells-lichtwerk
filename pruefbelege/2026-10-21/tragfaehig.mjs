// Zählt Fäden mit Urteil „tragfähig“ innerhalb eines Werks (m.faeden) gegen Testdaten
import fs from 'node:fs';
const root = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const daten = await import(root + '/app/js/daten.js');
for(const f of ['testdaten/kette-gewebe/state.json', 'testdaten/kette-claude/state.json', 'testdaten/state.json']){
  const g = JSON.parse(fs.readFileSync(root + '/' + f, 'utf8'));
  const fn = daten.baue || daten.bauen || daten.lies || daten.default;
  let welt;
  try { welt = daten.bestand(g.graph || g); } catch(e){ console.log(f, 'Fehler', e.message, Object.keys(daten)); continue; }
  let inn = 0, aus = 0, form = 0, mensch = 0; const lst = [];
  for(const m of welt.monde){
    for(const x of m.faeden){ if(x.urteil === 'tragfähig'){ inn++; lst.push(m.name || m.titel); } if(x.form) form++; }
    for(const x of m.aussen) if(x.urteil === 'tragfähig') aus++;
  }
  console.log(f, 'tragfähig innen:', inn, 'aussen:', aus, 'Formfäden:', form, lst.slice(0,5));
}
