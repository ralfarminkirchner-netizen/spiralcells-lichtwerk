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
export const BLATT = 0, STIEL = 1, BLUETE = 2, GRAS = 3, KORN = 4, FRUCHT = 5, FELD = 18;   // Instanz: a0 ox oz ty werk, a1 x y z art, a2 x y z breite, a3 r g b wann, a4 kx kz

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
  const flaechen = L.daecher.map((d, j) => ({x: d.mitte[0], z: d.mitte[2], R: d.R, seed: j + 1.3, wack: 0.035, h: huegel(d.mitte[0], d.mitte[2]) + R * (0.006 + 0.03 * (d.arbeit || 0) / maxA)}));
  flaechen.push({x: 0, z: 0, R: L.mitte.R, seed: 4.4, wack: 0.03, h: huegel(0, 0) - R * 0.012});
  const y = (x, z) => { let h = huegel(x, z);
    if(L.ohne){ const d = Math.hypot(x - L.ohne.mitte[0], z - L.ohne.mitte[2]); if(d < L.ohne.R * 1.2) h = mix(h, h * 0.45 + R * 0.012 * (fbm(x * 9 / R, z * 9 / R) - 0.5), sstep(L.ohne.R * 1.2, L.ohne.R * 0.8, d)); }
    for(const f of flaechen){ const dx = x - f.x, dz = z - f.z, d = Math.hypot(dx, dz); if(d > f.R * 1.35) continue; const s = f.R * saum(Math.atan2(dz, dx), f.seed, f.wack); h = mix(h, f.h, sstep(s * 1.25, s * 0.55, d)); }
    return h; };
  return {R, y, flaechen};
}

/* Himmelsrichtung der Sonne: tief und im Rücken des Bildes, darum leuchten die Blätter von hinten */
export function sonne(yaw){ const a = yaw + 0.55, e = 0.13, c = Math.cos(e); return [-Math.sin(a) * c, Math.sin(e), -Math.cos(a) * c]; }

/* Die Höhe des Bodens, wie er gezeichnet wird: zwischen den Gitterpunkten gerade. Straßen und Äcker liegen darum auf ihm und nicht darunter */
export const gitterMass = klein => klein ? [120, 160] : [170, 220];
export function gitterHoehe(G, ringe, speichen){ const R = G.R, E = Math.exp(3.4) - 1, schon = new Map(), weit = i => R * 18 * (Math.exp(3.4 * i / ringe) - 1) / E, h = (i, j) => { j = (j + speichen) % speichen; const k = i * speichen + j; let v = schon.get(k); if(v === undefined){ const r = weit(i), a = j / speichen * Math.PI * 2; v = G.y(Math.cos(a) * r, Math.sin(a) * r); schon.set(k, v); } return v; };
  return (x, z) => { const r = Math.hypot(x, z), fi = Math.log(1 + r * E / (R * 18)) * ringe / 3.4, i = Math.min(ringe - 1, Math.floor(fi)), v = fi - i, fj = (Math.atan2(z, x) / (Math.PI * 2) + 1) % 1 * speichen, j = Math.floor(fj), u = fj - j, A = h(i, j), B = h(i, j + 1), C = h(i + 1, j), D = h(i + 1, j + 1); return u + v <= 1 ? A + (B - A) * u + (C - A) * v : D + (C - D) * (1 - u) + (B - D) * (1 - v); }; }

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

/* Die Art folgt der belegten Abstammung; der Mechanismus bleibt: unten das Älteste, oben das Jüngste, Verzweigung nur, wo sie belegt ist.
   Verzweigt = Baum mit Ästen. Lange Kette = Ranke, die sich hochwindet. Kurz oder einzeln = Blume. Ohne belegte Herkunft = Blumenwiese, jede einzeln aus dem Boden.
   Eine Fassung ist genau ein Organ: Blatt, oder Blüte, wenn sie obenauf steht, oder Frucht, wenn sie eine Grundformation ist. Größe = Textmenge. Farbe = Stimme. */
export function pflanzenArt(m, plan){ const n = m.samen.length; if(!n || !plan) return 'same'; const lose = plan.lose.filter(Boolean).length; if(lose > n / 2) return 'wiese'; const W = plan.W, gabel = W.kinder.some(k => k.filter(c => !plan.lose[c]).length > 1) || W.art.includes('gabel'); return gabel ? 'baum' : plan.tiefste >= 4 ? 'ranke' : 'blume'; }
export function pflanzen(N){
  const werke = []; let blaetter = 0;
  N.B.monde.forEach((m, n) => { const o = N.pos[n], ty = N.land.y(o[0], o[2]), I = [], plan = N.mini[n].plan, rM = N.rM[n], ar = N.mini[n].ar ?? 0.3, H = rM * (1.5 + 5 * ar);
    const leg = (art, a, b, breite, c, wann) => I.push(o[0], o[2], ty, n, a[0], a[1], a[2], art, b[0], b[1], b[2], breite, c[0], c[1], c[2], wann, a[0], a[2]);
    const kurve = (a, b, biegung, b0, b1, c, wann) => { let vor = a; const teile = 4, qx = (b[2] - a[2]) * biegung, qz = (a[0] - b[0]) * biegung; for(let s = 1; s <= teile; s++){ const t = s / teile, w = Math.sin(Math.PI * t), q = [mix(a[0], b[0], t) + qx * w, mix(a[1], b[1], t), mix(a[2], b[2], t) + qz * w]; leg(STIEL, vor, q, mix(b0, b1, t), c, wann); vor = q; } };
    const fertig = () => werke.push({n, x: o[0], z: o[2], I: new Float32Array(I)});
    if(N.baum.material.has(n)){ leg(BLATT, [0, 0.04, 0], [Math.cos(n) * 0.7, 0.03, Math.sin(n) * 0.7], 0.24, LESE, 0.5); fertig(); return; }   // Lesematerial liegt als Blatt am Boden
    if(!plan){ leg(STIEL, [0, 0, 0], [0, 0.18, 0], 0.03, HALM, 0.2); leg(KORN, [0, 0.2, 0], [0, 0, 0], 0.08, SAME, 0.3); fertig(); return; }   // nur die Ausgangsfassung: eine Knospe
    const art = pflanzenArt(m, plan), zahl = m.samen.length, {W, lose} = plan, g = i => clamp(Math.log(1 + (m.samen[i].laenge || 0) / 300) / Math.log(1 + 60000 / 300), 0, 1), eng = Math.min(1, Math.sqrt(16 / zahl)), winkel = i => i * 2.39996 + n;
    const organ = (i, p, oben, wann) => { const s = m.samen[i], f = blattFarbe(s), gr = (0.3 + 0.9 * g(i)) * rM * eng; blaetter++;
      if(s.status === 'grundformation') leg(FRUCHT, p, [0, 0, 0], clamp(gr * 0.3, 0.07, 0.3), GOLD, wann);
      else if(oben) leg(BLUETE, p, [0, 0, 0], clamp(gr * (m.reife === 'kanonisch' ? 0.5 : 0.36), 0.1, 0.6), m.reife === 'kanonisch' ? GOLD : f, wann);
      else { const a = winkel(i), hb = 0.45; leg(BLATT, p, [Math.cos(a) * gr * Math.cos(hb), Math.sin(hb) * gr, Math.sin(a) * gr * Math.cos(hb)], gr * 0.42, f, wann); } };
    const wiesenblume = i => { const a = winkel(i), d = rM * (0.15 + 1.25 * Math.sqrt((i + 0.5) / zahl)), h = rM * (0.22 + 0.5 * g(i)) * (0.8 + 0.4 * hash(i + n)), b = [Math.cos(a) * d, 0, Math.sin(a) * d], t = [b[0] + (hash(i * 3.1) - 0.5) * 0.2, h, b[2] + (hash(i * 5.3) - 0.5) * 0.2]; kurve(b, t, 0.08, clamp(rM * 0.02, 0.012, 0.04), 0.01, HALM, 0.1 + 0.5 * i / zahl); organ(i, t, true, Math.min(1, 0.25 + 0.6 * i / zahl)); };
    if(art === 'wiese' || art === 'baum' || art === 'ranke' || art === 'blume') for(let i = 0; i < zahl; i++) if(lose[i] && art !== 'wiese') wiesenblume(i);
    if(art === 'wiese'){ for(let i = 0; i < zahl; i++){ if(lose[i]) wiesenblume(i); } }
    const fest = []; for(let i = 0; i < zahl; i++) if(!lose[i]) fest.push(i);
    if(art === 'blume' || art === 'ranke' || art === 'wiese'){ const q = fest.length; if(art === 'ranke'){ let vor = [0, 0, 0]; const r = rM * 0.3; fest.forEach((i, j) => { const t = (j + 1) / q, a = t * q * 0.85 + n, p = [Math.cos(a) * r * (0.4 + 0.6 * t), H * 1.25 * t, Math.sin(a) * r * (0.4 + 0.6 * t)]; kurve(vor, p, 0.15, clamp(rM * 0.06 * (1 - t * 0.7), 0.025, 0.12), clamp(rM * 0.05 * (1 - t * 0.7), 0.02, 0.1), STAENGEL, t * 0.9); organ(i, p, j === q - 1, Math.min(1, t + 0.05)); vor = p; }); }
      else { const hS = H * 0.75, gx = (hash(n * 1.7) - 0.5) * rM * 0.3, gz = (hash(n * 2.3) - 0.5) * rM * 0.3, spitze = [gx, hS, gz]; if(q) kurve([0, 0, 0], spitze, 0.06, clamp(rM * 0.05, 0.025, 0.1), clamp(rM * 0.025, 0.015, 0.05), STAENGEL, 0.5); fest.forEach((i, j) => { const t = q === 1 ? 1 : (j + 1) / q; organ(i, [gx * t * t, hS * t, gz * t * t], j === q - 1, Math.min(1, 0.3 + 0.7 * t)); }); } }
    else { // Baum: Stamm, dann Äste; die Dicke folgt dem, was daran hängt, die Richtung der Stimme
      const lage = new Map(), richt = new Map(), schritt = H * 1.9 / (plan.tiefste + 2.2), stamm = [(hash(n) - 0.5) * rM * 0.1, H * 0.62, (hash(n + 1) - 0.5) * rM * 0.1], last = i => { let z = 1; for(const c of W.kinder[i]) if(!lose[c]) z += last(c); return z; }, dick = i => clamp(rM * 0.042 * Math.pow(last(i), 0.5), 0.022, rM * 0.3);
      kurve([0, 0, 0], stamm, 0.04, clamp(rM * 0.05 * Math.pow(fest.length, 0.5), 0.05, rM * 0.34), clamp(rM * 0.04 * Math.pow(fest.length, 0.5), 0.04, rM * 0.26), lin('#4a3a28'), 0.25);
      for(const i of fest){ const e = W.eltern[i], hatE = e >= 0 && !lose[e], von = hatE ? lage.get(e) : stamm, ge = hatE ? richt.get(e) : [0, 1, 0], geschw = hatE ? W.kinder[e].filter(c => !lose[c]) : [], haupt = hatE ? geschw.reduce((b, c) => W.breite[c] > W.breite[b] ? c : b, geschw[0]) === i : false, az = W.th1[i] + i * 0.31, sp = hatE ? (haupt ? 0.28 : 0.85) : 0.72, d0 = [ge[0] * Math.cos(sp) + Math.cos(az) * Math.sin(sp), Math.max(0.22, ge[1] * Math.cos(sp) + 0.15), ge[2] * Math.cos(sp) + Math.sin(az) * Math.sin(sp)], l = Math.hypot(...d0), dr = d0.map(x => x / l), len = schritt * (haupt ? 1 : 0.9), p = [von[0] + dr[0] * len, von[1] + dr[1] * len, von[2] + dr[2] * len]; lage.set(i, p); richt.set(i, dr); const w = Math.min(0.95, 0.25 + 0.7 * (W.tiefe[i] + 1) / (plan.tiefste + 2)); kurve(von, p, 0.07, dick(i) * 1.08, dick(i), lin('#57462f'), w); organ(i, p, !W.kinder[i].some(c => !lose[c]) && (m.reife === 'gereift' || m.reife === 'kanonisch'), Math.min(1, w + 0.1)); } }
    fertig(); });
  return {werke, blaetter};
}

/* Gras gehört zum Grund: dicht auf der Wildwiese, an der Lichtung locker, sonst dünn. Es zählt nichts */
export function grasFeld(N, wie){
  const I = [], G = N.land, R = N.L.R, ohne = N.L.ohne, c = lin('#6b8a3a');
  for(let i = 0; i < wie; i++){ const a = hash(i * 1.37) * Math.PI * 2, dr = Math.sqrt(hash(i * 2.11 + 0.3)), wahl = hash(i * 3.3); let x, z;
    if(ohne && wahl < 0.72){ x = ohne.mitte[0] + Math.cos(a) * dr * ohne.R; z = ohne.mitte[2] + Math.sin(a) * dr * ohne.R; }
    else if(wahl < 0.84){ const r = N.L.mitte.R * (0.3 + 0.9 * dr); x = Math.cos(a) * r; z = Math.sin(a) * r; }
    else { x = Math.cos(a) * dr * R * 1.5; z = Math.sin(a) * dr * R * 1.5; }
    const h = 0.5 + 0.7 * hash(i * 5.1), t = 0.8 + 0.5 * hash(i * 7.7);
    I.push(x, z, G.y(x, z), 0, 0, 0, 0, GRAS, 0.22 * (hash(i * 9.1) - 0.5), h, 0.22 * (hash(i * 4.4) - 0.5), 0.05 + 0.05 * hash(i * 8.3), c[0] * t, c[1] * t, c[2] * t, hash(i * 6.2), 0, 0); }
  return new Float32Array(I);
}
