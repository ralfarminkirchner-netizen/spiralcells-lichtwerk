/* Der Baum: was aus was gewachsen ist, und wie frisch es ist.

   Was nur der Baum erzählt: alles hat einen Stamm. Die Krone sind Ralfs Orte, jeder Ast eine App, jeder Quirl
   ein Werk, jedes Blatt eine Fassung. Helles Grün ist jung, dunkles früh, mattes Grün ohne belegte Zeit.
   Wo eine Fassung ein Bild hat, hängt eine Frucht: das Bild selbst. Gespräche blühen.
   Unter der Erde liegt, was trägt: das Tragwerk als Wurzelballen. Im Gras keimt, was noch geprüft wird. */

import {buehne, bildlager} from './buehne.js';
import {wachse, dicke} from './baum-wuchs.js';
import {mengenWort} from './inhalt.js';

const TINTE = '#2b241c', PAPIER = '#f8f1e2', SERIF = 'ui-serif, "New York", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif', SANS = 'ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", sans-serif';
const klemme = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const sanft = u => u * u * (3 - 2 * u);
const STUFEN = 10;
const GRUEN = Array.from({length: STUFEN}, (_, i) => { const u = i / (STUFEN - 1); return `hsl(${150 - u * 74} ${40 + u * 30}% ${25 + u * 27}%)`; });
const GRAU = ['hsl(108 26% 43%)', 'hsl(100 28% 49%)', 'hsl(116 25% 38%)'];
const GLUT = Array.from({length: STUFEN}, (_, i) => { const u = i / (STUFEN - 1); return `hsl(${30 + u * 16} ${62 + u * 30}% ${40 + u * 26}%)`; });
const ASCHE = ['hsl(30 26% 46%)', 'hsl(34 24% 52%)', 'hsl(27 24% 40%)'];

export const legende = `
  <p><b>Der Baum</b> zeigt, was aus was gewachsen ist. Die Krone sind die Orte, jeder Ast eine App, jeder Quirl ein Werk, jedes Blatt eine Fassung.</p>
  <ul class="zeichen">
    <li><i class="z blatt jung"></i>helles Blatt: junge Fassung</li>
    <li><i class="z blatt frueh"></i>dunkles Blatt: frühe Fassung</li>
    <li><i class="z blatt offen"></i>mattes Grün: Zeit nicht belegt</li>
    <li><i class="z frucht"></i>Frucht: Fassung mit Bild</li>
    <li><i class="z bluete"></i>Blüte: Gespräch</li>
    <li><i class="z knolle"></i>unter der Erde: was trägt</li>
    <li><i class="z keim"></i>im Gras: noch zur Prüfung</li>
  </ul>
  <p>Tippen geht hinein, ziehen verschiebt, zwei Finger oder das Rad kommen näher.</p>`;

export function starte(el, K){
  let W, pf = null, start = K.still ? -1e9 : performance.now(), fertig = false, schweb = null, ziel = null;
  const vonKnoten = new Map(), I = K.inhalt, spanne = Math.max(1, (I.bis ?? 1) - (I.von ?? 0));
  const lager = bildlager(K.bildUrl);
  const B = buehne(el, {zeichne, tipp, schwebe, lebendig: () => !fertig || B.s >= 6});
  lager.beiBild = B.neu;
  B.beiGroesse = () => { const hk = hochkant(); if(hk !== W.hochkant) baue(); B.rand = K.rand(); B.setze(B.blickAuf(rahmenVon(K.gewaehlt()))); };

  function hochkant(){ return B.h > B.w * 1.1; }
  function baue(){
    W = wachse(I, hochkant()); W.hochkant = hochkant(); vonKnoten.clear(); pf = null;
    for(const g of W.alle) if(!g.eigen && !vonKnoten.has(g.q)) vonKnoten.set(g.q, g);
    for(const b of W.blaetter){
      vonKnoten.set(b.q, b); const q = b.q, g = b.g, einzeln = g.blaetter.length === 1;
      b.a = einzeln ? Math.atan2(g.ty, g.tx) : b.w; b.phase = (q.nr * 2.399) % 6.283;
      const u = q.von == null ? -1 : klemme((q.von - I.von) / spanne);
      b.stufe = u < 0 ? -1 - (q.nr % 3) : Math.round(u * (STUFEN - 1));
      b.frucht = !!q.bild; b.bluete = q.art === 'gespraech'; b.unten = !!g.unten;
      b.mx = b.x + Math.cos(b.a) * (einzeln ? 0.1 : 0.22); b.my = b.y + Math.sin(b.a) * (einzeln ? 0.1 : 0.22);
    }
    for(const g of W.alle){ if(g.form !== 'quirl') continue; let sum = 0, n = 0; for(const b of g.blaetter) if(b.stufe >= 0){ sum += b.stufe; n++; }
      g.ton = g.unten ? (n ? GLUT[Math.round(sum / n)] : ASCHE[1]) : (n ? GRUEN[Math.round(sum / n)] : GRAU[1]); }
    W.oben = [...W.krone.kinder, ...W.wurzeln, ...W.keime];
    for(const w of W.wurzeln) w.rahmen = {x0: -w.r - 2, x1: w.r + 2, y0: 1, y1: w.tief + 3};
    W.dStamm = dicke(W.krone.last); W.dWurzel = W.wurzeln.length ? dicke(W.wurzeln[0].last) : 0;
    W.breite = B.sMin = 0; B.sMin = B.blickAuf(W.rahmen).s * 0.6;
  }

  /* ein Ast als Band: an der Wurzel breiter, zur Spitze schmal; f < 1 zeichnet nur den gewachsenen Teil */
  function band(p, k, wf, f, breit, versatz, kappe){
    const N = 12, L = [], R = []; let ex = 0, ey = 0, ew = 0;
    for(let i = 0; i <= N; i++){
      const u = i / N * f, v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
      const x = a * k[0] + b * k[2] + c * k[4] + d * k[6], y = a * k[1] + b * k[3] + c * k[5] + d * k[7];
      let tx = 3 * v * v * (k[2] - k[0]) + 6 * v * u * (k[4] - k[2]) + 3 * u * u * (k[6] - k[4]), ty = 3 * v * v * (k[3] - k[1]) + 6 * v * u * (k[5] - k[3]) + 3 * u * u * (k[7] - k[5]);
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const w0 = wf(u), w = w0 * 0.5 * breit, ox = -0.3 * versatz * w0, oy = -0.3 * versatz * w0;
      L.push(x - ty * w + ox, y + tx * w + oy); R.push(x + ty * w + ox, y - tx * w + oy); ex = x + ox; ey = y + oy; ew = w;
    }
    p.moveTo(L[0], L[1]); for(let i = 2; i < L.length; i += 2) p.lineTo(L[i], L[i + 1]);
    for(let i = R.length - 2; i >= 0; i -= 2) p.lineTo(R[i], R[i + 1]); p.closePath();
    if(kappe && ew > 0.02){ kappe.moveTo(ex + ew, ey); kappe.arc(ex, ey, ew, 0, 6.2832); }
  }
  function aeste(P){
    const o = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], u = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const lagen = [[1, 0], [0.56, 0.2], [0.17, 0.33]], H = W.stammHoch, dS = W.dStamm;
    const fS = klemme(P * 1.12 / 0.14);
    lagen.forEach(([br, vs], i) => {
      band(o[i], [0, 0.6, 0.9, -H * 0.35, -0.9, -H * 0.7, 0, -H], t => dS * (1 + 1.1 * Math.pow(1 - t, 5)), fS, br, vs, i === 0 && o[3]);
      if(W.dWurzel) band(u[i], [0, -0.4, 0, 1, 0, 2.5, 0, 3.6], t => dS * 1.25 + (W.dWurzel * 1.1 - dS * 1.25) * t, fS, br, vs, i === 0 && u[3]);
    });
    for(const g of W.alle){ if(!g.kurve) continue;
      const f = P >= 1 ? 1 : klemme((P * 1.12 - g.zeit * 0.85) / 0.12); if(f <= 0) continue;
      const w1 = dicke(g.last), e = g.eltern, w0 = e && e.last ? Math.min(dicke(e.last) * 0.72, w1 * 2.3) : w1 * 1.6;
      const ziel = g.unten ? u : o;
      lagen.forEach(([br, vs], i) => { if(i === 2 && w1 < 0.5) return; band(ziel[i], g.kurve, t => w0 + (w1 - w0) * sanft(t), sanft(f), br, vs, i === 0 && ziel[3]); });
    }
    return {o, u};
  }

  function rahmenVon(k){
    const t = (ziel && ziel.q === k) ? ziel : vonKnoten.get(k); ziel = null;
    if(!t || t === W.krone) return {x0: W.rahmen.x0 - 3, x1: W.rahmen.x1 + 3, y0: W.rahmen.y0 - 5, y1: W.rahmen.y1 + 3};
    if(t.rahmen) return t.rahmen;
    if(t.g){ const d = B.w < 600 ? 2.4 : 3.6; return {x0: t.x - d, x1: t.x + d, y0: t.y - d, y1: t.y + d}; }
    const d = t.r + (t.form === 'quirl' ? 1.3 : 0.6); return {x0: t.x - d, x1: t.x + d, y0: t.y - d, y1: t.y + d};
  }
  function zeige(k, sofort){ B.rand = K.rand(); const z = B.blickAuf(rahmenVon(k), 1.12); sofort ? B.setze(z) : B.fliege(z); }

  const drin = (g, wx, wy) => g.rahmen ? wx >= g.rahmen.x0 && wx <= g.rahmen.x1 && wy >= g.rahmen.y0 && wy <= g.rahmen.y1 : (wx - g.x) ** 2 + (wy - g.y) ** 2 <= g.r * g.r;
  function treffer(px, py){
    const wx = B.vonX(px), wy = B.vonY(py);
    if(B.s >= 9){ let best = null, bd = Math.max(0.62, 18 / B.s) ** 2;
      for(const b of W.blaetter){ const d = (b.mx - wx) ** 2 + (b.my - wy) ** 2; if(d < bd){ bd = d; best = b; } }
      const gw = K.gewaehlt();   // ein Blatt wählt man erst, wenn man an seinem Werk ist (oder schon sehr nah)
      if(best && (B.s >= 30 || best.g.q === gw || (gw && gw.eltern === best.g.q))) return {k: best.q, t: best}; }
    // eine Stufe nach der anderen: vom Gewählten aus geht ein Tipp genau eine Stufe tiefer, nie drei auf einmal
    const kette = []; let liste = W.oben;
    for(;;){ const g = liste.find(c => drin(c, wx, wy) && (c.rahmen ? c.r * 2 : c.r) * B.s >= 16); if(!g) break; kette.push(g); liste = g.kinder; }
    if(!kette.length) return null;
    const vor = new Set(); for(let q = K.gewaehlt(); q; q = q.eltern) vor.add(q);
    let i = 0; while(i < kette.length - 1 && vor.has(kette[i].q) && !kette[i].eigen) i++;
    while(i < kette.length - 1 && kette[i].r * B.s > Math.min(B.w, B.h) * 0.6) i++;   // was schon den Schirm füllt, ist kein Ziel mehr
    return {k: kette[i].q, t: kette[i]};
  }
  function tipp(px, py){
    const t = treffer(px, py); if(!t) return;
    if(t.k === K.gewaehlt() && !t.k.kinder) return K.oeffne(t.k);
    ziel = t.t.eigen ? t.t : null;
    if(t.k === K.gewaehlt()) zeige(t.k); else K.waehle(t.k);
  }
  function schwebe(px, py){ const t = px < 0 ? null : treffer(px, py), neu = t ? t.t : null; if(neu !== schweb){ schweb = neu; B.c.style.cursor = neu ? 'pointer' : ''; B.neu(); } }

  /* ---------- Zeichnen ---------- */
  const tupfenLager = new Map();
  function tupfen(farbe){ let c = tupfenLager.get(farbe); if(c) return c;
    c = document.createElement('canvas'); c.width = c.height = 96; const k = c.getContext('2d'), g = k.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, farbe); g.addColorStop(0.72, farbe); g.addColorStop(1, 'transparent'); k.fillStyle = g; k.beginPath(); k.arc(48, 48, 48, 0, 6.2832); k.fill();
    tupfenLager.set(farbe, c); return c; }
  /* das Laub als Farbe hinter den Blättern: von weitem eine volle Krone, von nah nur ein Hauch */
  function laub(x, P){
    const {w, h, s} = B, fern = klemme(1.2 - s / 11, 0.1, 1);
    for(const g of W.alle){ if(g.krone || g.keime || (!g.unten && g.eltern === W.krone && g.form !== 'quirl')) continue;
      const R = (g.r + (g.form === 'quirl' ? 0.7 : 0.3)) * s * (g.form === 'quirl' ? 1.25 : 1.08), px = B.zuX(g.x), py = B.zuY(g.y);
      if(R < 1.5 || px + R < 0 || px - R > w || py + R < 0 || py - R > h) continue;
      const pop = fertig ? 1 : klemme((P * 1.12 - g.zeit * 0.85 - 0.1) / 0.14); if(pop <= 0) continue;
      const quirl = g.form === 'quirl';
      x.globalAlpha = (g.unten ? (quirl ? 0.22 : 0.07) : (quirl ? 0.62 : 0.3)) * fern * pop;
      x.drawImage(tupfen(quirl ? g.ton : g.unten ? '#ffbe5a' : '#4f8140'), px - R, py - R, R * 2, R * 2); }
    x.globalAlpha = 1;
  }
  const zufall = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

  function grund(x, t){
    const {w, h} = B, y0 = B.zuY(0), oben = B.zuY(W.rahmen.y0 - 30);
    const hg = x.createLinearGradient(0, Math.min(oben, y0 - 1), 0, y0);
    hg.addColorStop(0, '#cfe0e6'); hg.addColorStop(0.55, '#e9ecdf'); hg.addColorStop(1, '#f9ebcf');
    x.fillStyle = hg; x.fillRect(0, 0, w, h);
    // die Sonne steht tief hinter der Krone
    const sx = B.zuX(W.rahmen.x1 * 0.55), sy = B.zuY(W.kroneRahmen.y0 * 0.72), sr = 95 * B.s;
    if(sx + sr > 0 && sx - sr < w && sy + sr > 0 && sy - sr < h){ const sg = x.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, 'rgba(255,246,214,.95)'); sg.addColorStop(0.12, 'rgba(255,240,200,.6)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = sg; x.fillRect(sx - sr, sy - sr, sr * 2, sr * 2); }
    if(y0 > 0 && y0 < h + 40 * B.s){   // Hügel in der Ferne
      const huegel = (hoch, f1, f2, farbe) => { x.beginPath(); x.moveTo(0, y0);
        for(let px = 0; px <= w + 8; px += 8){ const wx = B.vonX(px); x.lineTo(px, y0 - (hoch + Math.sin(wx / f1) * hoch * 0.5 + Math.sin(wx / f2 + 2) * hoch * 0.3) * B.s); }
        x.lineTo(w, y0); x.closePath(); x.fillStyle = farbe; x.fill(); };
      huegel(9, 61, 23, '#cddccb'); huegel(4.2, 37, 13, '#b9d0a4');
    }
    if(y0 < h){   // die Erde
      const tief = B.zuY(W.rahmen.y1 + 10), eg = x.createLinearGradient(0, y0, 0, Math.max(tief, y0 + 1));
      eg.addColorStop(0, '#4a3324'); eg.addColorStop(0.18, '#3a281d'); eg.addColorStop(1, '#1d1410');
      x.fillStyle = eg; x.fillRect(0, y0, w, h - y0);
      const z = 7, zs = z * B.s;
      if(zs > 5){ x.fillStyle = 'rgba(255,225,180,.07)';
        for(let gx = Math.floor(B.vonX(0) / z); gx <= B.vonX(w) / z; gx++) for(let gy = Math.max(0, Math.floor(B.vonY(0) / z)); gy <= B.vonY(h) / z; gy++){
          const r1 = zufall(gx, gy), r2 = zufall(gy, gx + 9); if(r1 < 0.45) continue;
          x.beginPath(); x.ellipse(B.zuX((gx + r2) * z), B.zuY((gy + r1) * z + 1), (0.25 + r1 * 0.5) * B.s, (0.16 + r2 * 0.3) * B.s, r1 * 3, 0, 6.2832); x.fill(); } }
    }
  }
  function gras(x){
    const {w, h} = B, y0 = B.zuY(0); if(y0 < -20 || y0 > h + 20) return;
    x.fillStyle = '#6f9a48'; x.fillRect(0, y0 - 0.5 * B.s, w, 0.95 * B.s); x.fillStyle = '#8fb85c'; x.fillRect(0, y0 - 0.5 * B.s, w, Math.max(1, 0.22 * B.s));
    if(B.s > 3.5){ const ab = 0.42; x.strokeStyle = '#5f8f3f'; x.lineWidth = Math.max(1, 0.07 * B.s); x.lineCap = 'round'; x.beginPath();
      for(let i = Math.floor(B.vonX(0) / ab); i <= B.vonX(w) / ab; i++){ const r = zufall(i, 3), px = B.zuX((i + r) * ab), hh = (0.5 + r * 1.1) * B.s, n = (zufall(i, 8) - 0.5) * 0.7 * B.s;
        x.moveTo(px, y0 + 0.2 * B.s); x.quadraticCurveTo(px, y0 - hh * 0.6, px + n, y0 - hh); }
      x.stroke(); }
  }

  function zeichne(_, t){
    const x = B.x, {w, h, s} = B, dt = t - start, roh = B.ruhig() ? 1 : klemme(dt / 2900), P = 1 - (1 - roh) * (1 - roh);
    if(roh >= 1 && !fertig){ fertig = true; pf = aeste(1); }
    const A = fertig ? pf : aeste(P);
    grund(x, t);
    const welt = () => x.setTransform(B.dpr * s, 0, 0, B.dpr * s, B.dpr * (w / 2 - B.cx * s), B.dpr * (h / 2 - B.cy * s)), flach = () => x.setTransform(B.dpr, 0, 0, B.dpr, 0, 0);
    // Schatten der Krone im Gras
    const kb = (W.kroneRahmen.x1 - W.kroneRahmen.x0) * 0.42; x.fillStyle = 'rgba(40,50,20,.13)'; x.beginPath(); x.ellipse(B.zuX(0), B.zuY(0.1), kb * s, 1.5 * s, 0, 0, 6.2832); x.fill();
    welt(); x.fillStyle = '#7b5a3f'; x.fill(A.u[0]); x.fill(A.u[3]); x.fillStyle = '#b08a63'; x.fill(A.u[1]); x.fillStyle = 'rgba(240,214,170,.55)'; x.fill(A.u[2]);
    flach(); gras(x);
    welt(); x.fillStyle = '#3d2a1f'; x.fill(A.o[0]); x.fill(A.o[3]); x.fillStyle = '#5d432f'; x.fill(A.o[1]); x.fillStyle = 'rgba(214,180,140,.5)'; x.fill(A.o[2]);
    flach(); laub(x, P);

    // Stiele: jedes Blatt sitzt an der Mitte seines Quirls
    if(s > 7){ x.strokeStyle = 'rgba(70,52,36,.55)'; x.lineWidth = Math.max(0.6, 0.05 * s); x.beginPath(); const xu = new Path2D();
      for(const g of W.alle){ if(g.form !== 'quirl' || g.blaetter.length < 2) continue; const px = B.zuX(g.x), py = B.zuY(g.y), R = (g.r + 1) * s; if(px + R < 0 || px - R > w || py + R < 0 || py - R > h) continue;
        const ziel = g.unten ? xu : x; for(const b of g.blaetter){ ziel.moveTo(px, py); ziel.lineTo(B.zuX(b.x), B.zuY(b.y)); } }
      x.stroke(); x.strokeStyle = 'rgba(214,170,120,.5)'; x.stroke(xu); }

    // Blätter, Früchte, Blüten
    const gk = klemme(7 / s, 1, 2.2), wind = !B.ruhig() && s >= 5, nah = s * gk >= 2.4, pfade = new Map(), rippen = new Path2D(), fruechte = [], blueten = [], rand = 1.2 * s;
    const pfad = f => { let p = pfade.get(f); if(!p){ p = new Path2D(); pfade.set(f, p); } return p; };
    for(const b of W.blaetter){
      const px = B.zuX(b.mx), py = B.zuY(b.my); if(px < -rand || px > w + rand || py < -rand || py > h + rand) continue;
      const pop = fertig ? 1 : klemme((P * 1.12 - b.g.zeit * 0.85 - 0.14) / 0.1); if(pop <= 0) continue;
      const pp = pop < 1 ? pop * (1 + 0.5 * Math.sin(pop * 3.1416)) : 1;
      if(b.frucht){ fruechte.push(b, px, py, pp); continue; }
      if(b.bluete){ blueten.push(px, py, pp, b.phase); continue; }
      const farbe = b.unten ? (b.stufe < 0 ? ASCHE[-1 - b.stufe] : GLUT[b.stufe]) : (b.stufe < 0 ? GRAU[-1 - b.stufe] : GRUEN[b.stufe]), p = pfad(farbe);
      if(!nah){ const r = Math.max(0.8, 0.4 * s) * pp; p.rect(px - r, py - r, r * 2, r * 2); continue; }
      if(b.unten){ const r = 0.34 * s * pp * Math.min(gk, 1.8); p.moveTo(px + r, py); p.arc(px, py, r, 0, 6.2832); continue; }
      const a = b.a + (wind ? Math.sin(t * 0.0017 + b.phase) * 0.1 + Math.sin(t * 0.0005 + b.x * 0.06) * 0.06 : 0), cx = Math.cos(a), cy = Math.sin(a);
      const l = 0.74 * s * pp * gk, br = 0.5 * s * pp * gk, x0 = px - cx * l, y0 = py - cy * l, x1 = px + cx * l, y1 = py + cy * l;
      p.moveTo(x0, y0); p.quadraticCurveTo(px - cy * br - cx * l * 0.15, py + cx * br - cy * l * 0.15, x1, y1); p.quadraticCurveTo(px + cy * br - cx * l * 0.15, py - cx * br - cy * l * 0.15, x0, y0);
      if(s > 11){ rippen.moveTo(x0, y0); rippen.lineTo(px + cx * l * 0.7, py + cy * l * 0.7); }
    }
    if(nah && s > 13){ x.shadowColor = 'rgba(20,30,10,.28)'; x.shadowBlur = 0.12 * s; x.shadowOffsetY = 0.06 * s * B.dpr; }
    for(const [f, p] of pfade){ x.fillStyle = f; x.fill(p); }
    x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
    if(s > 11){ x.strokeStyle = 'rgba(255,255,235,.32)'; x.lineWidth = Math.max(0.6, 0.035 * s); x.stroke(rippen); }
    // Knollen leuchten in der Erde
    if(nah && s > 5){ x.fillStyle = 'rgba(255,240,200,.5)'; x.beginPath();
      for(const b of W.blaetter){ if(!b.unten || b.frucht || b.bluete) continue; const px = B.zuX(b.mx), py = B.zuY(b.my); if(px < 0 || px > w || py < 0 || py > h) continue;
        x.moveTo(px, py); x.arc(px - 0.09 * s, py - 0.09 * s, 0.11 * s, 0, 6.2832); } x.fill(); }
    for(let i = 0; i < blueten.length; i += 4){ const px = blueten[i], py = blueten[i + 1], r = 0.46 * s * blueten[i + 2], ph = blueten[i + 3];
      if(r < 2.6){ x.fillStyle = '#fff6f2'; x.beginPath(); x.arc(px, py, Math.max(1.3, r), 0, 6.2832); x.fill(); continue; }
      x.fillStyle = '#fffaf6'; x.strokeStyle = 'rgba(190,120,120,.55)'; x.lineWidth = Math.max(0.5, r * 0.05);
      for(let j = 0; j < 5; j++){ const a = ph + j * 1.2566; x.beginPath(); x.ellipse(px + Math.cos(a) * r * 0.5, py + Math.sin(a) * r * 0.5, r * 0.5, r * 0.32, a, 0, 6.2832); x.fill(); x.stroke(); }
      x.fillStyle = '#e9b23a'; x.beginPath(); x.arc(px, py, r * 0.24, 0, 6.2832); x.fill(); }
    for(let i = 0; i < fruechte.length; i += 4){ const b = fruechte[i], px = fruechte[i + 1], py = fruechte[i + 2], r = 0.47 * s * fruechte[i + 3] * Math.min(gk, 1.25);
      if(r < 4.5){ x.fillStyle = b.unten ? '#ffd27a' : (b.q.nr % 3 ? '#e0683a' : '#eda03f'); x.beginPath(); x.arc(px, py, Math.max(1.2, r), 0, 6.2832); x.fill(); continue; }
      const e = lager.nimm(b.q.bild, r * 2 * B.dpr > 300 ? 960 : 240) || (r * 2 * B.dpr > 300 ? lager.nimm(b.q.bild, 240) : null);
      x.save(); x.beginPath(); x.arc(px, py, r, 0, 6.2832); x.closePath();
      x.shadowColor = 'rgba(20,20,10,.35)'; x.shadowBlur = r * 0.35; x.shadowOffsetY = r * 0.12 * B.dpr; x.fillStyle = b.unten ? '#c9953f' : (b.q.nr % 3 ? '#e0683a' : '#eda03f'); x.fill(); x.shadowColor = 'transparent';
      x.clip();
      if(e){ const im = e.bild, f = Math.max(2 * r / im.naturalWidth, 2 * r / im.naturalHeight), bw = im.naturalWidth * f, bh = im.naturalHeight * f;
        x.globalAlpha = klemme((t - e.da) / 300); if(x.globalAlpha < 1) B.neu(); x.drawImage(im, px - bw / 2, py - bh / 2, bw, bh); x.globalAlpha = 1; }
      x.restore();
      x.strokeStyle = b.unten ? '#ffd27a' : '#fffaf0'; x.lineWidth = Math.max(1, r * 0.07); x.beginPath(); x.arc(px, py, r, 0, 6.2832); x.stroke();
    }

    // gewählt: das Gewählte bleibt im Licht, alles andere tritt zurück; dasselbe Werk leuchtet an jedem seiner Orte
    const gew = K.gewaehlt(), unterErde = tt => !!(tt.unten || (tt.g && tt.g.unten));
    const kreis = (p, tt) => { if(tt.rahmen){ const r = tt.rahmen; p.roundRect(B.zuX(r.x0), B.zuY(r.y0), (r.x1 - r.x0) * s, (r.y1 - r.y0) * s, 22); }
      else { const r = (tt.g ? 0.95 : tt.r + 0.35) * s + 3, px = B.zuX(tt.g ? tt.mx : tt.x), py = B.zuY(tt.g ? tt.my : tt.y); p.moveTo(px + r, py); p.arc(px, py, r, 0, 6.2832); } };
    if(gew && gew.art !== 'wurzel'){
      const stellen = (I.nachSchluessel.get(gew.schluessel) || []).map(k2 => vonKnoten.get(k2)).filter(Boolean), haupt = vonKnoten.get(gew);
      if(stellen.length){
        const schleier = new Path2D(); schleier.rect(0, 0, w, h); for(const tt of stellen) kreis(schleier, tt);
        const y0 = klemme(B.zuY(0), 0, h);
        x.save(); x.beginPath(); x.rect(0, 0, w, y0); x.clip(); x.fillStyle = 'rgba(246,240,226,.5)'; x.fill(schleier, 'evenodd'); x.restore();
        x.save(); x.beginPath(); x.rect(0, y0, w, h - y0); x.clip(); x.fillStyle = 'rgba(16,11,8,.5)'; x.fill(schleier, 'evenodd'); x.restore();
        for(const tt of stellen){ const p = new Path2D(); kreis(p, tt); x.strokeStyle = unterErde(tt) ? 'rgba(255,236,200,.75)' : 'rgba(255,255,255,.9)'; x.lineWidth = tt === haupt ? 1.6 : 1.2; x.setLineDash(tt === haupt ? [] : [2, 5]);
          x.shadowColor = 'rgba(43,36,28,.35)'; x.shadowBlur = 10; x.stroke(p); x.shadowColor = 'transparent'; x.shadowBlur = 0; x.setLineDash([]); }
      }
    }
    if(schweb && vonKnoten.get(gew) !== schweb){ const p = new Path2D(); kreis(p, schweb); x.strokeStyle = unterErde(schweb) ? 'rgba(255,236,200,.55)' : 'rgba(43,36,28,.4)'; x.lineWidth = 1.2; x.stroke(p); }

    schrift(x, P, gew);
  }

  /* Namen: das Große von weitem, das Kleine von nah; nie zwei übereinander */
  const breiten = new Map();
  function schrift(x, P, gew){
    const {w, h, s} = B, belegt = [], kurz = Math.min(w, h);
    const setze = (text, px, py, gr, o = {}) => {
      if(!text) return false; const font = `${o.gewicht || 500} ${o.kursiv ? 'italic ' : ''}${gr.toFixed(1)}px ${o.sans ? SANS : SERIF}`;
      const key = font + text; let br = breiten.get(key); if(br == null){ x.font = font; br = x.measureText(text).width; if(breiten.size > 4000) breiten.clear(); breiten.set(key, br); }
      const hh = gr * 1.25, x0 = px - br / 2 - 4, y0 = py - hh / 2;
      if(!o.immer){ if(x0 > w - br * 0.25 || x0 + br * 0.75 < 0 || y0 > h || y0 + hh < 0) return false;
        for(const r of belegt) if(x0 < r[2] && x0 + br + 8 > r[0] && y0 < r[3] && y0 + hh > r[1]) return false; }
      belegt.push([x0, y0, x0 + br + 8, y0 + hh]);
      x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.globalAlpha = o.alpha ?? 1; x.lineJoin = 'round';
      x.strokeStyle = o.dunkel ? 'rgba(29,20,16,.82)' : 'rgba(250,244,230,.86)'; x.lineWidth = Math.max(3, gr * 0.24); x.strokeText(text, px, py);
      x.fillStyle = o.dunkel ? '#f6e7c9' : TINTE; x.fillText(text, px, py); x.globalAlpha = 1; return true;
    };
    const kuerze = (t, n) => t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
    if(P < 0.55) return;
    const ein = klemme((P - 0.55) / 0.3);
    const vorfahren = new Set(); for(let q = gew && gew.eltern; q; q = q.eltern) vorfahren.add(q);
    const lauf = (liste, tiefe) => { const naechste = [];
      for(const g of liste){
        const R = (g.rahmen ? (g.rahmen.x1 - g.rahmen.x0) / 2 : g.r) * s, px = B.zuX(g.x), py = g.rahmen ? B.zuY(g.rahmen.y0 + 6) : B.zuY(g.y);
        if(px + R < 0 || px - R > w || B.zuY(g.rahmen ? g.rahmen.y1 : g.y + g.r) < 0 || B.zuY(g.rahmen ? g.rahmen.y0 : g.y - g.r) > h) continue;
        const zuGross = klemme((kurz * 0.95 - R) / (kurz * 0.3)), dunkel = !!g.unten;
        if(g.form === 'quirl'){
          if(g.eigen) { /* das eigene Material trägt den Namen seines Astes nicht noch einmal */ }
          else if(R >= 26 && zuGross > 0) setze(kuerze(g.q.name, R > 80 ? 60 : 30), px, B.zuY(g.y + g.r) + 9, klemme(R * 0.2, 11, 16), {alpha: zuGross * ein, dunkel, kursiv: true});
          if(s >= 34 && (s >= 62 || g.q === gew || vorfahren.has(g.q) || (gew && gew.eltern === g.q))) for(const b of g.blaetter){ const bx = B.zuX(b.mx), by = B.zuY(b.my); if(bx < -80 || bx > w + 80 || by < 0 || by > h) continue;
            setze(kuerze(b.q.name, 34), bx, by + (b.frucht ? 0.47 : 0.36) * s + 9, 11.5, {sans: true, dunkel, alpha: klemme((s - 34) / 12)}); }
          continue;
        }
        const gross = tiefe === 0;
        if(R >= (gross ? 20 : 30) && zuGross > 0 && !(R > 90 && vorfahren.has(g.q) && !g.eigen)){
          const gr = gross ? klemme(R * 0.15, 14, 27) : klemme(R * 0.19, 11.5, 20);
          const ok = setze(kuerze(g.keime ? 'Zur Prüfung' : g.q.name, gross ? 40 : R > 70 ? 44 : 22), px, py, gr, {gewicht: gross ? 650 : 560, alpha: zuGross * ein, dunkel});
          if(ok && R > (gross ? 230 : 170)) setze(mengenWort(g.q), px, py + gr * 1.15, klemme(gr * 0.5, 10.5, 13), {sans: true, alpha: zuGross * ein * 0.8, dunkel});
        }
        if(R >= 60) naechste.push(...g.kinder);
      }
      if(naechste.length) lauf(naechste, tiefe + 1); };
    // das Gewählte zuerst: sein Name weicht keinem anderen
    const tg = vonKnoten.get(gew);
    if(tg && tg.g && s < 34) setze(kuerze(gew.name, 40), B.zuX(tg.mx), B.zuY(tg.my) + 0.6 * s + 12, 12.5, {sans: true, gewicht: 600, dunkel: !!tg.g.unten});
    lauf(W.oben, 0);
    if(schweb && s < 34 && schweb.g) setze(kuerze(schweb.q.name, 40), B.zuX(schweb.mx), B.zuY(schweb.my) - 0.6 * s - 10, 12, {sans: true, immer: true, dunkel: !!schweb.g.unten});
  }

  baue(); B.rand = K.rand(); B.setze(B.blickAuf(rahmenVon(K.gewaehlt()), 1.04));
  return {zeige, ende: B.ende, neu: B.neu};
}
