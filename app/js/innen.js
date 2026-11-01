/* =====================================================================
   INNEN — ein Gebäude von innen: derselbe Mechanismus wie die Spirale, als Haus.
   Etage = Zeitabschnitt, von unten nach oben; ihre Zahl ist die Arbeit. Abteilung = Stimme, sie liegt auf jeder Etage an derselben Stelle.
   Schreibtisch = Fassung. Karteistapel = ihre Textmenge. Der Faden von Tisch zu Tisch = belegte Abstammung.
   In der Mitte steigt die Wendeltreppe: die Spirale, an der alles hängt.
   Campus: runder Bau um ein Atrium. Büro: langer Riegel mit Abteilungsbuchten in strengen Reihen. Dorf: ein Haus aus Holz mit wenigen Stockwerken, Kammer = Stimme, Werkbank = Fassung.
   Rechnet nur, speichert nichts. Läuft im Browser und in Node.
   ===================================================================== */
import {clamp, lin} from './licht.js';
import {STIMMEN, MENSCH} from './daten.js';
import {etagen} from './anlage.js';
import {blattFarbe} from './gelaende.js';
import {fassungsArbeit} from './mondbahn.js';
import {KISTE} from './bauplan.js';

const C = lin, HOEHE = 3.1, TOP = C('#b59a78'), GESTELL = C('#2a2a2c'), PAPIER = C('#d9d3c2'), STUHL = C('#1b1c20'), GOLD = C('#e8bd62');
export const ABTEILUNG = k => typeof k === 'number' ? STIMMEN[k].name : k === 'mensch' ? 'Ralf' : 'Quellen';
const gruppe = s => s.form ? 'mensch' : typeof s.stimme === 'number' ? s.stimme : s.stimme === MENSCH ? 'mensch' : 'quelle';
const farbeVon = k => typeof k === 'number' ? C(STIMMEN[k].hex) : k === 'mensch' ? C('#e4dfcc') : C('#8fae62');

export function innenPlan(N, n, stil, o){
  const dorf = stil === 'dorf', m = N.B.monde[n], E = etagen(m, N.mini[n].ar ?? 0.5, dorf ? 4 : 16), plan = N.mini[n].plan, rund = stil === 'campus', K = []; const kiste = (x, y, z, sx, sy, sz, yaw, c, form = 0) => K.push(o[0] + x, o[2] + z, 0, y, sx, sy, sz, yaw, c[0], c[1], c[2], form, n, 0);
  const abt = [...new Set(m.samen.map(gruppe))].sort((a, b) => (typeof a === 'number' ? a * 144 % 360 : 400) - (typeof b === 'number' ? b * 144 % 360 : 400)), meist = Math.max(1, ...E.map(e => e.fassungen.length));
  const zahlAbt = Math.max(1, abt.length), R = rund ? clamp(3.8 + Math.sqrt(meist) * 1.1, 4.8, 18) : 0, L = rund ? 0 : clamp(zahlAbt * (dorf ? 3.2 : 2.6) + Math.sqrt(meist) * 1.9, dorf ? 7 : 5.5, 34), T = rund ? 0 : clamp(3.2 + Math.sqrt(meist / zahlAbt) * 1.9, dorf ? 5.4 : 4.8, 16);
  const boden = rund ? C('#4a4038') : dorf ? C('#3c2e20') : C('#3f4246'), BEIN = dorf ? C('#4a3421') : GESTELL, tische = [], schilder = [], reihen = [];
  (E.length ? E : [{von: '', bis: '', fassungen: []}]).forEach((e, k) => { const y = k * HOEHE;
    // Boden
    if(rund){ kiste(0, y - 0.14, 0, (R + 0.5) * 2, 0.14, (R + 0.5) * 2, 0, boden, 4); kiste(0, y, 0, (R + 0.5) * 2, 0.9, (R + 0.5) * 2, 0, C('#57504a'), 6); }   // runder Boden um das Atrium, mit Brüstung
    else kiste(dorf ? -2.3 : 0, y - 0.14, 0, L + 1 + (dorf ? 4.6 : 0), 0.14, T + 1, 0, boden);
    if(dorf){ const w = C('#44352a'); kiste(-2.3, y, -(T + 1) / 2, L + 5.6, 2.7, 0.14, 0, w); kiste(-(L + 1) / 2 - 4.6, y, 0, 0.14, 1.5, T + 1, 0, w); kiste((L + 1) / 2, y, 0, 0.14, 1.5, T + 1, 0, w); stube(y, k); }   // Bretterwand, zur Kamera hin offen, links die Treppennische
    else if(!rund) bueroGrund(y);
    else campusGrund(y);
    // Stützen
    const st = rund ? 8 : 4; if(k) for(let j = 0; j < st; j++){ const a = j / st * Math.PI * 2 + 0.3; const x = rund ? Math.cos(a) * R : (j % 2 ? 1 : -1) * L * 0.5, z = rund ? Math.sin(a) * R : (j < 2 ? 1 : -1) * T * 0.5; kiste(x, y - HOEHE, z, 0.16, HOEHE, 0.16, 0, GESTELL); }
    // Wendeltreppe: eine Windung je Etage
    const stufen = 14, tr = rund ? 1.25 : 1.15, tx = rund ? 0 : -L * 0.5 - 2.1; for(let j = 0; j < stufen; j++){ const a = (k + j / stufen) * Math.PI * 2 * 0.92; kiste(tx + Math.cos(a) * tr, y + j / stufen * HOEHE, Math.sin(a) * tr, 1.1, 0.06, 0.34, Math.atan2(Math.cos(a), Math.sin(a)) + Math.PI / 2, dorf ? C('#5a4630') : C('#5e5b54')); }
    kiste(tx, y, 0, 0.1, HOEHE, 0.1, 0, C('#4a4842'));
    // Abteilungen: auf jeder Etage an derselben Stelle
    const proAbt = new Map(abt.map(a => [a, []])); e.fassungen.forEach(i => proAbt.get(gruppe(m.samen[i])).push(i));
    abt.forEach((a, ai) => { const li = proAbt.get(a), fc = farbeVon(a), an = rund ? (ai + 0.5) / zahlAbt * Math.PI * 2 : 0, bay = rund ? 0 : -L / 2 + (ai + 0.5) / zahlAbt * L, bb = rund ? 0 : L / zahlAbt;
      if(zahlAbt > 1){ if(rund){ const g = ai / zahlAbt * Math.PI * 2, rm = (R + 1.9) / 2; kiste(Math.cos(g) * rm, y, Math.sin(g) * rm, 0.05, 0.85, R - 1.9, Math.atan2(Math.cos(g), Math.sin(g)), C('#6c655c')); } else if(ai){ kiste(-L / 2 + ai / zahlAbt * L, y, 0, 0.05, 0.9, T * 0.86, 0, C('#6e747a')); } }
      // Teppich in der Farbe der Abteilung
      if(rund) kiste(0, y, 0, (R + 0.3) * 2, 0.012, Math.PI / zahlAbt * 0.97, -an, [fc[0] * 0.05 + 0.03, fc[1] * 0.05 + 0.03, fc[2] * 0.05 + 0.03], 5); else if(dorf) kiste(bay, y + 0.02, 0, bb * 0.74, 0.012, T * 0.62, 0, [fc[0] * 0.035 + 0.06, fc[1] * 0.035 + 0.04, fc[2] * 0.035 + 0.03]); else kiste(bay, y, 0, bb * 0.94, 0.012, T * 0.9, 0, [fc[0] * 0.05 + 0.035, fc[1] * 0.05 + 0.035, fc[2] * 0.05 + 0.035]);
      if(k === 0) schilder.push({abt: a, name: ABTEILUNG(a), x: rund ? Math.cos(an) * R * 0.98 : bay, z: rund ? Math.sin(an) * R * 0.98 : -T * 0.56});
      // Tische in Reihen; Rücken zur Mitte oder zum Gang
      const zwR = 1.85, zwT = 1.7; let q = 0; if(rund){ let r = 3.1; const sekt = Math.PI * 2 / zahlAbt * 0.86; while(q < li.length && r < R + 6){ const platz = Math.max(1, Math.floor(sekt * r / zwT)), hier = Math.min(platz, li.length - q); for(let h = 0; h < hier; h++){ const g = an + ((h + 0.5) / hier - 0.5) * sekt * Math.min(1, hier / Math.max(1, platz) * 1.15); legeTisch(li[q++], Math.cos(g) * r, Math.sin(g) * r, Math.atan2(Math.cos(g), Math.sin(g)), y, k, a); } r += zwR; } }
      else { const sp = Math.max(1, Math.floor(bb * 0.86 / 1.75)); li.forEach((i, h) => { const c = h % sp, re = Math.floor(h / sp); legeTisch(i, bay + (c - (Math.min(sp, li.length) - 1) / 2) * 1.75, -T * 0.34 + re * 1.75, 0, y, k, a); }); } });
    reihen.push({y, von: e.von, bis: e.bis, zahl: e.fassungen.length}); });
  if(dorf) kiste(-2.3, (E.length || 1) * HOEHE, 0, L + 6.2, 1.8, T + 1.8, 0, C('#6b4a30'), 1);   // das Dach; wer ein Stockwerk ansieht, sieht es nicht
  /* Grund: Einrichtung ohne Aussage, in jedem Haus gleich, in ruhigen Tönen. Eine Fassung ist nur die Werkbank oder der Tisch */
  function stube(y, k){ const dA = C('#3f2f1f'), dB = C('#3a2b1c'), zb = Math.ceil((T + 1) / 0.42), hinten = -(T + 1) / 2 + 0.09; for(let j = 0; j < zb; j++) kiste(-2.3, y + 0.002, -(T + 1) / 2 + (j + 0.5) * (T + 1) / zb, L + 5.4, 0.012, (T + 1) / zb, 0, j % 2 ? dA : dB);
    const w = Math.max(2, Math.round((L + 4) / 3.4)); for(let j = 0; j < w; j++){ const x = -L / 2 - 3.6 + (j + 0.5) / w * (L + 5); kiste(x, y + 1, hinten, 1.2, 1.25, 0.04, 0, C('#2c2016')); kiste(x, y + 1.05, hinten + 0.02, 1.05, 1.15, 0.04, 0, C('#d8c58f')); kiste(x, y + 1, hinten + 0.05, 0.06, 1.25, 0.03, 0, C('#2c2016')); kiste(x, y + 1.6, hinten + 0.05, 1.2, 0.06, 0.03, 0, C('#2c2016')); kiste(x, y + 0.96, hinten + 0.14, 1.4, 0.05, 0.28, 0, C('#6a4c30')); kiste(x - 0.42, y + 1.01, hinten + 0.14, 0.2, 0.26, 0.2, 0, C('#8f8167')); }
    const ox = L / 2 - 0.45, oz = -(T + 1) / 2 + 0.7; if(k === 0){ kiste(ox, y, oz, 0.95, 1.15, 0.8, 0, C('#6d5e50')); kiste(ox, y + 1.15, oz, 1.05, 0.08, 0.9, 0, C('#3a3129')); kiste(ox, y + 0.28, oz + 0.41, 0.5, 0.36, 0.02, 0, C('#c9752e')); kiste(ox - 0.2, y + 1.23, oz - 0.1, 0.2, 1.7, 0.2, 0, C('#3a3129')); } else { kiste(ox, y, oz, 1.2, 0.52, 0.65, 0, C('#5b3f27')); kiste(ox, y + 0.52, oz, 1.26, 0.06, 0.7, 0, C('#6f4f33')); } }
  function bueroGrund(y){ const hinten = -(T + 1) / 2, w = Math.max(2, Math.round(L / 2.4)); kiste(0, y, hinten, L + 1, 2.5, 0.08, 0, C('#54585c')); for(let j = 0; j < w; j++){ const x = -L / 2 + (j + 0.5) / w * L; kiste(x, y + 0.9, hinten + 0.07, L / w - 0.18, 1.4, 0.03, 0, C('#9fb9c6')); kiste(x, y, hinten + 0.34, L / w - 0.3, 0.72, 0.42, 0, C('#33363a')); } pflanze(L / 2 - 0.1, T / 2 - 0.1, y); pflanze(-L / 2 + 0.1, T / 2 - 0.1, y); }
  function campusGrund(y){ for(let j = 0; j < 4; j++){ const a = j / 4 * Math.PI * 2 + Math.PI / 4; pflanze(Math.cos(a) * (R - 0.2), Math.sin(a) * (R - 0.2), y); } }
  function pflanze(x, z, y){ kiste(x, y, z, 0.4, 0.42, 0.4, 0, C('#5a5048')); kiste(x, y + 0.42, z, 0.62, 0.42, 0.62, 0.4, C('#3e5a33')); kiste(x, y + 0.84, z, 0.44, 0.4, 0.44, 1.1, C('#4a6b3a')); }
  function legeTisch(i, x, z, yaw, y, k, a){ const s = m.samen[i], fc = blattFarbe(s), af = fassungsArbeit(s), gold = s.status === 'grundformation', ch = Math.cos(yaw), sh = Math.sin(yaw), ort = (lx, lz) => [x + ch * lx + sh * lz, z - sh * lx + ch * lz];
    const st = ort(0, 0.62); if(dorf){ for(const [lx, lz] of [[-0.58, -0.28], [0.58, -0.28], [-0.58, 0.28], [0.58, 0.28]]){ const b = ort(lx, lz); kiste(b[0], y, b[1], 0.1, 0.66, 0.1, yaw, BEIN); } kiste(x, y + 0.2, z, 1.16, 0.04, 0.56, yaw, BEIN); kiste(x, y + 0.62, z, 1.42, 0.09, 0.84, yaw, C('#8f6d48')); kiste(st[0], y, st[1], 0.12, 0.4, 0.12, yaw, BEIN); kiste(st[0], y + 0.4, st[1], 0.38, 0.05, 0.38, yaw, C('#6a4c30')); }
    else { kiste(x, y, z, 1.25, 0.66, 0.68, yaw, BEIN); kiste(x, y + 0.66, z, 1.32, 0.05, 0.74, yaw, TOP); kiste(st[0], y, st[1], 0.42, 0.44, 0.42, yaw, STUHL); const le = ort(0, 0.82); kiste(le[0], y + 0.44, le[1], 0.42, 0.42, 0.05, yaw, STUHL); }
    // Karteistapel: mehr Text, mehr Stapel, höher
    const zahlS = 1 + Math.floor(af * 2.9), hS = 0.06 + af * (dorf ? 0.5 : 0.8); for(let j = 0; j < zahlS; j++){ const lx = (j - (zahlS - 1) / 2) * 0.38, p = ort(lx, -0.08), h = hS * (1 - j * 0.14); if(dorf){ const b = Math.max(1, Math.round(h / 0.085)); for(let q = 0; q < b; q++) kiste(p[0], y + 0.71 + q * h / b, p[1], 0.29 + (q % 3) * 0.015, h / b * 0.9, 0.38 + (q % 2) * 0.03, yaw + (q % 3 - 1) * 0.07, q % 2 ? PAPIER : C('#a8967a')); } else kiste(p[0], y + 0.71, p[1], 0.31, h, 0.42, yaw, PAPIER); kiste(p[0], y + 0.71 + h, p[1], 0.33, 0.025, 0.44, yaw, gold ? GOLD : fc); }
    tische.push({i, k, x: o[0] + x, y: y + 0.71 + hS, z: o[2] + z, farbe: fc, abt: a, eltern: plan && plan.W.eltern[i] >= 0 && !plan.lose[i] ? plan.W.eltern[i] : -1}); }
  return {n, stil, kisten: new Float32Array(K), tische, schilder, reihen, R: rund ? R : Math.max(L + (dorf ? 4.6 : 0), T) * 0.62, cx: dorf ? -2.3 : 0, hoehe: Math.max(1, E.length) * HOEHE, HOEHE, o};
}

/* Lichtpunkte im Gebäude: je Fassung eine Lampe in der Farbe ihrer Stimme, der Faden der belegten Abstammung, die Wahl */
export function innenLichter(P, screenRing, inn, vis){ const pl = inn.plan, tt = pl.tische, nach = inn.nach || (inn.nach = new Map(tt.map(t => [t.i, t])));
  for(const t of tt) if(inn.etage === t.k) P(t.x, t.y + 0.5, t.z, 0.5, t.farbe[0], t.farbe[1], t.farbe[2], 0.14 * vis);
  for(const t of tt){ if(t.eltern < 0) continue; const e = nach.get(t.eltern); if(!e) continue; if(inn.etage >= 0 && t.k !== inn.etage && e.k !== inn.etage) continue; const d = Math.hypot(t.x - e.x, t.y - e.y, t.z - e.z), q = Math.round(clamp(d * 4, 4, 60)); for(let s = 1; s < q; s++){ const f = s / q; P(e.x + (t.x - e.x) * f, e.y + (t.y - e.y) * f + Math.sin(Math.PI * f) * 0.3, e.z + (t.z - e.z) * f, 0.05, t.farbe[0], t.farbe[1], t.farbe[2], 0.7 * vis); } }
  if(inn.wahl != null){ const t = nach.get(inn.wahl); if(t){ screenRing([t.x, t.y + 0.25, t.z], 0.75, [1, 0.95, 0.85], 0.9 * vis); P(t.x, t.y + 0.1, t.z, 0.35, t.farbe[0], t.farbe[1], t.farbe[2], 1.2 * vis); } } }
