// Örtliche Gitterordnung: Blatt längs in Fenster zu je ~W Körnern; je Fenster höchster Strukturfaktor im weiten Band 0,3..2,5·2π/dLok,
// geteilt durch c_Fenster (=Debye-Waller-Anteil, 1 = perfektes Gitter, Zufall ≈ ln(#k)/c). Dazu Verwackelung relativ zum Kornabstand.
import {readFileSync} from 'node:fs';
const BASE = '/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/';
const titel = process.argv[2] || 'Zentrale', WIN = +(process.argv[3] || 60);
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const NAMEN = ['Claude', 'Codex', 'Hermes', 'Antigravity', 'Kimi'];
function rng(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function dlok(P){ const c = P.length; let s = 0; for(let a = 0; a < c; a++){ let b = 1e9; for(let e = 0; e < c; e++) if(e !== a){ const h = Math.hypot(P[a][0]-P[e][0], P[a][1]-P[e][1]); if(h < b) b = h; } s += b; } return s / c; }
function smaxRel(P, d){ const c = P.length, k0 = 2 * Math.PI / d; let Smax = 0;
  for(let ix = -50; ix <= 50; ix++) for(let iy = 0; iy <= 50; iy++){ const kx = ix / 50 * 2.5 * k0, ky = iy / 50 * 2.5 * k0, kk = Math.hypot(kx, ky); if(kk < 0.3 * k0 || kk > 2.5 * k0) continue;
    let re = 0, im = 0; for(const p of P){ const ph = kx * p[0] + ky * p[1]; re += Math.cos(ph); im += Math.sin(ph); } const S = (re*re + im*im) / c; if(S > Smax) Smax = S; }
  return Smax; }
function fenster(P){ // P sortiert nach s (Kornfolge j)
  const out = []; for(let a = 0; a + WIN <= P.length; a += WIN){ const Q = P.slice(a, a + WIN), d = dlok(Q); out.push(smaxRel(Q, d)); }
  return out.length ? out.reduce((x, y) => x + y, 0) / out.length : NaN; }
async function lade(ver){ const D = 'file://' + BASE + ver + '/js/';
  const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js'); const W = await import(D + 'wuchs.js'); const L = await import(D + 'licht.js');
  const B = bestand(state), m = B.monde.find(m => m.titel.startsWith(titel)); return {Z: new Zelle(m, {ohneAufzug: true}), m, rangRadien: W.rangRadien, clamp: L.clamp}; }
function rahmen(Z, g, o){ Z.kornPos(g, o); const R = Math.hypot(o[0], o[2]); let a = Math.atan2(o[2], o[0]) - Z.gTh[g] - Z.S.rot - Z.curl * Z.gU[g] * 1.75;
  a = ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return [R, R * a]; }
const alt = await lade('alt'), neu = await lade('neu'); const {Z, m} = neu, n = m.samen.length, o = [0, 0, 0];
const weg = new Float64Array(Z.G); for(let i = 0; i < n; i++) for(let j = 0; j < Z.seedCount[i]; j++) weg[Z.seedFirst[i] + j] = Z.W.s0[i] + j + 0.5;
const rr = neu.rangRadien(weg), {clamp} = neu;
console.log(titel, 'Fenster', WIN, 'Körner; Wert = höchster Strukturfaktor im Fenster (perfektes Gitter ≈', WIN, ')');
console.log('Blatt Stimme      c | alt  neu  gold zufall | Verwackeln radial/quer in Kornabständen (neu)');
for(let i = 0; i < n; i++){ const f = Z.seedFirst[i], c = Z.seedCount[i]; if(c < 2 * WIN) continue;
  let lo = 1, hi = 0; for(let k = f; k < f + c; k++){ lo = Math.min(lo, rr[k]); hi = Math.max(hi, rr[k]); }
  const quer = Math.min(Math.PI / 2, Z.sRc[i] / Math.max(Z.sR[i], 1e-3)), R0 = Z.Rfinal, r = rng(77 + i);
  const PA = [], PN = [], PG = [], PZ = [];
  for(let j = 0, k = f; j < c; j++, k++){ PA.push(rahmen(alt.Z, k, o)); PN.push(rahmen(Z, k, o));
    const u = hi > lo ? (rr[k] - lo) / (hi - lo) : 0.5, hu = Math.pow(Math.sin(Math.PI * clamp(u * 0.92 + 0.04, 0, 1)), 0.7);
    const qg = ((j * 0.6180339887 + i * 0.37) % 1) * 2 - 1; PG.push([R0 * rr[k], R0 * rr[k] * quer * hu * qg]);
    PZ.push([R0 * rr[k], R0 * rr[k] * quer * hu * (r() * 2 - 1)]); }
  const dN = dlok(PN), jr = 1.1 * R0 * (hi - lo) / c, jq = 0.7 / Math.sqrt(c) * Z.sR[i] * quer * 0.85;
  const st = m.samen[i].stimme, nm = typeof st === 'number' ? NAMEN[st] : String(st);
  console.log(`${String(i).padStart(4)} ${nm.padEnd(11)} ${String(c).padStart(4)} | ${fenster(PA).toFixed(1).padStart(4)} ${fenster(PN).toFixed(1).padStart(4)} ${fenster(PG).toFixed(1).padStart(4)} ${fenster(PZ).toFixed(1).padStart(4)} | ±${(jr/dN).toFixed(2)} / ±${(jq/dN).toFixed(2)}`);
}
