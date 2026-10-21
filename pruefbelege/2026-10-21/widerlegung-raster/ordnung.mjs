// Widerlegungsprüfung „Raster bleibt sichtbar“: misst Gitterordnung je Blatt statt nur die Streuung der Nachbarabstände.
// Für jedes Blatt (Ausprägung) mit genug Körnern:
//  - CV der Nächster-Nachbar-Abstände (wie der Prüfer)
//  - Smax: höchster Strukturfaktor |Σ e^{ik·x}|²/c im Band um den Kornabstand (Gitter → Bragg-Spitze ~c·DW, Zufall → ~ln(#k) ≈ 6..10)
//  - nah: Anteil Körner mit Nachbar < 0,3·dLok (dLok = mittlerer NN-Abstand eines Poisson-Felds gleicher Dichte ·2 = sqrt(Fläche/c))
// Vergleich: alt (26356a7), neu (35c59bc), Referenzen auf neuer Geometrie: „gold“ (ohne Verwackeln) und „zufall“ (q gleichverteilt).
import {readFileSync} from 'node:fs';
const BASE = '/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/';
const titel = process.argv[2] || 'Zentrale';
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const NAMEN = ['Claude', 'Codex', 'Hermes', 'Antigravity', 'Kimi'];

function rng(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function masse(P){ // P: [[s,t],...] im gestreckten Blattrahmen
  const c = P.length; const d = [];
  for(let a = 0; a < c; a++){ let b = 1e9; for(let e = 0; e < c; e++) if(e !== a){ const h = Math.hypot(P[a][0] - P[e][0], P[a][1] - P[e][1]); if(h < b) b = h; } d.push(b); }
  const mu = d.reduce((x, y) => x + y, 0) / c, sd = Math.sqrt(d.reduce((x, y) => x + (y - mu) ** 2, 0) / c);
  // Fläche über konvexe Hülle grob: Bounding-Box der t je s-Streifen
  let smin = Infinity, smax = -Infinity; for(const p of P){ smin = Math.min(smin, p[0]); smax = Math.max(smax, p[0]); }
  const NB = 12, tmin = new Array(NB).fill(Infinity), tmax = new Array(NB).fill(-Infinity);
  for(const p of P){ const b = Math.min(NB - 1, Math.floor((p[0] - smin) / Math.max(1e-9, smax - smin) * NB)); tmin[b] = Math.min(tmin[b], p[1]); tmax[b] = Math.max(tmax[b], p[1]); }
  let F = 0; for(let b = 0; b < NB; b++) if(tmax[b] > tmin[b]) F += (tmax[b] - tmin[b]) * (smax - smin) / NB;
  const dLok = Math.sqrt(F / c), nah = d.filter(x => x < 0.3 * dLok).length / c;
  // Strukturfaktor im Band 0,6..1,6 × 2π/dLok
  const k0 = 2 * Math.PI / dLok; let Smax = 0, NK = 0;
  for(let ix = -40; ix <= 40; ix++) for(let iy = -40; iy <= 40; iy++){
    const kx = ix / 40 * 1.6 * k0, ky = iy / 40 * 1.6 * k0, kk = Math.hypot(kx, ky); if(kk < 0.6 * k0 || kk > 1.6 * k0) continue;
    let re = 0, im = 0; for(const p of P){ const ph = kx * p[0] + ky * p[1]; re += Math.cos(ph); im += Math.sin(ph); }
    const S = (re * re + im * im) / c; NK++; if(S > Smax) Smax = S; }
  return {cv: sd / mu, nah, Smax, NK, nnRel: mu / dLok};
}

async function lade(ver){
  const D = 'file://' + BASE + ver + '/js/';
  const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js'); const W = await import(D + 'wuchs.js'); const L = await import(D + 'licht.js');
  const B = bestand(state), m = B.monde.find(m => m.titel.startsWith(titel));
  const Z = new Zelle(m, {ohneAufzug: true});
  return {Z, m, rangRadien: W.rangRadien, hash: L.hash, clamp: L.clamp};
}

function rahmen(Z, g, o){ // gestreckter Blattrahmen aus der echten Lage: s = Radius, t = Bogen quer zur Ranke
  Z.kornPos(g, o); const R = Math.hypot(o[0], o[2]); let a = Math.atan2(o[2], o[0]) - Z.gTh[g] - Z.S.rot - Z.curl * Z.gU[g] * 1.75;
  a = ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return [R, R * a];
}

const alt = await lade('alt'), neu = await lade('neu');
const {Z, m} = neu, n = m.samen.length, o = [0, 0, 0];
// Referenzgeometrie aus der neuen Rechnung nachbauen
const weg = new Float64Array(Z.G); for(let i = 0; i < n; i++) for(let j = 0; j < Z.seedCount[i]; j++) weg[Z.seedFirst[i] + j] = Z.W.s0[i] + j + 0.5;
const rr = neu.rangRadien(weg), {hash, clamp} = neu;
console.log(titel, 'n', n, 'G', Z.G, 'curl', Z.curl, 'traum', Z.traum);
console.log('Blatt Stimme      c | CV alt/neu/gold/zufall | nah<0,3d alt/neu/gold/zufall | Smax alt/neu/gold/zufall (Gitter ≫ 20, Zufall ~6–10)');
const sum = {};
for(let i = 0; i < n; i++){
  const f = Z.seedFirst[i], c = Z.seedCount[i]; if(c < 60) continue;
  let lo = 1, hi = 0; for(let k = f; k < f + c; k++){ lo = Math.min(lo, rr[k]); hi = Math.max(hi, rr[k]); }
  const quer = Math.min(Math.PI / 2, Z.sRc[i] / Math.max(Z.sR[i], 1e-3)), R0 = Z.Rfinal, r = rng(1000 + i);
  const PA = [], PN = [], PG = [], PZ = [];
  for(let j = 0, k = f; j < c; j++, k++){
    PA.push(rahmen(alt.Z, k, o)); PN.push(rahmen(Z, k, o));
    const u = hi > lo ? (rr[k] - lo) / (hi - lo) : 0.5, hu = Math.pow(Math.sin(Math.PI * clamp(u * 0.92 + 0.04, 0, 1)), 0.7);
    const qg = ((j * 0.6180339887 + i * 0.37) % 1) * 2 - 1; PG.push([R0 * rr[k], R0 * rr[k] * quer * hu * qg]);
    const qz = r() * 2 - 1, rz = clamp(rr[k] + (r() - 0.5) * 2.2 * (hi - lo) / c, lo, hi); PZ.push([R0 * rz, R0 * rz * quer * hu * qz]);
  }
  const a = masse(PA), b = masse(PN), g = masse(PG), z = masse(PZ), st = m.samen[i].stimme, nm = typeof st === 'number' ? NAMEN[st] : String(st);
  console.log(`${String(i).padStart(4)} ${nm.padEnd(11)} ${String(c).padStart(4)} | ${a.cv.toFixed(2)}/${b.cv.toFixed(2)}/${g.cv.toFixed(2)}/${z.cv.toFixed(2)} | ${(a.nah*100).toFixed(0)}%/${(b.nah*100).toFixed(0)}%/${(g.nah*100).toFixed(0)}%/${(z.nah*100).toFixed(0)}% | ${a.Smax.toFixed(1)}/${b.Smax.toFixed(1)}/${g.Smax.toFixed(1)}/${z.Smax.toFixed(1)}`);
}
