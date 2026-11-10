/* Der Wuchs des Baums: eine Regel auf jeder Stufe (fraktale Kohärenz).

   Jedes Werk ist ein Quirl: seine Fassungen stehen in der Blattspirale, die Jüngste in der Mitte.
   Werke stehen dicht beieinander an ihrer App, Apps an ihrem Ort, Orte in der Krone: jedes Mal
   dieselbe Regel, nur größer. Was trägt (Tragwerk, Mitte), wächst als Wurzelballen unter der Erde.
   Was noch keinen Ort hat, keimt im Gras neben dem Stamm.
   Kleine Orte behalten eigenen Raum; Äste suchen die freien Zwischenräume ihrer Teilkronen.
   Reine Funktionen. Die Erde liegt bei y = 0; nach oben ist y negativ. */

import {TRAGEND, OFFEN} from './inhalt.js';

const GOLD = Math.PI * (3 - Math.sqrt(5));
const LUFT = {wurzel: 2.4, ort: 0.9, bereich: 0.7, app: 0.5};
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
    if(!best){ let d = c.r + luft; const w = L.length * GOLD;
      while(!frei(Math.cos(w) * d, Math.sin(w) * d, c.r)) d += c.r + luft + 0.5;
      best = [Math.cos(w) * d, Math.sin(w) * d]; }
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
  mx /= fl || 1; my /= fl || 1; if(flach){ mx = 0; my = 0; }
  let r = 0; for(const c of kinder){ c.x -= mx; c.y -= my; r = Math.max(r, Math.hypot(c.x, c.y) + c.r); }
  // Eine freie Gabel nahe der Gruppenmitte verkürzt die inneren Äste. Sie liegt
  // zwischen den Kindern; der nächste Ast beginnt nicht mehr am äußeren Kronenrand.
  const stellen = [[0, 0]];
  for(const c of kinder){ const d = Math.hypot(c.x, c.y) || 1;
    stellen.push([c.x - c.x / d * (c.r + 0.15), c.y - c.y / d * (c.r + 0.15)]);
    for(const b of kinder){ if(b === c) continue; const dx = b.x - c.x, dy = b.y - c.y, l = Math.hypot(dx, dy) || 1;
      const s = (l + c.r - b.r) * 0.5; stellen.push([c.x + dx / l * s, c.y + dy / l * s]); }
  }
  const frei = stellen.filter(([x, y]) => kinder.every(c => Math.hypot(x - c.x, y - c.y) >= c.r + 0.08));
  frei.sort((a, b) => a[0]*a[0] + a[1]*a[1] - b[0]*b[0] - b[1]*b[1]);
  const [hx, hy] = frei[0] || [0, r + 0.1];
  return {q: k, form: 'gruppe', kinder, r: r + (LUFT[k.art] ?? 0.4) * 0.5, last, hx, hy};
}

/* Eine einzige Bézierkurve bleibt die Schnittstelle zum Zeichnen. Wenn die direkte Kurve
   fremde Teilkronen schneidet, wird ihr Bogen auf beiden Seiten nach freiem Raum abgesucht. */
function astkurve(ax, ay, ex, ey, tx, ty, nx, ny, hindernisse, bereich){
  const lx = ex - ax, ly = ey - ay, l = Math.hypot(lx, ly) || 1e-6;
  const vor = Math.max(0.12, (lx * tx + ly * ty) / l), sx = -ly / l, sy = lx / l;
  const basis = [ax, ay, ax + lx * 0.24 + tx * l * 0.12 * vor, ay + ly * 0.24 + ty * l * 0.12 * vor, ex - nx * l * 0.3, ey - ny * l * 0.3, ex, ey];
  const begrenze = p => { if(!bereich) return p;
    for(const i of [2, 4]){ const dx = p[i] - bereich.x, dy = p[i + 1] - bereich.y, d = Math.hypot(dx, dy), r = Math.max(0.1, bereich.r - 0.05);
      if(d > r){ p[i] = bereich.x + dx / d * r; p[i + 1] = bereich.y + dy / d * r; }
    } return p; };
  begrenze(basis);
  const pruefe = p => { let schnitte = 0;
    for(let i = 1; i < 32; i++){ const u = i / 32, v = 1 - u;
      const x = v*v*v*p[0] + 3*v*v*u*p[2] + 3*v*u*u*p[4] + u*u*u*p[6];
      const y = v*v*v*p[1] + 3*v*v*u*p[3] + 3*v*u*u*p[5] + u*u*u*p[7];
      for(const h of hindernisse){ const innen = h.r + 0.12 - Math.hypot(x - h.x, y - h.y); if(innen > 0) schnitte += innen * innen + 0.1; }
    } return schnitte; };
  let best = basis, schnitte = pruefe(basis), wert = schnitte * 1e5;
  if(!schnitte) return best;
  for(const faktor of [0.1, -0.1, 0.2, -0.2]){
    const b = l * faktor;
    for(const form of [0, 1]){ const p = basis.slice();
      p[2] += sx * b; p[3] += sy * b;
      p[4] += sx * b * (form === 0 ? 1 : 0.3); p[5] += sy * b * (form === 0 ? 1 : 0.3); begrenze(p);
      const s = pruefe(p), w = s * 1e5 + Math.abs(b) + form * 0.01;
      if(w < wert){ best = p; schnitte = s; wert = w; }
    }
    if(!schnitte) break;
  }
  return best;
}

/* Mehr Platz für kleine Orte, ohne große Bestände zusammenzudrücken oder Blätter zu verlieren. */
function vergroessere(g, faktor){
  g.r *= faktor;
  if(g.hx != null){ g.hx *= faktor; g.hy *= faktor; }
  for(const c of g.kinder){ c.x *= faktor; c.y *= faktor; vergroessere(c, faktor); }
  if(g.blaetter) for(const b of g.blaetter){ b.dx *= faktor; b.dy *= faktor; }
}

/* Von oben nach unten: wo jedes Gewächs steht, wo sein Ast ankommt (ex, ey) und wie er dorthin läuft */
function setze(g, cx, cy, eltern, liste, ax, ay, tx, ty, weg, hindernisse = []){
  g.x = cx; g.y = cy; g.eltern = eltern;
  let dx = ax - cx, dy = ay - cy, d = Math.hypot(dx, dy) || 1;
  const innen = g.form === 'quirl' ? Math.min(g.r * 0.55, 0.9) : g.r;
  g.ex = cx + dx / d * innen; g.ey = cy + dy / d * innen;
  if(g.hx != null){ g.ex = cx + g.hx; g.ey = cy + g.hy; }
  // die Kurve: sie verlässt den Ast in dessen Richtung und kommt auf die Mitte zu an
  const lx = g.ex - ax, ly = g.ey - ay, l = Math.hypot(lx, ly) || 1e-6;
  const nx = lx / l, ny = ly / l;
  g.kurve = astkurve(ax, ay, g.ex, g.ey, tx, ty, nx, ny, hindernisse, eltern && !eltern.krone && !eltern.keime ? eltern : null);
  g.weg = weg + l; g.tx = nx; g.ty = ny; liste.push(g);
  const plaetze = g.kinder.map(c => ({g: c, x: cx + c.x, y: cy + c.y, r: c.r}));
  for(const p of plaetze) setze(p.g, p.x, p.y, g, liste, g.ex, g.ey, nx, ny, g.weg, plaetze.filter(o => o.g !== p.g));
  if(g.form === 'quirl') for(const b of g.blaetter){ b.x = cx + b.dx; b.y = cy + b.dy; b.g = g; }
}

export function wachse(inhalt, hochkant = false){
  const orte = inhalt.wurzel.kinder;
  const krone = orte.filter(o => o.kinder && !TRAGEND.has(o.name) && !OFFEN.has(o.name));
  const tragend = orte.filter(o => o.kinder && TRAGEND.has(o.name));
  const offen = orte.filter(o => o.kinder && OFFEN.has(o.name));
  const lose = orte.filter(o => !o.kinder);
  const alle = [];

  // Die Orte wachsen auf beiden Seiten des freien Stamms. Auf dem Handy stehen sie
  // enger am Stamm und höher gestaffelt; jedes Paar hat eigene freie Astansätze.
  const kr = {q: inhalt.wurzel, form: 'gruppe', krone: true, kinder: krone.map(o => gewaechs(o))};
  if(lose.length) kr.kinder.push(quirl(inhalt.wurzel, lose, true));
  kr.last = kr.kinder.reduce((s, c) => s + c.last, 0);
  const groesste = Math.max(1, ...kr.kinder.map(c => c.r)), mindest = groesste * 0.43;
  for(const c of kr.kinder) if(c.r < mindest) vergroessere(c, mindest / c.r);
  const gasse = Math.max(4, dicke(kr.last) * 0.55 + 2);
  const nachGroesse = kr.kinder.slice().sort((a, b) => b.r - a.r || a.q.nr - b.q.nr);
  if(hochkant){
    const saeulen = [12, 12];
    for(const c of nachGroesse){
      const seite = saeulen[0] <= saeulen[1] ? 0 : 1, vorzeichen = seite ? 1 : -1;
      c.x = vorzeichen * (gasse + c.r); c.y = -saeulen[seite] - c.r;
      c.ansatzY = c.y + c.r * 0.22;
      saeulen[seite] += c.r * 2 + LUFT.wurzel + 1.5;
    }
  } else {
    // Zwei tragende Teilkronen unten, die kleineren als zusammenhängender
    // Kronenbogen darüber. Der Bogen wächst nur so weit, bis alle Kreise frei sind.
    const basis = nachGroesse.slice(0, 2), bogen = nachGroesse.slice(2);
    basis.forEach((c, i) => {
      c.x = (i ? 1 : -1) * (gasse + c.r); c.y = -12 - c.r; c.ansatzY = -8;
    });
    const mitteY = -20;
    let radius = groesste * 2.25;
    const stelleBogen = () => bogen.forEach((c, i) => {
      const winkel = (bogen.length === 1 ? 270 : 220 + 100 * i / (bogen.length - 1)) * Math.PI / 180;
      c.x = Math.cos(winkel) * radius; c.y = mitteY + Math.sin(winkel) * radius;
    });
    const frei = () => nachGroesse.every((c, i) => nachGroesse.slice(i + 1).every(b =>
      Math.hypot(c.x - b.x, c.y - b.y) >= c.r + b.r + LUFT.wurzel));
    stelleBogen();
    while(!frei()){ radius += 1; stelleBogen(); }
    const weit = Math.max(1, ...bogen.map(c => Math.abs(c.x)));
    for(const c of bogen){
      c.ansatzY = -22 - (1 - Math.abs(c.x) / weit) * 30;
      c.kronenBogen = Math.min(...basis.map(b => b.y - b.r)) - 3;
    }
  }
  const stammHoch = Math.max(14, ...kr.kinder.map(c => -c.ansatzY));
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for(const c of kr.kinder){ x0 = Math.min(x0, c.x - c.r); x1 = Math.max(x1, c.x + c.r); y0 = Math.min(y0, c.y - c.r); y1 = Math.max(y1, c.y + c.r); }
  if(!kr.kinder.length){ x0 = -1; x1 = 1; y0 = -stammHoch; y1 = -stammHoch; }
  const hoehe = y1 - y0;
  kr.r = Math.max(x1 - x0, hoehe) / 2; kr.x = (x0 + x1) / 2; kr.y = (y0 + y1) / 2; kr.eltern = null; kr.weg = stammHoch; kr.ex = 0; kr.ey = -stammHoch; kr.tx = 0; kr.ty = -1;
  alle.push(kr);
  for(const c of kr.kinder){
    setze(c, c.x, c.y, kr, alle, 0, c.ansatzY, 0, -1, -c.ansatzY);
    if(c.kronenBogen != null){
      // Die oberen Äste gehen erst durch die freie Stammgasse und teilen sich
      // oberhalb der großen Teilkronen. Keine Queräste durch deren Bildmaterial.
      const hoehe = Math.min(c.ey, c.kronenBogen) - c.r * 0.45;
      c.kurve = [0, c.ansatzY, 0, c.kronenBogen - c.r * 0.5, c.ex * 0.64, hoehe, c.ex, c.ey];
    }
  }

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
