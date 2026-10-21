import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const {Netz} = await import(R + 'app/js/netz.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8')));
const w = N.werkeIn('mitte'); console.log('werkeIn(mitte)', w.length, w.map(i => B.monde[i].titel + (N.baum.material.has(i) ? ' [Lesematerial]' : '')).join(' | '));
console.log('ohne', N.werkeIn('ohne').length, N.baum.ohne.length);
