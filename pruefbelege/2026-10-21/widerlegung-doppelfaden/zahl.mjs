import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
let betroffen = 0, werke = 0;
for(let a = 0; a < N.N; a++){ if(N.baum.material.has(a)) continue; werke++; if(N.faeden.some(f => (f.von === a || f.nach === a) && f.bzVon !== f.bzNach)) betroffen++; }
console.log('Werke (ohne Lesematerial)', werke, 'davon mit Faden über eine Bezirksgrenze', betroffen);
