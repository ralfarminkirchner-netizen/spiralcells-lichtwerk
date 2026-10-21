// Nachrechnung: regie() + setCamera() + baueNetz() wie im Lichtwerk, ohne WebGL.
// Misst je Bildgröße: CAM.S, Ausdehnung des Netzes auf dem Schirm, Punktgrößen (css px) und Dimmung durch uMin.
import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const kette = process.argv[2] || 'kette-gewebe';
const {bestand} = await import(R + 'app/js/daten.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + kette + '/state.json', 'utf8')));
const O = JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8'));
const {Netz, baueNetz} = await import(R + 'app/js/netz.js');
const {CAM, setCamera, PD, L, STR} = await import(R + 'app/js/licht.js');
const {regie} = await import(R + 'app/js/regie.js');
const N = new Netz(B, O);
const mkU = () => ({kelchK: 0, netK: 1, dachK: 0, dach: null, dachZiel: null, netDir: 1, netZeit: 0, kelchZeit: 0, elevOff: 0, yawOff: 0, px: 0, py: 0, zoom: 1, leseK: 0, lese: false, flug: null,
  hover: null, sel: null, solo: -1, RM: false, daecherSchirm: [], bereicheSchirm: [], monde: [], knoten: [], buendelKnoten: [], bigHeads: [], soloA: [1, 1, 1, 1, 1], tueren: []});
function lauf(U){ L.pc = 0; baueNetz(N, U, 10, 1, -1, 0); return L.pc; }
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
for(const [name, w, h, dpr] of [['Mac 800x600', 800, 600, 2], ['Mac 1440x900', 1440, 900, 2], ['Handy 375x812', 375, 812, 1.5], ['Handy 390x844', 390, 844, 1.5]]){
  CAM.cssW = w; CAM.cssH = h; const U = mkU();
  const cam = regie(U, null, N, false); setCamera(cam, w * dpr, h * dpr);
  // Bereiche im Punktpuffer bestimmen
  const total = lauf(U);
  const nN = N.N; N.N = 0; const vorWerke = lauf(U); N.N = nN;
  const bu = N.buendel; N.buendel = []; const ohneBu = lauf(U); N.buendel = bu;
  const tail = 4200 + 5 * 31 + N.tueren.length;
  const pre = vorWerke + ohneBu - total - tail;
  const werkEnde = ohneBu - tail, buEnde = total - tail;
  const vorW = pre;
  lauf(U);
  const uPx = h * dpr * 0.5 / Math.tan(cam.fov / 2), uMin = 1.6 * dpr;
  const info = (a, b) => { const sz = [], e = [], xs = [], ys = [];
    for(let i = a; i < b; i++){ const o = i * STR, x = PD[o], y = PD[o + 1], z = PD[o + 2], s = PD[o + 3];
      const m = CAM.VP, cw = m[3] * x + m[7] * y + m[11] * z + m[15]; const px = s * uPx / cw;
      sz.push(px / dpr); e.push(Math.min(px * px / (uMin * uMin), 1));
      const cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / cw, cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / cw; xs.push((cx * 0.5 + 0.5) * w); ys.push((0.5 - cy * 0.5) * h); }
    return {n: b - a, sz: q(sz, 0.5), szMax: Math.max(...sz), e: q(e, 0.5), ymin: q(ys, 0.01), ymax: q(ys, 0.99), xmin: q(xs, 0.01), xmax: q(xs, 0.99)}; };
  const wk = info(vorW, werkEnde), bd = info(werkEnde, buEnde);
  // nur Werkpunkte (Größe 0.17*max(0.7,rM)): Kleinste Punkte im Werkbereich, die keine Halos sind
  const wpSz = [], wpE = [];
  for(let i = vorW; i < werkEnde; i++){ const o = i * STR, s = PD[o + 3]; if(s > 0.5) continue; const m = CAM.VP, x = PD[o], y = PD[o + 1], z = PD[o + 2], cw = m[3] * x + m[7] * y + m[11] * z + m[15], px = s * uPx / cw; wpSz.push(px / dpr); wpE.push(Math.min(px * px / (uMin * uMin), 1)); }
  const bdLinie = [], bdE = [];
  const bz = Math.max(0.16, CAM.S * 0.006);
  for(let i = werkEnde; i < buEnde; i++){ const o = i * STR, s = PD[o + 3]; if(s > bz * 1.85 || Math.abs(s - 0.0035 * CAM.S) < 1e-6) continue; const m = CAM.VP, x = PD[o], y = PD[o + 1], z = PD[o + 2], cw = m[3] * x + m[7] * y + m[11] * z + m[15], px = s * uPx / cw; bdLinie.push(px / dpr); bdE.push(Math.min(px * px / (uMin * uMin), 1)); }
  const ringPx = 0.0035 * CAM.S * uPx / (cam.dist) / dpr;
  const f = x => x.toFixed(2);
  console.log(`\n${name}: S=${f(CAM.S)} yaw=${f(cam.yaw)} elev=${f(cam.pitch * 180 / Math.PI)}°`);
  console.log(`  Werke (alle Punkte) y ${f(wk.ymin)}..${f(wk.ymax)} = ${f((wk.ymax - wk.ymin) / h * 100)}% Höhe; x ${f(wk.xmin)}..${f(wk.xmax)} = ${f((wk.xmax - wk.xmin) / w * 100)}% Breite`);
  console.log(`  Werkpunkt css px Median ${f(q(wpSz, 0.5))} (Dimmung e Median ${f(q(wpE, 0.5))}), n=${wpSz.length}`);
  console.log(`  Bündellinie css px Median ${f(q(bdLinie, 0.5))} (e ${f(q(bdE, 0.5))}), n=${bdLinie.length}; Ringpunkt ~${f(ringPx)} px`);
  console.log(`  Verhältnis Bündellinie/Werkpunkt (sichtbar, mal e): ${f(q(bdLinie, 0.5) / q(wpSz, 0.5))}  Helligkeit Werkpunkt-Dimmung ${f(q(wpE, 0.5))} vs Bündel ${f(q(bdE, 0.5))}`);
  // Bündelknotenring: Radius dicke*2.4 in px
  console.log(`  Knotenring-Radius px (k=1..8): ${f(bz * 1.1 * 2.4 * uPx / cam.dist / dpr)} .. ${f(bz * 1.8 * 2.4 * uPx / cam.dist / dpr)}; Werkradius rM≈1.9 → ${f(1.9 * uPx / cam.dist / dpr)} px`);
}
