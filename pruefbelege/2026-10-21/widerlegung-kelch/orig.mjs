// Original-Lichtwerk (Hauptarbeitskopie, nur gelesen) auf dieselbe Testkette: deckt dort jede Höhenschicht ringsum?
import {readFileSync} from 'node:fs';
const D = 'file:///Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk/app/js/';
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith(process.argv[2] || 'Ein Inhalt'));
const Z = new Zelle(m, {ohneAufzug: true}); Z.kelchK = 1; const o = [0,0,0], R = Z.Rfinal;
console.log('alpha', (Z.S.alpha*57.2958).toFixed(2), 'kopplung', m.kopplung, 'kTop', Z.S.kTop, 'G', Z.G);
const pts = []; for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); pts.push([o[0]-Z.origin[0], o[1]-Z.origin[1], o[2]-Z.origin[2], m.samen[Z.gSeed[g]].stimme]); }
const ymax = Math.max(...pts.map(p => p[1]));
for(let b = 0; b < 10; b++){ const sel = pts.filter(p => p[1] >= b/10*ymax && p[1] < (b+1)/10*ymax + (b===9?1:0));
  const f = new Set(sel.map(p => Math.floor((((Math.atan2(p[2],p[0])*57.3)%360)+360)%360/10)));
  console.log(`  Band ${b}: ${String(sel.length).padStart(4)} Körner, Winkel ${String(f.size*10).padStart(3)}°`); }
