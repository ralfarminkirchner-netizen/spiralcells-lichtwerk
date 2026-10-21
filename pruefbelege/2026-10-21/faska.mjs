import {readFileSync, writeFileSync} from 'node:fs';
const ver = process.argv[2];
const D = new URL('./' + ver + '/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('FASKA Varianten · Vergleich'));
const Z = new Zelle(m, {ohneAufzug: true}); const W = Z.W, o = [0,0,0], R = Z.Rfinal, n = m.samen.length;
console.log(ver, m.titel, 'n', n, 'G', Z.G, 'traum', m.traumfeld, 'curl', Z.curl.toFixed(2));
const pts = []; for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); pts.push([o[0], o[2], Z.gSeed[g]]); }
const ang = (x,z) => (((Math.atan2(z,x)*57.2958)%360)+360)%360;
const bins = new Array(36).fill(0); for(const [x,z] of pts) bins[Math.floor(ang(x,z)/10)]++;
console.log('Körner je 10° (0..350):', bins.join(' '));
console.log('leere 10°-Fächer:', bins.filter(b => b === 0).length, 'Fächer < 1% der Körner:', bins.filter(b => b < Z.G*0.01).length);
// Kette (Hauptarbeitsraum): wie viele Ausprägungen auf genau einem Winkel
const th = new Map(); for(let i = 0; i < n; i++){ const k = (W.th1[i]*57.2958).toFixed(2); th.set(k, (th.get(k)||0)+1); }
const top = [...th].sort((a,b)=>b[1]-a[1]).slice(0,3); console.log('häufigste th1-Winkel (Grad: Ausprägungen):', JSON.stringify(top));
let kk = 0; for(let i = 0; i < n; i++) if((W.th1[i]*57.2958).toFixed(2) === top[0][0]) kk += Z.seedCount[i]; console.log('Körner auf diesem einen Winkel', kk, 'von', Z.G);
// Familien: Winkelbereich der Glieder und Anzahl
if(W.familie){ const fam = new Map(); for(let i = 0; i < n; i++){ const f = W.familie[i]; if(!f) continue; if(!fam.has(f)) fam.set(f, []); fam.get(f).push(i); }
  for(const [f, gl] of fam){ const a = gl.map(i => { Z.mittePos(i, o); return [ang(o[0], o[2]), Math.hypot(o[0], o[2])/R]; });
    console.log(`  Familie ${f}: ${gl.length} Glieder, Mitten-Winkel ${Math.min(...a.map(x=>x[0])).toFixed(0)}°–${Math.max(...a.map(x=>x[0])).toFixed(0)}°, Radius ${Math.min(...a.map(x=>x[1])).toFixed(2)}–${Math.max(...a.map(x=>x[1])).toFixed(2)}R`); }
  const ohne = []; for(let i = 0; i < n; i++) if(W.art[i]==='reihe' && !W.familie[i] && W.kinder[W.eltern[i]]?.length > 20) ohne.push(m.samen[i].label); console.log('  im Fächer ohne Familie:', ohne.length, ohne.slice(0,8).join(' | '));
  // Feldradius (äußerstes Korn) gegen Abstand der äußersten Familienmitte
  let feld = 0; for(const [x,z] of pts) feld = Math.max(feld, Math.hypot(x,z)); console.log('  äußerstes Korn', (feld/R).toFixed(2)+'R');
}
const S = 400, img = new Float32Array(S*S); for(const [x,z] of pts){ const u = Math.round((x/R*0.45+0.5)*S), v = Math.round((z/R*0.45+0.5)*S); if(u>=0&&v>=0&&u<S&&v<S) img[v*S+u] += 0.35; }
const buf = Buffer.alloc(S*S*3); for(let k=0;k<S*S;k++){ const c = Math.min(255, Math.round(255*Math.min(1,img[k]))); buf[k*3]=buf[k*3+1]=buf[k*3+2]=c; }
writeFileSync(`faska-${ver}.ppm`, Buffer.concat([Buffer.from(`P6\n${S} ${S}\n255\n`), buf]));
