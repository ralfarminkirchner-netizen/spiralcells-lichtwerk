// Nur lesend: baut das FASKA-Dachbild nach (Punkte wie im Shader aufaddiert), getrennt nach Herkunft
import {readFileSync, writeFileSync} from 'node:fs';
const ver = process.argv[2] || 'neu', KETTE = process.argv[3] || 'kette-gewebe';
const VW = 800, VH = +(process.argv[4] || 600), DPR = 1;
globalThis.innerWidth = VW; globalThis.innerHeight = VH;
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const A = new URL('./' + ver + '/app/js/', import.meta.url).href;
const {bestand} = await import(A + 'daten.js');
const {L, CAM, setCamera, toScreen, PD, STR, xf} = await import(A + 'licht.js');
const {Netz, baueNetz} = await import(A + 'netz.js');
const {Zelle} = await import(A + 'zelle.js');
const {regie} = await import(A + 'regie.js');
const {U, W} = await import(A + 'welt.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${KETTE}/state.json`, 'utf8')));
const O = JSON.parse(readFileSync(new URL('./' + ver + '/app/ordnung.json', import.meta.url), 'utf8'));
const N = new Netz(B, O);
CAM.cssW = VW; CAM.cssH = VH;
const j = N.daecher.findIndex(d => d.name === 'FASKA');
const aktiv = B.monde.findIndex(m => m.titel.startsWith('Zentrale'));
const Z = new Zelle(B.monde[aktiv], {origin: N.pos[aktiv], ohneAufzug: true});
W.RM = false; U.RM = false;
U.netK = 1; U.netT = 1; U.netDir = 1; U.dach = j; U.dachK = 1; U.dachZiel = N.bezirkZiel(j); U.kelchK = 0; U.sel = null; U.hover = null; U.solo = -1; U.netZeit = 10;
U.monde = U.monde || []; U.knoten = U.knoten || []; U.buendelKnoten = U.buendelKnoten || []; U.daecherSchirm = U.daecherSchirm || [];
for(let i = 0; i < 30; i++){ const cam = regie(U, Z, N, false); setCamera(cam, VW * DPR, VH * DPR); }
L.pc = 0; baueNetz(N, U, 12.3, 1, aktiv, 0);
// Herkunft: Werkpunkte (pts) und Stiele je Werk an exakter Weltlage erkennen
const key = (x, y, z) => `${Math.fround(x)},${Math.fround(y)},${Math.fround(z)}`, tag = new Map();
for(let n = 0; n < N.N; n++){ const o = N.pos[n], p = N.mini[n].pts, s = N.mini[n].stiel;
  for(let q = 0; q < p.length / 6; q++) tag.set(key(o[0] + p[q * 6], o[1] + p[q * 6 + 1], o[2] + p[q * 6 + 2]), 'pts:' + n);
  for(let q = 0; q < s.length / 6; q++) tag.set(key(o[0] + s[q * 6], o[1] + s[q * 6 + 1], o[2] + s[q * 6 + 2]), 'stiel:' + n); }
const H = VH, uPx = H * DPR * 0.5 / Math.tan(CAM.fov / 2), uMin = 1.6 * DPR, uMax = 384;
const bild = new Map(); const get = t => { if(!bild.has(t)) bild.set(t, new Float32Array(VW * VH)); return bild.get(t); };
const alle = get('alle');
for(let i = 0; i < L.pc; i++){ const b = i * STR, x = PD[b], y = PD[b + 1], z = PD[b + 2], s = PD[b + 3], a = PD[b + 7];
  const c = xf(CAM.VP, x, y, z); if(c[3] <= 0) continue; const sx = (c[0] * 0.5 + 0.5) * VW, sy = (0.5 - c[1] * 0.5) * VH;
  const px = s * uPx / Math.max(c[3], 1e-4), sz = Math.min(uMax, Math.max(uMin, px)), e = Math.min(px * px / (sz * sz), 1);
  const lum = (0.2126 * PD[b + 4] + 0.7152 * PD[b + 5] + 0.0722 * PD[b + 6]) * a * e, rad = sz / 2;
  const t = tag.get(key(x, y, z)) || 'sonst', img = get(t.startsWith('pts:') || t.startsWith('stiel:') ? t.split(':')[0] + ':' + B.monde[+t.split(':')[1]].titel.slice(0, 26) : 'sonst');
  const x0 = Math.floor(sx - rad), x1 = Math.ceil(sx + rad), y0 = Math.floor(sy - rad), y1 = Math.ceil(sy + rad);
  for(let yy = Math.max(0, y0); yy <= Math.min(VH - 1, y1); yy++) for(let xx = Math.max(0, x0); xx <= Math.min(VW - 1, x1); xx++){
    const dx = (xx + 0.5 - sx) / rad, dy = (yy + 0.5 - sy) / rad, r2 = dx * dx + dy * dy; if(r2 > 1) continue;
    const k = Math.exp(-r2 * 7) + Math.exp(-r2 * 2.3) * 0.26, v = lum * k; img[yy * VW + xx] += v; if(img !== alle) alle[yy * VW + xx] += v; } }
const aces = x => Math.min(1, Math.max(0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)));
const box = (img, x0, y0, x1, y1) => { let mx = 0, at = null; for(let y = y0; y < y1; y++) for(let x = x0; x < x1; x++){ const v = img[y * VW + x]; if(v > mx){ mx = v; at = [x, y]; } } return [mx, at]; };
console.log(ver, KETTE, 'Punkte', L.pc, 'fov', CAM.fov.toFixed(3));
const boxes = process.argv[5] ? JSON.parse(process.argv[5]) : {};
// höchste Szenenwerte je Herkunft im ganzen Bild
const rows = [...bild].map(([t, img]) => { const [mx, at] = box(img, 0, 0, VW, VH); return [t, mx, at]; }).sort((p, q) => q[1] - p[1]).slice(0, 14);
for(const [t, mx, at] of rows) console.log(t.padEnd(40), 'Spitze', mx.toFixed(2), 'bei', at && at.join(','), '→ Bildwert ca.', Math.round(255 * Math.pow(aces(mx * 1.05), 1 / 2.2)));
// Wer trägt am hellsten Punkt jeder Gestalt bei?
const [mxA, atA] = box(alle, 0, 0, VW, VH); 
const beitrag = at => [...bild].filter(([t]) => t !== 'alle').map(([t, img]) => [t, img[at[1] * VW + at[0]]]).filter(x => x[1] > 0.01).sort((p, q) => q[1] - p[1]).slice(0, 4).map(([t, v]) => `${t} ${v.toFixed(2)}`).join(' | ');
for(const [name, b] of Object.entries(boxes)){ const [mx, at] = box(alle, ...b); console.log('Kasten', name, b.join(','), 'Spitze', mx.toFixed(2), 'bei', at && at.join(','), ':', at && beitrag(at)); }
// Bild als PGM (ACES wie im Compositing, ohne Glühen und Nebel)
const buf = Buffer.alloc(VW * VH); for(let i = 0; i < VW * VH; i++) buf[i] = Math.round(255 * Math.pow(aces(alle[i] * 1.05), 1 / 2.2));
writeFileSync(`sim-${ver}-${KETTE}.pgm`, Buffer.concat([Buffer.from(`P5\n${VW} ${VH}\n255\n`), buf]));
for(let n = 0; n < N.N; n++){ const t = B.monde[n].titel; if(/Vergleich|Jahreskreise|Eigenraum|invaria/.test(t) && N.bezirk(n) === j){ const s = toScreen(...N.pos[n]); console.log('Werkmitte', t.slice(0, 40), s[0].toFixed(0), s[1].toFixed(0)); } }
