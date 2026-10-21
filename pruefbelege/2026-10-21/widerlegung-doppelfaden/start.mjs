import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
for(const kette of ['kette-gewebe', 'kette-claude']){
  const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/' + kette + '/state.json', 'utf8')));
  const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
  let best = -1, bt = -1; B.monde.forEach((m, j) => { if(m.stimmen.length && m.zeitspanne[1] > bt){ bt = m.zeitspanne[1]; best = j; } });
  const eigen = N.faeden.map((f, fi) => f.von === best || f.nach === best ? fi : -1).filter(x => x >= 0);
  const doppelt = N.buendel.filter(x => x.faeden.some(fi => eigen.includes(fi)));
  console.log(kette, 'Startwerk ohne Merker:', B.monde[best].titel, '| eigene Fäden', eigen.length, '| Bündel mit diesen Fäden', doppelt.length, 'von', N.buendel.length);
  const z = B.monde.findIndex(m => m.titel.startsWith('Zentrale') || m.titel.includes('Zentrale'));
  if(z >= 0){ const e2 = N.faeden.map((f, fi) => f.von === z || f.nach === z ? fi : -1).filter(x => x >= 0); console.log('  ', B.monde[z].titel, 'eigene Fäden', e2.length, 'Bündel betroffen', N.buendel.filter(x => x.faeden.some(fi => e2.includes(fi))).length); }
}
