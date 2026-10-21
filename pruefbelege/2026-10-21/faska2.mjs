import {readFileSync} from 'node:fs';
const D = new URL('./neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('FASKA Varianten · Vergleich'));
const Z = new Zelle(m, {ohneAufzug: true}); const W = Z.W, o = [0,0,0], R = Z.Rfinal, n = m.samen.length;
const ang = (x,z) => (((Math.atan2(z,x)*57.2958)%360)+360)%360;
const f = W.kinder.findIndex(k => k.length >= 90), kids = W.kinder[f];
console.log('Fächer-Eltern', f, m.samen[f].label, 'Kinder', kids.length, 'th1 Spanne', (Math.min(...kids.map(k=>W.th1[k]))*57.3).toFixed(0), (Math.max(...kids.map(k=>W.th1[k]))*57.3).toFixed(0), 'Sektoren', JSON.stringify([...W.sektoren].map(([k,s])=>[k,(s.mitte*57.3).toFixed(0),(s.breite*57.3).toFixed(0)])));
// Körner nach Winkel (Bildlage mit Krümmung) je Block
const blocks = {}; for(let g = 0; g < Z.G; g++){ const i = Z.gSeed[g]; Z.kornPos(g, o); const a = Math.floor(ang(o[0], o[2])/30)*30; const b = kids.includes(i) ? (W.familie[i] || 'Fächer ohne Familie') : W.art[i] === 'reihe' ? 'Kette Hauptarbeitsraum' : W.art[i]; blocks[a] = blocks[a] || {}; blocks[a][b] = (blocks[a][b]||0)+1; }
for(const a of Object.keys(blocks).sort((x,y)=>x-y)) console.log(String(a).padStart(3)+'°', JSON.stringify(blocks[a]));
console.log('Wurzeln', W.wurzeln.map(r => `${r} ${W.art[r]} ${m.samen[r].label} Kinder ${W.kinder[r].length}`).join(' | '));
