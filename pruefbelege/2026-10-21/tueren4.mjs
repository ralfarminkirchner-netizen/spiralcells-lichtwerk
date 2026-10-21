import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
N.tueren = [{name:'KiN OS'},{name:'Zentrale'},{name:'KiNFORMER'},{name:'KiN'},{name:'Werkraum'}].slice(0, 4);
console.log('Mitte R', N.L.mitte.R.toFixed(2), 'Dächer', N.daecher.map(d => `${d.name}@(${d.mitte[0].toFixed(1)},${d.mitte[2].toFixed(1)}) R${d.R.toFixed(1)}`).join(' | '));
const o = [0, 0, 0];
for(let i = 0; i < N.tueren.length; i++){ N.tuerPos(i, o); let drin = [];
  for(const k of N.kreise.slice(1)){ const d = Math.hypot(o[0] - k.x, o[2] - k.z); if(d < k.R) drin.push(d.toFixed(1) + '<' + k.R.toFixed(1)); }
  let naechstesWerk = Infinity; for(let j = 0; j < N.N; j++){ if(N.bezirk(j) === 'mitte') continue; naechstesWerk = Math.min(naechstesWerk, Math.hypot(o[0] - N.pos[j][0], o[2] - N.pos[j][2]) - N.rM[j]); }
  console.log(N.tueren[i].name, 'bei', o.map(x => x.toFixed(1)).join(','), 'Abstand Mitte', Math.hypot(o[0], o[2]).toFixed(1), 'in fremdem Bezirk:', drin.join(' ') || 'nein', 'nächstes fremdes Werk', naechstesWerk.toFixed(1)); }
