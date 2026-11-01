/* =====================================================================
   GARTEN — derselbe Bestand in eigener Optik: gemalt statt geleuchtet.
   Jedes Werk steht am selben Ort wie im Kosmos. Bezirke sind Beete, die Zentrale eine Lichtung,
   „ohne Dach“ eine Wildwiese. Blätter sind Fassungen, ihre Farbe ist die Stimme, die Form der Pflanze
   ist die belegte Abstammung, die Blüte die Reife. Jede Mycelbahn ist eine gespeicherte Beziehung.
   Schreibt nichts, rechnet aus dem Netz; die Malschicht liegt über dem Lichtwerk und blendet ein.
   ===================================================================== */
import {TAU, clamp, mix, sstep, hash, CAM, toScreen} from './licht.js';
import {STIMMEN, MENSCH} from './daten.js';

const HALM = '#7f9a5a', STAENGEL = '#6f8a4e', QUELLBLATT = '#a3b67f', RALFBLATT = '#e4dfcc', GOLDTON = '#e8bd62', ERDE = '#34291a', MYZEL = '#ead9ae';
const blattFarbe = s => s.form ? RALFBLATT : typeof s.stimme === 'number' ? STIMMEN[s.stimme].hex : s.stimme === MENSCH ? RALFBLATT : QUELLBLATT;
let cv = null, cx = null, D = 1;

function bereit(){
  if(!cv){ cv = document.getElementById('garten'); if(!cv) return false; cx = cv.getContext('2d'); }
  const d = Math.min(1.5, devicePixelRatio || 1), w = Math.round(CAM.cssW * d), h = Math.round(CAM.cssH * d);
  if(cv.width !== w || cv.height !== h || d !== D){ cv.width = w; cv.height = h; D = d; }
  cx.setTransform(D, 0, 0, D, 0, 0); return true;
}
const massVon = o => Math.max(0.5, Math.abs(toScreen(o[0], o[1] + 1, o[2])[1] - toScreen(o[0], o[1], o[2])[1]));
function blatt(x, y, winkel, lang, farbe){ cx.fillStyle = farbe; cx.beginPath(); cx.ellipse(x + Math.cos(winkel) * lang * 0.5, y + Math.sin(winkel) * lang * 0.5, lang * 0.5, Math.max(0.6, lang * 0.2), winkel, 0, TAU); cx.fill(); }
function umriss(c, R, seed, wackel){ cx.beginPath(); for(let j = 0; j <= 48; j++){ const a = j / 48 * TAU, r = R * (1 + wackel * Math.sin(a * 3 + seed) + wackel * 0.5 * Math.cos(a * 7 + seed * 2)), p = toScreen(c[0] + Math.cos(a) * r, 0, c[2] + Math.sin(a) * r); if(p[2] <= 0) continue; j ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]); } cx.closePath(); }

function himmelUndBoden(N){
  const W = CAM.cssW, H = CAM.cssH, dx = CAM.target[0] - CAM.P[0], dz = CAM.target[2] - CAM.P[2], l = Math.hypot(dx, dz) || 1, f = toScreen(CAM.P[0] + dx / l * 4000, 0, CAM.P[2] + dz / l * 4000), hy = f[2] > 0 ? clamp(f[1], -40, H * 0.55) : -40;
  if(hy > 0){ const g = cx.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, '#31505a'); g.addColorStop(0.6, '#8d9a83'); g.addColorStop(1, '#e6c88e'); cx.fillStyle = g; cx.fillRect(0, 0, W, hy + 1);
    // Baumlinie am Horizont; sie bleibt Hintergrund
    cx.fillStyle = '#28382b'; cx.beginPath(); cx.moveTo(0, hy + 1); for(let x = 0; x <= W + 16; x += 16) cx.lineTo(x, hy - 6 - 8 * hash(Math.floor(x / 16) * 1.7) - 5 * Math.sin(x * 0.012)); cx.lineTo(W, hy + 1); cx.fill(); }
  const g = cx.createLinearGradient(0, Math.max(0, hy), 0, H); g.addColorStop(0, '#4c5c42'); g.addColorStop(0.3, '#2f3a26'); g.addColorStop(1, '#191b12'); cx.fillStyle = g; cx.fillRect(0, Math.max(0, hy), W, H);
}

function beete(N, U){
  const Lm = N.L.mitte;
  N.daecher.forEach((d, j) => { const drin = U.dach === j; cx.globalAlpha = U.dach == null || drin ? 1 : 0.55; umriss(d.mitte, d.R, j + 1.3, 0.035); cx.fillStyle = ERDE; cx.fill(); cx.strokeStyle = 'rgba(214,190,134,.28)'; cx.lineWidth = 1.2; cx.stroke();
    if(drin) d.bereiche.forEach((b, bi) => { umriss(b.mitte, b.R, bi + 2.1, 0.03); cx.fillStyle = 'rgba(92,74,42,.5)'; cx.fill(); }); });
  if(N.L.ohne){ cx.globalAlpha = U.dach == null || U.dach === 'ohne' ? 1 : 0.55; umriss(N.L.ohne.mitte, N.L.ohne.R, 7.7, 0.05); cx.fillStyle = 'rgba(62,76,42,.65)'; cx.fill(); cx.setLineDash([3, 6]); cx.strokeStyle = 'rgba(190,200,150,.3)'; cx.lineWidth = 1; cx.stroke(); cx.setLineDash([]); }
  cx.globalAlpha = 1; umriss(Lm.mitte, Lm.R, 4.4, 0.03); const m = toScreen(0, 0, 0), g = cx.createRadialGradient(m[0], m[1], 0, m[0], m[1], massVon([0, 0, 0]) * Lm.R * 2); g.addColorStop(0, '#a58f55'); g.addColorStop(1, '#5f5a33'); cx.fillStyle = g; cx.fill(); cx.strokeStyle = 'rgba(240,220,160,.35)'; cx.lineWidth = 1.2; cx.stroke();
}

/* Jede Bahn ist eine gespeicherte Beziehung; ihre Windung bedeutet nichts */
function myzel(N, U){
  const selM = U.sel && U.sel.art === 'mond' ? U.sel.i : -1, hov = U.hover && U.hover.art === 'mond' ? U.hover.i : -1;
  cx.strokeStyle = MYZEL; cx.lineCap = 'round';
  N.faeden.forEach((f, fi) => { const A = N.pos[f.von], B = N.pos[f.nach], d = Math.hypot(A[0] - B[0], A[2] - B[2]), ux = (B[2] - A[2]) / (d || 1), uz = (A[0] - B[0]) / (d || 1), ph = hash(fi * 3.3) * TAU, q = Math.round(clamp(d * 1.6, 8, 40));
    const an = selM === f.von || selM === f.nach || hov === f.von || hov === f.nach, hier = U.dach != null && (f.bzVon === U.dach || f.bzNach === U.dach);
    cx.globalAlpha = an ? 0.95 : hier ? 0.6 : 0.34; cx.lineWidth = an ? 1.8 : 0.9; cx.beginPath();
    for(let s = 0; s <= q; s++){ const t = s / q, sn = Math.sin(Math.PI * t), wb = sn * (Math.sin(t * 9 + ph) * 0.05 + Math.sin(t * 23 + ph * 2) * 0.018) * d, p = toScreen(mix(A[0], B[0], t) + ux * wb, 0, mix(A[2], B[2], t) + uz * wb); if(p[2] <= 0) continue; s ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]); }
    cx.stroke(); });
  cx.globalAlpha = 1;
}

function bluete(x, y, r, reife, farbe){ const z = reife === 'kanonisch' ? 7 : 5, c = reife === 'kanonisch' ? GOLDTON : farbe; for(let k = 0; k < z; k++){ const a = k / z * TAU - Math.PI / 2; blatt(x, y, a, r, c); } cx.fillStyle = GOLDTON; cx.beginPath(); cx.arc(x, y, Math.max(1, r * 0.22), 0, TAU); cx.fill(); }

function pflanzeMalen(N, U, n, wall, alpha){
  const m = N.B.monde[n], o = N.pos[n], plan = N.mini[n].plan, bs = toScreen(o[0], 0, o[2]); if(bs[2] <= 0) return;
  const ks = massVon(o), rM = N.rM[n], rand = ks * (N.mini[n].H + rM); if(bs[0] < -rand || bs[0] > CAM.cssW + rand || bs[1] < -40 || bs[1] > CAM.cssH + rand) return;
  cx.globalAlpha = alpha;
  // Schatten und Erdfleck am Fuß
  cx.fillStyle = 'rgba(10,9,5,.35)'; cx.beginPath(); cx.ellipse(bs[0], bs[1], rM * ks * 0.8, rM * ks * 0.22, 0, 0, TAU); cx.fill();
  if(!plan){ cx.fillStyle = '#b7a26d'; cx.beginPath(); cx.arc(bs[0], bs[1] - 1, Math.max(1.4, ks * 0.14), 0, TAU); cx.fill(); return; }   // nur die Ausgangsfassung: ein Same
  const {lage, W, lose} = plan, zahl = m.samen.length, schritt = Math.max(1, Math.ceil(zahl / 160)), wind = U.RM ? 0 : Math.sin(wall * 0.55 + n * 1.7) * 0.018;
  const punkt = (i, q) => { const y = lage[i * 3 + 1]; return toScreen(o[0] + lage[i * 3] + wind * y, y, o[2] + lage[i * 3 + 2]); };
  const blattLang = clamp(ks * rM * (zahl === 1 ? 0.55 : 0.3), 2.2, 22);
  for(let i = 0; i < zahl; i++){ const s = m.samen[i], p = punkt(i), f = blattFarbe(s);
    if(lose[i]){ // ein Halm aus dem Boden, leicht nach außen geneigt
      if(i % schritt) continue; const b = toScreen(o[0] + lage[i * 3] * 0.22, 0, o[2] + lage[i * 3 + 2] * 0.22), mx = mix(b[0], p[0], 0.25), my = mix(b[1], p[1], 0.72);
      cx.strokeStyle = HALM; cx.lineWidth = clamp(ks * 0.05, 0.5, 1.5); cx.beginPath(); cx.moveTo(b[0], b[1]); cx.quadraticCurveTo(mx, my, p[0], p[1]); cx.stroke(); blatt(p[0], p[1], Math.atan2(p[1] - b[1], p[0] - b[0]), blattLang * 0.75, f); continue; }
    const e = W.eltern[i], von = e >= 0 && !lose[e] ? punkt(e) : bs, tief = W.tiefe[i], dicke = clamp(ks * 0.1 * (1 - tief / (plan.tiefste + 2)), 0.7, 3.5);
    cx.strokeStyle = STAENGEL; cx.lineWidth = dicke; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(von[0], von[1]); cx.quadraticCurveTo(mix(von[0], p[0], 0.2), mix(von[1], p[1], 0.65), p[0], p[1]); cx.stroke();
    if(i % schritt === 0){ const a = Math.atan2(p[1] - von[1], p[0] - von[0]), seite = i % 2 ? 1 : -1; blatt(p[0], p[1], a + seite * 1.05, blattLang, f); if(zahl === 1) blatt(p[0], p[1], a - seite * 1.05, blattLang, f); }
    if(!W.kinder[i].length && zahl > 1 && (m.reife === 'gereift' || m.reife === 'kanonisch')) bluete(p[0], p[1], clamp(blattLang * 0.75, 2, 12), m.reife, f);
    else if(s.status === 'grundformation'){ cx.fillStyle = GOLDTON; cx.beginPath(); cx.arc(p[0], p[1], clamp(ks * 0.1, 1.4, 3.5), 0, TAU); cx.fill(); } }
}

function markierung(N, U, n){ const o = N.pos[n], ks = massVon(o), r = N.rM[n] * ks * 1.25, p = toScreen(o[0], 0, o[2]); cx.globalAlpha = 0.9; cx.strokeStyle = '#f4efdc'; cx.lineWidth = 1.2; cx.beginPath(); cx.ellipse(p[0], p[1], r, r * 0.34, 0, 0, TAU); cx.stroke(); }

/* Die fünf Stimmen fliegen als Falter um die Mitte: gleiche Bahn wie im Kosmos, gleiche Farbe */
function falter(U, wall){ for(let i = 0; i < 5; i++){ const p = U.bigHeads[i]; if(!p || p[2] <= 0) continue; const f = STIMMEN[i].hex, sch = U.RM ? 0.6 : 0.5 + 0.5 * Math.sin(wall * 9 + i), b = 4.2; cx.globalAlpha = 0.95 * U.soloA[i]; cx.fillStyle = f;
    for(const s of [-1, 1]){ cx.beginPath(); cx.ellipse(p[0] + s * b * 0.55 * (0.4 + 0.6 * sch), p[1] - 8, b * 0.6 * (0.4 + 0.6 * sch), b * 0.8, 0, 0, TAU); cx.fill(); }
    cx.fillStyle = '#20180c'; cx.fillRect(p[0] - 0.5, p[1] - 11, 1, 6); } }

export function zeichneGarten(N, U, wall){
  const op = sstep(0.3, 0.9, U.gartenK) * sstep(0.45, 0.9, U.netK);
  if(!cv && !document.getElementById('garten')) return;
  if(op <= 0.002){ if(cv && cv.style.display !== 'none') cv.style.display = 'none'; document.body.classList.remove('imgarten'); return; }
  if(!bereit()) return;
  cv.style.display = 'block'; cv.style.opacity = String(op); document.body.classList.toggle('imgarten', op > 0.5);
  himmelUndBoden(N); beete(N, U); myzel(N, U);
  const hov = U.hover && U.hover.art === 'mond' ? U.hover.i : -1, selM = U.sel && U.sel.art === 'mond' ? U.sel.i : -1, fokus = U.als && U.als.set ? U.als.set : null;
  const reihe = N.B.monde.map((_, i) => i).filter(i => !N.baum.material.has(i)).sort((a, b) => toScreen(N.pos[a][0], 0, N.pos[a][2])[1] - toScreen(N.pos[b][0], 0, N.pos[b][2])[1]);
  for(const n of reihe){ const m = N.B.monde[n], bz = N.bezirk(n); let a = U.dach == null || bz === U.dach ? 1 : 0.4; if(U.solo >= 0 && !m.stimmen.includes(U.solo)) a *= 0.25; if(fokus && !fokus.has(n)) a *= 0.2; pflanzeMalen(N, U, n, wall, a); if(n === hov || n === selM) markierung(N, U, n); }
  // Lesematerial liegt als kleines Blatt am Boden seines Werks
  cx.globalAlpha = 0.8; for(const i of N.baum.material.keys()){ const p = toScreen(N.pos[i][0], 0, N.pos[i][2]); if(p[2] > 0) blatt(p[0] - 3, p[1], -0.3, 7, '#c8ad6d'); }
  falter(U, wall); cx.globalAlpha = 1;
}
