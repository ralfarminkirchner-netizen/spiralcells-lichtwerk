/* =====================================================================
   MONDBAHN — die Rechnung hinter der Galaxie. Planet = Werk, Mond = Fassung, Farbe = Stimme.
   Sonne = Dach: seine Werke kreisen um sie. Zentrale und „ohne Dach“ haben keine eigene Sonne: sie kreisen um den Kern.
   Ein Mond zieht um seinen Planeten einen Kreis. Weil der Planet um seine Sonne läuft, die Galaxie sich dreht
   und sie durchs All fliegt, ist die Bahn im Raum kein Kreis, sondern eine Spirale. Nichts daran ist aufgemalt:
   die Spur ist dieselbe Formel zu früheren Zeiten. Ihre Länge ist die geleistete Arbeit.
   Bei t = 0 steht jedes Werk an seinem Platz im Kosmos. Rechnet nur, speichert nichts. Läuft im Browser und in Node.
   ===================================================================== */
import {clamp, hash, lin} from './licht.js';
import {blattFarbe} from './gelaende.js';

export const DREHUNG = Math.PI * 2 / 2400, FLUG = 0.14, GRUND = Math.PI * 2 / 15;   // Bogenmaß je Sekunde; Weltmaß je Sekunde; Umlauf eines äußeren Monds

/* Wie viel in einer Fassung steckt, von 0 bis 1 */
export const fassungsArbeit = s => clamp(Math.log(1 + Math.max(0, s.laenge || 0) / 300) / Math.log(1 + 60000 / 300), 0, 1);

/* Der Ort eines Planeten zur Zeit t */
export function planetOrt(p, t, o){ const a = p.wp * t, c = Math.cos(a), s = Math.sin(a), x = p.sx + c * p.rx - s * p.rz, z = p.sz + s * p.rx + c * p.rz, g = DREHUNG * t, cg = Math.cos(g), sg = Math.sin(g);
  o[0] = cg * x - sg * z; o[1] = 0; o[2] = sg * x + cg * z; return o; }
/* Der Ort eines Monds zur Zeit t, von heute aus gesehen vor tau Sekunden: dort fliegt die Galaxie noch nicht; darum liegt die Spur über dem Planeten */
export function mondOrt(p, q, t, tau, o){ const zeit = t - tau, a = p.wp * zeit, c = Math.cos(a), s = Math.sin(a), an = q.ph + q.wm * zeit, x = p.sx + c * p.rx - s * p.rz + Math.cos(an) * q.rm, z = p.sz + s * p.rx + c * p.rz + Math.sin(an) * q.rm, g = DREHUNG * zeit, cg = Math.cos(g), sg = Math.sin(g);
  o[0] = cg * x - sg * z; o[1] = Math.sin(an + q.ph) * q.rm * q.kipp + FLUG * tau; o[2] = sg * x + cg * z; return o; }

export function galaxie(N, arbeit){
  const planeten = [], monde = [], weg = (N.daecher || []);
  N.B.monde.forEach((m, n) => { const o = N.pos[n], ort = N.bezirk(n), d = typeof ort === 'number' && weg[ort] && N.baum.ort[n].ebene !== 'material' ? weg[ort] : null, sx = d ? d.mitte[0] : 0, sz = d ? d.mitte[2] : 0, rx = o[0] - sx, rz = o[2] - sz, rel = Math.hypot(rx, rz);
    const wp = d ? Math.PI * 2 / 500 * Math.pow(d.R / Math.max(d.R * 0.15, rel), 0.5) : ort === 'mitte' ? Math.PI * 2 / 700 : 0, rM = N.rM[n], zahl = m.samen.length, ar = arbeit(m);
    let r = 0.9, g = 0.8, b = 0.65; if(zahl){ r = g = b = 0; for(const s of m.samen){ const f = blattFarbe(s); r += f[0]; g += f[1]; b += f[2]; } r /= zahl; g /= zahl; b /= zahl; }
    const p = {n, sx, sz, rx, rz, wp, rM, r: N.baum.material.has(n) ? 0.07 : rM * (0.12 + 0.2 * ar), farbe: [r, g, b], material: N.baum.material.has(n)}; planeten.push(p);
    if(!N.baum.material.has(n)) m.samen.forEach((s, i) => { const rel = 0.5 + 0.5 * Math.sqrt((i + 0.5) / zahl), af = fassungsArbeit(s), q = {planet: n, i, rm: rM * rel * 0.75, ph: i * 2.39996 + n, wm: GRUND * Math.pow(rel, -1.5), kipp: 0.06 + 0.12 * hash(n * 2.3), tau: (rM * (1.6 + 6 * ar) * (0.35 + 0.65 * af)) / FLUG, farbe: blattFarbe(s), kx: N.mini[n].korn ? N.mini[n].korn[i * 2] : 0, kz: N.mini[n].korn ? N.mini[n].korn[i * 2 + 1] : 0}; monde.push(q); }); });
  return {planeten, monde};
}

/* Sterne und Staub: Grund, sie tragen nichts. x y z groesse r g b a */
export function sterne(R, zahl, seed = 1){ const v = new Float32Array(zahl * 8), H = (i, k) => hash(i * 1.31 + k * 7.77 + seed), warm = lin('#ffdfb0'), blau = lin('#a9c8ff'), rosa = lin('#ff9fc0');
  for(let i = 0; i < zahl; i++){ const u = H(i, 1), arm = i % 2, kern = H(i, 9) < 0.2, r = kern ? R * 0.34 * Math.pow(H(i, 2), 1.6) : R * (0.12 + 1.25 * Math.sqrt(u)), wurf = Math.pow(H(i, 3), 2) * (H(i, 4) < 0.5 ? -1 : 1) * 0.55 * (kern ? 3 : 1), a = Math.log(1 + r / (R * 0.11)) * 2.25 + arm * Math.PI + wurf, dick = R * (kern ? 0.09 : 0.022) * (H(i, 5) - 0.5) * 2;
    const f = kern || H(i, 6) < 0.25 ? warm : H(i, 7) < 0.92 ? blau : rosa, hell = (kern ? 0.32 : 0.2) * (0.35 + 1.3 * Math.pow(H(i, 8), 3)) * clamp(1.5 - r / (R * 1.2), 0.12, 1);
    v.set([Math.cos(a) * r, dick, Math.sin(a) * r, R * 0.0016 * (0.5 + H(i, 10)), f[0], f[1], f[2], hell], i * 8); }
  return v; }
export function nebel(R, zahl){ const v = new Float32Array(zahl * 8), bl = lin('#3a5cb0'), ro = lin('#b04a78'), ge = lin('#c98a4a');
  for(let i = 0; i < zahl; i++){ const H = k => hash(i * 2.17 + k * 5.3 + 9), r = R * (0.08 + 1.2 * Math.sqrt(H(1))), a = Math.log(1 + r / (R * 0.11)) * 2.25 + (i % 2) * Math.PI + (H(2) - 0.5) * 0.7, f = r < R * 0.3 ? ge : H(3) < 0.78 ? bl : ro;
    v.set([Math.cos(a) * r, 0, Math.sin(a) * r, R * (0.05 + 0.1 * H(4)), f[0], f[1], f[2], 0.024 * clamp(1.4 - r / (R * 1.2), 0.2, 1)], i * 8); }
  return v; }
