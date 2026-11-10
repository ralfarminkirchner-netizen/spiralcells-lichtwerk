/* Das Tragwerk (Ralf, 10.11.2026): „Wirklich ein Tragwerk, das das ganze Gebäude trägt, das all die einzelnen
   Werke trägt, die die einzelnen Werkstücke tragen. In all ihren Varianten.“

   Was nur das Tragwerk erzählt: was worauf ruht. Ein Bau im Schnitt. Unten das Fundament: das Tragwerk System
   mit seinen Werkzeugen. Darauf die Orte als Geschosse, das schwerste zuunterst. In jedem Geschoss stehen die
   Apps zwischen Pfosten, jedes Werk ist ein Stapel auf seinem Träger, jede Fassung ein Feld darin; hat sie ein
   Bild, ist das Feld ein erleuchtetes Fenster mit diesem Bild. Stützen werden nach unten stärker, weil mehr auf
   ihnen liegt. Wählt man etwas, leuchtet der Weg seiner Last bis ins Fundament.
   Was noch geprüft wird, steht im Gerüst neben dem Bau: es wird noch nicht getragen. */

import {buehne, bildlager} from './buehne.js';
import {TRAGEND, OFFEN, mengenWort} from './inhalt.js';

const TINTE = '#2b241c', SERIF = 'ui-serif, "New York", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif', SANS = 'ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", sans-serif';
const klemme = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const STUFEN = 10;
const GRUEN = Array.from({length: STUFEN}, (_, i) => { const u = i / (STUFEN - 1); return `hsl(${150 - u * 74} ${40 + u * 30}% ${25 + u * 27}%)`; });
const GRAU = ['hsl(108 26% 43%)', 'hsl(100 28% 49%)', 'hsl(116 25% 38%)'];
const GLUT = Array.from({length: STUFEN}, (_, i) => { const u = i / (STUFEN - 1); return `hsl(${30 + u * 16} ${62 + u * 30}% ${40 + u * 26}%)`; });
const ASCHE = ['hsl(30 26% 46%)', 'hsl(34 24% 52%)', 'hsl(27 24% 40%)'];
const HOCH = 5, GURT = 1.5, LUECKE_APP = 0.9, LUECKE_WERK = 0.28, RAND = 1.6;   // Felder je Geschoss, Höhe des Trägers, Pfosten, Fuge, Außenstütze

export const legende = `
  <p><b>Das Tragwerk</b> zeigt, was worauf ruht. Unten das Fundament: das Tragwerk System. Darauf die Orte als Geschosse, das schwerste zuunterst.</p>
  <ul class="zeichen">
    <li><i class="z fenster"></i>erleuchtetes Fenster: Fassung mit Bild</li>
    <li><i class="z feld jung"></i>helles Feld: junge Fassung</li>
    <li><i class="z feld frueh"></i>dunkles Feld: frühe Fassung</li>
    <li><i class="z feld offen"></i>mattes Feld: Zeit nicht belegt</li>
    <li><i class="z knolle"></i>im Fundament: was trägt</li>
    <li><i class="z geruest"></i>im Gerüst: noch zur Prüfung</li>
  </ul>
  <p>Ein Stapel ist ein Werk, zwischen zwei Pfosten steht eine App. Stützen sind unten stärker, weil mehr auf ihnen liegt. Das Gewählte zeigt den Weg seiner Last bis ins Fundament.</p>`;

/* ---------- Der Bau: reine Rechnung ---------- */
function baue(I, breit){
  const orte = I.wurzel.kinder.filter(o => o.kinder), lose = I.wurzel.kinder.filter(o => !o.kinder);
  const oben = orte.filter(o => !TRAGEND.has(o.name) && !OFFEN.has(o.name)).sort((a, b) => b.blaetter - a.blaetter);
  const tragend = orte.filter(o => TRAGEND.has(o.name)), offen = orte.filter(o => OFFEN.has(o.name));
  const felder = [], zeilen = [], segmente = new Map();   // Knoten → Rechtecke
  const merke = (k, z, x0, x1) => { for(let q = k; q && q.art !== 'wurzel'; q = q.eltern){ let l = segmente.get(q); if(!l){ l = []; segmente.set(q, l); }
    let s = l.find(r => r.z === z); if(!s){ s = {z, x0, x1}; l.push(s); } else { s.x0 = Math.min(s.x0, x0); s.x1 = Math.max(s.x1, x1); } } };

  /* Ein Block (Ort) fließt in Zeilen der Breite `weit`: Apps zwischen Pfosten, Werke als Stapel */
  function fliesse(ort, weit, x0, teil){
    const eigene = []; let x = 0, zeile = null, ersteApp = true;
    const neueZeile = () => { zeile = {ort, x0, weit, pfosten: [], fugen: [], teil, ende: 0, hoch: 2, nr: eigene.length}; eigene.push(zeile); zeilen.push(zeile); x = 0; };
    neueZeile();
    const stapel = (werk, blaetter) => {
      const spalten = Math.ceil(blaetter.length / HOCH);
      if(spalten <= weit && x + spalten > weit) neueZeile();
      for(let i = 0; i < blaetter.length; i++){ const sp = Math.floor(i / HOCH), r = i % HOCH;
        if(r === 0 && i > 0){ x += 1; if(x + 1 > weit + 1e-6) neueZeile(); }
        const f = {q: blaetter[i], z: zeile, sx: x, r}; felder.push(f); merke(blaetter[i], zeile, x, x + 1); zeile.ende = Math.max(zeile.ende, x + 1); zeile.hoch = Math.max(zeile.hoch, r + 1); }
      x += 1;
    };
    const app = (k, tief) => {
      if(x > 0){ if(x + LUECKE_APP + 1 > weit) neueZeile(); else { if(!tief) zeile.pfosten.push(x + LUECKE_APP / 2); x += tief ? LUECKE_WERK * 2 : LUECKE_APP; } }
      let erstes = true; const fuge = () => { if(!erstes && x > 0 && x + LUECKE_WERK + 1 <= weit){ zeile.fugen.push(x + LUECKE_WERK / 2); x += LUECKE_WERK; } erstes = false; };
      for(const c of k.kinder.filter(c => c.kinder)){ if(c.art === 'werk'){ fuge(); stapel(c, c.kinder); } else { app(c, true); erstes = false; } }
      const eig = k.kinder.filter(c => !c.kinder); if(eig.length){ fuge(); stapel(k, eig); }
    };
    for(const k of ort.kinder.filter(c => c.kinder)) app(k, false);
    const eig = ort.kinder.filter(c => !c.kinder); if(eig.length){ if(x > 0) x += LUECKE_APP; stapel(ort, eig); }
    return eigene;
  }

  // über der Erde: Geschosse von unten nach oben, das schwerste zuunterst
  const bloecke = []; let y = -1.2, last = 0;
  const alleOben = oben.slice(); if(lose.length) alleOben.push({art: 'ort', name: 'Lose Blätter', kinder: lose, eltern: I.wurzel, blaetter: lose.length, pseudo: true});
  const stapelOben = alleOben.map(o => ({o, z: fliesse(o, breit, 0, 'bau')}));
  for(const b of stapelOben){ b.y1 = y; for(const z of b.z){ z.yb = y - GURT; z.yt = z.yb - z.hoch; y = z.yt; } b.y0 = y; bloecke.push(b); }
  const first = y;
  // Lasten: jede Zeile trägt alles über sich
  let ueber = 0; for(let i = stapelOben.length - 1; i >= 0; i--){ const b = stapelOben[i]; for(let j = b.z.length - 1; j >= 0; j--){ ueber += felder.filter(f => f.z === b.z[j]).length; b.z[j].last = ueber; } }
  last = ueber;
  // unter der Erde: das Fundament, breiter als der Bau
  const fb = breit + 6; let yu = 2.2; const fund = [];
  for(const o of tragend){ const b = {o, z: fliesse(o, fb, -3, 'fund'), y0: yu}; for(const z of b.z){ z.yt = yu + 0.9; z.yb = z.yt + z.hoch; yu = z.yb + 0.5; } b.y1 = yu; fund.push(b); }
  // das Gerüst daneben
  const geruest = []; let gy = -0.6; const gb = Math.max(4, Math.min(9, Math.round(breit * 0.22))), gx = breit + RAND + 3.5;
  for(const o of offen){ const b = {o, z: fliesse(o, gb, gx, 'geruest'), y1: gy}; for(const z of b.z){ z.yb = gy - 0.5; z.yt = z.yb - z.hoch; gy = z.yt; } b.y0 = gy; geruest.push(b); }

  for(const f of felder){ f.x = f.z.x0 + f.sx; f.y = f.z.yb - 1 - f.r; }
  const rechtecke = new Map();
  for(const [k, l] of segmente) rechtecke.set(k, l.map(s => ({x0: s.z.x0 + s.x0, x1: s.z.x0 + s.x1, y0: s.z.yt, y1: s.z.yb, z: s.z})));
  for(const b of [...bloecke, ...fund, ...geruest]) if(!b.o.pseudo) rechtecke.set(b.o, b.z.map(z => ({x0: z.x0, x1: z.x0 + z.weit, y0: z.yt, y1: z.yb, z})));
  const rahmen = {x0: -4.5, x1: Math.max(breit + 4.5, geruest.length ? gx + gb + 1.5 : 0), y0: first - (breit * 0.16 + 3), y1: yu + 2.5};
  return {felder, zeilen, bloecke, fund, geruest, rechtecke, rahmen, breit, fb, gx, gb, dach: first, tief: yu, last};
}

export function starte(el, K){
  const I = K.inhalt, spanne = Math.max(1, (I.bis ?? 1) - (I.von ?? 0)), lager = bildlager(K.bildUrl);
  let W, start = K.still ? -1e9 : performance.now(), fertig = false, schweb = null;
  const feldVon = new Map();
  const B = buehne(el, {zeichne, tipp, schwebe, lebendig: () => !fertig});
  lager.beiBild = B.neu;
  const breitFuer = () => B.h > B.w * 1.1 ? 30 : B.w / B.h > 1.9 ? 62 : 50;
  B.beiGroesse = () => { if(breitFuer() !== W.breit) lege(); B.rand = K.rand(); B.setze(B.blickAuf(rahmenVon(K.gewaehlt()))); };

  function lege(){
    W = baue(I, breitFuer()); feldVon.clear();
    for(const f of W.felder){ feldVon.set(f.q, f); const q = f.q, u = q.von == null ? -1 : klemme((q.von - I.von) / spanne), st = u < 0 ? -1 - (q.nr % 3) : Math.round(u * (STUFEN - 1)), unten = f.z.teil === 'fund';
      f.farbe = unten ? (st < 0 ? ASCHE[-1 - st] : GLUT[st]) : (st < 0 ? GRAU[-1 - st] : GRUEN[st]); }
    const n = W.zeilen.length; let i = 0;
    for(const b of [...W.fund].reverse()) for(const z of [...b.z].reverse()) z.zeit = i++ / n;
    for(const b of W.bloecke) for(const z of b.z) z.zeit = i++ / n;
    for(const b of W.geruest) for(const z of b.z) z.zeit = i++ / n;
    B.sMin = B.blickAuf(W.rahmen).s * 0.6;
  }
  const rechteVon = k => W.rechtecke.get(k) || (feldVon.has(k) ? [{x0: feldVon.get(k).x, x1: feldVon.get(k).x + 1, y0: feldVon.get(k).y, y1: feldVon.get(k).y + 1, z: feldVon.get(k).z}] : null);
  function rahmenVon(k){
    const l = k && k.art !== 'wurzel' ? rechteVon(k) : null; if(!l) return W.rahmen;
    const r = {x0: Math.min(...l.map(a => a.x0)), x1: Math.max(...l.map(a => a.x1)), y0: Math.min(...l.map(a => a.y0)), y1: Math.max(...l.map(a => a.y1))};
    const p = !k.kinder ? 2.6 : Math.max(1.2, (r.x1 - r.x0) * 0.08); return {x0: r.x0 - p, x1: r.x1 + p, y0: r.y0 - p, y1: r.y1 + p + (k.kinder ? GURT : 0)};
  }
  function zeige(k, sofort){ B.rand = K.rand(); const z = B.blickAuf(rahmenVon(k), 1.06); sofort ? B.setze(z) : B.fliege(z); }

  function treffer(px, py){
    const wx = B.vonX(px), wy = B.vonY(py); let kette = null;
    const f = W.felder.find(f => wx >= f.x && wx < f.x + 1 && wy >= f.y && wy < f.y + 1);
    if(f){ kette = []; for(let q = f.q; q && q.art !== 'wurzel'; q = q.eltern) kette.unshift(q); }
    else {   // die Luft über einem Stapel gehört zu seinem Werk und seiner App
      let tief = null; for(const [k, l] of W.rechtecke) if((!tief || k.tiefe > tief.tiefe) && l.some(r => wx >= r.x0 && wx <= r.x1 && wy >= r.y0 && wy <= r.y1)) tief = k;
      if(tief){ kette = []; for(let q = tief; q && q.art !== 'wurzel'; q = q.eltern) kette.unshift(q); }
      else { const z = W.zeilen.find(z => wy >= z.yt && wy <= z.yb + GURT && wx >= z.x0 - RAND && wx <= z.x0 + z.weit + RAND); if(z && !z.ort.pseudo) kette = [z.ort]; } }
    if(!kette) return null;
    const vor = new Set(); for(let q = K.gewaehlt(); q; q = q.eltern) vor.add(q);
    let i = 0; while(i < kette.length - 1 && vor.has(kette[i])) i++;
    const gross = k => { const r = rahmenVon(k); return (r.x1 - r.x0) * B.s > B.w * 0.9 && (r.y1 - r.y0) * B.s > B.h * 0.7; };
    while(i < kette.length - 1 && gross(kette[i])) i++;
    return kette[i];
  }
  function tipp(px, py){ const k = treffer(px, py); if(!k) return; if(k === K.gewaehlt()){ if(!k.kinder) K.oeffne(k); else zeige(k); } else K.waehle(k); }
  function schwebe(px, py){ const k = px < 0 ? null : treffer(px, py); if(k !== schweb){ schweb = k; B.c.style.cursor = k ? 'pointer' : ''; B.neu(); } }

  /* ---------- Zeichnen ---------- */
  const zufall = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const HOLZ = '#3d2a1f', HOLZ2 = '#6a4c35', STEIN = '#57463a', STEIN2 = '#6b584a';

  function zeichne(_, t){
    const x = B.x, {w, h, s} = B, roh = B.ruhig() ? 1 : klemme((t - start) / 2600), P = 1 - (1 - roh) * (1 - roh); if(roh >= 1) fertig = true;
    const X = B.zuX, Y = B.zuY, br = W.breit, y0 = Y(0);
    const da = z => fertig ? 1 : klemme((P * 1.1 - z.zeit * 0.9) / 0.1);
    // Himmel, Hügel, Erde: dieselbe Welt wie der Baum
    const hg = x.createLinearGradient(0, Math.min(Y(W.rahmen.y0 - 20), y0 - 1), 0, y0); hg.addColorStop(0, '#cfe0e6'); hg.addColorStop(0.55, '#e9ecdf'); hg.addColorStop(1, '#f9ebcf'); x.fillStyle = hg; x.fillRect(0, 0, w, h);
    const sx = X(-br * 0.35), sy = Y(W.dach * 0.8), sr = 90 * s; { const sg = x.createRadialGradient(sx, sy, 0, sx, sy, sr); sg.addColorStop(0, 'rgba(255,246,214,.9)'); sg.addColorStop(0.12, 'rgba(255,240,200,.55)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = sg; x.fillRect(sx - sr, sy - sr, sr * 2, sr * 2); }
    if(y0 > 0 && y0 < h + 40 * s){ const huegel = (hoch, f1, f2, farbe) => { x.beginPath(); x.moveTo(0, y0); for(let px = 0; px <= w + 8; px += 8){ const wx = B.vonX(px); x.lineTo(px, y0 - (hoch + Math.sin(wx / f1) * hoch * 0.5 + Math.sin(wx / f2 + 2) * hoch * 0.3) * s); } x.lineTo(w, y0); x.closePath(); x.fillStyle = farbe; x.fill(); };
      huegel(8, 61, 23, '#cddccb'); huegel(3.6, 37, 13, '#b9d0a4'); }
    if(y0 < h){ const eg = x.createLinearGradient(0, y0, 0, Math.max(Y(W.tief + 12), y0 + 1)); eg.addColorStop(0, '#4a3324'); eg.addColorStop(0.2, '#3a281d'); eg.addColorStop(1, '#1d1410'); x.fillStyle = eg; x.fillRect(0, y0, w, h - y0);
      x.fillStyle = '#6f9a48'; x.fillRect(0, y0 - 0.35 * s, w, 0.7 * s); x.fillStyle = '#8fb85c'; x.fillRect(0, y0 - 0.35 * s, w, Math.max(1, 0.18 * s)); }
    const R = (a, b, c, d) => x.fillRect(X(a), Y(b), (c - a) * s, (d - b) * s);

    // das Fundament: ein Block aus Stein, darin gewölbte Kammern
    if(W.fund.length){ const f0 = -3 - RAND, f1 = -3 + W.fb + RAND, ft = 0.5, fu = W.tief + 0.8, a = fertig ? 1 : klemme(P * 1.1 / 0.12);
      x.globalAlpha = a; x.fillStyle = STEIN; x.beginPath(); x.moveTo(X(f0), Y(ft)); x.lineTo(X(f1), Y(ft)); x.lineTo(X(f1 + 2.2), Y(fu)); x.lineTo(X(f0 - 2.2), Y(fu)); x.closePath(); x.fill();
      x.fillStyle = STEIN2; R(f0, ft, f1, ft + 0.5);
      if(s > 4){ x.strokeStyle = 'rgba(30,20,14,.28)'; x.lineWidth = 1; x.beginPath(); for(let yy = ft + 1.4; yy < fu; yy += 1.4){ x.moveTo(X(f0 - 2.2 * (yy - ft) / (fu - ft)), Y(yy)); x.lineTo(X(f1 + 2.2 * (yy - ft) / (fu - ft)), Y(yy)); } x.stroke(); }
      x.globalAlpha = 1;
      for(const z of W.zeilen){ if(z.teil !== 'fund') continue; const d = da(z); if(d <= 0) continue; x.globalAlpha = d; x.fillStyle = '#241812'; x.beginPath(); x.roundRect(X(z.x0 - 0.35), Y(z.yt - 0.35), (z.weit + 0.7) * s, (z.hoch + 0.7) * s, 0.5 * s); x.fill();
        x.fillStyle = STEIN2; for(const p of z.pfosten) R(z.x0 + p - 0.22, z.yt - 0.35, z.x0 + p + 0.22, z.yb + 0.35); } x.globalAlpha = 1; }

    // der Bau: Außenstützen, Träger als Fachwerk, Pfosten
    const bauZeilen = W.zeilen.filter(z => z.teil === 'bau'), fein = GURT * s > 7;
    for(const z of bauZeilen){ const d = da(z); if(d <= 0) continue; x.globalAlpha = d;
      const st = 0.55 + 1.5 * Math.sqrt(z.last / W.last), erste = z.nr === 0;
      x.fillStyle = HOLZ; R(-RAND - st + 0.55, z.yt, -RAND + 0.55, z.yb + GURT); R(br + RAND - 0.55, z.yt, br + RAND + st - 0.55, z.yb + GURT);
      x.fillStyle = HOLZ2; R(-RAND - st + 0.55, z.yt, -RAND - st + 0.55 + st * 0.3, z.yb + GURT); R(br + RAND - 0.55, z.yt, br + RAND - 0.55 + st * 0.3, z.yb + GURT);
      // Träger
      const g0 = z.yb, g1 = z.yb + GURT, dick = erste ? 0.34 : 0.22;
      x.fillStyle = erste ? HOLZ : HOLZ; if(!fein){ x.globalAlpha = d * (erste ? 1 : 0.8); R(-RAND, g0, br + RAND, g1); x.globalAlpha = d; }
      else { R(-RAND, g0, br + RAND, g0 + dick); R(-RAND, g1 - dick, br + RAND, g1);
        x.strokeStyle = HOLZ; x.lineWidth = Math.max(1, (erste ? 0.2 : 0.13) * s); x.lineJoin = 'round'; x.beginPath(); const schritt = GURT * 0.9; let auf = false; x.moveTo(X(-RAND), Y(g1 - dick));
        for(let xx = -RAND; xx < br + RAND; xx += schritt){ x.lineTo(X(Math.min(br + RAND, xx + schritt)), Y(auf ? g1 - dick : g0 + dick)); auf = !auf; } x.stroke();
        if(erste){ x.fillStyle = 'rgba(61,42,31,.16)'; R(-RAND, g0, br + RAND, g1); } }
      x.fillStyle = HOLZ; for(const p of z.pfosten) R(p - 0.2, z.yt, p + 0.2, z.yb);
      if(s > 9){ x.fillStyle = 'rgba(61,42,31,.5)'; for(const p of z.fugen) R(p - 0.05, z.yt + 0.6, p + 0.05, z.yb); }
      // freie Felder am Ende der Zeile: offenes Fachwerk, Platz zum Wachsen
      if(z.ende < br - 1.5 && s > 2.5){ x.strokeStyle = 'rgba(61,42,31,.3)'; x.lineWidth = Math.max(1, 0.08 * s); x.beginPath(); const a0 = z.ende + 0.6; x.moveTo(X(a0), Y(z.yt)); x.lineTo(X(a0), Y(z.yb));
        for(let xx = a0; xx < br - 0.5; xx += z.hoch + 1){ const x1 = Math.min(br, xx + z.hoch + 1); x.moveTo(X(xx), Y(z.yb)); x.lineTo(X(x1), Y(z.yt)); x.moveTo(X(xx), Y(z.yt)); x.lineTo(X(x1), Y(z.yb)); x.moveTo(X(x1), Y(z.yt)); x.lineTo(X(x1), Y(z.yb)); } x.stroke(); }
    }
    x.globalAlpha = 1;
    // Sockel und Dachstuhl
    { const a = fertig ? 1 : klemme((P * 1.1 - 0.25) / 0.1); x.globalAlpha = a; x.fillStyle = STEIN2; R(-RAND - 2.6, -1.2, br + RAND + 2.6, 0.5); x.fillStyle = STEIN; R(-RAND - 2.6, -0.2, br + RAND + 2.6, 0.5);
      const d = fertig ? 1 : klemme((P * 1.1 - 1) / 0.08); x.globalAlpha = d; const yd = W.dach, first = yd - br * 0.16, l = -RAND - 1.6, r = br + RAND + 1.6, m = br / 2;
      x.strokeStyle = HOLZ; x.lineWidth = Math.max(1.5, 0.42 * s); x.lineJoin = 'round'; x.lineCap = 'round'; x.beginPath(); x.moveTo(X(l), Y(yd)); x.lineTo(X(m), Y(first)); x.lineTo(X(r), Y(yd)); x.closePath(); x.stroke();
      x.lineWidth = Math.max(1, 0.18 * s); x.beginPath(); const n = 8; for(let i = 1; i < n; i++){ const u = i / n, xx = l + (r - l) * u, yy = yd + (first - yd) * (1 - Math.abs(u - 0.5) * 2); x.moveTo(X(xx), Y(yd)); x.lineTo(X(xx), Y(yy)); const v = (i + (u < 0.5 ? 1 : -1)) / n, x2 = l + (r - l) * v, y2 = yd + (first - yd) * (1 - Math.abs(v - 0.5) * 2); if(i !== n / 2){ x.moveTo(X(xx), Y(yd)); x.lineTo(X(x2), Y(y2)); } } x.stroke(); x.globalAlpha = 1; }
    // das Gerüst
    for(const z of W.zeilen){ if(z.teil !== 'geruest') continue; const d = da(z); if(d <= 0) continue; x.globalAlpha = d * 0.9; x.strokeStyle = '#8a6a48'; x.lineWidth = Math.max(1, 0.12 * s); x.beginPath();
      const a = z.x0 - 0.6, b = z.x0 + z.weit + 0.6; for(const xx of [a, b]){ x.moveTo(X(xx), Y(z.yt - 0.8)); x.lineTo(X(xx), Y(z.nr === 0 ? 0 : z.yb + 0.5)); } x.moveTo(X(a - 0.5), Y(z.yb)); x.lineTo(X(b + 0.5), Y(z.yb)); x.moveTo(X(a - 0.5), Y(z.yt - 0.5)); x.lineTo(X(b + 0.5), Y(z.yt - 0.5));
      x.moveTo(X(a), Y(z.yb)); x.lineTo(X(b), Y(z.yt - 0.5)); x.moveTo(X(a), Y(z.yt - 0.5)); x.lineTo(X(b), Y(z.yb)); x.stroke(); x.globalAlpha = 1; }

    // die Felder: Fassungen. Mit Bild ein erleuchtetes Fenster
    const klein = s < 5, mitBild = s >= 13, fuge = klein ? 0 : Math.min(0.09 * s, 3), ecke = Math.min(0.12 * s, 5);
    for(const f of W.felder){ const px = X(f.x), py = Y(f.y); if(px > w || px + s < 0 || py > h || py + s < 0) continue; const d = da(f.z); if(d <= 0) continue;
      const a = fertig ? 1 : klemme(d * 2 - (f.r / HOCH)), unten = f.z.teil === 'fund'; if(a <= 0) continue; x.globalAlpha = a;
      const bild = f.q.bild, gs = f.q.art === 'gespraech';
      if(klein){ x.fillStyle = bild ? (unten ? '#ffd27a' : '#f4c56a') : gs ? '#fff6f2' : f.farbe; x.fillRect(px + 0.5, py + 0.5, s - 0.6, s - 0.6); continue; }
      x.fillStyle = bild ? (unten ? '#e9b65a' : '#f4d08a') : gs ? '#fbf3ec' : f.farbe; x.beginPath(); x.roundRect(px + fuge, py + fuge, s - fuge * 2, s - fuge * 2, ecke); x.fill();
      if(bild && mitBild){ const e = lager.nimm(bild, s * B.dpr > 300 ? 960 : 240) || (s * B.dpr > 300 ? lager.nimm(bild, 240) : null);
        if(e){ const im = e.bild, k = Math.max((s - fuge * 2) / im.naturalWidth, (s - fuge * 2) / im.naturalHeight), bw = im.naturalWidth * k, bh = im.naturalHeight * k;
          x.save(); x.beginPath(); x.roundRect(px + fuge, py + fuge, s - fuge * 2, s - fuge * 2, ecke); x.clip(); const al = klemme((t - e.da) / 300); x.globalAlpha = a * al; if(al < 1) B.neu(); x.drawImage(im, px + s / 2 - bw / 2, py + s / 2 - bh / 2, bw, bh); x.restore(); x.globalAlpha = a; } }
      else if(!bild && s > 9){ x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(px + fuge, py + fuge, s - fuge * 2, (s - fuge * 2) * 0.42);
        if(gs && s > 14){ x.fillStyle = '#d8a0a0'; for(let i = 0; i < 3; i++) x.fillRect(px + s * 0.24, py + s * (0.32 + i * 0.16), s * (i === 2 ? 0.3 : 0.52), Math.max(1, s * 0.05)); } }
    }
    x.globalAlpha = 1;

    // gewählt: es bleibt im Licht, und der Weg seiner Last leuchtet bis ins Fundament
    const gew = K.gewaehlt();
    if(gew && gew.art !== 'wurzel'){
      const stellen = (I.nachSchluessel.get(gew.schluessel) || [gew]).map(k => ({k, l: rechteVon(k)})).filter(a => a.l);
      if(stellen.length){ const p = new Path2D(); p.rect(0, 0, w, h); const pad = gew.kinder ? 0.25 : 0.12;
        for(const a of stellen) for(const r of a.l) p.roundRect(X(r.x0 - pad), Y(r.y0 - pad), (r.x1 - r.x0 + pad * 2) * s, (r.y1 - r.y0 + pad * 2) * s, 6);
        const yy = klemme(y0, 0, h); x.save(); x.beginPath(); x.rect(0, 0, w, yy); x.clip(); x.fillStyle = 'rgba(246,240,226,.55)'; x.fill(p, 'evenodd'); x.restore();
        x.save(); x.beginPath(); x.rect(0, yy, w, h - yy); x.clip(); x.fillStyle = 'rgba(16,11,8,.55)'; x.fill(p, 'evenodd'); x.restore();
        x.strokeStyle = '#ffb53d'; x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = 'rgba(255,170,40,.9)'; x.shadowBlur = 12; x.lineWidth = Math.max(2, Math.min(0.3 * s, 5));
        const puls = B.ruhig() ? 1 : 0.75 + 0.25 * Math.sin(t * 0.004); x.globalAlpha = puls; x.beginPath();
        for(const r of (rechteVon(gew) || [])){ const z = r.z; if(z.teil !== 'bau') { if(z.teil === 'fund'){ x.moveTo(X(r.x0), Y(r.y1 + 0.18)); x.lineTo(X(r.x1), Y(r.y1 + 0.18)); } continue; }
          const g = r.y1 + 0.17, li = -RAND + 0.2, re = br + RAND - 0.2;   // über den Träger zu beiden Stützen, die Stützen hinab
          x.moveTo(X(r.x0), Y(g)); x.lineTo(X(r.x1), Y(g)); x.moveTo(X(r.x0), Y(g)); x.lineTo(X(li), Y(g)); x.lineTo(X(li), Y(0.5)); x.moveTo(X(r.x1), Y(g)); x.lineTo(X(re), Y(g)); x.lineTo(X(re), Y(0.5)); }
        if((rechteVon(gew) || []).some(r => r.z.teil === 'bau')){ x.moveTo(X(-3 - RAND), Y(0.75)); x.lineTo(X(-3 + W.fb + RAND), Y(0.75)); }
        x.stroke(); x.shadowColor = 'transparent'; x.shadowBlur = 0; x.globalAlpha = 1;
        if(!B.ruhig() && fertig) setTimeout(B.neu, 60);
        x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.4; for(const a of stellen){ x.setLineDash(a.k === gew ? [] : [2, 5]); for(const r of a.l){ x.beginPath(); x.roundRect(X(r.x0 - pad), Y(r.y0 - pad), (r.x1 - r.x0 + pad * 2) * s, (r.y1 - r.y0 + pad * 2) * s, 6); x.stroke(); } } x.setLineDash([]); }
    }
    if(schweb && schweb !== gew){ x.strokeStyle = 'rgba(43,36,28,.5)'; x.lineWidth = 1.2; for(const r of rechteVon(schweb) || []){ x.beginPath(); x.roundRect(X(r.x0), Y(r.y0), (r.x1 - r.x0) * s, (r.y1 - r.y0) * s, 5); x.stroke(); } }

    schrift(x, P, gew);
  }

  const breiten = new Map();
  function schrift(x, P, gew){
    if(P < 0.6) return; const {w, h, s} = B, X = B.zuX, Y = B.zuY, belegt = [], ein = klemme((P - 0.6) / 0.3);
    const setze = (text, px, py, gr, o = {}) => { if(!text) return false; const font = `${o.gewicht || 500} ${o.kursiv ? 'italic ' : ''}${gr.toFixed(1)}px ${o.sans ? SANS : SERIF}`, key = font + text;
      let b = breiten.get(key); if(b == null){ x.font = font; b = x.measureText(text).width; if(breiten.size > 4000) breiten.clear(); breiten.set(key, b); }
      if(o.max && b > o.max) return false;
      const x0 = o.links ? px : px - b / 2, hh = gr * 1.25, yA = py - hh / 2; if(x0 > w - b * 0.25 || x0 + b * 0.75 < 0 || yA > h || yA + hh < 0) return false;
      for(const r of belegt) if(x0 - 4 < r[2] && x0 + b + 4 > r[0] && yA < r[3] && yA + hh > r[1]) return false; belegt.push([x0 - 4, yA, x0 + b + 4, yA + hh]);
      x.font = font; x.textAlign = o.links ? 'left' : 'center'; x.textBaseline = 'middle'; x.globalAlpha = (o.alpha ?? 1) * ein; x.lineJoin = 'round';
      if(!o.ohneHof){ x.strokeStyle = o.dunkel ? 'rgba(29,20,16,.85)' : 'rgba(250,244,230,.9)'; x.lineWidth = Math.max(3, gr * 0.26); x.strokeText(text, px, py); }
      x.fillStyle = o.hell || o.dunkel ? '#f6e7c9' : TINTE; x.fillText(text, px, py); x.globalAlpha = 1; return true; };
    const kuerze = (t, n) => t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
    // Orte: groß über ihrem Block, solange er klein ist; sonst auf ihrem untersten Träger
    for(const b of [...W.bloecke, ...W.fund, ...W.geruest]){ const z0 = b.z[0], unten = z0.teil === 'fund', ger = z0.teil === 'geruest', hoch = Math.abs(b.y1 - b.y0) * s, mx = X(z0.x0 + z0.weit / 2), name = ger ? 'Zur Prüfung' : b.o.name;
      if(ger){ setze(name, mx, Y(b.y0 - 2), klemme(s * 1.6, 11, 17), {kursiv: true}); continue; }
      if(GURT * s < 15 || unten){ const my = unten ? Y(b.y0 + 0.2) - 2 : Y((b.y0 + b.y1) / 2); if(hoch > 16 || unten) setze(name, mx, unten ? Y(1.35) : my, Math.min(klemme(unten ? s * 2 : hoch * 0.3, 12.5, 26), z0.weit * s / (name.length * 0.66)), {gewicht: 650, dunkel: unten}); }
      else setze(name, X(-RAND + 0.6), Y(z0.yb + GURT / 2), klemme(GURT * s * 0.52, 12, 30), {gewicht: 650, links: true, hell: true, ohneHof: true}) && s > 22 && setze(mengenWort(b.o), X(z0.x0 + z0.weit + RAND - 0.6) - 150, Y(z0.yb + GURT / 2), 11.5, {sans: true, hell: true, ohneHof: true, alpha: 0.8}); }
    // Apps: über ihrem Abschnitt; Werke: unter ihrem Stapel, auf dem Träger
    if(s >= 6.5) for(const [k, l] of W.rechtecke){ if(k.art !== 'app' && k.art !== 'bereich' && k.art !== 'werk') continue;
      const r = l[0], bw = (r.x1 - r.x0) * s, unten = r.z.teil === 'fund', werk = k.art === 'werk'; if(X(r.x1) < 0 || X(r.x0) > w || Y(r.y1) < -20 || Y(r.y0) > h + 20) continue;
      if(werk){ if(s >= 15) setze(kuerze(k.name, Math.max(6, Math.floor(bw / 6.2))), X((r.x0 + r.x1) / 2), Y(r.y1) + (unten ? 0.22 * s : GURT * s * 0.5), klemme(s * 0.42, 10, 13), {sans: true, hell: !unten, dunkel: unten, ohneHof: !unten, alpha: 0.95}); }
      else if(bw > 34) setze(kuerze(k.name, Math.max(5, Math.floor(bw / 7.5))), X(r.x0) + 3, Y(r.y0) + (s >= 15 ? -0.02 * s : 0) + klemme(s * 0.6, 10, 15) * 0.7, klemme(s * 0.6, 10.5, 15), {gewicht: 620, links: true, dunkel: unten}); }
    if(s >= 46) for(const f of W.felder){ const px = X(f.x), py = Y(f.y); if(px > w || px + s < 0 || py > h || py + s < 0) continue; setze(kuerze(f.q.name, Math.floor(s / 5.6)), px + s / 2, py + s - 9, 10.5, {sans: true, dunkel: f.z.teil === 'fund'}); }
    const fs = feldVon.get(schweb); if(fs && s < 46) setze(kuerze(schweb.name, 44), X(fs.x + 0.5), Y(fs.y) - 10, 12, {sans: true, gewicht: 600});
    const fg = feldVon.get(gew); if(fg && s < 46) setze(kuerze(gew.name, 44), X(fg.x + 0.5), Y(fg.y + 1) + 11, 12, {sans: true, gewicht: 600});
  }

  lege(); B.rand = K.rand(); B.setze(B.blickAuf(rahmenVon(K.gewaehlt()), 1.04));
  return {zeige, ende: B.ende, neu: B.neu};
}
