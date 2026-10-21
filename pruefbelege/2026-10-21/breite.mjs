import {readFileSync} from 'node:fs';
const D = new URL('./neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle, NMAX, RC} = await import(D + 'zelle.js'); const {rangRadien} = await import(D + 'wuchs.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state);
for(const t of ['Zentrale', 'Ein Inhalt']){ const m = B.monde.find(m => m.titel.startsWith(t)); const Z = new Zelle(m, {ohneAufzug: true}), W = Z.W, n = m.samen.length, G = Z.G, Rf = Z.Rfinal;
  const weg = new Float64Array(G); for(let i = 0; i < n; i++) for(let j = 0; j < Z.seedCount[i]; j++) weg[Z.seedFirst[i] + j] = W.s0[i] + j + 0.5;
  const rr = rangRadien(weg), a0 = Math.PI*Rf*Rf/G; let durchBogen = 0, kB = 0, durchFl = 0, kF = 0;
  for(let i = 0; i < n; i++){ const f = Z.seedFirst[i], c = Z.seedCount[i]; let lo = 1, hi = 0, mi = 0; for(let k = f; k < f+c; k++){ lo = Math.min(lo, rr[k]); hi = Math.max(hi, rr[k]); mi += rr[k]; } mi /= c;
    const R = Rf*mi, fl = c*a0/(2*Rf*Math.max(hi-lo,1e-3)), bo = 0.5*W.spann[i]*R; if(bo < fl){ durchBogen++; kB += c; } else { durchFl++; kF += c; } }
  console.log(t, 'Blätter durch halben Fächerbogen begrenzt:', durchBogen, `(${kB} Körner)`, '| flächentreu:', durchFl, `(${kF} Körner)`, 'von G', G); }
