// Draufsicht der Zelle "Ein Inhalt": Körner nach Stimme, Stiele (weiß, Wechsel magenta), Fäden (cyan), Gegenlese (gelb).
// Helligkeit der Linien proportional zu ihrem Alpha im Code (Summe über Punkte), damit man sieht, was im Bild überhaupt sichtbar sein kann.
import {readFileSync, writeFileSync} from 'node:fs';
const ver = process.argv[2] || 'neu', rot = +(process.argv[3] || 0) * Math.PI / 180;
const D = new URL('../' + ver + '/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('Ein Inhalt'));
const Z = new Zelle(m, {ohneAufzug: true}); Z.S.rot = rot; const W = Z.W, n = m.samen.length, R = Z.Rfinal, o = [0,0,0];
const mp = []; for(let i = 0; i < n; i++){ Z.mittePos(i, o); mp.push([o[0], o[1], o[2]]); }
const S = 600, img = new Float32Array(S*S*3), put = (x,z,c,a) => { const u = Math.round((x/R*0.45+0.5)*S), v = Math.round((z/R*0.45+0.5)*S); if(u<0||v<0||u>=S||v>=S) return; for(let k=0;k<3;k++) img[(v*S+u)*3+k] += a*c[k]; };
const VC = [[1,.55,.2],[.3,.7,1],[.4,1,.5]];
for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); const st = m.samen[Z.gSeed[g]].stimme; put(o[0], o[2], VC[st] || [.6,.6,.6], 1.0); }
// Linien wie im Code: k Punkte zwischen den Enden (ohne Enden)
const punkte = (a, b, k, c, al) => { for(let s = 1; s < k; s++){ const t = s / k; const x = a[0]+(b[0]-a[0])*t, z = a[2]+(b[2]-a[2])*t;
  put(x, z, c, al*4); } };
const out = {stiele: [], faeden: [], lese: []};
const pk = Math.max(6, Math.min(40, Math.floor(6000 / n)));
for(let i = 0; i < n; i++){ const art = W.art[i], p = W.eltern[i]; if(art === 'frei') continue;
  const a = p >= 0 ? mp[p] : [0,0,0], b = mp[i], d = Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
  const basis = art === 'reihe' ? 0.045 : art === 'gabel' || art === 'form' ? 0.2 : 0.13, k = Math.max(2, Math.min(art === 'reihe' ? 8 : pk, Math.round(d * 160)));
  punkte(a, b, k, W.wechsel && W.wechsel[i] ? [1,0,1] : [1,1,1], basis);
  out.stiele.push({i, p, art, wechsel: W.wechsel ? W.wechsel[i] : 0, len: +(Math.hypot(a[0]-b[0], a[2]-b[2])/R).toFixed(2), alpha: basis, punkte: k - 1, a: a.map(v=>+v.toFixed(3)), b: b.map(v=>+v.toFixed(3))}); }
const idx = new Map(m.samen.map((s, i) => [s.id, i])), keim = new Set(m.keim.map(v => v.id));
for(const f of m.faeden){ const a = idx.has(f.von) ? idx.get(f.von) : keim.has(f.von) ? -2 : -1, b = idx.has(f.nach) ? idx.get(f.nach) : keim.has(f.nach) ? -2 : -1; if(a === -1 || b === -1) continue;
  const A = a >= 0 ? mp[a] : [0,0,0], Bp = b >= 0 ? mp[b] : [0,0,0], base = f.form ? 0.14 : 0.05 + 0.45 * f.beleg;
  const d = Math.hypot(A[0]-Bp[0], A[2]-Bp[2]), k = Math.max(8, Math.min(48, Math.round(d * 90)));
  punkte(A, Bp, k, [0,1,1], base); out.faeden.push({a, b, typ: f.typ, urteil: f.urteil, beleg: f.beleg, alpha: +base.toFixed(3), len: +(d/R).toFixed(2), punkte: k - 1}); }
for(const [i, j] of W.lese){ const A = mp[i], Bp = mp[j], d = Math.hypot(A[0]-Bp[0], A[2]-Bp[2]); punkte(A, Bp, 36, [1,1,0], 0.035); out.lese.push({i, j, len: +(d/R).toFixed(2)}); }
const buf = Buffer.alloc(S*S*3); for(let k=0;k<S*S*3;k++) buf[k] = Math.min(255, Math.round(255*Math.min(1,img[k])));
writeFileSync(new URL(`./teile2-${ver}-${process.argv[3]||0}.ppm`, import.meta.url), Buffer.concat([Buffer.from(`P6\n${S} ${S}\n255\n`), buf]));
const fmt = o => JSON.stringify(o);
console.log(ver, 'n', n, 'G', Z.G, 'R', R.toFixed(3), 'Punkte je Stiel max', pk);
console.log('Stiele länger als 0,3R:'); out.stiele.filter(s => s.len > 0.3).forEach(s => console.log(' ', fmt(s)));
const fl = out.faeden.map(f => f.len); console.log('Fäden', fl.length, 'mittel', (fl.reduce((a,b)=>a+b,0)/fl.length).toFixed(2), '>0,6R', fl.filter(x=>x>0.6).length, 'max', Math.max(...fl));
console.log('Fäden-Alpha-Verteilung', JSON.stringify(out.faeden.reduce((a, f) => (a[f.alpha] = (a[f.alpha]||0)+1, a), {})));
console.log('lange Fäden (>0,6R):'); out.faeden.filter(f => f.len > 0.6).forEach(f => console.log(' ', fmt(f)));
const ll = out.lese.map(f => f.len); console.log('Gegenlese', ll.length, 'mittel', (ll.reduce((a,b)=>a+b,0)/ll.length).toFixed(2));
// Keim markieren
for(let du=-3; du<=3; du++) for(let dv=-3; dv<=3; dv++){ const u = S/2+du, v = S/2+dv; img[(v*S+u)*3]=1; img[(v*S+u)*3+1]=1; img[(v*S+u)*3+2]=1; }
const buf2 = Buffer.alloc(S*S*3); for(let k=0;k<S*S*3;k++) buf2[k] = Math.min(255, Math.round(255*Math.min(1,img[k])));
writeFileSync(new URL(`./teile2-${ver}-${process.argv[3]||0}.ppm`, import.meta.url), Buffer.concat([Buffer.from(`P6\n${S} ${S}\n255\n`), buf2]));
