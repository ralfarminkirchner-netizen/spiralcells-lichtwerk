/* Der Spiralbaum als Baum (Ralf, 08.11.2026: „Der Baum muss all die Äste tragen mit ihren immer kleineren
   Verästelungen“ – kein gedrehter Ast).

   Ein Stamm trägt alle Orte. Er gabelt sich, jede Gabel teilt die Menge in zwei etwa gleiche Hälften, bis jeder
   Ast einen Ort trägt. Hinter jedem Ort wächst seine eigene Krone nach demselben Gesetz: Apps, dahinter Werke,
   an den Spitzen die Fassungen als Blätter. Dieselbe Gabel auf jeder Stufe, nur kleiner: fraktal.
   Man zoomt stufenlos hinein; Namen stehen in den Kreisen und wachsen mit, sichtbar erst, wenn sie lesbar sind. */

import {spiralbaum, zahlWort, zeichenWort, zeitWort, blattArt} from './stufen-daten.js';
import {bestand} from './daten.js';
import {namen as lesbareNamen} from './link.js';
import {werkAus} from './auswahl.js';
import {leiste} from './ansichten.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = s => document.querySelector(s);
const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); document.querySelector('#baum').prepend(defs);
const namenEl = $('#namen'), svg = $('#baum'), welt = svg.querySelector('.welt'), aesteG = svg.querySelector('.aeste'), knotenG = svg.querySelector('.knoten');

/* ---------- Wuchs ----------
   Von innen nach außen: jede Krone wird zuerst ganz gebaut und weiß dann, wie viel Platz sie braucht (ihr Umkreis).
   An einer Gabel werden zwei Kronen so weit auseinander gesetzt, dass ihre Umkreise sich nicht berühren; der Ast
   dorthin ist so lang, wie die Krone groß ist. So wächst nichts in Fremdes, und jeder Ast ist ein verkleinerter Baum. */
const alle = [], aeste = [];          // aeste: [Polygonpunkte, Besitzer]
const groesse = w => 2.4 * Math.pow(Math.max(w, 1), 0.2);   // flacher als zuvor: ein großer Ort ist größer, aber kein Riese   // Kreis eines Dings aus seiner Menge
const BREIT = 0.3;                    // Astdicke je Kreisgröße der getragenen Menge
const SPREIZ = 0.9;                   // Öffnung einer Gabel
const ROLLT = 6;                      // so wenige Geschwister rollen sich an der Spitze ein
const OBEN = -Math.PI / 2;
const DREH = 0.17;                   // Spiraldrehung je Gabel (Ralf: „mehr diese Spiraldrehung“)
const FAECHER = false;               // Orte als Fächer am Stamm (verworfen: ein Besen, kein Baum)
const DICK = 0.055;
const KRONE = 2.0;                    // Kronenhalbmesser je Kreishalbmesser                   // Astdicke je Kronenhalbmesser

/* Platz: jede Form hat einen Umkreis, jede Krone einen Umkreis um die ihrer Teile. Zwei Kronen berühren sich nur,
   wenn sich zwei ihrer Formen berühren – geprüft wird von außen nach innen, also genau und trotzdem schnell. */
function umkreis(kids){
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for(const n of kids){ x0 = Math.min(x0, n.cx - n.R); y0 = Math.min(y0, n.cy - n.R); x1 = Math.max(x1, n.cx + n.R); y1 = Math.max(y1, n.cy + n.R); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; let R = 0;
  for(const n of kids) R = Math.max(R, Math.hypot(n.cx - cx, n.cy - cy) + n.R);
  return {cx, cy, R, kids};
}
function formKreise(f){
  if(f.typ === 'kreis' || f.typ === 'knoten') return [{cx: f.x, cy: f.y, R: f.r}];
  if(f.typ === 'blatt') return [{cx: f.x + Math.cos(f.dir) * f.r * 0.25, cy: f.y + Math.sin(f.dir) * f.r * 0.25, R: f.r * 1.3}];
  const len = Math.hypot(f.pts[3][0] - f.pts[0][0], f.pts[3][1] - f.pts[0][1]), n = Math.max(2, Math.ceil(len / (f.w0 * 3 + 1e-9)));
  return Array.from({length: n}, (_, i) => { const [x, y] = bezier(f.pts, (i + 0.5) / n); return {cx: x, cy: y, R: f.w0 / 2 + len / n / 2}; });
}
function verbinde(Gs, prims){
  const pk = prims.flatMap(formKreise), h = umkreis([...Gs.map(g => g.h), ...pk]);
  return {formen: [...Gs.flatMap(g => g.formen), ...prims], hs: [...Gs.flatMap(g => g.hs), ...pk, h], h};
}
function dreh(G, w, tx, ty, m = 1){
  const c = Math.cos(w) * m, s = Math.sin(w) * m, p = ([x, y]) => [x * c - y * s + tx, x * s + y * c + ty];
  for(const f of G.formen){ if(f.typ === 'ast'){ f.pts = f.pts.map(p); f.w0 *= m; f.w1 *= m; } else { [f.x, f.y] = p([f.x, f.y]); f.r *= m; if(f.dir != null) f.dir += w; } }
  for(const n of G.hs){ [n.cx, n.cy] = p([n.cx, n.cy]); n.R *= m; }
}
const ID = {c: 1, s: 0, tx: 0, ty: 0};
const tp = (T, x, y) => [x * T.c - y * T.s + T.tx, x * T.s + y * T.c + T.ty];
function stossen(a, Ta, b, Tb, luft){
  const [ax, ay] = tp(Ta, a.cx, a.cy), [bx, by] = tp(Tb, b.cx, b.cy);
  if(Math.hypot(ax - bx, ay - by) >= a.R + b.R + luft) return false;
  if(!a.kids && !b.kids) return true;
  if(a.kids && (!b.kids || a.R >= b.R)) return a.kids.some(k => stossen(k, Ta, b, Tb, luft));
  return b.kids.some(k => stossen(a, Ta, k, Tb, luft));
}
/* ein Ast als weiche Kurve: er verlässt die Gabel in Richtung des Mutterasts und biegt in seine eigene Richtung */
const kurve = (B, a0, a1, l) => [[0, 0], [Math.cos(a0) * l * 0.45, Math.sin(a0) * l * 0.45], [B[0] - Math.cos(a1) * l * 0.35, B[1] - Math.sin(a1) * l * 0.35], B];

/* Ein Ding: Kreis (oder Blatt) mit dem Fuß im Ursprung; über dem Kreis seine eigene Krone */
function ding(k, seite){
  if(blattArt(k)){ const r = blattR(k); return verbinde([], [{typ: 'blatt', k, x: 0, y: -r, r, dir: OBEN}]); }
  if(!(k.kinder && k.kinder.length)){ const r = groesse(k.wert) * (k.bild ? 1.7 : 1); return verbinde([], [{typ: 'kreis', k, x: 0, y: -r, r}]); }
  // der Kreis wächst mit seiner Krone, damit er sie tragen kann und sein Name hineinpasst
  // wie beim Vorbild: die Krone bekommt die Größe, die ihrer Menge zusteht, egal wie viele Teile sie hat;
  // so wird alles Tiefere von selbst immer kleiner
  // ein Ort ist nur die Gabel, an der seine Apps hängen: sein Kreis bleibt klein, die Krone bekommt den Platz
  // die Dinge mit Bild (Apps, Werke) tragen große Kreise, damit ihre Bilder schon von weitem zu sehen sind
  const R = groesse(k.wert), r = R * (k.art === 'ort' ? 0.75 : k.art === 'bereich' || k.art === 'varianten' ? 0.8 : k.art === 'gespraeche' || k.art === 'zeit' ? 0.5 : k.bild ? 1.7 : 1), kreis = {typ: 'kreis', k, x: 0, y: -r, r};
  const K = krone(k.kinder, seite, k, null), Kr = K.h.R;
  dreh(K, 0, 0, 0, KRONE * R * (k.art === 'gespraeche' ? 1 : k.art === 'ort' ? 1.8 : 1) / K.h.R);   // ein Ort trägt eine große Krone   // das Laub der Gespräche steht groß und dicht
  let hoch = 2 * r; const unten = {cx: 0, cy: -r, R: r};
  for(let i = 0; i < 60 && stossen(unten, ID, K.h, {c: 1, s: 0, tx: 0, ty: -hoch}, 0); i++) hoch += r * 0.12;
  const fuss = K.fuss ? K.fuss * (KRONE * R * (k.art === 'ort' ? 1.8 : 1) / Kr) : r * 0.3;
  dreh(K, 0, 0, -hoch);
  // die Krone wächst aus einem Stiel, der mitten im Kreis ansetzt: der Kreis verdeckt den Übergang
  const stiel = {typ: 'ast', pts: [[0, -r], [0, -r - (hoch - r) * 0.35], [0, -hoch + (hoch - r) * 0.3], [0, -hoch]], w0: Math.min(fuss * 1.3, r * 0.9), w1: Math.min(fuss, r * 0.7), wem: k};
  return verbinde([K], [stiel, kreis]);
}
const teil = (l, seite, eltern) => l.length === 1 ? ding(l[0], seite) : krone(l, seite, eltern, null);
const menge = l => l.reduce((s, k) => s + k.wert, 0);

/* Eine Krone: Geschwister teilen sich an Gabeln, an der Spitze rollt sich der Ast ein */
/* Ralf, 08.11.: was mehrere Fassungen hat, bekommt einen eigenen Ast, auf dem sie gezeigt werden. Die Fassungen eines
   Werks hängen nebeneinander an einem Zweig, abwechselnd links und rechts, die früheste unten, die jüngste an der Spitze. */
const blattR = k => k.art === 'gespraech' ? groesse(k.wert) * 1.15 : groesse(k.wert) * (k.bild ? 1.5 : 0.8);
function zweig(reihe, seite, eltern){
  const blaetter = reihe.filter(blattArt), rest = reihe.filter(k => !blattArt(k));
  const rs = blaetter.map(blattR), rmax = Math.max(...rs), schritt = rmax * 1.05;
  const prims = [];
  let y = -rmax * 0.6;
  blaetter.forEach((k, i) => {
    const letzt = i === blaetter.length - 1 && !rest.length, s = (i % 2 ? 1 : -1) * seite;
    const dir = letzt ? OBEN : OBEN + s * (k.art === 'gespraech' ? 0.55 : 0.95), r = rs[i];   // Gespräche stehen fast aufrecht: so liest man sie im Blatt
    prims.push({typ: 'blatt', k, x: Math.cos(dir) * r, y: y + Math.sin(dir) * r, r, dir});
    if(!letzt) y -= schritt;
  });
  const L = -y, gs = [];
  for(const b of rest){ const G = ding(b, seite); dreh(G, 0, 0, -L); gs.push(G); }
  const ast = {typ: 'ast', pts: [[0, 0], [seite * rmax * 0.15, -L * 0.35], [-seite * rmax * 0.15, -L * 0.7], [0, -L]], w0: rmax * 0.32, w1: rmax * 0.1, wem: eltern};
  return verbinde(gs, [ast, ...prims]);
}

/* Laub (Ralf, 08.11.: „dichtes Laub“): die Gespräche eines Themas wachsen als Spiralrosette, Blatt neben Blatt im goldenen
   Winkel wie bei einer Sonnenblume. Innen das älteste Gespräch, außen das jüngste; jedes Blatt zeigt nach außen. */
const GOLD = Math.PI * (3 - Math.sqrt(5));
function rosette(reihe, eltern){
  const r = Math.max(...reihe.map(blattR)), c = r * 0.98, prims = [];
  const Rro = c * Math.sqrt(reihe.length + 1.5) + r * 1.4;
  reihe.forEach((k, i) => {
    const a = i * GOLD + OBEN, rho = c * Math.sqrt(i + 1.5);
    prims.push({typ: 'blatt', k, x: Math.cos(a) * rho, y: -Rro + Math.sin(a) * rho, r: blattR(k), dir: a});
  });
  const ast = {typ: 'ast', pts: [[0, 0], [0, -Rro * 0.3], [0, -Rro * 0.6], [0, -Rro + c]], w0: r * 0.4, w1: r * 0.12, wem: eltern};
  return verbinde([], [ast, ...prims]);
}

function krone(reihe, seite, eltern, meide){
  if(eltern.art === 'gespraeche' && reihe.length > 40 && reihe.every(blattArt)) return rosette(reihe, eltern);   // wenige Gespräche hängen am Zweig
  if(reihe.length > 1 && eltern.art !== 'buendel-fassung' && reihe.every(k => blattArt(k) || k.art === 'buendel-fassung')) return zweig(reihe, seite, eltern);
  if(reihe.length === 1) return gabelung([{G: ding(reihe[0], seite), th: 0, m: reihe[0].wert, wem: reihe[0]}], meide, eltern);
  if(FAECHER && eltern.art === 'wurzel'){   // am Stamm die Orte, an einem Ort seine Apps: alle auf einmal aufgefächert, wie die Hauptäste einer breiten Krone
    const n = reihe.length, weit = Math.min(1.35, 0.32 * (n - 1));
    return gabelung(reihe.map((k, i) => ({G: ding(k, i < (n - 1) / 2 ? -1 : 1), th: n === 1 ? 0 : -weit + 2 * weit * i / (n - 1), m: k.wert, wem: k})), meide, eltern);
  }
  const rollt = reihe.every(blattArt) || (reihe.length <= ROLLT && eltern.art !== 'wurzel');
  let A, B, thA, thB, sA, sB;
  if(rollt){ A = reihe.slice(0, 1); B = reihe.slice(1); thA = -seite * 1.1; thB = seite * 0.62; sA = -seite; sB = seite; }
  else {
    const gw = k => Math.sqrt(k.wert), ganz = reihe.reduce((s, k) => s + gw(k), 0); let i = 1, acc = gw(reihe[0]);
    while(i < reihe.length - 1 && Math.abs(acc + gw(reihe[i]) - ganz / 2) < Math.abs(acc - ganz / 2)) acc += gw(reihe[i++]);
    const a = acc / ganz; A = reihe.slice(0, i); B = reihe.slice(i);
    const sp = eltern.art === 'wurzel' ? 1.45 : SPREIZ;   // am Stamm öffnen sich die Gabeln weit: so steht die Krone breit und der Stamm bleibt kurz
    thA = -sp * (0.25 + 0.75 * (1 - a)) + DREH * seite; thB = sp * (0.25 + 0.75 * a) + DREH * seite; sA = -1; sB = 1;   // jede Gabel dreht sich ein wenig mit ihrer Seite: die Krone windet sich spiralig
  }
  return gabelung([{G: teil(A, sA, eltern), th: thA, m: menge(A), wem: A.length === 1 ? A[0] : eltern},
                   {G: teil(B, sB, eltern), th: thB, m: menge(B), wem: B.length === 1 ? B[0] : eltern}], meide, eltern);
}

/* Die Gabel: Äste so lang machen, bis die Kronen einander, die Äste und den Kreis darunter nicht berühren */
function gabelung(teile, meide, wem){
  const breite = t => Math.max(BREIT * groesse(t.m), DICK * t.G.h.R);   // ein Ast ist so dick, wie seine Krone groß ist
  const lage = (t, lam) => { const l = Math.max(lam * t.G.h.R, breite(t) * 2), a = t.th * 0.6, bx = Math.sin(a) * l, by = -Math.cos(a) * l;
    const T = {c: Math.cos(t.th), s: Math.sin(t.th), tx: bx, ty: by};
    // der Ast endet so breit, wie die Gabel darüber beginnt (G.fuss): so wächst das Obere aus ihm heraus, ohne Absatz
    const w1 = t.G.fuss ? t.G.fuss : breite(t) * 0.92, w0 = Math.max(breite(t) * 1.12, w1 * 1.06);
    const ast = {typ: 'ast', pts: kurve([bx, by], OBEN, OBEN + t.th, l), w0, w1, wem: t.wem, zu: t.wem !== wem};   // zu: der Ast, der zu einem Ding hinführt
    const stiel = formKreise(ast).slice(1);
    return {l, bx, by, T, ast, stiel: stiel.length ? umkreis(stiel) : null};
  };
  // jeder Ast hat seine eigene Länge: wer anstößt, rückt hinaus; stoßen beide Kronen, rücken beide
  const lam = teile.map(() => 0.12); let L;   // kurz beginnen: ein Ast wird nur so lang, wie er muss
  for(let i = 0; i < 120; i++){
    L = teile.map((t, j) => lage(t, lam[j])); const luft = 0.04 * Math.min(...teile.map(t => t.G.h.R));
    const weiter = teile.map(() => false);
    for(let a = 0; a < L.length; a++) for(let b = a + 1; b < L.length; b++){
      if(stossen(teile[a].G.h, L[a].T, teile[b].G.h, L[b].T, luft)){   // im Fächer weicht jeder zweite Ast nach außen aus, so stehen die Kronen versetzt und dicht
        if(L.length > 2 && (a + b) % 2) weiter[a % 2 ? a : b] = true; else weiter[a] = weiter[b] = true; continue; }
      if(L[a].stiel && stossen(L[a].stiel, ID, teile[b].G.h, L[b].T, luft)) weiter[b] = true;
      if(L[b].stiel && stossen(L[b].stiel, ID, teile[a].G.h, L[a].T, luft)) weiter[a] = true;
    }
    if(meide) teile.forEach((t, j) => { if(stossen(meide, ID, t.G.h, L[j].T, luft)) weiter[j] = true; });
    if(!weiter.some(Boolean)) break;
    weiter.forEach((w, j) => { if(w) lam[j] *= 1.08; });
  }
  teile.forEach((t, j) => dreh(t.G, t.th, L[j].bx, L[j].by));
  // zwei Äste wachsen nebeneinander aus dem einen heraus: jeder beginnt an seiner Seite, ihre Außenkanten setzen die des Mutterasts fort
  if(L.length === 2 && Math.abs(teile[0].th) < 0.9 && Math.abs(teile[1].th) < 0.9){   // nur bei sanften Gabeln; in engen Einrollungen stünden die Ecken heraus
    const [a, b] = teile[0].th <= teile[1].th ? [L[0], L[1]] : [L[1], L[0]], wa = a.ast.w0, wb = b.ast.w0;
    for(const [l, sx] of [[a, -wb * 0.42], [b, wa * 0.42]]) { l.ast.pts[0] = [l.ast.pts[0][0] + sx, l.ast.pts[0][1]]; l.ast.pts[1] = [l.ast.pts[1][0] + sx * 0.6, l.ast.pts[1][1]]; }
  }
  const G = verbinde(teile.map(t => t.G), [...L.map(l => l.ast), {typ: 'knoten', x: 0, y: 0, r: Math.max(...L.map(l => l.ast.w0)) * 0.56, wem}]);
  G.fuss = L.length === 2 ? (L[0].ast.w0 + L[1].ast.w0) * 0.95 : L[0].ast.w0;
  return G;
}

/* Formen in Zeichenflächen: Äste als sich verjüngende Bänder, Knoten als runde Gelenke */
function bezier(P, t){ const u = 1 - t; return [0, 1].map(i => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]); }
function band(f){
  const n = 18, L = [], R = [];
  for(let i = 0; i <= n; i++){
    const t = i / n, [x, y] = bezier(f.pts, t), [xa, ya] = bezier(f.pts, Math.max(0, t - 0.01)), [xb, yb] = bezier(f.pts, Math.min(1, t + 0.01));
    const d = Math.hypot(xb - xa, yb - ya) || 1, nx = -(yb - ya) / d, ny = (xb - xa) / d;
    const b = (f.stamm ? f.w1 + (f.w0 - f.w1) * Math.pow(1 - t, 2.2) : f.w0 + (f.w1 - f.w0) * t) / 2;
    L.push([x + nx * b, y + ny * b]); R.push([x - nx * b, y - ny * b]);
  }
  return L.concat(R.reverse());
}
const rund = (x, y, r) => Array.from({length: 28}, (_, i) => [x + Math.cos(i * Math.PI / 14) * r, y + Math.sin(i * Math.PI / 14) * r]);

// alle Flächen im selben Drehsinn, sonst stanzen sich überlappende Äste gegenseitig Löcher
const gleichsinnig = P => { let a = 0; for(let i = 0; i < P.length; i++){ const [x0, y0] = P[i], [x1, y1] = P[(i + 1) % P.length]; a += x0 * y1 - x1 * y0; } return a < 0 ? P.reverse() : P; };
/* Boden und Wurzeln (Ralf, 08.11.: „eine tiefe Verästelung bis in den Boden … wirklich in die Breite … nicht auf einem
   geraden Boden, sondern auf einem gewölbten … ein ganz flacher Bogen, auf dem der Baum steht“). Der Boden ist ein Kreis,
   dessen Scheitel am Fuß des Stamms liegt; die Wurzeln gabeln sich wie die Krone, nur nach unten und weit zur Seite. */
let BOGEN = 1, wurzelTief = 0, wurzelBreit = 0;
const wurzelFormen = [];
const bodenY = x => BOGEN - Math.sqrt(Math.max(0, BOGEN * BOGEN - x * x));
function wurzle(R, fuss){
  BOGEN = R * 9;   // extrem flach, aber ein Bogen
  let saat = 20261108; const z = () => (saat = (saat * 16807) % 2147483647) / 2147483647, um = (a, b) => a + (b - a) * z();
  const unten = Math.PI / 2;
  // jede Wurzel wächst für sich: eigene Länge, eigener Knick, mal zwei, mal drei Äste, mal einer, der allein weiterkriecht
  const wachse = (x, y, dir, len, w, stufe) => {
    const knick = um(-0.45, 0.45);
    let ex = x + Math.cos(dir) * len, ey = y + Math.sin(dir) * len;
    const min = bodenY(ex) + R * 0.01; if(ey < min) ey = min;
    const d2 = Math.atan2(ey - y, ex - x) + knick, b1 = um(0.25, 0.5), b2 = um(0.25, 0.45);
    wurzelFormen.push({typ: 'ast', pts: [[x, y], [x + Math.cos(dir) * len * b1, y + Math.sin(dir) * len * b1],
      [ex - Math.cos(d2) * len * b2 + um(-1, 1) * len * 0.08, ey - Math.sin(d2) * len * b2], [ex, ey]], w0: w, w1: w * um(0.55, 0.7)});
    const w1 = wurzelFormen[wurzelFormen.length - 1].w1;   // die Äste setzen genau so breit an, wie die Wurzel dort ist: keine Stufen
    if(stufe <= 0 || w < R * 0.0015) return;
    const zahl = z() < 0.18 ? 1 : z() < 0.8 ? 2 : 3, zieh = (unten - d2) * um(0.02, 0.12);
    for(let i = 0; i < zahl; i++){
      const a = zahl === 1 ? d2 + um(-0.3, 0.3) : d2 + (i / (zahl - 1) - 0.5) * um(0.6, 1.2) + um(-0.15, 0.15);
      wachse(ex, ey, a + zieh, len * um(0.5, 0.82), w1 * (zahl === 1 ? 1 : um(0.7, 0.88)), stufe - (zahl === 1 ? 0.5 : 1));
    }
  };
  // Hauptwurzeln: ungleich verteilt, die äußeren lang und fast waagrecht, damit das Wurzelwerk breit wird
  const haupt = 9;
  for(let i = 0; i < haupt; i++){
    const t = i / (haupt - 1) - 0.5, a = t * 2.95 + um(-0.12, 0.12), aussen = Math.abs(t) * 2;
    wachse(Math.sin(a) * fuss * 0.36, fuss * 0.16, unten + a, R * (0.1 + aussen * um(0.22, 0.34)), fuss * (0.34 - aussen * 0.12) * um(0.8, 1.1), 5 + Math.round(aussen));
  }
  // in die Breite statt in die Tiefe, und nie über der Erde
  // jede Wurzel liegt mit ihrer ganzen Breite unter der Erde, auch die dicken am Stammfuß: keine Buckel, keine Kanten
  for(const f of wurzelFormen) f.pts = f.pts.map(([x, y], i) => [x, Math.max(bodenY(x) + (f.w0 + (f.w1 - f.w0) * i / 3) * 0.55, y * 0.6)]);
  wurzelTief = Math.max(...wurzelFormen.flatMap(f => f.pts.map(p => p[1])));
  wurzelBreit = Math.max(...wurzelFormen.flatMap(f => f.pts.map(p => Math.abs(p[0]))));
}

/* Der Stamm und die Gesamtkrone (Ralf, 08.11.: „all die Grunddinge brauchen einen eigenen Arm“; 09.11.: die Krone dicht
   und fraktal, „eine Mischung aus beidem“). Über dem Stamm wölbt sich eine Kuppel wie das Laubdach eines echten Baums.
   Jeder Ort bekommt darin einen Sektor, so breit wie seine Menge, in der Zeitfolge von links nach rechts. Seine Krone
   steht nach außen gedreht, ihr Rand an der Kuppelhaut, und wächst, bis sie an Nachbarn, Arme oder Stamm stößt: so
   füllen die Kronen den Raum. Innen bleibt jede Krone selbstähnlich, Gabel auf Gabel, an den Spitzen eingerollt.
   Jeder Ort hängt an seinem eigenen Arm; die Arme setzen spiralig an, abwechselnd links und rechts, unten weit, oben
   steil, der oberste setzt den Stamm fort. Der Stamm ist so stark wie alle Arme über ihm zusammen. */
function stammKrone(orte, baum){
  const n = orte.length, G = orte.map(k => ding(k, 1));
  const kreisVon = (g, k) => (g.formen.find(f => f.typ === 'kreis' && f.k === k) || {r: g.h.R * 0.2}).r;
  const RD = 100, HD = RD * 1.02, D = [0, -HD], SPANNE = 1.42;
  // Startgröße nach Menge, flach gestaucht; dann wachsen alle gemeinsam, bis sie anstoßen
  const ziel = orte.map(k => Math.pow(Math.max(k.wert, 1), 0.5))   // Fläche der Krone wie ihre Menge (Ralf, 09.11.: „stärker“)
  , zm = Math.max(...ziel);
  G.forEach((g, i) => dreh(g, 0, 0, 0, RD * 0.07 * ziel[i] / zm / g.h.R));
  const seite = orte.map((_, i) => i === n - 1 ? 0 : (i % 2 ? 1 : -1));
  // Lage auf der Kuppel: unten am Stamm heißt außen in der Krone; die Sektoren teilen die Spanne nach Menge
  const reihe = orte.map((_, i) => i).sort((a, b) => seite[a] * (1 - a / Math.max(1, n - 1)) - seite[b] * (1 - b / Math.max(1, n - 1)));
  const sek = reihe.map(i => ziel[i])   // der Sektor so breit wie die Krone, die er trägt
  , sg = sek.reduce((s, v) => s + v, 0), phi = [];
  let acc = 0; reihe.forEach((i, q) => { phi[i] = -SPANNE + 2 * SPANNE * (acc + sek[q] / 2) / sg; acc += sek[q]; });
  const hoehe = orte.map((_, i) => HD * (0.3 + 0.7 * Math.pow(i / Math.max(1, n - 1), 0.85)));
  const winkel = phi, KURZ = 0.16;   // der Arm zielt mitten in seinen Sektor
  const H = HD, mitte = h => Math.sin(h / H * Math.PI * 1.15) * H * 0.03;
  const arm = i => kreisVon(G[i], orte[i]) * 1.05;
  const breiteBei = h => Math.sqrt(orte.reduce((s, _, j) => s + (hoehe[j] >= h - 1e-9 ? arm(j) ** 2 : 0), 0));
  const reich = g => -g.h.cy + g.h.R;   // wie weit die Krone vom Fuß nach außen reicht
  // jeder Arm ist ein Strahl aus seinem Ansatz am Stamm; tiefer ansetzende Strahlen gehen weiter hinaus, so kreuzt sich nichts.
  // Am Ende des Strahls sitzt die Krone, ihr äußerer Rand an der Kuppelhaut; reicht der Strahl nicht hin, steht sie dicht am Stamm.
  const lage = i => {
    const h = hoehe[i], A = [mitte(h), -h], th = winkel[i], ende = th * 0.82, u = [Math.sin(th), -Math.cos(th)];
    const rho = RD * (0.26 + 0.74 * ziel[i] / zm) - reich(G[i]), dx = A[0] - D[0], dy = A[1] - D[1];   // kleine Kronen bleiben näher am Stamm, statt an langen Stielen hinauszuragen
    const bq = dx * u[0] + dy * u[1], cq = dx * dx + dy * dy - rho * rho, disk = bq * bq - cq;
    const d = Math.max(disk > 0 ? -bq + Math.sqrt(disk) : 0, KURZ * RD);
    const fx = A[0] + u[0] * d, fy = A[1] + u[1] * d;
    const pts = [[A[0], A[1] + arm(i) * 0.6], [A[0] + Math.sin(th * 1.12) * d * 0.4, A[1] - Math.cos(th * 1.12) * d * 0.4], [fx - Math.sin(ende) * d * 0.3, fy + Math.cos(ende) * d * 0.3], [fx, fy]];
    const ast = {typ: 'ast', pts, w0: Math.max(arm(i) * 1.25, i === n - 1 ? breiteBei(h) : 0), w1: arm(i) * 0.95, wem: orte[i], zu: true};
    return {T: {c: Math.cos(ende), s: Math.sin(ende), tx: fx, ty: fy}, ast, end: ende};
  };
  const stammKreise = () => umkreis(Array.from({length: 24}, (_, q) => { const h = H * 0.92 * q / 23; return {cx: mitte(h), cy: -h, R: breiteBei(h) * 0.6 + 1e-6}; }));
  // wachsen alle zugleich mit einem Faktor (Ralf, 09.11.: die Größe gehört an die Menge, nicht an den freien Platz):
  // wer mehr trägt, ist immer größer. Stoßen zwei Kronen an, rücken sie und alles hinter ihnen zur Seite, solange die
  // Kuppel reicht; erst wenn nichts mehr ausweichen kann, hören alle zugleich auf.
  const WEIT = 1.66;
  const anstoss = L => { const luft = RD * 0.004;
    for(let i = 0; i < n; i++){ if(stossen(stammKreise(), ID, G[i].h, L[i].T, luft)) return [i, -1];
      for(let j = i + 1; j < n; j++) if(stossen(G[i].h, L[i].T, G[j].h, L[j].T, luft)) return [i, j];
      for(let j = 0; j < n; j++){ if(j === i) continue; const st = formKreise(L[j].ast).slice(2);   // kein fremder Arm quer über eine Krone
        if(st.length && stossen(umkreis(st), ID, G[i].h, L[i].T, luft)) return [i, j]; } }
    return null; };
  const spreize = (i, j) => { const lo = phi[i] <= phi[j] ? i : j, hi = lo === i ? j : i, pl = phi[lo], ph = phi[hi], d = 0.008;
    for(let k = 0; k < n; k++){ if(phi[k] <= pl) phi[k] -= d; else if(phi[k] >= ph) phi[k] += d; }
    return Math.max(...phi.map(Math.abs)) <= WEIT; };
  for(const f of [1.08, 1.02, 1.005]){
    for(let it = 0; it < 300; it++){
      const vor = phi.slice(); G.forEach(g => dreh(g, 0, 0, 0, f));
      let frei = false;
      for(let v = 0; v < 120; v++){ const a = anstoss(orte.map((_, j) => lage(j))); if(!a){ frei = true; break; } if(a[1] < 0 || !spreize(a[0], a[1])) break; }
      if(!frei){ G.forEach(g => dreh(g, 0, 0, 0, 1 / f)); vor.forEach((p, k) => phi[k] = p); break; }
    }
  }
  const L = orte.map((_, i) => lage(i));
  orte.forEach((_, i) => dreh(G[i], L[i].end, L[i].T.tx, L[i].T.ty));
  // der Stamm: eine Fläche aus einem Guss, seine Breite folgt weich den abgehenden Armen
  const links = [], rechts = [], N = 140, fussB = breiteBei(0) * 1.7;
  for(let q = 0; q <= N; q++){
    const h = -breiteBei(0) * 0.25 + (H + breiteBei(0) * 0.25) * q / N, t = Math.max(0, h) / H;
    let w = 0, gew = 0;
    for(let d = 0; d <= 14; d++){ const hh = h - d * H * 0.012, g = 15 - d; w += breiteBei(Math.max(0, Math.min(h, hh))) * g; gew += g; }   // nur nach unten gemittelt: oben läuft der Stamm genau in den letzten Arm aus
    w = w / gew * (1 + 0.08 * (1 - t)) + (fussB - breiteBei(0)) * Math.pow(Math.max(0, 1 - t * 3.2), 2.2);
    links.push([mitte(Math.max(0, h)) - w / 2, -h]); rechts.push([mitte(Math.max(0, h)) + w / 2, -h]);
  }
  const stamm = links.concat(rechts.reverse());
  const K = verbinde(G, L.map(l => l.ast));
  K.stamm = stamm; K.fuss = fussB; K.hoch = H;
  return K;
}

function pflanze(baum){
  const K = stammKrone(baum.kinder, baum), fuss = K.fuss;
  const formen = [...K.formen];
  aeste.push([gleichsinnig(K.stamm.slice()), baum]);
  wurzle(K.h.R, fuss);
  Object.assign(baum, {x: 0, y: 0, r: 0});
  for(const f of formen){
    if(f.typ === 'ast'){ aeste.push([gleichsinnig(band(f)), f.wem, f.zu]);
      // runde Enden genau in der Breite des Asts: Gelenke verschmelzen, ohne Kante und ohne Knubbel
      const [a, b] = [f.pts[0], f.pts[3]];
      aeste.push([gleichsinnig(rund(a[0], a[1], f.w0 / 2)), f.wem, f.zu], [gleichsinnig(rund(b[0], b[1], f.w1 / 2)), f.wem, f.zu]); }
    else if(f.typ === 'knoten') {}   // Gelenke werden nicht gezeichnet (Ralf: „diese komischen Knubbel“)
    else Object.assign(f.k, {x: f.x, y: f.y, r: f.r, dir: f.dir});
  }
  const ordne = (k, eltern) => { Object.assign(k, {eltern, nr: alle.length, tiefe: eltern ? eltern.tiefe + 1 : 0}); alle.push(k); for(const c of k.kinder || []) ordne(c, k); };
  ordne(baum, null);
}

/* Umriss jedes Teilbaums, für das Hineinfahren */
function umrisse(){
  for(const k of alle) k.box = k.r ? [k.x - k.r * 1.6, k.y - k.r * 1.6, k.x + k.r * 1.6, k.y + k.r * 1.6] : [Infinity, Infinity, -Infinity, -Infinity];
  // der Ast, der zu einem Ding hinführt, gehört zum Umriss darüber, nicht zum Ding: sonst reicht jeder Ort bis an den Stamm
  for(const [pts, wem0, zu] of aeste){ const wem = zu && wem0 ? wem0.eltern : wem0; if(wem && wem.box) for(const [x, y] of pts){ const b = wem.box; if(x < b[0]) b[0] = x; if(y < b[1]) b[1] = y; if(x > b[2]) b[2] = x; if(y > b[3]) b[3] = y; } }
  for(let i = alle.length - 1; i >= 0; i--){ const k = alle[i], e = k.eltern; if(!e) continue;
    e.box = [Math.min(e.box[0], k.box[0]), Math.min(e.box[1], k.box[1]), Math.max(e.box[2], k.box[2]), Math.max(e.box[3], k.box[3])]; }
}

/* ---------- Zeichnen ---------- */
const el = (n, a, p) => { const e = document.createElementNS(NS, n); for(const k in a) e.setAttribute(k, a[k]); if(p) p.appendChild(e); return e; };
function blattPfad(c){   // Fassungen und Gespräche sind kleine runde Zellen (Ralf, 09.11.: „diese paar Blätter sehen albern aus“)
  const r = c.r * 0.82, x = c.x + Math.cos(c.dir) * c.r * 0.25, y = c.y + Math.sin(c.dir) * c.r * 0.25;
  return `M${(x - r).toFixed(3)} ${y.toFixed(3)}a${r.toFixed(3)} ${r.toFixed(3)} 0 1 0 ${(2 * r).toFixed(3)} 0a${r.toFixed(3)} ${r.toFixed(3)} 0 1 0 ${(-2 * r).toFixed(3)} 0Z`;
}
function blattPfadAlt(c){
  const r = c.r, a = c.dir, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
  const P = (s, t) => `${(c.x + ux * s * r + vx * t * r).toFixed(3)} ${(c.y + uy * s * r + vy * t * r).toFixed(3)}`;
  return `M${P(-1, 0)} C${P(-1, 0.95)} ${P(0.8, 1)} ${P(1.5, 0)} C${P(0.8, -1)} ${P(-1, -0.95)} ${P(-1, 0)}Z`;
}
/* Ein Name in Zeilen, die in den Kreis passen */
function zeilen(name, proZeile, hoechstens){
  const woerter = name.split(/\s+/).flatMap(w => [...w].length > proZeile ? w.split(/(?<=-)/) : [w]), z = [];
  for(const w of woerter){ const l = z.length ? z[z.length - 1] : null;
    const fuge = l && l.endsWith('-') ? '' : ' ';
    if(l !== null && (l + fuge + w).length <= proZeile) z[z.length - 1] = l + fuge + w; else z.push(w); }
  if(z.length > hoechstens){ z.length = hoechstens; z[hoechstens - 1] = z[hoechstens - 1].replace(/.?$/, '…'); }
  return z;
}
let zeitSpanne = [0, 1];
const gruen = k => { if(!k.datiert) return '#7f9c68';
  const t = Math.max(0, Math.min(1, (k.von - zeitSpanne[0]) / (zeitSpanne[1] - zeitSpanne[0] || 1)));
  return `hsl(${92 + t * 8} ${34 + t * 22}% ${30 + t * 26}%)`; };
const unterzeile = k => ['gespraeche', 'zeit', 'gespraech'].includes(k.art) || k.zeichen === 0 ? zahlWort(k) : zeichenWort(k.zeichen);
function zeichne(){
  const tage = alle.filter(k => k.art === 'gespraech' && k.datiert).map(k => k.von);
  if(tage.length) zeitSpanne = [Math.min(...tage), Math.max(...tage)];
  // Je Ding ein Pfad für seine Äste, damit Fremdes beim Hineinzoomen zurücktreten kann
  const je = new Map(); for(const [p, wem] of aeste){ if(!je.has(wem)) je.set(wem, []); je.get(wem).push('M' + p.map(q => q[0].toFixed(5) + ' ' + q[1].toFixed(5)).join('L') + 'Z'); }
  el('circle', {class: 'boden', cx: 0, cy: BOGEN, r: BOGEN}, aesteG);   // der Boden: ein ganz flacher Bogen, auf dem der Baum steht
  el('path', {class: 'wurzelwerk', d: wurzelFormen.map(f => 'M' + gleichsinnig(band(f)).map(q => q[0].toFixed(3) + ' ' + q[1].toFixed(3)).join('L') + 'Z').join('')}, aesteG);
  for(const [wem, d] of je) wem.ast = el('path', {class: 'ast', d: d.join('')}, aesteG);
  for(const k of alle){
    if(k.art === 'wurzel') continue;
    if(blattArt(k)){
      const gs = k.art === 'gespraech';
      const g = el('g', {class: 'blatt ' + (gs ? 'gespraech' : k.datiert ? 'belegt' : 'offen'), 'data-nr': k.nr}, knotenG);
      const pf = el('path', {d: blattPfad(k), 'stroke-width': k.r * 0.06}, g);
      if(gs) pf.style.fill = gruen(k);   // jung hell, alt dunkel: die Zeit sieht man am Grün
      if(!k.bild && !gs) umschlag(k, g, pf, k.x + Math.cos(k.dir) * k.r * 0.25, k.y + Math.sin(k.dir) * k.r * 0.25, k.r * 0.55, false);
      if(k.bild){   // die Fassung zeigt ihr eigenes Bild in der Blattform
        const c = el('clipPath', {id: 'rund' + k.nr}, defs); el('path', {d: blattPfad(k)}, c);
        const mx = k.x + Math.cos(k.dir) * k.r * 0.25, my = k.y + Math.sin(k.dir) * k.r * 0.25, h = k.r * 1.3;
        k.bildEl = el('image', {x: mx - h, y: my - h, width: 2 * h, height: 2 * h, preserveAspectRatio: k.bildHoch > 1.25 ? 'xMidYMin slice' : 'xMidYMid slice', 'clip-path': `url(#rund${k.nr})`, class: 'bild'}, g);
        const sch = el('path', {d: blattPfad(k), class: 'schleier'}, g);
        k.bildEl.addEventListener('error', () => { k.bildEl.remove(); sch.remove(); k.bildEl = null; });
        g.classList.add('mitbild');
      }
      const zb = zeilen(k.name, 14, 3), lang = Math.max(...zb.map(z => [...z].length), 1);   // der Name bleibt im Blatt
      const t = el('text', {x: k.x + Math.cos(k.dir) * k.r * 0.25, y: k.y + Math.sin(k.dir) * k.r * 0.25, 'font-size': Math.min(k.r * 0.22, k.r * 1.45 / (0.6 * lang)), class: 'name'}, g);
      k.fs = Math.min(0.22, 1.45 / (0.6 * lang));
      if(gs) k.datumEl = el('tspan', {x: t.getAttribute('x'), dy: '-1.6em', class: 'datum'}, t), k.datumEl.textContent = zahlWort(k);
      zb.forEach((z, i, l) => el('tspan', {x: t.getAttribute('x'), dy: i || gs ? '1.15em' : `${-(l.length - 1) * 0.575}em`}, t).textContent = z);
      k.text = t; k.form = g; continue;
    }
    const g = el('g', {class: `kn ${k.art}${k.auch && k.auch.length > 1 ? ' verschraenkt' : ''}${k.bild ? ' mitbild' : ''}`, 'data-nr': k.nr}, knotenG);
    el('circle', {cx: k.x, cy: k.y, r: k.r, 'stroke-width': k.r * 0.06}, g);
    if(k.bild){   // ein rundes Bild aus dem Fundus; geladen erst, wenn der Kreis groß genug zu sehen ist
      const c = el('clipPath', {id: 'rund' + k.nr}, defs); el('circle', {cx: k.x, cy: k.y, r: k.r * 0.97}, c);
      k.bildEl = el('image', {x: k.x - k.r, y: k.y - k.r, width: 2 * k.r, height: 2 * k.r, preserveAspectRatio: k.bildHoch > 1.25 ? 'xMidYMin slice' : 'xMidYMid slice', 'clip-path': `url(#rund${k.nr})`, class: 'bild'}, g);
      const schleier = el('circle', {cx: k.x, cy: k.y, r: k.r * 0.97, class: 'schleier'}, g);   // ein leichter Schatten, damit der Name auf dem Bild lesbar bleibt
      k.bildEl.addEventListener('error', () => { k.bildEl.remove(); schleier.remove(); k.bildEl = null; g.classList.remove('mitbild'); });   // kein Bild da: der Kreis bleibt schlicht
    } else if(!['wurzel', 'buendel', 'buendel-fassung'].includes(k.art)) bebildere(k, g);
    const zl = zeilen(k.name, 11, 3), fs = Math.min(k.r * (k.art === 'ort' || k.art === 'bereich' ? 0.36 : 0.27), k.r * 1.75 / (0.62 * Math.max(...zl.map(z => [...z].length)))); k.fs = fs / k.r;
    const t = el('text', {x: k.x, y: k.y - (zl.length - 1) * fs * 0.58 - fs * 0.35, 'font-size': fs, class: 'name'}, g);
    zl.forEach((z, i) => el('tspan', {x: k.x, dy: i ? '1.15em' : 0}, t).textContent = z);
    const m = el('text', {x: k.x, y: k.y + (zl.length) * fs * 0.58 + fs * 0.25, 'font-size': fs * 0.52, class: 'menge'}, g);
    el('tspan', {x: k.x, dy: 0}, m).textContent = zahlWort(k);
    el('tspan', {x: k.x, dy: '1.2em'}, m).textContent = ['gespraeche', 'zeit'].includes(k.art) ? '' : zeichenWort(k.zeichen);
    k.text = t; k.menge = m; k.form = g;
  }
}

/* Große Kreise ohne eigenes Bild (Ralf, 09.11.: „warum sind ausgerechnet die großen Kreise ohne jegliche Bilder“):
   sie zeigen eine Collage aus den echten Bildern, die unter ihnen wachsen, je Ast eines. Wächst darunter kein Bild,
   bekommt der Kreis einen Umschlag (unten) – erfunden ist dabei kein Inhalt. */
function bilderUnter(k, n){
  const l = [], lauf = q => { if(l.length >= n) return; if(q.bild && q !== k) l.push(q.bild);
    else for(const b of q.bilder || []){ if(l.length >= n) break; l.push(b.pfad); }
    for(const c of q.kinder || []) lauf(c); };
  lauf(k); return l;
}
function sammleBilder(k, n){
  const je = (k.kinder || []).map(c => bilderUnter(c, n)).filter(l => l.length), aus = [], da = new Set();
  for(let i = 0; aus.length < n && je.some(l => l.length > i); i++) for(const l of je){ const p = l[i]; if(p && !da.has(p) && aus.length < n){ da.add(p); aus.push(p); } }
  return aus;
}
const farbe = t => { let h = 0; for(const c of String(t)) h = (h * 31 + c.codePointAt(0)) >>> 0; return h % 360; };
function bebildere(k, g){
  const bs = sammleBilder(k, 4), r = k.r * 0.97;
  if(bs.length){
    const c = el('clipPath', {id: 'rund' + k.nr}, defs); el('circle', {cx: k.x, cy: k.y, r}, c);
    const x0 = k.x - r, y0 = k.y - r, d = 2 * r, h = d / 2;
    const kacheln = bs.length === 1 ? [[x0, y0, d, d]] : bs.length === 2 ? [[x0, y0, h, d], [k.x, y0, h, d]]
      : bs.length === 3 ? [[x0, y0, h, d], [k.x, y0, h, h], [k.x, k.y, h, h]] : [[x0, y0, h, h], [k.x, y0, h, h], [x0, k.y, h, h], [k.x, k.y, h, h]];
    const vor = g.querySelector('circle');
    k.kacheln = kacheln.map(([x, y, w, hh], i) => { const e = el('image', {x, y, width: w, height: hh, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#rund${k.nr})`, class: 'bild'}, g);
      e.addEventListener('error', () => e.remove()); return {el: e, pfad: bs[i], w: 0}; });
    el('circle', {cx: k.x, cy: k.y, r, class: 'schleier collage-schleier'}, g);
    g.classList.add('mitbild', 'collage');
  } else umschlag(k, g, g.querySelector('circle'), k.x, k.y, r, true);
}
/* Ein Umschlag für alles ohne eigenes Bild (Ralf, 09.11.: „warum bekommen so viele Dinge überhaupt kein Cover? Es sieht
   alles so halbfertig aus“): ein Farbverlauf aus dem Namen, darin die Spirale und ein Kranz aus Zellen. Er ist erkennbar
   gestaltet, nicht fotografiert, und behauptet keinen Inhalt. Verläufe teilen sich je Farbton, damit es leicht bleibt. */
const verlaeufe = new Set();
function verlauf(hu){
  const id = 'umschlag' + hu; if(verlaeufe.has(id)) return id; verlaeufe.add(id);
  const v = el('linearGradient', {id, x1: 0, y1: 0, x2: 1, y2: 1}, defs);
  el('stop', {offset: 0, 'stop-color': `hsl(${hu} 70% 80%)`}, v); el('stop', {offset: 0.55, 'stop-color': `hsl(${(hu + 25) % 360} 58% 62%)`}, v); el('stop', {offset: 1, 'stop-color': `hsl(${(hu + 50) % 360} 52% 42%)`}, v);
  return id;
}
function umschlag(k, g, form, cx, cy, r, kranz){
  const hu = Math.round(farbe(k.name) / 12) * 12 % 360;
  form.style.fill = `url(#${verlauf(hu)})`; form.style.stroke = '#fffaf0';
  const m = el('g', {class: 'muster'}, g), dreh = (farbe(k.name + '·') % 360) * Math.PI / 180, pk = [];
  // logarithmische Spirale vom Kern nach außen
  for(let i = 0; i <= 90; i++){ const t = i / 90, a = dreh + t * Math.PI * 5, rr = r * 0.86 * Math.pow(t, 1.6); pk.push(`${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(4)} ${(cy + Math.sin(a) * rr).toFixed(4)}`); }
  el('path', {d: pk.join(''), style: `fill:none;stroke:#fff;stroke-opacity:.55;stroke-width:${(r * 0.045).toFixed(4)};stroke-linecap:round`}, m);
  if(kranz){ const GW = Math.PI * (3 - Math.sqrt(5)), n = 26, z = [];
    for(let i = 4; i <= n; i++){ const a = dreh + i * GW, rr = r * 0.9 * Math.sqrt(i / n), pr = r * (0.02 + 0.045 * i / n);
      z.push(`M${(cx + Math.cos(a) * rr - pr).toFixed(4)} ${(cy + Math.sin(a) * rr).toFixed(4)}a${pr.toFixed(4)} ${pr.toFixed(4)} 0 1 0 ${(2 * pr).toFixed(4)} 0a${pr.toFixed(4)} ${pr.toFixed(4)} 0 1 0 ${(-2 * pr).toFixed(4)} 0Z`); }
    el('path', {d: z.join(''), style: 'fill:#fff;fill-opacity:.32'}, m); }
  g.classList.add('umschlag');
}

/* ---------- Blick ---------- */
let wurzelKnoten = null, W = innerWidth, H = innerHeight, blick = {x: 0, y: 0, s: 1, mx: W / 2, my: H / 2}, ziel = null, fokus = null, gewaehlt = null;
const SCHMAL = () => W < 600;
const oben = () => (SCHMAL() ? 104 : 56), unten = () => (SCHMAL() ? 160 : 110);
/* Der ganze Baum füllt den Schirm und steht unten auf dem Boden (Ralf: „verwurzelt auf dem Boden … nicht in der Luft
   schweben, er braucht ja nicht kleiner sein als die Vollbildansicht“). Weiter hinaus geht es nicht, und schieben
   lässt sich der Blick nur so weit, dass nie leerer Himmel neben einem kleinen Baum steht. */
let grenze = null;
function vollbild(){
  // der ganze Baum mit seinen Wurzeln; der Boden wölbt sich darunter
  const bx = wurzelKnoten.box, x0 = Math.min(bx[0], -wurzelBreit), x1 = Math.max(bx[2], wurzelBreit), y0 = bx[1], rand = SCHMAL() ? 112 : 10;   // am Handy enden die Wurzeln über der Karte
  // auf dem schmalen Handy füllt der Baum die Höhe (seitlich schiebbar), statt klein unter leerem Himmel zu stehen
  const sb = (W - 16) / (x1 - x0), sk = (W - 16) / (bx[2] - bx[0]), sh = (H - oben() - rand) / (wurzelTief - y0), s = Math.min(sh, SCHMAL() ? sk * 1.9 : sb);
  const cx = (x0 + x1) / 2, bodenY = H - rand - wurzelTief * s;
  grenze = {s, x0: Math.min(x0 - 8 / s, cx - W / 2 / s), x1: Math.max(x1 + 8 / s, cx + W / 2 / s), y0: -bodenY / s, y1: (H - bodenY) / s};
  return {x: cx, y: 0, s, mx: W / 2, my: bodenY};
}
let kleinstesBlatt = Infinity;
function halte(b){
  if(!grenze) return b;
  const s = Math.min(Math.max(b.s, grenze.s), Math.min(W, H) * 1.1 / (kleinstesBlatt * 1.2)), x = Math.min(Math.max(b.x, grenze.x0 + b.mx / s), grenze.x1 - (W - b.mx) / s);
  const y = Math.min(Math.max(b.y, grenze.y0 + b.my / s), grenze.y1 - (H - b.my) / s);
  return {...b, s, x, y};
}
function passend(k){
  if(k.art === 'wurzel') return vollbild();
  // eine Stufe zeigt ihre Krone: was darüber wächst, und vom eigenen Kreis nur den oberen Rand als Fuß
  const kids = (k.kinder || []).filter(c => c.box && isFinite(c.box[0]));
  const [x0, y0, x1, y1] = kids.length ? kids.reduce((b, c) => [Math.min(b[0], c.box[0]), Math.min(b[1], c.box[1]), Math.max(b[2], c.box[2]), Math.max(b[3], c.box[3])],
    [k.x - k.r * 0.6, k.y - k.r * 0.4, k.x + k.r * 0.6, k.y - k.r * 0.4]) : k.box, bw = W - 24, bh = H - oben() - unten();
  const s = Math.min(bw / (x1 - x0) * (SCHMAL() ? 1.4 : 1), bh / (y1 - y0)) * 0.96;
  return halte({x: (x0 + x1) / 2, y: (y0 + y1) / 2, s, mx: W / 2, my: oben() + bh / 2});
}
let geplant = false;
function setze(){
  blick = halte(blick);
  welt.setAttribute('transform', `translate(${blick.mx - blick.x * blick.s} ${blick.my - blick.y * blick.s}) scale(${blick.s})`);
  if(!geplant){ geplant = true; requestAnimationFrame(() => { geplant = false; lesbar(); zeigeMinikarte(); }); }
}
/* Schrift nur, wo sie lesbar ist: nicht kleiner als 11 Pixel, nicht größer als 44 */
function lesbar(){
  const s = blick.s, x0 = blick.x - blick.mx / s, y0 = blick.y - blick.my / s, x1 = x0 + W / s, y1 = y0 + H / s;
  for(const k of alle){
    if(!k.text) continue;
    const da = k.x + k.r > x0 && k.x - k.r < x1 && k.y + k.r > y0 && k.y - k.r < y1;
    const px = k.r * s * (blattArt(k) ? (k.fs || 0.22) : k.fs);
    const gabel = ['ort', 'bereich', 'varianten', 'gespraeche', 'zeit'].includes(k.art), an = da && px >= (k.art === 'ort' ? 16 : gabel ? 8.5 : blattArt(k) ? 8 : k.bild ? 9 : 10.5) && px <= (gabel ? 160 : 48);   // Orte und Bereiche tragen ihren Namen auch groß
    if(k.textAn !== an){ k.text.style.display = an ? '' : 'none'; if(k.menge) k.menge.style.display = an && px >= 14 ? '' : 'none'; k.textAn = an; }
    else if(an && k.menge) k.menge.style.display = px >= 14 ? '' : 'none';
    // ohne Schild bleibt das eigene Material, das den Namen seiner App trägt: der steht schon darüber
    k.klein = da && !an && (px < (k.bild ? 9 : 10.5) || k.art === 'ort') && !blattArt(k) && !(k.eigen && k.eltern && k.eltern.name === k.name) && (k.eltern === fokus || (k.eltern && k.eltern.eltern === fokus && k.r * s >= 7)) ? (k.eltern === fokus ? 2 : 1) : 0;
    // Schärfe nach Nähe (LOD): aus der Ferne ein kleines Bild, ab etwa 120 Bildpunkten Kreis ein scharfes
    if(k.bildEl && da && k.r * s >= 4){ const w = k.r * s * 2 * (devicePixelRatio || 1) > 260 ? 960 : 240;
      if(k.bildW < w || !k.bildW){ k.bildW = w; const url = `/lichtwerk/bild?w=${w}&pfad=${encodeURIComponent(k.bild)}`;
        if(!k.bildEl.getAttribute('href')) k.bildEl.setAttribute('href', url);
        else { const vor = new Image(); vor.onload = () => k.bildEl.setAttribute('href', url); vor.src = url; } } }   // das scharfe erst zeigen, wenn es da ist
    if(k.kacheln && da && k.r * s >= 4){ const w = k.r * s * (devicePixelRatio || 1) > 200 ? 960 : 240;
      for(const t of k.kacheln) if(t.w < w){ t.w = w; t.el.setAttribute('href', `/lichtwerk/bild?w=${w}&pfad=${encodeURIComponent(t.pfad)}`); } }
  }
  // Was auf dieser Stufe steht, bleibt nie namenlos: ist sein Kreis noch zu klein, steht der Name daneben
  const html = [], belegt = [], hart = [];   // hart: Kreise, in denen ein Name steht – darüber liegt nie ein Schild
  for(const k of alle) if(k.r * s > 3 && !blattArt(k) && k.art !== 'wurzel' && k.form && !k.form.classList.contains('fern')){ const sx = (k.x - blick.x) * s + blick.mx, sy = (k.y - blick.y) * s + blick.my, sr = k.r * s; belegt.push([sx - sr, sy - sr, sx + sr, sy + sr]); if(k.textAn) hart.push([sx - sr, sy - sr, sx + sr, sy + sr]); }
  const kreise = belegt.length;
  for(const k of alle.filter(q => q.klein).sort((a, b) => b.klein - a.klein || b.r - a.r)){   // erst die Stufe selbst, dann die nächste; die Größten zuerst
    const sx = (k.x - blick.x) * s + blick.mx, sy = (k.y - blick.y) * s + blick.my, sr = k.r * s, knapp = SCHMAL(), bw = Math.min(knapp ? 150 : 180, 16 + Math.max([...k.name].length * 8.4, knapp ? 0 : unterzeile(k).length * 6.8)), bh = (knapp ? 6 : 20) + 17 * Math.ceil([...k.name].length * 8.4 / (bw - 16));
    const lagen = [];
    for(const d of k.klein === 2 ? [2, 8] : [2, 6]) lagen.push(   // Schilder der Stufe darunter bleiben dicht an ihrem Kreis, sonst gehören sie scheinbar zu einem anderen[sx - bw / 2, sy + sr + d], [sx - bw / 2, sy - sr - d - bh], [sx + sr + d, sy - bh / 2], [sx - sr - d - bw, sy - bh / 2],
      [sx + sr * .7 + d, sy + sr * .7 + d], [sx - sr * .7 - d - bw, sy + sr * .7 + d], [sx + sr * .7 + d, sy - sr * .7 - d - bh], [sx - sr * .7 - d - bw, sy - sr * .7 - d - bh]);
    const imBild = ([x, y]) => x >= 6 && x + bw <= W - 6 && y >= oben() && y + bh <= H - unten() + 20;
    const frei = ([x, y]) => !belegt.some(q => x < q[2] && x + bw > q[0] && y < q[3] && y + bh > q[1]);
    // findet ein Schild keinen freien Platz, bleibt es weg, statt ein anderes zu verdecken; beim Hineinzoomen erscheint es
    // was auf dieser Stufe steht, bekommt immer seinen Namen: findet sich kein ganz freier Platz, darf das Schild über Ästen und kleinen Kreisen liegen, nie über einem anderen Schild
    const schildFrei = ([x, y]) => ![...belegt.slice(kreise), ...hart].some(q => x < q[2] && x + bw > q[0] && y < q[3] && y + bh > q[1]);
    // ein Ortsname steht immer da: ist keine Lage ganz frei, nimmt er die, die andere Schilder am wenigsten überdeckt
    const deckt = ([x, y]) => [...belegt.slice(kreise), ...hart].reduce((a, q) => a + Math.max(0, Math.min(x + bw, q[2]) - Math.max(x, q[0])) * Math.max(0, Math.min(y + bh, q[3]) - Math.max(y, q[1])), 0);
    const ortLage = ls => ls.find(schildFrei) || ls.reduce((b, p) => deckt(p) < deckt(b) ? p : b);
    // ein Ort trägt seinen Namen immer mitten im eigenen Kreis, nie daneben
    const l = k.art === 'ort' ? ortLage([[sx - bw / 2, sy - bh / 2], [sx - bw / 2, sy + sr + 2], [sx - bw / 2, sy - sr - bh - 2], [sx + sr + 4, sy - bh / 2], [sx - sr - 4 - bw, sy - bh / 2], [sx + sr * .7 + 4, sy - sr * .7 - bh - 2], [sx - sr * .7 - 4 - bw, sy - sr * .7 - bh - 2], [sx + sr * .7 + 4, sy + sr * .7 + 2], [sx - sr * .7 - 4 - bw, sy + sr * .7 + 2]]) : lagen.find(p => imBild(p) && frei(p)) || (k.klein === 2 ? lagen.slice(0, 8).find(p => imBild(p) && schildFrei(p)) : null); if(!l) continue;   // Ersatzplatz nur direkt am eigenen Kreis
    belegt.push([l[0], l[1], l[0] + bw, l[1] + bh]);
    html.push(`<div class="nm${k.art === 'ort' ? ' ortname' : ''}" data-nr="${k.nr}" style="left:${l[0]}px;top:${l[1]}px;width:${bw}px"><b>${esc(k.name)}</b>${knapp ? '' : `<span>${esc(unterzeile(k))}</span>`}</div>`);
  }
  namenEl.innerHTML = html.join('');
}
function gesagt(t){
  return esc(t.replace(/^#\s.*$/m, '').replace(/^---\s*$/gm, '').replace(/^```.*$/gm, '')).split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p => {
    p = p.replace(/\*\*(Du|ChatGPT|Claude|Assistant|User):\*\*/, (m, w) => `<b class="${w === 'Du' || w === 'User' ? 'du' : 'ki'}">${w === 'User' ? 'Du' : w}</b> `)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^#{1,6}\s+(.*)$/gm, '<b class="zwischen">$1</b>').replace(/`([^`]+)`/g, '$1').replace(/\n/g, '<br>');
    return `<p>${p}</p>`; }).join('');
}

function fahre(nach, dauer = 800, fertig = null){
  const von = {...blick}, t0 = performance.now(), ls0 = Math.log(von.s), ls1 = Math.log(nach.s);
  ziel = nach;
  const schritt = now => { if(ziel !== nach) return;
    const t = Math.min(1, (now - t0) / dauer), e = t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    blick = {x: von.x + (nach.x - von.x) * e, y: von.y + (nach.y - von.y) * e, s: Math.exp(ls0 + (ls1 - ls0) * e), mx: von.mx + (nach.mx - von.mx) * e, my: von.my + (nach.my - von.my) * e};
    setze(); if(t < 1) requestAnimationFrame(schritt); else { ziel = null; if(fertig) fertig(); } };
  requestAnimationFrame(schritt);
}

/* ---------- Stufen ---------- */
const unterhalb = (k, f) => { for(let q = k; q; q = q.eltern) if(q === f) return true; return false; };
function geh(k, sanft = true, {baum = false} = {}){
  if(!k) return;
  if(blattArt(k)){ waehle(k); oeffne(k); return; }
  // ein Tipp öffnet: eine App mit belegter Adresse läuft, ein Werk mit nur einer Fassung zeigt gleich ihren Text
  if(!baum && k.adresse){ fokus = k; karte(k); pfad(k); oeffne(k); return; }
  if(!baum && k.art === 'werk' && k.kinder && k.kinder.length === 1 && blattArt(k.kinder[0])){ geh(k.kinder[0]); return; }
  fokus = k; gewaehlt && gewaehlt.form.classList.remove('gewaehlt'); gewaehlt = null;
  // nichts wird ausgeblendet (Ralf, 09.11.: „dieses Ausblenden bestimmter Äste macht es noch lächerlicher“)
  const p = passend(k); sanft ? fahre(p) : (blick = p, setze());
  karte(k); pfad(k); lesbar();
  const teile = []; for(let q = k; q; q = q.eltern) teile.unshift(q.name);
  history.replaceState(null, '', '#' + teile.slice(1).map(encodeURIComponent).join('/'));
}
function blattBlick(f){   // ein Blatt so nah, dass es den Schirm füllt und man darin lesen kann
  const cx = f.x + Math.cos(f.dir) * f.r * 0.25, cy = f.y + Math.sin(f.dir) * f.r * 0.25, bh = H - oben() - 12, bw = W - 16;
  const s = Math.min(bw / (f.r * 1.25), bh / (f.r * 1.55));
  return halte({x: cx, y: cy, s, mx: W / 2, my: oben() + bh / 2});
}
function waehle(f, fahren = true){
  gewaehlt && gewaehlt.form.classList.remove('gewaehlt');
  gewaehlt = f; f.form.classList.add('gewaehlt');
  if(fokus !== f.eltern){ fokus = f.eltern; pfad(f.eltern); }
  tu(f);
  if(f.art === 'gespraech'){
    $('.karte-name').textContent = f.name;
    const an = []; for(let q = f.eltern; q; q = q.eltern) if(q.art === 'app' || q.art === 'ort' || q.art === 'bereich'){ an.push(q.name); break; }
    $('.karte-menge').textContent = `Gespräch · ${zahlWort(f)}${an.length ? ' · an ' + an[0] : ''}`;
    $('.karte-auch').textContent = '';
    hoch(f.eltern, 'hinaus');
    return;
  }
  $('.karte-name').textContent = f.name;
  $('.karte-menge').textContent = `Fassung in „${f.werk}“ · ${zeichenWort(f.zeichen)} · ${f.datiert ? zeitWort(f) : 'Zeit nicht belegt'}`;
  $('.karte-auch').textContent = '';
  hoch(f.eltern, 'zum Werk');
}
function karte(k){
  $('.karte-name').textContent = k.art === 'wurzel' ? 'Ralfs Werke' : k.name;
  const teile = k.art === 'wurzel' ? [`${k.kinder.length} Orte`, `${k.fassungen} Fassungen`, zeichenWort(k.zeichen)] : [zahlWort(k), k.zeichen ? zeichenWort(k.zeichen) : '', zeitWort(k)].filter(Boolean);
  if(k.art === 'werk' && k.eigen) teile.unshift('eigenes Material der App');
  $('.karte-menge').textContent = teile.join(' · ');
  const ort = (() => { for(let q = k; q; q = q.eltern) if(q.art === 'ort') return q.name; })();
  const auch = (k.auch || []).filter(o => o !== ort);
  $('.karte-auch').textContent = auch.length ? 'dasselbe Werk auch in ' + auch.join(' · ') : '';
  hoch(k.eltern, 'eine Stufe hinaus');
  tu(k);
}
/* Was man mit dem Gewählten tun kann, steht als Knopf auf der Karte */
function tu(k){ const b = $('.tu'); b.hidden = !kannAuf(k);
  b.textContent = blattArt(k) ? (k.art === 'gespraech' ? 'Gespräch lesen' : 'Text lesen') : 'App öffnen';
  b.onclick = () => oeffne(k); }
function hoch(k, satz){ const b = $('.hoch'); b.hidden = !k; b.onclick = () => { if(offenK) schliesse(); k && geh(k, true, {baum: true}); }; b.querySelector('.hoch-satz').textContent = satz; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const kuerze = (s, n) => [...s].length > n ? [...s].slice(0, n - 1).join('').trimEnd() + '…' : s;
function pfad(k){
  const nav = $('.pfad'); nav.textContent = '';
  const kette = []; for(let q = k; q; q = q.eltern) kette.unshift(q);
  kette.forEach((q, i) => { if(i){ const t = document.createElement('i'); t.textContent = '›'; nav.appendChild(t); }
    const b = document.createElement('button'); b.type = 'button'; b.textContent = kuerze(q.name, 24); b.onclick = () => { if(offenK) schliesse(); geh(q, true, {baum: true}); }; nav.appendChild(b); });
}

/* ---------- Der Kreis wird Inhalt (Ralf, 09.11.: „man kann nichts anklicken, es öffnet sich nichts … zu keinen Apps,
   nicht zu Texten“). Ein Tipp fährt in den Kreis, und der Kreis wächst über den ganzen Schirm: eine Fassung oder ein
   Gespräch wird die Leseseite, eine App mit belegter Adresse wird die laufende App. „Zurück in den Baum“, Esc oder
   über das Ende hinaus weiterblättern lässt den Inhalt wieder in seinen Kreis schrumpfen, an derselben Stelle. */
const inhaltEl = document.createElement('section'); inhaltEl.id = 'inhalt'; inhaltEl.hidden = true; document.body.appendChild(inhaltEl);
let offenK = null, fassungen = new Map(), adressen = [], adresseJeWerk = new Map();
const nennbar = t => String(t || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '');
function adresseVon(k){
  for(const id of k.ids || []) if(adresseJeWerk.has(id)) return adresseJeWerk.get(id);   // belegt über das Werk selbst
  const n = nennbar(k.name); if(!n) return null;
  return adressen.find(a => nennbar(a.name) === n || (a.auch || []).some(x => nennbar(x) === n)) || null;
}
const lesbarArt = k => blattArt(k);
const kannAuf = k => lesbarArt(k) || !!k.adresse;
function kreisAmSchirm(k){
  const blatt = blattArt(k), cx = blatt ? k.x + Math.cos(k.dir) * k.r * 0.25 : k.x, cy = blatt ? k.y + Math.sin(k.dir) * k.r * 0.25 : k.y;
  return {x: (cx - blick.x) * blick.s + blick.mx, y: (cy - blick.y) * blick.s + blick.my, r: k.r * (blatt ? 0.82 : 1) * blick.s};
}
function nahBlick(k){
  const blatt = blattArt(k), cx = blatt ? k.x + Math.cos(k.dir) * k.r * 0.25 : k.x, cy = blatt ? k.y + Math.sin(k.dir) * k.r * 0.25 : k.y;
  return halte({x: cx, y: cy, s: Math.min(W, H) * 0.36 / k.r, mx: W / 2, my: H / 2});
}
const geschwister = k => { let w = k.eltern; while(w && !['werk', 'gespraeche', 'app', 'varianten'].includes(w.art)) w = w.eltern;
  const l = []; const lauf = q => blattArt(q) ? l.push(q) : (q.kinder || []).forEach(lauf); lauf(w || k.eltern || k); return l; };
function oeffne(k){
  if(!kannAuf(k)) return;
  if(offenK){ fuelle(k); return; }
  fahre(nahBlick(k), 600, () => wachse(k));
}
function wachse(k){
  fuelle(k);
  const c = kreisAmSchirm(k), weit = Math.hypot(Math.max(c.x, W - c.x), Math.max(c.y, H - c.y)) + 20;
  inhaltEl.hidden = false; inhaltEl.style.transition = 'none'; inhaltEl.style.clipPath = `circle(${Math.max(8, c.r)}px at ${c.x}px ${c.y}px)`;
  inhaltEl.getBoundingClientRect();
  inhaltEl.style.transition = ''; inhaltEl.style.clipPath = `circle(${weit}px at ${c.x}px ${c.y}px)`;
  document.body.classList.add('inhalt-offen');
}
function schliesse(){
  if(!offenK) return;
  const k = offenK; offenK = null;
  blick = nahBlick(k); setze();
  const c = kreisAmSchirm(k);
  inhaltEl.style.clipPath = `circle(${Math.max(8, c.r)}px at ${c.x}px ${c.y}px)`;
  document.body.classList.remove('inhalt-offen');
  setTimeout(() => { if(!offenK){ inhaltEl.hidden = true; inhaltEl.innerHTML = ''; } }, 520);
  if(blattArt(k)) waehle(k, false); else geh(k, true, {baum: true});
}
const woSatz = k => { const l = []; for(let q = k.eltern; q && q.art !== 'wurzel'; q = q.eltern) if(!['zeit', 'buendel', 'buendel-fassung', 'gespraeche'].includes(q.art) && q.name !== l[0]) l.unshift(q.name); return l.slice(-3).join(' › '); };
function fuelle(k){
  offenK = k; inhaltEl.dataset.art = blattArt(k) ? 'lesen' : 'app';
  if(blattArt(k)){
    const reihe = geschwister(k), i = reihe.indexOf(k), vor = reihe[i - 1], nach = reihe[i + 1];
    const art = k.art === 'gespraech' ? 'Gespräch' : 'Fassung', wann = k.art === 'gespraech' ? zahlWort(k) : (k.datiert ? zeitWort(k) : 'Zeit nicht belegt');
    const bilder = (k.bilder || []).slice(0, 4).map(b => `<img src="/lichtwerk/bild?w=960&pfad=${encodeURIComponent(b.pfad)}" alt="${esc(b.text || k.name)}" loading="lazy">`).join('');
    inhaltEl.innerHTML = `<div class="leiste"><button type="button" class="zurueck">← zurück in den Baum</button><span class="wo">${esc(woSatz(k))}</span>
      <span class="blaettern">${vor ? `<button type="button" class="vor" title="${esc(vor.name)}">‹ früher</button>` : ''}${reihe.length > 1 ? `<i>${i + 1} von ${reihe.length}</i>` : ''}${nach ? `<button type="button" class="nach" title="${esc(nach.name)}">später ›</button>` : ''}</span></div>
      <article class="seite"><p class="art">${art}${k.werk ? ' in „' + esc(k.werk) + '“' : ''} · ${esc(wann)}${k.zeichen ? ' · ' + esc(zeichenWort(k.zeichen)) : ''}</p>
      <h1>${esc(k.name)}</h1>${bilder ? `<div class="bilder">${bilder}</div>` : ''}<div class="text">…</div>
      <p class="ende">${nach ? `<button type="button" class="nach">Weiter: ${esc(kuerze(nach.name, 40))} ›</button>` : ''}<button type="button" class="zurueck">← zurück in den Baum</button></p></article>`;
    const fuell = t => { const d = inhaltEl.querySelector('.text'); if(d && offenK === k) d.innerHTML = gesagt(t); };
    if(k.art === 'gespraech'){
      fetch('/lichtwerk/gespraech?n=' + k.nr).then(r => r.ok ? r.json() : null).then(j => fuell(j ? j.text : 'Dieses Gespräch ist gerade nicht lesbar.')).catch(() => fuell('Dieses Gespräch ist gerade nicht lesbar.'));
    } else { const v = fassungen.get(k.schluessel) || {}, d = inhaltEl.querySelector('.text'), t = (v.content || '').trim();
      const quelle = t.startsWith('{') ? (() => { try { const j = JSON.parse(t); return j && j.format === 'moonfingers.app-source.v1' ? j : null; } catch { return null; } })() : null;
      if(quelle) d.innerHTML = quellText(quelle);
      else fuell(t || (v.notes || '').trim() || 'Diese Fassung hat keinen Text, nur ihre Angaben.'); }
    inhaltEl.querySelectorAll('.vor').forEach(b => b.onclick = () => blaettere(vor));
    inhaltEl.querySelectorAll('.nach').forEach(b => b.onclick = () => blaettere(nach));
    waehle(k, false);
  } else {
    const a = k.adresse;
    inhaltEl.innerHTML = `<div class="leiste"><button type="button" class="zurueck">← zurück in den Baum</button><b class="titel">${esc(k.name)}</b>
      ${k.kinder && k.kinder.length ? `<button type="button" class="innen">Werke und Fassungen</button>` : ''}<a class="draussen" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">in eigenem Fenster ↗</a></div>
      ${a.einbetten ? `<iframe src="${esc(a.url)}" title="${esc(k.name)}" referrerpolicy="no-referrer" allow="fullscreen; autoplay; clipboard-write"></iframe>`
        : `<div class="nichtein"><p>${esc(k.name)} lässt sich nicht hier im Baum zeigen, die Seite erlaubt kein Einbetten.</p><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(k.name)} in eigenem Fenster öffnen ↗</a></div>`}`;
    const innen = inhaltEl.querySelector('.innen'); if(innen) innen.onclick = () => { const q = k; schliesse(); setTimeout(() => geh(q, true, {baum: true}), 0); };
    fokus = k; pfad(k); karte(k);
  }
  inhaltEl.querySelectorAll('.zurueck').forEach(b => b.onclick = schliesse);
  const seite = inhaltEl.querySelector('.seite'); if(seite) seite.scrollTop = 0;
}
/* Eine App-Fassung aus dem Code (moonfingers.app-source.v1): erst die Zusammenfassung als Text, dann jede gelesene
   Datei als aufklappbarer Abschnitt mit ihrem Code. Der Speicherort bleibt in den Daten, sichtbar ist nur der Dateiname. */
function quellText(j){
  const teile = (j.sections || []).map((t, i) => `<details${i ? '' : ' open'}><summary>${esc(t.title || 'Abschnitt')}${t.truncated ? ' <i>(gekürzt)</i>' : ''}</summary><pre><code>${esc(t.content || '')}</code></pre></details>`).join('');
  return `${gesagt(j.summary || '')}${j.scope ? `<p class="umfang">${esc(j.scope)}</p>` : ''}${teile}`;
}
function blaettere(k){ if(!k) return; blick = nahBlick(k); setze(); fuelle(k); }
// wie überall im Baum führt das Rad nach unten hinaus: erst durch den ganzen Text, an seinem Ende zurück in den Baum
let ueberEnde = 0;
inhaltEl.addEventListener('wheel', e => { const t = e.target.closest('.seite'); if(!t) return;
  if(e.ctrlKey && e.deltaY > 0){ e.preventDefault(); schliesse(); return; }
  const ende = t.scrollTop + t.clientHeight >= t.scrollHeight - 2;
  if(ende && e.deltaY > 0){ ueberEnde += e.deltaY; if(ueberEnde > 600){ ueberEnde = 0; schliesse(); } } else ueberEnde = 0; }, {passive: false});

/* ---------- Minikarte: der ganze Baum klein, darin der Ausschnitt, den man gerade sieht ---------- */
const mini = document.createElementNS(NS, 'svg'); mini.id = 'minikarte'; mini.setAttribute('role', 'navigation'); mini.setAttribute('aria-label', 'Übersicht: der ganze Baum');
let miniRahmen = null, miniOrte = [];
function baueMinikarte(){
  const bx = wurzelKnoten.box, x0 = Math.min(bx[0], -wurzelBreit), x1 = Math.max(bx[2], wurzelBreit), y0 = bx[1], y1 = wurzelTief, rand = (x1 - x0) * 0.03;
  mini.setAttribute('viewBox', `${x0 - rand} ${y0 - rand} ${x1 - x0 + 2 * rand} ${y1 - y0 + 2 * rand}`);
  mini.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const g = el('g', {}, mini);
  for(const k of alle) if(k.ast && ['wurzel', 'ort', 'bereich'].includes(k.art)) el('path', {d: k.ast.getAttribute('d'), class: 'mast'}, g);
  for(const k of alle) if(k.art === 'ort' || k.art === 'bereich'){ const c = el('circle', {cx: k.x, cy: k.y, r: Math.max(k.r, (x1 - x0) * 0.012), class: 'mort'}, g); miniOrte.push([k, c]); }
  miniRahmen = el('rect', {class: 'mrahmen'}, mini);
  document.body.appendChild(mini);
  mini.addEventListener('click', e => {
    const p = mini.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const w = p.matrixTransform(mini.getScreenCTM().inverse());
    let best = null, d = Infinity;
    for(const [k] of miniOrte){ const b = k.box, drin = w.x >= b[0] && w.x <= b[2] && w.y >= b[1] && w.y <= b[3] + k.r * 3, a = Math.hypot(w.x - k.x, w.y - k.y);
      if(drin && a < d){ d = a; best = k; } }
    if(offenK) schliesse();
    geh(best || wurzelKnoten, true, {baum: true});
  });
}
function zeigeMinikarte(){
  if(!miniRahmen) return;
  const s = blick.s, x0 = blick.x - blick.mx / s, y0 = blick.y - blick.my / s;
  Object.entries({x: x0, y: y0, width: W / s, height: H / s}).forEach(([a, v]) => miniRahmen.setAttribute(a, v));
  const ort = (() => { for(let q = fokus; q; q = q.eltern) if(q.art === 'ort' || q.art === 'bereich') return q; })();
  for(const [k, c] of miniOrte) c.classList.toggle('hier', k === ort);
  mini.classList.toggle('ganz', !fokus || fokus.art === 'wurzel');
  document.body.classList.toggle('mit-mini', !!fokus && fokus.art !== 'wurzel');
}

/* ---------- Bedienung: tippen, ziehen, Rad, zwei Finger ---------- */
const zeiger = new Map(); let zug = null, bewegt = false, getippt = null;
svg.addEventListener('pointerdown', e => { getippt = e.target.closest('[data-nr]'); svg.setPointerCapture(e.pointerId); zeiger.set(e.pointerId, [e.clientX, e.clientY]); bewegt = false; ziel = null;
  zug = {blick: {...blick}, punkte: new Map(zeiger)}; });
const bewege = e => { if(!zeiger.has(e.pointerId)) return; zeiger.set(e.pointerId, [e.clientX, e.clientY]);
  const a = [...zug.punkte.values()], b = [...zeiger.values()]; if(a.length !== b.length){ zug = {blick: {...blick}, punkte: new Map(zeiger)}; return; }
  const mitte = l => [l.reduce((s, p) => s + p[0], 0) / l.length, l.reduce((s, p) => s + p[1], 0) / l.length];
  const abst = l => l.length > 1 ? Math.hypot(l[0][0] - l[1][0], l[0][1] - l[1][1]) : 1;
  const [ax, ay] = mitte(a), [bx, by] = mitte(b), f = abst(b) / abst(a);
  if(Math.hypot(bx - ax, by - ay) > 6 || Math.abs(f - 1) > .03) bewegt = true;
  if(!bewegt) return; svg.classList.add('zieht');
  const z = zug.blick, s = z.s * f, wx = z.x + (ax - z.mx) / z.s, wy = z.y + (ay - z.my) / z.s;
  blick = {s, mx: z.mx, my: z.my, x: wx - (bx - z.mx) / s, y: wy - (by - z.my) / s}; setze(); };
svg.addEventListener('pointermove', bewege);
const los = e => { zeiger.delete(e.pointerId); svg.classList.remove('zieht'); if(zeiger.size) zug = {blick: {...blick}, punkte: new Map(zeiger)};
  else if(!bewegt && getippt) geh(alle[+getippt.dataset.nr]); };
svg.addEventListener('pointerup', los); svg.addEventListener('pointercancel', e => { zeiger.delete(e.pointerId); });
const radeln = e => { e.preventDefault(); ziel = null; const f = Math.exp(-e.deltaY * 0.002);
  const wx = blick.x + (e.clientX - blick.mx) / blick.s, wy = blick.y + (e.clientY - blick.my) / blick.s, s = blick.s * f;
  blick = {...blick, s, x: wx - (e.clientX - blick.mx) / s, y: wy - (e.clientY - blick.my) / s}; setze(); };
svg.addEventListener('wheel', radeln, {passive: false});
namenEl.addEventListener('click', e => { const t = e.target.closest('[data-nr]'); if(t) geh(alle[+t.dataset.nr]); });
addEventListener('keydown', e => { if(e.key !== 'Escape') return; if(offenK) schliesse(); else if(fokus && fokus.eltern) geh(fokus.eltern, true, {baum: true}); });
addEventListener('resize', () => { W = innerWidth; H = innerHeight; if(wurzelKnoten){ vollbild(); } if(fokus){ blick = passend(fokus); setze(); } });

/* ---------- Dasselbe Werk in jeder Ansicht ---------- */
let werkNamen = new Map();
function werkName(k){ for(let q = k; q; q = q.eltern) if(q.ids && q.ids.length === 1 && werkNamen.has(q.ids[0])) return werkNamen.get(q.ids[0]); return null; }
function werkKnoten(name){ const id = [...werkNamen].find(([, n]) => n === name)?.[0]; if(!id) return null;
  const da = alle.filter(k => !blattArt(k) && k.ids && k.ids.includes(id));
  return da.find(k => k.ids.length === 1 && k.art === 'werk') || da.find(k => k.ids.length === 1) || da[0] || null; }

/* ---------- Laden ---------- */
(async () => {
  try {
    const [graph, bilder, gespraeche, apps] = await Promise.all([fetch('/api/graph').then(r => r.json()), fetch('/lichtwerk/bilder').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch('/lichtwerk/gespraeche').then(r => r.ok ? r.json() : []).catch(() => []), fetch('/stufen-apps.json').then(r => r.ok ? r.json() : {apps: []}).catch(() => ({apps: []}))]);
    fassungen = new Map((graph.variants || []).map(v => [v.id, v])); adressen = apps.bekannt || apps.apps || [];
    adresseJeWerk = new Map((apps.werke || []).map(w => [w.werk, w]));
    { const B = bestand(graph), nm = lesbareNamen(B.monde); werkNamen = new Map(B.monde.map((m, i) => [m.id, nm[i]])); }
    const baum = spiralbaum(graph, bilder, gespraeche);
    pflanze(baum);
    for(const k of alle) if(!blattArt(k) && ['app', 'werk', 'ort', 'bereich'].includes(k.art)){ const a = adresseVon(k); if(a) k.adresse = a; }
    umrisse(); zeichne(); wurzelKnoten = baum; for(const k of alle) if(k.r && (k.art === 'fassung' || k.art === 'gespraech')) kleinstesBlatt = Math.min(kleinstesBlatt, k.r); vollbild();
    $('#lade').hidden = true; baueMinikarte();
    leiste(document.querySelector('.ansichten'), 'baum', () => werkName(offenK || gewaehlt || fokus));
    const finde = () => { const w = werkAus(location.hash); if(w) return werkKnoten(w) || baum; let k = baum; for(const t of location.hash.slice(1).split('/').filter(Boolean).map(decodeURIComponent)){ const n = (k.kinder || []).find(c => c.name === t); if(!n) break; k = n; } return k; };
    geh(finde(), false, {baum: true});
    addEventListener('hashchange', () => { if(!offenK) geh(finde(), true, {baum: true}); });
  } catch(err){ $('#lade').textContent = 'Der Fundus ist gerade nicht erreichbar.'; console.error(err); }
})();
