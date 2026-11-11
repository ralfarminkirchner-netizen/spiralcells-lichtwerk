/* Dorf — Orte, Identität und Begegnung.

   Draufsicht eines Dorfs. In der Mitte der Dorfplatz: das Tragwerk System, seine Apps als Häuser im Kreis
   um den Platz, dazwischen die Ringstraße. Von dort führen Straßen in die Quartiere: die Oberdächer, jedes mit
   seiner Ortsfarbe, seinem Grund und einem großen Ortsschild am Ende der Straße. „Zur Prüfung“ ist eine
   Baustelle am Rand. Bereiche (FASKA, Rebeca Wild) sind eigene Höfe mit Zaun.
   Ein Haus ist eine App. Seine Größe kennt drei Stufen nach der Zahl der Fassungen; sein Fenster zeigt ein
   echtes Bild, ohne Bild ein leeres Papierblatt. Entlang der Straße stehen die Häuser in der Zeitfolge ihrer
   ersten belegten Fassung, Häuser ohne belegte Zeit am Ende.
   Wer ein Haus betritt, steht in seinem Grundriss: Räume sind Werke, an den Wänden hängen die Fassungen in
   Zeitfolge, ohne belegte Zeit am Ende, ohne Bild als Papierblatt. „Hinausgehen“ führt an dieselbe Stelle zurück.
   Lage, Abstand, Straßen und Richtung der Quartiere sind Gestaltung; belegt sind nur Ort, Hof, Haus, Raum und Bild. */

import {el, knopf, farbe, titelBild, n, tagWort, ruhig, kuerze, platzhalter, SANS, stil} from './gemein.js';
import {wegZu, mengenWort, zeitWort} from './inhalt.js';

export const legende = `<p><b>Dorfplatz</b> in der Mitte: das Tragwerk System. <b>Quartiere</b> rundum: die Oberdächer, jedes in seiner Farbe, das <b>Ortsschild</b> am Ende seiner Straße. <b>Höfe</b> mit Zaun: Bereiche wie FASKA. Die <b>Baustelle</b> am Rand: was noch zur Prüfung liegt.</p>
<p>Jedes <b>Haus</b> ist eine App. Größe in drei Stufen: <i>klein</i> bis eine Fassung, <i>mittel</i> 2 bis 9, <i>groß</i> 10 und mehr. Das Fenster zeigt ein echtes Bild; ein <i>leeres Papierblatt</i> heißt: ohne Bild. Ein kleines <b>Doppelhaus</b> am Dach heißt: dasselbe Werk wohnt auch in einem anderen Quartier; ein Tipp darauf führt dorthin. Der <b>Aushang</b> trägt Gespräche, die an einem Ort oder Hof hängen.</p>
<p>Entlang der Straße stehen die Häuser in der Zeitfolge ihrer ersten belegten Fassung, ohne belegte Zeit am Ende. Straßen, Abstände und Himmelsrichtung sind Gestaltung und behaupten nichts.</p>
<p><b>Innen</b>: jeder Raum ist ein Werk, an seinen Wänden die Fassungen in Zeitfolge, ohne belegte Zeit zuletzt, ohne Bild als Papierblatt. Der <b>Flur</b> trägt Fassungen der App ohne eigenes Werk.</p>
<p>Ziehen verschiebt, Rad oder zwei Finger zoomen; Namen erscheinen, sobald Platz ist. Ein Tipp auf ein Haus geht hinein; ein Tipp wählt eine Fassung, ein zweiter öffnet sie. Tab erreicht jedes Haus, Esc geht eine Stufe hinaus.</p>`;

/* ---------- Maße der Welt (Weltpunkte) ---------- */
const BREITE = {1: 28, 2: 38, 3: 50};          // Hausbreite je Stufe
const HOCH = 1.14;                              // Haus: Dach über Wand
const SW = 16;                                  // Straßenbreite
const LUECKE = 9;                               // Abstand zwischen Häusern
const PLATZ = 'Tragwerk System', BAU = 'Zur Prüfung';
const stufe = k => (k.fassungen || 0) >= 10 ? 3 : (k.fassungen || 0) >= 2 ? 2 : 1;
const STUFENWORT = {1: 'kleines Haus', 2: 'mittleres Haus', 3: 'großes Haus'};
const ausdehnung = (e, d) => Math.abs(d[0]) * e.w + Math.abs(d[1]) * e.h;   // Breite eines Rechtecks in Richtung d
const richtung = t => [Math.sin(t), -Math.cos(t)];                              // 0 = Norden, im Uhrzeigersinn

/* ---------- Einheiten: Haus, Hof, Aushang ---------- */
function einheiten(o){
  const r = [];
  for(const c of o.kinder || []) if(c.kinder) r.push(c.art === 'app' ? haus(c) : hof(c));
  const lose = (o.kinder || []).filter(c => !c.kinder);
  if(lose.length) r.push({typ: 'brett', k: o, lose, w: BREITE[1], h: BREITE[1] * HOCH});
  return r;
}
const haus = k => { const st = stufe(k); return {typ: 'haus', k, st, w: BREITE[st], h: BREITE[st] * HOCH}; };
function hof(k){
  const innen = einheiten(k), z = innen.length || 1;
  const sp = Math.max(1, Math.ceil(Math.sqrt(z * 1.6))), zl = Math.ceil(z / sp);
  const cw = Math.max(...innen.map(e => e.w), 20) + 14, ch = Math.max(...innen.map(e => e.h), 20) + 14, pad = 12;
  const w = sp * cw + 2 * pad, h = zl * ch + 2 * pad;
  innen.forEach((e, i) => { const c = i % sp, r = Math.floor(i / sp), inReihe = Math.min(sp, z - r * sp);
    e.dx = -w / 2 + pad + (c + 0.5 + (sp - inReihe) / 2) * cw; e.dy = -h / 2 + pad + (r + 0.5) * ch; });
  return {typ: 'hof', k, innen, w, h};
}
function setze(e, x, y){ e.x = x; e.y = y; if(e.innen) for(const i of e.innen) setze(i, x + i.dx, y + i.dy); }
const rechteck = (e, pad = 0) => ({x0: e.x - e.w / 2 - pad, y0: e.y - e.h / 2 - pad, x1: e.x + e.w / 2 + pad, y1: e.y + e.h / 2 + pad});
const schneiden = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/* ---------- Der Dorfplatz: Ringe von Häusern, Lücken für die Straßen ---------- */
function platzAnlegen(einh, winkel){
  const PLATZR = 104, T = 29, SCHRITT = T + 10 + SW + 12 + T;
  // Höfe stehen im äußeren Ring, damit sie die Ringstraße nicht berühren; sonst bleibt die Zeitfolge
  const liste = [...einh.filter(e => e.typ !== 'hof'), ...einh.filter(e => e.typ === 'hof')];
  const breite = e => e.w * 1.06 + LUECKE;
  const tore = nr => nr === 0 ? winkel.filter((_, j) => j % 2 === 0) : winkel;   // innen führt nur jede zweite Straße bis zum Platz
  const abschnitte = (nr, r) => { const t = [...tore(nr)].sort((x, y) => x - y), g = (SW + 30) / r;
    return t.map((a, j) => ({a: a + g / 2, b: (j + 1 < t.length ? t[j + 1] : t[0] + 2 * Math.PI) - g / 2, e: []})); };
  const fasst = (nr, r) => abschnitte(nr, r).reduce((s, q) => s + (q.b - q.a) * r, 0);
  const bedarf = liste.reduce((s, e) => s + breite(e), 0);
  // so viele Ringe, dass alle mit gleicher Dichte Platz finden
  let radien = [];
  for(let z = 1; z <= 8; z++){ radien = Array.from({length: z}, (_, i) => PLATZR + 12 + T + i * SCHRITT);
    if(bedarf <= 0.9 * radien.reduce((s, r, i) => s + fasst(i, r), 0)) break; }
  const kap = radien.map((r, i) => fasst(i, r)), summe = kap.reduce((s, v) => s + v, 0);
  const ringe = radien.map((r, i) => ({r, seg: abschnitte(i, r), e: [], tiefe: 0}));
  let lauf = 0;
  for(const e of liste){ const mitte = (lauf + breite(e) / 2) / bedarf * summe; let i = 0, c = kap[0];
    while(i < kap.length - 1 && mitte > c){ i++; c += kap[i]; } ringe[i].e.push(e); lauf += breite(e); }
  if(ringe.length > 1 && liste.some(e => e.typ === 'hof')){ const aus = ringe[ringe.length - 1]; for(const R of ringe.slice(0, -1)) for(const e of R.e.filter(x => x.typ === 'hof')){ R.e.splice(R.e.indexOf(e), 1); aus.e.push(e); } }
  for(const R of ringe){
    const L = R.seg.map(q => (q.b - q.a) * R.r), ges = L.reduce((s, v) => s + v, 0), dem = R.e.reduce((s, e) => s + breite(e), 0);
    let l = 0; for(const e of R.e){ const m = (l + breite(e) / 2) / Math.max(1, dem) * ges; let i = 0, c = L[0]; while(i < L.length - 1 && m > c){ i++; c += L[i]; } R.seg[i].e.push(e); l += breite(e); }
    for(const q of R.seg){ if(!q.e.length) continue;
      const Lq = (q.b - q.a) * R.r, sum = q.e.reduce((s, e) => s + breite(e), 0), frei = Math.max(0, (Lq - sum) / (q.e.length + 1));
      let pos = frei; for(const e of q.e){ const t = q.a + (pos + breite(e) / 2) / R.r; setze(e, Math.sin(t) * R.r, -Math.cos(t) * R.r); pos += breite(e) + frei; R.tiefe = Math.max(R.tiefe, Math.max(e.w, e.h) / 2); } }
  }
  const strassenRinge = radien.slice(0, -1).map(r => r + T + 10 + SW / 2);
  const letzter = ringe[ringe.length - 1] || {r: PLATZR, tiefe: 0};
  return {PLATZR, strassenRinge: strassenRinge.length ? strassenRinge : [letzter.r + letzter.tiefe + 10 + SW / 2], aussen: letzter.r + Math.max(T, letzter.tiefe)};
}

/* ---------- Ein Quartier: Straße hinaus, Häuser zu beiden Seiten, Höfe am Ende ---------- */
function quartierAnlegen(q, t, bau){
  const u = richtung(t), v = [-u[1], u[0]];
  const einh = einheiten(q), haeuser = einh.filter(e => e.typ !== 'hof'), hoefe = einh.filter(e => e.typ === 'hof');
  const reihen = haeuser.length <= 6 ? 1 : haeuser.length <= 16 ? 2 : 3;
  const tiefe = Math.max(30, ...haeuser.map(e => ausdehnung(e, v)));
  const bahnen = []; for(let j = 0; j < reihen; j++) for(const s of [-1, 1]) bahnen.push({s, j, lauf: 0, hlauf: 0});
  const seiteLauf = s => Math.max(...bahnen.filter(b => b.s === s).map(b => b.lauf));
  for(const e of einh){
    const al = ausdehnung(e, u);
    if(e.typ === 'hof'){   // ein Hof steht neben der Straße und nimmt die ganze Seite ein
      const s = seiteLauf(-1) <= seiteLauf(1) ? -1 : 1, l = seiteLauf(s);
      e.entlang = l + al / 2; e.quer = s * (SW / 2 + 10 + ausdehnung(e, v) / 2);
      for(const b of bahnen) if(b.s === s) b.lauf = l + al + LUECKE + 6;
      continue;
    }
    let b = bahnen[0]; for(const c of bahnen) if(c.lauf < b.lauf - 0.5) b = c;
    e.entlang = b.lauf + al / 2; e.quer = b.s * (SW / 2 + 8 + b.j * (tiefe + 14) + tiefe / 2); b.lauf += al + LUECKE; b.hlauf = b.lauf;
  }
  const ende = Math.max(0, ...bahnen.map(b => b.lauf));
  const gassen = []; for(let j = 1; j < reihen; j++) for(const s of [-1, 1]){ const b = bahnen.find(x => x.s === s && x.j === j); if(b && b.hlauf > 0) gassen.push({quer: s * (SW / 2 + 8 + j * (tiefe + 14) - 7), lauf: b.hlauf}); }
  return {k: q, t, u, v, einh, haeuser, hoefe, ende, gassen, bau, start: 0};
}
function quartierSetzen(Q){
  for(const e of Q.einh) setze(e, Q.u[0] * (Q.start + e.entlang) + Q.v[0] * e.quer, Q.u[1] * (Q.start + e.entlang) + Q.v[1] * e.quer);
}
const flach = e => e.innen ? [e, ...e.innen.flatMap(flach)] : [e];

/* Konvexe Hülle (Monotone Kette) um Punkte */
function huelle(p){
  p = p.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if(p.length < 3) return p;
  const kreuz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for(const q of p){ while(lo.length >= 2 && kreuz(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for(const q of p.slice().reverse()){ while(hi.length >= 2 && kreuz(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
const eckenVon = e => [[e.x - e.w / 2, e.y - e.h / 2], [e.x + e.w / 2, e.y - e.h / 2], [e.x + e.w / 2, e.y + e.h / 2], [e.x - e.w / 2, e.y + e.h / 2]];
const pfad = pts => pts.length ? 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z' : '';

/* ---------- Das ganze Dorf ---------- */
function dorfAnlegen(W){
  const platzOrt = W.kinder.find(o => o.kinder && o.name === PLATZ) || null;
  const quartiere = W.kinder.filter(o => o.kinder && o !== platzOrt && o.name !== BAU);
  const bau = W.kinder.filter(o => o.kinder && o.name === BAU);
  const flaecheVon = o => einheiten(o).reduce((s, e) => s + e.w * e.h, 0);
  const nachGroesse = quartiere.slice().sort((a, b) => flaecheVon(b) - flaecheVon(a));
  const gross = nachGroesse.slice(0, Math.ceil((quartiere.length + bau.length) / 2)), klein = [...nachGroesse.slice(gross.length), ...bau];
  // Die Großen nach Ost und West (die Bühne ist breiter als hoch), dann Süd und Nord; die Kleinen dazwischen
  const z = quartiere.length + bau.length || 1, plaetze = [];
  for(const i of [0, z / 2, z / 4, 3 * z / 4]) plaetze.push(Math.round(i) % z);
  for(let i = 0; i < z; i++) if(i % 2 === 0 && !plaetze.includes(i)) plaetze.push(i);
  for(let i = 0; i < z; i++) if(!plaetze.includes(i)) plaetze.push(i);
  const alleQ = new Array(z);
  gross.forEach((q, i) => { alleQ[plaetze[i]] = q; });
  klein.forEach((q, i) => { const frei = plaetze.slice(gross.length).filter(p => !alleQ[p]); alleQ[frei.find(p => p % 2 === 1) ?? frei[0]] = q; });
  const winkel = alleQ.map((_, i) => Math.PI / 2 + i * 2 * Math.PI / z);
  const platzEinh = platzOrt ? einheiten(platzOrt) : [];
  const lose = W.kinder.filter(o => !o.kinder);
  if(lose.length) platzEinh.push({typ: 'brett', k: W, lose, w: BREITE[1], h: BREITE[1] * HOCH});
  const P = platzAnlegen(platzEinh, winkel);
  const Qs = alleQ.map((q, i) => quartierAnlegen(q, winkel[i], q.name === BAU));
  for(const Q of Qs){ Q.start = P.aussen + 34 + (Q.bau ? 30 : 0); quartierSetzen(Q); }
  // Quartiere schieben sich hinaus, bis keines ein anderes oder den Platz berührt
  const platzRechtecke = platzEinh.flatMap(flach).filter(e => e.typ !== 'hof').map(e => rechteck(e, 16));
  const rechteckeVon = Q => Q.einh.map(e => rechteck(e, 10));
  for(let runde = 0; runde < 400; runde++){
    let bewegt = false;
    for(let a = 0; a < Qs.length; a++){
      const ra = rechteckeVon(Qs[a]);
      let stoss = ra.some(r => platzRechtecke.some(p => schneiden(r, p)));
      for(let b = 0; b < Qs.length && !stoss; b++){ if(a === b) continue; const rb = rechteckeVon(Qs[b]); if(ra.some(r => rb.some(s => schneiden(r, s)))) stoss = Qs[a].einh.length <= Qs[b].einh.length || Qs[a].start <= Qs[b].start; }
      if(stoss){ Qs[a].start += 10; quartierSetzen(Qs[a]); bewegt = true; }
    }
    if(!bewegt) break;
  }
  for(const Q of Qs){ const pts = Q.einh.flatMap(eckenVon); Q.grund = huelle(pts); }
  const alle = [...platzEinh.flatMap(flach), ...Qs.flatMap(Q => Q.einh.flatMap(flach))];
  const welt = alle.reduce((b, e) => ({x0: Math.min(b.x0, e.x - e.w / 2), y0: Math.min(b.y0, e.y - e.h / 2), x1: Math.max(b.x1, e.x + e.w / 2), y1: Math.max(b.y1, e.y + e.h / 2)}), {x0: -P.aussen, y0: -P.aussen, x1: P.aussen, y1: P.aussen});
  return {platzOrt, platzEinh, P, Qs, alle, welt, winkel};
}

/* ---------- Bodenzeichnung als SVG (Weltpunkte) ---------- */
const NS = 'http://www.w3.org/2000/svg';
function boden(D, mitHaeusern = false){
  const {welt, P, Qs} = D, m = 160;
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', `${welt.x0 - m} ${welt.y0 - m} ${welt.x1 - welt.x0 + 2 * m} ${welt.y1 - welt.y0 + 2 * m}`);
  s.setAttribute('aria-hidden', 'true');
  const t = [];
  t.push(`<defs><pattern id="dorf-bau" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#ecebe6"/><line x1="0" y1="0" x2="0" y2="9" stroke="#c9c5b8" stroke-width="3"/></pattern></defs>`);
  // Grund der Quartiere: gepolsterte Hülle in der Farbe des Orts
  for(const Q of Qs){ const f = farbe(Q.k), d = pfad(Q.grund), pad = 22;
    t.push(`<path class="dgrund" data-q="${Qs.indexOf(Q)}" d="${d}" fill="${Q.bau ? 'url(#dorf-bau)' : f.h}" stroke="${Q.bau ? '#8c8a80' : f.f}" stroke-width="${2 * pad + 3}" stroke-linejoin="round" stroke-opacity="${Q.bau ? .9 : .55}" ${Q.bau ? 'stroke-dasharray="10 7"' : ''}/>`);
    t.push(`<path d="${d}" fill="${Q.bau ? 'url(#dorf-bau)' : f.h}" stroke="${Q.bau ? '#ecebe6' : f.h}" stroke-width="${2 * pad}" stroke-linejoin="round"/>`);
    if(Q.bau) t.push(`<path d="${d}" fill="url(#dorf-bau)" stroke="none"/>`);
  }
  // Straßen: erst der Rand, dann die Fläche
  const strasse = [], gasse = [];
  for(const r of P.strassenRinge) strasse.push(`<circle cx="0" cy="0" r="${r.toFixed(1)}"/>`);
  Qs.forEach((Q, i) => {
    const bisPlatz = i % 2 === 0, r0 = bisPlatz ? P.PLATZR - 6 : P.strassenRinge[0];
    const r1 = Q.start + Q.ende - (Q.hoefe.length ? 0 : 0);
    strasse.push(`<line x1="${(Q.u[0] * r0).toFixed(1)}" y1="${(Q.u[1] * r0).toFixed(1)}" x2="${(Q.u[0] * r1).toFixed(1)}" y2="${(Q.u[1] * r1).toFixed(1)}"/>`);
    for(const g of Q.gassen){ const a = [Q.u[0] * Q.start + Q.v[0] * g.quer, Q.u[1] * Q.start + Q.v[1] * g.quer], b = [Q.u[0] * (Q.start + g.lauf) + Q.v[0] * g.quer, Q.u[1] * (Q.start + g.lauf) + Q.v[1] * g.quer];
      const a0 = [Q.u[0] * Q.start, Q.u[1] * Q.start];
      gasse.push(`<polyline points="${a0[0].toFixed(1)},${a0[1].toFixed(1)} ${a[0].toFixed(1)},${a[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}"/>`); }
  });
  t.push(`<g fill="none" stroke="#cbbd9f" stroke-width="${SW + 4}" stroke-linecap="round">${strasse.join('')}</g>`);
  t.push(`<g fill="none" stroke="#d9ccb2" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">${gasse.join('')}</g>`);
  t.push(`<g fill="none" stroke="#ece3d0" stroke-width="${SW}" stroke-linecap="round">${strasse.join('')}</g>`);
  t.push(`<g fill="none" stroke="#efe7d6" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${gasse.join('')}</g>`);
  // Der Platz: gepflastert, ein Brunnenrand in der Mitte
  t.push(`<circle cx="0" cy="0" r="${P.PLATZR}" fill="#e7ddc9" stroke="#cbbd9f" stroke-width="3"/>`);
  t.push(`<circle cx="0" cy="0" r="${P.PLATZR - 14}" fill="none" stroke="#d6c9ae" stroke-width="1.5" stroke-dasharray="2 6"/>`);
  // Höfe mit Zaun
  for(const e of D.alle) if(e.typ === 'hof'){ const f = farbe(e.k), r = rechteck(e);
    t.push(`<rect x="${r.x0}" y="${r.y0}" width="${e.w}" height="${e.h}" rx="10" fill="#fbf8f1" fill-opacity=".75" stroke="${f.d}" stroke-width="2.6" stroke-dasharray="1.6 3.4"/>`);
    t.push(`<rect x="${r.x0 + 3}" y="${r.y0 + 3}" width="${e.w - 6}" height="${e.h - 6}" rx="8" fill="none" stroke="${f.f}" stroke-opacity=".5" stroke-width="1"/>`); }
  if(mitHaeusern) for(const e of D.alle) if(e.typ !== 'hof'){ const f = farbe(e.k), r = rechteck(e);
    t.push(`<rect x="${r.x0}" y="${(r.y0 + e.h * .3).toFixed(1)}" width="${e.w}" height="${(e.h * .7).toFixed(1)}" fill="#fbf8f1" stroke="${f.d}" stroke-width="2"/><path d="M${r.x0 - 3} ${(r.y0 + e.h * .32).toFixed(1)}L${e.x} ${r.y0}L${r.x1 + 3} ${(r.y0 + e.h * .32).toFixed(1)}Z" fill="${f.f}"/>`); }
  s.innerHTML = t.join('');
  return s;
}

/* Kleines Doppelhaus: Zeichen für „wohnt auch in …“ */
const DOPPEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 21V11l5-5 5 5v10Z" fill="currentColor" opacity=".55"/><path d="M11 21V12l5.5-5.5L22 12v9Z" fill="currentColor"/></svg>';

export function starte(flaeche, K){
  stil('dorf');
  const I = K.inhalt, W = I.wurzel;
  const D = dorfAnlegen(W);
  const huelle0 = el('div', 'dorf'); flaeche.append(huelle0);
  const mass = document.createElement('canvas').getContext('2d');
  let gew = null, zuletzt = null, drinnen = null, gemerkt = null, modus = null, tot = false;
  let handyOrt = null;           // am Handy: das Quartier unten als Straße
  const knotenEl = new Map();    // Knoten → Haus (Karte und Handy), für Fokus und Rückweg
  const alleHaeuser = [];        // jedes gezeichnete Haus und jeder Aushang
  const merkeHaus = h => { alleHaeuser.push(h); if(h.e.typ === 'haus') knotenEl.set(h.e.k, h); else { knotenEl.set(h.e.k, h); for(const l of h.e.lose) knotenEl.set(l, h); } };

  const twins = k => (I.nachSchluessel.get(k.schluessel) || []).filter(q => q !== k);
  const woWort = q => wegZu(q).slice(1, -1).map(x => x.name).join(' › ');
  const ortVon = k => wegZu(k)[1] || null;

  /* ================= Karte (breit) ================= */
  let karte, weltEl, schilderEl, zoom, C = {s: 1, x: 0, y: 0}, flug = 0, geplant = false;
  const sMax = 5;
  let sMin = 0.2;
  const hausEls = [];   // {e, el, name}
  const schilder = [];  // {Q|platz|hof, el, w, h}

  function baueKarte(){
    karte = el('div', 'dkarte'); huelle0.append(karte);
    weltEl = el('div', 'dwelt'); karte.append(weltEl);
    weltEl.append(boden(D));
    const svg = weltEl.firstChild, vb = svg.viewBox.baseVal;
    Object.assign(svg.style, {left: vb.x + 'px', top: vb.y + 'px', width: vb.width + 'px', height: vb.height + 'px'});
    schilderEl = el('div', 'dschilder'); karte.append(schilderEl);
    hausEls.length = 0; schilder.length = 0;
    // Platzschild
    if(D.platzOrt){ const b = schildKnopf(D.platzOrt, 'Dorfplatz', D.platzOrt.name, `${n(D.platzEinh.filter(e => e.typ !== 'brett').flatMap(flach).filter(e => e.typ === 'haus').length, 'Haus', 'Häuser')} · ${n(D.platzOrt.fassungen, 'Fassung', 'Fassungen')}`);
      b.classList.add('platz'); schilder.push({art: 'platz', k: D.platzOrt, el: b}); }
    // Quartiersschilder
    for(const Q of D.Qs){ const hz = Q.einh.flatMap(flach).filter(e => e.typ === 'haus').length;
      const b = schildKnopf(Q.k, Q.bau ? 'Baustelle' : 'Quartier', Q.k.name, `${n(hz, 'Haus', 'Häuser')} · ${n(Q.k.fassungen, 'Fassung', 'Fassungen')}`);
      if(Q.bau) b.classList.add('bau'); schilder.push({art: 'q', Q, k: Q.k, el: b}); }
    // Häuser und Höfe, in der Reihenfolge Platz, dann Quartiere: so wandert auch Tab durch das Dorf
    const reihe = [...D.platzEinh.flatMap(flach), ...D.Qs.flatMap(Q => Q.einh.flatMap(flach))];
    for(const e of reihe){
      if(e.typ === 'hof'){ const b = knopf('dhofname', null, () => K.waehle(e.k, {vonAnsicht: true}), (e.k.art === 'ort' ? 'Ort ' : 'Hof ') + e.k.name + ', ' + mengenWort(e.k));
        b.append(el('small', '', e.k.art === 'ort' ? 'Ort' : 'Hof'), el('span', '', e.k.name)); b.style.setProperty('--f', farbe(e.k).f); b.style.setProperty('--d', farbe(e.k).d);
        schilderEl.append(b); schilder.push({art: 'hof', e, k: e.k, el: b}); continue; }
      const h = hausEl(e); weltEl.append(h.el); hausEls.push(h);
    }
    for(const s of schilder) if(!s.el.isConnected) schilderEl.append(s.el);
    zoom = el('div', 'zoomknoepfe');
    zoom.append(knopf('knopf rund', '+', () => umZoom(1.6), 'Näher heran'), knopf('knopf rund', '−', () => umZoom(1 / 1.6), 'Weiter weg'), knopf('knopf', 'Ganzes Dorf', () => { angepasst = true; fliege(ganzerBlick(), 520); }));
    karte.append(zoom);
    bedienung();
  }
  const KNAPP = 0.62;   // darunter tragen die Ortsschilder nur den Namen; Mengen stehen im Blatt
  function masseSchild(sc){
    if(sc.voll) return; const b = sc.el, weg = b.classList.contains('weg'); b.classList.remove('knapp', 'weg'); sc.voll = {w: b.offsetWidth, h: b.offsetHeight};
    b.classList.add('knapp'); sc.knapp = {w: b.offsetWidth, h: b.offsetHeight}; b.classList.remove('knapp'); if(weg) b.classList.add('weg');
  }
  function schildKnopf(k, art, name, menge){
    const b = knopf('dschild', null, () => K.waehle(k, {vonAnsicht: true}), art + ' ' + name + ', ' + menge);
    const f = farbe(k); b.style.setProperty('--f', f.f); b.style.setProperty('--d', f.d); b.style.setProperty('--h', f.h);
    b.append(el('small', 'dsart', art), el('span', 'dsname', name), el('small', 'dsmenge', menge));
    return b;
  }
  function hausEl(e){
    const k = e.k, f = farbe(k), d = el('div', 'dhaus st' + (e.st || 1) + (e.typ === 'brett' ? ' brett' : ''));
    Object.assign(d.style, {left: (e.x - e.w / 2) + 'px', top: (e.y - e.h / 2) + 'px', width: e.w + 'px', height: e.h + 'px'});
    d.style.setProperty('--f', f.f); d.style.setProperty('--d', f.d); d.style.setProperty('--h', f.h);
    let wort, b;
    if(e.typ === 'brett'){
      wort = 'Aushang';
      b = knopf('dtuer', null, () => K.waehle(e.lose[0], {vonAnsicht: true}), `Aushang ${k.art === 'wurzel' ? 'am Platz' : 'in ' + k.name}: ${n(e.lose.length, 'Gespräch', 'Gespräche')}. Ansehen.`);
      b.innerHTML = '<span class="dbrettflaeche"><i></i><i></i><i></i></span><span class="dpfosten"></span>';
    } else {
      wort = k.name;
      const ort = ortVon(k), hofK = k.eltern && k.eltern.art !== 'ort' && k.eltern.art !== 'wurzel' ? k.eltern : null;
      b = knopf('dtuer', null, () => K.waehle(k, {vonAnsicht: true}), `${k.name}, ${STUFENWORT[e.st]} in ${ort ? ort.name : 'Ralfs Werke'}${hofK ? ', Hof ' + hofK.name : ''}, ${mengenWort(k)}. Hineingehen.`);
      const fenster = el('span', 'dfenster'), tb = titelBild(k);
      if(tb){ const i = new Image(); i.loading = 'lazy'; i.decoding = 'async'; i.alt = ''; i.src = K.bildUrl(tb, 240); i.onerror = () => { fenster.classList.add('ohne'); i.remove(); }; fenster.append(i); }
      else fenster.classList.add('ohne');
      b.append(el('span', 'ddach'), el('span', 'dwand'), fenster, el('span', 'dtuerblatt'));
    }
    d.append(b);
    const tw = e.typ === 'haus' ? twins(k) : [];
    if(tw.length){ const a = knopf('dauch', null, () => { K.sage('Dasselbe Werk wohnt auch in ' + woWort(tw[0]) + '. Du bist jetzt dort.'); K.waehle(tw[0], {vonAnsicht: true}); }, `${k.name} wohnt auch in ${tw.map(woWort).join(', ')}. Dorthin gehen.`); a.innerHTML = DOPPEL; d.append(a);
      a.addEventListener('focus', () => sichtbarMachen(e)); }
    const name = el('span', 'dname', wort); name.setAttribute('aria-hidden', 'true'); name.style.setProperty('--f', f.f);
    if(e.typ === 'brett') name.textContent = `Aushang · ${n(e.lose.length, 'Gespräch', 'Gespräche')}`;
    schilderEl.append(name);
    const h = {e, el: d, knopf: b, name, text: name.textContent};
    merkeHaus(h);
    b.addEventListener('focus', () => sichtbarMachen(e));
    d.addEventListener('pointerenter', ev => { if(ev.pointerType === 'mouse'){ schwebend = h; plane(); } });
    d.addEventListener('pointerleave', () => { if(schwebend === h){ schwebend = null; plane(); } });
    return h;
  }

  /* ---- Blick ---- */
  const gesamt = () => ({x0: D.welt.x0 - 60, y0: D.welt.y0 - 70, x1: D.welt.x1 + 60, y1: D.welt.y1 + 70});
  function blickAuf(r, luft = 1.04){
    const R = K.rand(), Wd = karte.clientWidth, Hd = karte.clientHeight;
    const bw = Math.max(60, Wd - R.links - R.rechts - 40), bh = Math.max(60, Hd - R.oben - R.unten - 40);
    const s = Math.min(sMax, bw / ((r.x1 - r.x0) * luft), bh / ((r.y1 - r.y0) * luft));
    const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
    return {s, x: R.links + 20 + bw / 2 - cx * s, y: R.oben + 20 + bh / 2 - cy * s};
  }
  /* Das ganze Dorf mit seinen Ortsschildern: die Schilder haben Bildschirmgröße, also zweimal nachmessen */
  function ganzerBlick(){
    let z = blickAuf(gesamt(), 1.0);
    for(let i = 0; i < 3; i++){
      const b = {...gesamt()};
      for(const sc of schilder){ if(sc.art !== 'q') continue; masseSchild(sc); const m = z.s < KNAPP ? sc.knapp : sc.voll;
        const Q = sc.Q, u = Q.u, a = Q.start + Q.ende + 26, ax = u[0] * a, ay = u[1] * a, w = (m.w + 8) / z.s, h = (m.h + 8) / z.s;
        const lx = u[0] > 0.35 ? ax : u[0] < -0.35 ? ax - w : ax - w / 2, ly = u[1] > 0.35 ? ay : u[1] < -0.35 ? ay - h : ay - h / 2;
        b.x0 = Math.min(b.x0, lx); b.y0 = Math.min(b.y0, ly); b.x1 = Math.max(b.x1, lx + w); b.y1 = Math.max(b.y1, ly + h); }
      z = blickAuf(b, 1.0);
    }
    return z;
  }
  function anwenden(){ weltEl.style.transform = `translate(${C.x.toFixed(2)}px, ${C.y.toFixed(2)}px) scale(${C.s.toFixed(4)})`; weltEl.style.setProperty('--s', C.s.toFixed(4)); plane(); }
  let blickGesetzt = false;   // erst wenn die Karte einmal zu sehen war, gibt es eine Stelle zum Zurückkehren
  function setzeBlick(z){ cancelAnimationFrame(flug); flug = 0; C = {...z}; blickGesetzt = true; anwenden(); }
  function fliege(z, dauer = 600){
    cancelAnimationFrame(flug); flug = 0;
    if(ruhig() || K.still || dauer <= 0) return setzeBlick(z);
    const Wd = karte.clientWidth / 2, Hd = karte.clientHeight / 2;
    const a = {s: C.s, cx: (Wd - C.x) / C.s, cy: (Hd - C.y) / C.s}, b = {s: z.s, cx: (Wd - z.x) / z.s, cy: (Hd - z.y) / z.s}, t0 = performance.now();
    const schritt = t => { const u = Math.min(1, (t - t0) / dauer), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * e), cx = a.cx + (b.cx - a.cx) * e, cy = a.cy + (b.cy - a.cy) * e;
      C = {s, x: Wd - cx * s, y: Hd - cy * s}; anwenden(); flug = u < 1 ? requestAnimationFrame(schritt) : 0; };
    blickGesetzt = true; flug = requestAnimationFrame(schritt);
  }
  function umZoom(f, px, py){
    angepasst = false;
    const Wd = karte.clientWidth, Hd = karte.clientHeight; if(px == null){ px = Wd / 2; py = Hd / 2; }
    const s = Math.max(sMin, Math.min(sMax, C.s * f)), wx = (px - C.x) / C.s, wy = (py - C.y) / C.s;
    if(f === 1.6 || f === 1 / 1.6) return fliege({s, x: px - wx * s, y: py - wy * s}, 260);
    setzeBlick({s, x: px - wx * s, y: py - wy * s});
  }
  function sichtbarMachen(e){
    if(!karte || drinnen) return;
    const sx = e.x * C.s + C.x, sy = e.y * C.s + C.y, Wd = karte.clientWidth, Hd = karte.clientHeight - (K.rand().unten || 0), m = 70;
    // mit der Tastatur: nah genug, dass Haus und Name lesbar sind
    if(sx < m || sy < m || sx > Wd - m || sy > Hd - m || C.s < 0.85){ const s = Math.max(C.s, 1.1); fliege({s, x: Wd / 2 - e.x * s, y: Hd / 2 - e.y * s}, 300); }
    else plane();
  }

  /* ---- Ziehen, Rad, zwei Finger ---- */
  let gezogen = false, angepasst = false, schwebend = null;   // angepasst: der Blick folgt der Wahl, bis jemand selbst zieht oder zoomt
  function bedienung(){
    const zeiger = new Map(); let weg = 0, abstand = 0, start = null;
    const ort = ev => { const r = karte.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
    karte.addEventListener('pointerdown', ev => { if(ev.target.closest('.zoomknoepfe')) return; zeiger.set(ev.pointerId, ort(ev)); cancelAnimationFrame(flug); flug = 0;
      if(zeiger.size === 1){ weg = 0; gezogen = false; start = ev; } else if(zeiger.size === 2){ const [a, b] = [...zeiger.values()]; abstand = Math.hypot(a[0] - b[0], a[1] - b[1]); weg = 99; gezogen = true; } });
    karte.addEventListener('pointermove', ev => {
      if(!zeiger.has(ev.pointerId)) return; const p = ort(ev), alt = zeiger.get(ev.pointerId); zeiger.set(ev.pointerId, p);
      if(zeiger.size === 1){ weg += Math.abs(p[0] - alt[0]) + Math.abs(p[1] - alt[1]);
        if(weg > 6){ if(!gezogen){ gezogen = true; try { karte.setPointerCapture(ev.pointerId); } catch(e){ /* schon gelöst */ } karte.classList.add('zieht'); }
          C.x += p[0] - alt[0]; C.y += p[1] - alt[1]; angepasst = false; anwenden(); } }
      else if(zeiger.size === 2){ const [a, b] = [...zeiger.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        C.x += (p[0] - alt[0]) / 2; C.y += (p[1] - alt[1]) / 2; if(abstand > 0) umZoom(d / abstand, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); abstand = d; anwenden(); }
    });
    const los = ev => { zeiger.delete(ev.pointerId); if(!zeiger.size){ karte.classList.remove('zieht'); setTimeout(() => { gezogen = false; }, 0); } };
    karte.addEventListener('pointerup', los); karte.addEventListener('pointercancel', los);
    karte.addEventListener('click', ev => { if(gezogen){ ev.stopPropagation(); ev.preventDefault(); } }, true);
    karte.addEventListener('wheel', ev => { ev.preventDefault(); angepasst = false; const [px, py] = ort(ev);
      if(ev.ctrlKey || ev.deltaMode !== 0 || (Math.abs(ev.deltaX) < 1 && Math.abs(ev.deltaY) >= 40)) umZoom(Math.exp(-ev.deltaY * (ev.ctrlKey ? 0.012 : 0.0022)), px, py);
      else { C.x -= ev.deltaX; C.y -= ev.deltaY; cancelAnimationFrame(flug); flug = 0; anwenden(); } }, {passive: false});
  }

  /* ---- Beschriftung: Schilder und Namen ohne Überschneidung ---- */
  function plane(){ if(geplant) return; geplant = true; requestAnimationFrame(() => { geplant = false; if(!tot && karte && !drinnen) beschrifte(); }); }
  function beschrifte(){
    const Wd = karte.clientWidth, Hd = karte.clientHeight, P = platzhalter(), s = C.s;
    const zu = (x, y) => [x * s + C.x, y * s + C.y];
    const imBild = r => r.x1 > -40 && r.x0 < Wd + 40 && r.y1 > -40 && r.y0 < Hd + 40;
    for(const h of hausEls){ const e = h.e, [x0, y0] = zu(e.x - e.w / 2, e.y - e.h / 2); h.sr = {x0, y0, x1: x0 + e.w * s, y1: y0 + e.h * s}; P.nimm({x0: x0 + 2, y0: y0 + 2, x1: h.sr.x1 - 2, y1: h.sr.y1 - 2}); }
    for(const z of zoom.children) { const r = z.getBoundingClientRect(), k = karte.getBoundingClientRect(); P.nimm({x0: r.left - k.left - 4, y0: r.top - k.top - 4, x1: r.right - k.left + 4, y1: r.bottom - k.top + 4}); }
    // Ortsschilder: am Ende der Straße, nach außen gerichtet; der Platz in der Mitte
    for(const sc of schilder){
      const b = sc.el; masseSchild(sc); const knapp = s < KNAPP && sc.art !== 'hof'; b.classList.toggle('knapp', knapp);
      const m = knapp ? sc.knapp : sc.voll; sc.w = m.w; sc.h = m.h;
      let x, y;
      if(sc.art === 'platz'){ [x, y] = zu(0, 0); x -= sc.w / 2; y -= sc.h / 2; const r = {x0: x, y0: y, x1: x + sc.w, y1: y + sc.h}; P.nimm(r); }
      else if(sc.art === 'q'){ const Q = sc.Q, u = Q.u; let ok = null, erst = null;
        for(let i = 0; i < 10 && !ok; i++){
          const [ax, ay] = zu(u[0] * (Q.start + Q.ende + 26), u[1] * (Q.start + Q.ende + 26));
          const px = ax + u[0] * i * 16, py = ay + u[1] * i * 16;
          const lx = u[0] > 0.35 ? px : u[0] < -0.35 ? px - sc.w : px - sc.w / 2, ly = u[1] > 0.35 ? py : u[1] < -0.35 ? py - sc.h : py - sc.h / 2;
          const r = {x0: lx - 4, y0: ly - 4, x1: lx + sc.w + 4, y1: ly + sc.h + 4}; if(!erst) erst = r; if(P.frei(r)) ok = r; }
        const r = ok || erst; P.nimm(r); x = r.x0 + 4; y = r.y0 + 4; }
      else if(sc.art === 'hof'){ const e = sc.e, [cx, top] = zu(e.x, e.y - e.h / 2); x = cx - sc.w / 2; y = top - sc.h - 3;
        const r = {x0: x, y0: y, x1: x + sc.w, y1: y + sc.h}; const frei = P.frei(r) || sc.k === gew || wegZu(gew || W).includes(sc.k);
        b.classList.toggle('weg', !frei || s < 0.18); if(frei) P.nimm(r); }
      b.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }
    // Hausnamen: Gewähltes, Besuchtes und Fokussiertes zuerst, dann die Treffer, dann die großen
    const fokus = document.activeElement;
    const rang = h => (h.e.k === zuletzt || h === schwebend || h.el.contains(fokus) ? 0 : 1) * 4 + (K.suche.treffer && K.istTreffer(h.e.k) ? 0 : 1) * 2 + (h.e.typ === 'brett' ? 1 : 0);
    const liste = hausEls.slice().sort((a, b) => rang(a) - rang(b) || (b.e.st || 0) - (a.e.st || 0) || (b.e.k.fassungen || 0) - (a.e.k.fassungen || 0));
    mass.font = `500 12.5px ${SANS}`;
    for(const h of liste){
      const r0 = h.sr, w = r0.x1 - r0.x0, wichtig = rang(h) < 4;
      if(!imBild(r0) || (w < 17 && !wichtig)){ h.name.classList.add('weg'); continue; }
      // erst der ganze Name, dann gekürzt; passt beides nicht, bleibt nur das Bild
      // unter dem Haus, sonst über dem Dach, sonst daneben; erst ganz, dann gekürzt
      const cx = (r0.x0 + r0.x1) / 2, cy = (r0.y0 + r0.y1) / 2;
      const versuch = (m, wo) => { const t = kuerze(mass, h.text, m), tw = mass.measureText(t).width + 12;
        const r = wo === 0 ? {x0: cx - tw / 2, y0: r0.y1 + 2} : wo === 1 ? {x0: cx - tw / 2, y0: r0.y0 - 22} : wo === 2 ? {x0: r0.x1 + 3, y0: cy - 10} : {x0: r0.x0 - 3 - tw, y0: cy - 10};
        r.x1 = r.x0 + tw; r.y1 = r.y0 + 20; return {t, r}; };
      let v = null; const kurz = Math.max(96, Math.min(170, w * 2.6));
      for(const m of [230, kurz]){ for(let wo = 0; wo < 4 && !v; wo++){ const q = versuch(m, wo); if(P.frei(q.r)) v = q; } if(v) break; }
      if(!v) v = versuch(kurz, 0);
      const {t, r} = v;
      if(!P.frei(r) && !wichtig){ h.name.classList.add('weg'); continue; }
      P.nimm(r); if(h.name.textContent !== t) h.name.textContent = t;
      h.name.classList.remove('weg'); h.name.classList.toggle('matt', h.el.classList.contains('matt')); h.name.style.transform = `translate(${Math.round(r.x0)}px, ${Math.round(r.y0)}px)`;
    }
  }

  /* ================= Handy: Dorfplan oben, ein Quartier als Straße darunter ================= */
  let handy, planEl, zugEl;
  function baueHandy(){
    handy = el('div', 'dhandy'); huelle0.append(handy);
    planEl = el('div', 'dplan'); const svg = boden(D, true); planEl.append(svg);
    const vb = svg.viewBox.baseVal;
    const namen = el('div', 'dplannamen'); planEl.append(namen);
    const punkte = [];
    if(D.platzOrt) punkte.push({k: D.platzOrt, x: 0, y: 0, wort: 'Dorfplatz'});
    for(const Q of D.Qs){ const g = Q.grund, cx = g.reduce((s, p) => s + p[0], 0) / g.length, cy = g.reduce((s, p) => s + p[1], 0) / g.length; punkte.push({k: Q.k, x: cx, y: cy, Q}); }
    for(const p of punkte){ const f = farbe(p.k), b = knopf('dplanname' + (p.Q && p.Q.bau ? ' bau' : ''), null, () => K.waehle(p.k, {vonAnsicht: true}), (p.wort ? p.wort + ' ' : p.Q && p.Q.bau ? 'Baustelle ' : 'Quartier ') + p.k.name);
      b.append(el('span', '', p.k.name)); b.style.setProperty('--f', f.f); b.style.setProperty('--d', f.d); b.style.setProperty('--h', f.h);
      p.el = b; namen.append(b); }
    planEl._punkte = punkte; planEl._vb = vb;
    zugEl = el('section', 'dzug'); zugEl.setAttribute('aria-label', 'Straße des gewählten Quartiers');
    handy.append(planEl, zugEl);
    planeHandy();
  }
  function planeHandy(){
    if(!planEl || tot) return;
    handy.style.setProperty('--dunten', (K.rand().unten || 0) + 'px');
    const vb = planEl._vb, Wd = planEl.clientWidth, Hd = planEl.clientHeight;
    const s = Math.min(Wd / vb.width, Hd / vb.height), ox = (Wd - vb.width * s) / 2, oy = (Hd - vb.height * s) / 2;
    const P = platzhalter();
    const pts = planEl._punkte.slice().sort((a, b) => (a.k === handyOrt ? -1 : 0) - (b.k === handyOrt ? -1 : 0));
    for(const p of pts){ const w = p.el.offsetWidth, h = p.el.offsetHeight;
      let x = ox + (p.x - vb.x) * s - w / 2, y = oy + (p.y - vb.y) * s - h / 2;
      x = Math.max(2, Math.min(Wd - w - 2, x)); y = Math.max(2, Math.min(Hd - h - 2, y));
      for(let i = 0; i < 14; i++){ const r = {x0: x, y0: y, x1: x + w, y1: y + h}; if(P.frei(r)) break; const d = (i % 2 ? 1 : -1) * Math.ceil((i + 1) / 2) * 10; y = Math.max(2, Math.min(Hd - h - 2, y + d)); }
      P.nimm({x0: x, y0: y, x1: x + w, y1: y + h});
      p.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      p.el.classList.toggle('an', p.k === handyOrt);
      if(p.k === handyOrt) p.el.setAttribute('aria-current', 'true'); else p.el.removeAttribute('aria-current');
    }
  }
  function zeigeStrasse(o){
    handyOrt = o; planeHandy();
    zugEl.replaceChildren();
    const f = farbe(o); zugEl.style.setProperty('--f', f.f); zugEl.style.setProperty('--d', f.d); zugEl.style.setProperty('--h', f.h);
    const istPlatz = o === D.platzOrt, Q = D.Qs.find(q => q.k === o);
    const einh = istPlatz ? D.platzEinh : Q ? Q.einh : einheiten(o);
    const hz = einh.flatMap(flach).filter(e => e.typ === 'haus').length;
    const kopf = el('div', 'dzkopf');
    kopf.append(el('small', '', istPlatz ? 'Dorfplatz' : Q && Q.bau ? 'Baustelle' : o.art === 'ort' ? 'Quartier' : 'Hof'), el('h3', '', o.name), el('p', 'klein', `${n(hz, 'Haus', 'Häuser')} · ${n(o.fassungen, 'Fassung', 'Fassungen')} · ${zeitWort(o)}`));
    zugEl.append(kopf);
    const strasse = el('div', 'dstrasse' + (Q && Q.bau ? ' bau' : '')); strasse.tabIndex = -1;
    const ordne = liste => liste.map(e => e.typ === 'hof' ? hofHandy(e) : hausHandy(e));
    strasse.append(...ordne(einh));
    zugEl.append(strasse);
  }
  function hausHandy(e){
    const k = e.k, f = farbe(k), b = el('div', 'hhaus st' + (e.st || 1) + (e.typ === 'brett' ? ' brett' : ''));
    b.style.setProperty('--f', f.f); b.style.setProperty('--d', f.d);
    let t;
    if(e.typ === 'brett'){ t = knopf('htuer', null, () => K.waehle(e.lose[0], {vonAnsicht: true}), `Aushang: ${n(e.lose.length, 'Gespräch', 'Gespräche')}. Ansehen.`);
      t.innerHTML = '<span class="dbrettflaeche"><i></i><i></i><i></i></span><span class="dpfosten"></span>'; t.append(el('span', 'hname', 'Aushang · ' + n(e.lose.length, 'Gespräch', 'Gespräche'))); }
    else {
      t = knopf('htuer', null, () => K.waehle(k, {vonAnsicht: true}), `${k.name}, ${STUFENWORT[e.st]}, ${mengenWort(k)}. Hineingehen.`);
      const fenster = el('span', 'dfenster'), tb = titelBild(k);
      if(tb){ const i = new Image(); i.loading = 'lazy'; i.decoding = 'async'; i.alt = ''; i.src = K.bildUrl(tb, 240); i.onerror = () => { fenster.classList.add('ohne'); i.remove(); }; fenster.append(i); } else fenster.classList.add('ohne');
      const bau = el('span', 'hbau'); bau.append(el('span', 'ddach'), el('span', 'dwand'), fenster, el('span', 'dtuerblatt'));
      t.append(bau, el('span', 'hname', k.name));
      const tw = twins(k); if(tw.length){ const z = el('span', 'hauch'); z.innerHTML = DOPPEL; z.append(el('span', '', 'auch in ' + tw.map(q => wegZu(q)[1].name).join(', '))); t.append(z); }
    }
    b.append(t);
    merkeHaus({e, el: b, knopf: t});
    return b;
  }
  function hofHandy(e){
    const g = el('div', 'hhof'); const f = farbe(e.k); g.style.setProperty('--f', f.f); g.style.setProperty('--d', f.d);
    const wort = e.k.art === 'ort' ? 'Ort' : 'Hof', kopf = knopf('hhofname', null, () => K.waehle(e.k, {vonAnsicht: true}), wort + ' ' + e.k.name); kopf.append(el('small', '', wort), el('span', '', e.k.name)); kopf._k = e.k;
    const innen = el('div', 'hhofinnen'); innen.append(...e.innen.map(i => i.typ === 'hof' ? hofHandy(i) : hausHandy(i)));
    g.append(kopf, innen); return g;
  }

  /* ================= Innen: der Grundriss eines Hauses ================= */
  let innenEl = null, innenFuer = null;
  function betrete(c, ziel, vonAnsicht){
    if(innenFuer !== c){
      if(!drinnen && karte) gemerkt = blickGesetzt && cssDa ? {...C} : null;
      if(!drinnen && handy) gemerkt = {scroll: zugEl.querySelector('.dstrasse')?.scrollLeft || 0};
      innenEl?.remove(); innenEl = baueInnen(c); huelle0.append(innenEl); innenFuer = c; drinnen = c;
      innenEl.style.setProperty('--dunten', (K.schmal() ? K.rand().unten : 0) + 'px');
      huelle0.classList.add('drinnen'); spannen(innenEl);
      if(vonAnsicht) innenEl.querySelector('.draus')?.focus({preventScroll: true});
    }
    markiereInnen(ziel, !vonAnsicht);
  }
  function verlasse(){
    if(!drinnen) return;
    const war = drinnen, fokusDrin = innenEl && innenEl.contains(document.activeElement);
    innenEl?.remove(); innenEl = null; innenFuer = null; drinnen = null; huelle0.classList.remove('drinnen');
    zuletzt = war;
    if(karte){
      if(gemerkt && gemerkt.s) setzeBlick(gemerkt);
      else { const h = knotenEl.get(war), e = h && h.e;   // direkt hineingekommen: das Haus in seiner Nachbarschaft zeigen
        if(e){ const z = blickAuf({x0: e.x - 260, y0: e.y - 200, x1: e.x + 260, y1: e.y + 200}, 1); setzeBlick(z); } } }
    if(handy){ const o = strassenOrt(war); if(handyOrt !== o) zeigeStrasse(o); const st = zugEl.querySelector('.dstrasse'); if(st && gemerkt) st.scrollLeft = gemerkt.scroll || 0; knotenEl.get(war)?.el.scrollIntoView({inline: 'nearest', block: 'nearest'}); }
    gemerkt = null; markiere();
    if(fokusDrin){ const h = knotenEl.get(war); h?.knopf?.focus({preventScroll: true}); }
  }
  const strassenOrt = k => { const w = wegZu(k); return w[1] || D.platzOrt || W; };
  const strasseFuer = o => o.art === 'bereich' || (o.art === 'ort' && o.eltern !== W) ? strassenOrt(o) : o;   // Höfe liegen an der Straße ihres Quartiers

  function baueInnen(c){
    const f = farbe(c), d = el('div', 'dinnen'); d.style.setProperty('--f', f.f); d.style.setProperty('--d', f.d); d.style.setProperty('--h', f.h);
    d.setAttribute('role', 'region'); d.setAttribute('aria-label', (c.art === 'app' ? 'Im Haus ' : 'Aushang ') + c.name);
    const kopf = el('header', 'dikopf');
    const raus = knopf('knopf draus', '← Hinausgehen', () => hinaus());
    const titel = el('div', 'dititel');
    const w = wegZu(c), ort = w[1], hofK = c.art === 'app' && c.eltern && c.eltern.art !== 'ort' && c.eltern.art !== 'wurzel' ? c.eltern : null;
    const wo = c.art === 'app' ? (ort === D.platzOrt ? 'am Dorfplatz' : 'im Quartier ' + (ort ? ort.name : '')) + (hofK ? ', Hof ' + hofK.name : '') : 'am ' + (c.art === 'wurzel' ? 'Dorfplatz' : (c.art === 'bereich' ? 'Hof ' : 'Ort ') + c.name);
    titel.append(el('p', 'artwort', c.art === 'app' ? 'Haus ' + wo : 'Aushang ' + wo), el('h2', '', c.art === 'app' ? c.name : 'Gespräche'));
    titel.append(el('p', 'klein', (c.art === 'app' ? mengenWort(c) + ' · ' + zeitWort(c) : n(c.kinder.filter(x => !x.kinder).length, 'Gespräch', 'Gespräche'))));
    kopf.append(raus, titel);
    const tw = c.art === 'app' ? twins(c) : [];
    if(tw.length){ const a = el('div', 'diauch'); a.append(el('span', 'klein', 'Wohnt auch in: '));
      for(const q of tw){ const b = knopf('marke', woWort(q), () => K.waehle(q, {vonAnsicht: true}), 'Dasselbe Haus in ' + woWort(q)); b.style.setProperty('--ort', farbe(q).d); a.append(b); }
      kopf.append(a); }
    d.append(kopf);
    // Räume: Flur (lose Fassungen der App) zuerst, dann die Werke in ihrer Folge
    const raeume = [];
    if(c.art === 'app'){ const lose = c.kinder.filter(x => !x.kinder); if(lose.length) raeume.push({flur: true, k: c, f: lose}); for(const x of c.kinder) if(x.kinder) raeume.push({k: x, f: x.kinder}); }
    else raeume.push({aushang: true, k: c, f: c.kinder.filter(x => !x.kinder)});
    const grund = el('div', 'digrund'); grund.style.setProperty('--wand', f.d);
    for(const r of raeume) grund.append(raumEl(r));
    d.append(grund);
    d._grund = grund; d._raeume = raeume;
    return d;
  }
  function spannen(d){
    const g = d._grund; if(!g) return; const breit = g.clientWidth - 14;
    const sp = Math.max(1, Math.floor(breit / (K.schmal() ? 330 : 262)));
    g.style.gridTemplateColumns = `repeat(${sp}, minmax(0, 1fr))`;
    for(const r of g.children){ const z = +r.dataset.zahl, w = z <= 2 ? 1 : z <= 6 ? 2 : z <= 14 ? 3 : 4; r.style.gridColumn = 'span ' + Math.min(sp, w); }
  }
  function raumEl(r){
    const raum = el('section', 'draum' + (r.flur ? ' flur' : '') + (r.aushang ? ' aushang' : '')); raum.dataset.zahl = r.f.length;
    const kopf = el('div', 'drkopf');
    if(r.flur || r.aushang){ kopf.append(el('h3', '', r.flur ? 'Flur' : 'Aushang'), el('p', 'klein', r.flur ? 'Fassungen der App ohne eigenes Werk · ' + n(r.f.length, 'Fassung', 'Fassungen') : n(r.f.length, 'Gespräch', 'Gespräche'))); }
    else {
      const b = knopf('drname', null, () => K.waehle(r.k, {vonAnsicht: true}), 'Raum ' + r.k.name + ', ' + mengenWort(r.k)); b.append(el('span', '', r.k.name)); kopf.append(b);
      kopf.append(el('p', 'klein', mengenWort(r.k) + ' · ' + zeitWort(r.k)));
      const tw = twins(r.k); if(tw.length){ const a = el('p', 'drauch klein'); a.append(el('span', '', 'auch in: '));
        for(const q of tw){ const b2 = knopf('marke', woWort(q), () => K.waehle(q, {vonAnsicht: true}), 'Dasselbe Werk in ' + woWort(q)); b2.style.setProperty('--ort', farbe(q).d); a.append(b2); } kopf.append(a); }
    }
    raum.append(kopf);
    const mit = r.f.filter(x => x.von != null), ohne = r.f.filter(x => x.von == null);
    const wand = el('div', 'dwandreihe');
    for(const x of mit) wand.append(rahmen(x));
    if(ohne.length){ if(mit.length) wand.append(el('p', 'dohnezeit', 'ohne belegte Zeit')); for(const x of ohne) wand.append(rahmen(x)); }
    raum.append(wand);
    raum._k = r.k; raum._flur = !!(r.flur || r.aushang);
    return raum;
  }
  function rahmen(x){
    const b = knopf('drahmen' + (x.art === 'gespraech' ? ' gespraech' : ''), null, () => {
      if(K.gewaehlt() === x) K.oeffne(x); else K.waehle(x, {vonAnsicht: true}); },
      `${x.art === 'gespraech' ? 'Gespräch' : 'Fassung'} ${x.name}, ${x.von == null ? 'Zeit nicht belegt' : tagWort(x.von)}${x.art === 'fassung' && !x.bild ? ', ohne Bild' : ''}`);
    if(x.bild){ const s = el('span', 'dbild'); const i = new Image(); i.loading = 'lazy'; i.decoding = 'async'; i.alt = ''; i.src = K.bildUrl(x.bild, 240);
      i.onerror = () => { s.classList.add('kaputt'); s.replaceChildren(el('span', 'ohnewort', 'Bild nicht erreichbar')); }; s.append(i); b.append(s); }
    else { const p = el('span', 'dpapier'); p.append(el('span', 'dpwort', x.art === 'gespraech' ? 'Gespräch' : 'ohne Bild'), el('span', 'dptext', x.name)); b.append(p); }
    // Auf dem Papierblatt steht der Name schon; unter dem Bild steht er darunter. Die Zeit nur, wenn sie belegt ist
    if(x.bild) b.append(el('span', 'drname2', x.name));
    if(x.von != null) b.append(el('span', 'drzeit', tagWort(x.von)));
    b._k = x;
    return b;
  }
  function markiereInnen(ziel, rollen){
    if(!innenEl) return;
    let ziel2 = null;
    for(const r of innenEl.querySelectorAll('.draum')){ const an = !!ziel && !r._flur && r._k === ziel; r.classList.toggle('an', an); if(an) ziel2 = r; }
    for(const b of innenEl.querySelectorAll('.drahmen')){ const an = b._k === ziel; b.classList.toggle('an', an); if(an){ b.setAttribute('aria-current', 'true'); ziel2 = b; } else b.removeAttribute('aria-current'); }
    sucheInnen();
    if(rollen && ziel2){ const top = ziel2.getBoundingClientRect().top - innenEl.getBoundingClientRect().top + innenEl.scrollTop - (innenEl.querySelector('.dikopf')?.offsetHeight || 100) - 24; innenEl.scrollTo({top: Math.max(0, top), behavior: ruhig() || K.still ? 'auto' : 'smooth'}); }
  }
  function sucheInnen(){
    if(!innenEl) return; const an = !!K.suche.treffer;
    for(const b of innenEl.querySelectorAll('.drahmen')) b.classList.toggle('matt', an && !K.istTreffer(b._k));
    for(const r of innenEl.querySelectorAll('.draum')) r.classList.toggle('matt', an && !r._flur && !K.istTreffer(r._k));
  }
  function hinaus(){
    const c = drinnen; if(!c) return;
    const zu = c.art === 'app' ? (c.eltern || W) : c;
    rausWunsch = true; K.waehle(zu, {vonAnsicht: true});
  }
  let rausWunsch = false;

  /* ================= Markieren, Suche ================= */
  function markiere(){
    const pfadK = new Set(gew ? wegZu(gew) : []), an = !!K.suche.treffer;
    for(const h of alleHaeuser){
      h.el.classList.toggle('zuletzt', h.e.k === zuletzt && !drinnen);
      h.el.classList.toggle('matt', an && (h.e.typ === 'brett' ? !h.e.lose.some(K.istTreffer) : !K.istTreffer(h.e.k)));
    }
    for(const sc of schilder){ sc.el.classList.toggle('an', pfadK.has(sc.k) && (gew === sc.k)); sc.el.classList.toggle('matt', an && !K.istTreffer(sc.k)); }
    if(karte){ for(const p of weltEl.querySelectorAll('.dgrund')){ const Q = D.Qs[+p.dataset.q]; p.classList.toggle('an', !!Q && Q.k === gew); } plane(); }
    if(handy){ for(const b of handy.querySelectorAll('.dplanname')) b.classList.toggle('matt', an && !K.istTreffer(planEl._punkte.find(p => p.el === b).k)); }
  }

  /* ================= Aufbau je nach Breite ================= */
  function baue(){
    const s = K.schmal() ? 'handy' : 'karte'; if(s === modus) return false;
    modus = s; huelle0.replaceChildren(); knotenEl.clear(); alleHaeuser.length = 0; karte = handy = null; innenEl = null; innenFuer = null; drinnen = null; gemerkt = null;
    huelle0.classList.remove('drinnen');
    if(s === 'karte'){ baueKarte(); requestAnimationFrame(() => { if(karte) sMin = ganzerBlick().s * 0.6; }); }
    else baueHandy();
    return true;
  }
  baue();

  function zeige(k, sofort, vonAnsicht){
    gew = k || W;
    const w = wegZu(gew), app = w.find(q => q.art === 'app');
    const container = app || (gew.kinder ? null : gew.eltern);      // lose Gespräche: ihr Aushang
    if(container){
      if(handy && !drinnen){ const o = strassenOrt(container); if(handyOrt !== o) zeigeStrasse(o); }
      betrete(container, gew === container ? null : gew, vonAnsicht); markiere(); return;
    }
    const raus = rausWunsch; rausWunsch = false;
    if(drinnen){ verlasse(); if(raus || vonAnsicht){ if(handy && gew.art !== 'wurzel'){ const o = strasseFuer(gew); if(o !== handyOrt) zeigeStrasse(o); } markiere(); return; } }
    markiere();
    if(karte){
      angepasst = true;
      if(gew.art === 'wurzel'){ const z = ganzerBlick(); if(sofort || K.still) setzeBlick(z); else fliege(z, 600); return; }
      const ziel = rahmenVon(gew); if(!ziel) return;
      const z = blickAuf(ziel, 1.08);
      z.s = Math.min(z.s, 1.8);
      if(sofort && !vonAnsicht) setzeBlick(z); else fliege(z, 600);
    } else if(handy){
      const o = gew.art === 'wurzel' ? (handyOrt || D.platzOrt || W.kinder[0]) : strasseFuer(gew);
      if(o !== handyOrt || !zugEl.firstChild) zeigeStrasse(o);
      if(strasseFuer(gew) !== gew){ const hb = [...zugEl.querySelectorAll('.hhofname')].find(b => b._k === gew); hb?.scrollIntoView({inline: 'start', block: 'nearest'}); }
    }
  }
  function rahmenVon(k){
    if(k === D.platzOrt){ const r = D.P.aussen + 10; return {x0: -r, y0: -r, x1: r, y1: r}; }
    const Q = D.Qs.find(q => q.k === k);
    const es = Q ? Q.einh.flatMap(flach) : D.alle.filter(e => e.k === k).flatMap(flach);
    if(!es.length) return null;
    const r = es.reduce((b, e) => ({x0: Math.min(b.x0, e.x - e.w / 2), y0: Math.min(b.y0, e.y - e.h / 2), x1: Math.max(b.x1, e.x + e.w / 2), y1: Math.max(b.y1, e.y + e.h / 2)}), {x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9});
    if(Q){ const a = Q.start + Q.ende + 70; const ex = Q.u[0] * a, ey = Q.u[1] * a; r.x0 = Math.min(r.x0, ex); r.x1 = Math.max(r.x1, ex); r.y0 = Math.min(r.y0, ey); r.y1 = Math.max(r.y1, ey); }
    return {x0: r.x0 - 30, y0: r.y0 - 40, x1: r.x1 + 30, y1: r.y1 + 30};
  }

  flaeche.__dorf = {D, blick: () => C, ganzerBlick, blickAuf, gesamt, schilder};   // nur für Prüfungen im Browser

  /* Die eigene Gestaltung kommt nach: erst wenn sie da ist, stimmen Maße und Blick */
  const css = [...document.querySelectorAll('link[rel=stylesheet]')].find(l => /\/dorf\.css$/.test(l.href));
  let cssDa = !!(css && css.sheet && css.sheet.cssRules.length);
  if(!cssDa){ huelle0.style.visibility = 'hidden';
    const fertig = () => { if(tot || cssDa) return; cssDa = true; huelle0.style.visibility = ''; for(const sc of schilder) sc.voll = sc.knapp = null; if(handy) planeHandy(); zeige(gew || K.gewaehlt(), true); };
    css?.addEventListener('load', fertig, {once: true}); setTimeout(fertig, 1500); }

  const neuGemessen = () => {
    if(tot || !cssDa) return;
    if(baue()){ zeige(gew || K.gewaehlt(), true); return; }
    if(karte && !drinnen){ if(angepasst && !flug){ const g = gew; if(g && (g.art === 'wurzel' || g.kinder && !wegZu(g).some(q => q.art === 'app'))) zeige(g, true); } plane(); }
    if(handy) planeHandy();
    if(innenEl){ spannen(innenEl); innenEl.style.setProperty('--dunten', (K.schmal() ? K.rand().unten : 0) + 'px'); }
  };
  const ro = new ResizeObserver(neuGemessen); ro.observe(flaeche);
  addEventListener('resize', neuGemessen);

  return {
    zeige,
    suche(){ markiere(); sucheInnen(); },
    groesse(){ if(karte && !drinnen) plane(); if(handy) planeHandy(); if(innenEl){ spannen(innenEl); innenEl.style.setProperty('--dunten', (K.schmal() ? K.rand().unten : 0) + 'px'); } },
    ende(){ tot = true; cancelAnimationFrame(flug); ro.disconnect(); removeEventListener('resize', neuGemessen); huelle0.remove(); }
  };
}
