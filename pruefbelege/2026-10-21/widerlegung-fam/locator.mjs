import {readFileSync} from 'node:fs';
const D = new URL('../neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {wuchs} = await import(D + 'wuchs.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('FASKA Varianten · Vergleich'));
const W = wuchs(m); const f = W.kinder.findIndex(k => k.length >= 90);
const s = m.samen[W.kinder[f][0]]; console.log('Felder eines Samens:', Object.keys(s).join(','));
const ohne = W.kinder[f].filter(k => !W.familie[k]);
for(const k of ohne.slice(0,12)){ const x = m.samen[k]; console.log(JSON.stringify(x.label), '|', JSON.stringify(x.locator || x.ort || x.quelle || x.pfad || '').slice(0,120)); }
