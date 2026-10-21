import {readFileSync} from 'node:fs';
const D = new URL('./neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {wuchs} = await import(D + 'wuchs.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('Ein Inhalt')), W = wuchs(m, {masse: m.samen.map(() => 30)});
console.log('Sektoren', JSON.stringify([...W.sektoren].map(([k,s]) => [k, +(s.mitte*57.3).toFixed(0), +(s.breite*57.3).toFixed(0)])));
const sp = [...W.spann].map(x => x*57.3); sp.sort((a,b)=>a-b); console.log('Fächerspanne je Blatt (Grad) Median', sp[sp.length>>1].toFixed(0), 'Min', sp[0].toFixed(0), 'Max', sp[sp.length-1].toFixed(0));
console.log('Gruppen-Startknoten', JSON.stringify([...W.sektoren.keys()].map(k => [k, [...Array(W.n).keys()].filter(i => (W.eltern[i] < 0 || W.wechsel[i]) && (typeof m.samen[i].stimme === 'number' ? m.samen[i].stimme : m.samen[i].stimme) === k).length])));
