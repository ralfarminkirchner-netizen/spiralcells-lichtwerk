/* =====================================================================
   NETZ — Ralfs System als eine Zelle aus Zellen.
   In der Mitte die Zentrale. Um sie die Dächer (große Überordner wie FASKA),
   jedes eine eigene Hülle; darin die Bereiche, darin die Werke. Jedes Werk zeigt
   im Kleinen seinen eigenen Wuchs (Ranken, Gabeln, Fächer), nicht seine Kennung.
   Lesematerial liegt als Korn an dem Werk, aus dem es stammt oder in das es eingeht.
   Was noch keinem Dach belegt zugeordnet ist, liegt ehrlich außen „ohne Dach“.
   Fäden zwischen Werken zeigen Typ und Richtung: Material fließt, ein Verweis zeigt,
   Zugehörigkeit steht still.
   ===================================================================== */
import {TAU, clamp, mix, sstep, hash, mixc, P, CAM, toScreen, screenRing, WG, KEIMC, GOLDC, SILVER, DUSTC, ASCHE} from './licht.js';
import {VOICES, fibSphere} from './zelle.js';
import {MENSCH} from './daten.js';
import {wuchs, rangRadien} from './wuchs.js';
import {ordne, lage} from './ordnung.js';

const MEM2 = fibSphere(4200), MEMD = fibSphere(900);
const SEEDC = VOICES.map(v => v.c);
const TURN = 1.75, SPOKE = 144;

/* Ein Werk im Kleinen: sein Wuchs, ein Punkt je Ausprägung, Stiele dazwischen */
function miniWuchs(m, rM){
  const n = m.samen.length; if(!n) return {pts: new Float32Array(0), stiel: new Float32Array(0)};
  const W = wuchs(m), rr = rangRadien(Array.from(W.s1)), curl = m.winkel == null ? 0.42 : clamp((SPOKE - m.winkel) / (SPOKE - 137.50776), 0, 1);
  const pos = i => { const r = rM * rr[i], a = W.th1[i] + curl * rr[i] * TURN; return [r * Math.cos(a), r * Math.sin(a)]; };
  const schritt = Math.max(1, Math.ceil(n / 160)), pts = [], stiel = [];
  for(let i = 0; i < n; i++){
    const s = m.samen[i], [x, z] = pos(i);
    const c = s.form ? SILVER : typeof s.stimme === 'number' ? SEEDC[s.stimme] : s.stimme === MENSCH ? SILVER : DUSTC, g = s.status === 'grundformation' ? 0.5 : 0;
    if(i % schritt === 0 || W.kinder[i].length > 1 || W.art[i] === 'gabel') pts.push(x, (i / n) * rM * 0.35, z, mix(c[0], GOLDC[0], g), mix(c[1], GOLDC[1], g), mix(c[2], GOLDC[2], g));
    const p = W.eltern[i]; if(W.art[i] === 'frei' || n > 400) continue;
    const [px, pz] = p >= 0 ? pos(p) : [0, 0], k = W.art[i] === 'reihe' ? 1 : 2;
    for(let q = 1; q <= k; q++){ const t = q / (k + 1); stiel.push(mix(px, x, t), 0, mix(pz, z, t), c[0], c[1], c[2]); }
  }
  return {pts: new Float32Array(pts), stiel: new Float32Array(stiel)};
}

export class Netz {
  constructor(B, O){
    this.B = B; const N = B.monde.length; this.N = N;
    this.baum = ordne(B, O);
    this.rM = B.monde.map(m => { const zeichen = m.samen.reduce((a, s) => a + s.laenge, 0), k = clamp(Math.round(10 + 7 * Math.sqrt(m.samen.length + 1) + Math.sqrt(zeichen) / 30), 12, 140);
      return (0.45 + 1.0 * Math.sqrt(k / 140)) * (m.stimmen.length ? 1.25 : 1); });
    // Lesematerial ist kein Werk: es wird ein kleines Korn
    for(const i of this.baum.material.keys()) this.rM[i] = 0.32;
    this.L = lage(this.baum, this.rM.map(r => r * 1.15), {gapWerk: 0.3, gapBereich: 0.7, gapDach: 2.0});
    this.pos = this.L.pos.map((p, i) => [p[0], (hash(i * 3.7) - 0.5) * 0.25, p[2]]);
    this.mini = B.monde.map((m, i) => this.baum.material.has(i) ? {pts: new Float32Array(0), stiel: new Float32Array(0)} : miniWuchs(m, this.rM[i]));
    this.R2 = this.L.R; this.H2 = 0; this.mitte = [0, 0, 0]; this.Rm2 = this.L.R * 1.08;
    // Dächer und Bereiche mit Namen
    this.daecher = this.baum.daecher.map((d, j) => ({...d, ...this.L.daecher[j], bereiche: d.bereiche.map((b, bi) => ({...b, ...this.L.daecher[j].bereiche[bi]}))}));
    // Fäden über Werkgrenzen: je Werkpaar, Typ und Richtung; Material fließt von der Quelle zur neuen Fassung
    const idx = new Map(B.monde.map((m, i) => [m.id, i])), buendel = new Map();
    for(const e of B.roh.edges){ const a = idx.get(B.werkVon(e.from_variant_id)), b = idx.get(B.werkVon(e.to_variant_id)); if(a == null || b == null || a === b) continue;
      const fliesst = e.edge_type === 'remixt-aus' || e.edge_type === 'erweitert';
      const von = fliesst ? b : a, nach = fliesst ? a : b, k = `${von}>${nach}:${e.edge_type}`;
      const f = buendel.get(k) || {von, nach, typ: e.edge_type, kanten: [], verwendung: 0}; f.kanten.push(e); if(e.usage) f.verwendung++; buendel.set(k, f); }
    this.faeden = [...buendel.values()];
    this.stimmAnteil = VOICES.map((_, i) => B.monde.filter(m => m.stimmen.includes(i)).length);
    const mx = Math.max(1, ...this.stimmAnteil); this.stimmAnteil = this.stimmAnteil.map(x => x / mx);
    this.tueren = [];
  }
  index(id){ return this.B.monde.findIndex(m => m.id === id); }
  /* Türen in den Verbund sitzen an der Mitte: sie sind Organe der Zentrale */
  tuerPos(i, o){ const n = Math.max(1, this.tueren.length), Rm = this.L.mitte.R, a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.55;
    o[0] = Math.cos(a) * Rm * 0.82; o[1] = Rm * 0.55; o[2] = Math.sin(a) * Rm * 0.82; return o; }
  dachVon(i){ const o = this.baum.ort[i]; return o && o.ebene === 'dach' ? o.dach : -1; }
}

const TMP = [0, 0, 0, 0];
/* Die fünf Stimmen kreisen um die Mitte: der Verbund arbeitet von der Zentrale aus */
export function bigHead(N, i, t, o){ const Rm = N.L.mitte.R, th = t * TAU / 16 + 0.6 + i * 0.4, bp = t * TAU * 0.3 + i * TAU / 5, rho = Rm * (0.62 + 0.03 * Math.cos(bp));
  o[0] = rho * Math.cos(th); o[1] = Rm * (0.32 + 0.05 * Math.sin(bp) - 0.03 * i); o[2] = rho * Math.sin(th); return o; }

/* Ein Ring am Boden, auf Wunsch gestrichelt (luecke: jeder n-te Punkt fehlt) */
function ring(c, R, col, a, sz, luecke){ const n = Math.max(60, Math.round(R * 22));
  for(let s = 0; s < n; s++){ if(luecke > 1 && s % (luecke + 1) === 0) continue; const t = s / n * TAU; P(c[0] + Math.cos(t) * R, c[1], c[2] + Math.sin(t) * R, sz, col[0], col[1], col[2], a); } }
function huelle(c, R, yS, col, a, pts, cx, cyy, cz){
  for(let k = 0; k < pts.length / 3; k++){ const ux = pts[k * 3], uy = pts[k * 3 + 1], uz = pts[k * 3 + 2];
    const x = c[0] + ux * R, y = c[1] + uy * R * yS, z = c[2] + uz * R;
    const vx = cx - x, vy = cyy - y, vz = cz - z, vl = Math.hypot(vx, vy, vz) || 1, fres = Math.pow(1 - Math.abs((ux * vx + uy * vy * yS + uz * vz) / vl), 3.0);
    P(x, y, z, R * 0.011, col[0], col[1], col[2], (0.004 + fres) * a * 0.8); }
}

export function baueNetz(N, U, wall, vis, aktiv, aktivDetail){
  if(vis <= 0.003) return;
  const cx = CAM.P[0], cyy = CAM.P[1], cz = CAM.P[2], soloAny = U.solo >= 0;
  const hov = U.hover && U.hover.art === 'mond' ? U.hover.i : -1, imDach = U.dach != null ? U.dach : -1;
  const hovD = U.hover && U.hover.art === 'dach' ? U.hover.i : -1, selD = U.sel && U.sel.art === 'dach' ? U.sel.i : -1;
  // Mitte: die Zentrale, ein warmer Keim mit eigener Hülle
  const Lm = N.L.mitte, puls = U.RM ? 0.85 : 0.75 + 0.25 * Math.sin(wall * 0.9), hovM = U.hover && U.hover.art === 'mitte', selM = U.sel && U.sel.art === 'mitte';
  P(0, 0, 0, Lm.R * 0.12, KEIMC[0], KEIMC[1], KEIMC[2], 0.8 * vis * puls * (hovM || selM ? 1.5 : 1));
  P(0, 0, 0, Lm.R * 1.6, KEIMC[0], KEIMC[1], KEIMC[2], 0.05 * vis);
  ring([0, -0.05, 0], Lm.R, KEIMC, (hovM || selM ? 0.9 : 0.55) * vis * (imDach >= 0 ? 0.4 : 1), 0.09, 1);
  huelle([0, 0, 0], Lm.R, 0.42, WG, (hovM || selM ? 0.9 : 0.5) * vis * (imDach >= 0 ? 0.4 : 1), MEMD, cx, cyy, cz);
  U.mitteSchirm = toScreen(0, Lm.R * 0.42, 0);
  // Dächer: je eine Hülle, Bereiche als leise Ringe am Boden
  for(let j = 0; j < N.daecher.length; j++){ const d = N.daecher[j], hell = j === imDach ? 1.35 : imDach >= 0 ? 0.35 : 1, an = j === hovD || j === selD;
    const c = an ? mixc(WG, SILVER, 0.4) : WG;
    // Ein Dach ist eine eigene Zelle: leuchtender Rand am Boden, Innenglühen, Hülle darüber
    P(d.mitte[0], 0, d.mitte[2], d.R * 1.7, c[0], c[1], c[2], 0.03 * vis * hell * (an ? 1.6 : 1));
    ring([d.mitte[0], -0.05, d.mitte[2]], d.R, c, (an ? 0.75 : 0.42) * vis * hell, 0.11, 1);
    huelle(d.mitte, d.R, 0.38, c, (an ? 0.95 : 0.55) * vis * hell, MEMD, cx, cyy, cz);
    for(const b of d.bereiche) ring([b.mitte[0], -0.05, b.mitte[2]], b.R, WG, 0.16 * vis * hell, 0.06, 2);
    U.daecherSchirm[j] = toScreen(d.mitte[0], d.R * 0.42, d.mitte[2]); }
  U.daecherSchirm.length = N.daecher.length;
  if(N.L.ohne){ const o = N.L.ohne; ring([o.mitte[0], -0.05, o.mitte[2]], o.R, DUSTC, 0.2 * vis, 0.07, 3);
    U.ohneSchirm = toScreen(o.mitte[0], o.R * 0.3, o.mitte[2]); } else U.ohneSchirm = null;
  // Werke
  for(let n = 0; n < N.N; n++){
    const m = N.B.monde[n], o = N.pos[n], pts = N.mini[n].pts, k = pts.length / 6, material = N.baum.material.has(n);
    const self = n === aktiv, fade = self ? (1 - aktivDetail) : 1; if(fade <= 0.01){ U.monde[n] = null; continue; }
    const dj = N.dachVon(n), dachHell = imDach < 0 ? 1 : dj === imDach ? 1.2 : 0.3;
    const dc = Math.hypot(o[0] - cx, o[1] - cyy, o[2] - cz), near = sstep(CAM.S * 0.03, CAM.S * 0.3, dc);
    let a = vis * fade * (self ? 1 : near) * dachHell;
    if(soloAny) a *= m.stimmen.includes(U.solo) ? 1.3 : 0.18;
    if(material){ P(o[0], o[1], o[2], 0.16, DUSTC[0], DUSTC[1], DUSTC[2], a * 0.9); P(o[0], o[1], o[2], 0.5, DUSTC[0], DUSTC[1], DUSTC[2], a * 0.05);
      if(hov === n || self) screenRing(o, 0.35, WG, 0.4 * vis); U.monde[n] = toScreen(o[0], o[1], o[2]); continue; }
    const lit = (m.traumfeld ? 1.4 : 2.2) * (hov === n ? 1.7 : 1) * (self ? 1.4 : 1);
    if(k){ let r = 0, g = 0, b = 0; for(let p = 0; p < k; p++){ r += pts[p * 6 + 3]; g += pts[p * 6 + 4]; b += pts[p * 6 + 5]; } P(o[0], o[1] + N.rM[n] * 0.15, o[2], N.rM[n] * 2.0, r / k, g / k, b / k, a * (m.traumfeld ? 0.12 : 0.2)); }
    const sz = 0.17 * Math.max(0.7, N.rM[n]);
    for(let p = 0; p < k; p++) P(o[0] + pts[p * 6], o[1] + pts[p * 6 + 1], o[2] + pts[p * 6 + 2], sz, pts[p * 6 + 3], pts[p * 6 + 4], pts[p * 6 + 5], a * lit * (U.RM ? 0.9 : 0.8 + 0.2 * Math.sin(wall * 0.7 + p * 0.37 + n)));
    const st = N.mini[n].stiel; for(let p = 0; p < st.length / 6; p++) P(o[0] + st[p * 6], o[1] + st[p * 6 + 1], o[2] + st[p * 6 + 2], sz * 0.45, st[p * 6 + 3], st[p * 6 + 4], st[p * 6 + 5], a * 0.35);
    P(o[0], o[1], o[2], 0.2, KEIMC[0], KEIMC[1], KEIMC[2], a * (m.keimKristall ? 1.5 : 0.8));
    const rc = m.reife === 'kanonisch' ? GOLDC : WG;
    if(!m.traumfeld || hov === n) screenRing([o[0], o[1] + N.rM[n] * 0.2, o[2]], N.rM[n] * 1.3, rc, 0.28 * a, Math.max(0.06, m.phase));
    if(self || hov === n){ const pu = U.RM ? 0.5 : 0.5 + 0.5 * Math.sin(wall * 2.4); screenRing([o[0], o[1] + N.rM[n] * 0.2, o[2]], N.rM[n] * (1.6 + 0.12 * pu), SILVER, (self ? 0.5 : 0.35) * vis); }
    const neu = N.neu && N.neu.get(m.id);
    if(neu){ const s1 = neu.find(x => typeof x.stimme === 'number'), c = s1 ? SEEDC[s1.stimme] : WG, pl = U.RM ? 0.8 : 0.65 + 0.35 * Math.sin(wall * 1.6 + n), mt = [o[0], o[1] + N.rM[n] * 0.2, o[2]];
      screenRing(mt, N.rM[n] * 2.0, c, 1.0 * vis * fade * pl); screenRing(mt, N.rM[n] * 2.3, c, 0.4 * vis * fade * pl); }
    else if(N.zuletzt && N.zuletzt.has(m.id)){ const s1 = N.zuletzt.get(m.id).find(x => typeof x.stimme === 'number'), c = s1 ? SEEDC[s1.stimme] : WG;
      screenRing([o[0], o[1] + N.rM[n] * 0.2, o[2]], N.rM[n] * 2.0, c, 0.34 * vis * fade); }
    U.monde[n] = toScreen(o[0], o[1], o[2]);
  }
  // Fäden zwischen Werken: Typ, Richtung, Verwendung
  U.knoten.length = 0;
  for(let fi = 0; fi < N.faeden.length; fi++){ const f = N.faeden[fi], A = N.pos[f.von], Bp = N.pos[f.nach];
    const d = Math.hypot(A[0] - Bp[0], A[2] - Bp[2]), n = Math.round(clamp(d * 5, 14, 120)), lift = d * 0.16 + 0.4;
    const anF = U.sel && U.sel.art === 'faden' && U.sel.i === fi, hovF = U.hover && U.hover.art === 'faden' && U.hover.i === fi;
    const beteiligt = aktiv === f.von || aktiv === f.nach || (U.sel && U.sel.art === 'mond' && (U.sel.i === f.von || U.sel.i === f.nach));
    const dimm = imDach >= 0 && N.dachVon(f.von) !== imDach && N.dachVon(f.nach) !== imDach ? 0.25 : 1;
    const st = STIL[f.typ] || STIL['verweist-auf'];
    const al = vis * (st.a + 0.03 * Math.min(6, f.kanten.length)) * (soloAny ? 0.3 : 1) * (anF || hovF ? 2.6 : beteiligt ? 1.8 : 1) * dimm;
    const pt = t => [mix(A[0], Bp[0], t), mix(A[1], Bp[1], t) + Math.sin(Math.PI * t) * lift, mix(A[2], Bp[2], t)];
    for(let s = 1; s < n; s++){ const t = s / n; if(st.luecke && t > 0.44 && t < 0.56) continue; if(st.strich && (s % 4 === 0)) continue;
      const q = pt(t), mund = 0.6 + 0.6 * t;   // zur Mündung hin heller: dorthin zeigt der Faden
      P(q[0], q[1], q[2], 0.035, st.c[0], st.c[1], st.c[2], al * mund); }
    // Bewegung: Material fließt, ein Verweis zeigt; Zugehörigkeit steht still
    if(st.fluss && !U.RM){ const z = st.fluss === 'material' ? 3 : 1; for(let q = 0; q < z; q++){ const t = ((wall * (st.fluss === 'material' ? 0.12 : 0.07) + q / z + fi * 0.137) % 1), p3 = pt(t);
      P(p3[0], p3[1], p3[2], st.fluss === 'material' ? 0.11 : 0.07, st.c[0], st.c[1], st.c[2], al * 3.2 * Math.sin(Math.PI * t)); } }
    // Knoten in der Mitte: anfassbar; mit Verwendung (Zweck, Teile, Grenzen) heller
    const km = pt(0.5); P(km[0], km[1], km[2], f.verwendung ? 0.16 : 0.1, st.c[0], st.c[1], st.c[2], al * (f.verwendung ? 3.0 : 1.6));
    if(f.verwendung) screenRing(km, 0.2, st.c, al * 1.4);
    U.knoten[fi] = toScreen(km[0], km[1], km[2]); }
  // Hülle des Ganzen
  const Rm2 = N.Rm2 * (1 + 0.01 * Math.sin(TAU * wall / 6.85));
  for(let k = 0; k < MEM2.length / 3; k++){ const ux = MEM2[k * 3], uy = MEM2[k * 3 + 1], uz = MEM2[k * 3 + 2];
    const x = ux * Rm2, y = uy * Rm2 * 0.45, z = uz * Rm2;
    const vx = cx - x, vy = cyy - y, vz = cz - z, vl = Math.hypot(vx, vy, vz) || 1, fres = Math.pow(1 - Math.abs((ux * vx + uy * vy * 0.45 + uz * vz) / vl), 4.0);
    const lum = (0.004 + fres) * vis * 0.32 * (imDach >= 0 ? 0.4 : 1); P(x, y, z, Rm2 * 0.0035, WG[0] * lum, WG[1] * lum * 0.97, WG[2] * lum * 0.98, 0.7); }
  // Die fünf Stimmen um die Mitte
  for(let i = 0; i < 5; i++){ const c = mixc(VOICES[i].c, WG, 0.35), al = vis * (0.25 + 0.75 * N.stimmAnteil[i]) * U.soloA[i] * (imDach >= 0 ? 0.4 : 1);
    for(let k = 0; k < 90; k++){ bigHead(N, i, wall - k * 0.018, TMP); const age = k / 90; P(TMP[0], TMP[1], TMP[2], N.L.mitte.R * mix(0.03, 0.006, age), c[0], c[1], c[2], Math.pow(1 - age, 1.5) * al * 0.6); }
    bigHead(N, i, wall, TMP); P(TMP[0], TMP[1], TMP[2], N.L.mitte.R * 0.1, c[0], c[1], c[2], 2.0 * al);
    U.bigHeads[i] = toScreen(TMP[0], TMP[1], TMP[2]); }
  // Türen in den Verbund, an der Mitte
  for(let i = 0; i < N.tueren.length; i++){ const t = N.tueren[i]; N.tuerPos(i, TMP); const wach = t.wach === true;
    const c = wach ? KEIMC : DUSTC, pu = wach ? 0.75 + 0.25 * Math.sin(wall * 1.3 + i) : 0.35, h = U.hover && U.hover.art === 'tuer' && U.hover.i === i;
    P(TMP[0], TMP[1], TMP[2], N.L.mitte.R * 0.05, c[0], c[1], c[2], vis * pu * (h ? 2.2 : 1.2));
    screenRing([TMP[0], TMP[1], TMP[2]], N.L.mitte.R * 0.08, wach ? GOLDC : DUSTC, vis * (h ? 0.6 : 0.25));
    U.tueren[i] = toScreen(TMP[0], TMP[1], TMP[2]); }
}

/* Fadenstile: Material fließt (übernommen, erweitert), Verweis zeigt, Prüfen tickt, Widerspruch bricht, Zugehörigkeit steht */
const STIL = {
  'remixt-aus':   {c: mixc(WG, KEIMC, 0.6), a: 0.16, fluss: 'material'},   // warmes Weiß, nie Gold: Gold bleibt Ralfs Kristallisieren
  'erweitert':    {c: WG, a: 0.12, fluss: 'material'},
  'verweist-auf': {c: mixc(WG, SILVER, 0.5), a: 0.07, fluss: 'zeigt'},
  'testet':       {c: mixc(SILVER, WG, 0.3), a: 0.1, fluss: 'zeigt', strich: true},
  'widerspricht': {c: ASCHE, a: 0.12, luecke: true},
  'gehört-zu':    {c: SILVER, a: 0.08, strich: true},
};
export const FADEN_SATZ = {'remixt-aus': 'übernimmt Material aus', 'erweitert': 'erweitert', 'verweist-auf': 'verweist auf', 'testet': 'prüft', 'widerspricht': 'widerspricht', 'gehört-zu': 'gehört zu'};
