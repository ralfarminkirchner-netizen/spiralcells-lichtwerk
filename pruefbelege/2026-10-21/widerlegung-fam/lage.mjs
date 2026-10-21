// Nachrechnung familienNamen() (haupt.js:62-77) in Draufsicht (Modell x,z), Stand 35c59bc
import {readFileSync} from 'node:fs';
const D = new URL('../neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('FASKA Varianten · Vergleich'));
const Z = new Zelle(m, {ohneAufzug: true}); const W = Z.W, q = [0,0,0], O = Z.origin, R = Z.Rfinal;
console.log('traum', Z.traum, 'frozen', Z.S.frozen, 'lk', Z.S.lk, 'G', Z.G, 'n', W.n, 'Rfinal', R.toFixed(3), 'curl', Z.curl);
const rel = p => [p[0]-O[0], p[2]-O[2]];
// Feld wie im Code: jedes 7. Korn
let feld = 0, feldG = -1; for(let g = 0; g < Z.G; g += 7){ Z.kornPos(g, q); const [x,z] = rel(q); const d = Math.hypot(x,z); if(d > feld){ feld = d; feldG = g; } }
const iF = Z.gSeed[feldG]; console.log('Feldradius', (feld/R).toFixed(3), 'R; aeusserstes Korn gehoert zu', iF, W.art[iF], JSON.stringify(m.samen[iF].label));
// Bloecke wie im Code
const bl = new Map(); W.familie.forEach((f, i) => { if(!f) return; const k = W.eltern[i] + ':' + f; if(!bl.has(k)) bl.set(k, {f, gl: []}); bl.get(k).gl.push(i); });
// Etikett fuer jedes Korn: Familie, sonst Art
const kids = W.kinder.find(k => k.length >= 90);
const tag = i => W.familie[i] || (kids.includes(i) ? 'Faecher ohne Familie' : W.art[i] === 'reihe' ? 'Kette Hauptarbeitsraum' : W.art[i]);
const P = []; for(let g = 0; g < Z.G; g++){ Z.kornPos(g, q); P.push([...rel(q), tag(Z.gSeed[g])]); }
for(const b of bl.values()){
  let ux=0, uz=0, weit=-1, rs=[];
  for(const i of b.gl){ Z.mittePos(i, q); const [x,z] = rel(q); const d = Math.hypot(x,z)||1; rs.push(d/R); if(d > weit){ weit = d; ux = x/d; uz = z/d; } }
  // Namensstelle: feld + ~14px; 14px entsprechen bei feld ~ 160px etwa 0.09 feld
  const L = [ux*feld*1.09, uz*feld*1.09];
  // naechste Koerner der eigenen Familie und Zusammensetzung der Koerner im Umkreis 0.35 R um die Namensstelle
  let eigen = Infinity; const um = {}; for(const [x,z,t] of P){ const d = Math.hypot(x-L[0], z-L[1]); if(t === b.f) eigen = Math.min(eigen, d); if(d < 0.35*R) um[t] = (um[t]||0)+1; }
  const ang = ((Math.atan2(uz,ux)*57.2958)+360)%360;
  console.log(b.f.padEnd(20), 'Glieder', String(b.gl.length).padStart(3), 'Mitten-Radien', Math.min(...rs).toFixed(2)+'-'+Math.max(...rs).toFixed(2), 'R; Richtung', ang.toFixed(0)+'°', '; Abstand Name -> naechstes eigenes Korn', (eigen/R).toFixed(2), 'R =', (eigen/feld*160).toFixed(0), 'px (bei feld=160px); Koerner im Umkreis 0.35R:', JSON.stringify(um));
}
