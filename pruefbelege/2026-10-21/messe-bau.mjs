// Nur lesend: Kosten des Neubaus nach jedem Auffrischen (bestand + Netz), alte gegen neue Fassung von netz.js
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand} = await import(ROOT + '/app/js/daten.js');
const {Netz} = await import(ROOT + '/app/js/netz.js');
const roh = readFileSync(`${ROOT}/testdaten/kette-gewebe/state.json`, 'utf8'), O = JSON.parse(readFileSync(`${ROOT}/app/ordnung.json`, 'utf8'));
const z = fn => { for(let i = 0; i < 3; i++) fn(); const c = []; for(let i = 0; i < 15; i++){ const t = performance.now(); fn(); c.push(performance.now() - t); } c.sort((a, b) => a - b); return c[7].toFixed(1) + ' ms'; };
let B; console.log('JSON.parse+bestand', z(() => { B = bestand(JSON.parse(roh)); }));
console.log('new Netz', z(() => new Netz(B, O)));
