import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
let mehr = 0, unerreichbar = 0, mitTeil = 0;
for(const f of N.faeden){ if(f.kanten.length > 1){ mehr++; const rest = f.kanten.slice(1); unerreichbar += rest.length; mitTeil += rest.filter(e => e.usage && e.usage.to_part).length;
  console.log(`${B.monde[f.von].titel.slice(0, 28)} → ${B.monde[f.nach].titel.slice(0, 28)} [${f.typ}]: ${f.kanten.length} Verbindungen, mit Verwendung ${f.verwendung}`); } }
console.log({faeden: N.faeden.length, mitMehrerenVerbindungen: mehr, nurPerPfeiltasteErreichbar: unerreichbar, davonMitStelle: mitTeil});
const m60 = B.monde.filter(m => m.samen.length > 60).map(m => m.titel + ' (' + m.samen.length + ')'); console.log('Monde > 60:', m60);
