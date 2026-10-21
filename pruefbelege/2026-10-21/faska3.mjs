import {readFileSync} from 'node:fs';
const D = new URL('./neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {wuchs} = await import(D + 'wuchs.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('FASKA Varianten · Vergleich'));
const W = wuchs(m); const f = W.kinder.findIndex(k => k.length >= 90);
const ordner = new Map();
for(const k of W.kinder[f]){ const l = m.samen[k].label; const mt = l.match(/\(([^)]+)\)/); const o = mt ? mt[1] : '-'; const key = (W.familie[k] || '∅') ; if(!ordner.has(o)) ordner.set(o, {}); ordner.get(o)[key] = (ordner.get(o)[key]||0)+1; }
for(const [o, v] of ordner) console.log(o.padEnd(28), JSON.stringify(v));
console.log(W.kinder[f].filter(k => W.familie[k]==='FASKA Lernpfade').map(k => m.samen[k].label));
console.log(W.kinder[f].filter(k => !W.familie[k]).slice(0,60).map(k => m.samen[k].label).join(' | '));
