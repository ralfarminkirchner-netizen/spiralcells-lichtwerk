/* =====================================================================
   NETZ — Ralfs System als eine Zelle aus Zellen.
   In der Mitte die Zentrale, groß und warm, die fünf Stimmen als Kranz um sie.
   Um sie die Dächer (große Überordner wie FASKA), jedes eine eigene Hülle, die nur
   am Saum leuchtet; darin die Bereiche, darin die Werke. Das Licht kommt von den Werken:
   jedes zeigt im Kleinen seinen eigenen Wuchs (Ranken, Gabeln, Fächer), nicht seine Kennung.
   Lesematerial liegt als Korn an dem Werk, aus dem es stammt oder in das es eingeht.
   Was noch keinem Dach belegt zugeordnet ist, liegt ehrlich „ohne Dach“.
   Fäden zeigen Typ und Richtung: Material fließt, ein Verweis zeigt, Zugehörigkeit steht still.
   Im Überblick laufen sie gebündelt von Bezirk zu Bezirk; einzeln erst im Dach oder an der Wahl.
   ===================================================================== */
import {TAU, clamp, mix, sstep, hash, mixc, P, CAM, toScreen, screenRing, WG, KEIMC, GOLDC, SILVER, DUSTC, ASCHE} from './licht.js';
import {VOICES, fibSphere} from './zelle.js';
import {MENSCH} from './daten.js';
import {wuchs, rangRadien} from './wuchs.js';
import {ordne, lage} from './ordnung.js';
import {alsformen} from './alsformen.js';

const MEM2 = fibSphere(4200), MEMD = fibSphere(900);
const SEEDC = VOICES.map(v => v.c);
const TURN = 1.75, SPOKE = 144;

/* Wie viel in einem Werk schon entstanden ist, von 0 bis 1: Fassungen und Textmenge, logarithmisch */
export function arbeit(m){ const zeichen = m.samen.reduce((a, s) => a + Math.max(0, s.laenge || 0), 0);
  return clamp(Math.log2(1 + m.samen.length + zeichen / 2000) / Math.log2(201), 0, 1); }
/* Ein Werk im Kleinen: eine Zelle mit eigener Haut. Die Haut ist je Werk anders und stabil; darin liegen seine Fassungen
   als Spirale, die Stimme als Farbe, Gabeln etwas neben der Bahn. Die Länge der Spirale zeigt, wie viel schon entstanden ist.
   Die Spirale ist Anordnung, kein Beleg für Abstammung. Im Garten steigt dieselbe Spirale als Pflanze auf: jedes Korn hat seine Höhe. */
function miniWuchs(m, rM, seed){
  const n = m.samen.length, W = n ? wuchs(m) : null, w = arbeit(m), turns = 0.45 + 2.6 * w, weite = 0.3 + 0.5 * w, H = rM * (1.2 + 4.2 * w);
  const bahn = t => { const a = -Math.PI * 0.73 + t * TAU * turns, r = rM * (0.07 + weite * Math.pow(t, 0.8)); return [r * Math.cos(a), r * Math.sin(a), a]; };
  const hoehe = t => H * (0.22 + 0.78 * t);
  const schritt = Math.max(1, Math.ceil(n / 160)), pts = [], ptsH = [], stiel = [], stielH = [];
  for(let i = 0; i < n; i++){
    const s = m.samen[i], t = n === 1 ? 1 : i / (n - 1); let [x, z, a] = bahn(t);
    const sw = W.eltern[i] >= 0 ? W.kinder[W.eltern[i]] : null;
    if(sw && sw.length > 1){ const v = (sw.indexOf(i) - (sw.length - 1) / 2) / Math.max(1, (sw.length - 1) / 2) * rM * 0.1; x += Math.cos(a + Math.PI / 2) * v; z += Math.sin(a + Math.PI / 2) * v; }
    const c = s.form ? SILVER : typeof s.stimme === 'number' ? SEEDC[s.stimme] : s.stimme === MENSCH ? SILVER : DUSTC, g = s.status === 'grundformation' ? 0.5 : 0;
    if(i % schritt === 0 || W.kinder[i].length > 1 || W.art[i] === 'gabel'){ pts.push(x, (i / n) * rM * 0.1, z, mix(c[0], GOLDC[0], g), mix(c[1], GOLDC[1], g), mix(c[2], GOLDC[2], g)); ptsH.push(hoehe(t)); }
  }
  if(n){ const q = Math.round(clamp(rM * 12 * turns, 10, 110)); for(let j = 0; j <= q; j++){ const [x, z] = bahn(j / q), c = m.samen[Math.round(j / q * (n - 1))], f = typeof c.stimme === 'number' ? SEEDC[c.stimme] : DUSTC; stiel.push(x, 0, z, f[0], f[1], f[2]); stielH.push(hoehe(j / q)); }
    // Der Stängel: vom Keim am Boden bis zum Anfang der Spirale; in der Draufsicht liegt er im Keim
    const q2 = Math.max(5, Math.round(H * 0.22 * 5)), [x0, z0] = bahn(0); for(let j = 0; j < q2; j++){ const u = j / q2; stiel.push(x0 * u, 0, z0 * u, DUSTC[0], DUSTC[1], DUSTC[2]); stielH.push(hoehe(0) * u); } }
  // Die Haut: leicht unregelmäßig; oben links liegt ein heller Rand, der ihr Tiefe gibt, ohne etwas zu behaupten
  const hn = Math.round(clamp(rM * 26, 40, 96)), p3 = hash(seed * 1.3) * TAU, p5 = hash(seed * 2.1) * TAU, haut = [];
  for(let j = 0; j < hn; j++){ const a = j / hn * TAU, r = rM * (1 + Math.sin(a * 3 + p3) * 0.036 + Math.cos(a * 5 + p5) * 0.016);
    let u = (a / Math.PI - 1.01) / 0.7, hell = u >= 0 && u <= 1 ? Math.sin(Math.PI * u) : 0; haut.push(r * Math.cos(a), r * Math.sin(a) * 0.94, hell); }
  return {pts: new Float32Array(pts), ptsH: new Float32Array(ptsH), stiel: new Float32Array(stiel), stielH: new Float32Array(stielH), haut: new Float32Array(haut), H};
}
/* Die Mischfarbe einer Reihe von Werken: so leuchtet ein Dach, wenn es leuchtet */
function mischFarbe(mini, werke){ let r = 0, g = 0, b = 0, n = 0;
  for(const i of werke){ const p = mini[i].pts; for(let q = 0; q < p.length / 6; q++){ r += p[q * 6 + 3]; g += p[q * 6 + 4]; b += p[q * 6 + 5]; n++; } }
  return n ? [r / n, g / n, b / n] : WG; }

export class Netz {
  constructor(B, O){
    this.B = B; const N = B.monde.length; this.N = N;
    this.baum = ordne(B, O);
    // Größe heißt: viel darin. Ein Werk nur mit seiner Ausgangsfassung ist eine Knospe, kein leerer Kreis
    this.rM = B.monde.map(m => { if(!m.samen.length) return 0.42;
      const zeichen = m.samen.reduce((a, s) => a + s.laenge, 0), k = clamp(Math.round(10 + 7 * Math.sqrt(m.samen.length + 1) + Math.sqrt(zeichen) / 30), 12, 140);
      return (0.45 + 1.0 * Math.sqrt(k / 140)) * (m.stimmen.length ? 1.25 : 1) * 1.5; });
    // Lesematerial ist kein Werk: es wird ein kleines Korn
    for(const i of this.baum.material.keys()) this.rM[i] = 0.32;
    this.L = lage(this.baum, this.rM.map(r => r * 1.1), {gapWerk: 0.3, gapBereich: 0.35, gapDach: 1.4});
    this.pos = this.L.pos.map((p, i) => [p[0], (hash(i * 3.7) - 0.5) * 0.25, p[2]]);
    this.mini = B.monde.map((m, i) => this.baum.material.has(i) ? {pts: new Float32Array(0), ptsH: new Float32Array(0), stiel: new Float32Array(0), stielH: new Float32Array(0), haut: new Float32Array(0), H: 0} : miniWuchs(m, this.rM[i], i + 1));
    this.R2 = this.L.R; this.H2 = 0; this.mitte = [0, 0, 0]; this.Rm2 = this.L.R * 1.06;
    // Dächer und Bereiche mit Namen und der Mischfarbe ihrer Werke
    this.daecher = this.baum.daecher.map((d, j) => ({...d, ...this.L.daecher[j], farbe: mischFarbe(this.mini, d.bereiche.flatMap(b => b.werke)),
      bereiche: d.bereiche.map((b, bi) => ({...b, ...this.L.daecher[j].bereiche[bi], farbe: mischFarbe(this.mini, b.werke)}))}));
    // Bezirke als Kreise am Boden: daran misst die Kamera, wie viel sie zeigen muss
    this.kreise = [{x: 0, z: 0, R: this.L.mitte.R, h: this.L.mitte.R * 0.42}, ...this.daecher.map(d => ({x: d.mitte[0], z: d.mitte[2], R: d.R, h: d.R * 0.38}))];
    if(this.L.ohne) this.kreise.push({x: this.L.ohne.mitte[0], z: this.L.ohne.mitte[2], R: this.L.ohne.R, h: 0.5});
    // Die Kamera blickt auf die Mitte des Ganzen, nicht auf die Zentrale allein: sonst ragt eine Seite aus dem Bild
    const rand = (a, s) => Math.max(...this.kreise.map(k => s * k[a] + k.R)); this.mitte = [(rand('x', 1) - rand('x', -1)) / 2, 0, (rand('z', 1) - rand('z', -1)) / 2];
    // Im Überblick trägt je Bezirk nur das zuletzt bewegte Werk seine Ringe; die übrigen erst, wenn man im Bezirk ist
    const juengst = new Map();
    B.monde.forEach((m, i) => { if(this.baum.material.has(i)) return; const b = this.bezirk(i), t = (m.zeitspanne && m.zeitspanne[1]) || 0, x = juengst.get(b);
      if(!x || t > x.t) juengst.set(b, {i, t}); });
    this.juengst = new Set([...juengst.values()].map(x => x.i));
    // Fäden über Werkgrenzen: je Werkpaar, Typ und Richtung; Material fließt von der Quelle zur neuen Fassung
    const idx = new Map(B.monde.map((m, i) => [m.id, i])), buendel = new Map();
    for(const e of B.roh.edges){ const a = idx.get(B.werkVon(e.from_variant_id)), b = idx.get(B.werkVon(e.to_variant_id)); if(a == null || b == null || a === b) continue;
      const fliesst = e.edge_type === 'remixt-aus' || e.edge_type === 'erweitert';
      const von = fliesst ? b : a, nach = fliesst ? a : b, k = `${von}>${nach}:${e.edge_type}`;
      const f = buendel.get(k) || {von, nach, typ: e.edge_type, kanten: [], verwendung: 0}; f.kanten.push(e); if(e.usage) f.verwendung++; buendel.set(k, f); }
    // Kanten mit beschriebener Verwendung zuerst: sie führen bis in die Passage
    this.faeden = [...buendel.values()]; for(const f of this.faeden) f.kanten.sort((p, q) => (q.usage ? 1 : 0) - (p.usage ? 1 : 0));
    // Bündel von Bezirk zu Bezirk für den Überblick; was in einem Bezirk bleibt, zeigt sich erst darin
    const bk = b => b === 'mitte' || b === 'ohne' ? b : 'd' + b, bm = new Map(); this.buendel = []; this.innen = new Map();
    this.faeden.forEach((f, fi) => { const a = this.bezirk(f.von), b = this.bezirk(f.nach); f.bzVon = a; f.bzNach = b;
      if(a === b){ this.innen.set(a, (this.innen.get(a) || 0) + f.kanten.length); return; }
      const k = bk(a) + '>' + bk(b); let x = bm.get(k);
      if(!x){ x = {von: a, nach: b, faeden: [], kanten: 0, verwendung: 0, typen: new Map()}; bm.set(k, x); this.buendel.push(x); }
      x.faeden.push(fi); x.kanten += f.kanten.length; x.verwendung += f.verwendung; x.typen.set(f.typ, (x.typen.get(f.typ) || 0) + f.kanten.length); });
    for(const x of this.buendel) x.typ = [...x.typen].sort((p, q) => q[1] - p[1])[0][0];
    this.als = alsformen(B);   // derselbe Gegenstand in mehreren Zusammenhängen, und wie etwas entstand
    this.stimmAnteil = VOICES.map((_, i) => B.monde.filter(m => m.stimmen.includes(i)).length);
    const mx = Math.max(1, ...this.stimmAnteil); this.stimmAnteil = this.stimmAnteil.map(x => x / mx);
    this.tueren = [];
  }
  index(id){ return this.B.monde.findIndex(m => m.id === id); }
  /* Türen in den Verbund sind Organe der Zentrale: ein Bogen oben außen an ihrem Rand */
  tuerPos(i, o){ const n = Math.max(1, this.tueren.length), Rm = this.L.mitte.R, a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.2;
    o[0] = Math.cos(a) * Rm * 1.3; o[1] = Rm * 0.05; o[2] = Math.sin(a) * Rm * 1.3; return o; }
  dachVon(i){ const o = this.baum.ort[i]; return o && o.ebene === 'dach' ? o.dach : -1; }
  /* Der Bezirk eines Werks: 'mitte', ein Dachindex oder 'ohne'; Lesematerial gehört zum Bezirk seines Werks */
  bezirk(i, tiefe = 0){ const o = this.baum.ort[i]; if(!o) return 'ohne';
    if(o.ebene === 'material') return o.werk != null && tiefe < 3 ? this.bezirk(o.werk, tiefe + 1) : o.dach != null ? Math.max(0, this.daecher.findIndex(d => d.name === o.dach)) : 'mitte';
    return o.ebene === 'dach' ? o.dach : o.ebene; }
  /* Werke eines Bezirks, für die Tastatur: erst die eigenen, dann das Lesematerial an ihnen */
  werkeIn(b){ const eigen = b === 'mitte' ? this.baum.mitte.werke : b === 'ohne' ? this.baum.ohne : (this.daecher[b] ? this.daecher[b].bereiche.flatMap(x => x.werke) : []);
    const mat = [...this.baum.material.keys()].filter(i => this.bezirk(i) === b); return [...eigen, ...mat]; }
  bezirkZiel(b){ return b === 'mitte' ? this.L.mitte : b === 'ohne' ? this.L.ohne : this.daecher[b] || null; }
  /* Werke eines Bezirks, die nur ihre Ausgangsfassung haben */
  knospenIn(b){ return this.werkeIn(b).filter(i => !this.baum.material.has(i) && !this.B.monde[i].samen.length).length; }
}

const TMP = [0, 0, 0, 0];
/* Die fünf Stimmen kreisen als Kranz am Rand der Mitte: innen haben die Werke der Zentrale Raum */
export function bigHead(N, i, t, o){ const Rm = N.L.mitte.R, th = t * TAU / 16 + 0.6 + i * 0.4, bp = t * TAU * 0.3 + i * TAU / 5, rho = Rm * (1.06 + 0.02 * Math.cos(bp));
  o[0] = rho * Math.cos(th); o[1] = Rm * (0.1 + 0.03 * Math.sin(bp) - 0.01 * i); o[2] = rho * Math.sin(th); return o; }

/* Ein Ring am Boden, auf Wunsch gestrichelt (luecke: jeder n-te Punkt fehlt) */
function ring(c, R, col, a, sz, luecke){ const n = Math.max(60, Math.round(R * 22));
  for(let s = 0; s < n; s++){ if(luecke > 1 && s % (luecke + 1) === 0) continue; const t = s / n * TAU; P(c[0] + Math.cos(t) * R, c[1], c[2] + Math.sin(t) * R, sz, col[0], col[1], col[2], a); } }
/* Eine Hülle leuchtet nur am Saum (Fresnel); von innen bleibt nur der Rand, damit die Werke das Hellste sind */
function huelle(c, R, yS, col, a, pts, cx, cyy, cz, nurRand){
  for(let k = 0; k < pts.length / 3; k++){ const ux = pts[k * 3], uy = pts[k * 3 + 1], uz = pts[k * 3 + 2];
    const x = c[0] + ux * R, y = c[1] + uy * R * yS, z = c[2] + uz * R;
    const vx = cx - x, vy = cyy - y, vz = cz - z, vl = Math.hypot(vx, vy, vz) || 1, fres = Math.pow(1 - Math.abs((ux * vx + uy * vy * yS + uz * vz) / vl), 3.0);
    if(nurRand && fres < 0.35) continue;
    P(x, y, z, R * (nurRand ? 0.005 : 0.011), col[0], col[1], col[2], fres * a * 0.8); }
}
/* Der Punkt eines Bodenrings, der auf dem Schirm am weitesten oben (oder unten) liegt; innen: ein Stück zur Mitte hin */
function amRing(c, R, unten, innen){ let best = null;
  for(let s = 0; s < 16; s++){ const t = s / 16 * TAU, p = toScreen(c[0] + Math.cos(t) * R, c[1], c[2] + Math.sin(t) * R); if(p[2] > 0 && (!best || (unten ? p[1] > best[1] : p[1] < best[1]))) best = p; }
  if(!best || !innen) return best; const m = toScreen(c[0], c[1], c[2]); return [mix(best[0], m[0], innen), mix(best[1], m[1], innen), best[2]]; }

export function baueNetz(N, U, wall, vis, aktiv, aktivDetail){
  if(vis <= 0.003) return;
  const cx = CAM.P[0], cyy = CAM.P[1], cz = CAM.P[2], soloAny = U.solo >= 0, gk = U.gartenK || 0;   // gk: 0 Kosmos, 1 Garten; dieselben Werke am selben Ort
  const hov = U.hover && U.hover.art === 'mond' ? U.hover.i : -1, imDach = U.dach;   // null, 'mitte', 'ohne' oder ein Dach
  const hovD = U.hover && U.hover.art === 'dach' ? U.hover.i : -1, selD = U.sel && U.sel.art === 'dach' ? U.sel.i : -1;
  const selM = U.sel && U.sel.art === 'mond' ? U.sel.i : -1, anders = imDach != null ? 0.22 : 1;   // was nicht im betretenen Bezirk liegt, tritt zurück
  const fokus = U.als && U.als.set ? U.als.set : null, still = fokus ? 0.3 : 1;   // im Blick auf einen Gegenstand tritt alles andere zurück
  // Mitte: die Zentrale, ein warmer Kern mit eigener Hülle, heller als jedes Dach
  const Lm = N.L.mitte, puls = U.RM ? 0.85 : 0.75 + 0.25 * Math.sin(wall * 0.9), hovM = U.hover && U.hover.art === 'mitte', anM = hovM || (U.sel && U.sel.art === 'mitte');
  const hellM = (imDach === 'mitte' ? 1.2 : imDach != null ? anders : 1) * still;
  P(0, 0, 0, Math.min(Lm.R * 0.12, 1.1), KEIMC[0], KEIMC[1], KEIMC[2], 0.8 * vis * puls * (anM ? 1.5 : 1) * still);
  P(0, 0, 0, Lm.R * 0.7, KEIMC[0], KEIMC[1], KEIMC[2], 0.09 * vis * hellM * (imDach === 'mitte' ? 0.5 : 1));
  P(0, 0, 0, Lm.R * 1.6, KEIMC[0], KEIMC[1], KEIMC[2], 0.06 * vis * hellM * (imDach === 'mitte' ? 0.5 : 1));
  ring([0, -0.05, 0], Lm.R, KEIMC, (anM ? 0.9 : 0.6) * vis * hellM, 0.09, 1);
  huelle([0, 0, 0], Lm.R, 0.42 * (1 - 0.9 * gk), WG, (anM ? 0.9 : 0.55) * vis * (imDach === 'mitte' ? 0.35 : hellM), MEMD, cx, cyy, cz, imDach === 'mitte');
  U.mitteSchirm = imDach === 'mitte' ? amRing([0, 0, 0], Lm.R * 1.04, false, 0) : amRing([0, 0, 0], Lm.R * 1.02, true, 0);   // im Überblick unter dem Rand, nie über den Werken; in der Mitte oben
  // Dächer: je eine Hülle, die am Saum leuchtet; der Boden nur, wenn man auf sie zeigt oder in ihr steht
  for(let j = 0; j < N.daecher.length; j++){ const d = N.daecher[j], drin = j === imDach, hell = (drin ? 1 : imDach != null ? anders : 1) * still, an = j === hovD || j === selD;
    const c = an ? mixc(WG, SILVER, 0.4) : WG;
    P(d.mitte[0], 0, d.mitte[2], d.R * 1.4, d.farbe[0], d.farbe[1], d.farbe[2], 0.012 * vis * hell * (an ? 1.8 : 1) * (drin ? 0.5 : 1));
    if(an || drin) ring([d.mitte[0], -0.05, d.mitte[2]], d.R, c, (an ? 0.6 : 0.35) * vis, 0.11, 1);
    huelle(d.mitte, d.R, 0.38 * (1 - 0.9 * gk), c, (an ? 0.95 : drin ? 0.55 : 0.28) * vis * (drin ? 0.35 : hell), MEMD, cx, cyy, cz, drin);
    // Im Dach werden die Bereiche sichtbar: ein weiches Feld in der Farbe ihrer Werke und ein feiner Ring
    if(drin) for(const b of d.bereiche){ P(b.mitte[0], 0, b.mitte[2], b.R * 1.2, b.farbe[0], b.farbe[1], b.farbe[2], 0.022 * vis); ring([b.mitte[0], -0.05, b.mitte[2]], b.R, mixc(WG, b.farbe, 0.35), 0.38 * vis, 0.07, 1); }
    if(drin) U.bereicheSchirm = d.bereiche.map(b => amRing(b.mitte, b.R, false, 0.08));
    U.daecherSchirm[j] = drin ? amRing(d.mitte, d.R * 1.04, false, 0) : toScreen(d.mitte[0], d.R * 0.42, d.mitte[2]); }   // im Dach: sein Name am oberen Rand
  U.daecherSchirm.length = N.daecher.length;
  if(N.L.ohne){ const o = N.L.ohne, hO = U.hover && U.hover.art === 'ohne' || U.sel && U.sel.art === 'ohne'; ring([o.mitte[0], -0.05, o.mitte[2]], o.R, DUSTC, (hO ? 0.45 : 0.22) * vis * (imDach === 'ohne' ? 1.4 : imDach != null ? anders : 1), 0.07, 3);
    U.ohneSchirm = imDach === 'ohne' ? amRing(o.mitte, o.R * 1.04, false, 0) : toScreen(o.mitte[0], o.R * 0.3, o.mitte[2]); } else U.ohneSchirm = null;
  // Werke: das Licht des Netzes
  for(let n = 0; n < N.N; n++){
    const m = N.B.monde[n], o = N.pos[n], pts = N.mini[n].pts, k = pts.length / 6, material = N.baum.material.has(n);
    const self = n === aktiv, fade = self ? (1 - aktivDetail) : 1; if(fade <= 0.01){ U.monde[n] = null; continue; }
    const bz = N.bezirk(n), dachHell = imDach == null ? (bz === 'ohne' ? 0.55 : 1) : bz === imDach ? 1.15 : 0.25;   // noch nicht Zugeordnetes bleibt im Überblick leise
    const dc = Math.hypot(o[0] - cx, o[1] - cyy, o[2] - cz), near = sstep(CAM.S * 0.03, CAM.S * 0.3, dc);
    let a = vis * fade * (self ? 1 : near) * dachHell;
    if(fokus) a *= fokus.has(n) ? 1.2 : 0.14;
    if(soloAny) a *= m.stimmen.includes(U.solo) ? 1.3 : 0.18;
    if(material){ P(o[0], o[1], o[2], 0.16, DUSTC[0], DUSTC[1], DUSTC[2], a * 0.9); P(o[0], o[1], o[2], 0.5, DUSTC[0], DUSTC[1], DUSTC[2], a * 0.05);
      if(hov === n || self) screenRing(o, 0.35, WG, 0.4 * vis); U.monde[n] = toScreen(o[0], o[1], o[2]); continue; }
    // Viele Punkte auf kleinem Raum brennen aus: die Helligkeit je Punkt sinkt mit ihrer Zahl, groß heißt weit, nicht grell
    const lit = (m.traumfeld ? 1.4 : 2.2) * (hov === n ? 1.5 : 1) * (self ? 1.3 : 1) * Math.pow(Math.min(1, 16 / Math.max(1, k)), 0.7);
    // Die Zelle: ein Leib in der Farbe ihrer Stimmen und ihre Haut. Das Licht bleibt in der Zelle
    let cr = KEIMC[0], cg = KEIMC[1], cb = KEIMC[2];
    if(k){ cr = cg = cb = 0; for(let p = 0; p < k; p++){ cr += pts[p * 6 + 3]; cg += pts[p * 6 + 4]; cb += pts[p * 6 + 5]; } cr /= k; cg /= k; cb /= k; }
    P(o[0], o[1], o[2], N.rM[n] * 1.15, cr, cg, cb, a * (m.traumfeld ? 0.06 : 0.11) * (fokus ? 0.4 : 1));
    const haut = N.mini[n].haut, hz = Math.max(N.rM[n] * 0.012, CAM.S * 0.0026), hf = a * (hov === n || self ? 1.3 : 0.62);
    for(let p = 0; p < haut.length / 3; p++){ const h = haut[p * 3 + 2]; P(o[0] + haut[p * 3], o[1], o[2] + haut[p * 3 + 1], hz * (1 + 0.5 * h), mix(cr, WG[0], 0.45 + 0.5 * h), mix(cg, WG[1], 0.45 + 0.5 * h), mix(cb, WG[2], 0.45 + 0.5 * h), hf * (0.5 + 0.9 * h)); }
    const sz = Math.max(0.17 * Math.max(0.7, N.rM[n]), CAM.S * 0.0042);   // auch im Überblick bleibt die Gestalt eines Werks zu sehen, nicht nur sein Schein
    const ptsH = N.mini[n].ptsH, stH = N.mini[n].stielH; for(let p = 0; p < k; p++) P(o[0] + pts[p * 6], o[1] + mix(pts[p * 6 + 1], ptsH[p], gk), o[2] + pts[p * 6 + 2], sz, pts[p * 6 + 3], pts[p * 6 + 4], pts[p * 6 + 5], a * lit * 0.9);
    const st = N.mini[n].stiel; for(let p = 0; p < st.length / 6; p++) P(o[0] + st[p * 6], o[1] + stH[p] * gk, o[2] + st[p * 6 + 2], sz * 0.45, st[p * 6 + 3], st[p * 6 + 4], st[p * 6 + 5], a * 0.3);
    P(o[0], o[1], o[2], k ? 0.2 : 0.26, KEIMC[0], KEIMC[1], KEIMC[2], a * (m.keimKristall ? 1.5 : k ? 0.8 : 1.1));
    // Ringe (Phase, zuletzt bewegt): im Überblick nur am jüngsten Werk je Bezirk, im Bezirk an allen seinen Werken
    const ringe = imDach != null ? bz === imDach : N.juengst.has(n), mt = [o[0], o[1] + N.rM[n] * 0.2, o[2]];
    const rc = m.reife === 'kanonisch' ? GOLDC : WG;
    if((ringe && !m.traumfeld) || hov === n) screenRing(mt, N.rM[n] * 1.3, rc, 0.28 * a, Math.max(0.06, m.phase));
    if(self || hov === n || selM === n){ const pu = U.RM ? 0.5 : 0.5 + 0.5 * Math.sin(wall * 2.4); screenRing(mt, N.rM[n] * (1.6 + 0.12 * pu), SILVER, (self ? 0.5 : 0.35) * vis); }
    const neu = N.neu && N.neu.get(m.id);
    if(neu){ const s1 = neu.find(x => typeof x.stimme === 'number'), c = s1 ? SEEDC[s1.stimme] : WG, pl = U.RM ? 0.8 : 0.65 + 0.35 * Math.sin(wall * 1.6 + n);
      screenRing(mt, N.rM[n] * 2.0, c, 1.0 * vis * fade * pl); screenRing(mt, N.rM[n] * 2.3, c, 0.4 * vis * fade * pl); }
    else if((ringe || self || hov === n) && N.zuletzt && N.zuletzt.has(m.id)){ const s1 = N.zuletzt.get(m.id).find(x => typeof x.stimme === 'number'), c = s1 ? SEEDC[s1.stimme] : WG;
      screenRing(mt, N.rM[n] * 2.0, c, 0.34 * vis * fade); }
    U.monde[n] = toScreen(o[0], o[1], o[2]);
  }
  // Fäden zwischen Werken: Typ, Richtung, Verwendung. Einzeln nur im Bezirk oder an der Wahl, sonst gebündelt
  U.knoten.length = N.faeden.length; U.buendelKnoten.length = 0;
  const fz = Math.max(0.11, CAM.S * 0.004), wahl = selM >= 0;   // ist ein Werk gewählt, treten die übrigen Fäden zurück
  for(let fi = 0; fi < N.faeden.length; fi++){ const f = N.faeden[fi], A = N.pos[f.von], Bp = N.pos[f.nach];
    const anF = U.sel && U.sel.art === 'faden' && U.sel.i === fi, hovF = U.hover && U.hover.art === 'faden' && U.hover.i === fi;
    const beteiligt = aktiv === f.von || aktiv === f.nach || selM === f.von || selM === f.nach;
    const zeig = anF || hovF || beteiligt || (imDach != null && (f.bzVon === imDach || f.bzNach === imDach));
    if(!zeig){ U.knoten[fi] = null;
      // Im Garten läuft jede gespeicherte Beziehung als Mycel unter dem Boden; es entsteht keine neue
      if(gk > 0.01){ const st = STIL[f.typ] || STIL['verweist-auf'], dm = Math.hypot(A[0] - Bp[0], A[2] - Bp[2]), nm = Math.round(clamp(dm * 3, 12, 80)), ux = (Bp[2] - A[2]) / (dm || 1), uz = (A[0] - Bp[0]) / (dm || 1), ph = hash(fi * 3.3) * TAU;
        for(let s = 0; s <= nm; s++){ const t = s / nm, sn = Math.sin(Math.PI * t), wb = sn * (Math.sin(t * 9 + ph) * 0.05 + Math.sin(t * 23 + ph * 2) * 0.018) * dm; P(mix(A[0], Bp[0], t) + ux * wb, -sn * (0.5 + dm * 0.05), mix(A[2], Bp[2], t) + uz * wb, fz, st.c[0], st.c[1], st.c[2], vis * gk * 1.9 * st.a * (soloAny ? 0.3 : 1) * (wahl ? 0.4 : 1)); } }
      continue; }
    const st = STIL[f.typ] || STIL['verweist-auf'];
    const al = vis * (st.a + 0.04 * Math.min(6, f.kanten.length)) * (soloAny ? 0.3 : 1) * (anF || hovF ? 1.8 : beteiligt ? 1.3 : wahl ? 0.25 : 1) * (fokus ? (fokus.has(f.von) && fokus.has(f.nach) ? (U.als.fokus === 'planet' ? 0.22 : 0.45) : 0.05) : 1);   // im Blick auf Alsformen treten auch die Materialfäden zurück
    const pt = fadenWeg(N, f, A, Bp);
    const d = Math.hypot(A[0] - Bp[0], A[2] - Bp[2]), n = Math.round(clamp(d * 5, 18, 140));
    for(let s = 1; s < n; s++){ const t = s / n; if(st.luecke && t > 0.44 && t < 0.56) continue; if(st.strich && (s % 4 === 0)) continue;
      const q = pt(t), mund = 0.55 + 0.6 * t;   // zur Mündung hin heller: dorthin zeigt der Faden
      q[1] = mix(q[1], -Math.sin(Math.PI * t) * (0.5 + d * 0.05), gk);
      P(q[0], q[1], q[2], fz, st.c[0], st.c[1], st.c[2], al * mund); }
    // Bewegung: Material fließt sichtbar zur neuen Fassung, ein Verweis zeigt; Zugehörigkeit steht still
    if(st.fluss && !U.RM){ const z = st.fluss === 'material' ? 3 : 1; for(let q = 0; q < z; q++){ const t = ((wall * (st.fluss === 'material' ? 0.12 : 0.07) + q / z + fi * 0.137) % 1), p3 = pt(t);
      P(p3[0], p3[1], p3[2], fz * (st.fluss === 'material' ? 2.4 : 1.6), st.c[0], st.c[1], st.c[2], al * 2.2 * Math.sin(Math.PI * t)); } }
    // Knoten in der Mitte: anfassbar; mit Verwendung (Zweck, Teile, Grenzen) heller und mit Ring
    const km = pt(0.5); P(km[0], km[1], km[2], fz * (f.verwendung ? 1.9 : 1.3), st.c[0], st.c[1], st.c[2], al * (f.verwendung ? 2.4 : 1.4));
    if(f.verwendung) screenRing(km, fz * 2.2, st.c, al * 1.2);
    U.knoten[fi] = toScreen(km[0], km[1], km[2]); }
  // Bündel im Überblick: ein Bogen je Bezirkspaar, von Rand zu Rand, Stärke nach Zahl der Kanten
  if(imDach == null){ const bz = Math.max(0.1, CAM.S * 0.0032);
    for(let bi = 0; bi < N.buendel.length; bi++){ const x = N.buendel[bi], za = N.bezirkZiel(x.von), zb = N.bezirkZiel(x.nach); if(!za || !zb) continue;
      const st = STIL[x.typ] || STIL['verweist-auf'], an = U.sel && U.sel.art === 'buendel' && U.sel.i === bi, ho = U.hover && U.hover.art === 'buendel' && U.hover.i === bi;
      const al = (1 - gk) * vis * (st.a + 0.03 * Math.min(8, x.kanten)) * (soloAny ? 0.3 : 1) * (an || ho ? 1.8 : wahl ? 0.35 : 0.6) * (fokus ? 0.2 : 1);
      const pt = bogen(za.mitte, za.R, zb.mitte, zb.R), d = Math.hypot(za.mitte[0] - zb.mitte[0], za.mitte[2] - zb.mitte[2]), n = Math.round(clamp(d * 3, 20, 120));
      const dicke = bz * (1 + 0.1 * Math.min(8, x.kanten));
      for(let s = 0; s <= n; s++){ const t = s / n; if(st.luecke && t > 0.44 && t < 0.56) continue; const q = pt(t); P(q[0], q[1], q[2], dicke, st.c[0], st.c[1], st.c[2], al * (0.5 + 0.6 * t)); }
      if(st.fluss && !U.RM){ const z = st.fluss === 'material' ? 2 : 1; for(let q = 0; q < z; q++){ const t = (wall * 0.08 + q / z + bi * 0.21) % 1, p3 = pt(t);
        P(p3[0], p3[1], p3[2], dicke * 2.4, st.c[0], st.c[1], st.c[2], al * 2.0 * Math.sin(Math.PI * t)); } }
      const km = pt(0.5); P(km[0], km[1], km[2], dicke * 1.8, st.c[0], st.c[1], st.c[2], al * (x.verwendung ? 2.4 : 1.5)); if(x.verwendung) screenRing(km, dicke * 2.4, st.c, al);
      U.buendelKnoten[bi] = toScreen(km[0], km[1], km[2]); } }
  // Hülle des Ganzen: nur ihr Saum
  const Rm2 = N.Rm2 * (1 + 0.01 * Math.sin(TAU * wall / 6.85));
  for(let k = 0; k < MEM2.length / 3; k++){ const ux = MEM2[k * 3], uy = MEM2[k * 3 + 1], uz = MEM2[k * 3 + 2];
    const x = ux * Rm2, y = uy * Rm2 * 0.45, z = uz * Rm2;
    const vx = cx - x, vy = cyy - y, vz = cz - z, vl = Math.hypot(vx, vy, vz) || 1, fres = Math.pow(1 - Math.abs((ux * vx + uy * vy * 0.45 + uz * vz) / vl), 4.0);
    const lum = fres * vis * 0.32 * (imDach != null || fokus ? 0.15 : 1) * (1 - gk); P(x, y, z, Rm2 * 0.0035, WG[0] * lum, WG[1] * lum * 0.97, WG[2] * lum * 0.98, 0.7); }
  // Die fünf Stimmen als Kranz um die Mitte, mit kurzen Spuren
  const kopf = Math.min(N.L.mitte.R * 0.07, 0.65);
  for(let i = 0; i < 5; i++){ const c = mixc(VOICES[i].c, WG, 0.35), al = vis * (0.25 + 0.75 * N.stimmAnteil[i]) * U.soloA[i] * (imDach != null && imDach !== 'mitte' ? anders : 1) * still;
    for(let k = 0; k < 30; k++){ bigHead(N, i, wall - k * 0.018, TMP); const age = k / 30; P(TMP[0], TMP[1], TMP[2], kopf * mix(0.35, 0.08, age), c[0], c[1], c[2], Math.pow(1 - age, 1.5) * al * 0.5); }
    bigHead(N, i, wall, TMP); P(TMP[0], TMP[1], TMP[2], kopf, c[0], c[1], c[2], 2.0 * al);
    U.bigHeads[i] = toScreen(TMP[0], TMP[1], TMP[2]); }
  // Türen in den Verbund: stille Punkte auf dem Bogen über der Mitte; Ring erst, wenn man auf sie zeigt oder in der Mitte steht
  for(let i = 0; i < N.tueren.length; i++){ const t = N.tueren[i]; N.tuerPos(i, TMP); const wach = t.wach === true;
    const c = wach ? KEIMC : DUSTC, pu = wach ? 0.75 + 0.25 * Math.sin(wall * 1.3 + i) * (U.RM ? 0 : 1) : 0.35, h = U.hover && U.hover.art === 'tuer' && U.hover.i === i;
    const hellT = (imDach == null || imDach === 'mitte' ? 1 : anders) * still;
    P(TMP[0], TMP[1], TMP[2], Math.min(N.L.mitte.R * 0.04, 0.4), c[0], c[1], c[2], vis * pu * (h ? 2.2 : 1.1) * hellT);
    if(h || imDach === 'mitte') screenRing([TMP[0], TMP[1], TMP[2]], Math.min(N.L.mitte.R * 0.07, 0.7), wach ? SILVER : DUSTC, vis * (h ? 0.6 : 0.3));   // Gold bleibt Ralfs Kristallisieren
    U.tueren[i] = toScreen(TMP[0], TMP[1], TMP[2]); }
}

/* Der Weg eines Fadens: im selben Bezirk ein flacher Bogen; über Bezirksgrenzen tritt er am eigenen Rand aus und am fremden ein */
function fadenWeg(N, f, A, Bp){
  const d = Math.hypot(A[0] - Bp[0], A[2] - Bp[2]), lift = d * 0.16 + 0.4;
  const za = f.bzVon === f.bzNach ? null : N.bezirkZiel(f.bzVon), zb = za ? N.bezirkZiel(f.bzNach) : null;
  if(!za || !zb) return t => [mix(A[0], Bp[0], t), mix(A[1], Bp[1], t) + Math.sin(Math.PI * t) * lift, mix(A[2], Bp[2], t)];
  const dx = zb.mitte[0] - za.mitte[0], dz = zb.mitte[2] - za.mitte[2], dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl;
  const P1 = [za.mitte[0] + ux * za.R, za.mitte[2] + uz * za.R], P2 = [zb.mitte[0] - ux * zb.R, zb.mitte[2] - uz * zb.R];
  return t => { const s = 1 - t, b0 = s * s * s, b1 = 3 * s * s * t, b2 = 3 * s * t * t, b3 = t * t * t;
    return [b0 * A[0] + b1 * P1[0] + b2 * P2[0] + b3 * Bp[0], mix(A[1], Bp[1], t) + Math.sin(Math.PI * t) * lift, b0 * A[2] + b1 * P1[1] + b2 * P2[1] + b3 * Bp[2]]; };
}
/* Ein Bündel: von Rand zu Rand, in Laufrichtung leicht nach links gebogen; so liegen Hin und Zurück nebeneinander */
function bogen(ca, Ra, cb, Rb){
  const dx = cb[0] - ca[0], dz = cb[2] - ca[2], dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl;
  const A = [ca[0] + ux * Ra, ca[2] + uz * Ra], Bq = [cb[0] - ux * Rb, cb[2] - uz * Rb], d = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), quer = d * 0.12, lift = d * 0.12 + 0.6;
  return t => { const w = Math.sin(Math.PI * t); return [mix(A[0], Bq[0], t) - uz * quer * w, w * lift, mix(A[1], Bq[1], t) + ux * quer * w]; };
}

/* Fadenstile: Material fließt (übernommen, erweitert), Verweis zeigt, Prüfen tickt, Widerspruch bricht, Zugehörigkeit steht */
const STIL = {
  'remixt-aus':   {c: mixc(WG, KEIMC, 0.6), a: 0.5, fluss: 'material'},   // warmes Weiß, nie Gold: Gold bleibt Ralfs Kristallisieren
  'erweitert':    {c: WG, a: 0.42, fluss: 'material'},
  'verweist-auf': {c: mixc(WG, SILVER, 0.5), a: 0.3, fluss: 'zeigt'},
  'testet':       {c: mixc(SILVER, WG, 0.3), a: 0.34, fluss: 'zeigt', strich: true},
  'widerspricht': {c: ASCHE, a: 0.4, luecke: true},
  'gehört-zu':    {c: SILVER, a: 0.28, strich: true},
};
export const FADEN_SATZ = {'remixt-aus': 'übernimmt Material aus', 'erweitert': 'erweitert', 'verweist-auf': 'verweist auf', 'testet': 'prüft', 'widerspricht': 'widerspricht', 'gehört-zu': 'gehört zu'};
