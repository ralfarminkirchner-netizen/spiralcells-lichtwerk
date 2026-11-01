/* =====================================================================
   GELÄNDE — die Rechnung hinter der Landschaft: Boden und Pflanzen aus dem Bestand.
   Beet = Dach, seine Höhe = wie viel in ihm schon entstanden ist. Lichtung = Zentrale, eine Mulde.
   Wildwiese = ohne Dach, sie bekommt keine Terrasse. Alles außerhalb der Bezirke ist Grund und trägt nichts.
   Ein Blatt = eine Fassung (Farbe: Stimme, Größe: Textmenge). Stiele folgen der belegten Abstammung.
   Rechnet nur, speichert nichts, erfindet nichts. Läuft im Browser und in Node.
   ===================================================================== */
import {clamp, mix, sstep, hash, lin} from './licht.js';
import {STIMMEN, MENSCH} from './daten.js';

export const PFLANZE = 1.7;   // in der Landschaft stehen die Pflanzen größer als im Kosmos; ihre Verhältnisse bleiben
export const BLATT = 0, STIEL = 1, BLUETE = 2, GRAS = 3, KORN = 4, FELD = 18;   // Instanz: a0 ox oz ty werk, a1 x y z art, a2 x y z breite, a3 r g b wann, a4 kx kz

const wert = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz), h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  return mix(mix(h(ix, iz), h(ix + 1, iz), u), mix(h(ix, iz + 1), h(ix + 1, iz + 1), u), v); };
const fbm = (x, z) => wert(x, z) * 0.57 + wert(x * 2.1 + 3.1, z * 2.1 - 1.7) * 0.29 + wert(x * 4.3 - 7.2, z * 4.3 + 2.9) * 0.14;
/* Der Saum eines Bezirks: etwas unregelmäßig, aber stabil. Boden und Karte lesen denselben */
export const saum = (a, seed, w) => 1 + w * Math.sin(a * 3 + seed) + w * 0.5 * Math.cos(a * 7 + seed * 2);

/* L: {R, mitte: {mitte, R}, daecher: [{mitte, R, arbeit}], ohne} */
export function gelaende(L){
  const R = L.R, huegel = (x, z) => { const r = Math.hypot(x, z), n = fbm(x / (R * 0.42) + 11, z / (R * 0.42) + 4);
    return R * 0.075 * (n - 0.5) + R * 0.26 * sstep(R * 1.15, R * 3.6, r) * (0.6 + 0.8 * n) + R * 0.9 * sstep(R * 3.2, R * 11, r) * fbm(x / (R * 1.6), z / (R * 1.6)); };
  const maxA = Math.max(1e-6, ...L.daecher.map(d => d.arbeit || 0));
  const flaechen = L.daecher.map((d, j) => ({x: d.mitte[0], z: d.mitte[2], R: d.R, seed: j + 1.3, wack: 0.035, h: huegel(d.mitte[0], d.mitte[2]) + R * (0.012 + 0.055 * (d.arbeit || 0) / maxA)}));
  flaechen.push({x: 0, z: 0, R: L.mitte.R, seed: 4.4, wack: 0.03, h: huegel(0, 0) - R * 0.012});
  const y = (x, z) => { let h = huegel(x, z);
    if(L.ohne){ const d = Math.hypot(x - L.ohne.mitte[0], z - L.ohne.mitte[2]); if(d < L.ohne.R * 1.2) h = mix(h, h * 0.45 + R * 0.012 * (fbm(x * 9 / R, z * 9 / R) - 0.5), sstep(L.ohne.R * 1.2, L.ohne.R * 0.8, d)); }
    for(const f of flaechen){ const dx = x - f.x, dz = z - f.z, d = Math.hypot(dx, dz); if(d > f.R * 1.3) continue; const s = f.R * saum(Math.atan2(dz, dx), f.seed, f.wack); h = mix(h, f.h, sstep(s + Math.min(s * 0.2, 1.3), s * 0.97, d)); }
    return h; };
  return {R, y, flaechen};
}

/* Himmelsrichtung der Sonne: tief und im Rücken des Bildes, darum leuchten die Blätter von hinten */
export function sonne(yaw){ const a = yaw + 0.55, e = 0.13, c = Math.cos(e); return [-Math.sin(a) * c, Math.sin(e), -Math.cos(a) * c]; }

/* Der Boden als Gitter aus Ringen: innen fein, zum Horizont weit. x y z, Normale, Licht der Sonne (0 im Schatten eines Hügels) */
export function bodenGitter(G, S, ringe = 170, speichen = 220){
  const R = G.R, n = (ringe + 1) * speichen, v = new Float32Array(n * 7), H = R * 0.006, weit = i => R * 18 * (Math.exp(3.4 * i / ringe) - 1) / (Math.exp(3.4) - 1);
  let q = 0;
  for(let i = 0; i <= ringe; i++){ const r = weit(i); for(let j = 0; j < speichen; j++){ const a = j / speichen * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r, h = G.y(x, z), e = H + r * 0.004, nx = G.y(x - e, z) - G.y(x + e, z), nz = G.y(x, z - e) - G.y(x, z + e), ny = 2 * e, l = Math.hypot(nx, ny, nz);
      let licht = 1; if(r < R * 5) for(let k = 1; k <= 5; k++){ const s = k * k * R * 0.022, oben = h + s * S[1] / Math.hypot(S[0], S[2]) - G.y(x + S[0] * s, z + S[2] * s); licht = Math.min(licht, clamp(0.5 + oben / (R * 0.012), 0, 1)); }
      v[q++] = x; v[q++] = h; v[q++] = z; v[q++] = nx / l; v[q++] = ny / l; v[q++] = nz / l; v[q++] = licht; } }
  const ix = new Uint32Array(ringe * speichen * 6); q = 0;
  for(let i = 0; i < ringe; i++) for(let j = 0; j < speichen; j++){ const a = i * speichen + j, b = i * speichen + (j + 1) % speichen, c = a + speichen, d = b + speichen; ix[q++] = a; ix[q++] = c; ix[q++] = b; ix[q++] = b; ix[q++] = c; ix[q++] = d; }
  return {v, ix};
}

const STIMMC = STIMMEN.map(s => lin(s.hex)), RALFC = lin('#e4dfcc'), QUELLC = lin('#8fae62'), GOLD = lin('#e8bd62'), STAENGEL = lin('#5f7a3c'), HALM = lin('#7f9a5a'), LESE = lin('#c8ad6d'), SAME = lin('#b7a26d');
export const blattFarbe = s => s.form ? RALFC : typeof s.stimme === 'number' ? STIMMC[s.stimme] : s.stimme === MENSCH ? RALFC : QUELLC;

/* Alle Pflanzen als Instanzen, je Werk ein zusammenhängendes Stück. Jede Fassung ergibt genau ein Blatt; dessen Fuß ist dort, wo ihr Korn im Garten steht */
export function pflanzen(N){
  const werke = []; let blaetter = 0;
  N.B.monde.forEach((m, n) => { const o = N.pos[n], ty = N.land.y(o[0], o[2]), I = [], plan = N.mini[n].plan, rM = N.rM[n];
    const leg = (art, a, b, breite, c, wann, k) => I.push(o[0], o[2], ty, n, a[0], a[1], a[2], art, b[0], b[1], b[2], breite, c[0], c[1], c[2], wann, k ? k[0] : a[0], k ? k[1] : a[2]);
    const kurve = (a, b, biegung, breite0, breite1, c, wann, teile) => { let vor = a; for(let s = 1; s <= teile; s++){ const t = s / teile, sg = t * (1 - t) * 4 * biegung, q = [mix(a[0], b[0], t) + sg * (a[0] - b[0]), mix(a[1], b[1], t * t * 0.4 + t * 0.6), mix(a[2], b[2], t) + sg * (a[2] - b[2])]; leg(STIEL, vor, q, mix(breite0, breite1, t), c, wann, null); vor = q; } };
    if(N.baum.material.has(n)){ leg(BLATT, [0, 0.02, 0], [Math.cos(n) * 0.7, 0.02, Math.sin(n) * 0.7], 0.24, LESE, 0.5, [0, 0]); werke.push({n, x: o[0], z: o[2], I: new Float32Array(I)}); return; }   // Lesematerial liegt als Blatt am Boden seines Werks
    if(!plan){ leg(KORN, [0, 0.05, 0], [0, 0, 0], 0.09, SAME, 0.2, [0, 0]); werke.push({n, x: o[0], z: o[2], I: new Float32Array(I)}); return; }   // nur die Ausgangsfassung: ein Same
    const {lage, W, lose} = plan, zahl = m.samen.length, punkt = i => [lage[i * 3], lage[i * 3 + 1], lage[i * 3 + 2]], eng = Math.min(1, Math.sqrt(14 / zahl)), tief = plan.tiefste + 2;
    for(let i = 0; i < zahl; i++){ const s = m.samen[i], p = punkt(i), wann = lose[i] ? 0.15 + 0.5 * (i / zahl) : (W.tiefe[i] + 1) / tief;
      if(lose[i]) kurve([lage[i * 3] * 0.22, 0, lage[i * 3 + 2] * 0.22], p, 0.12, clamp(rM * 0.035, 0.03, 0.09), 0.015, HALM, wann, 3);
      else { const e = W.eltern[i], von = e >= 0 && !lose[e] ? punkt(e) : [0, 0, 0], dicke = clamp(rM * 0.075 * (1 - W.tiefe[i] / tief), 0.03, 0.22); kurve(von, p, 0.08, dicke, dicke * 0.7, STAENGEL, wann, 3); }
      const text = clamp(Math.log(1 + (s.laenge || 0) / 300) / Math.log(1 + 60000 / 300), 0, 1), lang = rM * (0.34 + 0.95 * text) * eng, a = i * 2.39996 + n, hebt = lose[i] ? 0.25 : 0.5;
      leg(BLATT, p, [Math.cos(a) * lang * Math.cos(hebt), Math.sin(hebt) * lang, Math.sin(a) * lang * Math.cos(hebt)], lang * 0.36, blattFarbe(s), Math.min(1, wann + 0.12), N.mini[n].korn ? [N.mini[n].korn[i * 2], N.mini[n].korn[i * 2 + 1]] : [p[0], p[2]]); blaetter++;
      if(!W.kinder[i].length && zahl > 1 && (m.reife === 'gereift' || m.reife === 'kanonisch')) leg(BLUETE, p, [0, 0, 0], clamp(lang * 0.4, 0.12, 0.5), m.reife === 'kanonisch' ? GOLD : blattFarbe(s), 1, null);
      else if(s.status === 'grundformation') leg(KORN, p, [0, 0, 0], clamp(rM * 0.06, 0.06, 0.14), GOLD, 1, null); }
    werke.push({n, x: o[0], z: o[2], I: new Float32Array(I)}); });
  return {werke, blaetter};
}

/* Gras gehört zum Grund: dicht auf der Wildwiese, an der Lichtung locker, sonst dünn. Es zählt nichts */
export function grasFeld(N, wie){
  const I = [], G = N.land, R = N.L.R, ohne = N.L.ohne, c = lin('#6b8a3a');
  for(let i = 0; i < wie; i++){ const a = hash(i * 1.37) * Math.PI * 2, dr = Math.sqrt(hash(i * 2.11 + 0.3)), wahl = hash(i * 3.3); let x, z;
    if(ohne && wahl < 0.72){ x = ohne.mitte[0] + Math.cos(a) * dr * ohne.R; z = ohne.mitte[2] + Math.sin(a) * dr * ohne.R; }
    else if(wahl < 0.84){ const r = N.L.mitte.R * (0.3 + 0.9 * dr); x = Math.cos(a) * r; z = Math.sin(a) * r; }
    else { x = Math.cos(a) * dr * R * 1.5; z = Math.sin(a) * dr * R * 1.5; if(N.daecher.some(d => Math.hypot(x - d.mitte[0], z - d.mitte[2]) < d.R * 1.02)) continue; }
    const h = 0.5 + 0.7 * hash(i * 5.1), t = 0.8 + 0.5 * hash(i * 7.7);
    I.push(x, z, G.y(x, z), 0, 0, 0, 0, GRAS, 0.22 * (hash(i * 9.1) - 0.5), h, 0.22 * (hash(i * 4.4) - 0.5), 0.05 + 0.05 * hash(i * 8.3), c[0] * t, c[1] * t, c[2] * t, hash(i * 6.2), 0, 0); }
  return new Float32Array(I);
}
