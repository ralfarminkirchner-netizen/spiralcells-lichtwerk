// Nur lesen: Wie hell ist der gestrichelte Ring von „ohne Dach“ im Überblick 800x600 (Drehlage wie gewebe2-01)?
import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const A = R + 'app/';
const {bestand} = await import(A + 'js/daten.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8')));
const {Netz} = await import(A + 'js/netz.js'); const L = await import(A + 'js/licht.js');
const N = new Netz(B, JSON.parse(readFileSync(A + 'ordnung.json', 'utf8')));
const DEG = Math.PI / 180, W = 800, H = 600; L.CAM.cssW = W; L.CAM.cssH = H;
const asp = W / H, fit = 1 / Math.min(1, asp * 1.08);
function netzMass(yaw, elev){ const cy = Math.cos(yaw), sy = Math.sin(yaw), se = Math.sin(elev), ce = Math.cos(elev); let u = 0, v = 0;
  for(const k of N.kreise){ const cu = k.x * cy - k.z * sy, cv = -k.x * sy - k.z * cy; u = Math.max(u, Math.abs(cu) + k.R); v = Math.max(v, (Math.abs(cv) + k.R) * se + k.h * ce); } return Math.max(v, u / asp) * 1.1; }
const yaw = 0.35 + 0.11, fov = 40 * DEG, pitch = 50 * DEG, Sv = netzMass(yaw, pitch);
L.setCamera({target: [0, 0, 0], dist: Sv / Math.tan(fov / 2), yaw, pitch, fov, S: Sv, shift: 0, shiftX: 0}, W, H);
const o = N.L.ohne.mitte, a = L.toScreen(o[0], 0, o[2]), b = L.toScreen(o[0] + L.CAM.R[0], 0, o[2] + L.CAM.R[2]);
const pxProWelt = Math.hypot(b[0] - a[0], b[1] - a[1]);
const uMin = 1.6;   // CSS-Pixel bei DPR 1, qScale 1
const groesse = (w, alpha) => { const px = w * pxProWelt, s = Math.max(px, uMin), e = Math.min(1, px * px / (s * s)); return {px: px.toFixed(2), wirk: (alpha * e).toFixed(4)}; };
console.log('px je Welteinheit an „ohne Dach“:', pxProWelt.toFixed(2), ' Schirm', a[0].toFixed(0), a[1].toFixed(0));
console.log('Ring „ohne Dach“ (0,07; Alpha 0,22):', groesse(0.07, 0.22), ' Punkte', Math.max(60, Math.round(N.L.ohne.R * 22)), 'davon jeder 4. fehlt');
console.log('zum Vergleich alter Dachring (0,11; Alpha 0,42):', groesse(0.11, 0.42));
const sw = N.daecher.find(d => d.name === 'Spiele und Welten');
console.log('Dachhülle Spiele und Welten Punkt (R·0,011 =', (sw.R * 0.011).toFixed(3), '; Alpha fres·0,55·0,8, am Saum fres≈1):', groesse(sw.R * 0.011, 0.44));
console.log('Werkpunkt (0,17·0,7):', groesse(0.17 * 0.7, 2.2 * 0.8));
