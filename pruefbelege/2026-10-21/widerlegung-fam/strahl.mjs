// Was liegt zwischen der Familie und ihrem Namen? Koerner im Keil +-12° um die Namensrichtung, aussen von 0.45 R bis zum Feldrand
import {readFileSync} from 'node:fs';
const D = new URL('../neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('FASKA Varianten · Vergleich'));
const Z = new Zelle(m, {ohneAufzug: true}); const W = Z.W, q = [0,0,0], O = Z.origin, R = Z.Rfinal;
const kids = W.kinder.find(k => k.length >= 90);
const tag = i => W.familie[i] || (kids.includes(i) ? 'Faecher ohne Familie' : W.art[i] === 'reihe' ? 'Kette Hauptarbeitsraum' : W.art[i]);
const P = []; for(let g = 0; g < Z.G; g++){ Z.kornPos(g, q); const x=q[0]-O[0], z=q[2]-O[2]; P.push([Math.hypot(x,z)/R, Math.atan2(z,x), tag(Z.gSeed[g])]); }
const bl = new Map(); W.familie.forEach((f, i) => { if(!f) return; const k = W.eltern[i] + ':' + f; if(!bl.has(k)) bl.set(k, {f, gl: []}); bl.get(k).gl.push(i); });
const wende = x => Math.atan2(Math.sin(x), Math.cos(x));
for(const b of bl.values()){
  let a=0, weit=-1; for(const i of b.gl){ Z.mittePos(i, q); const x=q[0]-O[0], z=q[2]-O[2], d=Math.hypot(x,z); if(d>weit){weit=d; a=Math.atan2(z,x);} }
  const kreis = {}, aussen = {}; for(const [r,t,tg] of P){ if(Math.abs(wende(t-a)) > 12/57.3) continue; (r > 0.75 ? aussen : kreis)[tg] = ((r > 0.75 ? aussen : kreis)[tg]||0)+1; }
  console.log(b.f.padEnd(20), 'Keil ±12°, Radius bis 0.75R:', JSON.stringify(kreis), '| Radius ueber 0.75R (der Ring direkt am Namen):', JSON.stringify(aussen));
}
// Gesamtzaehlung
const all = {}; for(const [,,t] of P) all[t]=(all[t]||0)+1; console.log('Alle Koerner:', JSON.stringify(all));
