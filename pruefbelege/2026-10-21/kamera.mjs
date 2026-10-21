import {N, B} from './lage.mjs';
const DEG = Math.PI / 180;
function netzMass(N, yaw, elev, asp){
  const cy = Math.cos(yaw), sy = Math.sin(yaw), se = Math.sin(elev), ce = Math.cos(elev); let u = 0, v = 0;
  for(const k of N.kreise){ const cu = k.x * cy - k.z * sy, cv = -k.x * sy - k.z * cy;
    u = Math.max(u, Math.abs(cu) + k.R); v = Math.max(v, (Math.abs(cv) + k.R) * se + k.h * ce); }
  return {S: Math.max(v, u / asp) * 1.1, u, v};
}
console.log('\n--- Kamera im Netz');
for(const [name, w, h] of [['Mac 800x600', 800, 600], ['Mac 1440x900', 1440, 900], ['Handy 375x812', 375, 812]]){
  const asp = w / h, portrait = asp < 0.75;
  for(const yaw of [0.35, 0.35 + Math.PI / 2, 0.35 + 1.0, 0.35 + 2.0]){
    const m = netzMass(N, yaw, 50 * DEG, asp);
    const fuellH = m.v / m.S, fuellB = m.u / (m.S * asp);
    const bz = Math.max(0.16, m.S * 0.006), ringPt = 0.0035 * m.S;
    // Pixel: halbe Höhe = h/2 entspricht S
    const px = x => (x / m.S * h / 2).toFixed(1);
    console.log(name, 'yaw', yaw.toFixed(2), 'S', m.S.toFixed(1), 'Füllung Höhe', (fuellH * 100).toFixed(0) + '%', 'Breite', (fuellB * 100).toFixed(0) + '%',
      '| Bündel-Punkt', bz.toFixed(2), '(' + px(bz) + 'px css), Werkpunkt 0.17*rM(1.9)=' + (0.17 * 1.9).toFixed(2) + ' (' + px(0.17 * 1.9) + 'px), Ringpunkt ' + px(ringPt) + 'px',
      '| Bündel/Werkpunkt', (bz * 1.1 / (0.17 * 1.9)).toFixed(2));
  }
}
// Türen
console.log('\n--- Türen (n=4 und n=5) gegen Dächer');
const Rm = N.L.mitte.R;
for(const n of [4, 5]) for(let i = 0; i < n; i++){ const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.2, x = Math.cos(a) * Rm * 1.3, z = Math.sin(a) * Rm * 1.3;
  const drin = N.daecher.map(d => [d.name, Math.hypot(x - d.mitte[0], z - d.mitte[2]) - d.R]).filter(q => q[1] < 0.5);
  console.log('n', n, 'Tür', i, 'bei', x.toFixed(1), z.toFixed(1), 'Abstand Mitte-Rand', (Rm * 0.3).toFixed(1), drin.map(q => q[0] + ' ' + q[1].toFixed(2)).join(', ') || 'frei'); }
console.log('gapDach 2.0 gegen Türabstand Rm*0.3 =', (Rm * 0.3).toFixed(2));
