/* Baum — Herkunft, Zugehörigkeit und Verzweigung. Zweidimensional, ohne Kamerafahrt.

   Die Krone ist ein geschlossenes Laubdach. Jedes Werk (und jede App mit eigenen Fassungen) hat dort
   einen eigenen Keil; darin hängen seine Fassungen als Blätter, innen die frühesten, außen die jüngsten,
   ganz außen die ohne belegte Zeit. Die Keile eines Orts liegen nebeneinander, die Orte nebeneinander:
   kein Ast läuft hinter fremdem Laub, nichts überdeckt etwas anderes.
   Innen, zwischen Stamm und Laub, liegen die Äste mit ihren Namen: Ort → (Bereich) → App → Werk.
   Wurzeln: das Tragwerk System unter dem Boden, nach derselben Regel. Am Boden: der Schössling „Zur Prüfung“.
   Die Breite eines Keils folgt nur der Zahl seiner Fassungen. Lage und Krümmung sind Gestaltung, keine Aussage. */

import {buehne, bildlager} from './buehne.js';
import {farbe, titelBild, papier, bildRahmen, platzhalter, kuerze, SERIF, SANS} from './gemein.js';
import {zoomKnoepfe, tasten, trefferliste, schild} from './buehnenhilfe.js';
import {wegZu} from './inhalt.js';

export const legende = `<p><b>Laubdach</b>: jedes Blatt ist eine Fassung. Mit Bild als Bild, ohne Bild als <i>Blatt Papier</i>. Ein Fragezeichen heißt: Zeit nicht belegt.</p>
<p>Jedes Werk hat einen eigenen Keil im Laub. Innen das Früheste, außen das Jüngste, ganz außen, was keine belegte Zeit hat.</p>
<p><b>Äste</b> innen: Ort → App → Werk. <b>Wurzeln</b>: das Tragwerk System. <b>Schössling</b> am Boden: was noch zur Prüfung liegt.</p>
<p>Die Breite eines Keils folgt nur der Zahl der Fassungen. Lage und Schwung der Äste sind Gestaltung.</p>
<p>Ziehen verschiebt, Rad oder zwei Finger zoomen. Ein Tipp wählt; ein zweiter Tipp auf eine Fassung öffnet sie. Pfeiltasten wandern, Eingabe öffnet.</p>`;

const S = 15;   // Kantenlänge eines Blatts in Weltpunkten
const blaetterVon = k => (k.kinder || []).filter(c => !c.kinder);
const aesteVon = k => (k.kinder || []).filter(c => c.kinder);
const grad = g => g * Math.PI / 180;
const zeitfolge = (p, q) => (p.von == null) - (q.von == null) || (p.von ?? 0) - (q.von ?? 0);

/* Quadratisch geteilte Fläche (squarified treemap): Kinder bekommen Rechtecke nach ihrem Wert */
function teile(items, x, y, w, h){
  const l = items.filter(i => i.wert > 0).sort((a, b) => b.wert - a.wert), tot = l.reduce((s, i) => s + i.wert, 0); if(!l.length) return;
  const f = w * h / tot; let i = 0;
  const schlechteste = (reihe, seite) => { const s = reihe.reduce((a, r) => a + r.wert * f, 0), mx = Math.max(...reihe.map(r => r.wert * f)), mn = Math.min(...reihe.map(r => r.wert * f)); return Math.max(seite * seite * mx / (s * s), s * s / (seite * seite * mn)); };
  while(i < l.length){
    const seite = Math.min(w, h); let reihe = [l[i++]];
    while(i < l.length && schlechteste([...reihe, l[i]], seite) <= schlechteste(reihe, seite)) reihe.push(l[i++]);
    const s = reihe.reduce((a, r) => a + r.wert * f, 0);
    if(w >= h){ const bw = s / h; let yy = y; for(const r of reihe){ const bh = r.wert * f / bw; r.rect = [x, yy, bw, bh]; yy += bh; } x += bw; w -= bw; }
    else { const bh = s / w; let xx = x; for(const r of reihe){ const bw = r.wert * f / bh; r.rect = [xx, y, bw, bh]; xx += bw; } y += bh; h -= bh; }
  }
}

/* Ein Laubdach: Orte als Sektoren [a0..a1] um (cx,cy), Laub zwischen R0 und R.
   Flächentreu: in den Koordinaten (Winkel·Rm, (r²−R0²)/2Rm) ist jede Fläche so groß wie im Bild.
   Darin teilen sich Apps und Werke ihren Ort als zusammenhängende Laubstücke. */
function laubdach(orte, cx, cy, a0, a1, alpha){
  const keile = [];
  const blattFlaeche = S * S * 1.32, rand = S * S * 2.2;
  const wert = k => { const bl = blaetterVon(k).length; return (bl ? bl * blattFlaeche + rand : 0) + aesteVon(k).reduce((s, c) => s + wert(c), 0); };
  const tiefe = (k, d) => { k._tiefe = d; for(const c of aesteVon(k)) tiefe(c, d + 1); };
  for(const o of orte) tiefe(o, 1);
  const A = orte.reduce((s, o) => s + wert(o), 0), span = Math.abs(a1 - a0), dir = Math.sign(a1 - a0);
  let R = Math.sqrt(2 * A / (span * (1 - alpha * alpha))) * 1.04;
  // Mindestbreite eines Orts: drei Blätter am inneren Rand
  const minW = 3.4 * S / (alpha * R);
  const ow = orte.map(o => Math.max(minW, span * wert(o) / A)), sw = ow.reduce((s, v) => s + v, 0);
  if(sw > span){ R *= sw / span; }
  const R0 = alpha * R, Rm = (R0 + R) / 2, V = (R * R - R0 * R0) / (2 * Rm);
  const zuPolar = (u, v) => [u / Rm, Math.sqrt(R0 * R0 + 2 * Rm * v)];
  const stueck = (k, x, y, w, h) => {      // ein Rechteck im flächentreuen Raum → Ringstück
    const [t0, r0] = zuPolar(x, y), [t1, r1] = zuPolar(x + w, y + h);
    return {b0: a0 + dir * t0, b1: a0 + dir * t1, r0, r1};
  };
  const fuelle = (k, x, y, w, h) => {
    const g = stueck(k, x, y, w, h); Object.assign(k, {_b0: g.b0, _b1: g.b1, _r0: g.r0, _r1: g.r1, _cx: cx, _cy: cy, _R: R, _R0: R0});
    k._bb = huelle(cx, cy, g.b0, g.b1, g.r0, g.r1);
    const bl = blaetterVon(k).slice().sort(zeitfolge), kinder = aesteVon(k);
    const items = kinder.map(c => ({c, wert: wert(c)}));
    if(bl.length) items.push({eigen: true, wert: bl.length * blattFlaeche + rand});
    const pad = Math.min(w, h) > S * 3 ? S * 0.18 : 0;
    teile(items, x + pad, y + pad, w - 2 * pad, h - 2 * pad);
    for(const it of items){ if(!it.rect) continue; const [ix, iy, iw, ih] = it.rect;
      if(it.c) fuelle(it.c, ix, iy, iw, ih);
      else { const p = stueck(k, ix, iy, iw, ih); const u = {k, bl, cx, cy, b0: p.b0, b1: p.b1, r0: p.r0, r1: p.r1}; keile.push(u); k._keil = u;
        // Blätter: Reihen von innen nach außen, gleiche Abstände; innen das Früheste
        const rm = (p.r0 + p.r1) / 2, Wb = Math.abs(p.b1 - p.b0) * rm, H = p.r1 - p.r0;
        const sp = Math.max(1, Math.round(Math.sqrt(bl.length * Wb / Math.max(1, H)))), zr = Math.ceil(bl.length / sp);
        const gr = Math.min(S, (Wb / sp) * 0.9, (H / zr) * 0.9);
        bl.forEach((f, i) => { const zi = Math.floor(i / sp), j = i % sp, inReihe = Math.min(sp, bl.length - zi * sp);
          const t = (j + 0.5 + (sp - inReihe) / 2) / sp, r = p.r0 + H * (zi + 0.5) / zr, a = p.b0 + (p.b1 - p.b0) * t;
          f._x = cx + Math.cos(a) * r; f._y = cy + Math.sin(a) * r; f._g = gr; f._keil = u; });
      } }
  };
  let u0 = 0; const W = span * Rm;
  orte.forEach((o, i) => { const w = W * ow[i] / Math.max(sw, span); fuelle(o, u0, 0, w, V); u0 += w; });
  // Knoten für die Äste: Orte im inneren Raum, alle anderen am Fuß ihres Laubstücks
  const lege = (k, px, py, pa) => {
    if(k._b0 == null) return;
    const a = (k._b0 + k._b1) / 2, r = k._tiefe === 1 ? R0 * 0.55 : k._r0;
    const rm = (k._r0 + k._r1) / 2;
    Object.assign(k, {_x: cx + Math.cos(a) * r, _y: cy + Math.sin(a) * r, _a: a, _r: r, _px: px, _py: py, _pa: pa, _lx: cx + Math.cos(a) * rm, _ly: cy + Math.sin(a) * rm, _flaeche: Math.min(Math.abs(k._b1 - k._b0) * rm, k._r1 - k._r0)});
    for(const c of aesteVon(k)) lege(c, k._x, k._y, a);
  };
  for(const o of orte) lege(o, cx, cy, null);
  return {R, R0, keile};
}
/* Rahmen eines Ringstücks */
function huelle(cx, cy, b0, b1, r0, r1){
  const pts = []; for(let i = 0; i <= 12; i++){ const a = b0 + (b1 - b0) * i / 12; pts.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]); }
  return [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))];
}

export function starte(flaeche, K){
  const I = K.inhalt, W = I.wurzel;
  const krone = W.kinder.filter(o => o.kinder && o.name !== 'Tragwerk System' && o.name !== 'Zur Prüfung');
  const wurzeln = W.kinder.filter(o => o.name === 'Tragwerk System');
  const pruefung = W.kinder.filter(o => o.name === 'Zur Prüfung');
  const lose = W.kinder.filter(o => !o.kinder);

  const D = laubdach(krone, 0, 0, grad(-172), grad(-8), 0.56);
  const G = D.R0 * 0.78;   // Boden
  const DW = laubdach(wurzeln, 0, G + 20, grad(170), grad(10), 0.5);
  const DP = laubdach(pruefung, D.R * 0.78, G, grad(-160), grad(-20), 0.45);
  W._x = 0; W._y = G * 0.4; W._tiefe = 0;
  lose.forEach((f, i) => { f._x = -S * 3 - (i % 4) * S * 1.3; f._y = G - S - Math.floor(i / 4) * S * 1.3; });
  const alleOrte = [...krone, ...wurzeln, ...pruefung];
  const keile = [...D.keile, ...DW.keile, ...DP.keile];
  const welt = alleOrte.reduce((b, o) => [Math.min(b[0], o._bb[0]), Math.min(b[1], o._bb[1]), Math.max(b[2], o._bb[2]), Math.max(b[3], o._bb[3])], [-100, -100, 100, G + 50]);
  const gesamt = {x0: welt[0] - (welt[2] - welt[0]) * 0.16, y0: welt[1] - 70, x1: welt[2] + (welt[2] - welt[0]) * 0.16, y1: welt[3] + 60};
  const knoten = I.alle.filter(k => k.kinder && k._bb && k.art !== 'wurzel');

  const lager = bildlager(K.bildUrl, 900, 8);
  const T = trefferliste(), sch = schild(flaeche);
  let schwebend = null, pfad = new Set(), gew = null;
  const B = buehne(flaeche, {zeichne, tipp, schwebe});
  B.sMin = 0.05; B.sMax = 12;
  lager.beiBild = () => B.neu();
  zoomKnoepfe(flaeche, B, () => B.fliege(B.blickAuf(gesamt, 1.03), 600), 'Ganzer Baum');
  tasten(flaeche, K);
  B.beiGroesse = () => B.neu();

  const sichtbar = k => !K.suche.treffer || K.istTreffer(k);
  const imBild = bb => { const m = 40 / B.s; return bb[2] > B.vonX(0) - m && bb[0] < B.vonX(B.w) + m && bb[3] > B.vonY(0) - m && bb[1] < B.vonY(B.h) + m; };

  function zeichne(B){
    const x = B.x, s = B.s; T.leer();
    x.fillStyle = '#f3eee3'; x.fillRect(0, 0, B.w, B.h);
    const gy = B.zuY(G);
    if(gy < B.h){ const erde = x.createLinearGradient(0, gy, 0, gy + Math.max(60, DW.R * s)); erde.addColorStop(0, '#e4d9c3'); erde.addColorStop(1, '#d3c3a4');
      x.fillStyle = erde; x.fillRect(0, Math.max(0, gy), B.w, B.h - Math.max(0, gy));
      x.strokeStyle = 'rgba(80,60,35,.4)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, gy); x.lineTo(B.w, gy); x.stroke(); }

    x.save(); x.setTransform(B.dpr * s, 0, 0, B.dpr * s, B.dpr * (B.w / 2 - B.cx * s), B.dpr * (B.h / 2 - B.cy * s));
    // Gründe der Orte, dann der Laubstücke: zart in der Farbe des Orts, damit man die Grenzen liest
    for(const o of alleOrte){ if(!imBild(o._bb)) continue; const f = farbe(o); x.fillStyle = f.h; x.globalAlpha = sichtbar(o) ? 0.55 : 0.2;
      x.beginPath(); x.arc(o._cx, o._cy, o._r1, o._b0, o._b1, o._b1 < o._b0); x.arc(o._cx, o._cy, o._r0, o._b1, o._b0, o._b1 >= o._b0); x.closePath(); x.fill();
      x.globalAlpha = 1; x.strokeStyle = f.f; x.lineWidth = 1.4 / s; x.stroke(); }
    for(const u of keile){ if(!imBild(u.k._bb || [u.cx - u.r1, u.cy - u.r1, u.cx + u.r1, u.cy + u.r1])) continue;
      const f = farbe(u.k), an = gew && (wegZu(gew).includes(u.k));
      x.fillStyle = an ? '#fffaf0' : '#fbf7ee'; x.globalAlpha = sichtbar(u.k) ? (an ? 1 : 0.8) : 0.3;
      x.beginPath(); x.arc(u.cx, u.cy, u.r1, u.b0, u.b1, u.b1 < u.b0); x.arc(u.cx, u.cy, u.r0, u.b1, u.b0, u.b1 >= u.b0); x.closePath(); x.fill();
      if(an && gew === u.k){ x.globalAlpha = 1; x.strokeStyle = '#c2410c'; x.lineWidth = 2.5 / s; x.stroke(); } }
    x.globalAlpha = 1;
    // Stamm
    const st = Math.sqrt(W.fassungen) * 1.25 + 8;
    x.fillStyle = '#6b5236'; x.beginPath(); x.moveTo(-st * .7, G + 30); x.bezierCurveTo(-st * .55, G * .55, -st * .4, G * .2, -st * .28, 0); x.lineTo(st * .28, 0); x.bezierCurveTo(st * .4, G * .2, st * .55, G * .55, st * .7, G + 30); x.closePath(); x.fill();
    // Äste
    x.lineCap = 'round';
    const ast = (k, px, py, pa, dick, ton) => {
      const dx = k._x - px, dy = k._y - py, L = Math.hypot(dx, dy) || 1;
      const c1x = pa == null ? px : px + Math.cos(pa) * L * 0.4, c1y = pa == null ? py + (k._y < py ? -1 : 1) * L * 0.4 :py + Math.sin(pa) * L * 0.4;
      const c2x = k._x - Math.cos(k._a) * L * 0.3, c2y = k._y - Math.sin(k._a) * L * 0.3;
      x.strokeStyle = ton; x.lineWidth = dick; x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(c1x, c1y, c2x, c2y, k._x, k._y); x.stroke();
    };
    const dicke = k => Math.max(1 / s, 1.2 + Math.sqrt(k.fassungen + k.gespraeche) * 0.95);
    const male = k => {
      x.globalAlpha = sichtbar(k) ? 1 : 0.25;
      const an = pfad.has(k);
      ast(k, k._px, k._py, k._pa, dicke(k) * (an ? 1.3 : 1), an ? '#3a2814' : '#7d6243');
      if(k._keil){ // Zweig ins eigene Laub
        const u = k._keil, a = (u.b0 + u.b1) / 2; x.strokeStyle = an ? '#3a2814' : '#8a6d4d'; x.lineWidth = Math.max(1 / s, dicke(k) * 0.55);
        x.beginPath(); x.moveTo(k._x, k._y); x.lineTo(u.cx + Math.cos(a) * u.r0, u.cy + Math.sin(a) * u.r0); x.stroke(); }
      for(const c of aesteVon(k)) male(c);
    };
    for(const o of alleOrte) male(o);
    x.globalAlpha = 1;
    x.restore();

    // Blätter
    for(const u of keile){ if(!imBild(u.k._bb || [-1e9, -1e9, 1e9, 1e9])) continue; for(const f of u.bl) blatt(f, (f._g || S) * s * 0.94); }
    for(const f of lose) blatt(f, S * s * 0.94);
    // Karten und Namen der Äste
    const P = platzhalter(), liste = knoten.filter(k => imBild(k._bb)).sort((a, b) => a._tiefe - b._tiefe || b.fassungen - a.fassungen);
    for(const k of liste) karte(k, P);
    if(schwebend) gross(schwebend);
  }

  function blatt(f, g){
    const x = B.x, sx = B.zuX(f._x), sy = B.zuY(f._y);
    if(sx < -g || sy < -g || sx > B.w + g || sy > B.h + g) return;
    const fb = farbe(f); x.globalAlpha = sichtbar(f) ? 1 : 0.16;
    if(f.bild){ const e = lager.nimm(f.bild, g * B.dpr > 220 ? 960 : 240);
      if(g >= 6){ x.fillStyle = '#fff'; x.fillRect(sx - g / 2 - 1, sy - g / 2 - 1, g + 2, g + 2); }
      if(e) bildRahmen(x, e.bild, sx - g / 2, sy - g / 2, g, g); else { x.fillStyle = 'rgba(120,100,70,.25)'; x.fillRect(sx - g / 2, sy - g / 2, g, g); } }
    else if(f.art === 'gespraech'){ x.fillStyle = '#fff'; x.strokeStyle = fb.d; x.lineWidth = 1; x.beginPath(); x.ellipse(sx, sy, g * .46, g * .34, 0, 0, 7); x.fill(); x.stroke(); }
    else papier(x, sx - g * .36, sy - g * .46, g * .72, g * .92, fb.f);
    if(f.von == null && g >= 16){ x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.arc(sx + g * .36, sy - g * .36, Math.max(4, g * .13), 0, 7); x.fill(); x.fillStyle = fb.d; x.font = `600 ${Math.max(8, g * .17)}px ${SANS}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', sx + g * .36, sy - g * .35); }
    if(gew && gew.schluessel === f.schluessel){ x.globalAlpha = 1; x.strokeStyle = '#c2410c'; x.lineWidth = 3; x.strokeRect(sx - g / 2 - 4, sy - g / 2 - 4, g + 8, g + 8); }
    x.globalAlpha = 1;
    T.rechteck(f, sx - g / 2, sy - g / 2, g, g, g < 14 ? Math.max(2, (16 - g) / 2) : 1);
    if(g >= 70){ x.font = `${Math.min(13, g * .15)}px ${SANS}`; x.textAlign = 'center'; x.textBaseline = 'top'; const t = kuerze(x, f.name, g * 1.05), tw = x.measureText(t).width;
      x.fillStyle = 'rgba(251,248,241,.94)'; x.fillRect(sx - tw / 2 - 3, sy + g / 2 + 2, tw + 6, 17); x.fillStyle = '#2b241b'; x.fillText(t, sx, sy + g / 2 + 4); }
  }

  /* Ortsnamen außen am Kronenrand, wie auf einer Karte; nichts liegt auf dem Laub */
  function ortsname(k, P){
    const x = B.x, f = farbe(k), a = (k._b0 + k._b1) / 2, ca = Math.cos(a), sa = Math.sin(a);
    const gr = Math.max(14, Math.min(24, 11 + B.s * 9));
    x.font = `600 ${gr}px ${SERIF}`; const t = k.name, tw = x.measureText(t).width;
    const z = [k.fassungen.toLocaleString('de-DE') + ' Fassungen'], kl = 12;
    let ok = null;
    for(let i = 0; i < 9 && !ok; i++){
      const ex = B.zuX(k._cx + ca * k._r1) + ca * (16 + i * 20), ey = B.zuY(k._cy + sa * k._r1) + sa * (16 + i * 20) + (Math.abs(ca) > 0.3 ? 0 : 0);
      const lx = ca > 0.25 ? ex : ca < -0.25 ? ex - tw : ex - tw / 2, ly = sa < -0.25 || Math.abs(ca) > 0.25 ? ey - gr * 0.9 : ey;
      const r = {x0: lx - 6, y0: ly - 4, x1: lx + tw + 6, y1: ly + gr + kl + 8};
      if(P.frei(r)) ok = {r, lx, ly, ex, ey};
    }
    if(!ok) return;
    P.nimm(ok.r);
    x.globalAlpha = sichtbar(k) ? 1 : 0.35;
    const ax = B.zuX(k._cx + ca * k._r1), ay = B.zuY(k._cy + sa * k._r1);
    x.strokeStyle = f.f; x.lineWidth = 1.5; x.beginPath(); x.moveTo(ax, ay); x.lineTo(ok.ex, ok.ey); x.stroke();
    x.fillStyle = 'rgba(243,238,227,.92)'; x.fillRect(ok.r.x0, ok.r.y0, ok.r.x1 - ok.r.x0, ok.r.y1 - ok.r.y0);
    x.fillStyle = f.d; x.textAlign = 'left'; x.textBaseline = 'top'; x.fillText(t, ok.lx, ok.ly);
    x.font = `${kl}px ${SANS}`; x.fillStyle = '#5d5448'; x.fillText(z[0], ok.lx, ok.ly + gr + 2);
    if(gew && gew.schluessel === k.schluessel){ x.strokeStyle = '#c2410c'; x.lineWidth = 2.5; x.strokeRect(ok.r.x0, ok.r.y0, ok.r.x1 - ok.r.x0, ok.r.y1 - ok.r.y0); }
    x.globalAlpha = 1;
    T.rechteck(k, ok.r.x0, ok.r.y0, ok.r.x1 - ok.r.x0, ok.r.y1 - ok.r.y0, 0);
  }
  /* Bildkarte und Name einer App oder eines Werks, mitten auf seinem Laubstück; nur wenn Platz ist */
  function karte(k, P){
    if(k.art === 'ort') return ortsname(k, P);
    const x = B.x, f = farbe(k), sx = B.zuX(k._lx), sy = B.zuY(k._ly);
    const bogen = k._flaeche * B.s, blattPx = S * B.s;
    if(blattPx > 34 && !pfad.has(k)) return;
    const g = Math.min(56, bogen * 0.42), gr = k._tiefe <= 2 ? 13.5 : 12.5;
    x.font = `500 ${gr}px ${SANS}`;
    const t = kuerze(x, k.name, Math.max(90, Math.min(200, bogen * 0.95))), tw = x.measureText(t).width;
    const mitBild = g >= 26;
    const rk = {x0: sx - g / 2 - 3, y0: sy - g / 2 - 3 - (mitBild ? gr * .7 : 0), x1: sx + g / 2 + 3, y1: sy + g / 2 + 3 - (mitBild ? gr * .7 : 0)};
    const ry = mitBild ? rk.y1 + 3 : sy - gr * .7, rn = {x0: sx - tw / 2 - 6, y0: ry, x1: sx + tw / 2 + 6, y1: ry + gr * 1.45};
    if(bogen < 30 || !P.frei(rn) || (mitBild && !P.frei(rk))) return;
    if(mitBild) P.nimm(rk); P.nimm(rn);
    x.globalAlpha = sichtbar(k) ? 1 : 0.3;
    if(mitBild){ const b = titelBild(k), e = b ? lager.nimm(b, g * B.dpr > 220 ? 960 : 240) : null, cy = (rk.y0 + rk.y1) / 2;
      x.save(); x.shadowColor = 'rgba(40,28,15,.35)'; x.shadowBlur = 8; x.shadowOffsetY = 2; x.fillStyle = '#fff'; x.fillRect(rk.x0, rk.y0, g + 6, g + 6); x.restore();
      if(e) bildRahmen(x, e.bild, sx - g / 2, cy - g / 2, g, g); else if(b){ x.fillStyle = f.h; x.fillRect(sx - g / 2, cy - g / 2, g, g); } else papier(x, sx - g * .34, cy - g * .44, g * .68, g * .88, f.f);
      x.fillStyle = f.f; x.fillRect(rk.x0, rk.y1 - 3, g + 6, 3);
      T.rechteck(k, rk.x0, rk.y0, g + 6, g + 6, 0); }
    x.fillStyle = 'rgba(251,248,241,.92)'; x.beginPath(); x.roundRect ? x.roundRect(rn.x0, rn.y0, rn.x1 - rn.x0, rn.y1 - rn.y0, 5) : x.rect(rn.x0, rn.y0, rn.x1 - rn.x0, rn.y1 - rn.y0); x.fill();
    x.fillStyle = '#2b241b'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, sx, (rn.y0 + rn.y1) / 2 + 0.5);
    x.fillStyle = f.f; x.fillRect(rn.x0, rn.y1 - 2, rn.x1 - rn.x0, 2);
    if(gew && gew.schluessel === k.schluessel){ x.strokeStyle = '#c2410c'; x.lineWidth = 3; x.strokeRect(Math.min(rk.x0, rn.x0) - 3, (mitBild ? rk.y0 : rn.y0) - 3, Math.max(rk.x1, rn.x1) - Math.min(rk.x0, rn.x0) + 6, rn.y1 - (mitBild ? rk.y0 : rn.y0) + 6); }
    x.globalAlpha = 1;
    T.rechteck(k, rn.x0, rn.y0, rn.x1 - rn.x0, rn.y1 - rn.y0, 2);
  }
  function gross(k){
    const b = titelBild(k); if(!b) return;
    const x = B.x, e = lager.nimm(b, 960); if(!e) return;
    const sx = B.zuX(k._x), sy = B.zuY(k._y), g = Math.min(240, Math.max(150, B.w * 0.17));
    const px = Math.min(B.w - g - 10, Math.max(10, sx - g / 2)), py = sy - g - 24 < 10 ? sy + 24 : sy - g - 24;
    x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 18; x.fillStyle = '#fff'; x.fillRect(px - 5, py - 5, g + 10, g + 10); x.restore();
    bildRahmen(x, e.bild, px, py, g, g);
  }

  /* Ein Tipp ins Laub, das zu klein für einzelne Blätter ist, wählt das Werk des Keils */
  function keilBei(px, py){
    const wx = B.vonX(px), wy = B.vonY(py);
    for(const u of keile){ const dx = wx - u.cx, dy = wy - u.cy, r = Math.hypot(dx, dy); if(r < u.r0 - S * .3 || r > u.r1 + S * .3) continue;
      let a = Math.atan2(dy, dx); const lo = Math.min(u.b0, u.b1), hi = Math.max(u.b0, u.b1);
      while(a < lo - Math.PI) a += 2 * Math.PI; while(a > hi + Math.PI) a -= 2 * Math.PI;
      if(a >= lo && a <= hi) return u.k; }
    return null;
  }
  function tipp(px, py){
    const k = T.finde(px, py) || keilBei(px, py);
    if(!k) return;
    if(k === K.gewaehlt() && (k.art === 'fassung' || k.art === 'gespraech')) return K.oeffne(k);
    K.waehle(k, {vonAnsicht: true});
  }
  function schwebe(px, py){
    const k = px < 0 ? null : T.finde(px, py) || keilBei(px, py);
    if(k !== schwebend){ schwebend = k && (k.bild || k.kinder) ? k : null; B.neu(); flaeche.style.cursor = k ? 'pointer' : ''; }
    if(k) sch.zeige(k.name + (k.art === 'fassung' ? (k.von == null ? ' · Zeit nicht belegt' : '') : ''), px, py); else sch.weg();
  }

  function blickAuf(k){
    if(k.art === 'wurzel') return B.blickAuf(gesamt, 1.03);
    if(k.kinder && k._bb){ const bb = k._bb, m = 20; const z = B.blickAuf({x0: bb[0] - m, y0: bb[1] - m, x1: bb[2] + m, y1: bb[3] + m}, 1.1); return z; }
    if(k._x != null){ const z = {cx: k._x, cy: k._y, s: Math.max(B.s, 4)}; return z; }
    return null;
  }
  return {
    zeige(k, sofort, vonAnsicht){
      gew = k; pfad = new Set(wegZu(k));
      if(vonAnsicht && !k.kinder){ B.neu(); return; }
      if(vonAnsicht && k.kinder){ const z = blickAuf(k); if(z && z.s > B.s * 1.3) B.fliege(z, 600); else B.neu(); return; }
      const z = blickAuf(k); if(!z){ B.neu(); return; }
      if(sofort || K.still) B.setze(z); else B.fliege(z, 700);
    },
    suche(){ B.neu(); },
    groesse(){ B.neu(); },
    ende(){ B.ende(); }
  };
}
