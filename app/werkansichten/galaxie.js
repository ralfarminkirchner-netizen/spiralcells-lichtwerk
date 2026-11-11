/* Galaxie — Beziehungen und Nachbarschaften.

   Sterne sind Werke und Apps (dasselbe Werk an mehreren Orten ist ein Stern). Linien sind Beziehungen:
   durchgezogen = im Fundus belegt (folgt auf, erweitert, remixt aus, verweist auf …),
   gestrichelt = berechnete Nähe (gleiches Gebiet, gleicher Quellbestand), nur auf Wunsch.
   Die Lage entsteht aus diesen Linien: belegte ziehen stark, berechnete schwach, und jeder Stern
   hängt leicht an seinem Ort. Abstand ist darum ein Hinweis, keine Messung.
   Brücken: Sterne, deren belegte Beziehungen in andere Orte reichen, oder die selbst an mehreren Orten liegen.
   Verfolgen: Wer einer Linie folgt, legt eine Spur; die Spur führt zurück zum Ausgang. */

import {buehne, bildlager} from './buehne.js';
import {el, knopf, farbe, titelBild, bildRahmen, platzhalter, kuerze, n, SERIF, SANS} from './gemein.js';
import {zoomKnoepfe, tasten, trefferliste, schild} from './buehnenhilfe.js';
import {BELEGT, BERECHNET} from './bezug.js';
import {wegZu} from './inhalt.js';

export const legende = `<p>Jeder Stern ist ein Werk oder eine App, mit seinem Bild. Ein Werk an mehreren Orten ist ein Stern. Die Fläche folgt der Zahl der Fassungen.</p>
<p><span class="z" style="background:#8fb8f0"></span><b>Durchgezogene Linie</b>: im Fundus belegte Beziehung. <span class="z" style="border:1.5px dashed #d8b25a"></span><b>Gestrichelt</b>: berechnete Nähe (gleiches Gebiet, gleicher Quellbestand), zuschaltbar.</p>
<p>Belegte Linien ziehen Sterne zusammen, berechnete nur schwach; jeder Stern hängt leicht an seinem Ort. <b>Abstand ist ein Hinweis, keine Messung.</b></p>
<p><b>Brücke</b> (heller Ring): reicht mit belegten Beziehungen in andere Orte oder liegt selbst an mehreren Orten.</p>
<p>Wähle einen Stern, dann einen Nachbarn: so entsteht eine <b>Spur</b>, die zum Ausgang zurückführt.</p>`;

export function starte(flaeche, K){
  const I = K.inhalt, W = I.wurzel;
  // Sterne: Werke und Apps mit eigenen Fassungen oder Gesprächen, je Schlüssel einmal
  const sterne = [], nachSchl = new Map();
  for(const k of I.alle){
    if(k.art !== 'werk' && k.art !== 'app') continue;
    if(!(k.kinder || []).some(c => !c.kinder)) continue;
    if(nachSchl.has(k.schluessel)) continue;
    const ort = wegZu(k)[1];
    const s = {k, ort, orte: new Set((I.nachSchluessel.get(k.schluessel) || [k]).map(q => wegZu(q)[1]).filter(Boolean)), nb: [], x: 0, y: 0, vx: 0, vy: 0};
    s.r = 7 + Math.sqrt(k.fassungen + k.gespraeche) * 2.6;
    sterne.push(s); nachSchl.set(k.schluessel, s);
  }
  const sternVon = k => { for(let q = k; q; q = q.eltern){ const s = nachSchl.get(q.schluessel); if(s) return s; } return null; };
  // Kanten zwischen Sternen
  const kanten = new Map();
  for(const e of K.bezug.kanten){
    const a = sternVon(e.von), b = sternVon(e.zu); if(!a || !b || a === b) continue;
    const key = a.k.nr < b.k.nr ? a.k.nr + '|' + b.k.nr : b.k.nr + '|' + a.k.nr;
    if(!kanten.has(key)) kanten.set(key, {a, b, belegt: 0, berechnet: 0, arten: new Map()});
    const z = kanten.get(key); if(e.belegt) z.belegt++; else z.berechnet++;
    z.arten.set(e.art, (z.arten.get(e.art) || 0) + 1);
  }
  const KANTEN = [...kanten.values()];
  for(const e of KANTEN){ e.a.nb.push(e); e.b.nb.push(e); }
  for(const s of sterne){ const fremde = new Set(s.nb.filter(e => e.belegt).map(e => (e.a === s ? e.b : e.a).ort).filter(o => o && o !== s.ort)); s.bruecke = fremde.size > 0 || s.orte.size > 1; s.fremdeOrte = fremde; }

  // Lage: Orte auf einem Ring, Sterne nach Beziehungen; feste Zufallsquelle, damit es immer gleich aussieht
  const orte = W.kinder.filter(o => o.kinder);
  const anker = new Map(); orte.forEach((o, i) => { const w = -Math.PI / 2 + i * 2 * Math.PI / orte.length; anker.set(o, [Math.cos(w) * 820, Math.sin(w) * 820]); });
  let saat = 7; const zufall = () => (saat = (saat * 16807) % 2147483647) / 2147483647;
  for(const s of sterne){ const [ax, ay] = anker.get(s.ort) || [0, 0]; s.x = ax + (zufall() - .5) * 300; s.y = ay + (zufall() - .5) * 300; }
  (function rechne(){
    const N = sterne.length;
    for(let it = 0; it < 320; it++){
      const t = 1 - it / 320, k2 = 2400;
      for(let i = 0; i < N; i++){ const a = sterne[i]; for(let j = i + 1; j < N; j++){ const b = sterne[j]; let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 1;
        if(d2 > 360000) continue; const f = k2 / d2, d = Math.sqrt(d2); dx /= d; dy /= d; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; } }
      for(const e of KANTEN){ const w = e.belegt ? 0.05 * Math.min(3, 1 + Math.log(e.belegt)) : 0.008, dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, d = Math.hypot(dx, dy) || 1, ruhe = e.a.r + e.b.r + 70, f = (d - ruhe) * w;
        e.a.vx += dx / d * f; e.a.vy += dy / d * f; e.b.vx -= dx / d * f; e.b.vy -= dy / d * f; }
      for(const s of sterne){ const [ax, ay] = anker.get(s.ort) || [0, 0]; s.vx += (ax - s.x) * 0.006; s.vy += (ay - s.y) * 0.006;
        const v = Math.hypot(s.vx, s.vy), m = 40 * t + 2; if(v > m){ s.vx *= m / v; s.vy *= m / v; } s.x += s.vx; s.y += s.vy; s.vx *= .55; s.vy *= .55; }
    }
    // Überlappungen lösen
    for(let it = 0; it < 40; it++) for(let i = 0; i < N; i++) for(let j = i + 1; j < N; j++){ const a = sterne[i], b = sterne[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, m = a.r + b.r + 6;
      if(d < m){ const p = (m - d) / 2; a.x -= dx / d * p; a.y -= dy / d * p; b.x += dx / d * p; b.y += dy / d * p; } }
  })();
  const ortMitte = new Map(); for(const o of orte){ const l = sterne.filter(s => s.ort === o); if(l.length) ortMitte.set(o, [l.reduce((a, s) => a + s.x, 0) / l.length, Math.min(...l.map(s => s.y - s.r)) - 30]); }
  const bb = sterne.reduce((b, s) => [Math.min(b[0], s.x - s.r), Math.min(b[1], s.y - s.r - 60), Math.max(b[2], s.x + s.r), Math.max(b[3], s.y + s.r)], [Infinity, Infinity, -Infinity, -Infinity]);
  const gesamt = {x0: bb[0], y0: bb[1], x1: bb[2], y1: bb[3]};

  // Bedienung: zuschalten, Spur
  let zeigBerechnet = false, gew = null, spur = [], schwebend = null;
  const lager = bildlager(K.bildUrl, 600, 8), T = trefferliste(), sch = schild(flaeche);
  const B = buehne(flaeche, {zeichne, tipp, schwebe});
  B.randVon = K.rand;
  B.sMin = 0.04; B.sMax = 8; lager.beiBild = () => B.neu();
  zoomKnoepfe(flaeche, B, () => B.fliege(B.blickAuf(gesamt, 1.04), 600), 'Alle Sterne');
  tasten(flaeche, K, (e, k) => {
    const s = sternVon(k); if(!s || !/^[nN]$/.test(e.key)) return false;
    const nb = s.nb.filter(x => x.belegt || zeigBerechnet); if(!nb.length) return true;
    const i = (spur.length > 1 ? nb.findIndex(x => (x.a === s ? x.b : x.a) === spur[spur.length - 2]) : -1) + 1;
    const z = nb[i % nb.length]; K.waehle((z.a === s ? z.b : z.a).k); e.preventDefault(); return true;
  });
  const leiste = el('div', 'gleiste');
  const tBel = knopf('knopf', 'Belegte Beziehungen', null); tBel.setAttribute('aria-pressed', 'true'); tBel.disabled = true;
  const tBer = knopf('knopf', 'Berechnete Nähe zeigen', () => { zeigBerechnet = !zeigBerechnet; tBer.setAttribute('aria-pressed', String(zeigBerechnet)); tBer.textContent = zeigBerechnet ? 'Berechnete Nähe ausblenden' : 'Berechnete Nähe zeigen'; B.neu(); });
  tBer.setAttribute('aria-pressed', 'false');
  const zahl = el('span', 'klein gzahl', `${n(sterne.length, 'Stern', 'Sterne')} · ${n(KANTEN.filter(e => e.belegt).length, 'belegte Verbindung', 'belegte Verbindungen')} · ${n(sterne.filter(s => s.bruecke).length, 'Brücke', 'Brücken')}`);
  leiste.append(tBer, zahl); flaeche.append(leiste);
  const spurEl = el('nav', 'gspur'); spurEl.setAttribute('aria-label', 'Spur'); flaeche.append(spurEl);

  const sichtbar = s => !K.suche.treffer || K.istTreffer(s.k) || [...(I.nachSchluessel.get(s.k.schluessel) || [])].some(K.istTreffer);
  const imBild = (sx, sy, r) => sx + r > -40 && sx - r < B.w + 40 && sy + r > -40 && sy - r < B.h + 40;

  function zeichne(B){
    const x = B.x, s = B.s; T.leer();
    x.fillStyle = '#17161d'; x.fillRect(0, 0, B.w, B.h);
    const g = gew, nachbarn = new Set(g ? g.nb.map(e => e.a === g ? e.b : e.a) : []);
    // Linien
    for(const e of KANTEN){
      const an = g && (e.a === g || e.b === g);
      if(!e.belegt && !zeigBerechnet && !an) continue;
      if(!e.belegt && !zeigBerechnet && an) { /* berechnete Nachbarn des Gewählten zeigen wir nur, wenn zugeschaltet */ continue; }
      const ax = B.zuX(e.a.x), ay = B.zuY(e.a.y), bx = B.zuX(e.b.x), by = B.zuY(e.b.y);
      if(Math.max(ax, bx) < 0 || Math.min(ax, bx) > B.w || Math.max(ay, by) < 0 || Math.min(ay, by) > B.h) continue;
      const leise = g && !an;
      if(e.belegt){ x.setLineDash([]); x.strokeStyle = an ? '#cfe1ff' : '#8fb8f0'; x.globalAlpha = leise ? .08 : an ? .95 : .38; x.lineWidth = (an ? 2.2 : 1.1) * Math.min(2.2, .8 + Math.log(1 + e.belegt) * .5); }
      else { x.setLineDash([5, 5]); x.strokeStyle = '#d8b25a'; x.globalAlpha = leise ? .05 : an ? .8 : .22; x.lineWidth = an ? 1.6 : .9; }
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
    }
    x.setLineDash([]); x.globalAlpha = 1;
    // Ortsnamen
    const P = platzhalter();
    for(const [o, [mx, my]] of ortMitte){ const f = farbe(o), sx = B.zuX(mx), sy = B.zuY(my); x.font = `600 ${Math.max(15, Math.min(30, 12 + s * 14))}px ${SERIF}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      const tw = x.measureText(o.name).width; P.nimm({x0: sx - tw / 2, y0: sy - 14, x1: sx + tw / 2, y1: sy + 14});
      x.fillStyle = f.h; x.globalAlpha = g ? .55 : .95; x.fillText(o.name, sx, sy); x.globalAlpha = 1; T.rechteck(o, sx - tw / 2, sy - 14, tw, 28, 0); }
    // Sterne
    const reihe = sterne.slice().sort((a, b) => (a === g) - (b === g) || nachbarn.has(a) - nachbarn.has(b) || a.r - b.r);
    for(const st of reihe){
      const sx = B.zuX(st.x), sy = B.zuY(st.y), r = Math.max(5, st.r * s); if(!imBild(sx, sy, r)) continue;
      const f = farbe(st.k), an = st === g, nb = nachbarn.has(st);
      x.globalAlpha = (!sichtbar(st) ? .18 : g && !an && !nb ? .35 : 1);
      const b = titelBild(st.k), e = b ? lager.nimm(b, r * 2 * B.dpr > 260 ? 960 : 240) : null;
      x.save(); x.beginPath(); x.arc(sx, sy, r, 0, 7); x.clip();
      if(e) bildRahmen(x, e.bild, sx - r, sy - r, 2 * r, 2 * r); else { x.fillStyle = '#f3eee3'; x.fill(); x.fillStyle = '#5d5448'; if(r > 12){ x.font = `${Math.min(11, r * .32)}px ${SANS}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ohne Bild', sx, sy); } }
      x.restore();
      x.lineWidth = an ? 3.5 : 2; x.strokeStyle = an ? '#ff8a4c' : f.f; x.beginPath(); x.arc(sx, sy, r + 1, 0, 7); x.stroke();
      if(st.bruecke){ x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 1.2; x.setLineDash([3, 3]); x.beginPath(); x.arc(sx, sy, r + 5, 0, 7); x.stroke(); x.setLineDash([]); }
      x.globalAlpha = 1;
      T.kreis(st.k, sx, sy, r + 3);
      // Namen: Gewählter, Nachbarn, große Sterne – ohne Überschneidung
      const wichtig = an || nb || r > 22 || (s > 1.2 && r > 9);
      if(wichtig){ x.font = `${an ? 600 : 500} ${an ? 14 : 12.5}px ${SANS}`; const t = kuerze(x, st.k.name, an ? 260 : 170), tw = x.measureText(t).width;
        const rr = {x0: sx - tw / 2 - 5, y0: sy + r + 5, x1: sx + tw / 2 + 5, y1: sy + r + 24};
        if(an || P.versuch(rr)){ if(an) P.nimm(rr); x.fillStyle = 'rgba(23,22,29,.86)'; x.fillRect(rr.x0, rr.y0, rr.x1 - rr.x0, rr.y1 - rr.y0); x.fillStyle = an ? '#ffd7bf' : '#efe9dc'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, sx, (rr.y0 + rr.y1) / 2 + .5); } }
    }
    // Art der Beziehung an den Linien des Gewählten
    if(g && s > 0.5) for(const e of g.nb){ if(!e.belegt && !zeigBerechnet) continue; const o = e.a === g ? e.b : e.a, mx = B.zuX((g.x + o.x) / 2), my = B.zuY((g.y + o.y) / 2);
      const wort = [...e.arten.keys()].map(a => (BELEGT[a] || BERECHNET[a]).wort).slice(0, 2).join(', '); x.font = `11.5px ${SANS}`; const tw = x.measureText(wort).width;
      const rr = {x0: mx - tw / 2 - 5, y0: my - 9, x1: mx + tw / 2 + 5, y1: my + 9}; if(!P.versuch(rr)) continue;
      x.fillStyle = e.belegt ? 'rgba(30,48,80,.95)' : 'rgba(70,56,20,.95)'; x.fillRect(rr.x0, rr.y0, rr.x1 - rr.x0, 18); x.fillStyle = e.belegt ? '#cfe1ff' : '#f2dca2'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(wort, mx, my + .5); }
  }

  function zeichneSpur(){
    spurEl.replaceChildren();
    if(spur.length < 2) { spurEl.hidden = true; return; }
    spurEl.hidden = false;
    spurEl.append(el('span', 'klein', 'Spur: '));
    spur.forEach((s, i) => { if(i) spurEl.append(el('span', 'pfeil', '→')); const b = knopf('marke', s.k.name, () => { spur = spur.slice(0, i + 1); K.waehle(s.k); }); b.style.setProperty('--ort', farbe(s.k).f); spurEl.append(b); });
    spurEl.append(knopf('knopf', 'Zurück zum Ausgang', () => { const a = spur[0]; spur = [a]; K.waehle(a.k); }));
  }
  function tipp(px, py){
    const k = T.finde(px, py); if(!k) return;
    K.waehle(k, {vonAnsicht: true});
  }
  function schwebe(px, py){
    const k = px < 0 ? null : T.finde(px, py);
    if(k !== schwebend){ schwebend = k; flaeche.style.cursor = k ? 'pointer' : ''; }
    if(k){ const s = sternVon(k); sch.zeige(k.name + (s && s.k === k ? ' · ' + n(s.nb.filter(e => e.belegt).length, 'belegte Verbindung', 'belegte Verbindungen') : ''), px, py); } else sch.weg();
  }
  return {
    zeige(k, sofort, vonAnsicht){
      const s = k.art === 'ort' || k.art === 'wurzel' || k.art === 'bereich' ? null : sternVon(k);
      const vorher = gew; gew = s;
      if(s){ const letzte = spur[spur.length - 1];
        if(letzte && letzte !== s && letzte.nb.some(e => e.a === s || e.b === s)) { const i = spur.indexOf(s); spur = i >= 0 ? spur.slice(0, i + 1) : [...spur, s]; }
        else if(!spur.includes(s)) spur = [s]; else spur = spur.slice(0, spur.indexOf(s) + 1); }
      else spur = [];
      zeichneSpur();
      if(!s){ if(k.art === 'ort'){ const l = sterne.filter(x => x.ort === k); if(l.length){ const b = l.reduce((b, x) => [Math.min(b[0], x.x - x.r), Math.min(b[1], x.y - x.r), Math.max(b[2], x.x + x.r), Math.max(b[3], x.y + x.r)], [Infinity, Infinity, -Infinity, -Infinity]);
            const z = B.blickAuf({x0: b[0] - 60, y0: b[1] - 80, x1: b[2] + 60, y1: b[3] + 60}, 1.05); sofort || K.still ? B.setze(z) : B.fliege(z, 600); return; } }
        const z = B.blickAuf(gesamt, 1.04); sofort || K.still ? B.setze(z) : B.fliege(z, 600); return; }
      // den Stern mit seinen Nachbarn in den Blick
      const mit = [s, ...s.nb.filter(e => e.belegt || zeigBerechnet).map(e => e.a === s ? e.b : e.a)];
      const b = mit.reduce((b, x) => [Math.min(b[0], x.x - x.r), Math.min(b[1], x.y - x.r), Math.max(b[2], x.x + x.r), Math.max(b[3], x.y + x.r)], [Infinity, Infinity, -Infinity, -Infinity]);
      const z = B.blickAuf({x0: b[0] - 80, y0: b[1] - 80, x1: b[2] + 80, y1: b[3] + 80}, 1.08); z.s = Math.min(z.s, 2.2);
      if(vonAnsicht && vorher && Math.abs(Math.log(z.s / B.s)) < .5 && B.zuX(s.x) > 60 && B.zuX(s.x) < B.w - 60 && B.zuY(s.y) > 60 && B.zuY(s.y) < B.h - 60){ B.neu(); return; }
      sofort || K.still ? B.setze(z) : B.fliege(z, 650);
    },
    suche(){ B.neu(); },
    groesse(){ B.neu(); },
    ende(){ B.ende(); }
  };
}
