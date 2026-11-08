/* Der Spiralbaum, fraktal (Ralf, 08.11.2026: „Was hat das mit Fraktalität zu tun? Mit dem Vorbild?“).

   Jeder Ast rollt sich zu einer Spirale ein. Von ihr zweigen die Teile ab, das größte zuerst, und jedes Teil
   ist wieder derselbe Ast: es rollt sich ein, seine Teile zweigen ab, bis zu den Blättern. Dieselbe Form auf
   jeder Stufe, nur kleiner. Ein Werk rollt seine Fassungen in Zeitfolge auf, die früheste zuerst.
   Man zoomt stufenlos hinein; Namen stehen in den Kreisen und wachsen mit, sichtbar erst, wenn sie lesbar sind. */

import {spiralbaum, zahlWort, zeichenWort, zeitWort} from './stufen-daten.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = s => document.querySelector(s);
const namenEl = $('#namen'), svg = $('#baum'), welt = svg.querySelector('.welt'), aesteG = svg.querySelector('.aeste'), knotenG = svg.querySelector('.knoten');

/* ---------- Wuchs ---------- */
const alle = [], aeste = [];          // aeste: [Polygonpunkte, Besitzer]
const W0 = 0.1;                       // Astbreite je Länge
const anteil = s => 0.16 + 0.8 * Math.sqrt(s);

/* Ein Bogen von P in Richtung a, Länge l, Drehung t, Breite von b0 auf b1: ein gefülltes, sich verjüngendes Band */
function bogen(P, a, l, t, b0, b1, wem){
  const n = 10, L = [], R = []; let [x, y] = P, d = a;
  for(let i = 0; i <= n; i++){
    const b = (b0 + (b1 - b0) * i / n) / 2, nx = -Math.sin(d), ny = Math.cos(d);
    L.push([x + nx * b, y + ny * b]); R.push([x - nx * b, y - ny * b]);
    if(i < n){ x += Math.cos(d + t / n / 2) * l / n; y += Math.sin(d + t / n / 2) * l / n; d += t / n; }
  }
  aeste.push([L.concat(R.reverse()), wem]);
  return [[x, y], d];
}

// Gewicht im Bild: die Wurzel der Menge, damit Kleines sichtbar bleibt und Großes trotzdem größer ist
const gw = k => Math.sqrt(k.wert), gewicht = l => l.reduce((s, k) => s + gw(k), 0);

/* Eine Reihe Geschwister: das erste zweigt ab, der Rest rollt sich weiter ein */
function wachse(reihe, P, a, L, seite, eltern){
  if(!reihe.length) return;
  if(reihe.length === 1){ stiel(reihe[0], P, a, L, seite, eltern); return; }
  const ganz = gewicht(reihe), s0 = gw(reihe[0]) / ganz, l0 = L * anteil(s0), lr = L * anteil(1 - s0);
  const schritt = Math.max(L * 0.24, l0 * 1.05);
  const [Q, a2] = bogen(P, a, schritt, seite * Math.min(0.55, 1.5 * schritt / L), L * W0, lr * W0, eltern);
  stiel(reihe[0], Q, a2 - seite * 0.75, l0, -seite, eltern);
  wachse(reihe.slice(1), Q, a2 + seite * 0.1, lr, seite, eltern);
}

/* Ein Ding auf seinem Stiel: ein Kreis (Ort, App, Werk) oder ein Blatt (Fassung). Hinter dem Kreis wachsen seine Teile */
function stiel(k, P, a, L, seite, eltern){
  Object.assign(k, {eltern, nr: alle.length, tiefe: eltern ? eltern.tiefe + 1 : 0}); alle.push(k);
  const [Q, a2] = bogen(P, a, L * 0.42, seite * 0.3, L * W0, L * W0 * 0.8, k);
  if(k.art === 'fassung'){ Object.assign(k, {x: Q[0] + Math.cos(a2) * L * 0.2, y: Q[1] + Math.sin(a2) * L * 0.2, r: L * 0.2, dir: a2}); return; }
  const r = L * 0.4;
  Object.assign(k, {x: Q[0] + Math.cos(a2) * r, y: Q[1] + Math.sin(a2) * r, r, dir: a2});
  if(k.kinder && k.kinder.length) wachse(k.kinder, [Q[0] + Math.cos(a2) * 2 * r, Q[1] + Math.sin(a2) * 2 * r], a2 + seite * 0.25, L * 0.88, seite, k);
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
  for(const k of alle) if(k.klein){
    const sx = (k.x - blick.x) * s + blick.mx, sy = (k.y - blick.y) * s + blick.my, sr = k.r * s, bw = Math.min(180, 16 + Math.max([...k.name].length * 8.4, zeichenWort(k.zeichen).length * 6.8)), bh = 20 + 17 * Math.ceil([...k.name].length * 8.4 / (bw - 16));
    const lagen = [];
    for(const d of [2, 14, 30, 50]) lagen.push([sx - bw / 2, sy + sr + d], [sx - bw / 2, sy - sr - d - bh], [sx + sr + d, sy - bh / 2], [sx - sr - d - bw, sy - bh / 2],
      [sx + sr * .7 + d, sy + sr * .7 + d], [sx - sr * .7 - d - bw, sy + sr * .7 + d], [sx + sr * .7 + d, sy - sr * .7 - d - bh], [sx - sr * .7 - d - bw, sy - sr * .7 - d - bh]);
    const imBild = ([x, y]) => x >= 6 && x + bw <= W - 6 && y >= oben() && y + bh <= H - unten() + 20;
    const frei = ([x, y]) => !belegt.some(q => x < q[2] && x + bw > q[0] && y < q[3] && y + bh > q[1]);
    const l = lagen.find(p => imBild(p) && frei(p)) || lagen.find(imBild) || lagen[0];
    belegt.push([l[0], l[1], l[0] + bw, l[1] + bh]);
    html.push(`<div class="nm" data-nr="${k.nr}" style="left:${l[0]}px;top:${l[1]}px;width:${bw}px"><b>${esc(k.name)}</b><span>${esc(zeichenWort(k.zeichen))}</span></div>`);
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
    Object.assign(baum, {nr: alle.length, tiefe: 0, eltern: null, x: 0, y: 0, r: 0}); alle.push(baum);
    const [Q, a] = bogen([0, 0], -Math.PI / 2 - 0.15, 50, -0.55, 100 * W0 * 1.4, 100 * W0, baum);   // der Stamm
    wachse(baum.kinder, Q, a, 100, 1, baum);
    umrisse(); zeichne();
    $('#lade').hidden = true;
    const finde = () => { let k = baum; for(const t of location.hash.slice(1).split('/').filter(Boolean).map(decodeURIComponent)){ const n = (k.kinder || []).find(c => c.name === t); if(!n) break; k = n; } return k; };
    geh(finde(), false);
    addEventListener('hashchange', () => geh(finde()));
  } catch(err){ $('#lade').textContent = 'Der Fundus ist gerade nicht erreichbar.'; console.error(err); }
})();
