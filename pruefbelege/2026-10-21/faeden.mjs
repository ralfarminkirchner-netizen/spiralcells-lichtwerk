import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + '/app/js/daten.js');
const {Netz} = await import(R + '/app/js/netz.js');
const O = JSON.parse(readFileSync(R + '/app/ordnung.json', 'utf8'));
for(const kette of ['kette-claude', 'kette-gewebe']){
  const B = bestand(JSON.parse(readFileSync(`${R}/testdaten/${kette}/state.json`, 'utf8')));
  const N = new Netz(B, O);
  let kanten = 0, mitTeil = 0, fadenMitTeil0 = 0;
  N.faeden.forEach((f, fi) => { kanten += f.kanten.length; mitTeil += f.kanten.filter(e => e.usage && e.usage.to_part).length;
    const e = f.kanten[0]; if(e.usage && e.usage.to_part) fadenMitTeil0++; });
  console.log(kette, 'Fäden', N.faeden.length, 'Kanten', kanten, 'mit to_part', mitTeil, 'Fäden deren erste Kante to_part hat', fadenMitTeil0);
  N.faeden.slice(0, 6).forEach((f, fi) => console.log(' ', fi, B.monde[f.von].titel, '->', B.monde[f.nach].titel, f.typ, f.kanten.map(e => e.usage ? (e.usage.to_part ? 'T' : 'u') : '-').join('')));
}
