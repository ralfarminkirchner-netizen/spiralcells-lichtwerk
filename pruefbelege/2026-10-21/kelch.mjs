import {readFileSync, writeFileSync} from 'node:fs';
const ver = process.argv[2], titel = process.argv[3];
const D = new URL('./' + ver + '/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith(titel));
const Z = new Zelle(m, {ohneAufzug: true}); Z.kelchK = 1; const o = [0,0,0], R = Z.Rfinal;
const pts = []; for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); pts.push([o[0], o[1], o[2], m.samen[Z.gSeed[g]].stimme]); }
const ymax = Math.max(...pts.map(p => p[1]));
console.log(ver, m.titel, 'G', Z.G, 'Höhe', ymax.toFixed(2), 'Rfinal', R.toFixed(2));
// je Höhenband (10): Körnerzahl, Winkelbedeckung (36 Fächer à 10°), mittlerer Radius
for(let b = 0; b < 10; b++){ const sel = pts.filter(p => p[1] >= b/10*ymax && p[1] < (b+1)/10*ymax + (b===9?1:0));
  const f = new Set(sel.map(p => Math.floor((((Math.atan2(p[2],p[0])*57.3)%360)+360)%360/10))); const st = {}; sel.forEach(p => st[p[3]] = (st[p[3]]||0)+1);
  const rr = sel.length ? Math.max(...sel.map(p => Math.hypot(p[0],p[2]))) : 0;
  console.log(`  Band ${b} (y ${(b/10*ymax).toFixed(2)}-${((b+1)/10*ymax).toFixed(2)}): ${String(sel.length).padStart(4)} Körner, Winkel bedeckt ${String(f.size*10).padStart(3)}°, rmax ${(rr/R).toFixed(2)}R, Stimmen ${JSON.stringify(st)}`); }
const S = 400; for(const yaw of [0, 1.05, 2.1, 3.14]){ const img = new Float32Array(S*S*3);
  const VC = [[1,0.55,0.2],[0.3,0.7,1],[0.4,1,0.5],[0.7,0.5,1],[1,0.4,0.7]];
  for(const [x,y,z,st] of pts){ const c = typeof st === 'number' ? VC[st] : [0.9,0.88,0.8], xr = x*Math.cos(yaw) + z*Math.sin(yaw);
    const u = Math.round((xr/R*0.4+0.5)*S), v = Math.round((0.9 - y/ymax*0.75)*S); if(u<0||v<0||u>=S||v>=S) continue; for(let k=0;k<3;k++) img[(v*S+u)*3+k] += 0.3*c[k]; }
  const buf = Buffer.alloc(S*S*3); for(let k=0;k<S*S*3;k++) buf[k] = Math.min(255, Math.round(255*Math.min(1,img[k])));
  writeFileSync(`kelch-${ver}-${titel.replace(/\W+/g,'_')}-${yaw}.ppm`, Buffer.concat([Buffer.from(`P6\n${S} ${S}\n255\n`), buf])); }
