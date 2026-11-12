/* =====================================================================
   HÄUSER — jedes Haus des Dorfs wird einzeln entworfen und gebaut.
   Regeln aus dem Bestand (nicht verhandelbar):
     Haus = App. Fenster = genau eine Fassung, kein Fenster ohne Fassung. Stockwerk = Zeitabschnitt, unten der älteste.
     Fassungen ohne belegtes Datum sitzen unter dem Dach (Gauben und Giebelfenster): der Dachboden.
     Fensterläden und Gaubenfront tragen die Farbe der Stimme. Größe folgt der Zahl der Fassungen.
   Gestalt aus der Funktion (app/js/funktion.js) und einem festen Zufall aus dem Namen: keine zwei Häuser sind gleich.
   Bauteile, die nichts bedeuten (Sockel, Gesims, Rinne, Schornstein, Fachwerk, Türme), sind Bau und tragen keine Aussage.
   ===================================================================== */
import * as THREE from 'three/webgpu';
import {fassadenMatrix, zufall, hashS, farbe, toene, mische, WEISS} from './bau.js';

export const MASS = {A: 2.0, FB: 0.9, FH: 1.35, BR: 0.95, SH: 3.0, SOCKEL: 0.55, GA: 2.1, GB: 1.2, GH: 1.2, GG: 0.38, REIHE: 2.35};
const {A, FB, FH, BR, SH, SOCKEL, GA, GB, GH, GG, REIHE} = MASS;
const rad = g => g * Math.PI / 180;
const PUTZ = ['#e9dcc3', '#e2c9a0', '#d9b48a', '#cfa07c', '#e6d3b8', '#c9cdb6', '#b9c3c8', '#dcc2b4', '#efe6d6', '#d6b96f', '#c98f6b', '#bfae9a', '#a9b89f', '#e0d0a8'].map(farbe);
const LACK = ['#f1ece0', '#2f4a3a', '#7a2f2a', '#2e4460', '#5b4632', '#c9b27a', '#3d3d3d', '#6d7f5a'].map(farbe);
const DACH = ['#ffffff', '#f1d9c8', '#e2b9a2', '#d9c7b4', '#c9a48c', '#f6e2cf'].map(farbe);
const STEIN = farbe('#cfc6b6'), HOLZ = farbe('#8a6a4c'), DUNKELHOLZ = farbe('#5a4636'), ZINK = farbe('#8e979c'), KUPFER = farbe('#9fd3c0');

/* Wie die 24 Funktionen bauen: Grundmaße, Dachneigung, Wandstoffe, Besonderes */
const ART = {
  rathaus:     {w: 12, d: 9, neig: 50, wand: ['stein', 'putz'], dach: 'schiefer', teile: ['uhrturm', 'treppe', 'fahne']},
  saal:        {w: 13, d: 9, neig: 46, wand: ['putz', 'fachwerk'], dach: 'dachziegel', teile: ['vorhalle']},
  druckerei:   {w: 11, d: 8, neig: 40, wand: ['ziegelwand', 'ziegelwand'], dach: 'schiefer', teile: ['schlot']},
  post:        {w: 9, d: 7.5, neig: 50, wand: ['putz', 'putz'], dach: 'dachziegel', teile: ['eckturm', 'schild']},
  aussicht:    {w: 6.5, d: 6, neig: 54, wand: ['stein', 'putz'], dach: 'schiefer', teile: ['warte']},
  schule:      {w: 15, d: 8.5, neig: 46, wand: ['putz', 'putz'], dach: 'dachziegel', teile: ['risalit', 'dachreiter', 'treppe']},
  schularchiv: {w: 14, d: 10, neig: 58, wand: ['stein', 'fachwerk'], dach: 'dachziegel', teile: ['dachreiter']},
  spielhof:    {w: 8, d: 6.5, neig: 48, wand: ['putz', 'bretter'], dach: 'dachziegel', teile: ['laube']},
  musik:       {w: 9, d: 7.5, neig: 48, wand: ['putz', 'putz'], dach: 'schiefer', teile: ['rotunde']},
  museum:      {w: 12, d: 8.5, neig: 42, wand: ['stein', 'stein'], dach: 'schiefer', teile: ['portikus', 'laterne']},
  heilhaus:    {w: 9, d: 7, neig: 48, wand: ['putz', 'fachwerk'], dach: 'dachziegel', teile: ['veranda']},
  bibliothek:  {w: 10, d: 8, neig: 56, wand: ['stein', 'putzziegel'], dach: 'schiefer', teile: ['portikus']},
  klause:      {w: 5.5, d: 5, neig: 52, wand: ['stein', 'stein'], dach: 'schiefer', teile: ['holzstoss']},
  kaffeehaus:  {w: 8.5, d: 7, neig: 48, wand: ['putz', 'putz'], dach: 'dachziegel', teile: ['markise']},
  werkstatt:   {w: 9, d: 7.5, neig: 42, wand: ['ziegelwand', 'bretter'], dach: 'dachziegel', teile: ['schuppen', 'rohr']},
  sternwarte:  {w: 8, d: 7, neig: 50, wand: ['putz', 'putz'], dach: 'schiefer', teile: ['kuppelturm']},
  schreibstube:{w: 6.5, d: 7.5, neig: 56, wand: ['putz', 'fachwerk'], dach: 'dachziegel', teile: ['erkerdach'], giebel: true},
  kapelle:     {w: 9, d: 6.5, neig: 58, wand: ['stein', 'stein'], dach: 'schiefer', teile: ['glockenturm', 'apsis'], giebel: true},
  garage:      {w: 10, d: 7, neig: 34, wand: ['ziegelwand', 'bretter'], dach: 'dachziegel', teile: ['tore']},
  maerchen:    {w: 7, d: 6.5, neig: 60, wand: ['putz', 'fachwerk'], dach: 'dachziegel', teile: ['hexenturm']},
  bastel:      {w: 7.5, d: 6.5, neig: 50, wand: ['putz', 'bretter'], dach: 'dachziegel', teile: ['markise', 'kisten']},
  turnhalle:   {w: 12, d: 8.5, neig: 40, wand: ['ziegelwand', 'putz'], dach: 'schiefer', teile: ['vorhalle']},
  bildstock:   {w: 5, d: 4.5, neig: 54, wand: ['stein', 'stein'], dach: 'schiefer', teile: []},
  speicher:    {w: 8, d: 7.5, neig: 60, wand: ['stein', 'bretter'], dach: 'dachziegel', teile: ['kranbalken'], giebel: true},
};

const nf = len => Math.max(0, Math.floor((len - 1.3) / A));
const ng = len => Math.max(0, Math.floor((len - 1.6) / GA));
const gaubenReihen = (d, p) => { const frei = d / 2 - 1.95 / Math.tan(p) - 0.5; return frei < 0 ? 0 : Math.floor(frei / (REIHE * Math.cos(p))) + 1; };

/* ---------- Entwurf: Maße und Fensterplätze aus den Zahlen ---------- */
/* etagen: Zahl der Fassungen je Zeit-Stockwerk (unten zuerst), dachboden: Zahl ohne Datum */
export function entwirf({name, funktion, etagen, dachboden, baustelle}){
  const art = ART[funktion] || ART.schreibstube, z = zufall(hashS('haus:' + name)), stock = Math.max(1, etagen.length);
  const E = {name, funktion, art, stock, baustelle: !!baustelle, seed: hashS('haus:' + name),
    putz: PUTZ[Math.floor(z() * PUTZ.length)], lack: LACK[Math.floor(z() * LACK.length)], tuerfarbe: LACK[1 + Math.floor(z() * (LACK.length - 1))], dachton: DACH[Math.floor(z() * DACH.length)],
    kragung: art.wand[1] === 'fachwerk' && stock > 1 ? 0.18 + z() * 0.1 : 0, knie: 0.3 + z() * 0.5, neig: rad(art.neig + (z() - 0.5) * 8),
    giebelstaendig: !!art.giebel || (z() < 0.22 && !['rathaus', 'schule', 'museum', 'saal', 'turnhalle', 'schularchiv', 'garage'].includes(funktion)),
    kamine: 1 + Math.floor(z() * 2.2), spiegel: z() < 0.5, z1: z(), z2: z(), z3: z(), z4: z()};
  const bedarfE = Math.max(...etagen.map((n, i) => n + (i === 0 ? 1 : 0)), 1);
  let w = art.w * (0.92 + z() * 0.18), d = art.d * (0.92 + z() * 0.18), hof = false, S = 0, T = 9.5;
  const kapE = () => hof ? 4 * nf(S) + 4 * nf(S - 2 * T) + 0 : 2 * nf(w) + 2 * nf(d);
  const kapD = () => { if(hof){ const r = gaubenReihen(T, E.neig); return r * (2 * ng(S) + 6 * ng(S - 2 * T)) + 4 * giebelPlaetze(T, E).length; }
    return gaubenReihen(d, E.neig) * 2 * ng(w) + 2 * giebelPlaetze(d, E).length; };
  for(let runde = 0; runde < 400 && (kapE() < bedarfE || kapD() < dachboden); runde++){
    if(hof){ S += A; continue; }
    if(kapD() < dachboden && E.neig < rad(59)){ E.neig = Math.min(rad(60), E.neig + rad(3)); continue; }
    if(w < 26){ w += A / 2; if(w > d * 2.4 && d < 12) d += 1; }
    else { hof = true; S = 30; E.neig = rad(58); E.giebelstaendig = false; }
  }
  if(hof){ E.hof = {S, T}; E.breite = S; E.tiefe = S; }
  else if(E.giebelstaendig){ E.w = w; E.d = d; E.breite = d; E.tiefe = w; }
  else { E.w = w; E.d = d; E.breite = w; E.tiefe = d; }
  E.hoehe = SOCKEL + stock * SH + E.knie + (hof ? T : (E.d)) / 2 * Math.tan(E.neig);
  E.trakte = trakteVon(E); E.plaetze = plaetzeVon(E);
  if(E.plaetze.etage.some((l, i) => l.length < (etagen[i] || 0)) || E.plaetze.dach.length < dachboden) throw new Error('Zu wenig Fensterplätze: ' + name);
  return E;
}
function giebelPlaetze(d, E){ // Fenster im Giebelfeld: Reihen übereinander, solange das Dreieck breit genug ist
  const t = Math.tan(E.neig), r = [];
  for(let reihe = 0; reihe < 3; reihe++){ const yo = 0.75 + reihe * 2.1 + 1.2, halb = d / 2 - Math.max(0, yo - E.knie) / t - 0.35; if(halb < 0.5) break;
    const n = Math.max(1, Math.min(4, Math.floor((2 * halb - 0.2) / (FB + 0.75)))); if(2 * halb < FB) break;
    for(let i = 0; i < n; i++) r.push({u: d / 2 + (i - (n - 1) / 2) * (FB + 0.75), v: 0.75 + reihe * 2.1}); }
  return r;
}
/* Trakte: ein Riegel oder vier Riegel um einen Hof. Rahmen des Trakts: x entlang des Firsts, z quer, vorn = +z */
function trakteVon(E){
  const dreh = a => new THREE.Matrix4().makeRotationY(a), nach = (x, z, a) => new THREE.Matrix4().makeTranslation(x, 0, z).multiply(dreh(a));
  if(E.hof){ const {S, T} = E.hof, h = (S - T) / 2;
    return [{m: nach(0, h, 0), w: S, d: T, seiten: 'ZzXx', tuer: 'Z', tor: true}, {m: nach(0, -h, Math.PI), w: S, d: T, seiten: 'ZzXx'},
      {m: nach(h, 0, Math.PI / 2), w: S - 2 * T, d: T, seiten: 'Zz', innen: true}, {m: nach(-h, 0, -Math.PI / 2), w: S - 2 * T, d: T, seiten: 'Zz', innen: true}]; }
  if(E.giebelstaendig) return [{m: dreh(-Math.PI / 2), w: E.w, d: E.d, seiten: 'ZzXx', tuer: 'X'}];
  return [{m: new THREE.Matrix4(), w: E.w, d: E.d, seiten: 'ZzXx', tuer: 'Z'}];
}
const SEITE = { // Ursprung (links unten von außen), Richtung, Länge, Normale; j = Auskragung
  Z: (w, d, j) => ({o: [-w / 2 - j, 0, d / 2 + j], u: [1, 0, 0], len: w + 2 * j, n: [0, 0, 1]}),
  z: (w, d, j) => ({o: [w / 2 + j, 0, -d / 2 - j], u: [-1, 0, 0], len: w + 2 * j, n: [0, 0, -1]}),
  X: (w, d, j) => ({o: [w / 2 + j, 0, d / 2 + j], u: [0, 0, -1], len: d + 2 * j, n: [1, 0, 0]}),
  x: (w, d, j) => ({o: [-w / 2 - j, 0, -d / 2 - j], u: [0, 0, 1], len: d + 2 * j, n: [-1, 0, 0]}),
};
/* Alle Fensterplätze eines Entwurfs, die sichtbarsten zuerst (zur Straße, dann seitlich, dann hinten; je Seite von der Mitte aus) */
function plaetzeVon(E){
  const etage = Array.from({length: E.stock}, () => []), dach = [], vorn = new THREE.Vector3(0, 0, 1), n3 = new THREE.Vector3();
  const mitteAus = n => Array.from({length: n}, (_, i) => i).sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2) || a - b);
  E.trakte.forEach((T, ti) => {
    for(const s of T.seiten){ const S0 = SEITE[s](T.w, T.d, 0), sicht = n3.set(...S0.n).transformDirection(T.m).dot(vorn) + (T.innen && s === 'z' ? -0.4 : 0) - (E.hof && ((ti < 2 && s === 'z') || (ti >= 2 && s === 'z')) ? 0.3 : 0);
      for(let L = 0; L < E.stock; L++){ const j = L > 0 ? E.kragung : 0, Sd = SEITE[s](T.w, T.d, j), n = nf(Sd.len);
        for(const i of mitteAus(n)){ const u = Sd.len / 2 + (i - (n - 1) / 2) * A, tuer = L === 0 && T.tuer === s && i === mitteAus(n)[0];
          if(tuer){ T.tuerU = u; continue; }
          if(L === 0 && T.tor && s === 'Z' && Math.abs(u - Sd.len / 2) < 2.4) continue;
          etage[L].push({art: 'wand', t: ti, s, L, u, sicht: sicht - Math.abs(i - (n - 1) / 2) * 0.004}); } }
      if(nf(SEITE[s](T.w, T.d, 0).len) === 0 && T.tuer === s) T.tuerU = SEITE[s](T.w, T.d, 0).len / 2;
      if(s === 'X' || s === 'x'){ if(E.hof && T.innen) continue; for(const g of giebelPlaetze(T.d + 2 * (E.stock > 1 ? E.kragung : 0), E)) dach.push({art: 'giebel', t: ti, s, u: g.u, v: g.v, sicht: sicht + 0.2 - g.v * 0.01}); }
      else { const reihen = gaubenReihen(T.d, E.neig), n = ng(T.w); for(let r = 0; r < reihen; r++) for(const i of mitteAus(n)) dach.push({art: 'gaube', t: ti, s, r, u: (i - (n - 1) / 2) * GA, sicht: sicht - r * 0.02 - Math.abs(i - (n - 1) / 2) * 0.004}); }
    }
    if(T.tuer && T.tuerU == null) T.tuerU = SEITE[T.tuer](T.w, T.d, 0).len / 2;
  });
  for(const l of etage) l.sort((a, b) => b.sicht - a.sicht); dach.sort((a, b) => b.sicht - a.sicht);
  return {etage, dach};
}

/* ---------- Bau ---------- */
/* belegung: etagen[L] = [{nummer, hatBild, stimme (Farbe) }…], dach = […]. Gibt Fenster (mit Lage) und Merkpunkte zurück */
export function baue(S, E, lage, belegung){
  const out = {fenster: [], kamine: [], tuer: null, lampen: [], schild: null, fahnen: []};
  S.fuss = lage.elements[13];
  S.mit(lage, () => {
    const proTrakt = E.trakte.map(() => ({wand: [], giebel: [], gaube: []}));
    belegung.etagen.forEach((liste, L) => liste.forEach((f, i) => { const p = E.plaetze.etage[L][i]; proTrakt[p.t].wand.push({...p, f}); }));
    belegung.dach.forEach((f, i) => { const p = E.plaetze.dach[i]; proTrakt[p.t][p.art].push({...p, f}); });
    E.trakte.forEach((T, ti) => S.mit(T.m, () => baueTrakt(S, E, T, proTrakt[ti], out)));
    besonderes(S, E, out);
  });
  return out;
}

function fensterAn(S, u0, y0, f, E, out, {b = FB, h = FH, laden = true, sprossen = true, tief = 0.2} = {}){
  const u1 = u0 + b, y1 = y0 + h, t = tief, gew = toene(STEIN, 1.05);
  S.quad('putz', [u0, y0, 0], [u0, y0, -t], [u0, y1, -t], [u0, y1, 0], gew); S.quad('putz', [u1, y0, -t], [u1, y0, 0], [u1, y1, 0], [u1, y1, -t], gew);
  S.quad('stein', [u0, y0, 0], [u1, y0, 0], [u1, y0, -t], [u0, y0, -t], STEIN); S.quad('putz', [u0, y1, -t], [u1, y1, -t], [u1, y1, 0], [u0, y1, 0], gew);
  S.kasten('stein', u0 - 0.09, y0 - 0.08, -0.02, u1 + 0.09, y0, 0.09, STEIN);
  const z0 = -t + 0.015, z1 = -t + 0.07, r = 0.055, lk = E.lack;
  S.kasten('lack', u0, y0, z0, u0 + r, y1, z1, lk); S.kasten('lack', u1 - r, y0, z0, u1, y1, z1, lk); S.kasten('lack', u0, y1 - r, z0, u1, y1, z1, lk); S.kasten('lack', u0, y0, z0, u1, y0 + r, z1, lk);
  if(sprossen && !f.hatBild){ S.kasten('lack', (u0 + u1) / 2 - 0.02, y0, z0, (u0 + u1) / 2 + 0.02, y1, z1 - 0.01, lk); S.kasten('lack', u0, y0 + h * 0.62 - 0.02, z0, u1, y0 + h * 0.62 + 0.02, z1 - 0.01, lk); }
  if(laden){ const lf = f.stimme, lb = 0.43; S.kasten('lack', u0 - lb - 0.03, y0 - 0.02, 0, u0 - 0.03, y1 + 0.02, 0.045, lf); S.kasten('lack', u1 + 0.03, y0 - 0.02, 0, u1 + lb + 0.03, y1 + 0.02, 0.045, lf);
    for(const yy of [y0 + 0.2, y1 - 0.2]){ S.kasten('lack', u0 - lb - 0.03, yy - 0.04, 0.045, u0 - 0.03, yy + 0.04, 0.06, toene(lf, 0.8)); S.kasten('lack', u1 + 0.03, yy - 0.04, 0.045, u1 + lb + 0.03, yy + 0.04, 0.06, toene(lf, 0.8)); } }
  const sch = S.scheibe([(u0 + u1) / 2, (y0 + y1) / 2, -t + 0.01], [1, 0, 0], [0, 1, 0], b, h, f.nummer, f.hatBild); out.fenster.push({...sch, nummer: f.nummer});
}

function baueTrakt(S, E, T, bel, out){
  const {w, d} = T, p = E.neig, tanp = Math.tan(p), yA = SOCKEL + E.stock * SH, jO = E.stock > 1 ? E.kragung : 0, H = yA + E.knie, dO = d + 2 * jO, wO = w + 2 * jO, first = H + dO / 2 * tanp;
  const [stoffU, stoffO] = E.baustelle ? ['ziegelwand', 'ziegelwand'] : E.art.wand, tonU = stoffU === 'putz' || stoffU === 'putzziegel' ? E.putz : WEISS, tonO = stoffO === 'putz' || stoffO === 'fachwerk' ? mische(E.putz, WEISS, stoffO === 'fachwerk' ? 0.55 : 0) : WEISS;
  // Sockel aus Naturstein, reicht in den Boden
  S.kasten('stein', -w / 2 - 0.07, -1.6, -d / 2 - 0.07, w / 2 + 0.07, SOCKEL, d / 2 + 0.07, toene(STEIN, 0.82), 'xXzZY');
  for(const s of T.seiten){
    for(let L = 0; L < E.stock; L++){ const j = L > 0 ? E.kragung : 0, Sd = SEITE[s](w, d, j), y0 = SOCKEL + L * SH, fach = L > 0 && stoffO === 'fachwerk', stoff = L === 0 ? stoffU : (fach ? 'putz' : stoffO), ton = L === 0 ? tonU : tonO;
      const meine = bel.wand.filter(q => q.s === s && q.L === L), loecher = meine.map(q => [[q.u - FB / 2, BR], [q.u + FB / 2, BR], [q.u + FB / 2, BR + FH], [q.u - FB / 2, BR + FH]]);
      const tuer = L === 0 && T.tuer === s, tb = T.tor ? 1.5 : 0.62, th = T.tor ? 3.0 : 2.15; if(tuer) loecher.push([[T.tuerU - tb, 0], [T.tuerU + tb, 0], [T.tuerU + tb, th], [T.tuerU - tb, th]]);
      S.mit(fassadenMatrix([Sd.o[0], y0, Sd.o[2]], Sd.u), () => {
        S.wand(stoff, [0, 0, 0], [1, 0, 0], [0, 1, 0], [[0, 0], [Sd.len, 0], [Sd.len, SH], [0, SH]], loecher, ton);
        for(const q of meine) fensterAn(S, q.u - FB / 2, BR, q.f, E, out, {laden: !E.baustelle});
        if(fach) fachwerk(S, Sd.len, meine.map(q => q.u), E);
        if(L > 0 || E.stock === 1) S.kasten(L === E.stock - 1 ? 'holz' : 'stein', 0, SH - 0.14, 0, Sd.len, SH, 0.06, L === E.stock - 1 ? DUNKELHOLZ : STEIN, 'ZyY');
        if(L === 0 && E.stock > 1) S.kasten(E.kragung ? 'holz' : 'stein', -E.kragung, SH - 0.16, 0, Sd.len + E.kragung, SH + 0.05, E.kragung + 0.05, E.kragung ? DUNKELHOLZ : STEIN, 'ZyYxX');
        if(tuer){ const u = T.tuerU, gew = toene(STEIN, 0.95);
          S.quad('stein', [u - tb, 0, 0], [u - tb, 0, -0.25], [u - tb, th, -0.25], [u - tb, th, 0], gew); S.quad('stein', [u + tb, 0, -0.25], [u + tb, 0, 0], [u + tb, th, 0], [u + tb, th, -0.25], gew); S.quad('stein', [u - tb, th, -0.25], [u + tb, th, -0.25], [u + tb, th, 0], [u - tb, th, 0], gew);
          S.kasten('lack', u - tb, 0, -0.26, u + tb, th, -0.2, E.tuerfarbe, 'Z'); S.kasten('lack', u - 0.02, 0, -0.2, u + 0.02, th, -0.17, toene(E.tuerfarbe, 0.7), 'ZxX');
          S.kasten('stein', u - tb - 0.14, th, -0.02, u + tb + 0.14, th + 0.2, 0.08, STEIN); S.kasten('stein', u - tb - 0.3, -0.5, 0, u + tb + 0.3, -0.02, 0.9, toene(STEIN, 0.9)); S.kasten('stein', u - tb - 0.15, -0.3, 0, u + tb + 0.15, 0, 0.5, STEIN);
          S.kasten('zink', u + tb + 0.32, th - 0.1, 0.02, u + tb + 0.4, th + 0.02, 0.3, ZINK);
          const lp = S.welt([u + tb + 0.36, th - 0.28, 0.26]); out.lampen.push(lp); S.kasten('lampe', u + tb + 0.27, th - 0.42, 0.17, u + tb + 0.45, th - 0.14, 0.35, WEISS);
          out.tuer = {pos: S.welt([u, 0, 0.6]), innen: S.welt([u, 0, -1.2]), hoehe: th}; }
      });
    }
    // Kniestock und Giebelfeld
    const Sd = SEITE[s](w, d, jO), giebelStoff = E.baustelle ? 'ziegelwand' : (stoffO === 'fachwerk' ? 'bretter' : (E.z1 < 0.4 ? 'bretter' : stoffO === 'bretter' ? 'bretter' : stoffO)), gton = giebelStoff === 'bretter' ? toene(HOLZ, 1.1) : tonO;
    S.mit(fassadenMatrix([Sd.o[0], yA, Sd.o[2]], Sd.u), () => {
      if(s === 'Z' || s === 'z'){ if(E.knie > 0.01) S.wand(stoffO === 'fachwerk' ? 'putz' : stoffO, [0, 0, 0], [1, 0, 0], [0, 1, 0], [[0, 0], [Sd.len, 0], [Sd.len, E.knie], [0, E.knie]], [], tonO); return; }
      const meine = bel.giebel.filter(q => q.s === s), gb = FB, gh = 1.2;
      S.wand(giebelStoff, [0, 0, 0], [1, 0, 0], [0, 1, 0], [[0, 0], [Sd.len, 0], [Sd.len, E.knie], [Sd.len / 2, E.knie + Sd.len / 2 * tanp], [0, E.knie]], meine.map(q => [[q.u - gb / 2, q.v], [q.u + gb / 2, q.v], [q.u + gb / 2, q.v + gh], [q.u - gb / 2, q.v + gh]]), gton);
      for(const q of meine) fensterAn(S, q.u - gb / 2, q.v, q.f, E, out, {h: gh, laden: !E.baustelle && Sd.len > 5.5 && q.v < 1});
      if(!E.baustelle){ // Ortgangbretter
        S.balken('holz', [0, E.knie - 0.05, 0.36], [Sd.len / 2, E.knie + Sd.len / 2 * tanp - 0.05, 0.36], 0.05, 0.22, DUNKELHOLZ, [0, 0, 1]); S.balken('holz', [Sd.len, E.knie - 0.05, 0.36], [Sd.len / 2, E.knie + Sd.len / 2 * tanp - 0.05, 0.36], 0.05, 0.22, DUNKELHOLZ, [0, 0, 1]); }
    });
  }
  // Dach
  const oe = 0.5, og = 0.38, yE = H - oe * tanp, dachStoff = E.baustelle ? 'bretter' : E.art.dach, dt = dachStoff === 'dachziegel' ? E.dachton : dachStoff === 'bretter' ? HOLZ : WEISS, xl = -wO / 2 - og, xr = wO / 2 + og, zf = dO / 2 + oe;
  S.platte(dachStoff, 'holz', [xl, yE, zf], [xr, yE, zf], [xr, first, 0], [xl, first, 0], 0.13, dt, DUNKELHOLZ);
  S.platte(dachStoff, 'holz', [xr, yE, -zf], [xl, yE, -zf], [xl, first, 0], [xr, first, 0], 0.13, dt, DUNKELHOLZ);
  S.balken(dachStoff, [xl - 0.02, first + 0.02, 0], [xr + 0.02, first + 0.02, 0], 0.34, 0.14, toene(dt, 0.85));
  if(!E.baustelle){
    for(const sz of [1, -1]){ S.balken('zink', [xl, yE - 0.03, sz * (zf + 0.07)], [xr, yE - 0.03, sz * (zf + 0.07)], 0.15, 0.1, ZINK);
      const xx = (E.spiegel ? 1 : -1) * sz * (wO / 2 - 0.2); S.balken('zink', [xx, yE - 0.05, sz * (zf + 0.07)], [xx, yE - 0.5, sz * (dO / 2 + 0.09)], 0.09, 0.09, ZINK); S.balken('zink', [xx, yE - 0.5, sz * (dO / 2 + 0.09)], [xx, 0.25, sz * (dO / 2 + 0.09)], 0.09, 0.09, ZINK);
      for(let x = -wO / 2 + 0.3; x <= wO / 2 - 0.25; x += 0.85) S.balken('holz', [x, H - 0.1, sz * (dO / 2 - 0.05)], [x, yE - 0.1, sz * (zf - 0.04)], 0.09, 0.13, DUNKELHOLZ); }
  }
  // Gauben: jede eine Fassung ohne Datum
  for(const q of bel.gaube){ const vorn = q.s === 'Z', sr = 0.5 + q.r * REIHE * Math.cos(p), yb = H + sr * tanp, zv = dO / 2 - sr, u = vorn ? [1, 0, 0] : [-1, 0, 0], o = vorn ? [q.u - GB / 2, yb, zv] : [q.u + GB / 2, yb, -zv];
    S.mit(fassadenMatrix(o, u), () => { const fb = 0.8, fh = 0.92, f0 = (GB - fb) / 2, v0 = 0.16, tief = y => -y / tanp, front = E.baustelle ? HOLZ : q.f.stimme;
      S.wand('lack', [0, 0, 0], [1, 0, 0], [0, 1, 0], [[0, 0], [GB, 0], [GB, GH], [GB / 2, GH + GG], [0, GH]], [[[f0, v0], [f0 + fb, v0], [f0 + fb, v0 + fh], [f0, v0 + fh]]], front);
      S.kasten('lack', f0 - 0.05, v0 - 0.05, 0, f0 + fb + 0.05, v0, 0.05, E.lack); S.kasten('lack', f0 - 0.05, v0 + fh, 0, f0 + fb + 0.05, v0 + fh + 0.05, 0.04, E.lack); S.kasten('lack', f0 - 0.05, v0, 0, f0, v0 + fh, 0.04, E.lack); S.kasten('lack', f0 + fb, v0, 0, f0 + fb + 0.05, v0 + fh, 0.04, E.lack);
      if(!q.f.hatBild) S.kasten('lack', GB / 2 - 0.018, v0, -0.05, GB / 2 + 0.018, v0 + fh, 0.0, E.lack);
      S.flaeche('bretter', [[0, 0, 0], [0, GH, 0], [0, GH, tief(GH)]], [[0, 0], [0, GH], [-tief(GH), GH]], toene(HOLZ, 0.9)); S.flaeche('bretter', [[GB, 0, 0], [GB, GH, tief(GH)], [GB, GH, 0]], [[0, 0], [-tief(GH), GH], [0, GH]], toene(HOLZ, 0.9));
      const e = 0.12, ye = GH - 0.06, yf = GH + GG, vz = 0.16;
      S.quad(dachStoff, [-e, ye, vz], [GB / 2, yf, vz], [GB / 2, yf, tief(yf)], [-e, ye, tief(ye)], dt); S.quad(dachStoff, [GB / 2, yf, vz], [GB + e, ye, vz], [GB + e, ye, tief(ye)], [GB / 2, yf, tief(yf)], dt);
      S.balken('holz', [-e, ye - 0.03, vz], [GB / 2, yf - 0.03, vz], 0.04, 0.12, DUNKELHOLZ, [0, 0, 1]); S.balken('holz', [GB + e, ye - 0.03, vz], [GB / 2, yf - 0.03, vz], 0.04, 0.12, DUNKELHOLZ, [0, 0, 1]);
      const sch = S.scheibe([GB / 2, v0 + fh / 2, -0.06], [1, 0, 0], [0, 1, 0], fb, fh, q.f.nummer, q.f.hatBild); out.fenster.push({...sch, nummer: q.f.nummer});
    });
  }
  // Schornsteine auf dem First (nur am Haupttrakt, nicht auf der Baustelle)
  if(!E.baustelle && !T.innen){ const zk = zufall(E.seed + Math.round(w * 10)), n = E.hof ? 2 : E.kamine;
    for(let i = 0; i < n; i++){ const x = (i === 0 ? -1 : 1) * (E.spiegel ? 1 : -1) * wO * (0.18 + zk() * 0.2), zz = (zk() - 0.5) * 1.2, yy = first - Math.abs(zz) * tanp, kb = 0.36, top = first + 0.75 + zk() * 0.5, ks = E.art.wand[0] === 'stein' ? 'stein' : 'ziegelwand';
      S.kasten(ks, x - kb, yy - 0.4, zz - kb * 0.8, x + kb, top, zz + kb * 0.8, WEISS, 'xXzZ'); S.kasten('stein', x - kb - 0.07, top, zz - kb * 0.8 - 0.07, x + kb + 0.07, top + 0.1, zz + kb * 0.8 + 0.07, STEIN);
      S.drehkoerper('dachziegel', x, zz, [[0.13, top + 0.1], [0.11, top + 0.45]], 8, toene(E.dachton, 0.8)); out.kamine.push(S.welt([x, top + 0.5, zz])); } }
  // Baustelle: Gerüst aus Stangen und Bohlen vor der Straßenseite
  if(E.baustelle && T.tuer){ const Sd = SEITE[T.tuer](w, d, 0); S.mit(fassadenMatrix([Sd.o[0], 0, Sd.o[2]], Sd.u), () => {
    for(let x = -0.2; x <= Sd.len + 0.3; x += 2.2){ S.balken('holz', [x, -0.3, 1.25], [x, H + 1, 1.25], 0.08, 0.08, HOLZ); S.balken('holz', [x, -0.3, 0.3], [x, H + 1, 0.3], 0.08, 0.08, HOLZ); for(let y = 2.2; y < H + 0.5; y += 2.2) S.balken('holz', [x, y, 0.3], [x, y, 1.25], 0.07, 0.07, HOLZ); }
    for(let y = 2.2; y < H + 0.5; y += 2.2){ S.kasten('bretter', -0.3, y + 0.04, 0.32, Sd.len + 0.3, y + 0.09, 1.22, toene(HOLZ, 1.25)); S.balken('holz', [-0.3, y + 1, 1.25], [Sd.len + 0.3, y + 1, 1.25], 0.05, 0.08, HOLZ); }
    S.balken('holz', [-0.2, 0, 1.27], [Sd.len * 0.5, H, 1.27], 0.05, 0.08, HOLZ); }); }
}

/* Fachwerk: Ständer zwischen den Fensterachsen, Riegel an Brüstung und Sturz, Streben an den Ecken. Reiner Bau */
function fachwerk(S, len, fensterU, E){
  const b = 0.16, t = 0.035, f = DUNKELHOLZ, n = nf(len), ach = Array.from({length: n + 1}, (_, i) => len / 2 + (i - n / 2) * A);
  S.kasten('holz', 0, 0, 0, len, b, t, f, 'ZyY'); S.kasten('holz', 0, SH - 0.14 - b, 0, len, SH - 0.14, t, f, 'ZyY');
  S.kasten('holz', 0, 0, 0, b, SH, t, f, 'ZxX'); S.kasten('holz', len - b, 0, 0, len, SH, t, f, 'ZxX');
  for(const x of ach) if(x > b * 1.5 && x < len - b * 1.5) S.kasten('holz', x - b / 2, 0, 0, x + b / 2, SH - 0.14, t, f, 'ZxX');
  for(let i = 0; i < ach.length - 1; i++){ const x0 = ach[i] + b / 2, x1 = ach[i + 1] - b / 2, mitte = (ach[i] + ach[i + 1]) / 2, hatF = fensterU.some(u => Math.abs(u - mitte) < 0.3);
    S.kasten('holz', x0, BR - 0.1 - b, 0, x1, BR - 0.1, t, f, 'ZyY'); S.kasten('holz', x0, BR + FH + 0.08, 0, x1, BR + FH + 0.08 + b, t, f, 'ZyY');
    if(!hatF && (i + E.seed) % 3 === 0){ S.balken('holz', [x0, b, t / 2], [x1, BR - 0.1 - b, t / 2], t, b * 0.85, f, [0, 0, 1]); S.balken('holz', [x1, b, t / 2], [x0, BR - 0.1 - b, t / 2], t, b * 0.85, f, [0, 0, 1]); } }
  if(ach[0] > 0.9){ S.balken('holz', [b, b, t / 2], [ach[0] - b / 2, SH - 0.3, t / 2], t, b * 0.85, f, [0, 0, 1]); S.balken('holz', [len - b, b, t / 2], [len - ach[0] + b / 2, SH - 0.3, t / 2], t, b * 0.85, f, [0, 0, 1]); }
}

/* ---------- Was ein Haus zu dem macht, was es ist: Türme, Vorhallen, Schlote. Kein Fenster, keine Aussage ---------- */
function besonderes(S, E, out){
  if(E.baustelle) return;
  const B = E.breite, T = E.tiefe, vz = T / 2, H0 = SOCKEL + E.stock * SH, sp = E.spiegel ? 1 : -1, hat = t => E.art.teile.includes(t), z = zufall(E.seed + 7);
  const turm = (x, zz, r, h, {rund = false, stoff = 'stein', dach = 'schiefer', spitze = 3.2, ton = WEISS, kupfer = false} = {}) => {
    if(rund) S.drehkoerper(stoff, x, zz, [[r, -1], [r, h]], 14, ton); else S.kasten(stoff, x - r, -1, zz - r, x + r, h, zz + r, ton, 'xXzZ');
    S.drehkoerper('stein', x, zz, [[r * (rund ? 1 : 1.42), h - 0.18], [r * (rund ? 1 : 1.42) + 0.12, h - 0.1], [r * (rund ? 1 : 1.42) + 0.12, h]], rund ? 14 : 4, STEIN, Math.PI / 4, Math.PI * 2 + Math.PI / 4);
    const rr = r * (rund ? 1 : 1.42) + 0.3; S.drehkoerper(kupfer ? 'kupfer' : dach, x, zz, [[rr, h - 0.05], [rr * 0.55, h + spitze * 0.45], [0, h + spitze]], rund ? 14 : 4, kupfer ? KUPFER : WEISS, Math.PI / 4, Math.PI * 2 + Math.PI / 4);
    S.balken('zink', [x, h + spitze - 0.1, zz], [x, h + spitze + 0.9, zz], 0.04, 0.04, ZINK); return h + spitze + 0.9; };
  const saeulen = (n, breit, tief, h, stoff = 'stein') => { for(let i = 0; i < n; i++){ const x = (i - (n - 1) / 2) * breit / Math.max(1, n - 1); S.drehkoerper(stoff, x, vz + tief, [[0.24, 0], [0.2, 0.25], [0.17, h - 0.25], [0.24, h - 0.08], [0.26, h]], 10, stoff === 'holz' ? DUNKELHOLZ : STEIN); } };
  if(hat('uhrturm')){ const h = H0 + 7.5, x = sp * (B / 2 - 1.4), zz = vz - 1.2; turm(x, zz, 1.7, h, {stoff: 'stein', kupfer: true, spitze: 5});
    S.mit(new THREE.Matrix4().makeTranslation(x, h - 2.3, zz + 1.72), () => { S.drehkoerper('lampe', 0, 0, [[0, 0], [0.85, 0]], 20, WEISS); }); // Platz der Uhr; das Zifferblatt selbst kommt als leuchtende Scheibe
    S.mit(new THREE.Matrix4().makeTranslation(x, h - 2.3, zz + 1.71).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)), () => { S.drehkoerper('uhr', 0, 0, [[0.9, 0], [0, 0.001]], 24, WEISS); S.drehkoerper('zink', 0, 0, [[0.98, -0.06], [0.98, 0.02], [0.9, 0.02]], 24, ZINK); });
    out.schild = null; }
  if(hat('treppe')){ for(let i = 0; i < 3; i++) S.kasten('stein', -2.6 - i * 0.3, -0.6, vz, 2.6 + i * 0.3, SOCKEL - 0.02 - (i + 1) * 0.17, vz + 0.6 + i * 0.36, toene(STEIN, 0.95)); }
  if(hat('fahne')) out.fahnen.push({pos: S.welt([sp * (B / 2 - 0.6), H0 + 0.5, vz + 0.4]), hoch: 3.2});
  if(hat('vorhalle')){ saeulen(4, Math.min(B * 0.6, 7), 2.4, 3.2, 'holz'); S.platte(E.art.dach, 'holz', [-Math.min(B * 0.6, 7) / 2 - 0.5, 3.15, vz + 2.9], [Math.min(B * 0.6, 7) / 2 + 0.5, 3.15, vz + 2.9], [Math.min(B * 0.6, 7) / 2 + 0.5, 4.3, vz], [-Math.min(B * 0.6, 7) / 2 - 0.5, 4.3, vz], 0.12, E.art.dach === 'dachziegel' ? E.dachton : WEISS, DUNKELHOLZ);
    S.kasten('holz', -Math.min(B * 0.6, 7) / 2 - 0.3, 3.0, vz + 2.25, Math.min(B * 0.6, 7) / 2 + 0.3, 3.2, vz + 2.55, DUNKELHOLZ); }
  if(hat('portikus')){ const pb = Math.min(B * 0.55, 6.5), ph = SOCKEL + Math.min(E.stock, 2) * SH - 0.3; saeulen(4, pb, 2.0, ph);
    S.kasten('stein', -pb / 2 - 0.5, ph, vz, pb / 2 + 0.5, ph + 0.5, vz + 2.4, STEIN); S.kasten('stein', -pb / 2 - 0.4, -0.6, vz, pb / 2 + 0.4, 0.02, vz + 2.6, toene(STEIN, 0.9));
    S.flaeche('stein', [[-pb / 2 - 0.6, ph + 0.5, vz + 2.42], [pb / 2 + 0.6, ph + 0.5, vz + 2.42], [0, ph + 0.5 + pb * 0.2, vz + 2.42]], [[0, 0], [pb + 1.2, 0], [pb / 2 + 0.6, pb * 0.2]], STEIN);
    S.quad('schiefer', [-pb / 2 - 0.7, ph + 0.5, vz + 2.5], [0, ph + 0.52 + pb * 0.2, vz + 2.5], [0, ph + 0.52 + pb * 0.2, vz], [-pb / 2 - 0.7, ph + 0.5, vz], WEISS); S.quad('schiefer', [0, ph + 0.52 + pb * 0.2, vz + 2.5], [pb / 2 + 0.7, ph + 0.5, vz + 2.5], [pb / 2 + 0.7, ph + 0.5, vz], [0, ph + 0.52 + pb * 0.2, vz], WEISS); }
  if(hat('schlot')){ const x = -sp * (B / 2 + 1.6), zz = -vz + 1.5; S.kasten('ziegelwand', x - 1, -1, zz - 1, x + 1, 2.2, zz + 1, WEISS, 'xXzZY'); S.drehkoerper('ziegelwand', x, zz, [[0.75, 2.2], [0.5, E.hoehe + 6], [0.58, E.hoehe + 6.1], [0.58, E.hoehe + 6.5]], 12, WEISS); out.kamine.push(S.welt([x, E.hoehe + 6.6, zz])); }
  if(hat('eckturm')){ turm(sp * (B / 2 - 0.2), vz - 0.2, 1.25, H0 + 2.4, {rund: true, stoff: 'putz', ton: E.putz, dach: 'dachziegel', spitze: 2.8}); }
  if(hat('warte')){ const h = H0 + 9; turm(0, 0, 1.9, h, {stoff: 'stein', spitze: 3.4}); for(const [a, b2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) S.balken('holz', [a * 2.5, h - 2.2, b2 * 2.5], [a * 2.5, h - 1.1, b2 * 2.5], 0.1, 0.1, DUNKELHOLZ);
    S.kasten('bretter', -2.6, h - 2.4, -2.6, 2.6, h - 2.25, 2.6, HOLZ); for(const [x0, z0, x1, z1] of [[-2.5, 2.5, 2.5, 2.5], [2.5, 2.5, 2.5, -2.5], [2.5, -2.5, -2.5, -2.5], [-2.5, -2.5, -2.5, 2.5]]) S.balken('holz', [x0, h - 1.15, z0], [x1, h - 1.15, z1], 0.08, 0.1, DUNKELHOLZ); }
  if(hat('risalit')){ const rb = Math.min(5.2, B * 0.3), rh = H0 + 1.2; S.kasten('putz', -rb / 2, SOCKEL, vz, rb / 2, rh, vz + 0.5, mische(E.putz, WEISS, 0.35), 'xXZ'); S.kasten('stein', -rb / 2 - 0.06, -1, vz, rb / 2 + 0.06, SOCKEL, vz + 0.56, toene(STEIN, 0.82), 'xXZY');
    S.flaeche('putz', [[-rb / 2, rh, vz + 0.5], [rb / 2, rh, vz + 0.5], [0, rh + rb * 0.42, vz + 0.5]], [[0, 0], [rb, 0], [rb / 2, rb * 0.42]], mische(E.putz, WEISS, 0.35));
    S.quad(E.art.dach, [-rb / 2 - 0.3, rh - 0.12, vz + 0.85], [0, rh + rb * 0.42 + 0.14, vz + 0.85], [0, rh + rb * 0.42 + 0.14, 0], [-rb / 2 - 0.3, rh - 0.12, 0], E.dachton); S.quad(E.art.dach, [0, rh + rb * 0.42 + 0.14, vz + 0.85], [rb / 2 + 0.3, rh - 0.12, vz + 0.85], [rb / 2 + 0.3, rh - 0.12, 0], [0, rh + rb * 0.42 + 0.14, 0], E.dachton);
    S.kasten('lack', -0.75, 0, vz + 0.5, 0.75, 2.5, vz + 0.56, E.tuerfarbe, 'ZxX'); S.kasten('stein', -0.95, 2.5, vz + 0.5, 0.95, 2.75, vz + 0.62, STEIN);
    out.schild = {pos: S.welt([0, Math.min(rh - 1.3, H0 - 0.6), vz + 0.53]), breit: rb * 0.8, n: new THREE.Vector3(0, 0, 1).transformDirection(S.M)};
    for(let i = 0; i < 5; i++) out.fahnen.push({pos: S.welt([(i - 2) * 1.9, -0.2, vz + 5.5]), hoch: 6.2, logo: i}); }
  if(hat('dachreiter')){ const y = E.hoehe - 0.3, x = E.hof ? 0 : sp * B * 0.08, zz = E.hof ? (E.hof.S - E.hof.T) / 2 : 0; S.kasten('bretter', x - 0.6, y - 0.6, zz - 0.6, x + 0.6, y + 1.3, zz + 0.6, toene(HOLZ, 1.1), 'xXzZ');
    S.drehkoerper('kupfer', x, zz, [[1.0, y + 1.25], [0.5, y + 2.1], [0, y + 3.5]], 4, KUPFER, Math.PI / 4, Math.PI * 2.25); S.balken('zink', [x, y + 3.4, zz], [x, y + 4.2, zz], 0.04, 0.04, ZINK); }
  if(hat('laube')){ const x = sp * (B / 2 + 2.2); for(const [a, b2] of [[-1.4, -1.2], [1.4, -1.2], [1.4, 1.2], [-1.4, 1.2]]) S.balken('holz', [x + a, -0.3, b2], [x + a, 2.4, b2], 0.1, 0.1, HOLZ);
    S.drehkoerper('bretter', x, 0, [[2.3, 2.35], [0, 3.4]], 4, HOLZ, Math.PI / 4, Math.PI * 2.25); S.balken('holz', [x - 1.4, 2.3, 1.2], [x + 1.4, 2.3, 1.2], 0.08, 0.1, HOLZ); S.balken('zink', [x - 0.5, 2.3, 1.2], [x - 0.5, 0.7, 1.2], 0.02, 0.02, ZINK); S.balken('zink', [x + 0.1, 2.3, 1.2], [x + 0.1, 0.7, 1.2], 0.02, 0.02, ZINK); S.kasten('bretter', x - 0.6, 0.64, 1.1, x + 0.2, 0.7, 1.3, HOLZ); }
  if(hat('rotunde')){ const r = Math.min(4.2, T * 0.48), x = sp * (B / 2 + r * 0.55), h = SOCKEL + Math.min(E.stock, 2) * SH * 0.9; S.drehkoerper('stein', x, 0, [[r + 0.08, -1], [r + 0.08, SOCKEL]], 22, toene(STEIN, 0.82)); S.drehkoerper('putz', x, 0, [[r, SOCKEL], [r, h]], 22, mische(E.putz, WEISS, 0.3));
    S.drehkoerper('stein', x, 0, [[r, h - 0.16], [r + 0.14, h - 0.08], [r + 0.14, h]], 22, STEIN); S.drehkoerper('kupfer', x, 0, [[r + 0.35, h - 0.02], [r * 0.9, h + r * 0.35], [r * 0.5, h + r * 0.62], [0.5, h + r * 0.72], [0.5, h + r * 0.72 + 0.7], [0, h + r * 0.72 + 1.3]], 22, KUPFER);
    for(let i = 0; i < 9; i++){ const a = -Math.PI / 2 + (i - 4) * 0.32 * sp; S.balken('stein', [x + Math.cos(a) * (r + 0.03), SOCKEL, -Math.sin(a) * (r + 0.03)], [x + Math.cos(a) * (r + 0.03), h - 0.16, -Math.sin(a) * (r + 0.03)], 0.3, 0.12, STEIN, [Math.cos(a), 0, -Math.sin(a)]); } }
  if(hat('laterne')){ const y = E.hoehe - 0.5; S.kasten('zink', -1.5, y, -0.9, 1.5, y + 0.9, 0.9, ZINK, 'xXzZ'); S.platte('kupfer', 'zink', [-1.7, y + 0.85, 1.1], [1.7, y + 0.85, 1.1], [1.7, y + 1.5, 0], [-1.7, y + 1.5, 0], 0.06, KUPFER, ZINK); S.platte('kupfer', 'zink', [1.7, y + 0.85, -1.1], [-1.7, y + 0.85, -1.1], [-1.7, y + 1.5, 0], [1.7, y + 1.5, 0], 0.06, KUPFER, ZINK); }
  if(hat('veranda')){ const vb = B * 0.8; for(let i = 0; i < 5; i++){ const x = (i - 2) * vb / 4; if(Math.abs(x) < 0.5) continue; S.balken('holz', [x, -0.2, vz + 2.1], [x, 2.55, vz + 2.1], 0.11, 0.11, DUNKELHOLZ); }
    S.platte(E.art.dach, 'holz', [-vb / 2 - 0.3, 2.5, vz + 2.5], [vb / 2 + 0.3, 2.5, vz + 2.5], [vb / 2 + 0.3, 3.25, vz], [-vb / 2 - 0.3, 3.25, vz], 0.1, E.dachton, DUNKELHOLZ); S.balken('holz', [-vb / 2, 2.5, vz + 2.1], [vb / 2, 2.5, vz + 2.1], 0.1, 0.14, DUNKELHOLZ);
    S.kasten('bretter', -vb / 2 - 0.1, -0.5, vz, vb / 2 + 0.1, SOCKEL - 0.2, vz + 2.25, HOLZ); for(const s2 of [-1, 1]) S.balken('holz', [s2 * vb / 2, 1.2, vz + 2.1], [s2 * 0.9, 1.2, vz + 2.1], 0.05, 0.07, DUNKELHOLZ); }
  if(hat('holzstoss')){ const x = sp * (B / 2 + 0.55); S.kasten('holz', x - 0.45, -0.2, -1.6, x + 0.45, 1.3, 1.6, toene(HOLZ, 1.2)); S.platte('bretter', 'holz', [x + sp * -0.6, 1.75, 1.9], [x + sp * 0.75, 1.4, 1.9], [x + sp * 0.75, 1.4, -1.9], [x + sp * -0.6, 1.75, -1.9].slice(), 0.05, HOLZ); }
  if(hat('markise')){ const mb = Math.min(B * 0.7, 5.5), streif = [farbe('#b8432f'), farbe('#efe6d2')]; for(let i = 0; i < 8; i++){ const x0 = -mb / 2 + i * mb / 8; S.platte('lack', 'lack', [x0, 2.45, vz + 1.7], [x0 + mb / 8, 2.45, vz + 1.7], [x0 + mb / 8, 2.95, vz + 0.05], [x0, 2.95, vz + 0.05], 0.03, streif[(i + (E.seed & 1)) % 2]); }
    S.balken('zink', [-mb / 2, 2.43, vz + 1.7], [mb / 2, 2.43, vz + 1.7], 0.04, 0.04, ZINK); for(const s2 of [-1, 1]) S.balken('zink', [s2 * mb / 2, 2.43, vz + 1.7], [s2 * mb / 2, 2.0, vz + 0.05], 0.03, 0.03, ZINK); }
  if(hat('kisten')){ for(let i = 0; i < 4; i++){ const x = -sp * (1.6 + (i % 2) * 0.75), y = -0.1 + Math.floor(i / 2) * 0.62; S.kasten('bretter', x - 0.33, y, vz + 0.6, x + 0.33, y + 0.6, vz + 1.25, toene(HOLZ, 1 + i * 0.1)); } }
  if(hat('schuppen')){ const x0 = sp > 0 ? B / 2 : -B / 2 - 4.2, sb = 4.2, sh = 3.1; S.kasten('bretter', x0, -1, -vz + 0.6, x0 + sb, sh, vz - 0.5, toene(HOLZ, 1.05), 'xXzZ'); const hoch = sp > 0 ? [x0, x0 + sb] : [x0 + sb, x0];
    S.platte('zink', 'holz', [x0 - 0.2, sp > 0 ? sh + 0.9 : sh, vz - 0.2], [x0 + sb + 0.2, sp > 0 ? sh : sh + 0.9, vz - 0.2], [x0 + sb + 0.2, sp > 0 ? sh : sh + 0.9, -vz + 0.3], [x0 - 0.2, sp > 0 ? sh + 0.9 : sh, -vz + 0.3], 0.08, toene(ZINK, 0.9), DUNKELHOLZ);
    S.kasten('lack', x0 + 0.6, -0.1, vz - 0.5, x0 + sb - 0.6, 2.6, vz - 0.44, E.tuerfarbe, 'ZxXY'); S.balken('holz', [x0 + 0.6, 0, vz - 0.42], [x0 + sb - 0.6, 2.6, vz - 0.42], 0.03, 0.12, DUNKELHOLZ, [0, 0, 1]); }
  if(hat('rohr')){ const x = -sp * B * 0.3, y = E.hoehe - 1.2; S.drehkoerper('zink', x, -T * 0.2, [[0.14, y - 1], [0.14, y + 2]], 8, ZINK); S.drehkoerper('zink', x, -T * 0.2, [[0.24, y + 2], [0.02, y + 2.3]], 8, ZINK); out.kamine.push(S.welt([x, y + 2.3, -T * 0.2])); }
  if(hat('kuppelturm')){ const r = 2.3, x = sp * (B / 2 - 0.4), zz = -vz + 1.5, h = H0 + 3.2; S.drehkoerper('stein', x, zz, [[r + 0.1, -1], [r + 0.1, SOCKEL]], 18, toene(STEIN, 0.82)); S.drehkoerper('putz', x, zz, [[r, SOCKEL], [r, h]], 18, mische(E.putz, WEISS, 0.4));
    S.drehkoerper('stein', x, zz, [[r, h - 0.2], [r + 0.18, h - 0.1], [r + 0.18, h + 0.12]], 18, STEIN); const kp = []; for(let i = 0; i <= 8; i++){ const a = i / 8 * Math.PI / 2; kp.push([Math.cos(a) * (r + 0.05), h + 0.12 + Math.sin(a) * (r + 0.05)]); } S.drehkoerper('kupfer', x, zz, kp, 20, KUPFER, 0.5, Math.PI * 2 + 0.18);
    S.drehkoerper('zink', x, zz, [[r - 0.2, h + 0.1], [0.01, h + 0.11]], 12, toene(ZINK, 0.25)); }
  if(hat('erkerdach')){ const y = SOCKEL + SH * (E.stock > 1 ? 1 : 0.55), eb = 1.9; S.kasten('holz', -eb / 2, y - 0.15, vz, eb / 2, y, vz + 0.75, DUNKELHOLZ); S.platte('dachziegel', 'holz', [-eb / 2 - 0.2, y + 0.02, vz + 0.95], [eb / 2 + 0.2, y + 0.02, vz + 0.95], [eb / 2 + 0.2, y + 0.55, vz], [-eb / 2 - 0.2, y + 0.55, vz], 0.06, E.dachton, DUNKELHOLZ); for(const s2 of [-1, 1]) S.balken('holz', [s2 * eb / 2 * 0.9, y - 0.15, vz + 0.7], [s2 * eb / 2 * 0.9, y - 0.95, vz + 0.02], 0.09, 0.09, DUNKELHOLZ); }
  if(hat('glockenturm')){ const h = E.hoehe + 3.5, x = 0, zz = vz + 1.3; turm(x, zz, 1.5, h, {stoff: 'stein', spitze: 6.5}); for(const [dx, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) S.kasten('zink', x + dx * 1.51 - (dz ? 0.35 : 0.01), h - 2.2, zz + dz * 1.51 - (dx ? 0.35 : 0.01), x + dx * 1.51 + (dz ? 0.35 : 0.01), h - 0.9, zz + dz * 1.51 + (dx ? 0.35 : 0.01), toene(ZINK, 0.18));
    S.kasten('lack', x - 0.6, -0.2, zz + 1.5, x + 0.6, 2.3, zz + 1.56, E.tuerfarbe, 'ZxXY'); out.tuer = {pos: S.welt([x, 0, zz + 2.2]), innen: S.welt([x, 0, 0]), hoehe: 2.3}; }
  if(hat('apsis')){ const r = Math.min(B, 6) * 0.42, h = SOCKEL + E.stock * SH * 0.85; S.drehkoerper('stein', 0, -vz, [[r, -1], [r, h]], 12, WEISS, 0, Math.PI); S.drehkoerper('schiefer', 0, -vz, [[r + 0.25, h - 0.02], [0, h + r * 0.9]], 12, WEISS, 0, Math.PI); }
  if(hat('tore')){ const n = Math.max(2, Math.min(4, Math.floor(B / 3.4))); for(let i = 0; i < n; i++){ const x = -sp * (B / 2 + 0.2) + sp * (i + 0.5) * 3.2 * -1, xx = sp > 0 ? -B / 2 - 0.4 - (i + 0.5) * 3.3 : B / 2 + 0.4 + (i + 0.5) * 3.3;
      S.kasten('ziegelwand', xx - 1.65, -1, -vz + 0.8, xx + 1.65, 3.0, vz - 0.6, WEISS, 'xXzZ'); S.kasten('lack', xx - 1.25, -0.1, vz - 0.6, xx + 1.25, 2.5, vz - 0.54, E.tuerfarbe, 'ZxXY'); S.kasten('stein', xx - 1.4, 2.5, vz - 0.6, xx + 1.4, 2.72, vz - 0.5, STEIN);
      S.platte('zink', 'holz', [xx - 1.75, 3.0, vz - 0.3], [xx + 1.75, 3.0, vz - 0.3], [xx + 1.75, 3.5, -vz + 0.6], [xx - 1.75, 3.5, -vz + 0.6], 0.08, toene(ZINK, 0.9), DUNKELHOLZ); } }
  if(hat('hexenturm')){ const x = -sp * (B / 2 - 0.5), zz = vz - 0.6, h = H0 + 1.6; S.drehkoerper('stein', x, zz, [[1.2, -1], [1.15, 1.2]], 12, toene(STEIN, 0.85)); S.drehkoerper('putz', x, zz, [[1.15, 1.2], [1.25, h]], 12, mische(E.putz, WEISS, 0.3));
    S.drehkoerper('dachziegel', x, zz, [[1.75, h - 0.25], [1.0, h + 1.2], [0.42, h + 3.0], [0.0, h + 5.0]], 12, toene(E.dachton, 0.95)); for(let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; S.balken('holz', [x + Math.cos(a) * 1.2, h - 0.5, zz - Math.sin(a) * 1.2], [x + Math.cos(a) * 1.72, h - 0.22, zz - Math.sin(a) * 1.72], 0.08, 0.1, DUNKELHOLZ); } }
  if(hat('kranbalken')){ const y = E.hoehe - 1.4; S.balken('holz', [0, y, vz - 0.3], [0, y, vz + 1.5], 0.16, 0.2, DUNKELHOLZ); S.balken('holz', [0, y - 0.9, vz], [0, y - 0.1, vz + 1.0], 0.1, 0.1, DUNKELHOLZ); S.balken('zink', [0, y - 0.1, vz + 1.35], [0, y - 2.2, vz + 1.35], 0.025, 0.025, ZINK); S.kasten('bretter', -0.35, y - 2.75, vz + 1.05, 0.35, y - 2.2, vz + 1.65, HOLZ); }
  if(hat('schild')){ S.balken('zink', [sp * 1.6, 3.1, vz], [sp * 1.6, 3.1, vz + 1.1], 0.04, 0.04, ZINK); S.kasten('lack', sp * 1.6 - 0.02, 2.35, vz + 0.35, sp * 1.6 + 0.02, 3.0, vz + 1.05, farbe('#e8b93a')); }
  // Bank vor dem Haus und ein Holzzaun am Garten entstehen im Ortsplan; hier nur, was am Haus hängt: ein Spalier an einer Seite
  if(z() < 0.5 && !E.hof && E.stock >= 1){ const x = sp * (B / 2 + 0.03), n = 4; for(let i = 0; i < n; i++){ const zz = -T * 0.25 + i * 0.45; S.balken('holz', [x, SOCKEL, zz], [x, SOCKEL + 2.4, zz], 0.03, 0.03, HOLZ); } for(let i = 0; i < 5; i++) S.balken('holz', [x, SOCKEL + 0.3 + i * 0.5, -T * 0.25 - 0.1], [x, SOCKEL + 0.3 + i * 0.5, -T * 0.25 + 1.45], 0.03, 0.03, HOLZ); }
}
