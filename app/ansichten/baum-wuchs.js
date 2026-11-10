/* Der Wuchs des Baums: eine Regel auf jeder Stufe (fraktale Kohärenz).

   Jedes Werk ist ein Quirl: seine Fassungen stehen in der Blattspirale, die Jüngste in der Mitte.
   Werke stehen dicht beieinander an ihrer App, Apps an ihrem Ort, Orte in der Krone: jedes Mal
   dieselbe Regel, nur größer. Was trägt (Tragwerk, Mitte), wächst als Wurzelballen unter der Erde.
   Was noch keinen Ort hat, keimt im Gras neben dem Stamm.
   Jeder Teil bekommt genau so viel Platz, wie er braucht: nichts überdeckt etwas anderes, nichts fehlt.
   Reine Funktionen. Die Erde liegt bei y = 0; nach oben ist y negativ. */

import {TRAGEND, OFFEN} from './inhalt.js';

const GOLD = Math.PI * (3 - Math.sqrt(5));
const LUFT = {wurzel: 0.9, ort: 0.55, bereich: 0.45, app: 0.18};
export const dicke = last => 0.115 * Math.pow(last, 0.62);

/* Ein Quirl: lose Blätter in der Blattspirale. Die Liste kommt mit dem Frühesten zuerst; das Jüngste sitzt innen. */
function quirl(q, lose, eigen){
  const n = lose.length, blaetter = [];
  for(let i = 0; i < n; i++){
    const j = n - 1 - i, rad = n === 1 ? 0 : 0.6 * Math.sqrt(j + 0.3), w = j * GOLD + (q.nr % 7);
    blaetter.push({q: lose[i], dx: Math.cos(w) * rad, dy: Math.sin(w) * rad, w, innen: j});
  }
  return {q, form: 'quirl', eigen: !!eigen, blaetter, kinder: [], r: n === 1 ? 0.72 : 0.6 * Math.sqrt(n) + 0.62, last: n};
}

/* Kreise dicht legen: der Größte zuerst, jeder weitere an die günstigste freie Stelle, die zwei andere berührt */
function lege(kreise, luft, kosten, start = [0, 0]){
  const L = [];
  const frei = (x, y, r) => { for(const k of L){ const d = k.r + r + luft - 1e-6; if((k.x - x) ** 2 + (k.y - y) ** 2 < d * d) return false; } return true; };
  for(const c of kreise.slice().sort((a, b) => b.r - a.r || a.q.nr - b.q.nr)){
    let best = null, bk = Infinity;
    const pruefe = (x, y) => { const k = kosten(x, y, c.r); if(k < bk && frei(x, y, c.r)){ bk = k; best = [x, y]; } };
    if(!L.length) pruefe(start[0], start[1]);
    if(L.length < 3) for(const a of L) for(let i = 0; i < 36; i++){ const w = i / 36 * 2 * Math.PI, d = a.r + c.r + luft; pruefe(a.x + Math.cos(w) * d, a.y + Math.sin(w) * d); }
    for(let i = 0; i < L.length; i++) for(let j = i + 1; j < L.length; j++){
      const a = L[i], b = L[j], da = a.r + c.r + luft, db = b.r + c.r + luft, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if(d > da + db || d < Math.abs(da - db) || d < 1e-9) continue;
      const s = (da * da - db * db + d * d) / (2 * d), h = Math.sqrt(Math.max(0, da * da - s * s)), ux = dx / d, uy = dy / d;
      pruefe(a.x + ux * s - uy * h, a.y + uy * s + ux * h); pruefe(a.x + ux * s + uy * h, a.y + uy * s - ux * h);
    }
    if(!best){ const w = L.length * GOLD, d = Math.sqrt(L.reduce((s, k) => s + k.r * k.r, 0)) * 2 + c.r; best = [Math.cos(w) * d, Math.sin(w) * d]; }
    c.x = best[0]; c.y = best[1]; L.push(c);
  }
  return L;
}
const rund = (x, y) => x * x + y * y;

/* Ein Gewächs aus einem Knoten des Inhalts: Gruppe (trägt Gruppen und Quirle) oder Quirl */
function gewaechs(k, kosten = rund, flach = false){
  const aeste = k.kinder.filter(c => c.kinder), lose = k.kinder.filter(c => !c.kinder);
  if(!aeste.length) return quirl(k, lose);
  const kinder = aeste.map(c => gewaechs(c));
  if(lose.length) kinder.push(quirl(k, lose, true));
  lege(kinder, LUFT[k.art] ?? 0.4, kosten);
  let fl = 0, mx = 0, my = 0, last = 0;
  for(const c of kinder){ const f = c.r * c.r; fl += f; mx += c.x * f; my += c.y * f; last += c.last; }
  mx /= fl; my /= fl; if(flach){ mx = 0; my = 0; }
  let r = 0; for(const c of kinder){ c.x -= mx; c.y -= my; r = Math.max(r, Math.hypot(c.x, c.y) + c.r); }
  return {q: k, form: 'gruppe', kinder, r: r + (LUFT[k.art] ?? 0.4) * 0.5, last};
}

/* Von oben nach unten: wo jedes Gewächs steht, wo sein Ast ankommt (ex, ey) und wie er dorthin läuft */
function setze(g, cx, cy, eltern, liste, ax, ay, tx, ty, weg){
  g.x = cx; g.y = cy; g.eltern = eltern;
  let dx = ax - cx, dy = ay - cy, d = Math.hypot(dx, dy) || 1;
  const innen = g.form === 'quirl' ? Math.min(g.r * 0.55, 0.9) : g.r * 0.9;
  g.ex = cx + dx / d * innen; g.ey = cy + dy / d * innen;
  // die Kurve: sie verlässt den Ast in dessen Richtung und kommt auf die Mitte zu an
  const lx = g.ex - ax, ly = g.ey - ay, l = Math.hypot(lx, ly) || 1e-6, vor = Math.max(0.12, (lx * tx + ly * ty) / l);
  const nx = -dx / d, ny = -dy / d;   // Ankunftsrichtung: zur Mitte hin
  g.kurve = [ax, ay, ax + tx * l * 0.5 * vor, ay + ty * l * 0.5 * vor, g.ex - nx * l * 0.3, g.ey - ny * l * 0.3, g.ex, g.ey];
  g.weg = weg + l; g.tx = nx; g.ty = ny; liste.push(g);
  for(const c of g.kinder) setze(c, cx + c.x, cy + c.y, g, liste, g.ex, g.ey, nx, ny, g.weg);
  if(g.form === 'quirl') for(const b of g.blaetter){ b.x = cx + b.dx; b.y = cy + b.dy; b.g = g; }
}

export function wachse(inhalt, hochkant = false){
  const orte = inhalt.wurzel.kinder;
  const krone = orte.filter(o => o.kinder && !TRAGEND.has(o.name) && !OFFEN.has(o.name));
  const tragend = orte.filter(o => o.kinder && TRAGEND.has(o.name));
  const offen = orte.filter(o => o.kinder && OFFEN.has(o.name));
  const lose = orte.filter(o => !o.kinder);
  const alle = [];

  // die Krone: Orte dicht um ihre Mitte über der Gabelung (0, 0); der Stamm darunter bleibt frei
  const kx = hochkant ? 1.02 : 1.4, ky = hochkant ? 0.98 : 0.74;
  const kr = {q: inhalt.wurzel, form: 'gruppe', krone: true, kinder: krone.map(o => gewaechs(o))};
  if(lose.length) kr.kinder.push(quirl(inhalt.wurzel, lose, true));
  kr.last = kr.kinder.reduce((s, c) => s + c.last, 0);
  const weite = Math.sqrt(kr.kinder.reduce((s, c) => s + c.r * c.r, 0)) * 1.12, gasse = dicke(kr.last) * 0.5 + 1.5;
  const stammHoch = Math.max(14, weite * (hochkant ? 0.42 : 0.5)), mitte = Math.min(-weite * ky * 0.92, -(Math.max(...kr.kinder.map(c => c.r)) + 2));
  lege(kr.kinder, LUFT.wurzel, (x, y, r) => {
    if(y + r > stammHoch * 0.42) return Infinity;                               // nichts hängt bis ins Gras
    if(y + r > -0.5 && Math.abs(x) < r + gasse) return Infinity;                // der Stamm bleibt frei
    return (x / kx) ** 2 + ((y - mitte) / ky) ** 2; }, [0, mitte]);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for(const c of kr.kinder){ c.y -= stammHoch; x0 = Math.min(x0, c.x - c.r); x1 = Math.max(x1, c.x + c.r); y0 = Math.min(y0, c.y - c.r); y1 = Math.max(y1, c.y + c.r); }
  const hoehe = y1 - y0, mx = 0;
  kr.r = Math.max(x1 - x0, hoehe) / 2; kr.x = (x0 + x1) / 2; kr.y = (y0 + y1) / 2; kr.eltern = null; kr.weg = stammHoch; kr.ex = 0; kr.ey = -stammHoch; kr.tx = 0; kr.ty = -1;
  alle.push(kr);
  for(const c of kr.kinder) setze(c, c.x, c.y, kr, alle, 0, -stammHoch, 0, -1, stammHoch);

  // der Wurzelballen: was trägt, flach und weit unter der Erde
  const wurzeln = [];
  for(const o of tragend){
    const w = gewaechs(o, (x, y, r) => (x / 1.7) ** 2 + (y / 0.62) ** 2 + (y - r < 0 ? 1e9 : 0), true);
    let oben = Infinity; for(const c of w.kinder) oben = Math.min(oben, c.y - c.r);
    w.unten = true; w.x = 0; w.y = 7 - oben; w.eltern = null; w.weg = 4; w.ex = 0; w.ey = 3.5; w.tx = 0; w.ty = 1;
    let tief = 0; for(const c of w.kinder) tief = Math.max(tief, c.y + c.r - oben);
    w.r = Math.max(...w.kinder.map(c => Math.abs(c.x) + c.r)); w.tief = tief + 7;
    alle.push(w); wurzeln.push(w);
    for(const c of w.kinder) setze(c, w.x + c.x, w.y + c.y, w, alle, 0, 3.5, 0, 1, 4);
  }
  const unter = g => { g.unten = true; g.kinder.forEach(unter); }; wurzeln.forEach(unter);

  // Keimlinge im Gras neben dem Stamm
  const keime = []; let px = dicke(kr.last) * 0.5 + 7;
  for(const o of offen){ const gr = {q: o, form: 'gruppe', keime: true, kinder: [], last: 0, eltern: null};
    for(const c of o.kinder.filter(c => c.kinder)){ const k = gewaechs(c); k.keim = true; const hoch = 2.5 + k.r * 0.9 + (c.nr % 3) * 1.1;
      setze(k, px + k.r, -(hoch + k.r), gr, alle, px + k.r, 0, 0, -1, 0); px += k.r * 2 + 1.6; gr.kinder.push(k); gr.last += k.last; }
    const xs = gr.kinder.map(k => k.x), ys = gr.kinder.map(k => k.y);
    gr.x = (Math.min(...xs) + Math.max(...xs)) / 2; gr.y = (Math.min(...ys) + Math.max(...ys)) / 2 - 1; gr.r = (Math.max(...xs) - Math.min(...xs)) / 2 + 4;
    alle.push(gr); keime.push(gr); }

  const r = {x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity}; let weit = 1;
  for(const g of alle){ if(g.krone) continue; r.x0 = Math.min(r.x0, g.x - g.r); r.x1 = Math.max(r.x1, g.x + g.r); r.y0 = Math.min(r.y0, g.y - g.r); r.y1 = Math.max(r.y1, g.y + g.r); weit = Math.max(weit, g.weg || 0); }
  for(const g of alle) g.zeit = (g.weg || 0) / weit;
  const blaetter = alle.filter(g => g.form === 'quirl').flatMap(g => g.blaetter);
  return {alle, blaetter, krone: kr, wurzeln, keime, stammHoch, rahmen: r, kroneRahmen: {x0, x1, y0, y1}};
}
