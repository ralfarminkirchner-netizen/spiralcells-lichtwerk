import {readFileSync, writeFileSync} from 'node:fs';
const D = new URL('./neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('Ein Inhalt'));
const Z = new Zelle(m, {ohneAufzug: true}); const W = Z.W, n = m.samen.length, R = Z.Rfinal, o = [0,0,0];
const mp = []; for(let i = 0; i < n; i++){ Z.mittePos(i, o); mp.push([o[0], o[2]]); }
const S = 500, img = new Float32Array(S*S*3), put = (x,z,c,a) => { const u = Math.round((x/R*0.45+0.5)*S), v = Math.round((z/R*0.45+0.5)*S); if(u<0||v<0||u>=S||v>=S) return; for(let k=0;k<3;k++) img[(v*S+u)*3+k] += a*c[k]; };
for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); const st = m.samen[Z.gSeed[g]].stimme; put(o[0], o[2], st===0?[1,.55,.2]:st===1?[.3,.7,1]:[.4,1,.5], 0.12); }
const line = (a,b,c,al) => { for(let t=0;t<=1;t+=0.004) put(a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, c, al); };
const info = [];
for(let i = 0; i < n; i++){ const p = W.eltern[i]; if(W.art[i] === 'frei') continue; const a = p >= 0 ? mp[p] : [0,0];
  const len = Math.hypot(a[0]-mp[i][0], a[1]-mp[i][1]); const al = W.art[i]==='gabel'?0.9:0.5; line(a, mp[i], W.wechsel[i]?[1,0,1]:[1,1,1], al);
  if(len > 0.2*R) info.push(`Stiel ${i}<-${p} ${W.art[i]}${W.wechsel[i]?' WECHSEL':''} Stimme ${m.samen[i].stimme}<-${p>=0?m.samen[p].stimme:'Keim'} Länge ${(len/R).toFixed(2)}R th0 ${(W.th0[i]*57.3).toFixed(0)}° th1 ${(W.th1[i]*57.3).toFixed(0)}°`); }
for(const [i,j] of W.lese){ line(mp[i], mp[j], [1,1,0], 0.4); }
console.log(info.join('\n')); console.log('Gegenlese-Fäden', W.lese.length);
console.log('Wechsel-Kinder', [...W.wechsel.keys()].filter(i=>W.wechsel[i]).map(i=>`${i}(${m.samen[i].stimme}<-${m.samen[W.eltern[i]].stimme}, ${W.art[i]}, th0 ${(W.th0[i]*57.3).toFixed(0)}° th1 ${(W.th1[i]*57.3).toFixed(0)}°, Körner ${Z.seedCount[i]})`).join(' '));
const buf = Buffer.alloc(S*S*3); for(let k=0;k<S*S*3;k++) buf[k] = Math.min(255, Math.round(255*Math.min(1,img[k])));
writeFileSync('linien-ein.ppm', Buffer.concat([Buffer.from(`P6\n${S} ${S}\n255\n`), buf]));
