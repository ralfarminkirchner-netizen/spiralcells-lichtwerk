import {readFileSync} from 'node:fs';
for(const ver of ['alt', 'neu']){
const D = new URL('./' + ver + '/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('Ein Inhalt'));
const Z = new Zelle(m, {ohneAufzug: true}); const W = Z.W, R = Z.Rfinal, o = [0,0,0];
const mp = i => { Z.mittePos(i, o); return [o[0], o[2]]; };
const dist = (p, a, b) => { const vx = b[0]-a[0], vz = b[1]-a[1], t = Math.max(0, Math.min(1, ((p[0]-a[0])*vx + (p[1]-a[1])*vz)/(vx*vx+vz*vz||1))); return Math.hypot(a[0]+t*vx-p[0], a[1]+t*vz-p[1]); };
const L = W.lese.map(([i,j]) => { const a = mp(i), b = mp(j); return {len: Math.hypot(a[0]-b[0], a[1]-b[1])/R, mitte: dist([0,0], a, b)/R}; });
const st = []; for(let i = 0; i < W.n; i++){ const p = W.eltern[i]; if(W.art[i]==='frei') continue; const a = p>=0?mp(p):[0,0], b = mp(i); st.push({len: Math.hypot(a[0]-b[0],a[1]-b[1])/R, mitte: dist([0,0],a,b)/R, p}); }
console.log(ver, 'Gegenlese', L.length, 'mittlere Länge', (L.reduce((a,x)=>a+x.len,0)/L.length).toFixed(2)+'R', 'länger als 0,8R:', L.filter(x=>x.len>0.8).length, 'nah am Keim (<0,15R) vorbei:', L.filter(x=>x.mitte<0.15).length,
  '| Stiele (ohne Keimstiele) länger als 0,35R:', st.filter(x=>x.p>=0 && x.len>0.35).length);
}
