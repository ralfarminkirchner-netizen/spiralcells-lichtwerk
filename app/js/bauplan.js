/* =====================================================================
   BAUPLAN — derselbe Mechanismus als Dorf, Firmencampus oder Bürokomplex. Ein Werk ist ein Haus oder ein Gebäude.
   Eine Fassung ist genau ein erleuchtetes Fenster; Farbe = Stimme; unten das Älteste. Im Campus und im Büro ist eine Etage ein Zeitabschnitt, ihre Zahl die Arbeit;
   wer hineingeht, findet dort die Abteilungen und Schreibtische (innen.js). Ohne Dach = kein Zaun.
   Abstammung: was aufeinander aufbaut, liegt im selben Bau; eine Gabel ist ein Anbau; Fassungen ohne belegte Herkunft stehen in eigenen Schuppen oder liegen lose.
   Rechnet nur, speichert nichts, erfindet nichts. Läuft im Browser und in Node.
   ===================================================================== */
import {clamp, mix, hash, lin} from './licht.js';
import {blattFarbe} from './gelaende.js';
import {arbeit} from './netz.js';
import {orteFuer, etagen} from './anlage.js';

export const KISTE = 14, FENSTER = 15, BLOCK = 0, GIEBEL = 1, PLATTE = 2;
const C = h => lin(h), GOLD = C('#e8bd62'), REET = C('#8a7248'), ZIEGEL = C('#8a4a34'), HECKE = C('#2c4426'), GLAS = C('#22343c'), DACHGLAS = C('#39474c'), TISCH = C('#6d5a44'), WAND = C('#8d97a0');

const FORM = {dorf: {breit: 1.75, tief: 0.72, hoch: a => 0.55 + 1.7 * a}, campus: {breit: 1.55, tief: 0.85, hoch: a => 0.9 + 6.5 * a}, buero: {breit: 2, tief: 0.62, hoch: () => 1}};

/* Teilt die Fassungen eines Werks in Bauteile: 0 der Hauptbau, dann Anbauten (Gabeln), Schuppen für lose Fassungen */
export function bauteile(W, zahl){ const lose = i => W.art[i] === 'frei' || W.art[i] === 'reihe', teil = new Int32Array(zahl), anbauten = []; let schuppen = 0;
  for(let i = 0; i < zahl; i++){ if(lose(i)){ teil[i] = -1 - Math.floor(schuppen++ / 6); continue; }
    if(W.art[i] === 'gabel'){ anbauten.push(i); teil[i] = anbauten.length; continue; }
    const p = W.eltern[i]; teil[i] = p >= 0 && !lose(p) ? teil[p] : 0; }
  return {teil, anbauten, schuppen: Math.ceil(schuppen / 6)}; }

export function bauplan(N, stil){
  const F = FORM[stil], k = [], f = [], O = orteFuer(N, stil).pos, buero = stil === 'buero', hoch = stil === 'campus' || buero; let fenster = 0;
  const boden = n => buero ? 0 : N.yBoden[n] ?? 0, kiste = (n, x, z, oy, sx, sy, sz, yaw, form, c, wann) => k.push(x, z, boden(n), oy, sx, sy, sz, yaw, c[0], c[1], c[2], form, n, wann);
  // Fenster an den vier Wänden, von unten; jede Fassung genau eines
  const fassade = (n, m, liste, x, z, sx, sy, sz, yaw, wann, grund = 0) => { const t = liste.length; if(!t) return; const sp = clamp(Math.ceil(Math.sqrt(t / 4)), 1, 6), st = Math.ceil(t / (4 * sp)), ch = Math.cos(yaw), sh = Math.sin(yaw), hF = sy / st, o = O[n];
    liste.forEach((i, q) => { const seite = q % 4, rest = Math.floor(q / 4), reihe = Math.floor(rest / sp), spalte = rest % sp, breite = seite % 2 ? sz : sx, u = ((spalte + 0.5) / sp - 0.5) * breite, v = grund + hF * (reihe + 0.55), nl = seite === 0 ? [0, 1] : seite === 1 ? [1, 0] : seite === 2 ? [0, -1] : [-1, 0], l = seite % 2 ? [nl[0] * (sx * 0.5 + 0.012), u] : [u, nl[1] * (sz * 0.5 + 0.012)], wx = ch * l[0] + sh * l[1], wz = -sh * l[0] + ch * l[1], nx = ch * nl[0] + sh * nl[1], nz = -sh * nl[0] + ch * nl[1], w = Math.min(breite / sp * 0.62, 0.7), h = Math.min(hF * 0.6, 0.7), c = blattFarbe(m.samen[i]);
      f.push(x + wx, z + wz, boden(n), v, nx, nz, w, h, c[0], c[1], c[2], wann, o[0], o[2], n); fenster++; }); };
  N.B.monde.forEach((m, n) => { const o = O[n], rM = N.rM[n], mat = N.baum.material.has(n), yaw = buero ? 0 : Math.atan2(o[0], o[2]) + (hash(n * 2.7) - 0.5) * 0.5, plan = N.mini[n].plan, zahl = mat ? 0 : m.samen.length, ar = zahl ? arbeit(m) : 0, wann = clamp(hash(n * 1.9) * 0.5, 0, 0.5);
    if(mat){ kiste(n, o[0], o[2], 0, 0.6, 0.4, 0.6, yaw, BLOCK, C('#6a5c44'), wann); return; }   // Lesematerial: ein kleiner Speicher
    if(hoch){ // Campus: ein Turm, der sich mit jeder Etage dreht. Büro: ein gerader Riegel mit Fensterbändern. Eine Etage ist ein Arbeitstag, unten der älteste
      const et = zahl ? etagen(m, ar) : [{fassungen: []}], breit = buero ? clamp(rM * 2, 3, 5.4) : clamp(rM * 1.45, 2, 4.4), tief = buero ? clamp(breit * 0.62, 2.2, 3.2) : breit * 0.9, hF = buero ? 0.9 : 1.25;
      et.forEach((e, q) => { const d = buero ? 0 : q * 0.21, schm = buero ? 1 : 1 - q * 0.012, wand = !zahl ? C('#22262a') : buero ? C('#464a4e') : GLAS; kiste(n, o[0], o[2], q * hF, breit * schm, hF * 0.93, tief * schm, yaw + d, BLOCK, wand, wann + q * 0.02); kiste(n, o[0], o[2], q * hF + hF * 0.93, breit * schm * 1.02, hF * 0.07, tief * schm * 1.02, yaw + d, PLATTE, buero ? C('#6d7074') : DACHGLAS, wann + q * 0.02); fassade(n, m, e.fassungen, o[0], o[2], breit * schm, hF * 0.9, tief * schm, yaw + d, wann + 0.15, q * hF); });
      if(m.reife === 'kanonisch') kiste(n, o[0], o[2], et.length * hF, breit * 0.5, 0.12, tief * 0.5, yaw + et.length * (buero ? 0 : 0.21), PLATTE, GOLD, wann + 0.2);
      return; }
    const dach = m.reife === 'kanonisch' ? GOLD : m.reife === 'gereift' ? ZIEGEL : REET, wandM = () => { let r = 0, g = 0, b = 0; for(const s of m.samen){ const q = blattFarbe(s); r += q[0]; g += q[1]; b += q[2]; } const z = Math.max(1, zahl), t = 0.2, br = [0.40, 0.34, 0.25]; return [mix(br[0], r / z, t), mix(br[1], g / z, t), mix(br[2], b / z, t)]; };
    const haus = (x, z, b, t, h, liste, w) => { kiste(n, x, z, 0, b, h, t, yaw, BLOCK, wandM(), w); kiste(n, x, z, h, b * 1.14, b * 0.48, t * 1.14, yaw, GIEBEL, dach, w + 0.15); fassade(n, m, liste, x, z, b, h, t, yaw, Math.min(1, w + 0.2)); };
    const b0 = rM * F.breit, t0 = b0 * F.tief, h0 = rM * F.hoch(ar);
    if(!zahl){ haus(o[0], o[2], b0 * 0.55, t0 * 0.55, h0 * 0.6, [], wann); return; }   // nur die Ausgangsfassung: ein dunkles Häuschen
    const {teil, anbauten, schuppen} = bauteile(plan.W, zahl), haupt = [], an = anbauten.map(() => []), sch = Array.from({length: schuppen}, () => []);
    for(let i = 0; i < zahl; i++){ const t = teil[i]; if(t < 0) sch[-1 - t].push(i); else if(t === 0) haupt.push(i); else an[t - 1].push(i); }
    if(haupt.length || !sch.length) haus(o[0], o[2], b0, t0, h0, haupt, wann);
    an.forEach((li, j) => { const a = plan.W.th1[anbauten[j]], d = b0 * 0.72, br = b0 * 0.6; haus(o[0] + Math.cos(a) * d, o[2] + Math.sin(a) * d, br, br * F.tief, h0 * (0.45 + 0.3 * hash(j + n)), li, wann + 0.15); });
    const nS = sch.length; sch.forEach((li, j) => { const a = j * 2.39996 + n, d = haupt.length ? b0 * (0.8 + 0.34 * Math.sqrt(j)) : rM * 0.28 * Math.sqrt(j + 0.2) * (nS > 4 ? 1.6 : 1.1), br = clamp(rM * 0.3, 0.3, 0.6), hh = Math.max(0.55, h0 * 0.35); haus(o[0] + Math.cos(a) * d, o[2] + Math.sin(a) * d, br, br, hh, li, wann + 0.05 * (j % 6)); }); });
  // Hecken um die Viertel des Dorfs; ohne Dach bleibt offen
  if(stil === 'dorf') N.daecher.forEach((d, j) => { const seg = Math.round(clamp(d.R * 4.5, 16, 70)), brt = d.R * Math.PI * 2 / seg * 0.8, c = HECKE; for(let s = 0; s < seg; s++){ if(hash(s * 3.1 + j) < 0.22) continue; const a = s / seg * Math.PI * 2, x = d.mitte[0] + Math.cos(a) * d.R, z = d.mitte[2] + Math.sin(a) * d.R; k.push(x, z, N.land.y(x, z), 0, brt, 0.3 + 0.3 * hash(s + j), 0.28, -a + Math.PI / 2, c[0], c[1], c[2], BLOCK, N.werkeIn(j)[0] ?? 0, 0.4); } });
  return {kisten: new Float32Array(k), fenster: new Float32Array(f), fensterZahl: fenster};
}
