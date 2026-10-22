/* =====================================================================
   VERSCHRÄNKUNG — Alsformen im Licht.
   Ralfs Gedanke: Werke sind Planeten, Dächer ihre Sonnensysteme; Monde sind, was um ein
   Thema kreist. Derselbe Mond kann an Dutzenden Planeten sein, einmal gespeichert, überall
   dort, wo er hingehört. Und Planeten entstehen aus Monden.
   - Jede Teilnahme ist eine Erscheinung des Gegenstands auf einer Umlaufbahn um das Werk,
     in dem er teilnimmt. Alle Erscheinungen desselben Gegenstands stehen in derselben Phase
     und atmen im selben Takt: eine Identität, viele Orte. Die Bahn neigt sich nach der Rolle:
     Rolle wechselt, Identität nicht.
   - Aktiv leuchtet voll; vorgeschlagen ist nur ein Umriss; zurückgenommen bleibt als
     Asche auf einer gebrochenen Bahn (nur im Blick auf den Gegenstand), nie gelöscht.
   - Der Verschränkungsfaden zwischen dem Gegenstand und seinen Erscheinungen ist eine
     stehende Welle; Lichtpaare entstehen in seiner Mitte und kommen an beiden Enden zugleich an.
     Er ist kein Materialfluss und keine Herkunft.
   - Entstehung: die Spuren eines Werks liegen auf einer Spirale um es, innen die zuerst
     aufgezeichnete. Materie sinkt langsam nach innen. Eine bekannte Ereigniszeit verankert
     die Spur mit einem Stiel im Boden; eine offene schwebt. Ein Vorschlag ist ein Umriss,
     eine offene Lücke ein leerer Ring, ein Gegenbefund Asche mit gebrochenem Faden.
   Gold bleibt Ralfs Kristallisieren. Nichts hier schreibt.
   ===================================================================== */
import {TAU, DEG, clamp, mix, sstep, hash, mixc, P, CAM, toScreen, screenRing, WG, KEIMC, SILVER, DUSTC, ASCHE} from './licht.js';
import {fibSphere} from './zelle.js';
import {kurz} from './daten.js';

const HUELLE = fibSphere(700), OMEGA = TAU / 16, ATEM = TAU / 2.8;
const TMP = [0, 0, 0];

/* Die Farbe eines Werks: das Mittel seiner Lichter im Netz, etwas zum warmen Weiß gehoben */
export function werkFarbe(N, i){
  if(!N._farbe) N._farbe = new Map(); const c = N._farbe.get(i); if(c) return c;
  const p = N.mini[i] ? N.mini[i].pts : null; let r = 0, g = 0, b = 0, n = 0;
  if(p) for(let q = 0; q < p.length / 6; q++){ r += p[q * 6 + 3]; g += p[q * 6 + 4]; b += p[q * 6 + 5]; n++; }
  const f = mixc(n ? [r / n, g / n, b / n] : KEIMC, WG, 0.3); N._farbe.set(i, f); return f;
}
const phase0 = gi => hash(gi * 7.13 + 1.7) * TAU;
/* Bahnen um ein Werk: je Teilnahme ein Platz, nach außen gestaffelt; die Neigung folgt der Rolle */
function bahn(N, A, ti){
  const t = A.teilnahmen[ti], liste = A.proKontext.get(t.kontext) || [ti], slot = Math.max(0, liste.indexOf(ti));
  const rh = hash([...t.rolle].reduce((s, c) => s + c.charCodeAt(0), 0) * 0.37);
  return {c: N.pos[t.kontext], r: N.rM[t.kontext] * 1.45 + 0.45 + slot * 0.34, neig: 0.32 + 0.55 * rh, dreh: rh * TAU};
}
function aufBahn(b, th, o){
  const x = Math.cos(th) * b.r, y0 = Math.sin(th) * b.r * Math.sin(b.neig), z0 = Math.sin(th) * b.r * Math.cos(b.neig);
  const cd = Math.cos(b.dreh), sd = Math.sin(b.dreh);
  o[0] = b.c[0] + x * cd + z0 * sd; o[1] = b.c[1] + 0.15 + y0 * 0.6; o[2] = b.c[2] - x * sd + z0 * cd; return o; }
/* Wo eine Erscheinung gerade steht: alle Erscheinungen eines Gegenstands in derselben Phase */
export function echoPhase(A, ti, wall, RM){ const t = A.teilnahmen[ti]; return phase0(t.gegenstand) + (RM || t.stand === 'withdrawn' ? 0 : OMEGA * wall); }
export function echoPos(N, A, ti, wall, RM, o){ return aufBahn(bahn(N, A, ti), echoPhase(A, ti, wall, RM), o); }

/* Die Entstehung eines Werks steigt als Kelch über ihm auf: unten am Kern die zuerst aufgezeichnete Spur, oben die jüngste,
   und der Kelch weitet sich mit der Zeit. So zeigt das Lichtwerk Geschichte auch in der Zelle (von der Seite: unten der Keim). */
function spirale(N, gi){ const r = N.rM[gi];
  return {c: [N.pos[gi][0], N.pos[gi][1] + 0.1, N.pos[gi][2]], r0: r * 0.55 + 0.25, rw: r * 0.9 + 1.0, h: 1.4 + r * 0.9, huelle: r * 1.15, a0: phase0(gi) + 1.1}; }
function spiralPunkt(sp, f, dreh, o){ const t = clamp(f, -0.15, 1.15), r = sp.r0 + sp.rw * Math.max(0, t), a = sp.a0 + t * TAU * 1.3 + dreh;
  o[0] = sp.c[0] + Math.cos(a) * r; o[1] = sp.c[1] + 0.25 + sp.h * t; o[2] = sp.c[2] + Math.sin(a) * r; return o; }
export function spurPos(N, A, si, wall, RM, o){ const s = A.spuren[si], sp = spirale(N, s.werk), f = s.n > 1 ? s.k / (s.n - 1) : 0;
  return spiralPunkt(sp, f, RM ? 0 : wall * 0.012, o); }
/* Wie weit ein Blick reichen muss: der Gegenstand mit seinen Zusammenhängen, oder der Planet mit Spirale und Monden */
export function fokusZiel(N, A, gi, fokus){
  if(fokus === 'planet'){ const sp = spirale(N, gi), ein = (A.proKontext.get(gi) || []).map(ti => bahn(N, A, ti).r);
    const hat = A.entstehung.has(gi), R = Math.max(hat ? sp.r0 + sp.rw + 0.7 : 0, hat ? sp.h * 0.8 + 1 : 0, ...ein.map(r => r + 0.9), N.rM[gi] * 2 + 1.5, 3.2);
    return {mitte: [N.pos[gi][0], hat ? sp.h * 0.42 : 0, N.pos[gi][2]], R}; }
  const pts = [gi, ...(A.proGegenstand.get(gi) || []).map(ti => A.teilnahmen[ti].kontext)];
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for(const i of pts){ const p = N.pos[i], r = N.rM[i] * 1.6 + 1.4; x0 = Math.min(x0, p[0] - r); x1 = Math.max(x1, p[0] + r); z0 = Math.min(z0, p[2] - r); z1 = Math.max(z1, p[2] + r); }
  return {mitte: [(x0 + x1) / 2, 0, (z0 + z1) / 2], R: Math.max(3.2, Math.hypot(x1 - x0, z1 - z0) / 2 * 0.9)};   // die Kamera dreht das Netz: die Diagonale muss passen
}

/* Ein Ring aus Punkten in der Ebene, auf Wunsch mit Lücke */
function bodenRing(c, R, col, a, sz, luecke){ const n = Math.max(48, Math.round(R * 26));
  for(let s = 0; s < n; s++){ const t = s / n; if(luecke && (t > 0.46 && t < 0.54 || s % 3 === 0)) continue; P(c[0] + Math.cos(t * TAU) * R, c[1], c[2] + Math.sin(t * TAU) * R, sz, col[0], col[1], col[2], a); } }
function bahnRing(b, col, a, sz, gebrochen){ const n = Math.max(56, Math.round(b.r * 30));
  for(let s = 0; s < n; s++){ const t = s / n; if(gebrochen && (t > 0.08 && t < 0.2 || s % 2 === 0)) continue; aufBahn(b, t * TAU, TMP); P(TMP[0], TMP[1], TMP[2], sz, col[0], col[1], col[2], a); } }
/* Das Abbild eines Werks: seine Lichter aus dem Netz, auf den Radius r verkleinert */
function abbild(N, gi, c, r, a){ const m = N.mini[gi]; if(!m || !m.pts.length) return; const p = m.pts, k = p.length / 6, s = r / Math.max(0.2, N.rM[gi]), sz = Math.max(0.035, r * 0.16);
  for(let q = 0; q < k; q++) P(c[0] + p[q * 6] * s, c[1] + p[q * 6 + 1] * s, c[2] + p[q * 6 + 2] * s, sz, p[q * 6 + 3], p[q * 6 + 4], p[q * 6 + 5], a * 1.4 * Math.min(1, 10 / k)); }
/* Ein Umriss statt eines Kerns: so sieht Unbestätigtes aus */
function umriss(p, r, col, a, n = 10){ for(let k = 0; k < n; k++){ const t = k / n * TAU; P(p[0] + Math.cos(t) * r, p[1], p[2] + Math.sin(t) * r, r * 0.22, col[0], col[1], col[2], a); } }

/* Der Verschränkungsfaden: stehende Welle, Lichtpaare aus der Mitte, gleichzeitige Ankunft */
function verschraenkt(A0, B0, col, al, wall, RM, phase, zerbrochen){
  const d = Math.hypot(A0[0] - B0[0], A0[2] - B0[2]), lift = d * 0.2 + 0.6, n = Math.round(clamp(d * 7, 26, 180)), knoten = Math.max(3, Math.round(d / 1.1));
  const pt = (t, o) => { o[0] = mix(A0[0], B0[0], t); o[1] = mix(A0[1], B0[1], t) + Math.sin(Math.PI * t) * lift; o[2] = mix(A0[2], B0[2], t); return o; };
  const sz = Math.max(0.07, CAM.S * 0.0032), atem = RM ? 0.7 : 0.5 + 0.5 * Math.cos(wall * ATEM + phase);
  for(let s = 1; s < n; s++){ const t = s / n; if(zerbrochen && (t > 0.42 && t < 0.58 || s % 3 === 0)) continue;
    const welle = zerbrochen ? 0.5 : 0.22 + 0.78 * Math.abs(Math.sin(Math.PI * knoten * t)) * atem; pt(t, TMP); P(TMP[0], TMP[1], TMP[2], sz, col[0], col[1], col[2], al * welle); }
  if(zerbrochen || RM) return;
  for(let q = 0; q < 2; q++){ const u = (wall * 0.2 + q * 0.5 + phase / TAU) % 1, hell = al * 2.4 * (1 - 0.5 * u);
    pt(0.5 - 0.5 * u, TMP); P(TMP[0], TMP[1], TMP[2], sz * 2.6, col[0], col[1], col[2], hell);
    pt(0.5 + 0.5 * u, TMP); P(TMP[0], TMP[1], TMP[2], sz * 2.6, col[0], col[1], col[2], hell);
    if(u > 0.9){ const k = (u - 0.9) * 10, f = Math.sin(Math.PI * k) * al * 3;   // an beiden Enden zugleich
      P(A0[0], A0[1], A0[2], sz * 7, col[0], col[1], col[2], f * 0.5); P(B0[0], B0[1], B0[2], sz * 7, col[0], col[1], col[2], f * 0.5); } }
}

/* Die Gestalt einer Entstehungsspur, nach ihrer Art */
function spurLicht(s, p, sz, al, wall, RM, an, c){
  const unbestaetigt = s.stand === 'proposed' && s.art !== 'gap', puls = RM ? 1 : 0.85 + 0.15 * Math.sin(wall * 1.3 + s.k);
  const H = an ? 1.5 : 1;
  switch(s.art){
    case 'origin': P(p[0], p[1], p[2], sz * 1.5, KEIMC[0], KEIMC[1], KEIMC[2], al * 1.9 * puls * H); P(p[0], p[1], p[2], sz * 5, KEIMC[0], KEIMC[1], KEIMC[2], al * 0.12 * H); umriss(p, sz * 2.4, KEIMC, al * 0.6, 6); break;
    case 'workpiece': P(p[0], p[1], p[2], sz * 1.8, WG[0], WG[1], WG[2], al * 2.0 * puls * H); P(p[0], p[1], p[2], sz * 5.5, WG[0], WG[1], WG[2], al * 0.12 * H); break;
    case 'encounter': for(let k = 0; k < 2; k++){ const a = (RM ? 0 : wall * 0.9) + k * Math.PI; P(p[0] + Math.cos(a) * sz * 1.6, p[1], p[2] + Math.sin(a) * sz * 1.6, sz * 1.1, WG[0], WG[1], WG[2], al * 1.5 * H); } break;
    case 'attempt': { const fl = RM ? 0.8 : 0.45 + 0.55 * Math.abs(Math.sin(wall * 2.3 + s.k * 1.7)); P(p[0], p[1], p[2], sz * 1.2, WG[0], WG[1], WG[2], al * 1.6 * fl * H); P(p[0] + sz * 1.8, p[1], p[2], sz * 0.6, WG[0], WG[1], WG[2], al * (1.4 - fl) * H); break; }
    case 'interpretation': P(p[0], p[1], p[2], sz * 1.0, SILVER[0], SILVER[1], SILVER[2], al * 1.5 * H); screenRing(p, sz * 2.6, SILVER, al * 0.55 * H); break;
    case 'counterevidence': P(p[0], p[1], p[2], sz * 1.3, ASCHE[0], ASCHE[1], ASCHE[2], al * 1.8 * puls * H); P(p[0], p[1], p[2], sz * 4, ASCHE[0], ASCHE[1], ASCHE[2], al * 0.1 * H); break;
    case 'gap': umriss(p, sz * 2.2, DUSTC, al * 0.75 * H, 14); break;   // eine offene Lücke: ein leerer Ring, kein Kern
    case 'reuse': { P(p[0], p[1], p[2], sz * 1.4, WG[0], WG[1], WG[2], al * 1.7 * H);
      if(!RM) for(let q = 0; q < 2; q++){ const u = (wall * 0.35 + q * 0.5) % 1, r = sz * (2 + 6 * u), a = Math.atan2(p[2] - c[2], p[0] - c[0]);   // nach außen: weiter verwendet
        P(p[0] + Math.cos(a) * r, p[1], p[2] + Math.sin(a) * r, sz * 0.7, WG[0], WG[1], WG[2], al * (1 - u) * H); } break; }
    default: P(p[0], p[1], p[2], sz, WG[0], WG[1], WG[2], al * 1.2 * H);
  }
  if(unbestaetigt) umriss(p, sz * 2.8, SILVER, al * 0.5 * H, 12);   // vorgeschlagen: ein Umriss um alles
}

/* ------------------------------------------------------------------ Bild */
export function baueAlsformen(N, A, U, wall, vis, RM){
  U.echos.length = A.teilnahmen.length; U.spuren.length = A.spuren.length; U.alsSchilder.length = 0;
  if(vis <= 0.003 || !A || (!A.teilnahmen.length && !A.spuren.length)){ U.echos.fill(null); U.spuren.fill(null); return; }
  const fk = U.als ? (U.alsK ?? 1) : 0, fokusId = U.als ? U.als.gi : -1, planet = U.als && U.als.fokus === 'planet';
  const imDach = U.dach, hov = U.hover, sel = U.sel;
  const gewaehlt = a => (sel && sel.art === a.art && sel.i === a.i) || (hov && hov.art === a.art && hov.i === a.i);
  // Welcher Gegenstand ist gerade gemeint: der Blick, die Wahl oder der Zeiger
  const gemeint = new Set(); if(fokusId >= 0 && !planet) gemeint.add(fokusId);   // als Planet zählt, was um das Werk kreist, nicht wo es selbst teilnimmt
  for(const x of [sel, hov]){ if(!x) continue; if(x.art === 'mond') gemeint.add(x.i); if(x.art === 'echo' && A.teilnahmen[x.i]) gemeint.add(A.teilnahmen[x.i].gegenstand); }
  const bezirkHell = i => imDach == null || N.bezirk(i) === imDach ? 1 : 0.3;
  const sichtbar = i => { const p = N.pos[i], dc = Math.hypot(p[0] - CAM.P[0], p[1] - CAM.P[1], p[2] - CAM.P[2]); return sstep(CAM.S * 0.03, CAM.S * 0.3, dc); };
  const sz = Math.max(0.11, CAM.S * 0.0042), E = [0, 0, 0], H = [0, 0, 0];

  // Erscheinungen auf ihren Bahnen
  A.teilnahmen.forEach((t, ti) => {
    const meint = gemeint.has(t.gegenstand), imBlick = fokusId >= 0 && (planet ? t.kontext === fokusId : t.gegenstand === fokusId);
    if(t.stand === 'withdrawn' && !meint && !imBlick && !(sel && sel.art === 'echo' && sel.i === ti)){ U.echos[ti] = null; return; }   // Asche nur, wenn man den Gegenstand oder seinen Zusammenhang ansieht
    const col = t.stand === 'withdrawn' ? ASCHE : werkFarbe(N, t.gegenstand), b = bahn(N, A, ti), an = gewaehlt({art: 'echo', i: ti});
    let a = vis * sichtbar(t.kontext) * Math.min(bezirkHell(t.kontext), 1) * (fokusId >= 0 ? (imBlick ? 1.25 : 0.12) : 1) * (an ? 1.5 : 1);
    if(a <= 0.004){ U.echos[ti] = null; return; }
    const atem = RM ? 1 : 0.78 + 0.22 * Math.sin(wall * ATEM + phase0(t.gegenstand));
    bahnRing(b, t.stand === 'withdrawn' ? ASCHE : mixc(col, SILVER, 0.4), a * (meint || an ? 0.32 : 0.09), sz * 0.42, t.stand === 'withdrawn');
    echoPos(N, A, ti, wall, RM, E);
    // Die Erscheinung trägt die Gestalt ihres Gegenstands im Kleinen: dieselben Lichter, nicht nur dieselbe Farbe
    const rE = clamp(N.rM[t.gegenstand] * 0.42, sz * 2.6, 1.15);   // ein Mond: etwa zwei Fünftel seines eigenen Werks
    if(t.stand !== 'withdrawn') abbild(N, t.gegenstand, E, rE, a * (t.stand === 'active' ? 1 : 0.5) * atem);
    if(t.stand === 'active'){ P(E[0], E[1], E[2], sz * 1.3, col[0], col[1], col[2], a * 1.7 * atem); P(E[0], E[1], E[2], rE * 3.2, col[0], col[1], col[2], a * 0.08 * atem); screenRing(E, rE * 1.25, mixc(col, WG, 0.55), a * 0.6 * atem); }
    else if(t.stand === 'proposed'){ P(E[0], E[1], E[2], sz * 0.8, col[0], col[1], col[2], a * 0.4 * atem); umriss(E, rE * 1.25, mixc(col, WG, 0.4), a * 0.9 * atem, 18); }
    else { P(E[0], E[1], E[2], sz * 0.9, ASCHE[0], ASCHE[1], ASCHE[2], a * 0.7); umriss(E, sz * 1.7, ASCHE, a * 0.35, 7); }
    if(an) screenRing(E, clamp(N.rM[t.gegenstand] * 0.42, sz * 2.6, 1.15) * 1.6, SILVER, 0.45 * vis);
    U.echos[ti] = toScreen(E[0], E[1], E[2]);
    // Der Faden zum Gegenstand selbst, nur wenn er gemeint ist
    if(meint || an || imBlick){ const g = N.pos[t.gegenstand]; H[0] = g[0]; H[1] = g[1] + N.rM[t.gegenstand] * 0.2; H[2] = g[2];
      verschraenkt(H, [E[0], E[1], E[2]], t.stand === 'withdrawn' ? ASCHE : mixc(col, SILVER, 0.55), vis * (t.stand === 'withdrawn' ? 0.3 : t.stand === 'proposed' ? 0.5 : 0.75) * (an ? 1.4 : 1), wall, RM, phase0(t.gegenstand), t.stand === 'withdrawn');
      if(fokusId >= 0 && imBlick || an) U.alsSchilder.push({art: 'echo', i: ti, p: U.echos[ti], titel: `als ${t.rolle}`, unter: t.stand === 'active' ? '' : t.stand === 'proposed' ? 'vorgeschlagen' : 'zurückgenommen', prio: an ? 0 : 1}); }
  });
  // Am Gegenstand selbst: atmet im Takt seiner Erscheinungen, solange er welche hat
  for(const [gi, liste] of A.proGegenstand){ if(!liste.some(ti => A.teilnahmen[ti].stand !== 'withdrawn')) continue;
    const g = N.pos[gi], a = vis * sichtbar(gi) * bezirkHell(gi) * (fokusId >= 0 ? (fokusId === gi || gemeint.has(gi) ? 1.2 : 0.15) : 0.8), col = werkFarbe(N, gi);
    const atem = RM ? 1 : 0.6 + 0.4 * Math.sin(wall * ATEM + phase0(gi)); if(a <= 0.004) continue;
    screenRing([g[0], g[1] + N.rM[gi] * 0.2, g[2]], N.rM[gi] * 1.9, mixc(col, SILVER, 0.4), a * 0.22 * atem, 1);
  }

  // Entstehung: Spiralen um die Werke, die Spuren haben
  for(const [gi, liste] of A.entstehung){
    const ganz = planet && fokusId === gi, beteiligt = fokusId >= 0 && U.als.set && U.als.set.has(gi);
    let a = vis * sichtbar(gi) * bezirkHell(gi) * (ganz ? 1.25 : fokusId >= 0 ? (beteiligt ? 0.45 : 0.08) : 0.42);
    if(a <= 0.004){ liste.forEach(si => { U.spuren[si] = null; }); continue; }
    const sp = spirale(N, gi), dreh = RM ? 0 : wall * 0.012, col = werkFarbe(N, gi);
    // Der Planet: im Planetenblick eine Hülle, die am Saum leuchtet
    if(ganz){ const R = sp.huelle, cx = CAM.P[0], cy = CAM.P[1], cz = CAM.P[2];
      for(let k = 0; k < HUELLE.length / 3; k++){ const ux = HUELLE[k * 3], uy = HUELLE[k * 3 + 1], uz = HUELLE[k * 3 + 2], x = sp.c[0] + ux * R, y = sp.c[1] + uy * R * 0.62, z = sp.c[2] + uz * R;
        const vx = cx - x, vy = cy - y, vz = cz - z, vl = Math.hypot(vx, vy, vz) || 1, fr = Math.pow(1 - Math.abs((ux * vx + uy * vy * 0.62 + uz * vz) / vl), 2.6);
        if(fr > 0.12) P(x, y, z, R * 0.012, col[0], col[1], col[2], fr * a * 0.5); }
      P(sp.c[0], sp.c[1], sp.c[2], R * 2.4, col[0], col[1], col[2], a * 0.05 * fk); }
    // Die Spur: eine Spirale von außen nach innen, Materie sinkt langsam hinein
    const n = 220, spurC = mixc(col, WG, 0.55); for(let s = 0; s <= n; s++){ const f = -0.12 + 1.24 * s / n; spiralPunkt(sp, f, dreh, TMP); P(TMP[0], TMP[1], TMP[2], sz * 0.42, spurC[0], spurC[1], spurC[2], a * 0.3 * (0.45 + 0.55 * clamp(1 - f, 0, 1))); }
    if(!RM) for(let q = 0; q < 4; q++){ const u = (wall * 0.045 + q / 4 + gi * 0.13) % 1, f = 1.08 - 1.2 * u; spiralPunkt(sp, f, dreh, TMP); P(TMP[0], TMP[1], TMP[2], sz * 1.1, col[0], col[1], col[2], a * 0.9 * Math.sin(Math.PI * u)); }
    // Die Spuren selbst
    for(const si of liste){ const s = A.spuren[si], an = gewaehlt({art: 'spur', i: si}); spurPos(N, A, si, wall, RM, E);
      if(s.ereignis.art !== 'offen'){ for(let k = 1; k < 9; k++) P(E[0], E[1] - (E[1] + 0.02) * k / 9, E[2], sz * 0.32, WG[0], WG[1], WG[2], a * 0.35); P(E[0], 0, E[2], sz * 0.9, WG[0], WG[1], WG[2], a * 0.5); }   // verankert: die Ereigniszeit ist bekannt
      if(s.art === 'origin'){ for(let k = 1; k < 24; k++){ const t = k / 24; P(mix(E[0], sp.c[0], t), mix(E[1], sp.c[1], t), mix(E[2], sp.c[2], t), sz * 0.3, KEIMC[0], KEIMC[1], KEIMC[2], a * 0.22); } }   // der Ursprung reicht bis in den Kern
      for(const j of s.widerspricht){ spurPos(N, A, j, wall, RM, H); for(let k = 1; k < 30; k++){ const t = k / 30; if(t > 0.42 && t < 0.58) continue;
        P(mix(E[0], H[0], t), mix(E[1], H[1], t) + Math.sin(Math.PI * t) * 0.35, mix(E[2], H[2], t), sz * 0.4, ASCHE[0], ASCHE[1], ASCHE[2], a * 0.55); } }
      spurLicht(s, E, sz, a, wall, RM, an, sp.c);
      if(an) screenRing(E, sz * 3.8, SILVER, 0.5 * vis);
      U.spuren[si] = toScreen(E[0], E[1], E[2]);
      if(ganz || an) U.alsSchilder.push({art: 'spur', i: si, p: U.spuren[si], titel: s.artWort + (s.stand === 'proposed' && s.art !== 'proposal' ? ' · vorgeschlagen' : ''), unter: kurz(s.titel.replace(/^(Deutung|Gegenlesart|Offen)\s*·\s*/, ''), 40), prio: an ? 0 : 2 + s.k * 0.01}); }
  }
}
