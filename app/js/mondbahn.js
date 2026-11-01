/* =====================================================================
   MONDBAHN — die Rechnung hinter der Galaxie. Die Galaxie hat ihre eigene Lage, sie übernimmt keinen Ort aus einer anderen Welt.
   Sonne = Dach, auf den Armen der Galaxie, innen das älteste. Um sie der Planet = Werk, innen das älteste. Zentrale = Kern. Ohne Dach = Wanderer zwischen den Armen, ohne Sonne.
   Vom Planeten steigt die Spirale des Werks auf: ein Lauf durch die Zeit, unten das Älteste, oben das Jüngste, die Zahl der Windungen ist die Arbeit.
   Eine Fassung ist genau ein Stück dieses Laufs und sein heller Kopf: Farbe = Stimme, Länge = ihre Textmenge, jede Stimme auf ihrem eigenen Strang.
   Alle Stränge liegen nebeneinander wie ein Band, darum bleibt auch ein Werk mit 196 Fassungen eine Spirale. Sie öffnet sich nach oben wie ein Trichter. Eine belegte Gabel läuft auf einem äußeren Strang; Fassungen ohne belegte Herkunft bilden ein zweites Band gegenüber. Nichts ist aufgemalt: die Spur ist dieselbe Formel zu früheren Zeiten.
   Rechnet nur, speichert nichts. Läuft im Browser und in Node.
   ===================================================================== */
import {clamp, hash, lin} from './licht.js';
import {blattFarbe} from './gelaende.js';
import {alterVon, bauteile} from './anlage.js';

export const DREHUNG = Math.PI * 2 / 2400, FLUG = 0.14, GRUND = Math.PI * 2 / 15, ENG = 0.3;   // Bogenmaß je Sekunde; Weltmaß je Sekunde; eine Windung der Spirale; Weite der Spirale unten
export const spiralHoehe = (rM, ar) => rM * (1.2 + 3.4 * ar);

/* Wie viel in einer Fassung steckt, von 0 bis 1 */
export const fassungsArbeit = s => clamp(Math.log(1 + Math.max(0, s.laenge || 0) / 300) / Math.log(1 + 60000 / 300), 0, 1);

/* Der Ort eines Planeten zur Zeit t: dort, wo seine Spirale begonnen hat */
export function planetOrt(p, t, o){ const zeit = t - p.alt, a = p.wp * zeit, c = Math.cos(a), s = Math.sin(a), x = p.sx + c * p.rx - s * p.rz, z = p.sz + s * p.rx + c * p.rz, g = DREHUNG * t, cg = Math.cos(g), sg = Math.sin(g);
  o[0] = cg * x - sg * z; o[1] = 0; o[2] = sg * x + cg * z; return o; }
/* Der Punkt einer Spirale, von heute aus vor tau Sekunden: je länger her, desto tiefer und enger */
export function mondOrt(p, q, t, tau, o){ const zeit = t - tau, a = p.wp * zeit, c = Math.cos(a), s = Math.sin(a), an = q.ph + q.wm * zeit, r = q.rm * (ENG + (1 - ENG) * (1 - tau / Math.max(1e-6, p.alt))), x = p.sx + c * p.rx - s * p.rz + Math.cos(an) * r, z = p.sz + s * p.rx + c * p.rz + Math.sin(an) * r, g = DREHUNG * t, cg = Math.cos(g), sg = Math.sin(g);
  o[0] = cg * x - sg * z; o[1] = p.fl * (p.alt - tau); o[2] = sg * x + cg * z; return o; }
/* Die Sonnen und ihre Reichweite zur Zeit t, damit Kamera und Bündel dorthin finden */
export function galaxieZiele(G, t){ const g = DREHUNG * t, c = Math.cos(g), s = Math.sin(g), Z = G.ziele; G.sonnen.forEach((o, j) => { const q = Z.get(j); if(!q) return; q.mitte[0] = c * o.x - s * o.z; q.mitte[2] = s * o.x + c * o.z; }); return Z; }

export function galaxie(N, arbeit){
  const R = N.L.R, ARM = r => Math.log(1 + r / (R * 0.11)) * 2.25, planeten = new Array(N.N), monde = [], sonnen = [], ziele = new Map(), alt = n => alterVon(N.B.monde[n]), nachAlter = l => [...l].sort((a, b) => alt(a) - alt(b)), reichweite = l => 2.2 + 1.7 * Math.sqrt(l.reduce((a, n) => a + (N.rM[n] * 1.25) ** 2, 0));
  const lege = (n, sx, sz, rx, rz, wp) => { const m = N.B.monde[n], mat = N.baum.material.has(n), rM = N.rM[n], zahl = m.samen.length, ar = mat ? 0 : arbeit(m), alter = zahl && !mat ? 15 * (0.8 + 4.6 * ar) : 0, hoehe = spiralHoehe(rM, ar);
    let r = 0.9, g = 0.8, b = 0.65; if(zahl){ r = g = b = 0; for(const s of m.samen){ const f = blattFarbe(s); r += f[0]; g += f[1]; b += f[2]; } r /= zahl; g /= zahl; b /= zahl; }
    const p = planeten[n] = {n, sx, sz, rx, rz, wp, rM, r: mat ? 0.07 : rM * (0.1 + 0.14 * ar), farbe: [r, g, b], material: mat, alt: alter, fl: alter ? hoehe / alter : 0}; if(mat || !zahl) return;
    const plan = N.mini[n].plan, {teil} = plan ? bauteile(plan.W, zahl) : {teil: new Int32Array(zahl)}, ord = m.samen.map((_, i) => i).sort((x, y) => (m.samen[x].zeit || 0) - (m.samen[y].zeit || 0)), gew = i => 0.25 + fassungsArbeit(m.samen[i]), summe = ord.reduce((a, i) => a + gew(i), 0), straenge = [...new Set(m.samen.map(s => s.form ? 'mensch' : s.stimme))], rm = rM * 0.62; let lauf = 0;
    ord.forEach(i => { const s = m.samen[i], w = gew(i) / summe, tb = alter * (1 - lauf), ta = alter * (1 - lauf - w), st = straenge.indexOf(s.form ? 'mensch' : s.stimme), lose = teil[i] < 0, gabel = teil[i] > 0, wm = GRUND; lauf += w; const ph = st * 0.3 + n + (lose ? Math.PI : gabel ? 0.45 : 0), q = {planet: n, i, rm: rm * (lose ? 1.2 : gabel ? 1.16 : 1) * (1 + st * 0.05), ph, wm, tauA: Math.max(0, ta), tau: tb, farbe: blattFarbe(s), lose}; monde.push(q); }); };
  // Der Kern: die Zentrale
  const kern = nachAlter(N.werkeIn('mitte')), rK = reichweite(kern) + 3; kern.forEach((n, i) => { const rel = 2.5 + (rK - 2.5) * Math.sqrt((i + 0.5) / kern.length), a = i * 2.39996; lege(n, 0, 0, Math.cos(a) * rel, Math.sin(a) * rel, Math.PI * 2 / 1400); });
  ziele.set('mitte', {mitte: [0, 0, 0], R: rK + 3});
  // Die Dächer auf den Armen, das älteste innen
  const ordnung = N.daecher.map((_, j) => j).sort((a, b) => Math.min(Infinity, ...N.werkeIn(a).map(alt)) - Math.min(Infinity, ...N.werkeIn(b).map(alt))), rArm = [R * 0.34, R * 0.36], vorher = [0, 0];
  ordnung.forEach((j, q) => { const liste = nachAlter(N.werkeIn(j)), S = reichweite(liste), arm = q % 2, r = rArm[arm] + (vorher[arm] + S) / 2.2, a = ARM(r) + arm * Math.PI, x = Math.cos(a) * r, z = Math.sin(a) * r; rArm[arm] = r; vorher[arm] = S; sonnen[j] = {x, z, R: S}; ziele.set(j, {mitte: [x, 0, z], R: Math.max(S * 1.15 + 2, ...liste.map(n => N.baum.material.has(n) ? 0 : spiralHoehe(N.rM[n], arbeit(N.B.monde[n])) * 0.8))});
    liste.forEach((n, i) => { const rel = 1 + (S - 1) * Math.sqrt((i + 0.5) / liste.length), w = i * 2.39996 + j; lege(n, x, z, Math.cos(w) * rel, Math.sin(w) * rel, Math.PI * 2 / 1500 * Math.sqrt(S / rel)); }); });
  // Ohne Dach: Wanderer zwischen den Armen, das älteste innen
  const ohne = nachAlter(N.werkeIn('ohne')); let oo = {x: R, z: 0}; ohne.forEach((n, i) => { const u = (i + 0.5) / ohne.length, r = R * (0.4 + 0.95 * Math.sqrt(u)), a = ARM(r) + (i % 2) * Math.PI + Math.PI / 2 + (hash(n * 3.3) - 0.5) * 0.5, x = Math.cos(a) * r, z = Math.sin(a) * r; lege(n, 0, 0, x, z, 0); if(i === Math.floor(ohne.length * 0.6)) oo = {x, z}; });
  ziele.set('ohne', {mitte: [0, 0, 0], R: R * 1.2});
  for(let n = 0; n < N.N; n++) if(!planeten[n]) lege(n, 0, 0, R * 1.3, 0, 0);
  return {planeten, monde, sonnen, ziele, ohneOrt: oo, zahlPunkte: (q, schritt) => { const p = planeten[q.planet], lang = (q.tau - q.tauA) * Math.hypot(q.wm * q.rm, p.fl); return Math.max(2, Math.ceil(lang / (schritt * Math.max(0.4, p.rM)))); }};
}

/* Sterne und Staub: Grund, sie tragen nichts. x y z groesse r g b a */
export function sterne(R, zahl, seed = 1){ const v = new Float32Array(zahl * 8), H = (i, k) => hash(i * 1.31 + k * 7.77 + seed), warm = lin('#ffdfb0'), blau = lin('#a9c8ff'), rosa = lin('#ff9fc0');
  for(let i = 0; i < zahl; i++){ const u = H(i, 1), arm = i % 2, kern = H(i, 9) < 0.2, r = kern ? R * 0.24 * Math.pow(H(i, 2), 0.7) : R * (0.12 + 1.25 * Math.sqrt(u)), wurf = Math.pow(H(i, 3), 2) * (H(i, 4) < 0.5 ? -1 : 1) * 0.55 * (kern ? 3 : 1), a = Math.log(1 + r / (R * 0.11)) * 2.25 + arm * Math.PI + wurf, dick = (kern ? Math.sqrt(Math.max(0, (R * 0.24) ** 2 - r * r)) * 0.55 : R * 0.022) * (H(i, 5) - 0.5) * 2;
    const f = kern || H(i, 6) < 0.25 ? warm : H(i, 7) < 0.92 ? blau : rosa, hell = (kern ? 0.32 : 0.2) * (0.35 + 1.3 * Math.pow(H(i, 8), 3)) * clamp(1.5 - r / (R * 1.2), 0.12, 1);
    v.set([Math.cos(a) * r, dick, Math.sin(a) * r, R * 0.0016 * (0.5 + H(i, 10)), f[0], f[1], f[2], hell], i * 8); }
  return v; }
export function nebel(R, zahl){ const v = new Float32Array(zahl * 8), bl = lin('#3a5cb0'), ro = lin('#b04a78'), ge = lin('#c98a4a');
  for(let i = 0; i < zahl; i++){ const H = k => hash(i * 2.17 + k * 5.3 + 9), r = R * (0.08 + 1.2 * Math.sqrt(H(1))), a = Math.log(1 + r / (R * 0.11)) * 2.25 + (i % 2) * Math.PI + (H(2) - 0.5) * 0.7, f = r < R * 0.3 ? ge : H(3) < 0.78 ? bl : ro;
    v.set([Math.cos(a) * r, 0, Math.sin(a) * r, R * (0.05 + 0.1 * H(4)), f[0], f[1], f[2], 0.024 * clamp(1.4 - r / (R * 1.2), 0.2, 1)], i * 8); }
  return v; }
