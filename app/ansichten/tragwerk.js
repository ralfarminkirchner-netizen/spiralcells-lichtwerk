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
const KLEIN = 0.5, HOCH = 5, GURT = 1.5, LUECKE_APP = 0.9, LUECKE_WERK = 0.28, RAND = 1.6;   // Felder je Geschoss, Höhe des Trägers, Pfosten, Fuge, Außenstütze

export const legende = `
  <p><b>Das Tragwerk</b> zeigt, was worauf ruht. Unten das Fundament: das Tragwerk System. Darauf die Orte als Geschosse, das schwerste zuunterst.</p>
  <ul class="zeichen">
    <li><i class="z fenster"></i>Bild: das echte Bild dieser Fassung</li>
    <li><i class="z papier"></i>kleines Blatt Papier: Fassung ohne Bild; ihr Name steht darauf, sobald man nah ist oder darüberfährt</li>
    <li><i class="z knolle"></i>im Fundament: was trägt</li>
    <li><i class="z geruest"></i>im Gerüst: noch zur Prüfung</li>
  </ul>
  <p>Ein Stapel ist ein Werk, zwischen zwei Pfosten steht eine App. Stützen sind unten stärker, weil mehr auf ihnen liegt. Das Gewählte zeigt den Weg seiner Last bis ins Fundament.</p>
  <p>Über einem Bild wird es groß. Ein Tipp wählt die Fassung, ein zweiter öffnet sie.</p>`;

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
    /* Ein Stapel: zuerst die Fassungen mit Bild, groß; dahinter die ohne Bild als kleine Blätter (Ralf, 10.11.: „Klein, Bilder groß“) */
    const stapel = (werk, blaetter) => {
      const mit = blaetter.filter(q => q.bild), ohne = blaetter.filter(q => !q.bild);
      const ganz = Math.ceil(mit.length / HOCH) + Math.ceil(ohne.length / (HOCH * 2)) * KLEIN;
      if(ganz <= weit && x + ganz > weit) neueZeile();
      const reihe = (liste, g, jeSpalte) => {
        for(let i = 0; i < liste.length; i++){ const r = i % jeSpalte;
          if(r === 0){ if(i > 0) x += g; if(x + g > weit + 1e-6) neueZeile(); }
          felder.push({q: liste[i], z: zeile, sx: x, ry: r * g, g}); merke(liste[i], zeile, x, x + g);
          zeile.ende = Math.max(zeile.ende, x + g); zeile.hoch = Math.max(zeile.hoch, (r + 1) * g); }
        if(liste.length) x += g; };
      reihe(mit, 1, HOCH); reihe(ohne, KLEIN, HOCH * 2);
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

  for(const f of felder){ f.x = f.z.x0 + f.sx; f.y = f.z.yb - f.g - f.ry; }
  const rechtecke = new Map();
  for(const [k, l] of segmente) rechtecke.set(k, l.map(s => ({x0: s.z.x0 + s.x0, x1: s.z.x0 + s.x1, y0: s.z.yt, y1: s.z.yb, z: s.z})));
  for(const b of [...bloecke, ...fund, ...geruest]) if(!b.o.pseudo) rechtecke.set(b.o, b.z.map(z => ({x0: z.x0, x1: z.x0 + z.weit, y0: z.yt, y1: z.yb, z})));
  const rahmen = {x0: -4.5, x1: Math.max(breit + 4.5, geruest.length ? gx + gb + 1.5 : 0), y0: first - (breit * 0.16 + 3), y1: yu + 2.5};
  return {felder, zeilen, bloecke, fund, geruest, rechtecke, rahmen, breit, fb, gx, gb, dach: first, tief: yu, last};
}

export function starte(el, K){
  const I = K.inhalt, lager = bildlager(K.bildUrl, 3000, 12);
  let W, start = K.still ? -1e9 : performance.now(), fertig = false, schweb = null;
  const feldVon = new Map();
  const B = buehne(el, {zeichne, tipp, schwebe, lebendig: () => !fertig});
  lager.beiBild = B.neu;
  const breitFuer = () => B.h > B.w * 1.1 ? 30 : B.w / B.h > 1.9 ? 62 : 50;
  B.beiGroesse = () => { if(breitFuer() !== W.breit) lege(); B.rand = K.rand(); B.setze(B.blickAuf(rahmenVon(K.gewaehlt()))); };

  function lege(){
    W = baue(I, breitFuer()); feldVon.clear();
    for(const f of W.felder) feldVon.set(f.q, f);
    const n = W.zeilen.length; let i = 0;
    for(const b of [...W.fund].reverse()) for(const z of [...b.z].reverse()) z.zeit = i++ / n;
    for(const b of W.bloecke) for(const z of b.z) z.zeit = i++ / n;
    for(const b of W.geruest) for(const z of b.z) z.zeit = i++ / n;
    B.sMin = B.blickAuf(W.rahmen).s * 0.6;
  }
  const rechteVon = k => W.rechtecke.get(k) || (feldVon.has(k) ? [{x0: feldVon.get(k).x, x1: feldVon.get(k).x + feldVon.get(k).g, y0: feldVon.get(k).y, y1: feldVon.get(k).y + feldVon.get(k).g, z: feldVon.get(k).z}] : null);
  function rahmenVon(k){
    const l = k && k.art !== 'wurzel' ? rechteVon(k) : null; if(!l) return W.rahmen;
    const r = {x0: Math.min(...l.map(a => a.x0)), x1: Math.max(...l.map(a => a.x1)), y0: Math.min(...l.map(a => a.y0)), y1: Math.max(...l.map(a => a.y1))};
    const p = !k.kinder ? 2.6 : Math.max(1.2, (r.x1 - r.x0) * 0.08); return {x0: r.x0 - p, x1: r.x1 + p, y0: r.y0 - p, y1: r.y1 + p + (k.kinder ? GURT : 0)};
  }
  function zeige(k, sofort){ B.rand = K.rand();
    const f = feldVon.get(k);   // ein Bild, das man schon sieht, bleibt, wo es ist: es wird nur groß
    if(f && !sofort && B.s >= 11){ const px = B.zuX(f.x + f.g / 2), py = B.zuY(f.y + f.g / 2); if(px > 0 && px < B.w && py > B.rand.oben && py < B.h - B.rand.unten) return B.neu(); } const z = B.blickAuf(rahmenVon(k), 1.06); sofort ? B.setze(z) : B.fliege(z); }

  function treffer(px, py){
    const wx = B.vonX(px), wy = B.vonY(py); let kette = null;
    const f = W.felder.find(f => wx >= f.x && wx < f.x + f.g && wy >= f.y && wy < f.y + f.g);
    if(f && B.s * f.g >= 9) return f.q;   // ein Bild, das man sieht, wählt man direkt
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
  function tipp(px, py){ const fg = feldVon.get(K.gewaehlt()); if(fg && fg.gross && px >= fg.gross[0] && px <= fg.gross[0] + fg.gross[2] && py >= fg.gross[1] && py <= fg.gross[1] + fg.gross[3]) return K.oeffne(fg.q);
    const k = treffer(px, py); if(!k) return; if(k === K.gewaehlt()){ if(!k.kinder) K.oeffne(k); else zeige(k); } else K.waehle(k); }
  function schwebe(px, py){ let k = px < 0 ? null : treffer(px, py);
    if(px >= 0 && B.s >= 4){ const wx = B.vonX(px), wy = B.vonY(py), f = W.felder.find(f => wx >= f.x && wx < f.x + f.g && wy >= f.y && wy < f.y + f.g); if(f) k = f.q; } if(k !== schweb){ schweb = k; B.c.style.cursor = k ? 'pointer' : ''; B.neu(); } }

  /* ---------- Zeichnen ---------- */
  const zufall = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  /* Drei Richtungen für die Optik, zur Wahl (Ralf, 10.11.: „Die Grafik nicht, die Optik nicht“). Gleicher Bau, gleiche Bilder. */
  const STILE = {
    holz: {himmel: ['#cfe0e6', '#e9ecdf', '#f9ebcf'], sonne: ['rgba(255,246,214,.9)', 'rgba(255,240,200,.55)', 'rgba(255,240,200,0)'], huegel: ['#cddccb', '#b9d0a4'], erde: ['#4a3324', '#3a281d', '#1d1410'], gras: ['#6f9a48', '#8fb85c'],
      holz: '#3d2a1f', holz2: '#6a4c35', stein: '#57463a', stein2: '#6b584a', kammer: '#241812', leer: 'rgba(61,42,31,.3)', raum: ['rgba(120,88,58,.30)', 'rgba(120,88,58,.10)'], geruest: '#8a6a48',
      papier: '#fdf9ef', papierUnten: '#cbbd9f', hinterBild: '#e6dcc6', rahmen: '#2b241c', schatten: true},
    nacht: {himmel: ['#070b14', '#101a2c', '#2a2f45'], sonne: ['rgba(225,232,255,.95)', 'rgba(170,190,255,.22)', 'rgba(150,170,255,0)'], huegel: ['#161d2c', '#0f1520'], erde: ['#0e0c0b', '#0a0908', '#050505'], gras: ['#141c18', '#1f2a22'],
      holz: '#05070b', holz2: '#232b3a', stein: '#15161a', stein2: '#22242b', kammer: '#0a0907', leer: 'rgba(150,170,210,.16)', raum: ['rgba(255,186,96,.30)', 'rgba(255,170,80,.08)'], geruest: '#4a5568',
      papier: '#f1e6cc', papierUnten: '#d9c9a4', hinterBild: '#20242c', rahmen: '#ffffff', dunkel: true, sterne: true, glut: true},
    zeichnung: {himmel: ['#fbfaf6', '#fbfaf6', '#fbfaf6'], sonne: null, huegel: null, erde: ['#efece4', '#ebe8df', '#e4e0d6'], gras: null,
      holz: '#1f2328', holz2: '#1f2328', stein: '#dcd8cd', stein2: '#c4c0b4', kammer: '#fbfaf6', leer: 'rgba(31,35,40,.22)', raum: null, geruest: '#7a7f86',
      papier: '#ffffff', papierUnten: '#ffffff', hinterBild: '#eeeae0', rahmen: '#c0392b', fundHell: true, strich: true}
  };
  const T = STILE[new URLSearchParams(location.search).get('stil')] || STILE.holz;
  const HOLZ = T.holz, HOLZ2 = T.holz2, STEIN = T.stein, STEIN2 = T.stein2;

  function zeichne(_, t){
    const x = B.x, {w, h, s} = B, roh = B.ruhig() ? 1 : klemme((t - start) / 2600), P = 1 - (1 - roh) * (1 - roh); if(roh >= 1) fertig = true;
    const X = B.zuX, Y = B.zuY, br = W.breit, y0 = Y(0);
    const da = z => fertig ? 1 : klemme((P * 1.1 - z.zeit * 0.9) / 0.1);
    // Himmel, Hügel, Erde: dieselbe Welt wie der Baum
    const hg = x.createLinearGradient(0, Math.min(Y(W.rahmen.y0 - 20), y0 - 1), 0, y0); hg.addColorStop(0, T.himmel[0]); hg.addColorStop(0.55, T.himmel[1]); hg.addColorStop(1, T.himmel[2]); x.fillStyle = hg; x.fillRect(0, 0, w, h);
    if(T.sterne){ x.fillStyle = '#dfe6ff'; for(let i = 0; i < 260; i++){ const px = zufall(i, 1) * w, py = zufall(i, 2) * Math.min(h, y0) * 0.95, r = zufall(i, 3); x.globalAlpha = 0.25 + r * 0.6; x.fillRect(px, py, r > 0.92 ? 2 : 1, r > 0.92 ? 2 : 1); } x.globalAlpha = 1; }
    const sx = X(-br * 0.35), sy = Y(W.dach * 0.8), sr = (T.sterne ? 36 : 90) * s; if(T.sonne){ const sg = x.createRadialGradient(sx, sy, 0, sx, sy, sr); sg.addColorStop(0, T.sonne[0]); sg.addColorStop(T.sterne ? 0.1 : 0.12, T.sonne[T.sterne ? 0 : 1]); sg.addColorStop(T.sterne ? 0.13 : 0.12, T.sonne[1]); sg.addColorStop(1, T.sonne[2]); x.fillStyle = sg; x.fillRect(sx - sr, sy - sr, sr * 2, sr * 2); }
    if(T.huegel && y0 > 0 && y0 < h + 40 * s){ const huegel = (hoch, f1, f2, farbe) => { x.beginPath(); x.moveTo(0, y0); for(let px = 0; px <= w + 8; px += 8){ const wx = B.vonX(px); x.lineTo(px, y0 - (hoch + Math.sin(wx / f1) * hoch * 0.5 + Math.sin(wx / f2 + 2) * hoch * 0.3) * s); } x.lineTo(w, y0); x.closePath(); x.fillStyle = farbe; x.fill(); };
      huegel(8, 61, 23, T.huegel[0]); huegel(3.6, 37, 13, T.huegel[1]); }
    if(y0 < h){ const eg = x.createLinearGradient(0, y0, 0, Math.max(Y(W.tief + 12), y0 + 1)); eg.addColorStop(0, T.erde[0]); eg.addColorStop(0.2, T.erde[1]); eg.addColorStop(1, T.erde[2]); x.fillStyle = eg; x.fillRect(0, y0, w, h - y0);
      if(T.gras){ x.fillStyle = T.gras[0]; x.fillRect(0, y0 - 0.35 * s, w, 0.7 * s); x.fillStyle = T.gras[1]; x.fillRect(0, y0 - 0.35 * s, w, Math.max(1, 0.18 * s)); }
      else {   // Zeichnung: die Erde als Schraffur unter einer Linie
        x.strokeStyle = 'rgba(31,35,40,.16)'; x.lineWidth = 1; x.beginPath(); const ab = Math.max(7, 1.1 * s); for(let px = -h; px < w; px += ab){ x.moveTo(px, y0); x.lineTo(px + (h - y0), h); } x.stroke();
        x.fillStyle = T.holz; x.fillRect(0, y0 - 1, w, 2); } }
    const R = (a, b, c, d) => x.fillRect(X(a), Y(b), (c - a) * s, (d - b) * s);

    // das Fundament: ein Block aus Stein, darin gewölbte Kammern
    if(W.fund.length){ const f0 = -3 - RAND, f1 = -3 + W.fb + RAND, ft = 0.5, fu = W.tief + 0.8, a = fertig ? 1 : klemme(P * 1.1 / 0.12);
      x.globalAlpha = a; x.fillStyle = STEIN; x.beginPath(); x.moveTo(X(f0), Y(ft)); x.lineTo(X(f1), Y(ft)); x.lineTo(X(f1 + 2.2), Y(fu)); x.lineTo(X(f0 - 2.2), Y(fu)); x.closePath(); x.fill();
      x.fillStyle = STEIN2; R(f0, ft, f1, ft + 0.5);
      if(s > 4){ x.strokeStyle = 'rgba(30,20,14,.28)'; x.lineWidth = 1; x.beginPath(); for(let yy = ft + 1.4; yy < fu; yy += 1.4){ x.moveTo(X(f0 - 2.2 * (yy - ft) / (fu - ft)), Y(yy)); x.lineTo(X(f1 + 2.2 * (yy - ft) / (fu - ft)), Y(yy)); } x.stroke(); }
      x.globalAlpha = 1;
      for(const z of W.zeilen){ if(z.teil !== 'fund') continue; const d = da(z); if(d <= 0) continue; x.globalAlpha = d; x.fillStyle = T.kammer; x.beginPath(); x.roundRect(X(z.x0 - 0.35), Y(z.yt - 0.35), (z.weit + 0.7) * s, (z.hoch + 0.7) * s, 0.5 * s); x.fill();
        x.fillStyle = STEIN2; for(const p of z.pfosten) R(z.x0 + p - 0.22, z.yt - 0.35, z.x0 + p + 0.22, z.yb + 0.35); } x.globalAlpha = 1; }

    // der Bau: Außenstützen, Träger als Fachwerk, Pfosten
    const bauZeilen = W.zeilen.filter(z => z.teil === 'bau'), fein = GURT * s > 7;
    for(const z of bauZeilen){ const d = da(z); if(d <= 0) continue; x.globalAlpha = d;
      const st = 0.55 + 1.5 * Math.sqrt(z.last / W.last), erste = z.nr === 0;
      if(T.raum){ const rg = x.createLinearGradient(0, Y(z.yt), 0, Y(z.yb)); rg.addColorStop(0, T.raum[T.glut ? 1 : 0]); rg.addColorStop(1, T.raum[T.glut ? 0 : 1]); x.fillStyle = rg; R(-RAND + 0.5, z.yt, br + RAND - 0.5, z.yb); }
      x.fillStyle = HOLZ; R(-RAND - st + 0.55, z.yt, -RAND + 0.55, z.yb + GURT); R(br + RAND - 0.55, z.yt, br + RAND + st - 0.55, z.yb + GURT);
      x.fillStyle = HOLZ2; R(-RAND - st + 0.55, z.yt, -RAND - st + 0.55 + st * 0.3, z.yb + GURT); R(br + RAND - 0.55, z.yt, br + RAND - 0.55 + st * 0.3, z.yb + GURT);
      // Träger
      const g0 = z.yb, g1 = z.yb + GURT, dick = erste ? 0.34 : 0.22;
      x.fillStyle = erste ? HOLZ : HOLZ; if(!fein){ x.globalAlpha = d * (erste ? 1 : 0.8); R(-RAND, g0, br + RAND, g1); x.globalAlpha = d; }
      else { R(-RAND, g0, br + RAND, g0 + dick); R(-RAND, g1 - dick, br + RAND, g1);
        x.strokeStyle = HOLZ; x.lineWidth = Math.max(1, (erste ? 0.2 : 0.13) * s); x.lineJoin = 'round'; x.beginPath(); const schritt = GURT * 0.9; let auf = false; x.moveTo(X(-RAND), Y(g1 - dick));
        for(let xx = -RAND; xx < br + RAND; xx += schritt){ x.lineTo(X(Math.min(br + RAND, xx + schritt)), Y(auf ? g1 - dick : g0 + dick)); auf = !auf; } x.stroke();
        if(erste){ x.globalAlpha = d * 0.16; x.fillStyle = HOLZ; R(-RAND, g0, br + RAND, g1); x.globalAlpha = d; } }
      x.fillStyle = HOLZ; for(const p of z.pfosten) R(p - 0.2, z.yt, p + 0.2, z.yb);
      if(s > 9){ x.fillStyle = T.leer; for(const p of z.fugen) R(p - 0.05, z.yt + 0.6, p + 0.05, z.yb); }
      // freie Felder am Ende der Zeile: offenes Fachwerk, Platz zum Wachsen
      if(z.ende < br - 1.5 && s > 2.5){ x.strokeStyle = T.leer; x.lineWidth = Math.max(1, 0.08 * s); x.beginPath(); const a0 = z.ende + 0.6; x.moveTo(X(a0), Y(z.yt)); x.lineTo(X(a0), Y(z.yb));
        for(let xx = a0; xx < br - 0.5; xx += z.hoch + 1){ const x1 = Math.min(br, xx + z.hoch + 1); x.moveTo(X(xx), Y(z.yb)); x.lineTo(X(x1), Y(z.yt)); x.moveTo(X(xx), Y(z.yt)); x.lineTo(X(x1), Y(z.yb)); x.moveTo(X(x1), Y(z.yt)); x.lineTo(X(x1), Y(z.yb)); } x.stroke(); }
    }
    x.globalAlpha = 1;
    // Sockel und Dachstuhl
    { const a = fertig ? 1 : klemme((P * 1.1 - 0.25) / 0.1); x.globalAlpha = a; x.fillStyle = STEIN2; R(-RAND - 2.6, -1.2, br + RAND + 2.6, 0.5); x.fillStyle = STEIN; R(-RAND - 2.6, -0.2, br + RAND + 2.6, 0.5);
      const d = fertig ? 1 : klemme((P * 1.1 - 1) / 0.08); x.globalAlpha = d; const yd = W.dach, first = yd - br * 0.16, l = -RAND - 1.6, r = br + RAND + 1.6, m = br / 2;
      x.strokeStyle = HOLZ; x.lineWidth = Math.max(1.5, 0.42 * s); x.lineJoin = 'round'; x.lineCap = 'round'; x.beginPath(); x.moveTo(X(l), Y(yd)); x.lineTo(X(m), Y(first)); x.lineTo(X(r), Y(yd)); x.closePath(); x.stroke();
      x.lineWidth = Math.max(1, 0.18 * s); x.beginPath(); const n = 8; for(let i = 1; i < n; i++){ const u = i / n, xx = l + (r - l) * u, yy = yd + (first - yd) * (1 - Math.abs(u - 0.5) * 2); x.moveTo(X(xx), Y(yd)); x.lineTo(X(xx), Y(yy)); const v = (i + (u < 0.5 ? 1 : -1)) / n, x2 = l + (r - l) * v, y2 = yd + (first - yd) * (1 - Math.abs(v - 0.5) * 2); if(i !== n / 2){ x.moveTo(X(xx), Y(yd)); x.lineTo(X(x2), Y(y2)); } } x.stroke(); x.globalAlpha = 1; }
    // das Gerüst
    for(const z of W.zeilen){ if(z.teil !== 'geruest') continue; const d = da(z); if(d <= 0) continue; x.globalAlpha = d * 0.9; x.strokeStyle = T.geruest; x.lineWidth = Math.max(1, 0.12 * s); x.beginPath();
      const a = z.x0 - 0.6, b = z.x0 + z.weit + 0.6; for(const xx of [a, b]){ x.moveTo(X(xx), Y(z.yt - 0.8)); x.lineTo(X(xx), Y(z.nr === 0 ? 0 : z.yb + 0.5)); } x.moveTo(X(a - 0.5), Y(z.yb)); x.lineTo(X(b + 0.5), Y(z.yb)); x.moveTo(X(a - 0.5), Y(z.yt - 0.5)); x.lineTo(X(b + 0.5), Y(z.yt - 0.5));
      x.moveTo(X(a), Y(z.yb)); x.lineTo(X(b), Y(z.yt - 0.5)); x.moveTo(X(a), Y(z.yt - 0.5)); x.lineTo(X(b), Y(z.yb)); x.stroke(); x.globalAlpha = 1; }

    // die Felder: Fassungen. Mit Bild das Bild selbst, in jeder Entfernung. Ohne Bild ein Blatt Papier mit dem Namen: nichts wird vorgetäuscht.
    const fuge = s < 5 ? 0.4 : Math.min(0.07 * s, 3), ecke = Math.min(0.1 * s, 5);
    for(const f of W.felder){ const px = X(f.x), py = Y(f.y); if(px > w || px + s < 0 || py > h || py + s < 0) continue; const d = da(f.z); if(d <= 0) continue;
      const a = fertig ? 1 : klemme(d * 2 - (f.ry / HOCH)); if(a <= 0) continue; x.globalAlpha = a;
      { const fg2 = f.g < 1 ? fuge * 0.6 : fuge; feld(x, f, px + fg2, py + fg2, s * f.g - fg2 * 2, f.g < 1 ? ecke * 0.5 : ecke, t, a); }
    }
    x.globalAlpha = 1;

    // gewählt: es bleibt im Licht, und der Weg seiner Last leuchtet bis ins Fundament
    const gew = K.gewaehlt();
    if(gew && gew.art !== 'wurzel'){
      const stellen = (I.nachSchluessel.get(gew.schluessel) || [gew]).map(k => ({k, l: rechteVon(k)})).filter(a => a.l);
      if(stellen.length){ const pad = gew.kinder ? 0.25 : 0.1;
        x.strokeStyle = '#ffb53d'; x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = 'rgba(255,170,40,.9)'; x.shadowBlur = 12; x.lineWidth = Math.max(2, Math.min(0.3 * s, 5));
        const puls = B.ruhig() ? 1 : 0.75 + 0.25 * Math.sin(t * 0.004); x.globalAlpha = puls; x.beginPath();
        for(const r of (rechteVon(gew) || [])){ const z = r.z; if(z.teil !== 'bau') { if(z.teil === 'fund'){ x.moveTo(X(r.x0), Y(r.y1 + 0.18)); x.lineTo(X(r.x1), Y(r.y1 + 0.18)); } continue; }
          const g = r.y1 + 0.17, li = -RAND + 0.2, re = br + RAND - 0.2;   // über den Träger zu beiden Stützen, die Stützen hinab
          x.moveTo(X(r.x0), Y(g)); x.lineTo(X(r.x1), Y(g)); x.moveTo(X(r.x0), Y(g)); x.lineTo(X(li), Y(g)); x.lineTo(X(li), Y(0.5)); x.moveTo(X(r.x1), Y(g)); x.lineTo(X(re), Y(g)); x.lineTo(X(re), Y(0.5)); }
        if((rechteVon(gew) || []).some(r => r.z.teil === 'bau')){ x.moveTo(X(-3 - RAND), Y(0.75)); x.lineTo(X(-3 + W.fb + RAND), Y(0.75)); }
        x.stroke(); x.shadowColor = 'transparent'; x.shadowBlur = 0; x.globalAlpha = 1;
        if(!B.ruhig() && fertig) setTimeout(B.neu, 60);
        x.strokeStyle = T.rahmen; x.lineWidth = 2; for(const a of stellen){ x.setLineDash(a.k === gew ? [] : [2, 5]); for(const r of a.l){ x.beginPath(); x.roundRect(X(r.x0 - pad), Y(r.y0 - pad), (r.x1 - r.x0 + pad * 2) * s, (r.y1 - r.y0 + pad * 2) * s, 6); x.stroke(); } } x.setLineDash([]); }
    }
    if(schweb && schweb !== gew && schweb.kinder){ x.strokeStyle = 'rgba(43,36,28,.5)'; x.lineWidth = 1.2; for(const r of rechteVon(schweb) || []){ x.beginPath(); x.roundRect(X(r.x0), Y(r.y0), (r.x1 - r.x0) * s, (r.y1 - r.y0) * s, 5); x.stroke(); } }

    schrift(x, P, gew);
    // groß: das Gewählte und das, worüber der Zeiger steht
    const fg = feldVon.get(gew), fs = feldVon.get(schweb);
    if(fg) gross(x, fg, t, true); if(fs && fs !== fg) gross(x, fs, t, false);
  }

  /* Ein Feld zeichnen: das echte Bild, sonst ein Blatt Papier mit dem Namen */
  function umbruch(x, text, breit, zeilen){ const w = text.split(/\s+/), l = []; let z = '';
    for(const wort of w){ const p = z ? z + ' ' + wort : wort; if(x.measureText(p).width <= breit || !z) z = p; else { l.push(z); z = wort; if(l.length === zeilen) break; } }
    if(l.length < zeilen && z) l.push(z); else if(l.length === zeilen) l[zeilen - 1] = l[zeilen - 1].replace(/.{0,2}$/, '…'); return l; }
  function feld(x, f, px, py, g, ecke, t, a, scharf){
    const bild = f.q.bild, unten = f.z.teil === 'fund', gs = f.q.art === 'gespraech';
    if(bild){ const gr = g * B.dpr > 300 || scharf, e = (gr && lager.nimm(bild, 960)) || lager.nimm(bild, 240);
      if(T.schatten && g > 16 && !scharf){ x.shadowColor = 'rgba(40,26,14,.35)'; x.shadowBlur = g * 0.12; x.shadowOffsetY = g * 0.05 * B.dpr; } else if(T.glut && g > 6 && !scharf){ x.shadowColor = 'rgba(255,190,110,.55)'; x.shadowBlur = g * 0.35; }
      x.fillStyle = unten && !T.fundHell ? '#2c2019' : T.hinterBild; if(g < 4){ x.fillRect(px, py, g, g); } else { x.beginPath(); x.roundRect(px, py, g, g, ecke); x.fill(); } x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
      if(T.strich && g >= 4){ x.strokeStyle = 'rgba(31,35,40,.55)'; x.lineWidth = 1; x.stroke(); }
      if(e){ const im = e.bild, k = Math.max(g / im.naturalWidth, g / im.naturalHeight), bw = im.naturalWidth * k, bh = im.naturalHeight * k, al = klemme((t - e.da) / 250);
        x.save(); x.beginPath(); if(g < 4) x.rect(px, py, g, g); else x.roundRect(px, py, g, g, ecke); x.clip(); x.globalAlpha = a * al; if(al < 1) B.neu();
        x.imageSmoothingQuality = 'high'; x.drawImage(im, px + g / 2 - bw / 2, py + g / 2 - bh / 2, bw, bh); x.restore(); x.globalAlpha = a; }
      return; }
    x.fillStyle = unten ? T.papierUnten : T.papier; if(T.dunkel) x.globalAlpha = a * 0.82; if(g < 4){ x.fillRect(px, py, g, g); return; }
    x.beginPath(); x.roundRect(px, py, g, g, ecke); x.fill(); x.globalAlpha = a; x.strokeStyle = T.strich ? 'rgba(31,35,40,.55)' : 'rgba(43,36,28,.22)'; x.lineWidth = 1; x.stroke();
    if(g >= 46){ const gr = klemme(g * 0.115, 9.5, 17); x.font = `${gs ? 'italic ' : ''}500 ${gr}px ${SERIF}`; x.fillStyle = TINTE; x.textAlign = 'left'; x.textBaseline = 'top';
      const l = umbruch(x, f.q.name, g * 0.84, Math.max(2, Math.floor(g * 0.62 / (gr * 1.22)))); l.forEach((z, i) => x.fillText(z, px + g * 0.08, py + g * 0.09 + i * gr * 1.22));
      x.font = `${klemme(g * 0.075, 8.5, 11.5)}px ${SANS}`; x.fillStyle = 'rgba(43,36,28,.55)'; x.textBaseline = 'bottom'; x.fillText(gs ? 'Gespräch' : 'ohne Bild', px + g * 0.08, py + g * 0.93); }
    else if(gs && g > 10){ x.fillStyle = 'rgba(190,120,120,.7)'; x.beginPath(); x.arc(px + g / 2, py + g / 2, g * 0.14, 0, 6.2832); x.fill(); }
  }
  /* Ein Feld groß zeigen, über allem, ganz im Bild; mit seinem Namen darunter */
  function gross(x, f, t, gewaehlt){
    const {w, h} = B, s = B.s * f.g, G = f.q.bild ? klemme(Math.min(w, h) * 0.34, 150, 340) : 170; if(s >= G * 0.8){ f.gross = null; return; }
    const mx = B.zuX(f.x + f.g / 2), my = B.zuY(f.y + f.g / 2), fuss = 46, r = B.rand;
    const px = klemme(mx - G / 2, 8, w - G - 8), py = klemme(my - G / 2, r.oben, Math.max(r.oben, h - r.unten - G - fuss));
    x.save(); x.shadowColor = 'rgba(20,14,8,.45)'; x.shadowBlur = 28; x.shadowOffsetY = 8 * B.dpr; x.fillStyle = '#fdf9ef'; x.beginPath(); x.roundRect(px - 6, py - 6, G + 12, G + fuss + 8, 12); x.fill(); x.restore();
    feld(x, f, px, py, G, 7, t, 1, true);
    x.font = `600 13.5px ${SERIF}`; x.fillStyle = TINTE; x.textAlign = 'left'; x.textBaseline = 'top'; const l = umbruch(x, f.q.name, G - 6, 1); x.fillText(l[0] || '', px + 2, py + G + 7);
    x.font = `11.5px ${SANS}`; x.fillStyle = 'rgba(43,36,28,.6)'; x.fillText(gewaehlt ? 'Noch einmal tippen: lesen' : f.q.eltern.name, px + 2, py + G + 26, G - 6);
    if(gewaehlt){ x.strokeStyle = '#ffb53d'; x.lineWidth = 2.5; x.beginPath(); x.roundRect(px - 6, py - 6, G + 12, G + fuss + 8, 12); x.stroke(); }
    f.gross = gewaehlt ? [px - 6, py - 6, G + 12, G + fuss + 8] : f.gross;
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
      const dk = T.dunkel || (o.dunkel && !T.fundHell);
      if(!o.ohneHof){ x.strokeStyle = dk ? 'rgba(8,10,16,.85)' : T.strich ? 'rgba(251,250,246,.95)' : 'rgba(250,244,230,.9)'; x.lineWidth = Math.max(3, gr * 0.26); x.strokeText(text, px, py); }
      x.fillStyle = (o.hell && !T.strich) || dk ? '#f6e7c9' : o.hell ? '#fbfaf6' : TINTE; x.fillText(text, px, py); x.globalAlpha = 1; return true; };
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
  }

  lege(); B.rand = K.rand(); B.setze(B.blickAuf(rahmenVon(K.gewaehlt()), 1.04));
  return {zeige, ende: B.ende, neu: B.neu};
}
