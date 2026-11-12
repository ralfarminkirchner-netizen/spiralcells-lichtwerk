/* =====================================================================
   INNEN — ein Haus von innen (12.11.2026, Fable). Aus dem Bestand der App gebaut, nichts erfunden.
   Lichthof = die App als Ganzes: Übersichtstafel am Eingang, ringsum die Türen. Jede Tür führt in das Zimmer eines Werks,
   über der Tür leuchtet sein Bild, daneben steht sein Name. Im Zimmer hängt jede Fassung an der linken Wand als großes, scharfes Bild,
   ihr Text gegenüber an der rechten Wand; zwei Fassungen desselben Werks hängen nebeneinander und lassen sich vergleichen.
   Stockwerk = Zeitabschnitt, unten das Älteste; Dachboden = ohne belegtes Datum. Die Treppe führt durch die Zeit.
   Türrahmen und Wandton = Farbe der Stimme. Gegangen wird auf Rechtecken (Räume, Umgang, Türen, Treppenläufe).
   Der Innenraum liegt tief unter dem Dorf und wird nur gebaut, solange man drin ist.
   ===================================================================== */
import * as THREE from 'three/webgpu';
import {texture, uv} from 'three/tsl';
import {Sammler, fassadenMatrix, farbe, toene, mische} from './bau.js';

const SB = 3.6, H = 3.5, RH = 3.0, G = 2.6, WD = 0.24, TB = 0.58, TH = 2.2, TIEF = 2.7, BASIS = -800, TAG = 86400000;
const OHNE_TAFELN = /[?&]ohne=[^&]*tafeln/.test(location.search);
const LAUF = 4.4, ANTRITT = 0.9, STUFEN = 10;
const tagWort = t => t == null ? 'ohne belegtes Datum' : new Date(t).toLocaleDateString('de-DE', t % TAG === 0 ? {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'} : {month: 'long', year: 'numeric', timeZone: 'UTC'});
const spanne = (a, b) => a === b ? tagWort(a) : tagWort(a) + ' bis ' + tagWort(b);
const HOLZ = [0.5, 0.4, 0.3], DUNKEL = [0.2, 0.16, 0.13], WAND = [0.93, 0.88, 0.79], STEINTON = [0.62, 0.6, 0.57];

function hohl(S, stoff, x0, y0, z0, x1, y1, z1, f, seiten){
  if(seiten.includes('Z')) S.quad(stoff, [x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], f);
  if(seiten.includes('z')) S.quad(stoff, [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], f);
  if(seiten.includes('X')) S.quad(stoff, [x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], f);
  if(seiten.includes('x')) S.quad(stoff, [x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], f);
  if(seiten.includes('Y')) S.quad(stoff, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], f);
  if(seiten.includes('y')) S.quad(stoff, [x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], f);
}
function zeilen(c, text, breite){ const aus = []; for(const absatz of String(text).split('\n')){ const w = absatz.split(/\s+/).filter(Boolean); if(!w.length){ aus.push(''); continue; } let z = ''; for(const wort of w){ const t = z ? z + ' ' + wort : wort; if(z && c.measureText(t).width > breite){ aus.push(z); z = wort; } else z = t; } aus.push(z); } return aus; }
function schreibe(c, text, x, y, breite, hoch, max){ const l = zeilen(c, text, breite); for(let i = 0; i < l.length && i < max; i++){ let t = l[i]; if(i === max - 1 && l.length > max){ while(t && c.measureText(t + ' …').width > breite) t = t.slice(0, -1); t += ' …'; } c.fillText(t, x, y); y += hoch; } return y; }
function klartext(roh){ roh = String(roh || '').trim(); if(!roh) return ''; if(roh.startsWith('{')){ try{ roh = JSON.parse(roh).summary || ''; }catch(e){ /* als Text */ } }
  if(/^<!doctype html/i.test(roh)) return 'Diese Fassung ist eine gebaute Seite. Die Lesefläche zeigt ihren Quelltext.';
  return roh.replace(/```[\s\S]*?```/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^#{1,6}\s+/gm, '').replace(/^\s*[-*•]\s+/gm, '· ').replace(/[*_`>|]+/g, '').replace(/\n{3,}/g, '\n\n').trim(); }

/* ---------- Der Grundriss aus dem Bestand ---------- */
export function entwirfInnen(h, {fassungenVon, stimmeVon}){
  const k = h.k, E = [], eigene = [], gespr = [];
  for(const c of k.kinder || []){ if(c.art === 'fassung') eigene.push(c); else if(c.art === 'gespraech') gespr.push(c); else { const fs = fassungenVon(c).filter(f => f.art === 'fassung'); if(fs.length) E.push({k: c, name: c.name, fass: fs}); } }
  if(eigene.length) E.push({k, name: E.length ? 'Direkt in ' + k.name : k.name, fass: eigene, eigen: true});
  for(const e of E){ const d = e.fass.filter(f => f.von != null).map(f => f.von); e.von = d.length ? Math.min(...d) : null; e.bis = d.length ? Math.max(...d) : null;
    const z = new Map(); for(const f of e.fass){ const s = stimmeVon(f.stimme); z.set(s.n, {n: s.n, f: s.f, c: (z.get(s.n) || {c: 0}).c + 1}); } e.stimmen = [...z.values()].sort((a, b) => b.c - a.c); e.stimme = e.stimmen[0]; }
  const dat = E.filter(e => e.von != null), ohne = E.filter(e => e.von == null);
  let schl = e => e.von, keys = [...new Set(dat.map(schl))].sort((a, b) => a - b);
  if(keys.length > 4){ const mon = t => { const d = new Date(t); return d.getUTCFullYear() * 12 + d.getUTCMonth(); }; schl = e => mon(e.von); keys = [...new Set(dat.map(schl))].sort((a, b) => a - b); }
  let gruppen = keys.map(q => [q]);
  if(keys.length > 4){ gruppen = [[]]; let voll = 0; for(const q of keys){ const c = dat.filter(e => schl(e) === q).length; if(gruppen.length < 4 && voll >= dat.length / 4 && gruppen[gruppen.length - 1].length){ gruppen.push([]); voll = 0; } gruppen[gruppen.length - 1].push(q); voll += c; } }
  const ebenen = gruppen.map(g => { const es = dat.filter(e => g.includes(schl(e))); return {einheiten: es, von: Math.min(...es.map(e => e.von)), bis: Math.max(...es.map(e => e.von))}; });
  if(ohne.length) ebenen.push({einheiten: ohne, dach: true});
  if(gespr.length){ if(!ebenen.length) ebenen.push({einheiten: [], dach: true}); ebenen[0].einheiten.push({k, name: 'Gespräche', fass: gespr, gespraeche: true, von: null, stimme: {n: 'Gespräche', f: '#d8c9a8'}, stimmen: []}); }
  if(!ebenen.length) return null;
  const mehr = ebenen.length > 1;
  ebenen.forEach((e, i) => { e.nr = i; e.name = i === 0 ? 'Erdgeschoss' : e.dach ? 'Dachboden' : i + '. Stock'; e.zeit = e.dach ? 'ohne belegtes Datum' : spanne(e.von, e.bis);
    e.einheiten.sort((a, b) => a.stimme.n.localeCompare(b.stimme.n, 'de') || (a.von ?? 9e15) - (b.von ?? 9e15) || a.name.localeCompare(b.name, 'de')); });
  const bedarf = Math.max(...ebenen.map((e, i) => e.einheiten.length + (mehr ? 1 : 0) + (i === 0 ? 1 : 0)));
  let nx = 3, nz = 2; while(2 * (nx + nz) < bedarf){ if(nx <= nz * 1.4) nx += 2; else nz += 1; }
  const hx = nx * SB / 2, hz = nz * SB / 2, mk = (px, pz, ax, az) => ({p: [px, pz], n: [ax, az], t: [az, -ax]});
  const Sd = [], Os = [], Nd = [], We = [];
  for(let i = 0; i < nx; i++){ Sd.push(mk(-hx + (i + 0.5) * SB, hz, 0, 1)); Nd.push(mk(hx - (i + 0.5) * SB, -hz, 0, -1)); }
  for(let i = 0; i < nz; i++){ Os.push(mk(hx, hz - (i + 0.5) * SB, 1, 0)); We.push(mk(-hx, -hz + (i + 0.5) * SB, -1, 0)); }
  const mi = Math.floor(nx / 2), eingang = Sd[mi], treppe = mehr ? Nd[mi] : null, rund = [...Sd.slice(mi + 1), ...Os, ...Nd, ...We, ...Sd.slice(0, mi)];
  ebenen.forEach((e, i) => { const frei = rund.filter(s => s !== treppe); if(i > 0) frei.push(eingang); e.plaetze = frei.map((s, n) => ({s, e: e.einheiten[n] || null})); });
  return {k, h, ebenen, nx, nz, hx, hz, eingang, treppe, einheiten: E.length, hoch: ebenen.length * H};
}

/* ---------- Bau, Gehen, Licht, Tafeln ---------- */
export function richteInnen({scene, camera, stoffVon, atlasT, atlasFeld, lichter, bildUrl, stimmeVon, fassungenVon, mengenWort, zeitWort, bezug, BELEGT, texte, funktionsName, beiHinaus}){
  const Z = {an: false, haus: null, plan: null, start: null}; let G0 = null, rechtecke = [], bloecke = [], lampen = [], tafeln = [], einheiten = [], abschnitte = [], fuss = 0, takt = 0, ausgang = null, hofLicht = [], altLicht = null, wegwerf = [];
  const zuWelt = (s, u, w) => [s.p[0] + s.t[0] * u + s.n[0] * w, s.p[1] + s.t[1] * u + s.n[1] * w];
  const recht = (s, u0, w0, u1, w1, y, e) => { const a = zuWelt(s, u0, w0), b = zuWelt(s, u1, w1), r = {x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), z0: Math.min(a[1], b[1]), z1: Math.max(a[1], b[1]), y, e: e || null}; rechtecke.push(r); return r; };
  const hoeheIn = (r, x, z) => typeof r.y === 'function' ? r.y(x, z) : r.y;
  function unter(x, z){ let best = null, bd = 0.95; for(const r of rechtecke){ if(x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) continue; const d = Math.abs(hoeheIn(r, x, z) - fuss); if(d < bd){ bd = d; best = r; } } return best; }
  Z.sperre = (x, z) => { if(bloecke.some(b => x > b[0] && x < b[2] && z > b[1] && z < b[3] && Math.abs(fuss) < 1)) return true; return !unter(x, z); };
  Z.boden = (x, z) => { const r = unter(x, z); if(r) fuss = hoeheIn(r, x, z); return BASIS + fuss; };
  Z.wo = () => { const r = unter(camera.position.x, camera.position.z); return r ? r.e : null; };

  function netzMesh(N, tex, hell){ if(!N.i.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(N.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(N.u, 2)); g.setIndex(N.i);
    const m = new THREE.MeshBasicNodeMaterial(); m.colorNode = texture(tex, uv()).rgb.mul(hell); const o = new THREE.Mesh(g, m); o.frustumCulled = false; G0.add(o); wegwerf.push(g, m); }
  function tafel(N, S, m, r, b, h, feld){ const c = new THREE.Vector3(m[0], m[1], m[2]).applyMatrix4(S.M), R = new THREE.Vector3(r[0], r[1], r[2]).transformDirection(S.M), i0 = N ? N.p.length / 3 : 0;
    if(N){ for(const [a, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ N.p.push(c.x + R.x * a * b / 2, c.y + q * h / 2, c.z + R.z * a * b / 2); N.u.push(feld[0] + (a + 1) / 2 * feld[2], feld[1] + (q + 1) / 2 * feld[3]); } N.i.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); }
    return {mitte: c, r: R, n: new THREE.Vector3().crossVectors(R, new THREE.Vector3(0, 1, 0)), b, h}; }
  const leinwand = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const alsTextur = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const SCHRIFT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

  Z.oeffne = h => {
    const P = entwirfInnen(h, {fassungenVon, stimmeVon}); if(!P) return false;
    Z.plan = P; Z.haus = h; G0 = new THREE.Group(); rechtecke = []; bloecke = []; lampen = []; tafeln = []; einheiten = []; abschnitte = []; wegwerf = []; fuss = 0;
    const S = new Sammler(); S.fuss = -1e5; const {hx, hz, ebenen} = P, oben = P.hoch, NA = {p: [], u: [], i: []}, NS = {p: [], u: [], i: []};
    const alleE = ebenen.flatMap(e => e.einheiten), zeilenS = Math.ceil(alleE.length / 8), SH = zeilenS * 320 + ebenen.length * 136 + 8, sc = leinwand(4096, SH), sx = sc.getContext('2d'); sx.fillStyle = '#17130f'; sx.fillRect(0, 0, 4096, SH);
    const sFeld = (px, py, w, hh) => [px / 4096, 1 - (py + hh) / SH, w / 4096, hh / SH];
    S.mit(new THREE.Matrix4().makeTranslation(0, BASIS, 0), () => {
      /* Lichthof: Boden, Decke, Balken, Umgänge mit Geländer */
      S.quad('holz', [-hx, 0, hz], [hx, 0, hz], [hx, 0, -hz], [-hx, 0, -hz], [0.62, 0.52, 0.42]);
      hohl(S, 'putz', -hx, 0, -hz, hx, oben, hz, toene(WAND, 0.55), 'Y');
      for(let x = -hx + SB; x < hx - 0.1; x += SB) S.kasten('holz', x - 0.14, oben - 0.32, -hz, x + 0.14, oben, hz, DUNKEL, 'xXy');
      rechtecke.push({x0: -hx + 0.35, x1: hx - 0.35, z0: -hz + 0.35, z1: hz - 0.35, y: 0, e: null});
      for(let L = 1; L < ebenen.length; L++){ const y = L * H, ix = hx - G, iz = hz - G;
        for(const [x0, z0, x1, z1] of [[-hx, iz, hx, hz], [-hx, -hz, hx, -iz], [-hx, -iz, -ix, iz], [ix, -iz, hx, iz]]) S.platte('bretter', 'holz', [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], 0.3, HOLZ, DUNKEL);
        const a0 = hx - 0.35, c0 = hz - 0.35; for(const [x0, z0, x1, z1] of [[-a0, iz + 0.3, a0, c0], [-a0, -c0, a0, -iz - 0.3], [-a0, -c0, -ix - 0.3, c0], [ix + 0.3, -c0, a0, c0]]) rechtecke.push({x0, x1, z0, z1, y, e: null});
        const ecken = [[-ix, -iz], [ix, -iz], [ix, iz], [-ix, iz]]; for(let q = 0; q < 4; q++){ const a = ecken[q], b = ecken[(q + 1) % 4], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(len / 0.9);
          S.balken('holz', [a[0], y + 1.05, a[1]], [b[0], y + 1.05, b[1]], 0.09, 0.07, DUNKEL); S.balken('holz', [a[0], y + 0.12, a[1]], [b[0], y + 0.12, b[1]], 0.05, 0.05, DUNKEL);
          for(let j = 0; j <= n; j++){ const t = j / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; S.kasten('holz', x - 0.03, y, z - 0.03, x + 0.03, y + 1.05, z + 0.03, DUNKEL, 'xXzZ'); } } }
      /* Übersichtstafel am Eingang */
      { const bz = Math.min(hz - 5.2, hz * 0.45), bb = Math.min(5.2, hx * 2 - 3), bh = bb / 2; S.kasten('holz', -bb / 2 - 0.1, 0, bz - 0.09, bb / 2 + 0.1, 0.62 + bh + 0.14, bz - 0.01, DUNKEL); S.kasten('holz', -bb / 2 - 0.25, 0, bz - 0.3, -bb / 2 + 0.05, 0.12, bz + 0.3, DUNKEL); S.kasten('holz', bb / 2 - 0.05, 0, bz - 0.3, bb / 2 + 0.25, 0.12, bz + 0.3, DUNKEL);
        bloecke.push([-bb / 2 - 0.4, bz - 0.5, bb / 2 + 0.4, bz + 0.4]); Z._brett = {z: bz, b: bb, h: bh}; }
      /* Leuchter im Hof */
      { const y = oben - 1.3; S.balken('zink', [0, oben, 0], [0, y + 0.3, 0], 0.04, 0.04, [0.12, 0.12, 0.14]); S.drehkoerper('zink', 0, 0, [[0.9, y + 0.22], [1.0, y + 0.3], [0.9, y + 0.36]], 16, [0.14, 0.13, 0.12]);
        for(let j = 0; j < 8; j++){ const a = j / 8 * Math.PI * 2, x = Math.cos(a) * 0.95, z = Math.sin(a) * 0.95; S.kasten('lampe', x - 0.07, y + 0.36, z - 0.07, x + 0.07, y + 0.56, z + 0.07, [1, 1, 1]); } hofLicht = [[0, BASIS + y - 1.2, 0], [0, BASIS + Math.min(3.0, y), hz * 0.3]]; }
      /* je Stockwerk die Plätze ringsum */
      let sNr = 0;
      ebenen.forEach((ebene, L) => { const y = L * H;
        const wandZumHof = (s, loch) => S.mit(fassadenMatrix([s.p[0], y, s.p[1]], [s.t[0], 0, s.t[1]]), () => { S.wand('putz', [SB / 2, 0, 0], [-1, 0, 0], [0, 1, 0], [[0, 0], [SB, 0], [SB, H], [0, H]], loch ? [loch] : [], toene(WAND, 0.86)); S.kasten('putz', -SB / 2 - 0.13, 0, -0.07, -SB / 2 + 0.13, H, 0, toene(WAND, 0.7), 'xXz'); });
        const tuerLoch = [[SB / 2 - TB, 0], [SB / 2 + TB, 0], [SB / 2 + TB, TH], [SB / 2 - TB, TH]];
        for(const {s, e} of ebene.plaetze){ if(!e){ wandZumHof(s, null); continue; }
          wandZumHof(s, tuerLoch); e.ebene = ebene; e.s = s; e.y = y; e.tafeln = []; einheiten.push(e);
          const saal = e.fass.length > 8 && !/[?&]ohne=[^&]*saal/.test(location.search), kojen = []; e.saal = saal; e.abschnitte = [];
          if(saal){ const gr = new Map(), mw = t => t == null ? 'ohne belegtes Datum' : new Date(t).toLocaleDateString('de-DE', {month: 'long', year: 'numeric', timeZone: 'UTC'});
            for(const f of e.fass.slice().sort((a, b) => stimmeVon(a.stimme).n.localeCompare(stimmeVon(b.stimme).n, 'de') || (a.von ?? 9e15) - (b.von ?? 9e15))){ const st = f.art === 'gespraech' ? {n: 'Gespräche', f: '#d8c9a8'} : stimmeVon(f.stimme), key = st.n + '|' + mw(f.von); if(!gr.has(key)) gr.set(key, {st, zeit: mw(f.von), fass: []}); gr.get(key).fass.push(f); }
            let kz = WD + 0.5; for(const q of gr.values()) for(let a = 0; a < q.fass.length; a += 12){ const fs = q.fass.slice(a, a + 12), len = Math.ceil(fs.length / 4) * 1.7 + 0.8; kojen.push({st: q.st, zeit: q.zeit, fass: fs, ab: a, gesamt: q.fass.length, z: kz, len}); kz += len; } e.kojenZahl = kojen.length; }
          const nF = saal ? 0 : Math.min(e.fass.length, 8), D = saal ? kojen[kojen.length - 1].z + kojen[kojen.length - 1].len + 0.6 : WD + 0.5 + nF * TIEF, ton = mische(WAND, farbe(e.stimme.f), 0.14), lack = toene(farbe(e.stimme.f), 0.55);
          e.gezeigt = saal ? [] : e.fass.slice(0, nF); e.tief = D;
          S.mit(fassadenMatrix([s.p[0], y, s.p[1]], [s.t[0], 0, s.t[1]]), () => {
            S.wand('putz', [-SB / 2, 0, WD], [1, 0, 0], [0, 1, 0], [[0, 0], [SB, 0], [SB, RH], [0, RH]], [tuerLoch], ton);
            hohl(S, 'putz', -SB / 2 + 0.1, 0, WD, SB / 2 - 0.1, RH, D, ton, 'xXZ'); hohl(S, 'putz', -SB / 2 + 0.1, 0, WD, SB / 2 - 0.1, RH, D, toene(WAND, 0.8), 'Y'); hohl(S, 'holz', -SB / 2 + 0.1, 0, WD, SB / 2 - 0.1, RH, D, HOLZ, 'y');
            hohl(S, 'holz', -TB, 0, 0, TB, TH, WD, DUNKEL, 'xXYy');
            S.kasten('lack', -TB - 0.11, 0, -0.05, -TB, TH + 0.11, 0, lack, 'xXzY'); S.kasten('lack', TB, 0, -0.05, TB + 0.11, TH + 0.11, 0, lack, 'xXzY'); S.kasten('lack', -TB, TH, -0.05, TB, TH + 0.11, 0, lack, 'zyY');
            S.kasten('lack', -TB - 2 * TB + 0.06, 0.02, WD, -TB - 0.02, TH - 0.02, WD + 0.05, lack, 'xXZY');
            /* über der Tür das Bild des Werks, daneben sein Schild */
            const bf = e.fass.find(f => atlasFeld(f)); if(bf){ S.kasten('holz', -0.86, TH + 0.16, -0.06, 0.86, TH + 1.26, 0, DUNKEL, 'xXzyY'); tafel(NA, S, [0, TH + 0.71, -0.065], [-1, 0, 0], 1.6, 1.0, atlasFeld(bf)); }
            const px = (sNr % 8) * 512, py = Math.floor(sNr / 8) * 320; sNr++; sx.save(); sx.translate(px, py); sx.fillStyle = '#211b15'; sx.fillRect(0, 0, 512, 320); sx.fillStyle = e.stimme.f; sx.fillRect(0, 0, 512, 12);
            sx.fillStyle = '#f6efe2'; sx.font = '600 44px ' + SCHRIFT; sx.textBaseline = 'top'; const yy = schreibe(sx, e.name.replace(/ · Spielraum$/, ''), 26, 34, 460, 52, 3);
            sx.fillStyle = '#c9bda8'; sx.font = '30px ' + SCHRIFT; sx.fillText(e.gespraeche ? (e.fass.length === 1 ? '1 Gespräch' : e.fass.length + ' Gespräche') : (e.fass.length === 1 ? '1 Fassung' : e.fass.length + ' Fassungen'), 26, Math.max(yy + 10, 214)); sx.fillText(e.von == null ? (e.gespraeche ? '' : 'ohne belegtes Datum') : spanne(e.von, e.bis), 26, Math.max(yy + 50, 256)); sx.restore();
            S.kasten('holz', -TB - 0.2 - 1.0, 1.2, -0.04, -TB - 0.2, 1.86, 0, DUNKEL, 'xXzyY'); const sch = tafel(NS, S, [-TB - 0.7, 1.53, -0.045], [-1, 0, 0], 0.96, 0.6, sFeld(px, py, 512, 320)); sch.k = e.k; sch.hof = true; sch.e = e; tafeln.push(sch);
            /* im Zimmer: je Fassung links das Bild, rechts der Text; an der Rückwand das Werk */
            e.gezeigt.forEach((f, i) => { const zc = WD + 0.5 + i * TIEF + TIEF / 2 - 0.1, xl = -SB / 2 + 0.1, xr = SB / 2 - 0.1;
              S.kasten('holz', xl, 1.0, zc - 1.16, xl + 0.03, 2.5, zc + 1.16, DUNKEL, 'XzZyY');
              const tb = tafel(null, S, [xl + 0.04, 1.75, zc], [0, 0, -1], 2.2, 1.375); tb.art = 'bild'; tb.k = f; tb.e = e; e.tafeln.push(tb); tafeln.push(tb);
              const tn = tafel(null, S, [xl + 0.02, 0.76, zc], [0, 0, -1], 2.2, 0.34); tn.art = 'name'; tn.k = f; tn.e = e; e.tafeln.push(tn); tafeln.push(tn);
              S.kasten('holz', xr - 0.03, 0.55, zc - 1.16, xr, 2.65, zc + 1.16, DUNKEL, 'xzZyY');
              const tt = tafel(null, S, [xr - 0.04, 1.6, zc], [0, 0, 1], 2.2, 2.0); tt.art = 'text'; tt.k = f; tt.e = e; e.tafeln.push(tt); tafeln.push(tt);
              S.balken('zink', [0, RH, zc], [0, RH - 0.3, zc], 0.03, 0.03, [0.12, 0.12, 0.14]); S.kasten('lampe', -0.1, RH - 0.5, zc - 0.1, 0.1, RH - 0.3, zc + 0.1, [1, 1, 1]); const lp = S.welt([0, RH - 0.55, zc]); lampen.push({x: lp.x, y: lp.y - 0.25, z: lp.z, e, k: 7.5, w: 11}); });
            /* Saal: ein Werk mit vielen Fassungen. Koje um Koje, je Koje eine Stimme und ein Zeitabschnitt; Bilder in zwei Reihen an beiden Wänden */
            for(const K of kojen){ const A = {e, tafeln: [], koje: K}; e.abschnitte.push(A); const xl = -SB / 2 + 0.1, xr = SB / 2 - 0.1;
              S.kasten('holz', -SB / 2 + 0.1, 2.56, K.z + 0.02, SB / 2 - 0.1, 3.0, K.z + 0.1, DUNKEL, 'zyY'); S.kasten('putz', xl, 0, K.z, xl + 0.12, RH, K.z + 0.2, toene(ton, 0.8), 'XzZ'); S.kasten('putz', xr - 0.12, 0, K.z, xr, RH, K.z + 0.2, toene(ton, 0.8), 'xzZ');
              const ts = tafel(null, S, [0, 2.78, K.z + 0.01], [-1, 0, 0], 3.0, 0.375); ts.art = 'koje'; ts.k = e.k; ts.e = e; A.tafeln.push(ts);
              K.fass.forEach((f, j) => { const sp = Math.floor(j / 4), q = j % 4, links = q < 2, yy = q % 2 ? 2.42 : 1.3, zc = K.z + 0.8 + sp * 1.7 + 0.85, x = links ? xl : xr, r = links ? [0, 0, -1] : [0, 0, 1], v = links ? 1 : -1;
                if(links) S.kasten('holz', x, yy - 0.66, zc - 0.79, x + 0.03, yy + 0.5, zc + 0.79, DUNKEL, 'XzZyY'); else S.kasten('holz', x - 0.03, yy - 0.66, zc - 0.79, x, yy + 0.5, zc + 0.79, DUNKEL, 'xzZyY');
                const tb = tafel(null, S, [x + v * 0.04, yy, zc], r, 1.5, 0.94); tb.art = 'bild'; tb.k = f; tb.e = e; A.tafeln.push(tb); tafeln.push(tb);
                const tn = tafel(null, S, [x + v * 0.035, yy - 0.565, zc], r, 1.5, 0.14); tn.art = 'kname'; tn.k = f; tn.e = e; tn.j = j; A.tafeln.push(tn); tafeln.push(tn); });
              const zm = K.z + K.len / 2; S.balken('zink', [0, RH, zm], [0, RH - 0.14, zm], 0.03, 0.03, [0.12, 0.12, 0.14]); S.kasten('lampe', -0.1, RH - 0.3, zm - 0.1, 0.1, RH - 0.14, zm + 0.1, [1, 1, 1]); const lp = S.welt([0, RH - 0.5, zm]); lampen.push({x: lp.x, y: lp.y, z: lp.z, e, k: 8.5, w: 11}); A.anker = S.welt([0, 1.5, zm]); }
            S.kasten('holz', -1.3, 0.9, D - 0.03, 1.3, 2.6, D, DUNKEL, 'xXzyY'); const tw = tafel(null, S, [0, 1.75, D - 0.04], [-1, 0, 0], 2.4, 1.5); tw.art = 'werk'; tw.k = e.k; tw.e = e; tafeln.push(tw);
            if(saal) e.abschnitte[e.abschnitte.length - 1].tafeln.push(tw); else { e.tafeln.push(tw); e.abschnitte.push({e, tafeln: e.tafeln, raum: true}); }
          });
          recht(s, -0.42, -0.6, 0.42, 0.85, y, e); e.rect = recht(s, -SB / 2 + 0.45, 0.6, SB / 2 - 0.45, D - 0.4, y, e); const tp = zuWelt(s, 0, 0); e.tuer = new THREE.Vector3(tp[0], BASIS + y + 1.5, tp[1]); for(const A of e.abschnitte){ if(!A.anker) A.anker = e.tuer; abschnitte.push(A); }
          const hl = zuWelt(s, 0, -G / 2); lampen.push({x: hl[0], y: BASIS + y + 2.6, z: hl[1], e: null, k: 11, w: 10}); }
        /* Eingang */
        if(L === 0){ const s = P.eingang; wandZumHof(s, tuerLoch); const tf = toene(h.E.tuerfarbe || [0.3, 0.2, 0.15], 1);
          S.mit(fassadenMatrix([s.p[0], 0, s.p[1]], [s.t[0], 0, s.t[1]]), () => { S.wand('putz', [-SB / 2, 0, WD], [1, 0, 0], [0, 1, 0], [[0, 0], [SB, 0], [SB, RH], [0, RH]], [tuerLoch], WAND); hohl(S, 'putz', -1.4, 0, WD, 1.4, RH, 2.9, WAND, 'xXZY'); hohl(S, 'holz', -1.4, 0, WD, 1.4, RH, 2.9, [0.62, 0.52, 0.42], 'y'); hohl(S, 'holz', -TB, 0, 0, TB, TH, WD, DUNKEL, 'xXYy');
            S.kasten('lack', -0.75, 0, 2.82, 0.75, 2.35, 2.9, tf, 'xXzY'); S.kasten('stein', -0.95, 0, 2.86, -0.75, 2.5, 2.9, STEINTON, 'xXzY'); S.kasten('stein', 0.75, 0, 2.86, 0.95, 2.5, 2.9, STEINTON, 'xXzY'); S.kasten('stein', -0.95, 2.35, 2.86, 0.95, 2.6, 2.9, STEINTON, 'zy');
            S.kasten('lampe', -0.09, RH - 0.34, 1.4, 0.09, RH - 0.14, 1.58, [1, 1, 1]); const lp = S.welt([0, RH - 0.4, 1.5]); lampen.push({x: lp.x, y: lp.y - 0.2, z: lp.z, e: null, k: 8, w: 9}); });
          recht(s, -0.42, -0.6, 0.42, 0.85, 0, null); recht(s, -1.0, 0.6, 1.0, 2.5, 0, null); ausgang = {s, w: 2.05};
          const sp = zuWelt(s, 0, 1.2), bl = zuWelt(s, 0, -8); Z.start = {pos: new THREE.Vector3(sp[0], BASIS, sp[1]), blick: new THREE.Vector3(bl[0], BASIS + 1.9, bl[1])}; }
        /* Treppenhaus */
        if(P.treppe){ const s = P.treppe, top = L === ebenen.length - 1, steig = H / 2 / STUFEN, tritt = LAUF / STUFEN, ende = ANTRITT + LAUF;
          wandZumHof(s, [[0.2, 0], [SB - 0.2, 0], [SB - 0.2, 2.5], [0.2, 2.5]]);
          S.mit(fassadenMatrix([s.p[0], y, s.p[1]], [s.t[0], 0, s.t[1]]), () => {
            hohl(S, 'putz', -SB / 2 + 0.1, 0, 0, SB / 2 - 0.1, H, ende + 1.6, toene(WAND, 0.9), top ? 'xXZY' : 'xXZ'); S.kasten('putz', -0.06, 0, ANTRITT, 0.06, H, ende, toene(WAND, 0.8), 'xXz');
            if(L === 0){ hohl(S, 'holz', -SB / 2 + 0.1, 0, 0, SB / 2 - 0.1, H, ende + 1.6, [0.62, 0.52, 0.42], 'y'); S.kasten('putz', 0.06, 0, ANTRITT, SB / 2 - 0.1, H, ANTRITT + 0.1, toene(WAND, 0.8), 'z'); }
            else S.platte('bretter', 'holz', [-SB / 2 + 0.1, 0, ANTRITT], [SB / 2 - 0.1, 0, ANTRITT], [SB / 2 - 0.1, 0, 0], [-SB / 2 + 0.1, 0, 0], 0.3, HOLZ, DUNKEL);
            if(!top){ for(let j = 0; j < STUFEN; j++) S.kasten('bretter', -SB / 2 + 0.1, (j + 1) * steig - 0.3, ANTRITT + j * tritt, -0.06, (j + 1) * steig, ANTRITT + (j + 1) * tritt, HOLZ, 'YzXy');
              S.kasten('bretter', -SB / 2 + 0.1, H / 2 - 0.25, ende, SB / 2 - 0.1, H / 2, ende + 1.6, HOLZ, 'Yzy');
              for(let j = 0; j < STUFEN; j++) S.kasten('bretter', 0.06, H / 2 + (j + 1) * steig - 0.3, ende - (j + 1) * tritt, SB / 2 - 0.1, H / 2 + (j + 1) * steig, ende - j * tritt, HOLZ, 'YZxy');
              /* am Podest: wohin die Treppe in der Zeit führt */ S.kasten('holz', -1.56, H / 2 + 2.02, ende + 1.56, 1.56, H / 2 + 2.5, ende + 1.6, DUNKEL, 'xXzyY'); tafel(NS, S, [0, H / 2 + 2.26, ende + 1.55], [-1, 0, 0], 3.0, 0.4, sFeld(0, zeilenS * 320 + (L + 1) * 136, 1024, 136));
              S.kasten('lampe', -0.09, H + 1.2, ende + 0.7, 0.09, H + 1.4, ende + 0.88, [1, 1, 1]); const lp = S.welt([0, H * 0.5 + 2.4, ende + 0.8]); lampen.push({x: lp.x, y: lp.y, z: lp.z, e: null, k: 14, w: 12}); }
            else S.kasten('putz', -SB / 2 + 0.1, 0, ANTRITT, -0.06, 1.1, ANTRITT + 0.1, toene(WAND, 0.8), 'zY');
            /* über dem Durchgang: welcher Zeitabschnitt hier liegt */
            const py = zeilenS * 320 + L * 136; sx.save(); sx.translate(0, py); sx.fillStyle = '#17130f'; sx.fillRect(0, 0, 1024, 136); sx.fillStyle = '#f6efe2'; sx.font = '600 50px ' + SCHRIFT; sx.textBaseline = 'middle'; sx.textAlign = 'center';
            let t = ebene.name + ' · ' + ebene.zeit; if(sx.measureText(t).width > 990){ sx.font = '600 38px ' + SCHRIFT; } sx.fillText(t, 512, 70, 1000); sx.restore(); S.kasten('holz', -1.56, 2.54, -0.05, 1.56, 3.02, 0, DUNKEL, 'xXzyY'); tafel(NS, S, [0, 2.78, -0.055], [-1, 0, 0], 3.0, 0.4, sFeld(0, py, 1024, 136));
          });
          recht(s, -1.42, -0.6, 1.42, ANTRITT - 0.1, y, null);
          if(!top){ const p0 = s.p, n = s.n, wVon = (x, z) => (x - p0[0]) * n[0] + (z - p0[1]) * n[1], kl = q => Math.max(0, Math.min(1, q));
            recht(s, -1.42, ANTRITT - 0.3, -0.36, ende + 0.2, (x, z) => y + kl((wVon(x, z) - ANTRITT) / LAUF) * H / 2, null); recht(s, -1.42, ende, 1.42, ende + 1.05, y + H / 2, null);
            recht(s, 0.36, ANTRITT - 0.3, 1.42, ende + 0.2, (x, z) => y + H / 2 + kl((ende - wVon(x, z)) / LAUF) * H / 2, null); } }
      });
    });
    for(const [name, N] of S.netze){ const g = S.geometrie(name); if(!g) continue; const m = new THREE.Mesh(g, stoffVon(name)); m.frustumCulled = false; m.receiveShadow = false; G0.add(m); wegwerf.push(g); }
    const st = alsTextur(sc); wegwerf.push(st); netzMesh(NS, st, 0.75); netzMesh(NA, atlasT, 0.85);
    /* Übersicht: was es in dieser App gibt */
    { const B = Z._brett, c = leinwand(2048, 1024), x = c.getContext('2d'), k = P.k, fass = fassungenVon(k).filter(f => f.art === 'fassung'), summe = fass.reduce((q, f) => q + (f.zeichen || 0), 0), werke = (k.kinder || []).filter(q => q.kinder).length;
      x.fillStyle = '#17130f'; x.fillRect(0, 0, 2048, 1024); x.textBaseline = 'top'; x.fillStyle = '#c9bda8'; x.font = '38px ' + SCHRIFT; x.fillText((funktionsName(h) || 'Haus').toUpperCase() + (k.auch && k.auch.length ? '  ·  ' + k.auch.join(', ') : ''), 64, 44);
      x.fillStyle = '#fff6e6'; x.font = '600 128px ' + SCHRIFT; x.fillText(k.name, 58, 92, 1930);
      let yy = 276; const zeile = (a, b) => { x.fillStyle = '#9f937f'; x.font = '40px ' + SCHRIFT; x.fillText(a, 64, yy + 10); x.fillStyle = '#f0e6d4'; x.font = '54px ' + SCHRIFT; yy = schreibe(x, b, 360, yy, 800, 64, 2) + 16; };
      zeile('Bestand', (werke ? (werke === 1 ? '1 Werk · ' : werke + ' Werke · ') : '') + (fass.length === 1 ? '1 Fassung' : fass.length + ' Fassungen')); zeile('Zeit', zeitWort(k));
      zeile('Text', summe < 1000 ? summe + ' Zeichen' : 'rund ' + Math.round(summe / 1000).toLocaleString('de-DE') + ' Tsd. Zeichen'); zeile('Bilder', k.bildzahl ? k.bildzahl.toLocaleString('de-DE') : 'keine'); zeile('Gespräche', k.gespraeche ? String(k.gespraeche) : 'keine zugeordnet');
      const bz = bezug ? bezug.von(k) : [], bel = bz.filter(e => e.belegt), ber = bz.length - bel.length;
      zeile('Beziehungen', bel.length ? bel.slice(0, 2).map(e => (BELEGT[e.art] ? (e.aus ? BELEGT[e.art].wort : BELEGT[e.art].rueck) : e.art) + ' ' + e.andere.name).join(' · ') + (bel.length > 2 ? ` · und ${bel.length - 2} weitere` : '') : 'keine belegten');
      if(ber){ x.fillStyle = '#9f937f'; x.font = '34px ' + SCHRIFT; x.fillText(`${ber} berechnete Nähen, sie behaupten keine Verbindung`, 360, yy - 8); yy += 50; }
      const anderswo = alleE.filter(e => !e.eigen && !e.gespraeche && e.k.auch && e.k.auch.length > 1).length; if(anderswo && yy < 860) zeile('Anderswo', anderswo === 1 ? '1 Werk liegt auch an einem weiteren Ort' : anderswo + ' Werke liegen auch an weiteren Orten');
      let y2 = 276; x.fillStyle = '#9f937f'; x.font = '40px ' + SCHRIFT; x.fillText('Stimmen', 1230, y2 + 10); const zs = new Map(); for(const f of fass){ const s = stimmeVon(f.stimme); zs.set(s.n, {f: s.f, c: (zs.get(s.n) || {c: 0}).c + 1}); }
      for(const [n, {f, c: cc}] of [...zs].sort((a, b) => b[1].c - a[1].c).slice(0, 4)){ x.fillStyle = f; x.beginPath(); x.arc(1250, y2 + 96, 15, 0, 7); x.fill(); x.fillStyle = '#f0e6d4'; x.font = '48px ' + SCHRIFT; x.fillText(`${n}  ${cc}`, 1282, y2 + 64, 720); y2 += 62; }
      y2 += 100; x.fillStyle = '#9f937f'; x.font = '40px ' + SCHRIFT; x.fillText('Stockwerke, die Treppe führt durch die Zeit', 1230, y2);  y2 += 60;
      for(const e of ebenen.slice().reverse()){ x.fillStyle = '#f0e6d4'; x.font = '48px ' + SCHRIFT; x.fillText(e.name, 1230, y2, 330); x.fillStyle = '#c9bda8'; x.font = '38px ' + SCHRIFT; x.fillText(`${e.zeit} · ${e.einheiten.length} Zimmer`, 1570, y2 + 8, 440); y2 += 66; }
      x.fillStyle = '#9f937f'; x.font = '36px ' + SCHRIFT; x.fillText('Jede Tür führt in das Zimmer eines Werks. Drinnen hängen seine Fassungen nebeneinander: links das Bild, rechts der Text.', 64, 952, 1920);
      const t = alsTextur(c); wegwerf.push(t); const g = new THREE.PlaneGeometry(B.b, B.h), m = new THREE.MeshBasicNodeMaterial(); m.colorNode = texture(t, uv()).rgb.mul(0.8); const o = new THREE.Mesh(g, m); o.position.set(0, BASIS + 0.62 + B.h / 2, B.z); G0.add(o); wegwerf.push(g, m); }
    scene.add(G0); Z.an = true;
    altLicht = lichter.map(l => ({p: l.position.clone(), i: l.intensity, d: l.distance, c: l.color.clone()})); for(const l of lichter){ l.color.set(0xffe0bd); l.intensity = 0; }
    takt = 1; return true;
  };

  /* Tafeln eines Zimmers: erst wenn man nahe ist, und nur so lange */
  function fuelle(A){ if(A.voll) return; const e = A.e, V = A.voll = {g: new THREE.Group(), weg: []}; G0.add(V.g);
    const flaeche = (t, tex, hell, vor = 0.012) => { const g = new THREE.PlaneGeometry(t.b, t.h), m = new THREE.MeshBasicNodeMaterial(); m.colorNode = texture(tex, uv()).rgb.mul(hell); const o = new THREE.Mesh(g, m); o.matrixAutoUpdate = false; o.matrix.makeBasis(t.r, new THREE.Vector3(0, 1, 0), t.n).setPosition(t.mitte.clone().addScaledVector(t.n, vor)); o.frustumCulled = false; V.g.add(o); V.weg.push(g, m, tex); return o; };
    const jeF = new Map(); let kc = null, kt = null;
    if(A.koje){ const K = A.koje, zeil = Math.ceil(K.fass.length / 2); kc = leinwand(1024, 128 + zeil * 96); const x = kc.getContext('2d'); x.fillStyle = '#1b1612'; x.fillRect(0, 0, 1024, kc.height); x.fillStyle = K.st.f; x.fillRect(0, 0, 1024, 10); x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = '#fff6e6'; x.font = '600 46px ' + SCHRIFT;
      x.fillText(`${K.st.n} · ${K.zeit} · ${K.gesamt > K.fass.length ? `${K.ab + 1} bis ${K.ab + K.fass.length} von ${K.gesamt}` : K.gesamt === 1 ? (e.gespraeche ? '1 Gespräch' : '1 Fassung') : K.gesamt + (e.gespraeche ? ' Gespräche' : ' Fassungen')}`, 512, 72, 990); x.textAlign = 'left'; x.textBaseline = 'top';
      K.fass.forEach((f, j) => { const px = (j % 2) * 512, py = 128 + Math.floor(j / 2) * 96; x.fillStyle = '#fff6e6'; x.font = '600 34px ' + SCHRIFT; schreibe(x, f.name, px + 14, py + 8, 484, 40, 1); x.fillStyle = '#c9bda8'; x.font = '26px ' + SCHRIFT; x.fillText(`${tagWort(f.von)}${f.art === 'gespraech' ? ' · Gespräch' : ' · ' + mengenWort(f)}${f.bild || f.art === 'gespraech' ? '' : ' · ohne Bild'}`, px + 14, py + 54, 484); }); kt = alsTextur(kc); }
    const ausschnitt = (o, px, py, w, hh, C) => { const u = o.geometry.attributes.uv, u0 = px / C.width, v1 = 1 - py / C.height, du = w / C.width, dv = hh / C.height; for(let i = 0; i < u.count; i++){ u.setXY(i, u0 + u.getX(i) * du, v1 - dv + u.getY(i) * dv); } u.needsUpdate = true; };
    for(const t of A.tafeln){ const f = t.k;
      if(t.art === 'koje'){ ausschnitt(flaeche(t, kt, 0.8), 0, 0, 1024, 128, kc); continue; }
      if(t.art === 'kname'){ ausschnitt(flaeche(t, kt, 0.8), (t.j % 2) * 512, 128 + Math.floor(t.j / 2) * 96, 512, 96, kc); continue; }
      if(t.art === 'bild'){ if(f.bild){ /* Das Bild wird auf eine feste Höchstgröße gebracht: sehr hohe Bildschirmfotos (ganze Seiten) zeigen ihren oberen Teil, das ganze Bild steht in der Lesefläche */
          const breit = e.saal ? 640 : 960, c = leinwand(8, 8), tex = alsTextur(c), o = flaeche(t, tex, 0.72); o.visible = false; const im = new Image(); im.decoding = 'async';
          im.onload = () => { if(!A.voll || A.voll !== V) return; const w = Math.min(breit, im.naturalWidth), sk = w / im.naturalWidth, mindest = e.saal ? 0.8 : 0.62, hGanz = im.naturalHeight * sk, h = Math.round(Math.min(hGanz, w / mindest)); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, im.naturalWidth, h / sk, 0, 0, w, h); tex.needsUpdate = true;
            const a = w / h, soll = t.b / t.h, sc = a > soll ? [1, soll / a] : [a / soll, 1]; o.matrix.makeBasis(t.r, new THREE.Vector3(0, 1, 0), t.n).scale(new THREE.Vector3(sc[0], sc[1], 1)).setPosition(t.mitte.clone().addScaledVector(t.n, 0.012)); o.visible = true; };
          im.src = bildUrl(f.bild, 960); }
        else { /* ohne Bild bleibt der Rahmen nicht leer: im Saal steht dort der Anfang des Texts, im Zimmer ein ehrlicher Satz */
          const c = leinwand(800, 500), x = c.getContext('2d'); x.fillStyle = '#211c17'; x.fillRect(0, 0, 800, 500); x.textBaseline = 'top'; x.fillStyle = '#9f937f'; x.font = '22px ' + SCHRIFT; x.fillText(f.art === 'gespraech' ? 'GESPRÄCH' : 'OHNE BILD · ANFANG DES TEXTS', 30, 24);
          x.fillStyle = '#e6dccb'; x.font = '27px Georgia, serif'; const roh = f.art === 'gespraech' ? 'Zweimal antippen öffnet das Gespräch in der Lesefläche.' : e.saal ? klartext(texte && texte.get(f.kennung)).slice(0, 900) : 'Zu dieser Fassung gibt es kein Bild. Ihr Text hängt gegenüber.'; schreibe(x, roh || 'Zu dieser Fassung liegt kein Text vor.', 30, 66, 740, 36, 11); flaeche(t, alsTextur(c), 0.8); }
        continue; }
      if(t.art === 'werk'){ const c = leinwand(1024, 640), x = c.getContext('2d'), k = t.k; x.fillStyle = '#1b1612'; x.fillRect(0, 0, 1024, 640); x.fillStyle = e.stimme.f; x.fillRect(0, 0, 1024, 10); x.textBaseline = 'top'; x.fillStyle = '#9f937f'; x.font = '26px ' + SCHRIFT; x.fillText(e.gespraeche ? 'GESPRÄCHE' : e.eigen ? 'FASSUNGEN OHNE EIGENES WERK' : 'WERK', 44, 40);
        x.fillStyle = '#fff6e6'; x.font = '600 54px ' + SCHRIFT; let yy = schreibe(x, e.name, 44, 78, 936, 62, 2) + 14; x.fillStyle = '#e6dccb'; x.font = '32px ' + SCHRIFT;
        yy = schreibe(x, (e.gespraeche ? (e.fass.length === 1 ? '1 Gespräch' : e.fass.length + ' Gespräche') : (e.fass.length === 1 ? '1 Fassung' : e.fass.length + ' Fassungen')) + (e.von != null ? ' · ' + spanne(e.von, e.bis) : e.gespraeche ? '' : ' · ohne belegtes Datum'), 44, yy, 936, 42, 2) + 6;
        if(e.stimmen.length) yy = schreibe(x, 'Stimmen: ' + e.stimmen.map(s => `${s.n} ${s.c}`).join(', '), 44, yy, 936, 42, 2) + 6;
        if(e.saal) yy = schreibe(x, `Saal mit ${e.kojenZahl} ${e.kojenZahl === 1 ? 'Koje' : 'Kojen'}: je Koje eine Stimme und ein Zeitabschnitt.`, 44, yy, 936, 42, 2) + 6;
        if(!e.eigen && !e.gespraeche){ const anders = (k.auch || []).filter(o => !(Z.plan.k.auch || []).includes(o)); if((k.auch || []).length > 1) yy = schreibe(x, 'Dasselbe Werk liegt auch in: ' + (anders.length ? anders : k.auch).join(', '), 44, yy, 936, 42, 2) + 6;
          const bel = bezug ? bezug.von(k).filter(q => q.belegt) : []; x.fillStyle = '#c9bda8'; yy = schreibe(x, bel.length ? 'Belegte Beziehungen: ' + bel.slice(0, 4).map(q => (BELEGT[q.art] ? (q.aus ? BELEGT[q.art].wort : BELEGT[q.art].rueck) : q.art) + ' ' + q.andere.name).join(' · ') + (bel.length > 4 ? ` · und ${bel.length - 4} weitere` : '') : 'Keine belegten Beziehungen.', 44, yy + 8, 936, 40, 4); }
        flaeche(t, alsTextur(c), 0.8); continue; }
      let J = jeF.get(f); if(!J){ const c = leinwand(1024, 1090), x = c.getContext('2d'), s = stimmeVon(f.stimme); x.fillStyle = '#1b1612'; x.fillRect(0, 0, 1024, 1090); x.textBaseline = 'top';
        x.fillStyle = '#fff6e6'; x.font = '600 46px ' + SCHRIFT; schreibe(x, f.name, 30, 18, 964, 52, 1); x.font = '32px ' + SCHRIFT;
        if(f.art === 'gespraech'){ x.fillStyle = '#c9bda8'; x.fillText('Gespräch · ' + tagWort(f.von), 30, 92, 964); } else { x.fillStyle = s.f; x.beginPath(); x.arc(44, 112, 12, 0, 7); x.fill(); x.fillStyle = '#c9bda8'; x.fillText(`${s.n} · ${tagWort(f.von)} · ${mengenWort(f)}${f.bilder && f.bilder.length ? ' · ' + (f.bilder.length === 1 ? '1 Bild' : f.bilder.length + ' Bilder') : ''}`, 68, 92, 926); }
        x.fillStyle = '#9f937f'; x.font = '26px ' + SCHRIFT; x.fillText(f.art === 'gespraech' ? 'GESPRÄCH' : 'TEXT DIESER FASSUNG' + (f.bild ? '' : ' · OHNE BILD'), 44, 196);
        x.fillStyle = '#ece4d6'; x.font = '31px Georgia, serif'; const roh = f.art === 'gespraech' ? 'Zweimal antippen öffnet das Gespräch in der Lesefläche.' : klartext(texte && texte.get(f.kennung)); const yy = schreibe(x, roh || 'Zu dieser Fassung liegt kein Text vor.', 44, 246, 936, 43, 17);
        x.fillStyle = '#b9a98c'; x.font = '26px ' + SCHRIFT; x.fillText('Antippen wählt · zweimal antippen oder Eingabetaste: ganz lesen', 44, 1036, 936); J = alsTextur(c); jeF.set(f, J); }
      const o = flaeche(t, J, 0.8), g = o.geometry, u = g.attributes.uv, v0 = t.art === 'name' ? 1 - 158 / 1090 : 0, v1 = t.art === 'name' ? 1 : 1 - 160 / 1090; for(let i = 0; i < u.count; i++) u.setY(i, v0 + u.getY(i) * (v1 - v0)); u.needsUpdate = true; }
  }
  function leere(A){ if(!A.voll) return; G0.remove(A.voll.g); for(const d of new Set(A.voll.weg)) d.dispose && d.dispose(); A.voll = null; }

  Z.schritt = dt => { if(!Z.an) return; takt += dt; if(takt < 0.2) return; takt = 0; const cp = camera.position, hier = Z.wo();
    /* je Takt höchstens ein Zimmer einrichten, das nächste zuerst: kein Ruck */ let naechst = null, nd = 12; for(const A of abschnitte){ const d = A.raum && A.e === hier ? 0 : cp.distanceTo(A.anker); if(d > 22) leere(A); else if(!A.voll && d < nd){ nd = d; naechst = A; } } if(naechst && !OHNE_TAFELN) fuelle(naechst);
    const nahe = lampen.map(l => ({l, d: Math.hypot(l.x - cp.x, (l.y - cp.y) * 2.2, l.z - cp.z) - (l.e && l.e === hier ? 6 : 0)})).sort((a, b) => a.d - b.d);
    lichter.forEach((li, i) => { if(i < hofLicht.length && lichter.length > 3){ const p = hofLicht[i]; li.position.set(p[0], p[1], p[2]); li.intensity = i ? 34 : 120; li.distance = i ? 24 : 70; return; } const q = nahe[i - (lichter.length > 3 ? hofLicht.length : 0)]; if(!q){ li.intensity = 0; return; } li.position.set(q.l.x, q.l.y, q.l.z); li.intensity = q.l.k; li.distance = q.l.w; });
    if(ausgang && Math.abs(fuss) < 0.5){ const s = ausgang.s, w = (cp.x - s.p[0]) * s.n[0] + (cp.z - s.p[1]) * s.n[1], u = (cp.x - s.p[0]) * s.t[0] + (cp.z - s.p[1]) * s.t[1]; if(w > ausgang.w && Math.abs(u) < 1.3) beiHinaus(); } };
  const v = new THREE.Vector3();
  Z.treffe = ray => { const hier = Z.wo(); let best = null, bt = 11; for(const t of tafeln){ if(t.hof ? hier : t.e !== hier) continue; const dn = ray.direction.dot(t.n); if(dn > -0.05) continue; const tt = v.subVectors(t.mitte, ray.origin).dot(t.n) / dn; if(tt < 0.1 || tt > bt) continue;
      v.copy(ray.origin).addScaledVector(ray.direction, tt).sub(t.mitte); if(Math.abs(v.dot(t.r)) > t.b / 2 + 0.05 || Math.abs(v.y) > t.h / 2 + 0.05) continue; bt = tt; best = t; } return best ? best.k : null; };
  Z.schliesse = () => { if(!Z.an) return; Z.an = false; for(const A of abschnitte) leere(A); scene.remove(G0); for(const d of wegwerf) d.dispose && d.dispose(); lichter.forEach((l, i) => { const a = altLicht[i]; l.position.copy(a.p); l.intensity = a.i; l.distance = a.d; l.color.copy(a.c); }); G0 = null; Z.haus = null; };
  Z.zahlen = () => Z.plan && ({ebenen: Z.plan.ebenen.map(e => `${e.name}: ${e.zeit}, ${e.einheiten.length} Zimmer`), zimmer: einheiten.length, tafeln: tafeln.length, gefuellt: abschnitte.filter(A => A.voll).length, saele: einheiten.filter(e => e.saal).length, kojen: abschnitte.filter(A => A.koje).length, nx: Z.plan.nx, nz: Z.plan.nz, rechtecke: rechtecke.length, fuss});
  Z.zimmer = name => einheiten.find(e => e.name === name) || null; Z.aufHoehe = y => { fuss = y; }; Z.gruppe = () => G0; Z.BASIS = BASIS; Z.saele = () => einheiten.filter(e => e.saal).map(e => ({name: e.name, s: e.s, y: e.y, tief: e.tief, fass: e.fass.length, kojen: e.kojenZahl}));
  return Z;
}
