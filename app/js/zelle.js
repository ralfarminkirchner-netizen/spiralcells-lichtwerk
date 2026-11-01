/* =====================================================================
   ZELLE — ein echter Mond als Lichtzelle.
   Körner = Ausprägungen nach Textmasse · Bahnen 5·m+Stimme = Speichen bei 144° ·
   Kopplung aus den Daten (gesehen, verbunden, befundet) treibt die Kuramoto-Köpfe
   und den Teilungswinkel · Einrasten bei 137,508° nur, wenn Ralf kristallisiert hat.
   Beim Öffnen läuft die Geschichte des Monds einmal ab (Aufzug), dann lebt die Zelle.
   ===================================================================== */
import {TAU, DEG, clamp, mix, sstep, eio, lin, hash, mixc, desat, P, CAM, toScreen, screenRing,
        WG, KEIMC, GOLDC, SILVER, DUSTC, ASCHE} from './licht.js';
import {STIMMEN, MENSCH, QUELLE} from './daten.js';
import {wuchs, rangRadien, biege, ahnen, nachkommen, KEIM} from './wuchs.js';

export const RC = 1.0, HC = 1.3, NMAX = 2584, DT = 1 / 120;
export const GOLD = 137.50776 * DEG, SPOKE = 144 * DEG;
export const VOICES = STIMMEN.map((v, i) => ({...v, c: lin(v.hex), w: [1.25, 0.95, 1.0, 1.15, 1.0][i], T: [2.1, 2.7, 1.3, 3.4, 4.2][i]}));
const SEEDC = VOICES.map(v => desat(v.c, 0.3));
const OM0 = VOICES.map(v => TAU / v.T), OMC = TAU / 2.4, OM0_RM = OM0.map(w => w * 0.15), OMC_RM = OMC * 0.15;
const INC = [0.55, 1.0, 0.75, 0.9, 0.65], NODE = [0.3, 1.7, 3.1, 4.4, 5.6], RHOK = [0.0, -0.12, 0.08, -0.05, 0.22];
const TRC = 480;
const TURN = 1.75, CURL_TRAUM = 0.42, HB = 48;   // volle Krümmung eines Arms vom Keim bis zum Rand (rad); Traumfeld sanft; Fächer der Hülle

/* Fibonacci-Hüllen, leicht verwackelt gegen Moiré */
export function fibSphere(M){ const a = new Float32Array(M * 3), j = 0.5 / Math.sqrt(M);
  for(let k = 0; k < M; k++){ const y = clamp(1 - 2 * (k + 0.5) / M + (hash(k * 1.7) - 0.5) * j, -1, 1), r = Math.sqrt(1 - y * y), ph = k * GOLD + (hash(k * 3.3) - 0.5) * j * 6, s = 1 + (hash(k * 5.1) - 0.5) * 0.03;
    a[k * 3] = r * Math.cos(ph) * s; a[k * 3 + 1] = y * s; a[k * 3 + 2] = r * Math.sin(ph) * s; } return a; }
const MEM = fibSphere(3400);
const DN = 320, DS = new Float32Array(DN * 3);
for(let i = 0; i < DN; i++){ DS[i * 3] = (hash(i * 3.1) - 0.5) * 6; DS[i * 3 + 1] = (hash(i * 5.7) - 0.5) * 4 + 0.6; DS[i * 3 + 2] = (hash(i * 9.3) - 0.5) * 6; }

/* Funken (gemeinsam für alle Zellen) */
const SPK = 2400, kP = new Float32Array(SPK * 3), kV = new Float32Array(SPK * 3), kL = new Float32Array(SPK), kM = new Float32Array(SPK), kC = new Float32Array(SPK * 3), kS = new Float32Array(SPK);
let kH = 0;
export function spark(x, y, z, vx, vy, vz, life, c, size){ const i = kH; kH = (kH + 1) % SPK; kP[i*3]=x; kP[i*3+1]=y; kP[i*3+2]=z; kV[i*3]=vx; kV[i*3+1]=vy; kV[i*3+2]=vz;
  kL[i] = life; kM[i] = life; kC[i*3]=c[0]; kC[i*3+1]=c[1]; kC[i*3+2]=c[2]; kS[i] = size; }
export function burst(x, y, z, c, n, sp, life, size){ for(let k = 0; k < n; k++){ const u = Math.random() * 2 - 1, a = Math.random() * TAU, r = Math.sqrt(1 - u * u), v = sp * (0.4 + 0.6 * Math.random());
  spark(x, y, z, r * Math.cos(a) * v, u * v, r * Math.sin(a) * v, life * (0.6 + 0.4 * Math.random()), c, size); } }
export function updSparks(dt){ const dmp = Math.exp(-dt * 2.2); for(let i = 0; i < SPK; i++){ if(kL[i] <= 0) continue; kL[i] -= dt;
  kP[i*3] += kV[i*3] * dt; kP[i*3+1] += kV[i*3+1] * dt; kP[i*3+2] += kV[i*3+2] * dt; kV[i*3] *= dmp; kV[i*3+1] *= dmp; kV[i*3+2] *= dmp; } }
export function drawSparks(){ for(let i = 0; i < SPK; i++){ if(kL[i] <= 0) continue; const a = kL[i] / kM[i]; P(kP[i*3], kP[i*3+1], kP[i*3+2], kS[i] * (0.4 + 0.6 * a), kC[i*3], kC[i*3+1], kC[i*3+2], a * a * 1.4); } }
export function clearSparks(){ kL.fill(0); }

const farbeVon = s => typeof s === 'number' ? SEEDC[s] : s === MENSCH ? SILVER : DUSTC;
const PAPIERC = lin('#f7f5f0');   // ein Form-Korn: papierhell, Ralf hat es geholt, die Worte sind die des Originals
const stimmFarbe = s => typeof s === 'number' ? VOICES[s].c : s === MENSCH ? SILVER : DUSTC;

export class Zelle {
  constructor(mond, opt = {}){
    this.m = mond; this.RM = !!opt.RM; this.origin = opt.origin || [0, 0, 0];
    this.au = opt.au || null;
    this.voices = mond.stimmen.slice();               // anwesende Stimmen
    this.has = [0, 1, 2, 3, 4].map(i => this.voices.includes(i));
    this.traum = mond.traumfeld;
    this.A = new Float64Array(25).fill(Infinity);   // wer liest wen, ab wann
    for(const [i, j, t] of mond.paarBelege || []) this.A[i * 5 + j] = t;
    this.bau();
    this.reset(opt.ohneAufzug || this.RM);
  }

  /* --------------------------------------------- Körner aus den Ausprägungen */
  bau(){
    const m = this.m, sam = m.samen, n = sam.length;
    // Ein Form-Korn ist ein einzelnes kleines Korn: es zählt nicht zur Textmasse des Monds
    const total = Math.max(1, sam.reduce((a, s) => a + (s.form ? 0 : Math.max(1, s.laenge)), 0));
    let cpg = total / clamp(Math.round(total / 45), Math.min(NMAX, Math.max(60, n * 3)), NMAX);
    let counts;
    const minK = 3 * n > NMAX ? Math.max(1, Math.floor(NMAX / Math.max(1, n))) : 3;   // sehr viele Ausprägungen: weniger Körner je Ausprägung
    for(let pass = 0; pass < 4; pass++){
      counts = sam.map(s => s.form ? minK : Math.max(minK, Math.round(Math.max(1, s.laenge) / cpg)));
      const sum = counts.reduce((a, b) => a + b, 0);
      if(sum <= NMAX) break; cpg *= sum / NMAX * 1.02;
    }
    const G = counts ? counts.reduce((a, b) => a + b, 0) : 0;
    this.G = G;
    // Der Wuchs: jede Ausprägung an ihrer belegten Herkunft, Masse in Körnern
    const W = this.W = wuchs(m, {masse: counts || []});
    this.gSeed = new Int32Array(G); this.gRank = new Int32Array(G); this.gRho = new Float32Array(G);
    this.gY = new Float32Array(G); this.gCol = new Float32Array(G * 3); this.gBorn = new Float32Array(G).fill(-1); this.gFrom = new Float32Array(G * 3);
    this.gPhiLock = new Float32Array(G); this.gR = new Float32Array(G); this.gTh = new Float32Array(G); this.gU = new Float32Array(G); this.gJ = new Float32Array(G);
    this.gDr = new Float32Array(G); this.gDt = new Float32Array(G);   // Lage im Blütenstand der eigenen Ausprägung (radial, quer als Winkel)
    this.gRzeit = new Float32Array(G); this.sRzeit = new Float32Array(n);   // Radius nach Zeitrang: von der Seite steht die Zelle als Kelch
    this.seedDicht = new Float32Array(n); this.seedDichtK = new Float32Array(n);   // wie viel dichter ein Blatt liegt als die gleichmäßige Scheibe (ab dem Doppelten), von oben und im Kelch
    this.sR = new Float32Array(n); this.sTh = new Float32Array(n); this.sU = new Float32Array(n); this.sRc = new Float32Array(n);
    this.kelchK = 0; this.spiralK = 0; this.curl = this.traum ? CURL_TRAUM : 0;
    this.seedFirst = new Int32Array(n); this.seedCount = new Int32Array(n); this.seedCore = new Int32Array(n);
    const t0 = m.zeitspanne[0], t1 = m.zeitspanne[1], span = Math.max(1, t1 - t0);
    const yOf = i => { if(n <= 0) return 0; const f = 0.7 * (n > 1 ? i / (n - 1) : 1) + 0.3 * clamp((sam[i].zeit - t0) / span, 0, 1);
      return HC * (f < 0.3 ? 0.62 * f / 0.3 : 0.62 + 0.38 * (f - 0.3) / 0.7); };
    this.seedY = sam.map((_, i) => yOf(i));
    // Jugend je Stimme: 0 die älteste, 1 die jüngste Ausprägung dieser Stimme
    this.seedJung = new Float32Array(n); { const proS = new Map(); sam.forEach((s, i) => { const k = s.form ? 'form' : String(s.stimme); if(!proS.has(k)) proS.set(k, []); proS.get(k).push(i); });
      for(const arr of proS.values()) arr.forEach((i, j) => { this.seedJung[i] = arr.length > 1 ? j / (arr.length - 1) : 1; }); }
    const weg = new Float64Array(G);
    let g = 0;
    for(let i = 0; i < n; i++){
      const s = sam[i], c = counts[i], y0 = this.seedY[i], y1 = i + 1 < n ? this.seedY[i + 1] : y0 + 0.02;
      this.seedFirst[i] = g; this.seedCount[i] = c;
      const col = s.form ? PAPIERC : farbeVon(s.stimme);
      for(let j = 0; j < c; j++, g++){
        this.gSeed[g] = i; this.gY[g] = mix(y0, y1, j / c) + (hash(g * 2.7) - 0.5) * 0.004;
        weg[g] = W.s0[i] + j + 0.5;                                   // Weg vom Keim, in Körnern
        this.gTh[g] = biege(W.th0[i], W.th1[i], (j + 1) / c);         // aus der Richtung der Eltern in die eigene
        this.gJ[g] = hash(g * 7.77 + 0.3);
        const v = 0.92 + 0.16 * hash(g * 1.3);
        this.gCol[g * 3] = col[0] * v; this.gCol[g * 3 + 1] = col[1] * v; this.gCol[g * 3 + 2] = col[2] * v;
      }
      this.seedCore[i] = this.seedFirst[i] + (c >> 1);
    }
    // Radius nach Rang des Wegs: gleiche Fläche je Korn, die Abstammung läuft von innen nach außen.
    // Jede Ausprägung wird ein Blatt an ihrer Ranke: so lang wie ihr Stück der Abstammung und flächentreu so breit,
    // wie ihre Körner in der gleichmäßigen Scheibe Platz hätten, höchstens bis zum halben Bogen ihres Fächers; an den Enden schmal.
    // So füllen die Ranken ihre Keile wie Blütenblätter, Ranken, Gabeln und Fächer bleiben lesbar, das Licht bleibt körnig.
    this.Rfinal = RC * Math.sqrt(G / NMAX);
    const rr = rangRadien(weg), a0 = Math.PI * this.Rfinal * this.Rfinal / Math.max(1, G);
    // Von der Seite zählt die Zeit: Die Körner liegen schon in der Folge ihres Entstehens, ihr Rang darin gibt den Radius im Kelch.
    for(let k = 0; k < G; k++) this.gRzeit[k] = this.Rfinal * Math.sqrt((k + 0.5) / Math.max(1, G));
    for(let i = 0; i < n; i++){
      const f = this.seedFirst[i], c = this.seedCount[i]; let lo = 1, hi = 0, mitte = 0;
      for(let k = f; k < f + c; k++){ lo = Math.min(lo, rr[k]); hi = Math.max(hi, rr[k]); mitte += rr[k]; } mitte /= c;
      const R = this.Rfinal * mitte, flaeche = c * a0 / (2 * this.Rfinal * Math.max(hi - lo, 1e-3)), bogen = 0.5 * W.spann[i] * R;
      const breit = Math.max(0.006, Math.min(flaeche, bogen)), quer = Math.min(Math.PI / 2, breit / Math.max(R, 1e-3));   // halbe Breite, als Länge und als Winkel
      this.sR[i] = R; this.sU[i] = mitte; this.sTh[i] = biege(W.th0[i], W.th1[i], 0.5); this.sRc[i] = breit; this.sRzeit[i] = this.gRzeit[this.seedCore[i]];
      this.seedDicht[i] = clamp(c * a0 / (2 * breit * Math.max(this.Rfinal * (hi - lo), 0.0125)) / 2, 1, 32);   // ein Blatt ist mindestens ein Korn dick
      const hoch = (i + 1 < n ? this.seedY[i + 1] : this.seedY[i] + 0.02) - this.seedY[i];   // im Kelch: der Bogen des Blatts auf seinem Zeitradius, so hoch wie sein Stück Geschichte
      this.seedDichtK[i] = clamp(c * a0 / (Math.max(2 * quer * this.sRzeit[i], 0.0125) * Math.max(hoch, 0.0125)) / 2, 1, 32);
      for(let j = 0, k = f; j < c; j++, k++){
        const u = hi > lo ? (rr[k] - lo) / (hi - lo) : 0.5, huelle = Math.pow(Math.sin(Math.PI * clamp(u * 0.92 + 0.04, 0, 1)), 0.7);
        // Querlage aus der goldenen Folge, um etwa einen halben Kornabstand verwackelt, damit kein Raster entsteht
        const q = clamp(((j * 0.6180339887 + i * 0.37) % 1) * 2 - 1 + (hash(k * 3.71 + 0.9) - 0.5) * 1.4 / Math.sqrt(c), -1, 1);
        // auch radial um etwa einen Kornabstand verwackelt: sonst stehen die Körner in sichtbaren Reihen wie im Rasterdruck
        const ru = clamp(rr[k] + (hash(k * 5.13 + 2.7) - 0.5) * 2.2 * (hi - lo) / Math.max(1, c), lo, hi);
        this.gU[k] = ru; this.gR[k] = this.Rfinal * ru; this.gDt[k] = quer * huelle * q; this.gDr[k] = 0; }
    }
    // Einrasten: dieselbe Folge, nun als goldene Phyllotaxis; jede Ausprägung hat ihre Lücke
    const order = Array.from({length: G}, (_, i) => i).sort((a, b) => weg[a] - weg[b] || a - b);
    this.byRank = new Int32Array(G);
    order.forEach((gi, r) => { this.gRank[gi] = r; this.byRank[r] = gi; this.gRho[gi] = RC * Math.sqrt((r + 0.5) / NMAX); this.gPhiLock[gi] = r * GOLD; });
    this.statusFarben();
    // Tagesmarken für den Kelch: der erste Tag, jeder neue Tag dazwischen und immer auch der letzte.
    // Eine Marke steht an der ersten Ausprägung ihres Tages und trägt deren Datum; ein Tag ohne Einträge bekommt keine eigene.
    this.tage = [];
    if(n > 1 && t1 - t0 > 3600e3){
      const marke = i => { if(i < 0 || (this.tage.length && this.tage[this.tage.length - 1].i >= i)) return; this.tage.push({y: this.seedY[i], t: sam[i].zeit, i}); };
      marke(0);
      const d = new Date(t0); d.setHours(24, 0, 0, 0);
      for(; d.getTime() < t1 && this.tage.length < 12; d.setDate(d.getDate() + 1)){
        const t = d.getTime(), i = sam.findIndex(s => s.zeit >= t); if(i < 0) break; marke(i); }
      const letzt = new Date(sam[n - 1].zeit); letzt.setHours(0, 0, 0, 0);
      marke(sam.findIndex(s => s.zeit >= letzt.getTime()));
    }
    this.huelle = new Float32Array(HB).fill(1); this.huelleN = new Float32Array(HB); this.gP = new Float32Array(G * 3); this.gSicht = new Uint8Array(G);
    this.wahl = {i: -2, pfad: null, nach: null};
  }

  /* Status färbt nach: Grundformation weißgold, geprüft heller, verworfen Asche */
  statusFarben(){
    const sam = this.m.samen;
    this.seedLuz = new Float32Array(sam.length);
    for(let i = 0; i < sam.length; i++){
      const st = sam[i].status; this.seedLuz[i] = st === 'verworfen' ? 0.28 : st === 'geprüft' ? 1.25 : st === 'grundformation' ? 1.5 : 1;
      if(st === 'grundformation' || st === 'verworfen'){ const tint = st === 'grundformation' ? mixc(GOLDC, WG, 0.35) : ASCHE, k = st === 'grundformation' ? 0.55 : 0.6;
        for(let g = this.seedFirst[i]; g < this.seedFirst[i] + this.seedCount[i]; g++) for(let c = 0; c < 3; c++) this.gCol[g * 3 + c] = mix(this.gCol[g * 3 + c], tint[c], k); }
    }
  }

  reset(sofort){
    const S = this.S = {clock: 0, still: 0, locked: false, relock: false, frozen: false, lockT: -99, lk: 0, lockedOnce: false,
      theta: [0, 1.2566, 2.5133, 3.7699, 5.0265], kv: [0, 0, 0, 0, 0], kickT: -99, kickAmt: 0, r: 0, rb: 0, psi: 0, C: 0,
      alpha: this.traum ? GOLD : SPOKE, aV: 0, hold: 0, holdT: 0, holdP: null, Rs: 0.03, yRim: 0, Sc: 0.317, qI: -1, qTh: 0, hopP: -1, hopTm: 0,
      trH: 0, trN: 0, waves: [], flights: [], pairs: null, pairsT: -99, nBorn: 0, yTop: 0, rhoTop: 0.03, arrive: 0, rot: 0,
      aufzug: !sofort && this.m.samen.length > 0, rt: 0, D: clamp(3.5 + 0.55 * this.m.samen.length, 6, 13), nextSeed: 0, cNow: 0, phase: 0.04, endT: -1};
    this.TR = VOICES.map(() => new Float32Array(TRC * 3));
    this.gBorn.fill(-1);
    if(!S.aufzug){ this.alleGeboren(); S.arrive = 1; S.cNow = this.m.kopplung; S.alpha = this.zielWinkel(); this.curl = this.kruemmung(); S.phase = this.m.phase;
      S.Rs = Math.max(0.03, this.Rfinal); S.yRim = this.G ? this.gY[this.G - 1] : 0; S.Sc = this.memR() * 1.32; S.rb = this.m.kopplung > 0.5 ? 0.95 : 0.4;
      if(this.m.kristall.length){ S.locked = true; S.lockedOnce = true; S.lk = 1; S.lockT = -10; this.freeze(); } }
  }
  alleGeboren(){ for(let g = 0; g < this.G; g++){ this.gBorn[g] = -10; this.einKorn(g); } this.S.nextSeed = this.m.samen.length; }
  einKorn(g){ const S = this.S; S.nBorn++; S.yTop = Math.max(S.yTop, this.gY[g]); S.rhoTop = Math.max(S.rhoTop, this.gR[g]); }
  /* Die Ranken krümmen sich mit dem Teilungswinkel: 144° gerade Speichen (Silos), zum goldenen Winkel hin Spiralarme */
  kruemmung(){ return this.traum ? CURL_TRAUM : clamp((SPOKE - this.S.alpha) / (SPOKE - GOLD), 0, 1.1); }
  zielWinkel(){ const S = this.S; if(this.traum) return GOLD; if(S.locked || S.frozen) return GOLD; const tw = Math.max(S.cNow, S.hold * Math.min(1, S.C * 1.2)); return mix(SPOKE, GOLD, 0.84 * tw); }
  freeze(){ const S = this.S; S.frozen = true; }

  orbitR(){ return Math.max(0.2, this.S.Rs * 1.16); }
  memR(){ const S = this.S; return Math.max(this.orbitR() * 1.2, 1.12 * Math.sqrt(S.Rs * S.Rs + S.yRim * S.yRim * 0.25)); }
  center(){ return [this.origin[0], this.origin[1] + this.S.yRim * 0.5, this.origin[2]]; }

  /* Lage eines Korns (Weltkoordinaten): im Blatt seiner Ausprägung an der Ranke, die Ranke gekrümmt nach Kopplung, beim Einrasten golden.
     Von der Seite rückt das Korn weich auf den Radius seiner Zeit; der Winkel bleibt die Abstammung. */
  kornPos(g, o){
    const S = this.S, O = this.origin;
    let th = this.gTh[g] + this.gDt[g] + this.curl * this.gU[g] * TURN + S.rot, R = this.kelchK > 0 ? mix(this.gR[g], this.gRzeit[g], this.kelchK) : this.gR[g];
    if(this.traum){ const j = this.gJ[g]; th += 0.05 * Math.sin(S.clock * 0.07 + j * 40); R *= 1 + 0.04 * Math.sin(S.clock * 0.05 + j * 23); }   // Traumfeld: lose, still treibend
    let x = R * Math.cos(th), z = R * Math.sin(th);
    // Die Spirale als Ansicht und der Kelch von der Seite: dieselben Körner in ihrer Folge, am Winkel, den der Mond heute hat
    const sk = this.traum ? 0 : Math.max(this.spiralK, this.kelchK);
    if(sk > 0.001){ const rz = this.kelchK > 0 ? mix(this.gRho[g], this.gRzeit[g], this.kelchK) : this.gRho[g], pg = this.gRank[g] * S.alpha + S.rot;
      let pf = Math.atan2(z, x), d = pg - pf; d = Math.atan2(Math.sin(d), Math.cos(d)); const p = pf + d * sk, r = mix(Math.hypot(x, z), rz, sk);
      x = r * Math.cos(p); z = r * Math.sin(p); }
    if(S.lk > 0.001 || S.frozen){ const rr = this.gRho[g] / Math.max(0.05, this.Rfinal);
      const b = S.frozen && S.clock - S.lockT > 4 ? 1 : sstep(0, 1, (S.clock - S.lockT - 0.55 - rr * 1.1) / 0.9);
      if(b > 0){ const pg = this.gPhiLock[g] + S.rot, rg = this.gRho[g];
        // auf dem Kreisbogen hinüber, nicht quer durch die Mitte
        let pf = Math.atan2(z, x), d = pg - pf; d = Math.atan2(Math.sin(d), Math.cos(d)); const p = pf + d * b, r = mix(Math.hypot(x, z), rg, b);
        x = r * Math.cos(p); z = r * Math.sin(p); } }
    o[0] = O[0] + x; o[1] = O[1] + this.gY[g]; o[2] = O[2] + z; return o;
  }
  /* Mitte eines Blatts: daran hängen Stiele, Fäden und Marken */
  mittePos(i, o){
    const S = this.S, O = this.origin, th = this.sTh[i] + this.curl * this.sU[i] * TURN + S.rot, R = this.kelchK > 0 ? mix(this.sR[i], this.sRzeit[i], this.kelchK) : this.sR[i];
    if(S.lk > 0.001 || S.frozen || (!this.traum && Math.max(this.spiralK, this.kelchK) > 0.001)){ return this.kornPos(this.seedCore[i], o); }
    o[0] = O[0] + R * Math.cos(th); o[1] = O[1] + this.seedY[i]; o[2] = O[2] + R * Math.sin(th); return o;
  }
  seedPos(i, o){ return this.mittePos(i, o); }
  keimPos(o){ o[0] = this.origin[0]; o[1] = this.origin[1]; o[2] = this.origin[2]; return o; }

  headPos(i, o){
    const S = this.S, C = S.C, amp = Math.max(0.1, 1 - C), Lk = S.lk, O = this.origin;
    let th = S.theta[i];
    if(i === 1) th = mix(S.qTh, th, C * C);
    const R0 = this.orbitR();
    let rho = R0 * (1 + 0.9 * RHOK[i] * amp) * (S.locked ? 0.97 : 1);
    if(i === 4) rho *= 1 + 0.2 * amp * Math.cos(th - 0.9);
    if(i === 0) rho *= 1 + 0.06 * amp * Math.sin(2 * th + 0.4);
    let x = rho * Math.cos(th), z = rho * Math.sin(th);
    let y = S.yRim + 0.035 + rho * Math.sin(0.44 * amp * INC[i]) * Math.sin(th - NODE[i]);
    if(i === 3) y += 0.05 * R0 * amp * (0.5 + 0.5 * Math.sin(th * 0.5 + S.clock * 0.9));
    const bA = 0.13 * R0 * Lk * (1 - 0.45 * S.hold), bp = S.clock * TAU * 1.1 + i * TAU / 5, cb = Math.cos(bp) * bA;
    x += Math.cos(th) * cb; z += Math.sin(th) * cb; y += Math.sin(bp) * bA * 0.8;
    if(i === 2 && S.hopP >= 0){ const h = S.hopP, e = Math.sin(Math.PI * h), bend = Math.sin(TAU * h) * 0.22; const px = -z, pz = x; x = mix(x, -x, e) + px * bend; z = mix(z, -z, e) + pz * bend; }
    if(S.holdP && S.hold > 0.01){ const k = 0.04 * S.hold; x = mix(x, S.holdP[0] - O[0], k); y = mix(y, S.holdP[1] - O[1], k); z = mix(z, S.holdP[2] - O[2], k); }
    let e = 1;
    if(S.arrive < 1){ const a = 0.15 * i, ee0 = clamp((S.arrive - a * 0.4) / (1 - a * 0.4), 0, 1); e = ee0; const q = 1 - e, ee = 1 - q * q * q;
      const d = Math.PI / 2 + i * TAU / 5, far = 2.4 * Math.max(0.4, R0 * 2), sw = Math.sin(Math.PI * e) * 0.45 * q * R0 * 2;
      x = mix(Math.cos(d) * far, x, ee) + Math.cos(d + Math.PI / 2) * sw; z = mix(Math.sin(d) * far, z, ee) + Math.sin(d + Math.PI / 2) * sw; y = mix(S.yRim + 0.3, y, ee); }
    o[0] = O[0] + x; o[1] = O[1] + y; o[2] = O[2] + z; o[3] = this.has[i] ? e : 0; return o;
  }

  /* Ein Einwurf stößt die Stimmen in seiner Nähe kräftig, die fernen nur leicht */
  kickAt(p){ const S = this.S, HP = [0, 0, 0, 0]; let tot = 0; const pa = Math.atan2(p[2] - this.origin[2], p[0] - this.origin[0]);
    for(const i of this.voices){ this.headPos(i, HP);
      const d2 = (HP[0] - p[0]) ** 2 + (HP[1] - p[1]) ** 2 + (HP[2] - p[2]) ** 2, R = 0.55 * this.orbitR();
      const imp = 0.8 + 3.2 * Math.exp(-d2 / (R * R));
      let diff = pa - Math.atan2(HP[2] - this.origin[2], HP[0] - this.origin[0]); diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      S.kv[i] += (diff > 0 ? -1 : 1) * imp * (0.8 + 0.4 * hash(S.clock * 7 + i)); tot += imp; }
    S.kickT = S.clock; S.kickAmt = clamp(0.8 + tot / 20, 0.8, 1); }

  lockNow(ff){ const S = this.S;
    S.locked = true; S.relock = false; S.lockT = S.clock; S.pairs = null; S.pairsT = S.clock + 0.55; S.lockedOnce = true;
    if(!ff){ this.au && this.au.bell(1); const HP = [0, 0, 0, 0]; for(const i of this.voices){ this.headPos(i, HP); burst(HP[0], HP[1], HP[2], mixc(VOICES[i].c, GOLDC, 0.5), 26, 0.5, 1.2, 0.012); } } }

  /* Kristallisieren wurde gerade geschrieben: Stille, dann Einrasten */
  kristallisiert(){ const S = this.S; if(S.locked) { S.lockT = S.clock; S.pairs = null; S.pairsT = S.clock + 0.55; this.au && this.au.bell(0.6); return; } S.still = this.RM ? 0.05 : 1.3; }

  computePairs(){ const pairs = [], FS = [8, 13, 21, 34], p = [0, 0, 0], q = [0, 0, 0], G = this.G;
    const ziel = (g, o) => { o[0] = this.gRho[g] * Math.cos(this.gPhiLock[g]); o[2] = this.gRho[g] * Math.sin(this.gPhiLock[g]); return o; };   // Zielgitter, nicht der Übergang
    for(let r = 0; r < G; r++){ const n = this.byRank[r]; if(this.gBorn[n] === -1) continue; ziel(n, p); let b1 = -1, d1 = 1e9, b2 = -1, d2 = 1e9;
      for(const F of FS){ if(r + F >= G) break; const m = this.byRank[r + F]; ziel(m, q);
        const d = (p[0] - q[0]) ** 2 + (p[2] - q[2]) ** 2; if(d < d1){ b2 = b1; d2 = d1; b1 = m; d1 = d; } else if(d < d2){ b2 = m; d2 = d; } }
      if(b1 >= 0) pairs.push(n, b1); if(b2 >= 0) pairs.push(n, b2); }
    this.S.pairs = pairs; }

  /* --------------------------------------------------------------- Schritt */
  step(dt, ff){
    const S = this.S, m = this.m;
    if(S.still > 0){ S.still -= dt; if(S.still <= 0) this.lockNow(ff); return; }
    S.clock += dt;
    S.arrive = Math.min(1, S.arrive + dt / (this.RM ? 0.01 : 3.2));
    // Aufzug: die Ausprägungen erscheinen in ihrer echten Reihenfolge
    if(S.aufzug){
      S.rt += dt; const n = m.samen.length;
      while(S.nextSeed < n && S.rt >= 1.6 + (S.D - 1.6) * (S.nextSeed + 0.5) / n) this.geboren(S.nextSeed++, ff);
      if(S.nextSeed >= n && S.endT < 0) S.endT = S.clock;
      const tNow = S.nextSeed > 0 ? m.samen[S.nextSeed - 1].zeit : 0, nv = this.voices.length;
      const pz = m.paarZeiten.filter(t => t <= tNow).length;
      S.cNow = nv >= 2 ? pz / (nv * (nv - 1)) : 0;
      if(S.endT >= 0 && S.clock - S.endT > 1.2){ S.aufzug = false; S.cNow = m.kopplung; if(m.kristall.length && !S.locked){ S.still = this.RM ? 0.05 : 1.3; } }
    } else S.cNow = m.kopplung;
    // Kopplung → Kuramoto, gerichtet: eine Stimme wird nur von denen gezogen, die sie belegt liest
    const tNow = S.aufzug ? (S.nextSeed > 0 ? m.samen[S.nextSeed - 1].zeit : -Infinity) : Number.MAX_VALUE;
    const lockAll = S.locked ? 1 : 0, hold = S.hold;
    const kt = S.clock - S.kickT, dis = kt < 4.2 ? (1 - sstep(1.8, 3.6, kt)) * S.kickAmt : 0;
    const th = S.theta, V = this.voices, nv = Math.max(1, V.length), A = this.A;
    const kd = Math.exp(-dt / 0.7), dth = [0, 0, 0, 0, 0];
    for(let i = 0; i < 5; i++){
      let liest = 0, sum = 0;
      if(this.has[i]) for(const j of V){ if(j === i) continue; const a = Math.max(A[i * 5 + j] <= tNow ? 1 : 0, lockAll, hold); liest += A[i * 5 + j] <= tNow ? 1 : 0; sum += a * Math.sin(th[j] - th[i]); }
      const deg = nv > 1 ? liest / (nv - 1) : 0;
      let K = 3.0 * (1 + 12 * hold), wb = Math.max(0.9 * deg, lockAll, 0.97 * hold);
      K *= mix(1, 0.04, dis); wb *= mix(1, 0.15, dis);
      dth[i] = mix(this.RM ? OM0_RM[i] : OM0[i], this.RM ? OMC_RM : OMC, wb) + (K / nv) * sum + S.kv[i]; S.kv[i] *= kd; }   // reduzierte Bewegung: langsame Köpfe
    for(let i = 0; i < 5; i++) th[i] += dth[i] * dt;
    let sx = 0, sy = 0; for(const j of V){ sx += Math.cos(th[j]); sy += Math.sin(th[j]); }
    S.r = V.length ? Math.hypot(sx, sy) / nv : 0; S.psi = Math.atan2(sy, sx);
    if(V.length === 1) S.r = 0.3;
    S.rb += (S.r - S.rb) * (1 - Math.exp(-dt / 0.5));
    S.hold += (S.holdT - S.hold) * (1 - Math.exp(-dt / 0.3));
    S.lk += ((S.locked ? sstep(0, 0.6, S.clock - S.lockT) : 0) - S.lk) * (1 - Math.exp(-dt / 0.5));
    S.C = sstep(0.42, 0.96, S.rb) * sstep(0, 0.3, S.cNow + S.hold + (S.locked ? 1 : 0));
    if(S.locked && S.rb < 0.8 && !m.kristall.length){ S.locked = false; S.relock = true; }
    // Teilungswinkel als Feder
    const aT = this.zielWinkel(), ks = 260, ds = 2 * Math.sqrt(ks) * 0.5;
    S.aV += (ks * (aT - S.alpha) - ds * S.aV) * dt; S.alpha += S.aV * dt; this.curl = this.kruemmung();
    if(!S.frozen && S.locked && S.clock - S.lockT > 0.5) this.freeze();
    if(S.pairs === null && S.locked && S.clock >= S.pairsT) this.computePairs();
    if(!S.frozen) S.rot += dt * (this.RM ? 0.004 : 0.012);
    const q = Math.floor(S.clock * 12); if(q !== S.qI){ S.qI = q; S.qTh = th[1]; }
    if(S.hopP >= 0){ S.hopP += dt / 0.7; if(S.hopP >= 1){ S.hopP = -1; S.hopTm = 0; } }
    else { S.hopTm += dt * (1 - S.C); if(S.hopTm > 1.9 && S.arrive >= 1 && this.has[2] && !this.RM) S.hopP = 0; }
    const kS = 1 - Math.exp(-dt / 0.8);
    S.Rs += (Math.max(0.03, S.rhoTop) - S.Rs) * kS;
    S.yRim += (S.yTop - S.yRim) * kS;
    S.Sc += (this.memR() * 1.32 - S.Sc) * (1 - Math.exp(-dt / 1.2));
    S.phase += ((S.locked ? 1 : S.aufzug ? Math.min(m.phase, 0.06 + 0.9 * S.cNow) : m.phase) - S.phase) * (1 - Math.exp(-dt / 1.4));
    const HP = [0, 0, 0, 0];
    for(let i = 0; i < 5; i++){ this.headPos(i, HP); const b = this.TR[i], k = S.trH * 3; b[k] = HP[0]; b[k + 1] = HP[1]; b[k + 2] = HP[2]; }
    S.trH = (S.trH + 1) % TRC; S.trN = Math.min(TRC, S.trN + 1);
    for(let w = S.waves.length - 1; w >= 0; w--){ const wv = S.waves[w]; wv.r += wv.speed * dt; if(wv.r > 1.6) S.waves.splice(w, 1); }
    for(let f = S.flights.length - 1; f >= 0; f--){ const fl = S.flights[f]; fl.t += dt / fl.dur; if(fl.t >= 1){ S.flights.splice(f, 1); fl.land && fl.land(); } }
  }

  /* Eine Ausprägung wird geboren: ihre Körner fliegen vom Kopf ihrer Stimme in ihre Lücken */
  geboren(i, ff){
    const S = this.S, s = this.m.samen[i], HP = [0, 0, 0, 0], O = this.origin;
    if(typeof s.stimme === 'number') this.headPos(s.stimme, HP);
    else { const a = hash(i * 9.1) * TAU, R = Math.max(0.6, this.orbitR() * 2.2); HP[0] = O[0] + Math.cos(a) * R; HP[1] = O[1] + S.yRim + 0.5; HP[2] = O[2] + Math.sin(a) * R; }
    const c = this.seedCount[i], spread = ff ? 0 : 1.5;   // Speichen wachsen sichtbar, mehrere zugleich
    for(let j = 0; j < c; j++){ const g = this.seedFirst[i] + j;
      this.gBorn[g] = S.clock + (ff ? -1 : spread * j / c); this.gFrom[g * 3] = HP[0]; this.gFrom[g * 3 + 1] = HP[1]; this.gFrom[g * 3 + 2] = HP[2]; this.einKorn(g); }
    if(!ff && typeof s.stimme === 'number') this.au && this.au.seed(s.stimme, S.locked);
    if(!ff && typeof s.stimme !== 'number') S.waves.push({r: 0, speed: 0.9, col: farbeVon(s.stimme)});
  }

  /* Aufzug überspringen: sofort der heutige Stand */
  sofort(){ const S = this.S; if(!S.aufzug) return; while(S.nextSeed < this.m.samen.length) this.geboren(S.nextSeed++, true);
    for(let g = 0; g < this.G; g++) if(this.gBorn[g] > S.clock - 1) this.gBorn[g] = S.clock - 1;
    S.aufzug = false; S.cNow = this.m.kopplung; S.arrive = 1; S.Rs = Math.max(0.03, this.Rfinal); S.Sc = this.memR() * 1.32;
    if(this.m.kristall.length && !S.locked){ S.locked = true; S.lockT = S.clock - 5; S.lk = 1; this.freeze(); } }

  get winkelGrad(){ return this.S.alpha / DEG; }
}

/* ---------------------------------------------------------------- Bild */
const TMP = [0, 0, 0, 0], TMP2 = [0, 0, 0, 0];
export function baueZelle(Z, U, wall, rdt, vis){
  const S = Z.S, m = Z.m, C = S.C, cl = S.clock, Lk = S.lk, O = Z.origin;
  if(vis <= 0.002) return;
  const cx = CAM.P[0], cyy = CAM.P[1], cz = CAM.P[2], fogK = 0.9 / CAM.S, dT = CAM.dist;
  const fog = (x, y, z) => { const d = Math.sqrt((x - cx) ** 2 + (y - cyy) ** 2 + (z - cz) ** 2) - dT; return d > 0 ? Math.exp(-d * fogK) : 1; };
  const soloAny = U.solo >= 0 ? 1 : 0, focus = U.solo;
  for(let i = 0; i < 5; i++){ const tgt = U.solo >= 0 ? (U.solo === i ? 1.35 : 0.1) : 1; U.soloA[i] += (tgt - U.soloA[i]) * (1 - Math.exp(-rdt * 6)); }
  const breathW = Math.sin(TAU * wall / 4.236);
  const run = !U.paused && S.still <= 0;
  const sel = U.sel, selSeed = sel && sel.zelle === Z && sel.art === 'same' ? sel.i : -1;
  const tilt = U.kelchK;   // 0 oben, 1 Seite
  const tiltDim = mix(1, 0.35, tilt);

  // Schwebestaub: warmweiß, nicht golden; Gold bleibt Ralfs Kristallisieren
  const dR = Z.memR() * 0.92, dcy = O[1] + S.yRim * 0.5;
  for(let i = 0; i < DN; i++){ const u = DS[i * 3] / 3, v = (DS[i * 3 + 1] - 0.6) / 2, w = DS[i * 3 + 2] / 3, l = Math.hypot(u, v, w); if(l > 1) continue;
    const x = O[0] + u * dR + Math.sin(wall * 0.11 + i) * 0.02, y = dcy + v * dR + Math.sin(wall * 0.13 + i * 1.7) * 0.02, z = O[2] + w * dR + Math.cos(wall * 0.09 + i * 0.3) * 0.02;
    P(x, y, z, 0.004 + 0.005 * S.Rs, WG[0], WG[1], WG[2], 0.07 * vis * (0.4 + 0.6 * hash(i))); }

  // Keim: Ausgangsfrage. Kristallisierter Keim leuchtet weißgold, offener warm und atmend.
  const kb = Z.RM ? 0.85 : (0.65 + 0.35 * Math.sin(TAU * 0.8 * wall));
  const keimSel = sel && sel.zelle === Z && sel.art === 'keim';
  const kc = m.keimKristall ? mixc(KEIMC, GOLDC, 0.25) : KEIMC;
  if(m.keim.length) P(O[0], O[1], O[2], 0.019 * Math.max(1, S.Rs * 2.2), kc[0], kc[1], kc[2], 2.2 * kb * vis * (keimSel ? 1.8 : 1) * (soloAny ? 0.5 : 1));
  if(m.keimKristall) screenRingWorld([O[0], O[1], O[2]], 0.02 * Math.max(1, S.Rs * 2.2), GOLDC, 0.35 * vis * (0.7 + 0.3 * breathW));

  // Hülle: Fibonacci-Kugel; die Mondphase zeigt die Reife
  {
    const Rm = Z.memR() * (1 + 0.015 * breathW), mcy = O[1] + S.yRim * 0.5;
    const memA = clamp(S.clock / 2.2 + (S.aufzug ? 0 : 1), 0, 1) * vis;
    const light = [];
    for(let i = 0; i < 5; i++){ Z.headPos(i, TMP); const dx = TMP[0] - O[0], dy = TMP[1] - mcy, dz = TMP[2] - O[2], l = Math.hypot(dx, dy, dz) || 1; light.push([dx / l, dy / l, dz / l, TMP[3]]); }
    let Lx = Math.cos(S.psi), Ly = 0.3, Lz = Math.sin(S.psi); const Ll = Math.hypot(Lx, Ly, Lz); Lx /= Ll; Ly /= Ll; Lz /= Ll;
    const ph = Math.max(S.phase, Lk), cph = Math.cos(Math.PI * ph);
    const tint = (1 - Lk) * (Z.traum ? 0 : 1);
    let pw = null; if(wall - U.pwT < 2.5 && !U.reading) pw = U.pointerWorldAt(CAM.target);
    const psz = 0.0065 * Math.max(0.6, Rm);
    // Die Hülle schmiegt sich an den Wuchs: wo Ranken weit hinausreichen, wölbt sie sich; eingerastet wird sie rund
    const formK = (Z.traum ? 0.35 : 0.6) * (1 - 0.85 * Math.max(Lk, Z.traum ? 0 : Math.max(Z.spiralK, Z.kelchK))), H = Z.huelle;
    for(let k = 0; k < MEM.length / 3; k++){
      const ux0 = MEM[k * 3], uy = MEM[k * 3 + 1], uz0 = MEM[k * 3 + 2];
      const hb = ((Math.atan2(uz0, ux0) / TAU + 1) * HB) % HB, h0 = Math.floor(hb), hf = hb - h0, hv = mix(H[h0], H[(h0 + 1) % HB], hf);
      const sf = mix(1, 0.66 + 0.4 * hv, formK), ux = ux0 * sf, uz = uz0 * sf;
      let R = Rm;
      if(pw){ const px = O[0] + ux * Rm - pw[0], py = mcy + uy * Rm - pw[1], pz = O[2] + uz * Rm - pw[2]; R *= 1 + 0.045 * Math.exp(-(px * px + py * py + pz * pz) / (0.25 * Rm * Rm)); }
      const x = O[0] + ux * R, y = mcy + uy * R, z = O[2] + uz * R;
      const vx = cx - x, vy = cyy - y, vz = cz - z, vl = Math.hypot(vx, vy, vz) || 1;
      const fres = Math.pow(1 - Math.abs((ux * vx + uy * vy + uz * vz) / vl), 4.0);
      const lit = sstep(-0.12, 0.12, (ux * Lx + uy * Ly + uz * Lz) - cph);
      let r = WG[0] * (0.35 + 0.65 * Lk), g = WG[1] * (0.35 + 0.65 * Lk), b = WG[2] * (0.35 + 0.65 * Lk);
      if(tint > 0) for(const i of Z.voices){ const Lg = light[i]; const d = ux * Lg[0] + uy * Lg[1] + uz * Lg[2]; if(d <= 0.3) continue;
        const s = Math.pow((d - 0.3) / 0.7, 3) * tint * Lg[3] * U.soloA[i] * 1.2; const c = VOICES[i].c; r += c[0] * s; g += c[1] * s; b += c[2] * s; }
      const ir = 0.5 + 0.5 * Math.cos(TAU * (fres * 0.7 + 0.55)), ig = 0.5 + 0.5 * Math.cos(TAU * (fres * 0.7 + 0.75)), ib = 0.5 + 0.5 * Math.cos(TAU * (fres * 0.7 + 0.95));
      const lum = ((0.003 + fres) * (mix(0.05, 0.3, ph) + 0.7 * lit) * tiltDim) * memA * (1 + 0.3 * Lk);   // Neumond dunkel, Vollmond hell
      P(x, y, z, psz, (r * 0.85 + ir * 0.07) * lum, (g * 0.85 + ig * 0.07) * lum, (b * 0.85 + ib * 0.08) * lum, 0.7);
      const skin = (0.0045 * lit * (0.25 + 0.75 * Lk) + 0.003 * fres * mix(0.3, 1, ph)) * tiltDim * memA * (S.frozen ? 0.25 : 1);
      if(skin > 0.0004 && (k & 1) === 0) P(x, y, z, 0.26 * Math.max(0.6, Rm), r * skin, g * skin, b * skin, 1);
    }
  }

  // Körner
  const wavR = (cl - S.lockT) / 1.5 * S.Rs, wavOn = cl - S.lockT < 3.2;
  const selFirst = selSeed >= 0 ? Z.seedFirst[selSeed] : -1, selEnd = selSeed >= 0 ? selFirst + Z.seedCount[selSeed] : -1;
  const hov = U.hover && U.hover.zelle === Z && U.hover.art === 'same' ? U.hover.i : -1;
  const linked = U.linkedSeeds;
  if(Z.wahl.i !== selSeed){   // Abstammungslicht: nur über belegte Abstammung, nie entlang einer Übernahmereihe
    const pf = []; if(selSeed >= 0) for(let k = selSeed; k >= 0; k = Z.W.eltern[k]){ pf.push(k); if(Z.W.art[k] === 'reihe') break; }
    const nf = selSeed >= 0 ? nachkommen(Z.W, selSeed).filter(k => Z.W.art[k] !== 'reihe') : null;
    Z.wahl = {i: selSeed, pfad: selSeed >= 0 ? new Set(pf) : null, nach: nf ? new Set(nf) : null}; }
  const pfad = Z.wahl.pfad, nach = Z.wahl.nach, HN = Z.huelleN; HN.fill(0);
  for(let g = 0; g < Z.G; g++){
    Z.gSicht[g] = 0;
    const born = Z.gBorn[g]; if(born === -1) continue;
    const age = born <= -5 ? 99 : cl - born; if(age < 0) continue;
    Z.kornPos(g, TMP);
    { const dx = TMP[0] - O[0], dz = TMP[2] - O[2], b = Math.floor(((Math.atan2(dz, dx) / TAU + 1) * HB)) % HB, r = Math.hypot(dx, dz); if(r > HN[b]) HN[b] = r; }
    const si = Z.gSeed[g], s = m.samen[si];
    let x = TMP[0], y = TMP[1], z = TMP[2], sz = s.stimme === MENSCH && !s.form ? 0.017 : 0.0125;
    if(age < 0.6){ const f = age / 0.6, e = 1 - (1 - f) ** 3; x = mix(Z.gFrom[g * 3], x, e); y = mix(Z.gFrom[g * 3 + 1], y, e) + Math.sin(Math.PI * f) * 0.02; z = mix(Z.gFrom[g * 3 + 2], z, e); sz *= 1.5; }
    const rho = Z.gRho[g];
    let bri = 0.8 * (Z.RM ? 0.93 : 0.86 + 0.14 * Math.sin(TAU * 0.42 * cl - rho * 7)) * Z.seedLuz[si] * (s.form ? 0.7 : Z.traum ? 1 - 0.75 * sstep(0.55, 1.02, rho / Math.max(0.05, Z.Rfinal)) : mix(0.8, 1.15, Z.seedJung[si]));
    if(Z.seedJung[si] === 1 && !s.form) sz *= g === Z.seedCore[si] ? 1.3 : 1.08;   // die jüngste Ausprägung jeder Stimme: ihre Wachstumsspitze, nur das Kernkorn deutlich; eine Form hat keine
    // Was trotz flächentreuer Breite dicht liegt (ein Blatt am Rand eines schmalen Fächers), wird feiner und leiser, statt auszubrennen
    const dk = Z.traum ? mix(Z.seedDicht[si], Z.seedDichtK[si], Z.kelchK) : mix(Z.seedDicht[si], 1, Math.max(Z.spiralK, Z.kelchK)); if(dk > 1){ sz *= Math.pow(dk, -0.2); bri *= Math.pow(dk, -0.35); }
    let cr = Z.gCol[g * 3], cg = Z.gCol[g * 3 + 1], cb = Z.gCol[g * 3 + 2];
    if(wavOn && S.lockedOnce){ const dw = (rho - wavR) / 0.05, gw = Math.exp(-dw * dw); bri *= 1 + 2.6 * gw; cr = mix(cr, GOLDC[0], 0.5 * gw); cg = mix(cg, GOLDC[1], 0.5 * gw); cb = mix(cb, GOLDC[2], 0.5 * gw); }
    for(const wv of S.waves){ const dn = (rho - wv.r * Math.max(0.1, S.Rs)) / 0.04; bri *= 1 + 1.2 * Math.exp(-dn * dn); }
    const v = s.stimme;
    if(typeof v === 'number'){ bri *= U.soloA[v]; if(focus === v){ const c = VOICES[v].c; cr = mix(cr, c[0], 0.6); cg = mix(cg, c[1], 0.6); cb = mix(cb, c[2], 0.6); } }
    else bri *= soloAny ? 0.3 : 1;
    if(selSeed >= 0){ if(g >= selFirst && g < selEnd){ bri *= 2.1; const c = stimmFarbe(v); cr = mix(cr, c[0], 0.5); cg = mix(cg, c[1], 0.5); cb = mix(cb, c[2], 0.5); sz *= 1.25; }
      else if(pfad && pfad.has(si)) bri *= 1.45; else if(nach && nach.has(si)) bri *= 1.1; else if(linked && linked.has(si)) bri *= 1.25; else bri *= 0.5; }
    else if(hov === si) bri *= 1.7;
    bri *= fog(x, y, z) * vis;
    P(x, y, z, sz, cr, cg, cb, bri);
    Z.gP[g * 3] = x; Z.gP[g * 3 + 1] = y; Z.gP[g * 3 + 2] = z; Z.gSicht[g] = 1;
    if(run && age < 0.6 && age + rdt >= 0.6 && age > 0.55) spark(x, y, z, 0, 0.02, 0, 0.35, [cr, cg, cb], 0.03);
  }

  huelleGlaetten(Z, rdt);
  baueWuchs(Z, U, vis, fog, selSeed, wall);

  // Form-Körner tragen einen silbernen Rand
  if(Z.formKoerner === undefined) Z.formKoerner = m.samen.map((s, i) => s.form ? i : -1).filter(i => i >= 0);
  for(const si of Z.formKoerner){ if(Z.gBorn[Z.seedCore[si]] === -1 || cl - Z.gBorn[Z.seedCore[si]] < 0.6) continue; Z.seedPos(si, TMP);
    screenRing(TMP, 0.022 * CAM.S, SILVER, 0.5 * vis * fog(TMP[0], TMP[1], TMP[2]) * (selSeed >= 0 && selSeed !== si ? 0.5 : 1)); }
  // Die letzten Einträge tragen einen leisen Ring in ihrer Farbe
  for(const si of (Z.zuletztIdx || [])){ const g0 = Z.seedCore[si]; if(Z.gBorn[g0] === -1 || cl - Z.gBorn[g0] < 0.6) continue; Z.seedPos(si, TMP);
    const c = stimmFarbe(m.samen[si].stimme); screenRing(TMP, 0.03 * CAM.S, c, 0.3 * vis * fog(TMP[0], TMP[1], TMP[2]) * (selSeed >= 0 && selSeed !== si ? 0.5 : 1)); }
  // Silo-Mond: die Speichen der Stimmen, die hier nichts beigetragen haben, als Hauch (die Lücke ist ehrlich)
  if(!Z.traum && Z.voices.length && Z.voices.length < 5 && Math.abs(S.alpha - SPOKE) < 0.6 * DEG && !S.lockedOnce){
    const R = Math.max(0.05, S.Rs);
    for(let L = 0; L < 5; L++){ if(Z.has[L]) continue; const phi = L * SPOKE + S.rot, c = VOICES[L].c;
      for(let s2 = 1; s2 <= 24; s2++){ const f = s2 / 24; P(O[0] + Math.cos(phi) * R * f, O[1] + S.yRim * f, O[2] + Math.sin(phi) * R * f, 0.006, c[0], c[1], c[2], 0.05 * vis * (1 - tilt)); } } }
  // Parastichien: zwei Spiralscharen beim Einrasten
  if(S.pairs){
    const pr = S.pairs, A = [0, 0, 0], B = [0, 0, 0], tl = cl - S.lockT, ruhig = S.frozen ? 0.09 * (1 - tilt) : 0;   // eingerastet: die Scharen bleiben zart sichtbar
    for(let k = 0; k < pr.length; k += 2){ const n = pr[k], mm = pr[k + 1];
      const rho = Z.gRho[n], reach = (tl - 0.55) - rho / Math.max(0.05, S.Rs) * 1.5;
      const a = Math.max(ruhig, reach < 0 ? 0 : Math.exp(-reach * 1.3) * 0.5 * (1 - sstep(4, 7, tl))); if(a < 0.01) continue;
      Z.kornPos(n, A); Z.kornPos(mm, B);
      const r = mix((Z.gCol[n * 3] + Z.gCol[mm * 3]) * 0.6, GOLDC[0], 0.3), g = mix((Z.gCol[n * 3 + 1] + Z.gCol[mm * 3 + 1]) * 0.6, GOLDC[1], 0.3), b = mix((Z.gCol[n * 3 + 2] + Z.gCol[mm * 3 + 2]) * 0.6, GOLDC[2], 0.3);
      for(let s = 1; s < 6; s++){ const f = s / 6; P(mix(A[0], B[0], f), mix(A[1], B[1], f), mix(A[2], B[2], f), 0.008, r, g, b, a * vis); } }
  }

  // Goldener Jahresring: auf der Höhe jeder kristallisierten Ausprägung
  for(const k of m.kristall){ const i = m.samen.indexOf(k); if(i < 0) continue; const y = O[1] + Z.seedY[i], R = Z.gRho[Z.seedFirst[i] + Z.seedCount[i] - 1] * 1.04;
    const a = 0.22 * vis * (0.3 + 0.7 * tilt) * (S.locked ? 1 : 0.3);
    for(let j = 0; j < 140; j++){ const an = j / 140 * TAU; P(O[0] + Math.cos(an) * R, y, O[2] + Math.sin(an) * R, 0.005, GOLDC[0], GOLDC[1], GOLDC[2], a); } }
  // Tagesringe: neutrale Schichten auf der Höhe der Tagesmarken, nur von der Seite; unten das Älteste, oben das Jüngste
  if(tilt > 0.01) for(const t of Z.tage){ const R = Z.gRzeit[Z.seedFirst[t.i]] * 1.06 + 0.01; if(R < 0.03) continue;
    const y = O[1] + t.y, k = Math.round(clamp(R * 320, 24, 140)), a = 0.06 * vis * tilt * fog(O[0], y, O[2]);
    for(let j = 0; j < k; j++){ const an = j / k * TAU; P(O[0] + Math.cos(an) * R, y, O[2] + Math.sin(an) * R, 0.004, SILVER[0], SILVER[1], SILVER[2], a); } }

  // Fäden: Kanten mit Verwendung; Lichtqualität aus dem Befund
  baueFaeden(Z, U, vis, fog, selSeed);

  // Stimmen: Köpfe und Spuren mit eigener Bewegungsschrift; von der Seite treten sie zurück, damit die Geschichte vorn steht
  const lens = [1.2, 1.0, 0.65, 1.6, 1.8], kopfK = 1 - 0.7 * tilt;
  for(const i of Z.voices){
    Z.headPos(i, TMP); const e = TMP[3]; if(e <= 0){ U.heads[i][2] = -1; continue; }
    const sa = U.soloA[i] * vis * e * kopfK, col = VOICES[i].c, w = VOICES[i].w;
    const cc = mixc(col, WG, 0.25 * Lk);
    const hs = toScreen(TMP[0], TMP[1], TMP[2]); U.heads[i][0] = hs[0]; U.heads[i][1] = hs[1]; U.heads[i][2] = hs[2] * (vis > 0.3 ? 1 : -1);
    const bt = U.betont && U.betont.includes(i) ? (Z.RM ? 1.6 : 1 + 0.9 * (0.5 + 0.5 * Math.sin(wall * 4))) : 1;   // genannte Stimme leuchtet auf
    P(TMP[0], TMP[1], TMP[2], 0.05 * Math.max(0.5, Z.orbitR()) * (bt > 1 ? 1.3 : 1), cc[0], cc[1], cc[2], 2.6 * sa * w * bt);
    P(TMP[0], TMP[1], TMP[2], 0.014 * Math.max(1, Z.orbitR() * 2), 1, 0.97, 0.9, 3.0 * sa);
    const len = Math.min(S.trN - 1, Math.round(mix(lens[i], 0.8, Lk) * 120 * kopfK)), b = Z.TR[i];
    const stac = i === 1 && C < 0.6, smoke = i === 3, thick = i === 0 ? 1.5 : i === 4 ? 1.15 : 1;
    for(let k = 0; k < len; k++){
      const ia = ((S.trH - 1 - k) % TRC + TRC) % TRC, ib = ((S.trH - 2 - k) % TRC + TRC) % TRC;
      const ax = b[ia * 3], ay = b[ia * 3 + 1], az = b[ia * 3 + 2], bx = b[ib * 3], by = b[ib * 3 + 1], bz = b[ib * 3 + 2];
      const age = k / len, fade = Math.pow(1 - age, 1.6) * sa * w;
      if(stac){ if(Math.abs(ax - bx) + Math.abs(az - bz) < 1e-6) continue; P(ax, ay, az, 0.012 * Math.max(1, Z.orbitR() * 1.5), cc[0], cc[1], cc[2], fade * 0.9); continue; }
      for(let s = 0; s < 3; s++){ const f = s / 3; let x = mix(ax, bx, f), y = mix(ay, by, f), z = mix(az, bz, f);
        if(smoke){ const lift = age * age * 0.22 * Z.orbitR() * (1 - C * 0.8); y += lift; x += Math.sin(k * 0.08 + wall * 1.3) * lift * 0.25; z += Math.cos(k * 0.07 + wall) * lift * 0.25; }
        const sz = mix(0.013, 0.003, age) * thick * Math.max(0.6, Z.orbitR());
        P(x, y, z, sz, cc[0], cc[1], cc[2], fade * 0.55 * fog(x, y, z)); }
    }
    if(S.hold > 0.03 && S.holdP){ const hp = S.holdP; for(let s = 1; s < 30; s++){ const f = s / 30, wob = Math.sin(f * Math.PI) * 0.03 * Math.sin(wall * 6 + i);
      P(mix(hp[0], TMP[0], f) + wob, mix(hp[1], TMP[1], f), mix(hp[2], TMP[2], f) - wob, 0.01, col[0], col[1], col[2], 0.8 * S.hold * U.soloA[i] * (0.3 + 0.7 * f) * vis); } }
  }
  for(let i = 0; i < 5; i++) if(!Z.has[i]) U.heads[i][2] = -1;
  // Funken an Kreuzungen
  if(C < 0.55 && run && vis > 0.5 && !Z.RM){ const spRate = 1 - Math.exp(-rdt * 30);
    for(const i of Z.voices) for(const j of Z.voices){ if(j <= i) continue; Z.headPos(i, TMP); const ax = TMP[0], ay = TMP[1], az = TMP[2]; Z.headPos(j, TMP2);
      const d = Math.hypot(ax - TMP2[0], ay - TMP2[1], az - TMP2[2]);
      if(d < 0.035 * Math.max(0.5, Z.orbitR() / 0.3) && Math.random() < spRate){ burst((ax + TMP2[0]) / 2, (ay + TMP2[1]) / 2, (az + TMP2[2]) / 2, mixc(VOICES[i].c, VOICES[j].c, 0.5), 3, 0.12, 0.45, 0.008); } } }

  // Flüge: Einwurf
  for(const fl of S.flights){ const f = fl.t, e = f * f * (3 - 2 * f), arc = Math.sin(Math.PI * f) * 0.08 * Math.max(1, S.Rs * 2);
    const x = mix(fl.x, fl.tx, e), y = mix(fl.y, fl.ty, e) + arc, z = mix(fl.z, fl.tz, e);
    P(x, y, z, 0.03 * Math.max(1, S.Rs * 2), fl.col[0], fl.col[1], fl.col[2], 2.4);
    if(run){ fl.sa = (fl.sa || 0) + rdt * 60; while(fl.sa >= 1){ fl.sa -= 1; spark(x, y, z, 0, 0, 0, 0.5, fl.col, 0.012); } } }
}

function screenRingWorld(c, rad, col, a){ screenRing(c, rad, col, a); }

/* Hülle: der äußerste Wuchs je Richtung, weich über die Nachbarn und über die Zeit */
function huelleGlaetten(Z, rdt){
  const HN = Z.huelleN, H = Z.huelle; let mx = 0; for(let b = 0; b < HB; b++) mx = Math.max(mx, HN[b]); if(mx <= 0) return;
  const k = 1 - Math.exp(-(rdt || 0.016) / 0.6);
  for(let b = 0; b < HB; b++){ let s = 0, w = 0; for(let d = -4; d <= 4; d++){ const ww = Math.exp(-d * d / 6); s += HN[(b + d + HB) % HB] * ww; w += ww; }
    const ziel = Math.max(s / w, HN[b] * 0.9) / mx; H[b] += (ziel - H[b]) * k; }
}

/* Der Wuchs als Licht: Stiele entlang der Ranken, Gelenke an Gabeln, Fächer, und die Gegenlese als Gewebe.
   Abstammung (Stiel), Urheberschaft (Farbe), Werkbeziehung (Fäden) und Entscheidung (Gold) bleiben getrennte Zeichen. */
const STIELC = lin('#cfc6b4');
function baueWuchs(Z, U, vis, fog, selSeed, wall){
  const m = Z.m, W = Z.W, gP = Z.gP, sicht = Z.gSicht, O = Z.origin, n = m.samen.length; if(!n || vis < 0.01) return;
  const pfad = Z.wahl.pfad, tilt = U.kelchK, lockDim = 1 - 0.8 * Math.max(Z.S.lk, Z.traum ? 0 : Z.spiralK), soloAny = U.solo >= 0, stielK = 1 - 0.8 * tilt;   // von der Seite treten die Stiele zurück
  const A = [0, 0, 0], Bq = [0, 0, 0];
  const strich = (a, b, sz, c, al, punkte, lift) => { const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), k = Math.max(2, Math.min(punkte, Math.round(d * 160)));
    for(let s = 1; s < k; s++){ const t = s / k, x = mix(a[0], b[0], t), y = mix(a[1], b[1], t) + (lift ? Math.sin(Math.PI * t) * lift : 0), z = mix(a[2], b[2], t); P(x, y, z, sz, c[0], c[1], c[2], al * fog(x, y, z)); } };
  const lage = (g, o) => { o[0] = gP[g * 3]; o[1] = gP[g * 3 + 1]; o[2] = gP[g * 3 + 2]; return o; };
  // Mitten der Blütenstände, einmal je Bild
  if(!Z.mP || Z.mP.length !== n * 3) Z.mP = new Float32Array(n * 3);
  const mP = Z.mP, M = [0, 0, 0];
  for(let i = 0; i < n; i++){ Z.mittePos(i, M); mP[i * 3] = M[0]; mP[i * 3 + 1] = M[1]; mP[i * 3 + 2] = M[2]; }
  const mitte = (i, o) => { o[0] = mP[i * 3]; o[1] = mP[i * 3 + 1]; o[2] = mP[i * 3 + 2]; return o; };
  for(let i = 0; i < n; i++){
    if(!sicht[Z.seedCore[i]]) continue;
    const s = m.samen[i], st = s.stimme, art = W.art[i], auf = pfad && pfad.has(i) && art !== 'reihe', p = W.eltern[i];
    if(art === 'frei') continue;   // ohne belegte Herkunft: kein Stiel, ehrlich abgesetzt
    const farbe = s.form ? SILVER : typeof st === 'number' ? mixc(VOICES[st].c, STIELC, 0.45) : STIELC;
    if(p >= 0){ if(!sicht[Z.seedCore[p]]) continue; mitte(p, A); } else { A[0] = O[0]; A[1] = O[1]; A[2] = O[2]; }
    mitte(i, Bq);
    // Abstammung als Stiel; eine Übernahmereihe nur als zarte Punktfolge (Reihenfolge, keine Entwicklung)
    const basis = art === 'reihe' ? 0.045 : art === 'gabel' || art === 'form' ? 0.2 : 0.13;
    let al = (auf ? 0.55 : basis) * vis * lockDim * (auf ? 1 : stielK) * (soloAny ? (typeof st === 'number' && st === U.solo ? 1.5 : 0.25) : 1) * (selSeed >= 0 && !auf ? 0.45 : 1);
    if(al < 0.004) continue;
    strich(A, Bq, auf ? 0.0075 : art === 'reihe' ? 0.0028 : 0.0036, auf ? SILVER : farbe, al, art === 'reihe' ? 8 : Math.max(6, Math.min(40, Math.floor(6000 / n))), 0);
    // Gabel: ein kleiner Knoten, wo ein Zweig aus einer fremden Fassung fortgesetzt wurde
    if(art === 'gabel' && p >= 0) P(A[0], A[1], A[2], 0.012, farbe[0], farbe[1], farbe[2], 0.6 * vis * lockDim * stielK * (selSeed >= 0 && !auf ? 0.5 : 1));
  }
  // Gegenlese: gesehene Fassungen anderer Zweige, als feines Gewebe über der Scheibe
  for(const [i, j] of W.lese){
    if(!sicht[Z.seedCore[i]] || !sicht[Z.seedCore[j]]) continue;
    const an = selSeed >= 0 && (i === selSeed || j === selSeed), st = m.samen[i].stimme;
    let al = (an ? 0.3 : 0.035) * vis * lockDim * (selSeed >= 0 && !an ? 0.4 : 1);
    if(soloAny) al *= typeof st === 'number' && st === U.solo ? 2.2 : 0.2;
    if(al < 0.004) continue;
    const c = typeof st === 'number' ? mixc(VOICES[st].c, WG, 0.45) : WG;
    mitte(i, A); mitte(j, Bq); const d = Math.hypot(A[0] - Bq[0], A[2] - Bq[2]);
    strich(A, Bq, 0.0028, c, al, 36, d * mix(0.32, 0.12, tilt));
  }
}

/* Fäden zwischen Ausprägungen. Ein Befund einer Stimme färbt nie golden: „tragfähig“ ist hell silbern, die Stärke unterscheidet. */
const URTEILFARBE = {'tragfähig': SILVER, 'teilweise': WG, 'nicht-tragfähig': ASCHE};
function baueFaeden(Z, U, vis, fog, selSeed){
  const m = Z.m, A = [0, 0, 0, 0], B = [0, 0, 0, 0];
  if(!Z.fadenIndex){ const idx = new Map(m.samen.map((s, i) => [s.id, i])); const keim = new Set(m.keim.map(v => v.id));
    Z.fadenIndex = m.faeden.map(f => ({f, a: idx.has(f.von) ? idx.get(f.von) : keim.has(f.von) ? -2 : -1, b: idx.has(f.nach) ? idx.get(f.nach) : keim.has(f.nach) ? -2 : -1})); }
  for(const {f, a, b} of Z.fadenIndex){
    if(a === -1 || b === -1) continue;
    const bornA = a < 0 || Z.gBorn[Z.seedCore[a]] !== -1, bornB = b < 0 || Z.gBorn[Z.seedCore[b]] !== -1; if(!bornA || !bornB) continue;
    if(a >= 0) Z.seedPos(a, A); else Z.keimPos(A);
    if(b >= 0) Z.seedPos(b, B); else Z.keimPos(B);
    const on = selSeed >= 0 && (a === selSeed || b === selSeed);
    const base = f.form ? 0.14 : 0.05 + 0.45 * f.beleg, col = f.form ? SILVER : f.urteil ? URTEILFARBE[f.urteil] : mixc(WG, DUSTC, 0.4);
    let alpha = base * (selSeed >= 0 ? (on ? 2.6 : 0.25) : 1) * vis * (U.solo >= 0 ? 0.4 : 1);
    if(alpha < 0.008) continue;
    const brk = f.urteil === 'nicht-tragfähig' || f.typ === 'widerspricht';
    const d = Math.hypot(A[0] - B[0], A[2] - B[2]), n = Math.max(8, Math.min(48, Math.round(d * 90))), lift = d * 0.18;
    for(let s = 1; s < n; s++){ const t = s / n; if(brk && t > 0.42 && t < 0.58) continue;
      const x = mix(A[0], B[0], t), y = mix(A[1], B[1], t) + Math.sin(Math.PI * t) * lift, z = mix(A[2], B[2], t);
      P(x, y, z, f.beleg >= 1 ? 0.006 : 0.0045, col[0], col[1], col[2], alpha * fog(x, y, z)); }
  }
}
