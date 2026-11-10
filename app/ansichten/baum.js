/* Der Baum: was aus was gewachsen ist, und wie frisch es ist.

   Was nur der Baum erzählt: alles hat einen Stamm. Die Krone sind Ralfs Orte, jeder Ast eine App, jeder Quirl
   ein Werk, jedes Blatt eine Fassung. Bildfassungen tragen ihr eigenes Bild; bildlose Fassungen kleines Papier.
   Belegte Zeiten stehen in der Vorschau. Die Darstellung bleibt zweidimensional.
   Unter der Erde liegt, was trägt: das Tragwerk als Wurzelballen. Im Gras keimt, was noch geprüft wird. */

import {buehne, bildlager} from './buehne.js';
import {wachse, dicke} from './baum-wuchs.js';
import {mengenWort, zeitWort} from './inhalt.js';

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
    <li>Bildfrucht: das echte Bild einer Fassung, auch aus der Ferne</li>
    <li>Kleines Papierblatt: Fassung ohne Bild</li>
    <li>Blatt mit Anführungszeichen: ein Gespräch</li>
    <li>Unter der Erde: was trägt · im Gras: noch zur Prüfung</li>
  </ul>
  <p>Darüberfahren vergrößert. Ein Tipp wählt, der nächste öffnet. Ziehen verschiebt, zwei Finger oder das Rad kommen näher. Das belegte Alter steht bei der Vorschau; fehlende Zeit wird benannt.</p>`;

export function starte(el, K){
  let W, pf = null, pfSkala = 0, start = K.still ? -1e9 : performance.now(), fertig = false, schweb = null, ziel = null;
  let beschriftungen = [], hoverEnde = null;
  const vorschaubilder = new WeakMap();
  function vorschaubild(q){
    if(vorschaubilder.has(q)) return vorschaubilder.get(q);
    const bild=q.bild || (q.kinder || []).map(vorschaubild).find(Boolean) || null;
    vorschaubilder.set(q,bild); return bild;
  }
  const vonKnoten = new Map(), I = K.inhalt, spanne = Math.max(1, (I.bis ?? 1) - (I.von ?? 0));
  const lager = bildlager(K.bildUrl, 1600, 8);
  const B = buehne(el, {zeichne, tipp, schwebe, lebendig: () => !fertig, doppelklickZoom:false});
  lager.beiBild = B.neu;
  B.beiGroesse = () => { const hk = hochkant(); if(hk !== W.hochkant) baue(); B.rand = baumRand(); B.setze(B.blickAuf(rahmenVon(K.gewaehlt()))); };

  function hochkant(){ return B.h > B.w * 1.1; }
  function baue(){
    clearTimeout(hoverEnde); hoverEnde=null; schweb=null;
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
      band(o[i], [0, 0.6, 0.9, -H * 0.35, -0.9, -H * 0.7, 0, -H], t => Math.min(24 / B.s, dS * (.06 + 1.5 * Math.pow(1 - t, .8))), fS, br, vs, i === 0 && o[3]);
      if(W.dWurzel) band(u[i], [0, -0.4, 0, 1, 0, 2.5, 0, 3.6], t => Math.min(20 / B.s, dS * 1.25 + (W.dWurzel * 1.1 - dS * 1.25) * t), fS, br, vs, i === 0 && u[3]);
    });
    for(const g of W.alle){ if(!g.kurve) continue;
      const f = P >= 1 ? 1 : klemme((P * 1.12 - g.zeit * 0.85) / 0.12); if(f <= 0) continue;
      const w1 = dicke(g.last), e = g.eltern, w0 = e && e.last ? Math.min(dicke(e.last) * 0.72, w1 * 2.3) : w1 * 1.6;
      const ziel = g.unten ? u : o;
      lagen.forEach(([br, vs], i) => { if(i === 2 && w1 < 0.5) return; band(ziel[i], g.kurve, t => Math.min((12 - 5*t) / B.s, w0 + (w1 - w0) * sanft(t)), sanft(f), br, vs, i === 0 && ziel[3]); });
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
  function baumRand(){ const r = K.rand(); return {...r, oben:r.oben + 48}; }
  function zeige(k){ clearTimeout(hoverEnde); hoverEnde=null; schweb = null; B.rand = baumRand(); B.setze(B.blickAuf(rahmenVon(k), 1.12)); }

  const drin = (g, wx, wy) => g.rahmen ? wx >= g.rahmen.x0 && wx <= g.rahmen.x1 && wy >= g.rahmen.y0 && wy <= g.rahmen.y1 : (wx - g.x) ** 2 + (wy - g.y) ** 2 <= g.r * g.r;
  function treffer(px, py, vorschau = false){
    const namensTreffer = beschriftungen.find(f => px >= f.x && px <= f.x + f.w && py >= f.y && py <= f.y + f.h);
    if(namensTreffer) return {k:namensTreffer.g.q, t:namensTreffer.g};
    const wx = B.vonX(px), wy = B.vonY(py);
    if(B.s >= (vorschau ? 1 : 9)){ let best = null, bd = Math.max(0.62, (vorschau ? 5 : 18) / B.s) ** 2;
      for(const b of W.blaetter){ const d = (b.mx - wx) ** 2 + (b.my - wy) ** 2; if(d < bd){ bd = d; best = b; } }
      const gw = K.gewaehlt();   // ein Blatt wählt man erst, wenn man an seinem Werk ist (oder schon sehr nah)
      if(best && (vorschau || B.s >= 30 || best.g.q === gw || (gw && gw.eltern === best.g.q))) return {k: best.q, t: best}; }
    // eine Stufe nach der anderen: vom Gewählten aus geht ein Tipp genau eine Stufe tiefer, nie drei auf einmal
    const kette = []; let liste = W.oben;
    for(;;){ const g = liste.find(c => drin(c, wx, wy) && (c.rahmen ? c.r * 2 : c.r) * B.s >= 16); if(!g) break; kette.push(g); liste = g.kinder; }
    if(!kette.length) return null;
    const vor = new Set(); for(let q = K.gewaehlt(); q; q = q.eltern) vor.add(q);
    let i = 0; while(i < kette.length - 1 && vor.has(kette[i].q) && !kette[i].eigen) i++;
    while(i < kette.length - 1 && kette[i].r * B.s > Math.min(B.w, B.h) * 0.6) i++;   // was schon den Schirm füllt, ist kein Ziel mehr
    return {k: kette[i].q, t: kette[i]};
  }
  let grossRahmen = null;
  function tipp(px, py){
    if(grossRahmen && px >= grossRahmen.x && px <= grossRahmen.x + grossRahmen.w && py >= grossRahmen.y && py <= grossRahmen.y + grossRahmen.h){
      const q = grossRahmen.q; return q === K.gewaehlt() ? K.oeffne(q) : K.waehle(q);
    }
    const t = treffer(px, py); if(!t) return;
    if(t.k === K.gewaehlt() && !t.k.kinder) return K.oeffne(t.k);
    ziel = t.t.eigen ? t.t : null;
    if(t.k === K.gewaehlt()) zeige(t.k); else K.waehle(t.k);
  }
  function schwebe(px, py){
    if(grossRahmen && px >= grossRahmen.x && px <= grossRahmen.x + grossRahmen.w && py >= grossRahmen.y && py <= grossRahmen.y + grossRahmen.h){ clearTimeout(hoverEnde); hoverEnde=null; return; }
    const t = px < 0 ? null : treffer(px, py, true), neu = t ? t.t : null;
    if(neu === schweb){ clearTimeout(hoverEnde); hoverEnde=null; return; }
    if(schweb?.g && !neu?.g){
      if(hoverEnde===null) hoverEnde=setTimeout(()=>{hoverEnde=null;schweb=neu;B.c.style.cursor=neu?'pointer':'';B.neu();},300);
      return;
    }
    clearTimeout(hoverEnde); hoverEnde=null; schweb=neu;B.c.style.cursor=neu?'pointer':'';B.neu();
  }

  /* ---------- Zeichnen ---------- */
  // Dünne botanische Umrisse lassen die einzelnen Werke und ihre Bilder sichtbar.
  function laub(x, P){
    for(const g of W.alle){
      if(g.form !== 'quirl') continue;
      const r = (g.r + .65) * B.s, px = B.zuX(g.x), py = B.zuY(g.y);
      if(r < 3 || px+r < 0 || px-r > B.w || py+r < 0 || py-r > B.h) continue;
      x.beginPath(); x.ellipse(px,py,r,r*.9,g.x*.013,0,Math.PI*2);
      x.fillStyle = g.unten ? 'rgba(202,169,128,.08)' : 'rgba(110,139,85,.075)'; x.fill();
      x.strokeStyle = g.unten ? 'rgba(134,103,69,.17)' : 'rgba(76,111,57,.18)';
      x.lineWidth = .7; x.stroke();
    }
  }
  const zufall = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

  function grund(x){
    const {w,h} = B, y0 = B.zuY(0);
    const hg=x.createLinearGradient(0,0,0,h); hg.addColorStop(0,'#faf9f2'); hg.addColorStop(1,'#f0eddf');
    x.fillStyle=hg; x.fillRect(0,0,w,h);
    if(y0<h){
      x.fillStyle='#e8e0cf'; x.fillRect(0,Math.max(0,y0),w,h-y0);
      x.strokeStyle='#c3b59c'; x.lineWidth=1; x.beginPath(); x.moveTo(0,y0); x.lineTo(w,y0); x.stroke();
      x.fillStyle='rgba(116,92,63,.15)';
      for(let gx=0;gx<w;gx+=23) for(let gy=Math.max(0,y0)+12;gy<h;gy+=23){
        const d=zufall(gx,gy); if(d>.6) x.fillRect(gx+d*10,gy+d*6,1,1);
      }
    }
  }
  function gras(){}

  function zeichne(_, t){
    const x = B.x, {w, h, s} = B, dt = t - start, roh = B.ruhig() ? 1 : klemme(dt / 2900), P = 1 - (1 - roh) * (1 - roh);
    if(roh >= 1 && !fertig){ fertig = true; pf = aeste(1); }
    if(fertig && (!pf || Math.abs(pfSkala / s - 1) > .03)){ pf = aeste(1); pfSkala = s; }
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
    if(s > 7){ x.strokeStyle = 'rgba(70,52,36,.55)'; x.lineWidth = Math.min(1.4, Math.max(0.6, 0.05 * s)); x.beginPath(); const xu = new Path2D();
      for(const g of W.alle){ if(g.form !== 'quirl' || g.blaetter.length < 2) continue; const px = B.zuX(g.x), py = B.zuY(g.y), R = (g.r + 1) * s; if(px + R < 0 || px - R > w || py + R < 0 || py - R > h) continue;
        const ziel = g.unten ? xu : x; for(const b of g.blaetter){ ziel.moveTo(px, py); ziel.lineTo(B.zuX(b.x), B.zuY(b.y)); } }
      x.stroke(); x.strokeStyle = 'rgba(214,170,120,.5)'; x.stroke(xu); }

    // Fassungen tragen in jeder Entfernung ihren wirklichen Inhalt. Ohne Bild: Papier.
    const fruechte = [], rand = 1.2 * s;
    for(const b of W.blaetter){
      const px = B.zuX(b.mx), py = B.zuY(b.my);
      if(px < -rand || px > w + rand || py < -rand || py > h + rand) continue;
      const pop = fertig ? 1 : klemme((P * 1.12 - b.g.zeit * 0.85 - 0.14) / 0.1);
      if(pop <= 0) continue;
      if(b.frucht){ fruechte.push({b, px, py, r: Math.max(2.5, 0.57 * s) * pop}); continue; }
      const pw = Math.max(1.5, s * 0.42) * pop, ph = pw * 1.3;
      x.save(); x.translate(px, py); x.rotate(b.a * 0.16);
      x.fillStyle = '#faf4e5'; x.fillRect(-pw / 2, -ph / 2, pw, ph);
      if(pw >= 4){
        x.strokeStyle = b.unten ? '#b79d73' : '#738166'; x.lineWidth = Math.max(0.5, pw * 0.035); x.strokeRect(-pw / 2, -ph / 2, pw, ph);
        x.strokeStyle = '#b1a48c'; x.lineWidth = Math.max(0.4, pw * 0.025);
        for(let j = 0; j < 3; j++){ x.beginPath(); x.moveTo(-pw * .3, -ph * .2 + j * ph * .19); x.lineTo(pw * .26, -ph * .2 + j * ph * .19); x.stroke(); }
      }
      if(b.bluete && pw > 9){ x.font = `${pw * .7}px ${SERIF}`; x.textAlign = 'center'; x.fillStyle = TINTE; x.fillText('“', 0, 0); }
      x.restore();
    }
    for(const {b, px, py, r} of fruechte){
      const e = lager.nimm(b.q.bild, r * 2 * B.dpr > 260 ? 960 : 240) || lager.nimm(b.q.bild, 240);
      x.save(); x.beginPath(); x.roundRect(px-r*1.16, py-r*.83, r*2.32, r*1.66, Math.min(3,r*.13));
      x.fillStyle = PAPIER; x.fill(); x.clip();
      if(e){ const im = e.bild, f = Math.max(2.32 * r / im.naturalWidth, 1.66 * r / im.naturalHeight);
        x.drawImage(im, px - im.naturalWidth * f / 2, py - im.naturalHeight * f / 2, im.naturalWidth * f, im.naturalHeight * f);
      } else if(r >= 14){ x.fillStyle = '#756a57'; x.font = `11px ${SANS}`; x.textAlign = 'center'; x.fillText('Bild lädt', px, py + 4); }
      x.restore(); x.strokeStyle = '#faf4e5'; x.lineWidth = Math.max(.45, Math.min(2, r * .045)); x.beginPath(); x.roundRect(px-r*1.16, py-r*.83, r*2.32, r*1.66, Math.min(3,r*.13)); x.stroke();
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
        x.save(); x.beginPath(); x.rect(0, 0, w, y0); x.clip(); x.fillStyle = 'rgba(246,240,226,.82)'; x.fill(schleier, 'evenodd'); x.restore();
        x.save(); x.beginPath(); x.rect(0, y0, w, h - y0); x.clip(); x.fillStyle = 'rgba(238,231,217,.85)'; x.fill(schleier, 'evenodd'); x.restore();
        for(const tt of stellen){ const p = new Path2D(); kreis(p, tt); x.strokeStyle = unterErde(tt) ? 'rgba(117,82,39,.75)' : 'rgba(255,255,255,.9)'; x.lineWidth = tt === haupt ? 1.6 : 1.2; x.setLineDash(tt === haupt ? [] : [2, 5]);
          x.shadowColor = 'rgba(43,36,28,.35)'; x.shadowBlur = 10; x.stroke(p); x.shadowColor = 'transparent'; x.shadowBlur = 0; x.setLineDash([]); }
      }
    }
    if(schweb && vonKnoten.get(gew) !== schweb){ const p = new Path2D(); kreis(p, schweb); x.strokeStyle = unterErde(schweb) ? 'rgba(117,82,39,.55)' : 'rgba(43,36,28,.4)'; x.lineWidth = 1.2; x.stroke(p); }

    schrift(x, P, gew);
    grossRahmen = null;
    const vorschau = schweb?.g ? schweb : vonKnoten.get(gew);
    if(vorschau?.g) gross(x, vorschau);
  }

  function gross(x, b){
    const r = baumRand(), links = r.links + 12, rechts = B.w - r.rechts - 12, oben = r.oben + 12, unten = B.h - r.unten - 12;
    const breit = Math.min(300, rechts - links), bildH = b.q.bild ? Math.min(210, (unten - oben) * .53) : 52;
    if(breit < 110 || unten - oben < 170) return;
    const hoch = bildH + 102, px = B.zuX(b.mx), py = B.zuY(b.my);
    const xx = klemme(px + 22, links, rechts - breit), yy = klemme(py - hoch / 2, oben, unten - hoch);
    x.save(); x.shadowColor = 'rgba(37,29,20,.26)'; x.shadowBlur = 24; x.shadowOffsetY = 8;
    x.fillStyle = '#fffaf0'; x.beginPath(); x.roundRect(xx, yy, breit, hoch, 12); x.fill();
    x.shadowColor = 'transparent'; x.strokeStyle = b.q === K.gewaehlt() ? '#8d6c31' : '#d8cbb4'; x.lineWidth = b.q === K.gewaehlt() ? 2 : 1; x.stroke();
    x.fillStyle = '#eee8db'; x.fillRect(xx + 10, yy + 10, breit - 20, bildH);
    if(b.q.bild){ const e = lager.nimm(b.q.bild, 960) || lager.nimm(b.q.bild, 240);
      if(e){ const im = e.bild, f = Math.min((breit - 20) / im.naturalWidth, bildH / im.naturalHeight);
        x.drawImage(im, xx + breit / 2 - im.naturalWidth * f / 2, yy + 10 + bildH / 2 - im.naturalHeight * f / 2, im.naturalWidth * f, im.naturalHeight * f);
      } else { x.font = `12px ${SANS}`; x.fillStyle = '#6e6556'; x.textAlign = 'center'; x.fillText('Bild wird geladen …', xx + breit / 2, yy + bildH / 2); }
    } else { x.font = `14px ${SERIF}`; x.fillStyle = '#6e6556'; x.textAlign = 'center'; x.fillText(b.bluete ? 'Gespräch · ohne Bild' : 'Fassung ohne Bild', xx + breit / 2, yy + 41); }
    x.textAlign = 'left'; x.textBaseline = 'top'; x.fillStyle = TINTE; x.font = `600 15px ${SERIF}`;
    const woerter = b.q.name.split(/\s+/), zeilen = []; let zeile = '';
    for(const wort of woerter){ const naechste = zeile ? zeile + ' ' + wort : wort;
      if(x.measureText(naechste).width > breit - 28 && zeile){ zeilen.push(zeile); zeile = wort; } else zeile = naechste;
    } zeilen.push(zeile);
    zeilen.slice(0, 2).forEach((z, i) => { let text = z; if(i === 1 && zeilen.length > 2) text += '…'; while(x.measureText(text).width > breit - 28) text = text.slice(0, -2) + '…'; x.fillText(text, xx + 14, yy + bildH + 21 + i * 18); });
    x.font = `11px ${SANS}`; x.fillStyle = '#766b5c'; x.fillText(zeitWort(b.q), xx + 14, yy + hoch - 37);
    x.fillStyle = '#5b6747'; x.fillText(b.q === K.gewaehlt() ? 'Noch einmal tippen: öffnen' : 'Tippen: diese Fassung wählen', xx + 14, yy + hoch - 20);
    x.restore(); grossRahmen = {q:b.q, x:xx, y:yy, w:breit, h:hoch};
  }

  /* Namen: das Große von weitem, das Kleine von nah; nie zwei übereinander */
  const breiten = new Map();
  function schrift(x, P, gew){
    const {w, h, s} = B, belegt = [], kurz = Math.min(w, h); beschriftungen = [];
    const setze = (text, px, py, gr, o = {}) => {
      if(!text) return false; const font = `${o.gewicht || 500} ${o.kursiv ? 'italic ' : ''}${gr.toFixed(1)}px ${o.sans ? SANS : SERIF}`;
      const key = font + text; let br = breiten.get(key); if(br == null){ x.font = font; br = x.measureText(text).width; if(breiten.size > 4000) breiten.clear(); breiten.set(key, br); }
      const hh = gr * 1.25, x0 = px - br / 2 - 4, y0 = py - hh / 2;
      if(!o.immer){ if(x0 > w - br * 0.25 || x0 + br * 0.75 < 0 || y0 > h || y0 + hh < 0) return false;
        for(const r of belegt) if(x0 < r[2] && x0 + br + 8 > r[0] && y0 < r[3] && y0 + hh > r[1]) return false; }
      belegt.push([x0, y0, x0 + br + 8, y0 + hh]);
      x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.globalAlpha = o.alpha ?? 1; x.lineJoin = 'round';
      x.fillStyle = 'rgba(250,248,238,.94)'; x.beginPath(); x.roundRect(x0-2,y0-3,br+12,hh+6,4); x.fill();
      x.fillStyle = TINTE; x.fillText(text, px, py); x.globalAlpha = 1; return true;
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
        if(!gross && R >= 30 && zuGross > 0 && !(R > 90 && vorfahren.has(g.q) && !g.eigen)){
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
    // Die sieben Orte bekommen auch in der Gesamtübersicht einen lesbaren Namen.
    const rand = baumRand(), plaetze = [];
    for(const g of W.oben.slice().sort((a,b)=>a.y-b.y)){
      const ax=B.zuX(g.x), ay=B.zuY(g.y), rad=(g.rahmen ? (g.rahmen.x1-g.rahmen.x0)/2 : g.r)*s;
      if(ax+rad<rand.links || ax-rad>w-rand.rechts || ay+rad<rand.oben || ay-rad>h-rand.unten) continue;
      if(rad>Math.min(w,h)*.65) continue;
      const name=g.keime ? 'Zur Prüfung' : g.q.name;
      x.font=`600 ${w<600 ? 12 : 14}px ${SANS}`;
      const bild=vorschaubild(g.q), mini=!!bild, bw=Math.min(w-rand.links-rand.rechts-12,x.measureText(name).width+(mini?48:20)), bh=36;
      const xx=klemme(ax-bw/2,rand.links+6,w-rand.rechts-bw-6);
      let yy=klemme(g.unten && g.rahmen ? B.zuY(g.rahmen.y1)+8 : ay+rad*.74,rand.oben+6,h-rand.unten-bh-6);
      for(let n=0;n<14;n++){
        const collision=plaetze.some(f=>xx<f.x+f.w+4&&xx+bw+4>f.x&&yy<f.y+f.h+5&&yy+bh+5>f.y);
        if(!collision) break;
        yy+=bh+6; if(yy+bh>h-rand.unten-6) yy=ay-rad*.74-bh-n*7;
      }
      x.strokeStyle='#99a083'; x.lineWidth=.8; x.beginPath(); x.moveTo(ax,ay); x.lineTo(xx+bw/2,yy+bh/2); x.stroke();
      x.fillStyle='#faf8ed'; x.beginPath(); x.roundRect(xx,yy,bw,bh,6); x.fill(); x.strokeStyle='#b8bea6'; x.stroke();
      if(mini){ const e=lager.nimm(bild,240); if(e){const im=e.bild,f=Math.max(30/im.naturalWidth,28/im.naturalHeight); x.save();x.beginPath();x.roundRect(xx+4,yy+4,30,28,3);x.clip();x.drawImage(im,xx+19-im.naturalWidth*f/2,yy+18-im.naturalHeight*f/2,im.naturalWidth*f,im.naturalHeight*f);x.restore();}}
      x.fillStyle=TINTE; x.textAlign='left'; x.textBaseline='middle'; x.fillText(name,xx+(mini?40:10),yy+18);
      const f={x:xx,y:yy,w:bw,h:bh,g}; plaetze.push(f);beschriftungen.push(f);belegt.push([xx,yy,xx+bw,yy+bh]);
    }
    lauf(W.oben, 0);
    if(schweb && s < 34 && schweb.g) setze(kuerze(schweb.q.name, 40), B.zuX(schweb.mx), B.zuY(schweb.my) - 0.6 * s - 10, 12, {sans: true, immer: true, dunkel: !!schweb.g.unten});
  }

  const steuerung = document.createElement('div'); steuerung.className='baum-steuerung';
  steuerung.setAttribute('role','group'); steuerung.setAttribute('aria-label','Baum erkunden');
  const taste = (text, name, fn) => { const e=document.createElement('button'); e.type='button'; e.textContent=text; e.setAttribute('aria-label',name); e.title=name; e.onclick=fn; steuerung.append(e); };
  const zoom = f => { schweb=null; B.setze({cx:B.cx,cy:B.cy,s:Math.max(B.sMin,Math.min(B.sMax,B.s*f))}); };
  taste('−','Weiter weg',()=>zoom(1/1.5)); taste('+','Näher heran',()=>zoom(1.5));
  taste('Ganzer Baum','Den ganzen Baum zeigen',()=>K.waehle(I.wurzel));
  el.append(steuerung);
  baue(); B.rand = baumRand(); B.setze(B.blickAuf(rahmenVon(K.gewaehlt()), 1.04));
  return {zeige, ende: () => { clearTimeout(hoverEnde); lager.beiBild=null; steuerung.remove(); B.ende(); }, neu: B.neu};
}
