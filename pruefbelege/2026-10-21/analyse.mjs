// nur lesend: baut Zellen mit altem/neuem Code gegen die Testkopie und misst Lage, Kreuzungen, Leere
import {readFileSync, writeFileSync} from 'node:fs';
const ver = process.argv[2] || 'neu', titel = process.argv[3] || 'Ein Inhalt', kette = process.argv[4] || 'kette-gewebe';
const D = new URL('./' + ver + '/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js');
const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/' + kette + '/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith(titel));
const Z = new Zelle(m, {ohneAufzug: true}); const W = Z.W, n = m.samen.length;
const kelch = +(process.argv[5] || 0); Z.kelchK = kelch;
const o = [0,0,0], pts = [];
for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); pts.push([o[0], o[1], o[2], Z.gSeed[g]]); }
const mp = []; for(let i = 0; i < n; i++){ Z.mittePos(i, o); mp.push([o[0], o[1], o[2]]); }
const R = Z.Rfinal, deg = 180/Math.PI;
// Winkelverteilung nach Stimme (12 Sektoren à 30°)
const bins = Array.from({length: 12}, () => ({}));
for(const [x,,z,i] of pts){ const a = ((Math.atan2(z, x)*deg)%360+360)%360, b = Math.floor(a/30), st = String(m.samen[i].stimme); bins[b][st] = (bins[b][st]||0)+1; }
console.log(ver, m.titel, 'G', Z.G, 'Rfinal', R.toFixed(3), 'kelchK', kelch);
console.log('Körner je 30°-Sektor (Stimme:Anzahl):'); bins.forEach((b, k) => console.log('  ', String(k*30).padStart(3), JSON.stringify(b)));
// Bedeckung: Raster 60x60 über die Scheibe, Anteil belegter Zellen innerhalb Rfinal
const N = 60, occ = new Uint16Array(N*N); let inn = 0, bel = 0;
for(const [x,,z] of pts){ const u = Math.floor((x/R*0.5+0.5)*N), v = Math.floor((z/R*0.5+0.5)*N); if(u>=0&&u<N&&v>=0&&v<N) occ[v*N+u]++; }
let maxc = 0; for(let v=0; v<N; v++) for(let u=0; u<N; u++){ const x=(u+0.5)/N*2-1, z=(v+0.5)/N*2-1; if(x*x+z*z<=1){ inn++; if(occ[v*N+u]) bel++; maxc=Math.max(maxc,occ[v*N+u]); } }
console.log('Bedeckung der Scheibe', (100*bel/inn).toFixed(1)+'%', 'max Körner je Rasterzelle', maxc, 'Mittel bei Gleichverteilung', (Z.G/inn).toFixed(1));
// Stiele: Strecken Eltern-Mitte -> Kind-Mitte in der Draufsicht (x,z); Kreuzungen zählen
const segs = [];
for(let i = 0; i < n; i++){ const p = W.eltern[i]; if(W.art[i] === 'frei') continue; const a = p >= 0 ? mp[p] : [0,0,0], b = mp[i]; segs.push({i, p, a:[a[0],a[2]], b:[b[0],b[2]], art: W.art[i], wechsel: W.wechsel ? W.wechsel[i] : 0, len: Math.hypot(a[0]-b[0], a[2]-b[2])}); }
const X = (p,q,r,s) => { const d = (q[0]-p[0])*(s[1]-r[1]) - (q[1]-p[1])*(s[0]-r[0]); if(Math.abs(d) < 1e-12) return false; const t = ((r[0]-p[0])*(s[1]-r[1]) - (r[1]-p[1])*(s[0]-r[0]))/d, u = ((r[0]-p[0])*(q[1]-p[1]) - (r[1]-p[1])*(q[0]-p[0]))/d; return t>0.02&&t<0.98&&u>0.02&&u<0.98; };
let kreuz = 0; const kl = [];
for(let a = 0; a < segs.length; a++) for(let b = a+1; b < segs.length; b++) if(X(segs[a].a, segs[a].b, segs[b].a, segs[b].b)){ kreuz++; kl.push([segs[a].i, segs[b].i]); }
console.log('Stiele', segs.length, 'Kreuzungen von Stielen', kreuz);
const lang = segs.filter(s => s.len > 0.3*R).sort((x,y) => y.len-x.len);
console.log('lange Stiele (> 0,3·Rfinal):', lang.length, lang.slice(0,10).map(s => `${s.i}<-${s.p} ${s.art}${s.wechsel?' wechsel':''} st ${m.samen[s.i].stimme}<-${s.p>=0?m.samen[s.p].stimme:'K'} len ${(s.len/R).toFixed(2)}R`).join(' | '));
// Stiele, die durch fremde Blätter laufen: Anteil der Stielpunkte, die näher als 0,02 an Körnern einer anderen Stimme liegen
let durch = 0, ges = 0;
for(const s of segs){ if(s.len < 0.15*R) continue; const st = m.samen[s.i].stimme; for(let t = 0.1; t < 0.9; t += 0.1){ const x = s.a[0]+(s.b[0]-s.a[0])*t, z = s.a[1]+(s.b[1]-s.a[1])*t; ges++; if(pts.some(([px,,pz,pi]) => m.samen[pi].stimme !== st && Math.hypot(px-x,pz-z) < 0.02)) durch++; } }
console.log('Punkte langer Stiele über fremden Blättern', durch, 'von', ges);
if(Z.seedDicht) console.log('seedDicht max', Math.max(...Z.seedDicht).toFixed(1), 'seedDichtK max', Math.max(...Z.seedDichtK).toFixed(1));
// Bild: Draufsicht (x,z) bzw. Seitenansicht, additiv, PPM
const S = 400, img = new Float32Array(S*S*3);
const yaw = +(process.argv[6] || 0);
const VC = [[1,0.55,0.2],[0.3,0.7,1],[0.4,1,0.5],[0.7,0.5,1],[1,0.4,0.7]];
for(const [x,y,z,i] of pts){ const st = m.samen[i].stimme, c = typeof st === 'number' ? VC[st] : [0.9,0.88,0.8];
  let u, v; if(kelch < 0.5){ u = (x/R*0.45+0.5)*S; v = (z/R*0.45+0.5)*S; } else { const xr = x*Math.cos(yaw) - z*Math.sin(yaw); u = (xr/R*0.45+0.5)*S; v = (1 - (y/1.4)*0.8 - 0.1)*S; }
  const ui = Math.round(u), vi = Math.round(v); if(ui<0||vi<0||ui>=S||vi>=S) continue; for(let k=0;k<3;k++) img[(vi*S+ui)*3+k] += 0.35*c[k]; }
// Stiele grau
for(const s of segs){ for(let t=0;t<=1;t+=0.01){ let u,v; if(kelch<0.5){ u=((s.a[0]+(s.b[0]-s.a[0])*t)/R*0.45+0.5)*S; v=((s.a[1]+(s.b[1]-s.a[1])*t)/R*0.45+0.5)*S; } else continue; const ui=Math.round(u), vi=Math.round(v); if(ui<0||vi<0||ui>=S||vi>=S) continue; for(let k=0;k<3;k++) img[(vi*S+ui)*3+k] += 0.08; } }
let ppm = `P6\n${S} ${S}\n255\n`; const buf = Buffer.alloc(S*S*3); for(let k=0;k<S*S*3;k++) buf[k] = Math.min(255, Math.round(255*Math.min(1,img[k])));
writeFileSync(`bild-${ver}-${titel.replace(/\W+/g,'_')}-${kelch}.ppm`, Buffer.concat([Buffer.from(ppm), buf]));
