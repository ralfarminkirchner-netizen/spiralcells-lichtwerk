/* =====================================================================
   BAUPLAN — derselbe Mechanismus als Dorf, Firmencampus oder Bürokomplex. Ein Werk ist ein Haus oder ein Gebäude.
   Eine Fassung ist genau ein erleuchtetes Fenster; Farbe = Stimme; unten das Älteste. Im Campus und im Büro ist eine Etage ein Zeitabschnitt, ihre Zahl die Arbeit;
   wer hineingeht, findet dort die Abteilungen und Schreibtische (innen.js). Im Dorf ist auch das Haus begehbar: Stockwerke, Kammern, Werkbänke. Ein Acker hinter dem Haus ist so lang wie die Arbeit. Ohne Dach = kein Weg.
   Abstammung: was aufeinander aufbaut, liegt im selben Bau; eine Gabel ist ein Anbau; Fassungen ohne belegte Herkunft stehen in eigenen Schuppen oder liegen lose.
   Rechnet nur, speichert nichts, erfindet nichts. Läuft im Browser und in Node.
   ===================================================================== */
import {clamp, mix, hash, lin, CAM} from './licht.js';
import {blattFarbe, gitterHoehe, gitterMass} from './gelaende.js';
import {arbeit} from './netz.js';
import {orteFuer, etagen, bauteile, dorfBreite} from './anlage.js';
export {bauteile};

export const BODENTEIL = 7, KISTE = 14, FENSTER = 15, BLOCK = 0, GIEBEL = 1, PLATTE = 2;
const C = h => lin(h), GOLD = C('#e8bd62'), REET = C('#8a7248'), ZIEGEL = C('#8a4a34'), STRASSE = C('#7c6a4c'), ACKER = C('#333f1c'), GLAS = C('#22343c'), DACHGLAS = C('#39474c'), TISCH = C('#6d5a44'), WAND = C('#8d97a0');

const FORM = {dorf: {breit: 1, tief: 0.72, hoch: a => 0.85 + 2.2 * a}, campus: {breit: 1.55, tief: 0.85, hoch: a => 0.9 + 6.5 * a}, buero: {breit: 2, tief: 0.62, hoch: () => 1}};

export function bauplan(N, stil){
  const F = FORM[stil], k = [], f = [], LG = orteFuer(N, stil), O = LG.pos, buero = stil === 'buero', hoch = stil === 'campus' || buero, flaeche = []; let fenster = 0;
  // Was dem Boden folgt: Straßen und Äcker, Dreieck für Dreieck. Die letzte Zahl zählt die Furchen, -1 keine
  const hBoden = stil === 'dorf' ? gitterHoehe(N.land, ...gitterMass(CAM.cssW < 700)) : N.land.y, auf = (x, z, c, s) => flaeche.push(x, hBoden(x, z), z, c[0], c[1], c[2], s), viereck = (a, b, d, e, c, s0, s1) => { auf(a[0], a[1], c, s0); auf(b[0], b[1], c, s0); auf(d[0], d[1], c, s1); auf(b[0], b[1], c, s0); auf(e[0], e[1], c, s1); auf(d[0], d[1], c, s1); };
  const boden = n => buero ? 0 : stil === 'dorf' ? N.land.y(O[n][0], O[n][2]) : N.yBoden[n] ?? 0, kiste = (n, x, z, oy, sx, sy, sz, yaw, form, c, wann) => k.push(x, z, boden(n), oy, sx, sy, sz, yaw, c[0], c[1], c[2], form, n, wann);
  // Fenster an den vier Wänden, von unten; jede Fassung genau eines
  const fassade = (n, m, liste, x, z, sx, sy, sz, yaw, wann, grund = 0) => { const t = liste.length; if(!t) return; const sp = clamp(Math.ceil(Math.sqrt(t / 4)), 1, 6), st = Math.ceil(t / (4 * sp)), ch = Math.cos(yaw), sh = Math.sin(yaw), hF = sy / st, o = O[n];
    liste.forEach((i, q) => { const seite = q % 4, rest = Math.floor(q / 4), reihe = Math.floor(rest / sp), spalte = rest % sp, breite = seite % 2 ? sz : sx, u = ((spalte + 0.5) / sp - 0.5) * breite, v = grund + hF * (reihe + 0.55), nl = seite === 0 ? [0, 1] : seite === 1 ? [1, 0] : seite === 2 ? [0, -1] : [-1, 0], l = seite % 2 ? [nl[0] * (sx * 0.5 + 0.012), u] : [u, nl[1] * (sz * 0.5 + 0.012)], wx = ch * l[0] + sh * l[1], wz = -sh * l[0] + ch * l[1], nx = ch * nl[0] + sh * nl[1], nz = -sh * nl[0] + ch * nl[1], w = Math.min(breite / sp * 0.62, 0.7), h = Math.min(hF * 0.6, 0.7), c = blattFarbe(m.samen[i]);
      f.push(x + wx, z + wz, boden(n), v, nx, nz, w, h, c[0], c[1], c[2], wann, o[0], o[2], n); fenster++; }); };
  N.B.monde.forEach((m, n) => { const o = O[n], rM = N.rM[n], mat = N.baum.material.has(n), yaw = buero ? 0 : LG.yaw ? LG.yaw[n] : Math.atan2(o[0], o[2]) + (hash(n * 2.7) - 0.5) * 0.5, plan = N.mini[n].plan, zahl = mat ? 0 : m.samen.length, ar = zahl ? arbeit(m) : 0, wann = clamp(hash(n * 1.9) * 0.5, 0, 0.5);
    if(mat){ kiste(n, o[0], o[2], 0, 0.6, 0.4, 0.6, yaw, BLOCK, C('#6a5c44'), wann); return; }   // Lesematerial: ein kleiner Speicher
    if(hoch){ // Campus: ein Turm, der sich mit jeder Etage dreht. Büro: ein gerader Riegel mit Fensterbändern. Eine Etage ist ein Arbeitstag, unten der älteste
      const et = zahl ? etagen(m, ar) : [{fassungen: []}], breit = buero ? clamp(rM * 2, 3, 5.4) : clamp(rM * 1.45, 2, 4.4), tief = buero ? clamp(breit * 0.62, 2.2, 3.2) : breit * 0.9, hF = buero ? 0.9 : 1.25;
      et.forEach((e, q) => { const d = buero ? 0 : q * 0.21, schm = buero ? 1 : 1 - q * 0.012, wand = !zahl ? C('#22262a') : buero ? C('#464a4e') : GLAS; kiste(n, o[0], o[2], q * hF, breit * schm, hF * 0.93, tief * schm, yaw + d, BLOCK, wand, wann + q * 0.02); kiste(n, o[0], o[2], q * hF + hF * 0.93, breit * schm * 1.02, hF * 0.07, tief * schm * 1.02, yaw + d, PLATTE, buero ? C('#6d7074') : DACHGLAS, wann + q * 0.02); fassade(n, m, e.fassungen, o[0], o[2], breit * schm, hF * 0.9, tief * schm, yaw + d, wann + 0.15, q * hF); });
      if(m.reife === 'kanonisch') kiste(n, o[0], o[2], et.length * hF, breit * 0.5, 0.12, tief * 0.5, yaw + et.length * (buero ? 0 : 0.21), PLATTE, GOLD, wann + 0.2);
      return; }
    const dach = m.reife === 'kanonisch' ? GOLD : m.reife === 'gereift' ? ZIEGEL : REET, wandM = () => { let r = 0, g = 0, b = 0; for(const s of m.samen){ const q = blattFarbe(s); r += q[0]; g += q[1]; b += q[2]; } const z = Math.max(1, zahl), t = 0.16, br = [0.62, 0.52, 0.38]; return [mix(br[0], r / z, t), mix(br[1], g / z, t), mix(br[2], b / z, t)]; };
    const haus = (x, z, b, t, h, liste, w) => { kiste(n, x, z, -0.6, b, h + 0.6, t, yaw, BLOCK, wandM(), w); kiste(n, x, z, h, b * 1.14, b * 0.48, t * 1.14, yaw, GIEBEL, dach, w + 0.15); fassade(n, m, liste, x, z, b, h, t, yaw, Math.min(1, w + 0.2)); };
    const b0 = dorfBreite(rM), t0 = b0 * F.tief, h0 = F.hoch(ar);
    // Das Haupthaus: außen so viele Stockwerke wie innen, jedes kragt etwas vor; darunter ein Sockel, oben ein steiles Dach, ab zwei Stockwerken Quergiebel und Kamin. Die Tür liegt zur Straße
    const haupthaus = (x, z, b, t, h, liste, w) => { const et = etagen(m, N.mini[n].ar ?? ar, 4), S = et.length, hF = h / S, drin = new Set(liste), balken = C('#2b2018'), stein = C('#57504a'), wa = wandM(), se = LG.seite ? LG.seite[n] : [0, 1];
      kiste(n, x, z, -0.6, b * 1.05, 0.72, t * 1.05, yaw, PLATTE, stein, w);
      et.forEach((e, q) => { const f = 1 + q * 0.04, bq = b * f, tq = t * f, wq = w + q * 0.03; kiste(n, x, z, q * hF, bq, hF, tq, yaw, BLOCK, wa, wq); kiste(n, x, z, (q + 1) * hF - 0.05, bq * 1.03, 0.1, tq * 1.03, yaw, PLATTE, balken, wq); fassade(n, m, e.fassungen.filter(i => drin.has(i)), x, z, bq, hF * 0.92, tq, yaw, Math.min(1, wq + 0.2), q * hF + 0.04); });
      const fo = 1 + (S - 1) * 0.04; kiste(n, x, z, h, b * fo * 1.16, b * 0.62, t * fo * 1.16, yaw, GIEBEL, dach, w + 0.15);
      if(S > 1){ kiste(n, x, z, h - 0.02, t * fo * 0.74, b * 0.44, b * fo * 1.12, yaw + Math.PI / 2, GIEBEL, dach, w + 0.17); const ch = Math.cos(yaw), sh = Math.sin(yaw), l = b * 0.26, lz = t * 0.22; kiste(n, x + ch * l + sh * lz, z - sh * l + ch * lz, h + b * 0.12, 0.26, b * 0.52, 0.26, yaw, PLATTE, stein, w + 0.2); }
      const d = t * 0.5 + 0.03; kiste(n, x - se[0] * d, z - se[1] * d, 0.02, 0.36, 0.64, 0.05, yaw, PLATTE, balken, w + 0.1); kiste(n, x - se[0] * (d + 0.14), z - se[1] * (d + 0.14), 0.72, 0.62, 0.05, 0.34, yaw, PLATTE, dach, w + 0.12); };
    if(zahl && LG.seite){ const se = LG.seite[n], lang = 1.2 + 7 * ar, ab = t0 * 0.5 + 0.2, wa = wandM(), fa = [mix(ACKER[0], wa[0], 0.22), mix(ACKER[1], wa[1], 0.22), mix(ACKER[2], wa[2], 0.22)], qu = [se[1], -se[0]], br = b0 * 0.6, st = Math.ceil(lang / 0.8), ort = (u, v) => [o[0] + se[0] * (ab + v) + qu[0] * u, o[2] + se[1] * (ab + v) + qu[1] * u]; for(let j = 0; j < st; j++){ const v0 = j / st * lang, v1 = (j + 1) / st * lang; for(let u = 0; u < 3; u++){ const u0 = (u / 3 - 0.5) * 2 * br, u1 = ((u + 1) / 3 - 0.5) * 2 * br; viereck(ort(u0, v0), ort(u1, v0), ort(u0, v1), ort(u1, v1), fa, u0 * 2.2, u0 * 2.2); } } }   // der Acker hinter dem Haus: seine Länge ist die Arbeit
    if(!zahl){ haus(o[0], o[2], b0 * 0.55, t0 * 0.55, h0 * 0.6, [], wann); return; }   // nur die Ausgangsfassung: ein dunkles Häuschen
    const {teil, anbauten, schuppen} = bauteile(plan.W, zahl), haupt = [], an = anbauten.map(() => []), sch = Array.from({length: schuppen}, () => []);
    for(let i = 0; i < zahl; i++){ const t = teil[i]; if(t < 0) sch[-1 - t].push(i); else if(t === 0) haupt.push(i); else an[t - 1].push(i); }
    if(haupt.length || !sch.length) haupthaus(o[0], o[2], b0, t0, h0, haupt, wann);
    an.forEach((li, j) => { const a = plan.W.th1[anbauten[j]], d = b0 * 0.72, br = b0 * 0.6; haus(o[0] + Math.cos(a) * d, o[2] + Math.sin(a) * d, br, br * F.tief, h0 * (0.45 + 0.3 * hash(j + n)), li, wann + 0.15); });
    const nS = sch.length; sch.forEach((li, j) => { const a = j * 2.39996 + n, d = haupt.length ? b0 * (0.8 + 0.34 * Math.sqrt(j)) : rM * 0.28 * Math.sqrt(j + 0.2) * (nS > 4 ? 1.6 : 1.1), br = 0.72, hh = 0.62; haus(o[0] + Math.cos(a) * d, o[2] + Math.sin(a) * d, br, br, hh, li, wann + 0.05 * (j % 6)); }); });
  // Die Straßen des Dorfs: von Punkt zu Punkt ein Stück Weg, das dem Boden folgt
  if(LG.wege) for(const w of LG.wege) for(let i = 1; i < w.punkte.length; i++){ const p = w.punkte[i - 1], q = w.punkte[i], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, nx = -(q[1] - p[1]) / l * 0.72, nz = (q[0] - p[0]) / l * 0.72; for(let u = 0; u < 3; u++){ const f0 = 1 - u * 2 / 3, f1 = 1 - (u + 1) * 2 / 3; viereck([p[0] + nx * f0, p[1] + nz * f0], [p[0] + nx * f1, p[1] + nz * f1], [q[0] + nx * f0, q[1] + nz * f0], [q[0] + nx * f1, q[1] + nz * f1], STRASSE, -1, -1); } }
  return {kisten: new Float32Array(k), fenster: new Float32Array(f), fensterZahl: fenster, boden: new Float32Array(flaeche)};
}
