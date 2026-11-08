/* Der Spiralbaum als Baum (Ralf, 08.11.2026: „Der Baum muss all die Äste tragen mit ihren immer kleineren
   Verästelungen“ – kein gedrehter Ast).

   Ein Stamm trägt alle Orte. Er gabelt sich, jede Gabel teilt die Menge in zwei etwa gleiche Hälften, bis jeder
   Ast einen Ort trägt. Hinter jedem Ort wächst seine eigene Krone nach demselben Gesetz: Apps, dahinter Werke,
   an den Spitzen die Fassungen als Blätter. Dieselbe Gabel auf jeder Stufe, nur kleiner: fraktal.
   Man zoomt stufenlos hinein; Namen stehen in den Kreisen und wachsen mit, sichtbar erst, wenn sie lesbar sind. */

import {spiralbaum, zahlWort, zeichenWort, zeitWort} from './stufen-daten.js';

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
const BREIT = 0.26;                   // Astdicke je Kreisgröße der getragenen Menge
const SPREIZ = 1.1;                   // Öffnung einer Gabel
const ROLLT = 5;                      // so wenige Geschwister rollen sich an der Spitze ein
const OBEN = -Math.PI / 2;
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
  if(k.art === 'fassung'){ const r = groesse(k.wert) * (k.bild ? 1.5 : 0.8); return verbinde([], [{typ: 'blatt', k, x: 0, y: -r, r, dir: OBEN}]); }
  if(!(k.kinder && k.kinder.length)){ const r = groesse(k.wert) * (k.bild ? 1.7 : 1); return verbinde([], [{typ: 'kreis', k, x: 0, y: -r, r}]); }
  // der Kreis wächst mit seiner Krone, damit er sie tragen kann und sein Name hineinpasst
  // wie beim Vorbild: die Krone bekommt die Größe, die ihrer Menge zusteht, egal wie viele Teile sie hat;
  // so wird alles Tiefere von selbst immer kleiner
  // ein Ort ist nur die Gabel, an der seine Apps hängen: sein Kreis bleibt klein, die Krone bekommt den Platz
  // die Dinge mit Bild (Apps, Werke) tragen große Kreise, damit ihre Bilder schon von weitem zu sehen sind
  const R = groesse(k.wert), r = R * (k.art === 'ort' || k.art === 'bereich' || k.art === 'varianten' ? 0.8 : k.bild ? 1.7 : 1), kreis = {typ: 'kreis', k, x: 0, y: -r, r};
  const K = krone(k.kinder, seite, k, null);
  dreh(K, 0, 0, 0, KRONE * R / K.h.R);
  let hoch = 2 * r; const unten = {cx: 0, cy: -r, R: r};
  for(let i = 0; i < 60 && stossen(unten, ID, K.h, {c: 1, s: 0, tx: 0, ty: -hoch}, 0); i++) hoch += r * 0.12;
  dreh(K, 0, 0, -hoch);
  return verbinde([K], [kreis]);
}
const teil = (l, seite, eltern) => l.length === 1 ? ding(l[0], seite) : krone(l, seite, eltern, null);
const menge = l => l.reduce((s, k) => s + k.wert, 0);

/* Eine Krone: Geschwister teilen sich an Gabeln, an der Spitze rollt sich der Ast ein */
/* Ralf, 08.11.: was mehrere Fassungen hat, bekommt einen eigenen Ast, auf dem sie gezeigt werden. Die Fassungen eines
   Werks hängen nebeneinander an einem Zweig, abwechselnd links und rechts, die früheste unten, die jüngste an der Spitze. */
function zweig(reihe, seite, eltern){
  const blaetter = reihe.filter(k => k.art === 'fassung'), rest = reihe.filter(k => k.art !== 'fassung');
  const rs = blaetter.map(k => groesse(k.wert) * (k.bild ? 1.5 : 0.8)), rmax = Math.max(...rs), schritt = rmax * 1.05;
  const prims = [];
  let y = -rmax * 0.6;
  blaetter.forEach((k, i) => {
    const letzt = i === blaetter.length - 1 && !rest.length, s = (i % 2 ? 1 : -1) * seite;
    const dir = letzt ? OBEN : OBEN + s * 0.95, r = rs[i];
    prims.push({typ: 'blatt', k, x: Math.cos(dir) * r, y: y + Math.sin(dir) * r, r, dir});
    if(!letzt) y -= schritt;
  });
  const L = -y, gs = [];
  for(const b of rest){ const G = ding(b, seite); dreh(G, 0, 0, -L); gs.push(G); }
  const ast = {typ: 'ast', pts: [[0, 0], [seite * rmax * 0.15, -L * 0.35], [-seite * rmax * 0.15, -L * 0.7], [0, -L]], w0: rmax * 0.32, w1: rmax * 0.1, wem: eltern};
  return verbinde(gs, [ast, ...prims]);
}

function krone(reihe, seite, eltern, meide){
  if(reihe.length > 1 && eltern.art !== 'buendel-fassung' && reihe.every(k => k.art === 'fassung' || k.art === 'buendel-fassung')) return zweig(reihe, seite, eltern);
  if(reihe.length === 1) return gabelung([{G: ding(reihe[0], seite), th: 0, m: reihe[0].wert, wem: reihe[0]}], meide, eltern);
  if(FAECHER && eltern.art === 'wurzel'){   // am Stamm die Orte, an einem Ort seine Apps: alle auf einmal aufgefächert, wie die Hauptäste einer breiten Krone
    const n = reihe.length, weit = Math.min(1.35, 0.32 * (n - 1));
    return gabelung(reihe.map((k, i) => ({G: ding(k, i < (n - 1) / 2 ? -1 : 1), th: n === 1 ? 0 : -weit + 2 * weit * i / (n - 1), m: k.wert, wem: k})), meide, eltern);
  }
  const rollt = reihe.every(k => k.art === 'fassung') || (reihe.length <= ROLLT && eltern.art !== 'wurzel');
  let A, B, thA, thB, sA, sB;
  if(rollt){ A = reihe.slice(0, 1); B = reihe.slice(1); thA = -seite * 1.1; thB = seite * 0.62; sA = -seite; sB = seite; }
  else {
    const gw = k => Math.sqrt(k.wert), ganz = reihe.reduce((s, k) => s + gw(k), 0); let i = 1, acc = gw(reihe[0]);
    while(i < reihe.length - 1 && Math.abs(acc + gw(reihe[i]) - ganz / 2) < Math.abs(acc - ganz / 2)) acc += gw(reihe[i++]);
    const a = acc / ganz; A = reihe.slice(0, i); B = reihe.slice(i);
    const sp = eltern.art === 'wurzel' ? 1.45 : SPREIZ;   // am Stamm öffnen sich die Gabeln weit: so steht die Krone breit und der Stamm bleibt kurz
    thA = -sp * (0.25 + 0.75 * (1 - a)); thB = sp * (0.25 + 0.75 * a); sA = -1; sB = 1;
  }
  return gabelung([{G: teil(A, sA, eltern), th: thA, m: menge(A), wem: A.length === 1 ? A[0] : eltern},
                   {G: teil(B, sB, eltern), th: thB, m: menge(B), wem: B.length === 1 ? B[0] : eltern}], meide, eltern);
}

/* Die Gabel: Äste so lang machen, bis die Kronen einander, die Äste und den Kreis darunter nicht berühren */
function gabelung(teile, meide, wem){
  const breite = t => Math.max(BREIT * groesse(t.m), DICK * t.G.h.R);   // ein Ast ist so dick, wie seine Krone groß ist
  const lage = (t, lam) => { const l = Math.max(lam * t.G.h.R, breite(t) * 2), a = t.th * 0.6, bx = Math.sin(a) * l, by = -Math.cos(a) * l;
    const T = {c: Math.cos(t.th), s: Math.sin(t.th), tx: bx, ty: by};
    const ast = {typ: 'ast', pts: kurve([bx, by], OBEN, OBEN + t.th, l), w0: breite(t) * 1.12, w1: breite(t) * 0.92, wem: t.wem, zu: t.wem !== wem};   // zu: der Ast, der zu einem Ding hinführt
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
  return verbinde(teile.map(t => t.G), [...L.map(l => l.ast), {typ: 'knoten', x: 0, y: 0, r: Math.max(...L.map(l => l.ast.w0)) * 0.56, wem}]);
}

/* Formen in Zeichenflächen: Äste als sich verjüngende Bänder, Knoten als runde Gelenke */
function bezier(P, t){ const u = 1 - t; return [0, 1].map(i => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]); }
function band(f){
  const n = 18, L = [], R = [];
  for(let i = 0; i <= n; i++){
    const t = i / n, [x, y] = bezier(f.pts, t), [xa, ya] = bezier(f.pts, Math.max(0, t - 0.01)), [xb, yb] = bezier(f.pts, Math.min(1, t + 0.01));
    const d = Math.hypot(xb - xa, yb - ya) || 1, nx = -(yb - ya) / d, ny = (xb - xa) / d;
    const b = (f.stamm ? f.w1 + (f.w0 - f.w1) * Math.pow(1 - t, 3) : f.w0 + (f.w1 - f.w0) * t) / 2;
    L.push([x + nx * b, y + ny * b]); R.push([x - nx * b, y - ny * b]);
  }
  return L.concat(R.reverse());
}
const rund = (x, y, r) => Array.from({length: 16}, (_, i) => [x + Math.cos(i * Math.PI / 8) * r, y + Math.sin(i * Math.PI / 8) * r]);

// alle Flächen im selben Drehsinn, sonst stanzen sich überlappende Äste gegenseitig Löcher
const gleichsinnig = P => { let a = 0; for(let i = 0; i < P.length; i++){ const [x0, y0] = P[i], [x1, y1] = P[(i + 1) % P.length]; a += x0 * y1 - x1 * y0; } return a < 0 ? P.reverse() : P; };
/* Boden und Wurzeln (Ralf, 08.11.: „eine tiefe Verästelung bis in den Boden … wirklich in die Breite … nicht auf einem
   geraden Boden, sondern auf einem gewölbten … ein ganz flacher Bogen, auf dem der Baum steht“). Der Boden ist ein Kreis,
   dessen Scheitel am Fuß des Stamms liegt; die Wurzeln gabeln sich wie die Krone, nur nach unten und weit zur Seite. */
let BOGEN = 1, wurzelTief = 0, wurzelBreit = 0;
const wurzelFormen = [];
const bodenY = x => BOGEN - Math.sqrt(Math.max(0, BOGEN * BOGEN - x * x));
function wurzle(K, wg){
  const R = K.h.R; BOGEN = R * 9;   // extrem flach, aber ein Bogen
  let saat = 7; const zufall = () => (saat = (saat * 16807) % 2147483647) / 2147483647;
  const unten = Math.PI / 2;
  const wachse = (x, y, dir, len, w, stufe) => {
    let ex = x + Math.cos(dir) * len, ey = y + Math.sin(dir) * len;
    const min = bodenY(ex) + R * 0.012; if(ey < min) ey = min;   // eine Wurzel bleibt unter der Erde
    const knick = (zufall() - 0.5) * 0.5, d2 = Math.atan2(ey - y, ex - x) + knick;
    wurzelFormen.push({typ: 'ast', pts: [[x, y], [x + Math.cos(dir) * len * 0.4, y + Math.sin(dir) * len * 0.4], [ex - Math.cos(d2) * len * 0.35, ey - Math.sin(d2) * len * 0.35], [ex, ey]], w0: w, w1: w * 0.62});
    wurzelTief = Math.max(wurzelTief, ey); wurzelBreit = Math.max(wurzelBreit, Math.abs(ex));
    if(stufe <= 0) return;
    const spr = 0.3 + zufall() * 0.25, zieh = (unten - d2) * 0.06;   // die Erde zieht die Wurzel leicht nach unten
    wachse(ex, ey, d2 - spr + zieh, len * (0.62 + zufall() * 0.12), w * 0.6, stufe - 1);
    wachse(ex, ey, d2 + spr + zieh, len * (0.62 + zufall() * 0.12), w * 0.6, stufe - 1);
  };
  // Hauptwurzeln: die äußeren fast waagrecht und lang, damit das Wurzelwerk so breit wird wie die Krone
  for(const [a, l, w] of [[-1.47, 0.4, 0.95], [1.46, 0.42, 0.95], [-1.1, 0.24, 0.8], [1.12, 0.25, 0.8], [-0.55, 0.15, 0.7], [0.6, 0.15, 0.7], [0.05, 0.12, 0.65]])
    wachse(a * wg * 0.5, wg * 0.15, unten + a, R * l, wg * w, 5);
  // das Wurzelwerk geht mehr in die Breite als in die Tiefe: flach gedrückt, aber nie über die Erde
  const FLACH = 0.55;
  for(const f of wurzelFormen) f.pts = f.pts.map(([x, y]) => [x, Math.max(bodenY(x) + R * 0.008, y * FLACH)]);
  wurzelTief = Math.max(...wurzelFormen.flatMap(f => f.pts.map(p => p[1])));
}

function pflanze(baum){
  const K = krone(baum.kinder, 1, baum, null), wg = DICK * K.h.R;
  // der Stamm ist kurz (Ralf: „der Baumstamm ist zu lang“), aber lang genug, dass keine Krone in den Boden hängt
  let tief = 0; for(const f of K.formen) tief = Math.max(tief, f.typ === 'ast' ? Math.max(...f.pts.map(p => p[1])) + f.w0 : f.y + f.r);
  const T = Math.max(K.h.R * 0.07, tief + K.h.R * 0.03);
  dreh(K, 0, 0, -T);
  const formen = [...K.formen,
    {typ: 'ast', stamm: true, pts: [[0, 0], [-wg * 0.25, -T * 0.35], [wg * 0.2, -T * 0.7], [0, -T]], w0: wg * 2.6, w1: wg * 1.05, wem: baum},
    {typ: 'knoten', x: 0, y: -T, r: wg * 0.53, wem: baum}];
  wurzle(K, wg);
  Object.assign(baum, {x: 0, y: 0, r: 0});
  for(const f of formen){
    if(f.typ === 'ast') aeste.push([gleichsinnig(band(f)), f.wem, f.zu]);
    else if(f.typ === 'knoten') aeste.push([gleichsinnig(rund(f.x, f.y, f.r)), f.wem]);
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
function blattPfad(c){
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
function zeichne(){
  // Je Ding ein Pfad für seine Äste, damit Fremdes beim Hineinzoomen zurücktreten kann
  const je = new Map(); for(const [p, wem] of aeste){ if(!je.has(wem)) je.set(wem, []); je.get(wem).push('M' + p.map(q => q[0].toFixed(3) + ' ' + q[1].toFixed(3)).join('L') + 'Z'); }
  el('circle', {class: 'boden', cx: 0, cy: BOGEN, r: BOGEN}, aesteG);   // der Boden: ein ganz flacher Bogen, auf dem der Baum steht
  el('path', {class: 'wurzelwerk', d: wurzelFormen.map(f => 'M' + gleichsinnig(band(f)).map(q => q[0].toFixed(3) + ' ' + q[1].toFixed(3)).join('L') + 'Z').join('')}, aesteG);
  for(const [wem, d] of je) wem.ast = el('path', {class: 'ast', d: d.join('')}, aesteG);
  for(const k of alle){
    if(k.art === 'wurzel') continue;
    if(k.art === 'fassung'){
      const g = el('g', {class: 'blatt ' + (k.datiert ? 'belegt' : 'offen'), 'data-nr': k.nr}, knotenG);
      el('path', {d: blattPfad(k), 'stroke-width': k.r * 0.06}, g);
      if(k.bild){   // die Fassung zeigt ihr eigenes Bild in der Blattform
        const c = el('clipPath', {id: 'rund' + k.nr}, defs); el('path', {d: blattPfad(k)}, c);
        const mx = k.x + Math.cos(k.dir) * k.r * 0.25, my = k.y + Math.sin(k.dir) * k.r * 0.25, h = k.r * 1.3;
        k.bildEl = el('image', {x: mx - h, y: my - h, width: 2 * h, height: 2 * h, preserveAspectRatio: k.bildHoch > 1.25 ? 'xMidYMin slice' : 'xMidYMid slice', 'clip-path': `url(#rund${k.nr})`, class: 'bild'}, g);
        const sch = el('path', {d: blattPfad(k), class: 'schleier'}, g);
        k.bildEl.addEventListener('error', () => { k.bildEl.remove(); sch.remove(); k.bildEl = null; });
        g.classList.add('mitbild');
      }
      const t = el('text', {x: k.x, y: k.y, 'font-size': k.r * 0.22, class: 'name'}, g);
      zeilen(k.name, 14, 3).forEach((z, i, l) => el('tspan', {x: k.x, dy: i ? '1.15em' : `${-(l.length - 1) * 0.575}em`}, t).textContent = z);
      k.text = t; k.form = g; continue;
    }
    const g = el('g', {class: `kn ${k.art}${k.auch && k.auch.length > 1 ? ' verschraenkt' : ''}${k.bild ? ' mitbild' : ''}`, 'data-nr': k.nr}, knotenG);
    el('circle', {cx: k.x, cy: k.y, r: k.r, 'stroke-width': k.r * 0.06}, g);
    if(k.bild){   // ein rundes Bild aus dem Fundus; geladen erst, wenn der Kreis groß genug zu sehen ist
      const c = el('clipPath', {id: 'rund' + k.nr}, defs); el('circle', {cx: k.x, cy: k.y, r: k.r * 0.97}, c);
      k.bildEl = el('image', {x: k.x - k.r, y: k.y - k.r, width: 2 * k.r, height: 2 * k.r, preserveAspectRatio: k.bildHoch > 1.25 ? 'xMidYMin slice' : 'xMidYMid slice', 'clip-path': `url(#rund${k.nr})`, class: 'bild'}, g);
      const schleier = el('circle', {cx: k.x, cy: k.y, r: k.r * 0.97, class: 'schleier'}, g);   // ein leichter Schatten, damit der Name auf dem Bild lesbar bleibt
      k.bildEl.addEventListener('error', () => { k.bildEl.remove(); schleier.remove(); k.bildEl = null; g.classList.remove('mitbild'); });   // kein Bild da: der Kreis bleibt schlicht
    }
    const zl = zeilen(k.name, 11, 3), fs = Math.min(k.r * (k.art === 'ort' || k.art === 'bereich' ? 0.36 : 0.27), k.r * 1.75 / (0.62 * Math.max(...zl.map(z => [...z].length)))); k.fs = fs / k.r;
    const t = el('text', {x: k.x, y: k.y - (zl.length - 1) * fs * 0.58 - fs * 0.35, 'font-size': fs, class: 'name'}, g);
    zl.forEach((z, i) => el('tspan', {x: k.x, dy: i ? '1.15em' : 0}, t).textContent = z);
    const m = el('text', {x: k.x, y: k.y + (zl.length) * fs * 0.58 + fs * 0.25, 'font-size': fs * 0.52, class: 'menge'}, g);
    el('tspan', {x: k.x, dy: 0}, m).textContent = zahlWort(k);
    el('tspan', {x: k.x, dy: '1.2em'}, m).textContent = zeichenWort(k.zeichen);
    k.text = t; k.menge = m; k.form = g;
  }
}

/* ---------- Blick ---------- */
let wurzelKnoten = null, W = innerWidth, H = innerHeight, blick = {x: 0, y: 0, s: 1, mx: W / 2, my: H / 2}, ziel = null, fokus = null, gewaehlt = null;
const SCHMAL = () => W < 600;
const oben = () => 56, unten = () => (SCHMAL() ? 130 : 110);
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
function halte(b){
  if(!grenze) return b;
  const s = Math.max(b.s, grenze.s), x = Math.min(Math.max(b.x, grenze.x0 + b.mx / s), grenze.x1 - (W - b.mx) / s);
  const y = Math.min(Math.max(b.y, grenze.y0 + b.my / s), grenze.y1 - (H - b.my) / s);
  return {...b, s, x, y};
}
function passend(k){
  if(k.art === 'wurzel') return vollbild();
  // eine Stufe zeigt ihre Krone: was darüber wächst, und vom eigenen Kreis nur den oberen Rand als Fuß
  const kids = (k.kinder || []).filter(c => c.box && isFinite(c.box[0]));
  const [x0, y0, x1, y1] = kids.length ? kids.reduce((b, c) => [Math.min(b[0], c.box[0]), Math.min(b[1], c.box[1]), Math.max(b[2], c.box[2]), Math.max(b[3], c.box[3])],
    [k.x - k.r * 0.6, k.y - k.r * 0.4, k.x + k.r * 0.6, k.y - k.r * 0.4]) : k.box, bw = W - 24, bh = H - oben() - unten();
  const s = Math.min(bw / (x1 - x0), bh / (y1 - y0)) * 0.96;
  return halte({x: (x0 + x1) / 2, y: (y0 + y1) / 2, s, mx: W / 2, my: oben() + bh / 2});
}
let geplant = false;
function setze(){
  blick = halte(blick);
  welt.setAttribute('transform', `translate(${blick.mx - blick.x * blick.s} ${blick.my - blick.y * blick.s}) scale(${blick.s})`);
  if(!geplant){ geplant = true; requestAnimationFrame(() => { geplant = false; lesbar(); }); }
}
/* Schrift nur, wo sie lesbar ist: nicht kleiner als 11 Pixel, nicht größer als 44 */
function lesbar(){
  const s = blick.s, x0 = blick.x - blick.mx / s, y0 = blick.y - blick.my / s, x1 = x0 + W / s, y1 = y0 + H / s;
  for(const k of alle){
    if(!k.text) continue;
    const da = k.x + k.r > x0 && k.x - k.r < x1 && k.y + k.r > y0 && k.y - k.r < y1;
    const px = k.r * s * (k.art === 'fassung' ? 0.22 : k.fs);
    const gabel = k.art === 'ort' || k.art === 'bereich' || k.art === 'varianten', an = da && px >= (gabel ? 8.5 : 10.5) && px <= (gabel ? 160 : 48);   // Orte und Bereiche tragen ihren Namen auch groß
    if(k.textAn !== an){ k.text.style.display = an ? '' : 'none'; if(k.menge) k.menge.style.display = an && px >= 14 ? '' : 'none'; k.textAn = an; }
    else if(an && k.menge) k.menge.style.display = px >= 14 ? '' : 'none';
    // ohne Schild bleibt das eigene Material, das den Namen seiner App trägt: der steht schon darüber
    k.klein = da && !an && px < 10.5 && k.art !== 'fassung' && !(k.eigen && k.eltern && k.eltern.name === k.name) && (k.eltern === fokus || (k.eltern && k.eltern.eltern === fokus && k.r * s >= 7)) ? (k.eltern === fokus ? 2 : 1) : 0;
    // Schärfe nach Nähe (LOD): aus der Ferne ein kleines Bild, ab etwa 120 Bildpunkten Kreis ein scharfes
    if(k.bildEl && da && k.r * s >= 4){ const w = k.r * s * 2 * (devicePixelRatio || 1) > 260 ? 960 : 240;
      if(k.bildW < w || !k.bildW){ k.bildW = w; const url = `/lichtwerk/bild?w=${w}&pfad=${encodeURIComponent(k.bild)}`;
        if(!k.bildEl.getAttribute('href')) k.bildEl.setAttribute('href', url);
        else { const vor = new Image(); vor.onload = () => k.bildEl.setAttribute('href', url); vor.src = url; } } }   // das scharfe erst zeigen, wenn es da ist
  }
  // Was auf dieser Stufe steht, bleibt nie namenlos: ist sein Kreis noch zu klein, steht der Name daneben
  const html = [], belegt = [], hart = [];   // hart: Kreise, in denen ein Name steht – darüber liegt nie ein Schild
  for(const k of alle) if(k.r * s > 3 && k.art !== 'fassung' && k.art !== 'wurzel' && k.form && !k.form.classList.contains('fern')){ const sx = (k.x - blick.x) * s + blick.mx, sy = (k.y - blick.y) * s + blick.my, sr = k.r * s; belegt.push([sx - sr, sy - sr, sx + sr, sy + sr]); if(k.textAn) hart.push([sx - sr, sy - sr, sx + sr, sy + sr]); }
  const kreise = belegt.length;
  for(const k of alle.filter(q => q.klein).sort((a, b) => b.klein - a.klein || b.r - a.r)){   // erst die Stufe selbst, dann die nächste; die Größten zuerst
    const sx = (k.x - blick.x) * s + blick.mx, sy = (k.y - blick.y) * s + blick.my, sr = k.r * s, knapp = SCHMAL(), bw = Math.min(knapp ? 150 : 180, 16 + Math.max([...k.name].length * 8.4, knapp ? 0 : zeichenWort(k.zeichen).length * 6.8)), bh = (knapp ? 6 : 20) + 17 * Math.ceil([...k.name].length * 8.4 / (bw - 16));
    const lagen = [];
    for(const d of k.klein === 2 ? [2, 10, 22, 36] : [2, 7]) lagen.push(   // Schilder der Stufe darunter bleiben dicht an ihrem Kreis, sonst gehören sie scheinbar zu einem anderen[sx - bw / 2, sy + sr + d], [sx - bw / 2, sy - sr - d - bh], [sx + sr + d, sy - bh / 2], [sx - sr - d - bw, sy - bh / 2],
      [sx + sr * .7 + d, sy + sr * .7 + d], [sx - sr * .7 - d - bw, sy + sr * .7 + d], [sx + sr * .7 + d, sy - sr * .7 - d - bh], [sx - sr * .7 - d - bw, sy - sr * .7 - d - bh]);
    const imBild = ([x, y]) => x >= 6 && x + bw <= W - 6 && y >= oben() && y + bh <= H - unten() + 20;
    const frei = ([x, y]) => !belegt.some(q => x < q[2] && x + bw > q[0] && y < q[3] && y + bh > q[1]);
    // findet ein Schild keinen freien Platz, bleibt es weg, statt ein anderes zu verdecken; beim Hineinzoomen erscheint es
    // was auf dieser Stufe steht, bekommt immer seinen Namen: findet sich kein ganz freier Platz, darf das Schild über Ästen und kleinen Kreisen liegen, nie über einem anderen Schild
    const schildFrei = ([x, y]) => ![...belegt.slice(kreise), ...hart].some(q => x < q[2] && x + bw > q[0] && y < q[3] && y + bh > q[1]);
    const l = lagen.find(p => imBild(p) && frei(p)) || (k.klein === 2 ? lagen.find(p => imBild(p) && schildFrei(p)) : null); if(!l) continue;
    belegt.push([l[0], l[1], l[0] + bw, l[1] + bh]);
    html.push(`<div class="nm" data-nr="${k.nr}" style="left:${l[0]}px;top:${l[1]}px;width:${bw}px"><b>${esc(k.name)}</b>${knapp ? '' : `<span>${esc(zeichenWort(k.zeichen))}</span>`}</div>`);
  }
  namenEl.innerHTML = html.join('');
}
function fahre(nach, dauer = 800){
  const von = {...blick}, t0 = performance.now(), ls0 = Math.log(von.s), ls1 = Math.log(nach.s);
  ziel = nach;
  const schritt = now => { if(ziel !== nach) return;
    const t = Math.min(1, (now - t0) / dauer), e = t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    blick = {x: von.x + (nach.x - von.x) * e, y: von.y + (nach.y - von.y) * e, s: Math.exp(ls0 + (ls1 - ls0) * e), mx: von.mx + (nach.mx - von.mx) * e, my: von.my + (nach.my - von.my) * e};
    setze(); if(t < 1) requestAnimationFrame(schritt); else ziel = null; };
  requestAnimationFrame(schritt);
}

/* ---------- Stufen ---------- */
const unterhalb = (k, f) => { for(let q = k; q; q = q.eltern) if(q === f) return true; return false; };
function geh(k, sanft = true){
  if(k.art === 'fassung'){ waehle(k); return; }
  fokus = k; gewaehlt && gewaehlt.form.classList.remove('gewaehlt'); gewaehlt = null;
  for(const q of alle){ const fern = !unterhalb(q, k) && !unterhalb(k, q); q.form && q.form.classList.toggle('fern', fern); q.ast && q.ast.classList.toggle('fern', fern && q !== k.eltern); }
  const p = passend(k); sanft ? fahre(p) : (blick = p, setze());
  karte(k); pfad(k); lesbar();
  const teile = []; for(let q = k; q; q = q.eltern) teile.unshift(q.name);
  history.replaceState(null, '', '#' + teile.slice(1).map(encodeURIComponent).join('/'));
}
function waehle(f){
  gewaehlt && gewaehlt.form.classList.remove('gewaehlt');
  gewaehlt = f; f.form.classList.add('gewaehlt');
  if(fokus !== f.eltern){ fokus = f.eltern; pfad(f.eltern); }
  fahre(passend(f.eltern));
  $('.karte-name').textContent = f.name;
  $('.karte-menge').textContent = `Fassung in „${f.werk}“ · ${zeichenWort(f.zeichen)} · ${f.datiert ? zeitWort(f) : 'Zeit nicht belegt'}`;
  $('.karte-auch').textContent = '';
  hoch(f.eltern, 'zum Werk');
}
function karte(k){
  $('.karte-name').textContent = k.art === 'wurzel' ? 'Ralfs Werke' : k.name;
  const teile = k.art === 'wurzel' ? [`${k.kinder.length} Orte`, `${k.fassungen} Fassungen`, zeichenWort(k.zeichen)] : [zahlWort(k), zeichenWort(k.zeichen), zeitWort(k)];
  if(k.art === 'werk' && k.eigen) teile.unshift('eigenes Material der App');
  $('.karte-menge').textContent = teile.join(' · ');
  const ort = (() => { for(let q = k; q; q = q.eltern) if(q.art === 'ort') return q.name; })();
  const auch = (k.auch || []).filter(o => o !== ort);
  $('.karte-auch').textContent = auch.length ? 'dasselbe Werk auch in ' + auch.join(' · ') : '';
  hoch(k.eltern, 'eine Stufe hinaus');
}
function hoch(k, satz){ const b = $('.hoch'); b.hidden = !k; b.onclick = () => k && geh(k); b.querySelector('.hoch-satz').textContent = satz; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const kuerze = (s, n) => [...s].length > n ? [...s].slice(0, n - 1).join('').trimEnd() + '…' : s;
function pfad(k){
  const nav = $('.pfad'); nav.textContent = '';
  const kette = []; for(let q = k; q; q = q.eltern) kette.unshift(q);
  kette.forEach((q, i) => { if(i){ const t = document.createElement('i'); t.textContent = '›'; nav.appendChild(t); }
    const b = document.createElement('button'); b.type = 'button'; b.textContent = kuerze(q.name, 24); b.onclick = () => geh(q); nav.appendChild(b); });
}

/* ---------- Bedienung: tippen, ziehen, Rad, zwei Finger ---------- */
const zeiger = new Map(); let zug = null, bewegt = false, getippt = null;
svg.addEventListener('pointerdown', e => { getippt = e.target.closest('[data-nr]'); svg.setPointerCapture(e.pointerId); zeiger.set(e.pointerId, [e.clientX, e.clientY]); bewegt = false; ziel = null;
  zug = {blick: {...blick}, punkte: new Map(zeiger)}; });
svg.addEventListener('pointermove', e => { if(!zeiger.has(e.pointerId)) return; zeiger.set(e.pointerId, [e.clientX, e.clientY]);
  const a = [...zug.punkte.values()], b = [...zeiger.values()]; if(a.length !== b.length){ zug = {blick: {...blick}, punkte: new Map(zeiger)}; return; }
  const mitte = l => [l.reduce((s, p) => s + p[0], 0) / l.length, l.reduce((s, p) => s + p[1], 0) / l.length];
  const abst = l => l.length > 1 ? Math.hypot(l[0][0] - l[1][0], l[0][1] - l[1][1]) : 1;
  const [ax, ay] = mitte(a), [bx, by] = mitte(b), f = abst(b) / abst(a);
  if(Math.hypot(bx - ax, by - ay) > 6 || Math.abs(f - 1) > .03) bewegt = true;
  if(!bewegt) return; svg.classList.add('zieht');
  const z = zug.blick, s = z.s * f, wx = z.x + (ax - z.mx) / z.s, wy = z.y + (ay - z.my) / z.s;
  blick = {s, mx: z.mx, my: z.my, x: wx - (bx - z.mx) / s, y: wy - (by - z.my) / s}; setze(); });
const los = e => { zeiger.delete(e.pointerId); svg.classList.remove('zieht'); if(zeiger.size) zug = {blick: {...blick}, punkte: new Map(zeiger)};
  else if(!bewegt && getippt) geh(alle[+getippt.dataset.nr]); };
svg.addEventListener('pointerup', los); svg.addEventListener('pointercancel', e => { zeiger.delete(e.pointerId); });
svg.addEventListener('wheel', e => { e.preventDefault(); ziel = null; const f = Math.exp(-e.deltaY * 0.002);
  const wx = blick.x + (e.clientX - blick.mx) / blick.s, wy = blick.y + (e.clientY - blick.my) / blick.s, s = blick.s * f;
  blick = {...blick, s, x: wx - (e.clientX - blick.mx) / s, y: wy - (e.clientY - blick.my) / s}; setze(); }, {passive: false});
namenEl.addEventListener('click', e => { const t = e.target.closest('[data-nr]'); if(t) geh(alle[+t.dataset.nr]); });
addEventListener('keydown', e => { if(e.key === 'Escape' && fokus && fokus.eltern) geh(fokus.eltern); });
addEventListener('resize', () => { W = innerWidth; H = innerHeight; if(wurzelKnoten){ vollbild(); } if(fokus){ blick = passend(fokus); setze(); } });

/* ---------- Laden ---------- */
(async () => {
  try {
    const [graph, bilder] = await Promise.all([fetch('/api/graph').then(r => r.json()), fetch('/lichtwerk/bilder').then(r => r.ok ? r.json() : {}).catch(() => ({}))]);
    const baum = spiralbaum(graph, bilder);
    pflanze(baum);
    umrisse(); zeichne(); wurzelKnoten = baum; vollbild();
    $('#lade').hidden = true;
    const finde = () => { let k = baum; for(const t of location.hash.slice(1).split('/').filter(Boolean).map(decodeURIComponent)){ const n = (k.kinder || []).find(c => c.name === t); if(!n) break; k = n; } return k; };
    geh(finde(), false);
    addEventListener('hashchange', () => geh(finde()));
  } catch(err){ $('#lade').textContent = 'Der Fundus ist gerade nicht erreichbar.'; console.error(err); }
})();
