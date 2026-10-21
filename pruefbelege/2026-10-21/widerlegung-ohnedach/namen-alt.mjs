// Nur lesen: dieselbe Rechnung für den alten Stand 26356a7 (ohne Dach außen), Kamera wie die alte regie.js
import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const [W, Hh] = (process.argv[2] || '800x600').split('x').map(Number);
globalThis.innerWidth = W; globalThis.innerHeight = Hh;
const A = '/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-ohnedach/alt/app/';
const {bestand} = await import(A + 'js/daten.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8')));
const {Netz} = await import(A + 'js/netz.js');
const L = await import(A + 'js/licht.js');
const N = new Netz(B, JSON.parse(readFileSync(A + 'ordnung.json', 'utf8')));
const DEG = Math.PI / 180, TAU = Math.PI * 2;
L.CAM.cssW = W; L.CAM.cssH = Hh;
const asp = W / Hh, fit = 1 / Math.min(1, asp * 1.08), portrait = asp < 0.75;
const breite = {'Zentrale': 72, 'MiNDLAXY': 97, 'Text und Reim': 94, 'KiNTEGRiTY': 80, 'Spiele und Welten': 124, 'KlebensFroh': 82, 'FASKA': 42, 'Phänomenatlas': 100, 'SEiN': 31, 'ADHS OS': 62, 'ohne Dach': 54};
function bild(t){ const yaw = 0.35 + t, fov = 40 * DEG, pitch = 50 * DEG, Sv = N.Rm2 * 0.9 * fit * (portrait ? 0.82 : 1);
  L.setCamera({target: [0, 0, 0], dist: Sv / Math.tan(fov / 2), yaw, pitch, fov, S: Sv, shift: portrait ? 0.1 : 0, shiftX: 0}, W, Hh);
  const anker = [{name: 'Zentrale', p: L.toScreen(0, N.L.mitte.R * 0.5, 0)}];
  N.daecher.forEach(d => anker.push({name: d.name, p: L.toScreen(d.mitte[0], d.R * 0.42, d.mitte[2])}));
  const o = N.L.ohne; anker.push({name: 'ohne Dach', p: L.toScreen(o.mitte[0], o.R * 0.3, o.mitte[2])});
  const belegt = [], out = [];
  for(const a of anker){ const p = a.p, bw = breite[a.name]; if(!p || p[2] <= 0){ out.push({...a, an: false, grund: 'hinter'}); continue; }
    const px = Math.min(Math.max(p[0], 12 + bw / 2), W - 12 - bw / 2), rr = {x: px - bw / 2, y: p[1] - 30, w: bw, h: 16};
    const st = belegt.find(q => rr.x < q.x + q.w + 6 && q.x < rr.x + rr.w + 6 && rr.y < q.y + q.h + 2 && q.y < rr.y + rr.h + 2);
    if(st){ out.push({...a, an: false, grund: 'überdeckt von ' + st.name}); continue; } rr.name = a.name; belegt.push(rr); out.push({...a, an: true}); }
  return out; }
let still = 0, n = 0; const wer = new Map();
for(let t = 0; t < TAU; t += TAU / 720){ const oh = bild(t).find(x => x.name === 'ohne Dach'); n++; if(!oh.an){ still++; wer.set(oh.grund, (wer.get(oh.grund) || 0) + 1); } }
console.log(`${W}x${Hh} alt: „ohne Dach“ schweigt in ${still} von ${n} Drehlagen (${(100 * still / n).toFixed(0)} %)`); for(const [g, k] of wer) console.log('   ', g, k);
