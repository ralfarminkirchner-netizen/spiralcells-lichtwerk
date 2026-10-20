/* =====================================================================
   NETZ — die größere Zelle: alle Monde als Samen derselben Ordnung.
   Älteste innen. Jeder Mond zeigt im Kleinen seinen eigenen Teilungswinkel:
   ein Stern aus fünf Strahlen ist ein Mond in Silos, eine Spirale ein Mond im Gespräch.
   Darüber die Türen in den Verbund: Zentrale, KiNFORMER, KiN.
   ===================================================================== */
import {TAU, DEG, clamp, mix, sstep, hash, mixc, P, CAM, toScreen, screenRing, WG, KEIMC, GOLDC, SILVER, DUSTC} from './licht.js';
import {VOICES, GOLD, fibSphere} from './zelle.js';
import {MENSCH} from './daten.js';

const MEM2 = fibSphere(4200);
const SEEDC = VOICES.map(v => v.c);

export class Netz {
  constructor(B){
    this.B = B; const N = B.monde.length; this.N = N;
    this.R2 = Math.max(5, 1.6 * Math.sqrt(N)); this.H2 = this.R2 * 0.62;
    this.pos = []; this.rM = []; this.mini = [];
    for(let n = 0; n < N; n++){
      const m = B.monde[n], u = (n + 0.5) / N, rho = this.R2 * Math.sqrt(u), phi = n * GOLD + 0.6;
      const yh = u < 0.13 ? 0.54 * u / 0.13 : 0.54 + 0.46 * (u - 0.13) / 0.87;
      this.pos.push([rho * Math.cos(phi), this.H2 * yh, rho * Math.sin(phi)]);
      const zeichen = m.samen.reduce((a, s) => a + s.laenge, 0);
      const k = clamp(Math.round(10 + 7 * Math.sqrt(m.samen.length + 1) + Math.sqrt(zeichen) / 30), 12, 140);
      const rM = (0.5 + 1.15 * Math.sqrt(k / 140)) * (m.stimmen.length ? 1.35 : 1); this.rM.push(rM);
      const a = (m.winkel ?? 0) * DEG, pts = new Float32Array(k * 6);
      for(let p = 0; p < k; p++){
        const s = m.samen.length ? m.samen[Math.min(m.samen.length - 1, Math.floor(p / k * m.samen.length))] : null;
        const silo = m.winkel === 144 && s && typeof s.stimme === 'number';
        const r = rM * Math.sqrt((p + 0.5) / k), f = m.winkel == null ? hash(n * 31.7 + p * 7.3) * TAU : silo ? s.stimme * 144 * DEG + 0.6 : p * a;   // Traumfeld lose, Silo: eigene Speiche
        const c = !s ? DUSTC : typeof s.stimme === 'number' ? SEEDC[s.stimme] : s.stimme === MENSCH ? SILVER : DUSTC;
        const g = s && s.status === 'grundformation' ? 0.5 : 0;
        pts[p * 6] = r * Math.cos(f); pts[p * 6 + 1] = (p / k) * rM * 0.5; pts[p * 6 + 2] = r * Math.sin(f);
        pts[p * 6 + 3] = mix(c[0], GOLDC[0], g); pts[p * 6 + 4] = mix(c[1], GOLDC[1], g); pts[p * 6 + 5] = mix(c[2], GOLDC[2], g);
      }
      // leere Speichen eines Silo-Monds als Hauch
      if(m.winkel === 144 && m.stimmen.length < 5){ const extra = []; for(let L = 0; L < 5; L++){ if(m.stimmen.includes(L)) continue; const c = SEEDC[L];
          for(let q = 1; q <= 5; q++){ const rr = rM * q / 5, f = L * 144 * DEG + 0.6; extra.push(rr * Math.cos(f), q / 5 * rM * 0.5, rr * Math.sin(f), c[0] * 0.12, c[1] * 0.12, c[2] * 0.12); } }
        const all = new Float32Array(pts.length + extra.length); all.set(pts); all.set(extra, pts.length); this.mini.push(all); }
      else this.mini.push(pts);
    }
    // Fäden über Mondgrenzen, je Mondpaar gebündelt
    const idx = new Map(B.monde.map((m, i) => [m.id, i])), paare = new Map();
    for(const e of B.roh.edges){ const a = idx.get(B.werkVon(e.from_variant_id)), b = idx.get(B.werkVon(e.to_variant_id));
      if(a == null || b == null || a === b) continue; const k = a < b ? a * 1000 + b : b * 1000 + a;
      const p = paare.get(k) || {a: Math.min(a, b), b: Math.max(a, b), n: 0, gehoert: 0}; p.n++; if(e.edge_type === 'gehört-zu') p.gehoert++; paare.set(k, p); }
    this.faeden = [...paare.values()];
    this.Rm2 = 1.12 * Math.sqrt(this.R2 * this.R2 + this.H2 * this.H2 * 0.25);
    this.mitte = [0, this.H2 * 0.5, 0];
    // Stimmen über allen Monden: Anteil der Monde, in denen sie sprechen
    this.stimmAnteil = VOICES.map((_, i) => B.monde.filter(m => m.stimmen.includes(i)).length);
    const mx = Math.max(1, ...this.stimmAnteil); this.stimmAnteil = this.stimmAnteil.map(x => x / mx);
    this.tueren = [];
  }
  index(id){ return this.B.monde.findIndex(m => m.id === id); }
  tuerPos(i, o){ const n = Math.max(1, this.tueren.length), f = i - (n - 1) / 2;
    const a = -Math.PI / 2 + f * 0.42, lat = 0.5; o[0] = this.mitte[0] + Math.cos(a) * Math.cos(lat) * this.Rm2; o[1] = this.mitte[1] + Math.sin(lat) * this.Rm2; o[2] = this.mitte[2] + Math.sin(a) * Math.cos(lat) * this.Rm2; return o; }
}

const TMP = [0, 0, 0, 0];
export function bigHead(N, i, t, o){ const th = t * TAU / 16 + 0.6 + i * 0.4, bp = t * TAU * 0.3 + i * TAU / 5, rho = N.Rm2 * (0.8 + 0.02 * Math.cos(bp));   // oben auf der Hülle der großen Zelle
  o[0] = N.mitte[0] + rho * Math.cos(th); o[1] = N.mitte[1] + N.Rm2 * (0.58 + 0.04 * Math.sin(bp) - 0.02 * i); o[2] = N.mitte[2] + rho * Math.sin(th); return o; }

export function baueNetz(N, U, wall, vis, aktiv, aktivDetail){
  if(vis <= 0.003) return;
  const cx = CAM.P[0], cyy = CAM.P[1], cz = CAM.P[2], soloAny = U.solo >= 0;
  const hov = U.hover && U.hover.art === 'mond' ? U.hover.i : -1;
  // Monde
  for(let n = 0; n < N.N; n++){
    const m = N.B.monde[n], o = N.pos[n], pts = N.mini[n], k = pts.length / 6;
    const self = n === aktiv, fade = self ? (1 - aktivDetail) : 1; if(fade <= 0.01) continue;
    const dc = Math.hypot(o[0] - cx, o[1] - cyy, o[2] - cz), near = sstep(CAM.S * 0.05, CAM.S * 0.35, dc);
    let a = vis * fade * (self ? 1 : near);
    if(soloAny) a *= m.stimmen.includes(U.solo) ? 1.3 : 0.18;
    const lit = (m.traumfeld ? 0.4 : 2.4) * (hov === n ? 1.7 : 1) * (self ? 1.4 : 1);
    // aus der Ferne ein weicher Same, wie im Lichtwerk
    if(m.traumfeld) P(o[0], o[1] + N.rM[n] * 0.2, o[2], N.rM[n] * 1.4, DUSTC[0], DUSTC[1], DUSTC[2], a * 0.03);
    else { let r = 0, g = 0, b = 0; for(let p = 0; p < k; p++){ r += pts[p * 6 + 3]; g += pts[p * 6 + 4]; b += pts[p * 6 + 5]; } P(o[0], o[1] + N.rM[n] * 0.2, o[2], N.rM[n] * 2.2, r / k, g / k, b / k, a * 0.22); }
    const sz = 0.12 * Math.max(0.7, N.rM[n]);
    for(let p = 0; p < k; p++) P(o[0] + pts[p * 6], o[1] + pts[p * 6 + 1], o[2] + pts[p * 6 + 2], sz, pts[p * 6 + 3], pts[p * 6 + 4], pts[p * 6 + 5], a * lit * (0.75 + 0.25 * Math.sin(wall * 0.7 + p * 0.37 + n)));
    // Keim und Hülle (Mondphase als Helligkeit des Rings)
    P(o[0], o[1], o[2], 0.12, KEIMC[0], KEIMC[1], KEIMC[2], a * (m.keimKristall ? 1.6 : 0.9));
    // Mondphase als Bogen: je reifer, desto voller der Ring
    const rc = m.reife === 'kanonisch' ? GOLDC : WG;
    if(!m.traumfeld || hov === n) screenRing([o[0], o[1] + N.rM[n] * 0.25, o[2]], N.rM[n] * 1.35, rc, 0.32 * a, Math.max(0.06, m.phase));
    if(self || hov === n){ const pulse = U.RM ? 0.5 : 0.5 + 0.5 * Math.sin(wall * 2.4); screenRing([o[0], o[1] + N.rM[n] * 0.25, o[2]], N.rM[n] * (1.7 + 0.15 * pulse), GOLDC, (self ? 0.5 : 0.35) * vis); }
    // Nur echte Ankünfte seit dem letzten Besuch leuchten: ein Ring in der Farbe der Stimme, die kam
    const neu = N.neu && N.neu.get(m.id);
    if(neu){ const st = neu.find(x => typeof x.stimme === 'number'), c = st ? SEEDC[st.stimme] : WG, puls = U.RM ? 0.8 : 0.65 + 0.35 * Math.sin(wall * 1.6 + n);
      const mitte = [o[0], o[1] + N.rM[n] * 0.25, o[2]];
      screenRing(mitte, N.rM[n] * 2.1, c, 1.1 * vis * fade * puls); screenRing(mitte, N.rM[n] * 2.45, c, 0.45 * vis * fade * puls);
      P(mitte[0], mitte[1], mitte[2], N.rM[n] * 2.6, c[0], c[1], c[2], 0.06 * vis * fade * puls); }
    const hs = toScreen(o[0], o[1], o[2]); U.monde[n] = hs;
  }
  // Fäden zwischen Monden: zart; „gehört zu“ silbern
  for(const f of N.faeden){ const A = N.pos[f.a], B = N.pos[f.b], d = Math.hypot(A[0] - B[0], A[2] - B[2]), n = Math.round(clamp(d * 4, 12, 90)), lift = d * 0.12;
    const c = f.gehoert === f.n ? SILVER : WG, al = vis * (0.05 + 0.04 * Math.min(6, f.n)) * (soloAny ? 0.3 : 1);
    for(let s = 1; s < n; s++){ if(f.gehoert === f.n && s % 3 === 0) continue; const t = s / n;
      P(mix(A[0], B[0], t), mix(A[1], B[1], t) + Math.sin(Math.PI * t) * lift, mix(A[2], B[2], t), 0.04, c[0], c[1], c[2], al); } }
  // Hülle der großen Zelle
  const Rm2 = N.Rm2 * (1 + 0.012 * Math.sin(TAU * wall / 6.85)), C0 = N.mitte;
  for(let k = 0; k < MEM2.length / 3; k++){ const ux = MEM2[k * 3], uy = MEM2[k * 3 + 1], uz = MEM2[k * 3 + 2];
    const x = C0[0] + ux * Rm2, y = C0[1] + uy * Rm2, z = C0[2] + uz * Rm2;
    const vx = cx - x, vy = cyy - y, vz = cz - z, vl = Math.hypot(vx, vy, vz) || 1, fres = Math.pow(1 - Math.abs((ux * vx + uy * vy + uz * vz) / vl), 4.0);
    const lum = (0.004 + fres) * vis * 0.4; P(x, y, z, Rm2 * 0.0045, WG[0] * lum, WG[1] * lum * 0.97, WG[2] * lum * 0.98, 0.7); }
  // Die fünf Stimmen über allen Monden, langsam und breit
  for(let i = 0; i < 5; i++){ const c = mixc(VOICES[i].c, WG, 0.35), al = vis * (0.25 + 0.75 * N.stimmAnteil[i]) * U.soloA[i];
    for(let k = 0; k < 90; k++){ bigHead(N, i, wall - k * 0.018, TMP); const age = k / 90; P(TMP[0], TMP[1], TMP[2], N.R2 * mix(0.012, 0.0024, age), c[0], c[1], c[2], Math.pow(1 - age, 1.5) * al * 0.6); }
    bigHead(N, i, wall, TMP); P(TMP[0], TMP[1], TMP[2], N.R2 * 0.045, c[0], c[1], c[2], 2.0 * al);
    const hs = toScreen(TMP[0], TMP[1], TMP[2]); U.bigHeads[i] = hs; }
  // Türen in den Verbund
  for(let i = 0; i < N.tueren.length; i++){ const t = N.tueren[i]; N.tuerPos(i, TMP); const wach = t.wach === true;
    const c = wach ? KEIMC : DUSTC, pulse = wach ? 0.75 + 0.25 * Math.sin(wall * 1.3 + i) : 0.35, h = U.hover && U.hover.art === 'tuer' && U.hover.i === i;
    P(TMP[0], TMP[1], TMP[2], N.R2 * 0.03, c[0], c[1], c[2], vis * pulse * (h ? 2.2 : 1.2));
    screenRing([TMP[0], TMP[1], TMP[2]], N.R2 * 0.05, wach ? GOLDC : DUSTC, vis * (h ? 0.6 : 0.25));
    U.tueren[i] = toScreen(TMP[0], TMP[1], TMP[2]); }
}
