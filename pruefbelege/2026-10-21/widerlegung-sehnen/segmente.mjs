import {readFileSync, writeFileSync} from 'node:fs';
const ver = process.argv[2] || 'neu';
const D = new URL('../' + ver + '/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith('Ein Inhalt'));
const Z = new Zelle(m, {ohneAufzug: true}); const W = Z.W, n = m.samen.length, R = Z.Rfinal, o = [0,0,0];
const mp = []; for(let i = 0; i < n; i++){ Z.mittePos(i, o); mp.push([o[0], o[1], o[2]]); }
const seg = [];
for(let i = 0; i < n; i++){ const art = W.art[i], p = W.eltern[i]; if(art === 'frei') continue; const a = p >= 0 ? mp[p] : [0,0,0];
  const basis = art === 'reihe' ? 0.045 : art === 'gabel' || art === 'form' ? 0.2 : 0.13;
  seg.push({t: W.wechsel && W.wechsel[i] ? 'wechsel' : 'stiel', i, p, a, b: mp[i], al: basis, lift: 0}); }
const idx = new Map(m.samen.map((s, i) => [s.id, i])), keim = new Set(m.keim.map(v => v.id));
for(const f of m.faeden){ const a = idx.has(f.von) ? idx.get(f.von) : keim.has(f.von) ? -2 : -1, b = idx.has(f.nach) ? idx.get(f.nach) : keim.has(f.nach) ? -2 : -1; if(a === -1 || b === -1) continue;
  const A = a >= 0 ? mp[a] : [0,0,0], Bp = b >= 0 ? mp[b] : [0,0,0]; const d = Math.hypot(A[0]-Bp[0], A[2]-Bp[2]);
  seg.push({t: 'faden', i: a, p: b, a: A, b: Bp, al: f.form ? 0.14 : 0.05 + 0.45 * f.beleg, lift: d * 0.18}); }
for(const [i, j] of W.lese){ const A = mp[i], Bp = mp[j], d = Math.hypot(A[0]-Bp[0], A[2]-Bp[2]); seg.push({t: 'lese', i, p: j, a: A, b: Bp, al: 0.035, lift: d * 0.32}); }
const koerner = []; for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); koerner.push([+o[0].toFixed(4), +o[1].toFixed(4), +o[2].toFixed(4), m.samen[Z.gSeed[g]].stimme]); }
writeFileSync(new URL(`./seg-${ver}.json`, import.meta.url), JSON.stringify({R, seg, koerner, mitte: mp, stimme: m.samen.map(s => s.stimme)}));
console.log(ver, seg.length, 'Segmente');
