// Nur lesen: wie schnell laufen die fünf Stimmköpfe im Netz (bigHead) über den Schirm, auch bei reduzierter Bewegung?
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand} = await import(ROOT + '/app/js/daten.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/kette-gewebe/state.json`, 'utf8')));
const {Netz, bigHead} = await import(ROOT + '/app/js/netz.js');
const N = new Netz(B, JSON.parse(readFileSync(ROOT + '/app/ordnung.json', 'utf8')));
const DEG = Math.PI / 180;
function netzMass(N, yaw, elev, asp){ const cy = Math.cos(yaw), sy = Math.sin(yaw), se = Math.sin(elev), ce = Math.cos(elev); let u = 0, v = 0;
  for(const k of N.kreise){ const cu = k.x * cy - k.z * sy, cv = -k.x * sy - k.z * cy; u = Math.max(u, Math.abs(cu) + k.R); v = Math.max(v, (Math.abs(cv) + k.R) * se + k.h * ce); }
  return Math.max(v, u / asp) * 1.1; }
for(const [w, h] of [[800, 600], [375, 812]]){
  const asp = w / h, fit = 1 / Math.min(1, asp * 1.08), S = netzMass(N, 0.35, 50 * DEG, asp) / fit, pxProWelt = (h / 2) / S;
  const a = [0, 0, 0], b = [0, 0, 0]; let weg = 0; for(let t = 0; t < 16; t += 0.01){ bigHead(N, 0, t, a); bigHead(N, 0, t + 0.01, b); weg += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); }
  const welt = weg / 16;   // Welteinheiten je Sekunde, gemittelt über einen Umlauf
  console.log(`${w}x${h}: Mitte R=${N.L.mitte.R.toFixed(2)}, S=${S.toFixed(2)}, Kopf ≈ ${(welt * pxProWelt).toFixed(1)} px/s (grob, ohne Perspektive), ein Umlauf 16 s, Spur ${30 * 0.018} s lang`);
}
// In der Mitte (U.dach = 'mitte'): regie.js nimmt dz.R * 1.08 als halbe Bildhöhe
{ const h = 600, S = N.L.mitte.R * 1.08, pxProWelt = (h / 2) / S, welt = 1.06 * N.L.mitte.R * 2 * Math.PI / 16;
  console.log(`Mitte innen 800x600: S=${S.toFixed(2)}, Kopf ≈ ${(welt * pxProWelt).toFixed(0)} px/s auf dem Kranz (Radius ${(1.06 * N.L.mitte.R).toFixed(2)})`); }
