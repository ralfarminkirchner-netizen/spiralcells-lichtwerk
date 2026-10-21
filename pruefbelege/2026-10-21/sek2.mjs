import {readFileSync} from 'node:fs';
const D = new URL('./neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state);
for(const t of ['Ein Inhalt', 'Zentrale']){ const m = B.monde.find(m => m.titel.startsWith(t)), Z = new Zelle(m, {ohneAufzug: true}), W = Z.W;
console.log(t, 'Sektoren (Stimme, Mitte°, Breite°)', JSON.stringify([...W.sektoren].map(([k,s]) => [k, +(s.mitte*57.3).toFixed(0), +(s.breite*57.3).toFixed(0)])), 'Summe', [...W.sektoren.values()].reduce((a,s)=>a+s.breite*57.3,0).toFixed(0)+'°');
let kg = 0, ks = 0; for(let i = 0; i < W.n; i++){ kg += Z.seedCount[i]; ks += Z.seedCount[i] * W.spann[i] * 57.3; } console.log('  körnergewichtete mittlere Fächerspanne', (ks/kg).toFixed(0)+'°'); }
