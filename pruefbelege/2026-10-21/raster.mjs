import {readFileSync} from 'node:fs';
const ver = process.argv[2], titel = process.argv[3] || 'Zentrale';
const D = new URL('./' + ver + '/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith(titel));
const Z = new Zelle(m, {ohneAufzug: true}); const o = [0,0,0], R = Z.Rfinal, n = m.samen.length;
const pts = []; for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); pts.push([o[0], o[2], Z.gSeed[g]]); }
// Bedeckung
const N = 80; const occ = new Uint16Array(N*N); for(const [x,z] of pts){ const u = Math.floor((x/R*0.5+0.5)*N), v = Math.floor((z/R*0.5+0.5)*N); if(u>=0&&u<N&&v>=0&&v<N) occ[v*N+u]++; }
let inn=0, bel=0; for(let v=0;v<N;v++) for(let u=0;u<N;u++){ const x=(u+0.5)/N*2-1, z=(v+0.5)/N*2-1; if(x*x+z*z<=1){ inn++; if(occ[v*N+u]) bel++; } }
console.log(ver, m.titel, 'n', n, 'G', Z.G, 'Bedeckung', (100*bel/inn).toFixed(1)+'%');
// je Stimme: Nächster-Nachbar-Abstände (Variationskoeffizient; Gitter ~0,1, Zufall ~0,52) und Dichte ggü. Scheibe
const a0 = Math.PI*R*R/Z.G, d0 = Math.sqrt(a0);
for(const st of m.stimmen){ const P = pts.filter(p => m.samen[p[2]].stimme === st); const d = [];
  for(let i = 0; i < P.length; i++){ let b = 1e9; for(let j = 0; j < P.length; j++) if(i!==j){ const e = Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1]); if(e < b) b = e; } d.push(b); }
  const mu = d.reduce((a,b)=>a+b,0)/d.length, sd = Math.sqrt(d.reduce((a,b)=>a+(b-mu)**2,0)/d.length);
  const eng = d.filter(x => x < 0.3*d0).length;
  console.log(`  Stimme ${st}: ${P.length} Körner, NN-Abstand Mittel ${(mu/d0).toFixed(2)}·d0, CV ${(sd/mu).toFixed(2)}, Körner mit Nachbar < 0,3·d0: ${eng} (${(100*eng/P.length).toFixed(0)}%)`); }
if(Z.seedDicht){ const top = [...Z.seedDicht].map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]).slice(0,5); console.log('  dichteste Blätter', top.map(([v,i]) => `${i} St ${m.samen[i].stimme} c ${Z.seedCount[i]} dicht ${v.toFixed(1)}`).join(' | ')); }
