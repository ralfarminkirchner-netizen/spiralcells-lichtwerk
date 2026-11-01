/* =====================================================================
   BAUPLAN — derselbe Bestand als Dorf, Firmencampus oder Büro. Ein Werk ist ein Haus, ein Gebäude oder ein Tisch.
   Eine Fassung ist genau ein erleuchtetes Fenster oder ein Blatt auf dem Tisch; Farbe = Stimme; die Reihenfolge ist die Zeit (unten das Älteste).
   Höhe des Baus (im Büro: des Stapels) = geleistete Arbeit. Dach = Viertel, Bauabschnitt oder Abteilung. Zentrale = Mitte. Ohne Dach = kein Zaun, keine Wand.
   Abstammung: was aufeinander aufbaut, liegt im selben Bau; eine Gabel ist ein Anbau; Fassungen ohne belegte Herkunft stehen in eigenen Schuppen oder liegen lose.
   Rechnet nur, speichert nichts, erfindet nichts. Läuft im Browser und in Node.
   ===================================================================== */
import {clamp, mix, hash, lin} from './licht.js';
import {blattFarbe} from './gelaende.js';
import {arbeit} from './netz.js';

export const KISTE = 14, FENSTER = 15, BLOCK = 0, GIEBEL = 1, PLATTE = 2;
const C = h => lin(h), GOLD = C('#e8bd62'), REET = C('#8a7248'), ZIEGEL = C('#8a4a34'), HECKE = C('#2c4426'), GLAS = C('#22343c'), DACHGLAS = C('#39474c'), TISCH = C('#6d5a44'), WAND = C('#8d97a0');

const FORM = {dorf: {breit: 1.75, tief: 0.72, hoch: a => 0.55 + 1.7 * a}, campus: {breit: 1.55, tief: 0.85, hoch: a => 0.9 + 6.5 * a}, buero: {breit: 1.45, tief: 0.62, hoch: () => 0.5}};

/* Teilt die Fassungen eines Werks in Bauteile: 0 der Hauptbau, dann Anbauten (Gabeln), Schuppen für lose Fassungen */
export function bauteile(W, zahl){ const lose = i => W.art[i] === 'frei' || W.art[i] === 'reihe', teil = new Int32Array(zahl), anbauten = []; let schuppen = 0;
  for(let i = 0; i < zahl; i++){ if(lose(i)){ teil[i] = -1 - Math.floor(schuppen++ / 6); continue; }
    if(W.art[i] === 'gabel'){ anbauten.push(i); teil[i] = anbauten.length; continue; }
    const p = W.eltern[i]; teil[i] = p >= 0 && !lose(p) ? teil[p] : 0; }
  return {teil, anbauten, schuppen: Math.ceil(schuppen / 6)}; }

export function bauplan(N, stil){
  const F = FORM[stil], k = [], f = []; let fenster = 0;
  const kiste = (n, x, z, oy, sx, sy, sz, yaw, form, c, wann) => k.push(x, z, N.yBoden[n] ?? 0, oy, sx, sy, sz, yaw, c[0], c[1], c[2], form, n, wann);
  // Fenster an den vier Wänden eines Baus, Stockwerk für Stockwerk von unten; jede Fassung genau eines
  const fassade = (n, m, liste, x, z, sx, sy, sz, yaw, wann) => { const t = liste.length; if(!t) return; const sp = clamp(Math.ceil(Math.sqrt(t / 4)), 1, 6), st = Math.ceil(t / (4 * sp)), ch = Math.cos(yaw), sh = Math.sin(yaw), hF = sy / st, kornK = N.mini[n].korn;
    liste.forEach((i, q) => { const seite = q % 4, rest = Math.floor(q / 4), reihe = Math.floor(rest / sp), spalte = rest % sp, breite = seite % 2 ? sz : sx, u = ((spalte + 0.5) / sp - 0.5) * breite, v = hF * (reihe + 0.55), nl = seite === 0 ? [0, 1] : seite === 1 ? [1, 0] : seite === 2 ? [0, -1] : [-1, 0], l = seite % 2 ? [nl[0] * (sx * 0.5 + 0.012), u] : [u, nl[1] * (sz * 0.5 + 0.012)], wx = ch * l[0] + sh * l[1], wz = -sh * l[0] + ch * l[1], nx = ch * nl[0] + sh * nl[1], nz = -sh * nl[0] + ch * nl[1], w = Math.min(breite / sp * 0.62, 0.7), h = Math.min(hF * 0.6, 0.7), c = blattFarbe(m.samen[i]), o = N.pos[n];
      f.push(x + wx, z + wz, N.yBoden[n] ?? 0, v, nx, nz, w, h, c[0], c[1], c[2], wann, o[0] + (kornK ? kornK[i * 2] : 0), o[2] + (kornK ? kornK[i * 2 + 1] : 0), n); fenster++; }); };
  N.B.monde.forEach((m, n) => { const o = N.pos[n], rM = N.rM[n], mat = N.baum.material.has(n), yaw = Math.atan2(o[0], o[2]) + (stil === 'buero' ? 0 : (hash(n * 2.7) - 0.5) * 0.5), plan = N.mini[n].plan, zahl = mat ? 0 : m.samen.length, ar = zahl ? arbeit(m) : 0, wann = clamp(hash(n * 1.9) * 0.5, 0, 0.5);
    if(stil === 'buero'){ const b = rM * F.breit, t = b * F.tief, hoehe = 0.42; kiste(n, o[0], o[2], 0, b, hoehe, t, yaw, PLATTE, mat ? C('#8f8778') : TISCH, wann);
      if(mat){ f.push(o[0], o[2], 0, hoehe + 0.02, 0, 0, 0.3, 0.42, 0.78, 0.68, 0.46, wann, o[0], o[2], n); return; }
      if(!zahl) return; const {teil} = bauteile(plan.W, zahl), stapel = new Map(), bl = rM * 0.34, ko = N.mini[n].korn, ch = Math.cos(yaw), sh = Math.sin(yaw), maxH = 0.1 + 3.4 * ar;
      m.samen.forEach((s, i) => { const key = teil[i], z = stapel.get(key) || 0; stapel.set(key, z + 1); });   // ein Stapel je Bauteil; Stapelhöhe = Arbeit, geteilt durch die Blätter
      const keys = [...stapel.keys()].sort((a, b) => b - a), plaetze = new Map(keys.map((x, j) => { const sp = Math.ceil(Math.sqrt(keys.length * 1.6)), a = j % sp, c = Math.floor(j / sp); return [x, [(a + 0.5) / sp - 0.5, (c + 0.5) / Math.ceil(keys.length / sp) - 0.5]]; })), liegt = new Map();
      m.samen.forEach((s, i) => { const key = teil[i], p = plaetze.get(key), q = liegt.get(key) || 0, je = stapel.get(key); liegt.set(key, q + 1); const lx = p[0] * b * 0.82, lz = p[1] * t * 0.82, wx = ch * lx + sh * lz, wz = -sh * lx + ch * lz, c = blattFarbe(s); f.push(o[0] + wx, o[2] + wz, 0, hoehe + 0.02 + (q + 0.5) / je * maxH * Math.min(1, je / keys.length * 2), 0, 0, Math.min(bl, b / Math.sqrt(keys.length * 1.6) * 0.86), Math.min(bl * 1.35, t / Math.sqrt(keys.length * 1.6) * 0.9), c[0], c[1], c[2], Math.min(1, wann + 0.4 * q / je), o[0] + (ko ? ko[i * 2] : 0), o[2] + (ko ? ko[i * 2 + 1] : 0), n); fenster++; });
      return; }
    if(mat){ kiste(n, o[0], o[2], 0, 0.5, 0.35, 0.5, yaw, BLOCK, C('#6a5c44'), wann); return; }   // Lesematerial: ein kleiner Speicher am Werk
    const dach = m.reife === 'kanonisch' ? GOLD : m.reife === 'gereift' ? ZIEGEL : REET, wandM = () => { let r = 0, g = 0, b = 0; for(const s of m.samen){ const q = blattFarbe(s); r += q[0]; g += q[1]; b += q[2]; } const z = Math.max(1, zahl), t = stil === 'dorf' ? 0.2 : 0.14, br = stil === 'dorf' ? [0.40, 0.34, 0.25] : GLAS; return [mix(br[0], r / z, t), mix(br[1], g / z, t), mix(br[2], b / z, t)]; };
    const haus = (x, z, b, t, h, liste, w) => { kiste(n, x, z, 0, b, h, t, yaw, BLOCK, stil === 'dorf' ? wandM() : wandM(), w);
      if(stil === 'dorf') kiste(n, x, z, h, b * 1.14, b * 0.48, t * 1.14, yaw, GIEBEL, dach, w + 0.15); else kiste(n, x, z, h, b * 1.03, 0.08, t * 1.03, yaw, PLATTE, m.reife === 'kanonisch' ? GOLD : DACHGLAS, w + 0.1);
      fassade(n, m, liste, x, z, b, h, t, yaw, Math.min(1, w + 0.2)); };
    const b0 = rM * F.breit, t0 = b0 * F.tief, h0 = rM * F.hoch(ar);
    if(!zahl){ haus(o[0], o[2], b0 * 0.55, t0 * 0.55, h0 * 0.6, [], wann); return; }   // nur die Ausgangsfassung: ein dunkles Häuschen, noch kein Fenster
    const {teil, anbauten, schuppen} = bauteile(plan.W, zahl), haupt = [], an = anbauten.map(() => []), sch = Array.from({length: schuppen}, () => []);
    for(let i = 0; i < zahl; i++){ const t = teil[i]; if(t < 0) sch[-1 - t].push(i); else if(t === 0) haupt.push(i); else an[t - 1].push(i); }
    if(haupt.length || !sch.length) haus(o[0], o[2], b0, t0, h0, haupt, wann);
    an.forEach((li, j) => { const a = plan.W.th1[anbauten[j]], d = b0 * 0.72, br = b0 * 0.6; haus(o[0] + Math.cos(a) * d, o[2] + Math.sin(a) * d, br, br * F.tief, h0 * (0.45 + 0.3 * hash(j + n)), li, wann + 0.15); });
    const nS = sch.length; sch.forEach((li, j) => { const a = j * 2.39996 + n, d = haupt.length ? b0 * (0.8 + 0.34 * Math.sqrt(j)) : rM * 0.28 * Math.sqrt(j + 0.2) * (nS > 4 ? 1.6 : 1.1), br = clamp(rM * 0.3, 0.3, 0.6) * (stil === 'campus' ? 1.2 : 1), hh = Math.max(stil === 'campus' ? 0.9 : 0.55, h0 * 0.35); haus(o[0] + Math.cos(a) * d, o[2] + Math.sin(a) * d, br, br, hh, li, wann + 0.05 * (j % 6)); }); });
  // Grenzen: Hecken um Viertel, Glaswände um Abteilungen. Ohne Dach bleibt offen, die Zentrale hat nur ihren Rand
  if(stil !== 'campus') N.daecher.forEach((d, j) => { const seg = Math.round(clamp(d.R * 4.5, 16, 70)), brt = d.R * Math.PI * 2 / seg * 1.02, c = stil === 'dorf' ? HECKE : WAND; for(let s = 0; s < seg; s++){ const a = s / seg * Math.PI * 2, x = d.mitte[0] + Math.cos(a) * d.R, z = d.mitte[2] + Math.sin(a) * d.R; k.push(x, z, N.land.y(x, z), 0, brt, stil === 'dorf' ? 0.32 : 0.75, 0.09, -a + Math.PI / 2, c[0], c[1], c[2], stil === 'dorf' ? BLOCK : 3, 0, 0.4); k[k.length - 2] = N.werkeIn(j)[0] ?? 0; } });
  return {kisten: new Float32Array(k), fenster: new Float32Array(f), fensterZahl: fenster};
}
