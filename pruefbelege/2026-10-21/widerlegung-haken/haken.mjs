// Nur lesend: Bündel im Überblick nachrechnen und auf 800x600 projizieren
import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const log = console.log; console.log = () => {};
const {bestand} = await import(R + 'app/js/daten.js');
const L = await import(R + 'app/js/licht.js');
const kette = process.argv[2] || 'kette-gewebe', W = +(process.argv[3] || 800), H = +(process.argv[4] || 600), dyaw = +(process.argv[5] || 0);
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + kette + '/state.json', 'utf8')));
const O = JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8'));
const {Netz} = await import(R + 'app/js/netz.js');
const N = new Netz(B, O); console.log = log;
const DEG = Math.PI / 180, asp = W / H, portrait = asp < 0.75, fit = 1 / Math.min(1, asp * 1.08);
function netzMass(yaw, elev){ const cy = Math.cos(yaw), sy = Math.sin(yaw), se = Math.sin(elev), ce = Math.cos(elev); let u = 0, v = 0;
  for(const k of N.kreise){ const cu = k.x * cy - k.z * sy, cv = -k.x * sy - k.z * cy; u = Math.max(u, Math.abs(cu) + k.R); v = Math.max(v, (Math.abs(cv) + k.R) * se + k.h * ce); }
  return Math.max(v, u / asp) * 1.1; }
let yaw = 0.35; if(portrait && netzMass(0.35 + Math.PI / 2, 50 * DEG) < 0.92 * netzMass(0.35, 50 * DEG)) yaw += Math.PI / 2; yaw += dyaw;
const S = netzMass(yaw, 50 * DEG) / fit * fit, fov = 40 * DEG;
L.CAM.cssW = W; L.CAM.cssH = H;
L.setCamera({target: [0, 0, 0], dist: S / Math.tan(fov / 2), yaw, pitch: 50 * DEG, fov, S, shift: portrait ? 0.1 : 0, shiftX: 0}, W, H);
const uPx = H * 0.5 / Math.tan(fov / 2);
const pxSize = (s, p) => { const w = L.xf(L.CAM.VP, p[0], p[1], p[2])[3]; return s * uPx / w; };
const bn = b => b === 'mitte' ? 'Mitte' : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
const STa = {'verweist-auf': 0.3, 'remixt-aus': 0.5, 'erweitert': 0.42, 'testet': 0.34, 'widerspricht': 0.4, 'gehört-zu': 0.28};
// bogen() wörtlich nachgebaut
const mix = (a, b, t) => a + (b - a) * t;
function bogen(ca, Ra, cb, Rb){ const dx = cb[0] - ca[0], dz = cb[2] - ca[2], dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl;
  const A = [ca[0] + ux * Ra, ca[2] + uz * Ra], Bq = [cb[0] - ux * Rb, cb[2] - uz * Rb], d = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), quer = d * 0.12, lift = d * 0.12 + 0.6;
  return t => { const w = Math.sin(Math.PI * t); return [mix(A[0], Bq[0], t) - uz * quer * w, w * lift, mix(A[1], Bq[1], t) + ux * quer * w]; }; }
log(`Kette ${kette}, Bild ${W}x${H}, yaw ${yaw.toFixed(2)}, S ${S.toFixed(1)}`);
const bz = Math.max(0.16, S * 0.006);
const rows = [];
N.buendel.forEach((x, bi) => { const za = N.bezirkZiel(x.von), zb = N.bezirkZiel(x.nach); if(!za || !zb) return;
  const pt = bogen(za.mitte, za.R, zb.mitte, zb.R), d = Math.hypot(za.mitte[0] - zb.mitte[0], za.mitte[2] - zb.mitte[2]), n = Math.round(Math.min(120, Math.max(20, d * 3)));
  const dicke = bz * (1 + 0.1 * Math.min(8, x.kanten)), al = STa[x.typ] + 0.03 * Math.min(8, x.kanten);
  // Bogenlänge in Welt und Pixel
  let lw = 0, lp = 0, prev = pt(0), prevS = L.toScreen(...prev);
  for(let s = 1; s <= 400; s++){ const q = pt(s / 400), qs = L.toScreen(...q); lw += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]); lp += Math.hypot(qs[0] - prevS[0], qs[1] - prevS[1]); prev = q; prevS = qs; }
  const km = pt(0.5), kms = L.toScreen(...km), dpx = pxSize(dicke, km), abstPx = lp / n;
  // Überdeckung: wie viele Punkte liegen innerhalb eines Punktdurchmessers (Kern exp(-r2*7): Halbwertsradius ~0.31*halbe Größe)
  const ueber = dpx / Math.max(1e-6, abstPx);
  rows.push({name: `${bn(x.von)} -> ${bn(x.nach)}`, typ: x.typ, kanten: x.kanten, d: d.toFixed(1), randRand: (d - za.R - zb.R).toFixed(1), bogenW: lw.toFixed(1), n, bogenPx: lp.toFixed(0), abstPx: abstPx.toFixed(2), dickeW: dicke.toFixed(2), dickePx: dpx.toFixed(1), ueber: ueber.toFixed(1), alphaMitte: (al * 1.1).toFixed(2), summe: (al * 1.1 * ueber).toFixed(2), knotenPx: kms.slice(0, 2).map(v => v.toFixed(0)).join(',') });
});
rows.sort((a, b) => +b.ueber - +a.ueber);
for(const r of rows) log(JSON.stringify(r));
// Vergleich: Werkpunkte (größter Werkkern) und Mitte
let best = null; for(let n = 0; n < N.N; n++){ const k = N.mini[n].pts.length / 6; if(!k) continue; const m = N.B.monde[n];
  const lit = (m.traumfeld ? 1.4 : 2.2) * Math.pow(Math.min(1, 16 / Math.max(1, k)), 0.7), sz = 0.17 * Math.max(0.7, N.rM[n]), szp = pxSize(sz, N.pos[n]);
  if(!best || lit > best.lit) best = {titel: m.titel, k, lit: +lit.toFixed(2), szW: +sz.toFixed(2), szPx: +szp.toFixed(1)}; }
log('Werkpunkt (hellstes lit):', JSON.stringify(best));
log('Bündelpunkt-Größe bz', bz.toFixed(2), 'Fadenpunkt fz', Math.max(0.11, S * 0.004).toFixed(2));
