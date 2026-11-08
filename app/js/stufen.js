/* Der Spiralbaum als Baum (Ralf, 08.11.2026: „Der Baum muss all die Äste tragen mit ihren immer kleineren
   Verästelungen“ – kein gedrehter Ast).

   Ein Stamm trägt alle Orte. Er gabelt sich, jede Gabel teilt die Menge in zwei etwa gleiche Hälften, bis jeder
   Ast einen Ort trägt. Hinter jedem Ort wächst seine eigene Krone nach demselben Gesetz: Apps, dahinter Werke,
   an den Spitzen die Fassungen als Blätter. Dieselbe Gabel auf jeder Stufe, nur kleiner: fraktal.
   Man zoomt stufenlos hinein; Namen stehen in den Kreisen und wachsen mit, sichtbar erst, wenn sie lesbar sind. */

import {spiralbaum, zahlWort, zeichenWort, zeitWort} from './stufen-daten.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = s => document.querySelector(s);
const namenEl = $('#namen'), svg = $('#baum'), welt = svg.querySelector('.welt'), aesteG = svg.querySelector('.aeste'), knotenG = svg.querySelector('.knoten');

/* ---------- Wuchs ----------
   Von innen nach außen: jede Krone wird zuerst ganz gebaut und weiß dann, wie viel Platz sie braucht (ihr Umkreis).
   An einer Gabel werden zwei Kronen so weit auseinander gesetzt, dass ihre Umkreise sich nicht berühren; der Ast
   dorthin ist so lang, wie die Krone groß ist. So wächst nichts in Fremdes, und jeder Ast ist ein verkleinerter Baum. */
const alle = [], aeste = [];          // aeste: [Polygonpunkte, Besitzer]
const groesse = w => 0.9 * Math.pow(Math.max(w, 1), 0.35);   // Kreis eines Dings aus seiner Menge
const BREIT = 0.26;                   // Astdicke je Kreisgröße der getragenen Menge
const SPREIZ = 1.1;                   // Öffnung einer Gabel
const ROLLT = 3;                      // so wenige Geschwister rollen sich an der Spitze ein
const OBEN = -Math.PI / 2;
const DICK = 0.055;
const KRONE = 3.4;                    // Kronenhalbmesser je Kreishalbmesser                   // Astdicke je Kronenhalbmesser

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
  if(k.art === 'fassung'){ const r = groesse(k.wert) * 0.8; return verbinde([], [{typ: 'blatt', k, x: 0, y: -r, r, dir: OBEN}]); }
  if(!(k.kinder && k.kinder.length)){ const r = groesse(k.wert); return verbinde([], [{typ: 'kreis', k, x: 0, y: -r, r}]); }
  // der Kreis wächst mit seiner Krone, damit er sie tragen kann und sein Name hineinpasst
  // wie beim Vorbild: die Krone bekommt die Größe, die ihrer Menge zusteht, egal wie viele Teile sie hat;
  // so wird alles Tiefere von selbst immer kleiner
  const r = groesse(k.wert), kreis = {typ: 'kreis', k, x: 0, y: -r, r};
  const K = krone(k.kinder, seite, k, null);
  dreh(K, 0, 0, 0, KRONE * r / K.h.R);
  let hoch = 2 * r; const unten = {cx: 0, cy: -r, R: r};
  for(let i = 0; i < 60 && stossen(unten, ID, K.h, {c: 1, s: 0, tx: 0, ty: -hoch}, 0); i++) hoch += r * 0.12;
  dreh(K, 0, 0, -hoch);
  return verbinde([K], [kreis]);
}
const teil = (l, seite, eltern) => l.length === 1 ? ding(l[0], seite) : krone(l, seite, eltern, null);
const menge = l => l.reduce((s, k) => s + k.wert, 0);

/* Eine Krone: Geschwister teilen sich an Gabeln, an der Spitze rollt sich der Ast ein */
function krone(reihe, seite, eltern, meide){
  if(reihe.length === 1) return gabelung([{G: ding(reihe[0], seite), th: 0, m: reihe[0].wert, wem: reihe[0]}], meide, eltern);
  const rollt = reihe.every(k => k.art === 'fassung') || (reihe.length <= ROLLT && eltern.art !== 'wurzel');
  let A, B, thA, thB, sA, sB;
  if(rollt){ A = reihe.slice(0, 1); B = reihe.slice(1); thA = -seite * 1.0; thB = seite * 0.38; sA = -seite; sB = seite; }
  else {
    const gw = k => Math.sqrt(k.wert), ganz = reihe.reduce((s, k) => s + gw(k), 0); let i = 1, acc = gw(reihe[0]);
    while(i < reihe.length - 1 && Math.abs(acc + gw(reihe[i]) - ganz / 2) < Math.abs(acc - ganz / 2)) acc += gw(reihe[i++]);
    const a = acc / ganz; A = reihe.slice(0, i); B = reihe.slice(i);
    thA = -SPREIZ * (0.25 + 0.75 * (1 - a)); thB = SPREIZ * (0.25 + 0.75 * a); sA = -1; sB = 1;
  }
  return gabelung([{G: teil(A, sA, eltern), th: thA, m: menge(A), wem: A.length === 1 ? A[0] : eltern},
                   {G: teil(B, sB, eltern), th: thB, m: menge(B), wem: B.length === 1 ? B[0] : eltern}], meide, eltern);
}

/* Die Gabel: Äste so lang machen, bis die Kronen einander, die Äste und den Kreis darunter nicht berühren */
function gabelung(teile, meide, wem){
  const breite = t => Math.max(BREIT * groesse(t.m), DICK * t.G.h.R);   // ein Ast ist so dick, wie seine Krone groß ist
  const lage = (t, lam) => { const l = Math.max(lam * t.G.h.R, breite(t) * 2), a = t.th * 0.6, bx = Math.sin(a) * l, by = -Math.cos(a) * l;
    const T = {c: Math.cos(t.th), s: Math.sin(t.th), tx: bx, ty: by};
    const ast = {typ: 'ast', pts: kurve([bx, by], OBEN, OBEN + t.th, l), w0: breite(t) * 1.12, w1: breite(t) * 0.92, wem: t.wem};
    const stiel = formKreise(ast).slice(1);
    return {l, bx, by, T, ast, stiel: stiel.length ? umkreis(stiel) : null};
  };
  // jeder Ast hat seine eigene Länge: wer anstößt, rückt hinaus; stoßen beide Kronen, rücken beide
  const lam = teile.map(() => 0.3); let L;
  for(let i = 0; i < 120; i++){
    L = teile.map((t, j) => lage(t, lam[j])); const luft = 0.04 * Math.min(...teile.map(t => t.G.h.R));
    const weiter = teile.map(() => false);
    if(L.length === 2){
      if(stossen(teile[0].G.h, L[0].T, teile[1].G.h, L[1].T, luft)){ weiter[0] = weiter[1] = true; }
      else {
        if(L[0].stiel && stossen(L[0].stiel, ID, teile[1].G.h, L[1].T, luft)) weiter[1] = true;
        if(L[1].stiel && stossen(L[1].stiel, ID, teile[0].G.h, L[0].T, luft)) weiter[0] = true;
      }
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
function pflanze(baum){
  const K = krone(baum.kinder, 1, baum, null), wg = DICK * K.h.R, T = K.h.R * 0.36;
  dreh(K, 0, 0, -T);
  const formen = [...K.formen,
    {typ: 'ast', stamm: true, pts: [[0, 0], [-wg * 0.25, -T * 0.35], [wg * 0.2, -T * 0.7], [0, -T]], w0: wg * 2.6, w1: wg * 1.05, wem: baum},
    {typ: 'knoten', x: 0, y: -T, r: wg * 0.53, wem: baum}];
  for(const sx of [-1, 1]) formen.push({typ: 'ast', pts: [[sx * wg * 0.3, -T * 0.08], [sx * wg * 0.9, -T * 0.02], [sx * wg * 1.4, T * 0.005], [sx * wg * 1.9, T * 0.01]], w0: wg * 0.55, w1: wg * 0.08, wem: baum});
  Object.assign(baum, {x: 0, y: 0, r: 0});
  for(const f of formen){
    if(f.typ === 'ast') aeste.push([gleichsinnig(band(f)), f.wem]);
    else if(f.typ === 'knoten') aeste.push([gleichsinnig(rund(f.x, f.y, f.r)), f.wem]);
    else Object.assign(f.k, {x: f.x, y: f.y, r: f.r, dir: f.dir});
  }
  const ordne = (k, eltern) => { Object.assign(k, {eltern, nr: alle.length, tiefe: eltern ? eltern.tiefe + 1 : 0}); alle.push(k); for(const c of k.kinder || []) ordne(c, k); };
  ordne(baum, null);
}

/* Umriss jedes Teilbaums, für das Hineinfahren */
function umrisse(){
  for(const k of alle) k.box = k.r ? [k.x - k.r * 1.6, k.y - k.r * 1.6, k.x + k.r * 1.6, k.y + k.r * 1.6] : [Infinity, Infinity, -Infinity, -Infinity];
  for(const [pts, wem] of aeste) if(wem && wem.box) for(const [x, y] of pts){ const b = wem.box; if(x < b[0]) b[0] = x; if(y < b[1]) b[1] = y; if(x > b[2]) b[2] = x; if(y > b[3]) b[3] = y; }
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
  const woerter = name.split(/\s+/), z = [];
  for(const w of woerter){ const l = z.length ? z[z.length - 1] : null;
    if(l !== null && (l + ' ' + w).length <= proZeile) z[z.length - 1] = l + ' ' + w; else z.push(w); }
  if(z.length > hoechstens){ z.length = hoechstens; z[hoechstens - 1] = z[hoechstens - 1].replace(/.?$/, '…'); }
  return z;
}
function zeichne(){
  // Je Ding ein Pfad für seine Äste, damit Fremdes beim Hineinzoomen zurücktreten kann
  const je = new Map(); for(const [p, wem] of aeste){ if(!je.has(wem)) je.set(wem, []); je.get(wem).push('M' + p.map(q => q[0].toFixed(3) + ' ' + q[1].toFixed(3)).join('L') + 'Z'); }
  for(const [wem, d] of je) wem.ast = el('path', {class: 'ast', d: d.join('')}, aesteG);
  for(const k of alle){
    if(k.art === 'wurzel') continue;
    if(k.art === 'fassung'){
      const g = el('g', {class: 'blatt ' + (k.datiert ? 'belegt' : 'offen'), 'data-nr': k.nr}, knotenG);
      el('path', {d: blattPfad(k), 'stroke-width': k.r * 0.06}, g);
      const t = el('text', {x: k.x, y: k.y, 'font-size': k.r * 0.22, class: 'name'}, g);
      zeilen(k.name, 14, 3).forEach((z, i, l) => el('tspan', {x: k.x, dy: i ? '1.15em' : `${-(l.length - 1) * 0.575}em`}, t).textContent = z);
      k.text = t; k.form = g; continue;
    }
    const g = el('g', {class: `kn ${k.art}${k.auch && k.auch.length > 1 ? ' verschraenkt' : ''}`, 'data-nr': k.nr}, knotenG);
    el('circle', {cx: k.x, cy: k.y, r: k.r, 'stroke-width': k.r * 0.06}, g);
    const zl = zeilen(k.name, 11, 3), fs = Math.min(k.r * 0.27, k.r * 1.75 / (0.62 * Math.max(...zl.map(z => [...z].length)))); k.fs = fs / k.r;
    const t = el('text', {x: k.x, y: k.y - (zl.length - 1) * fs * 0.58 - fs * 0.35, 'font-size': fs, class: 'name'}, g);
    zl.forEach((z, i) => el('tspan', {x: k.x, dy: i ? '1.15em' : 0}, t).textContent = z);
    const m = el('text', {x: k.x, y: k.y + (zl.length) * fs * 0.58 + fs * 0.25, 'font-size': fs * 0.52, class: 'menge'}, g);
    el('tspan', {x: k.x, dy: 0}, m).textContent = zahlWort(k);
    el('tspan', {x: k.x, dy: '1.2em'}, m).textContent = zeichenWort(k.zeichen);
    k.text = t; k.menge = m; k.form = g;
  }
}

/* ---------- Blick ---------- */
let W = innerWidth, H = innerHeight, blick = {x: 0, y: 0, s: 1, mx: W / 2, my: H / 2}, ziel = null, fokus = null, gewaehlt = null;
const SCHMAL = () => W < 600;
const oben = () => 56, unten = () => (SCHMAL() ? 130 : 110);
function passend(k){
  const [x0, y0, x1, y1] = k.box, bw = W - 24, bh = H - oben() - unten();
  const s = Math.min(bw / (x1 - x0), bh / (y1 - y0)) * 0.96;
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, s, mx: W / 2, my: oben() + bh / 2};
}
let geplant = false;
function setze(){
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
    const an = da && px >= 10.5 && px <= 48;
    if(k.textAn !== an){ k.text.style.display = an ? '' : 'none'; if(k.menge) k.menge.style.display = an && px >= 14 ? '' : 'none'; k.textAn = an; }
    else if(an && k.menge) k.menge.style.display = px >= 14 ? '' : 'none';
    k.klein = da && !an && px < 10.5 && k.eltern === fokus && k.art !== 'fassung';
  }
  // Was auf dieser Stufe steht, bleibt nie namenlos: ist sein Kreis noch zu klein, steht der Name daneben
  const html = [], belegt = [];
  for(const k of alle) if((k.eltern === fokus || k === fokus) && k.r * s > 4 && k.art !== 'fassung'){ const sx = (k.x - blick.x) * s + blick.mx, sy = (k.y - blick.y) * s + blick.my, sr = k.r * s; belegt.push([sx - sr, sy - sr, sx + sr, sy + sr]); }
  for(const k of alle.filter(q => q.klein).sort((a, b) => b.r - a.r)){   // die Größten zuerst
    const sx = (k.x - blick.x) * s + blick.mx, sy = (k.y - blick.y) * s + blick.my, sr = k.r * s, knapp = SCHMAL(), bw = Math.min(knapp ? 150 : 180, 16 + Math.max([...k.name].length * 8.4, knapp ? 0 : zeichenWort(k.zeichen).length * 6.8)), bh = (knapp ? 6 : 20) + 17 * Math.ceil([...k.name].length * 8.4 / (bw - 16));
    const lagen = [];
    for(const d of [2, 14, 30, 50]) lagen.push([sx - bw / 2, sy + sr + d], [sx - bw / 2, sy - sr - d - bh], [sx + sr + d, sy - bh / 2], [sx - sr - d - bw, sy - bh / 2],
      [sx + sr * .7 + d, sy + sr * .7 + d], [sx - sr * .7 - d - bw, sy + sr * .7 + d], [sx + sr * .7 + d, sy - sr * .7 - d - bh], [sx - sr * .7 - d - bw, sy - sr * .7 - d - bh]);
    const imBild = ([x, y]) => x >= 6 && x + bw <= W - 6 && y >= oben() && y + bh <= H - unten() + 20;
    const frei = ([x, y]) => !belegt.some(q => x < q[2] && x + bw > q[0] && y < q[3] && y + bh > q[1]);
    // findet ein Schild keinen freien Platz, bleibt es weg, statt ein anderes zu verdecken; beim Hineinzoomen erscheint es
    const l = lagen.find(p => imBild(p) && frei(p)); if(!l) continue;
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
addEventListener('resize', () => { W = innerWidth; H = innerHeight; if(fokus){ blick = passend(fokus); setze(); } });

/* ---------- Laden ---------- */
(async () => {
  try {
    const baum = spiralbaum(await (await fetch('/api/graph')).json());
    pflanze(baum);
    umrisse(); zeichne();
    $('#lade').hidden = true;
    const finde = () => { let k = baum; for(const t of location.hash.slice(1).split('/').filter(Boolean).map(decodeURIComponent)){ const n = (k.kinder || []).find(c => c.name === t); if(!n) break; k = n; } return k; };
    geh(finde(), false);
    addEventListener('hashchange', () => geh(finde()));
  } catch(err){ $('#lade').textContent = 'Der Fundus ist gerade nicht erreichbar.'; console.error(err); }
})();
