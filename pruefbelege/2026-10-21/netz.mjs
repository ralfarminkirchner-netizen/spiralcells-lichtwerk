import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const {Netz} = await import(R + 'app/js/netz.js');
const ank = await import(R + 'app/js/ankunft.js');
const welche = process.argv[2] || 'kette-gewebe';
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + welche + '/state.json', 'utf8')));
const O = JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8'));
const N = new Netz(B, O);
const bn = b => b === 'mitte' ? 'Zentrale' : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
console.log('Faeden', N.faeden.length, 'Buendel', N.buendel.length);
for(const x of N.buendel){
  console.log(`BUENDEL ${bn(x.von)} -> ${bn(x.nach)} typ=${x.typ} kanten=${x.kanten} typen=${JSON.stringify([...x.typen])} faeden=${x.faeden.length}`);
  for(const fi of x.faeden){ const f = N.faeden[fi]; console.log(`   faden ${fi}: ${B.monde[f.von].titel} -> ${B.monde[f.nach].titel} [${f.typ}] k=${f.kanten.length}`); }
}
console.log('INNEN', [...N.innen].map(([b, n]) => bn(b) + ':' + n));
for(let j = 0; j < N.daecher.length; j++){ const d = N.daecher[j]; const n = d.bereiche.reduce((a, x) => a + x.werke.length, 0);
  const ws = N.werkeIn(j).filter(i => !N.baum.material.has(i) && !B.monde[i].samen.length);
  console.log(`DACH ${d.name}: ${n} Werke, Knospen ${N.knospenIn(j)}:`, ws.map(i => `${B.monde[i].titel} (keim ${B.monde[i].keim.length}, fassungen ${B.roh.variants.filter(v => B.werkVon(v.id) === B.monde[i].id).length})`).join('; '));
}
// juengst und zuletzt
const z = ank.letzte(B); console.log('ZULETZT', z.map(e => e.titel + ' @' + e.wann));
const zm = new Set(z.map(e => e.mondId));
for(const id of zm){ const i = B.monde.findIndex(m => m.id === id); console.log('  zuletzt-Werk', B.monde[i].titel, 'bezirk', bn(N.bezirk(i)), 'juengst?', N.juengst.has(i), 'material?', N.baum.material.has(i)); }
console.log('JUENGST', [...N.juengst].map(i => bn(N.bezirk(i)) + ': ' + B.monde[i].titel + ' ' + new Date(B.monde[i].zeitspanne[1]).toISOString()));
