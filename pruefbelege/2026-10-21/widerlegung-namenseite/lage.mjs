// Nachrechnung: Lage der FASKA-Werke und Bereichsanker im Dach, wie haupt.js/netz.js sie setzen (ohne WebGL)
import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const [w, h, scale, zeitArg] = process.argv.slice(2).map(Number);
globalThis.innerWidth = w; globalThis.innerHeight = h;
const {bestand} = await import(R + 'app/js/daten.js');
const {Netz, baueNetz} = await import(R + 'app/js/netz.js');
const {regie} = await import(R + 'app/js/regie.js');
const {setCamera, CAM, L} = await import(R + 'app/js/licht.js');
const {U} = await import(R + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8')));
CAM.cssW = w; CAM.cssH = h;
const dach = N.daecher.findIndex(d => d.name === 'FASKA');
function lauf(zeit){
  Object.assign(U, {netK: 1, netT: 1, dach, dachK: 1, dachZiel: null, kelchK: 0, kelchZeit: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: zeit, netDir: 1, flug: null, sel: null, hover: null, solo: -1,
    daecherSchirm: [], bereicheSchirm: [], monde: [], knoten: [], buendelKnoten: [], tueren: [], soloA: [1,1,1,1,1], bigHeads: []});
  const cam = regie(U, null, N, false); setCamera(cam, w, h); L.pc = 0; baueNetz(N, U, 3, 1, -1, 0);
  return cam;
}
const cam = lauf(zeitArg || 0);
const f = x => Math.round(x * scale);
console.log(`Bild ${w}x${h}, S=${CAM.S.toFixed(2)}, yaw=${cam.yaw.toFixed(3)}; Koordinaten mal ${scale}`);
for(const [k, b] of N.daecher[dach].bereiche.entries()){ const p = U.bereicheSchirm[k]; console.log(`Bereich ${b.name}: Anker (${f(p[0])},${f(p[1])})`); }
for(const i of N.werkeIn(dach)){ const p = U.monde[i], rp = Math.min(40, N.rM[i] / Math.max(0.01, CAM.S) * CAM.cssH * 0.35);
  console.log(`${B.monde[i].titel.padEnd(52)} Licht (${f(p[0])},${f(p[1])}) rM=${N.rM[i].toFixed(2)} rp=${rp.toFixed(1)} samen=${B.monde[i].samen.length}`); }
