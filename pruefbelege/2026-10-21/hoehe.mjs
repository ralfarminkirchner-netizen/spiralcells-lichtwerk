import {readFileSync} from 'node:fs';
const D = new URL('./neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('Ein Inhalt'));
const Z = new Zelle(m, {ohneAufzug: true}); const n = m.samen.length, H = 1.3;
const bands = Array.from({length: 10}, () => ({s: 0, g: 0}));
for(let i = 0; i < n; i++){ const b = Math.min(9, Math.floor(Z.seedY[i] / H * 10)); bands[b].s++; bands[b].g += Z.seedCount[i]; }
bands.forEach((b, k) => console.log(`Band ${k}: ${b.s} Ausprägungen, ${b.g} Körner`));
const fmt = t => new Date(t).toLocaleString('de-DE', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
console.log('Zeit erste/68./69./70.:', fmt(m.samen[0].zeit), fmt(m.samen[68].zeit), fmt(m.samen[69].zeit), fmt(m.samen[70].zeit));
console.log('seedY 68/69/70', Z.seedY[68].toFixed(3), Z.seedY[69].toFixed(3), Z.seedY[70].toFixed(3), 'Körner 69/70', Z.seedCount[69], Z.seedCount[70], 'Stimme', m.samen[69].stimme, m.samen[70].stimme);
console.log('größte Ausprägungen (Körner):', [...Z.seedCount].map((c,i)=>[c,i]).sort((a,b)=>b[0]-a[0]).slice(0,6).map(([c,i])=>`${i} St${m.samen[i].stimme} ${c} y ${Z.seedY[i].toFixed(2)}`).join(' | '));
