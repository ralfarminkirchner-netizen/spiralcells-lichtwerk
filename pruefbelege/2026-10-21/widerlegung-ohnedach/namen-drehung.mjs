// Nur lesen: Wo stehen die Namen der Bezirke im Überblick, und wann schweigt „ohne Dach“, weil ein anderer Name ihn überdeckt?
import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const [W, Hh] = (process.argv[2] || '800x600').split('x').map(Number);
globalThis.innerWidth = W; globalThis.innerHeight = Hh;
const stand = process.argv[3] || 'neu';
const A = (stand === 'live' ? R : '/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-ohnedach/' + stand + '/') + 'app/';
const {bestand} = await import(A + 'js/daten.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8')));
const {Netz} = await import(A + 'js/netz.js');
const L = await import(A + 'js/licht.js');
const N = new Netz(B, JSON.parse(readFileSync(A + 'ordnung.json', 'utf8')));
const DEG = Math.PI / 180, TAU = Math.PI * 2;
L.CAM.cssW = W; L.CAM.cssH = Hh;
const asp = W / Hh, fit = 1 / Math.min(1, asp * 1.08), portrait = asp < 0.75;
function netzMass(yaw, elev){ const cy = Math.cos(yaw), sy = Math.sin(yaw), se = Math.sin(elev), ce = Math.cos(elev); let u = 0, v = 0;
  for(const k of N.kreise){ const cu = k.x * cy - k.z * sy, cv = -k.x * sy - k.z * cy; u = Math.max(u, Math.abs(cu) + k.R); v = Math.max(v, (Math.abs(cv) + k.R) * se + k.h * ce); }
  return Math.max(v, u / asp) * 1.1; }
const dreh = portrait && netzMass(0.35 + Math.PI / 2, 50 * DEG) < 0.92 * netzMass(0.35, 50 * DEG);
function amRing(c, Rr, unten){ let best = null; for(let s = 0; s < 16; s++){ const t = s / 16 * TAU, p = L.toScreen(c[0] + Math.cos(t) * Rr, c[1], c[2] + Math.sin(t) * Rr); if(p[2] > 0 && (!best || (unten ? p[1] > best[1] : p[1] < best[1]))) best = p; } return best; }
// Breiten am Bild gewebe2-01 gemessen (px)
const breite = {'Zentrale': 72, 'MiNDLAXY': 97, 'Text und Reim': 94, 'KiNTEGRiTY': 80, 'Spiele und Welten': 124, 'KlebensFroh': 82, 'FASKA': 42, 'Phänomenatlas': 100, 'SEiN': 31, 'ADHS OS': 62, 'ohne Dach': 54};
function bild(yawRel){
  const yaw = 0.35 + (dreh ? Math.PI / 2 : 0) + yawRel, fov = 40 * DEG, pitch = 50 * DEG;
  const Sv = netzMass(yaw, pitch) / fit * fit;   // regie: ganz = netzMass/fit; danach Sv *= fit
  L.setCamera({target: [0, 0, 0], dist: Sv / Math.tan(fov / 2), yaw, pitch, fov, S: Sv, shift: portrait ? 0.1 : 0, shiftX: 0}, W, Hh);
  const anker = [{name: N.baum.mitte.name || 'Zentrale', p: amRing([0, 0, 0], N.L.mitte.R * 1.02, true), unter: true}];
  N.daecher.forEach(d => anker.push({name: d.name, p: L.toScreen(d.mitte[0], d.R * 0.42, d.mitte[2])}));
  if(N.L.ohne){ const o = N.L.ohne; anker.push({name: 'ohne Dach', p: L.toScreen(o.mitte[0], o.R * 0.3, o.mitte[2])}); }
  const belegt = [], out = [];
  for(const a of anker){ const p = a.p, bw = breite[a.name] || a.name.length * 7.3;
    if(!p || p[2] <= 0){ out.push({...a, an: false, grund: 'hinter'}); continue; }
    const px = Math.min(Math.max(p[0], 12 + bw / 2), W - 12 - bw / 2), y0 = a.unter ? p[1] + 10 : p[1] - 30;
    const rr = {x: px - bw / 2, y: y0, w: bw, h: 16};
    const stoer = belegt.find(q => rr.x < q.x + q.w + 6 && q.x < rr.x + rr.w + 6 && rr.y < q.y + q.h + 2 && q.y < rr.y + rr.h + 2);
    if(stoer || y0 < 60 || y0 > Hh - 64){ out.push({...a, an: false, grund: stoer ? 'überdeckt von ' + stoer.name : 'Rand', px, y: p[1] - 14}); continue; }
    rr.name = a.name; belegt.push(rr); out.push({...a, an: true, px, y: p[1] - 14}); }
  // Werkpunkte von „ohne Dach“ und Spiele und Welten auf dem Schirm
  return out;
}
const arg = process.argv[4];
if(arg === 'abgleich'){ // welcher Drehwinkel passt zu gewebe2-01?
  const soll = {'Spiele und Welten': [218, 241], 'ohne Dach': [170, 191], 'Phänomenatlas': [706, 338], 'FASKA': [548, 381], 'MiNDLAXY': [320, 148], 'SEiN': [334, 494]};
  let best = null; for(let t = 0; t < TAU; t += 0.005){ const o = bild(t); let e = 0; for(const x of o){ const s = soll[x.name]; if(s && x.p) e += Math.hypot(x.p[0] - s[0], x.p[1] - 14 - s[1]); } if(!best || e < best.e) best = {t, e}; }
  console.log('beste Drehung', best.t.toFixed(3), 'Fehler gesamt', best.e.toFixed(0));
  for(const x of bild(best.t)) console.log('  ', x.name.padEnd(18), x.an ? 'sichtbar' : 'schweigt (' + x.grund + ')', x.p ? `bei (${x.p[0].toFixed(0)}, ${(x.p[1] - 14).toFixed(0)})` : '');
} else {
  let still = 0, n = 0; const wer = new Map();
  for(let t = 0; t < TAU; t += TAU / 720){ const o = bild(t), oh = o.find(x => x.name === 'ohne Dach'); n++; if(!oh.an){ still++; wer.set(oh.grund, (wer.get(oh.grund) || 0) + 1); } }
  console.log(`${W}x${Hh} ${stand}${dreh ? ' (hochkant gedreht)' : ''}: „ohne Dach“ schweigt in ${still} von ${n} Drehlagen (${(100 * still / n).toFixed(0)} %)`);
  for(const [g, k] of wer) console.log('   ', g, k);
}
