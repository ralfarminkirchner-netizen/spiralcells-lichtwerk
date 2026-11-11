/* Kosmos — das Ganze und seine Maßstäbe.

   Jeder Kreis enthält, was zu ihm gehört: das Ganze die Orte, ein Ort seine Apps, eine App ihre Werke,
   ein Werk seine Fassungen. Die Fläche eines Kreises ist die Zahl seiner Fassungen und Gespräche —
   das ist die einzige Aussage der Größe. Die Lage innerhalb eines Kreises ist Packung, keine Nähe.
   Antworten: Was gehört zum Ganzen? Wo bin ich (Maßstab, Übersicht)? Was liegt außerhalb meines Blicks
   (Wegweiser am Rand)? Wie komme ich zu einem Werk (hinein tippen, Kreis um Kreis)? */

import {buehne, bildlager} from './buehne.js';
import {el, knopf, farbe, titelBild, papier, bildRahmen, platzhalter, kuerze, n, SERIF, SANS} from './gemein.js';
import {zoomKnoepfe, tasten, trefferliste, schild} from './buehnenhilfe.js';
import {wegZu, ARTWORT} from './inhalt.js';

export const legende = `<p>Jeder Kreis enthält, was zu ihm gehört: Orte → Apps → Werke → Fassungen.</p>
<p>Die <b>Fläche</b> eines Kreises zeigt die Zahl seiner Fassungen. Die Lage im Kreis ist nur Packung, keine Nähe.</p>
<p>Fassungen sind die kleinsten Kreise: mit Bild als Bild, ohne Bild als Blatt Papier.</p>
<p><b>Wegweiser</b> am Rand zeigen, was außerhalb des Blicks liegt. Die kleine Übersicht unten rechts zeigt, wo du im Ganzen bist.</p>
<p>Tippen geht hinein. Esc oder der Weg oben geht hinaus.</p>`;

/* Kreise packen: der größte zuerst, jeder folgende so nah an der Mitte wie möglich, berührend, ohne Überlappung */
function packe(kreise){
  if(!kreise.length) return 0;
  kreise.sort((a, b) => b.r - a.r);
  const gesetzt = [];
  const frei = (x, y, r) => { for(const c of gesetzt){ const d = Math.hypot(x - c.x, y - c.y); if(d < r + c.r - 1e-6) return false; } return true; };
  for(const c of kreise){
    if(!gesetzt.length){ c.x = 0; c.y = 0; gesetzt.push(c); continue; }
    if(gesetzt.length === 1){ const a = gesetzt[0]; c.x = a.r + c.r; c.y = 0; gesetzt.push(c); continue; }
    let best = null, bd = Infinity;
    const n = gesetzt.length, grenze = Math.min(n, 60);
    for(let i = 0; i < n; i++) for(let j = Math.max(0, i - grenze); j < i; j++){
      const a = gesetzt[i], b = gesetzt[j], ra = a.r + c.r, rb = b.r + c.r, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if(d > ra + rb || d < Math.abs(ra - rb) || d === 0) continue;
      const aa = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - aa * aa)), mx = a.x + aa * dx / d, my = a.y + aa * dy / d;
      for(const s of [1, -1]){ const x = mx + s * h * dy / d, y = my - s * h * dx / d, dd = x * x + y * y;
        if(dd < bd && frei(x, y, c.r)){ bd = dd; best = [x, y]; } }
    }
    if(!best){ const R = Math.max(...gesetzt.map(g => Math.hypot(g.x, g.y) + g.r)); best = [R + c.r, 0]; }
    c.x = best[0]; c.y = best[1]; gesetzt.push(c);
  }
  // Schwerpunkt in die Mitte, umschließender Radius
  const mx = gesetzt.reduce((s, c) => s + c.x * c.r * c.r, 0) / gesetzt.reduce((s, c) => s + c.r * c.r, 0), my = gesetzt.reduce((s, c) => s + c.y * c.r * c.r, 0) / gesetzt.reduce((s, c) => s + c.r * c.r, 0);
  for(const c of gesetzt){ c.x -= mx; c.y -= my; }
  return Math.max(...gesetzt.map(c => Math.hypot(c.x, c.y) + c.r));
}
/* Gleich große Kreise (Fassungen) dicht in einem Kreis: Sonnenblumen-Ordnung, innen das Früheste */
function sonnenblume(kreise, r){
  kreise.forEach((c, i) => { const rr = r * 1.06 * Math.sqrt(i + 0.5), w = i * 2.39996; c.x = Math.cos(w) * rr; c.y = Math.sin(w) * rr; });
  return kreise.length ? r * 1.06 * Math.sqrt(kreise.length) + r : r;
}

export function starte(flaeche, K){
  const I = K.inhalt, W = I.wurzel, R1 = 10;   // Radius einer Fassung
  // Aufbau von innen nach außen: lokale Lage je Knoten, dann absolute Lage
  (function lege(k){
    if(!k.kinder){ k._kr = R1; return; }
    const blaetter = k.kinder.filter(c => !c.kinder).sort((a, b) => (a.von == null) - (b.von == null) || (a.von ?? 0) - (b.von ?? 0));
    const aeste = k.kinder.filter(c => c.kinder);
    for(const c of aeste) lege(c);
    for(const b of blaetter) b._kr = R1;
    const kreise = aeste.map(c => ({k: c, r: c._kr}));
    if(blaetter.length){ const bl = blaetter.map(b => ({k: b, r: R1})); const rb = sonnenblume(bl, R1); kreise.push({k: null, r: rb, bl}); }
    const r = packe(kreise) * 1.05 + (k.art === 'wurzel' ? 30 : 6);
    k._kinderLage = kreise; k._kr = r;
  })(W);
  (function absolut(k, x, y){
    k._kx = x; k._ky = y;
    for(const c of k._kinderLage || []){
      if(c.k) absolut(c.k, x + c.x, y + c.y);
      else for(const b of c.bl){ b.k._kx = x + c.x + b.x; b.k._ky = y + c.y + b.y; }
    }
  })(W, 0, 0);
  const sichtbarAlle = I.alle.filter(k => k._kx != null);

  const lager = bildlager(K.bildUrl, 700, 8);
  const T = trefferliste(), sch = schild(flaeche);
  let gew = W, fokus = W, schwebend = null;
  const B = buehne(flaeche, {zeichne, tipp, schwebe, doppelklickZoom: false});
  B.randVon = K.rand;
  B.sMin = 0.02; B.sMax = 40;
  lager.beiBild = () => B.neu();
  zoomKnoepfe(flaeche, B, () => K.waehle(W), 'Das Ganze');
  tasten(flaeche, K);

  const masstab = el('div', 'kmasstab'); masstab.setAttribute('aria-live', 'polite'); flaeche.append(masstab);
  const sichtbar = k => !K.suche.treffer || K.istTreffer(k);

  function zeichne(B){
    const x = B.x; T.leer();
    x.fillStyle = '#ece6d8'; x.fillRect(0, 0, B.w, B.h);
    const P = platzhalter();
    kreis(W, P, 0);
    wegweiser(P);
    uebersicht();
  }
  const imBild = (sx, sy, r) => sx + r > 0 && sx - r < B.w && sy + r > 0 && sy - r < B.h;

  function kreis(k, P, tiefe){
    const sx = B.zuX(k._kx), sy = B.zuY(k._ky), r = k._kr * B.s;
    if(!imBild(sx, sy, r) || r < 1.5) return;
    const x = B.x, f = farbe(k), blatt = !k.kinder, inPfad = wegZu(gew).includes(k);
    x.globalAlpha = sichtbar(k) ? 1 : 0.25;
    if(blatt){
      if(r >= 5 && k.bild){ const e = lager.nimm(k.bild, r * 2 * B.dpr > 260 ? 960 : 240);
        x.save(); x.beginPath(); x.arc(sx, sy, r, 0, 7); x.clip();
        if(e) bildRahmen(x, e.bild, sx - r, sy - r, 2 * r, 2 * r); else { x.fillStyle = f.h; x.fill(); }
        x.restore(); x.strokeStyle = '#fff'; x.lineWidth = Math.min(3, r * .12); x.beginPath(); x.arc(sx, sy, r, 0, 7); x.stroke(); }
      else if(k.art === 'gespraech'){ x.fillStyle = '#fff'; x.strokeStyle = f.d; x.lineWidth = 1; x.beginPath(); x.arc(sx, sy, r, 0, 7); x.fill(); x.stroke();
        if(r > 8){ x.fillStyle = f.d; x.font = `${Math.min(r, 16)}px ${SANS}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('„“', sx, sy + r * .1); } }
      else { x.fillStyle = '#fbf8f1'; x.beginPath(); x.arc(sx, sy, r, 0, 7); x.fill(); x.strokeStyle = 'rgba(60,45,30,.3)'; x.lineWidth = 1; x.stroke();
        if(r > 6) papier(x, sx - r * .42, sy - r * .55, r * .84, r * 1.1, f.f); }
      if(k.von == null && r > 12){ x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(sx + r * .62, sy - r * .62, Math.max(5, r * .2), 0, 7); x.fill(); x.fillStyle = f.d; x.font = `600 ${Math.max(9, r * .26)}px ${SANS}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', sx + r * .62, sy - r * .6); }
      if(gew.schluessel === k.schluessel){ x.globalAlpha = 1; x.strokeStyle = '#c2410c'; x.lineWidth = 3; x.beginPath(); x.arc(sx, sy, r + 4, 0, 7); x.stroke(); }
      T.kreis(k, sx, sy, Math.max(r, 6));
      if(r > 44){ x.font = `${Math.min(14, r * .16)}px ${SANS}`; x.textAlign = 'center'; x.textBaseline = 'top'; const t = kuerze(x, k.name, r * 1.8), tw = x.measureText(t).width;
        x.fillStyle = 'rgba(251,248,241,.94)'; x.fillRect(sx - tw / 2 - 4, sy + r + 4, tw + 8, 18); x.fillStyle = '#2b241b'; x.fillText(t, sx, sy + r + 6); }
      x.globalAlpha = 1; return;
    }
    // Behälter: Fläche in der Farbe des Orts, nach innen heller
    const grund = k.art === 'wurzel' ? '#f6f2e9' : k.art === 'ort' ? f.h : k.art === 'bereich' ? '#fbf8f1' : tiefe % 2 ? '#fdfbf6' : '#f7f2e8';
    x.fillStyle = grund; x.beginPath(); x.arc(sx, sy, r, 0, 7); x.fill();
    x.strokeStyle = inPfad ? '#3a2d1f' : k.art === 'ort' ? f.f : 'rgba(80,65,45,.32)'; x.lineWidth = inPfad ? 2.2 : k.art === 'ort' ? 2 : 1; x.stroke();
    if(k !== W && (gew === k || gew.schluessel === k.schluessel)){ x.strokeStyle = '#c2410c'; x.lineWidth = 3; x.beginPath(); x.arc(sx, sy, r + 3, 0, 7); x.stroke(); }
    T.kreis(k, sx, sy, r, 0);
    x.globalAlpha = 1;
    // Name zuerst reservieren (er gehört dem größeren Kreis), dann der Inhalt, dann der Name obenauf
    let schild = null;
    if(k.art !== 'wurzel' && r > 22){
      const ort = k.art === 'ort', gr = ort ? Math.max(14, Math.min(28, r * .12)) : Math.max(12, Math.min(18, r * .1));
      x.font = `${ort ? 600 : 500} ${gr}px ${ort ? SERIF : SANS}`;
      const t = kuerze(x, k.name, Math.max(70, Math.min(r * 1.5, 320))), tw = x.measureText(t).width;
      const ly = r > 120 ? sy - r + gr * 1.2 : sy - r - gr * .7;
      const rr = {x0: sx - tw / 2 - 6, y0: ly - gr * .75, x1: sx + tw / 2 + 6, y1: ly + gr * .75};
      if(P.versuch(rr)) schild = {t, rr, ly, gr, ort};
    }
    // Inhalt: ab genug Größe die Kinder, sonst ein echtes Bild für den ganzen Kreis
    if(r > 64) for(const c of k._kinderLage){ if(c.k) kreis(c.k, P, tiefe + 1); else for(const b of c.bl) kreis(b.k, P, tiefe + 1); }
    else if(r > 5){ const b = titelBild(k), e = b ? lager.nimm(b, r * 2 * B.dpr > 260 ? 960 : 240) : null;
      x.save(); x.globalAlpha = sichtbar(k) ? 1 : .25; x.beginPath(); x.arc(sx, sy, r * .86, 0, 7); x.clip();
      if(e) bildRahmen(x, e.bild, sx - r, sy - r, 2 * r, 2 * r); else if(!b) papier(x, sx - r * .4, sy - r * .5, r * .8, r, f.f);
      x.restore(); x.globalAlpha = 1;
      if(r > 14){ x.fillStyle = 'rgba(34,29,23,.78)'; const z = String(k.fassungen); x.font = `600 ${Math.min(13, r * .3)}px ${SANS}`; const zw = x.measureText(z).width + 8;
        x.beginPath(); x.roundRect ? x.roundRect(sx - zw / 2, sy + r * .55, zw, Math.min(17, r * .4), 6) : x.rect(sx - zw / 2, sy + r * .55, zw, 16); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(z, sx, sy + r * .55 + Math.min(17, r * .4) / 2 + .5); } }
    if(schild){ const {t, rr, ly, ort} = schild;
      x.globalAlpha = sichtbar(k) ? 1 : .35;
      x.font = `${ort ? 600 : 500} ${schild.gr}px ${ort ? SERIF : SANS}`;
      x.fillStyle = 'rgba(251,248,241,.93)'; x.beginPath(); x.roundRect ? x.roundRect(rr.x0, rr.y0, rr.x1 - rr.x0, rr.y1 - rr.y0, 6) : x.rect(rr.x0, rr.y0, rr.x1 - rr.x0, rr.y1 - rr.y0); x.fill();
      x.fillStyle = ort ? f.d : '#2b241b'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, sx, ly + 1);
      x.globalAlpha = 1; T.rechteck(k, rr.x0, rr.y0, rr.x1 - rr.x0, rr.y1 - rr.y0, 0); }
  }

  /* Was außerhalb des Blicks liegt: Geschwister des Fokus und seiner Eltern, als Wegweiser am Rand */
  function wegweiser(P){
    const x = B.x, rand = 14, nah = new Set();
    for(let q = fokus; q && q.eltern; q = q.eltern) for(const c of q.eltern.kinder) if(c.kinder && c !== q) nah.add(c);
    const cx = B.w / 2, cy = B.h / 2;
    for(const k of [...nah].slice(0, 40)){
      const sx = B.zuX(k._kx), sy = B.zuY(k._ky), r = k._kr * B.s;
      if(sx + r > 0 && sx - r < B.w && sy + r > 0 && sy - r < B.h) continue;
      const dx = sx - cx, dy = sy - cy, t = Math.min((B.w / 2 - rand - 60) / Math.abs(dx || 1e-9), (B.h / 2 - rand - 16) / Math.abs(dy || 1e-9));
      const px = cx + dx * t, py = cy + dy * t, f = farbe(k);
      x.font = `500 12.5px ${SANS}`; const name = kuerze(x, k.name, 150), tw = x.measureText(name).width + 22;
      const box = {x0: px - tw / 2, y0: py - 13, x1: px + tw / 2, y1: py + 13};
      if(!P.versuch(box)) continue;
      x.fillStyle = 'rgba(251,248,241,.96)'; x.strokeStyle = f.f; x.lineWidth = 1.5; x.beginPath(); x.roundRect ? x.roundRect(box.x0, box.y0, tw, 26, 13) : x.rect(box.x0, box.y0, tw, 26); x.fill(); x.stroke();
      const w = Math.atan2(dy, dx); x.save(); x.translate(box.x0 + 11, py); x.rotate(w); x.fillStyle = f.d; x.beginPath(); x.moveTo(5, 0); x.lineTo(-3, -4); x.lineTo(-3, 4); x.fill(); x.restore();
      x.fillStyle = f.d; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(name, box.x0 + 19, py + 1);
      T.rechteck(k, box.x0, box.y0, tw, 26, 2);
    }
  }
  /* Kleine Übersicht: das Ganze mit dem Rahmen des Blicks */
  function uebersicht(){
    if(fokus === W && B.s * W._kr * 2 < Math.min(B.w, B.h) * 1.3) return;
    const x = B.x, g = K.schmal() ? 92 : 128, pad = 12, ox = B.w - g - pad, oy = K.schmal() ? 118 : B.h - g - pad, sk = g / (W._kr * 2.1);
    x.fillStyle = 'rgba(251,248,241,.94)'; x.strokeStyle = 'rgba(40,30,20,.25)'; x.lineWidth = 1; x.beginPath(); x.roundRect ? x.roundRect(ox, oy, g, g, 10) : x.rect(ox, oy, g, g); x.fill(); x.stroke();
    const mx = ox + g / 2, my = oy + g / 2;
    for(const o of W.kinder.filter(c => c.kinder)){ const f = farbe(o); x.fillStyle = f.h; x.strokeStyle = f.f; x.beginPath(); x.arc(mx + o._kx * sk, my + o._ky * sk, Math.max(2, o._kr * sk), 0, 7); x.fill(); x.stroke(); }
    const vx0 = B.vonX(0), vy0 = B.vonY(0), vx1 = B.vonX(B.w), vy1 = B.vonY(B.h);
    x.strokeStyle = '#c2410c'; x.lineWidth = 2; x.strokeRect(mx + vx0 * sk, my + vy0 * sk, Math.max(3, (vx1 - vx0) * sk), Math.max(3, (vy1 - vy0) * sk));
    T.rechteck(W, ox, oy, g, g, 0);
  }

  function zeigeMasstab(){
    const k = fokus, ganz = W.fassungen + W.gespraeche, hier = k.fassungen + k.gespraeche;
    const stufen = ['Das Ganze', 'Ort', 'App oder Bereich', 'Werk', 'Fassung'];
    const stufe = k.art === 'wurzel' ? 0 : k.art === 'ort' ? 1 : (k.art === 'app' || k.art === 'bereich') ? 2 : k.art === 'werk' ? 3 : 4;
    masstab.replaceChildren();
    const ol = el('ol'); stufen.forEach((s, i) => { const li = el('li', i === stufe ? 'an' : i < stufe ? 'vorbei' : '', s); ol.append(li); });
    masstab.append(ol);
    masstab.append(el('p', '', k.kinder ? `${n(hier, 'Fassung', 'Fassungen')} in diesem Kreis · ${(100 * hier / ganz).toLocaleString('de-DE', {maximumFractionDigits: 1})} % des Ganzen` : 'Eine Fassung · ein Kreis'));
  }

  function blick(k, sofort){
    const r = k._kr * (k.kinder ? 1.06 : 4);
    const ziel = B.blickAuf({x0: k._kx - r, y0: k._ky - r, x1: k._kx + r, y1: k._ky + r}, 1.02);
    if(sofort || K.still) B.setze(ziel); else B.fliege(ziel, 650);
  }
  function tipp(px, py){
    const k = T.finde(px, py); if(!k) return;
    if(k === K.gewaehlt() && !k.kinder) return K.oeffne(k);
    K.waehle(k, {vonAnsicht: true});
  }
  function schwebe(px, py){
    const k = px < 0 ? null : T.finde(px, py);
    if(k !== schwebend){ schwebend = k; flaeche.style.cursor = k ? 'pointer' : ''; }
    if(k && k !== W) sch.zeige(k.name + ' · ' + (k.kinder ? n(k.fassungen, 'Fassung', 'Fassungen') : ARTWORT[k.art]), px, py); else sch.weg();
  }
  return {
    zeige(k, sofort, vonAnsicht){
      gew = k; fokus = k.kinder ? k : (k.eltern || W);
      zeigeMasstab();
      if(vonAnsicht && !k.kinder){ B.neu(); return; }
      blick(fokus === k ? k : fokus, sofort);
    },
    suche(){ B.neu(); },
    groesse(){ B.neu(); },
    ende(){ B.ende(); }
  };
}
