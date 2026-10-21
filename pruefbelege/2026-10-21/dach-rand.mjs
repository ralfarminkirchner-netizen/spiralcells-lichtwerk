import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, CAM, L, toScreen} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
for(const [w, h] of [[1200, 800], [375, 812]]){ CAM.cssW = w; CAM.cssH = h;
  for(const dach of ['mitte', 0, 2]){ Object.assign(U, {netK: 1, netT: 1, dach, dachK: 1, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 20, netDir: 1, flug: null, sel: null, hover: null});
    const cam = regie(U, null, N, false); setCamera(cam, w, h); L.pc = 0; baueNetz(N, U, 3, 1, -1, 0);
    const z = N.bezirkZiel(dach); let ymin = 1e9, ymax = -1e9, xmin = 1e9, xmax = -1e9;
    for(let s = 0; s < 64; s++){ const t = s / 64 * Math.PI * 2, p = toScreen(z.mitte[0] + Math.cos(t) * z.R, 0, z.mitte[2] + Math.sin(t) * z.R); ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]); }
    // Werke des Bezirks: wie viele liegen in der unteren Zone (y > h-70), wo ihr Name nie stehen darf
    const werke = N.werkeIn(dach), unten = werke.filter(i => { const p = U.monde[i]; return p && p[1] > h - 70 - 20; }).length;
    console.log(`${w}x${h} ${dach}: Ring y ${ymin.toFixed(0)}..${ymax.toFixed(0)}, x ${xmin.toFixed(0)}..${xmax.toFixed(0)}; Werke ${werke.length}, davon in der unteren Namenssperrzone ${unten}`); } }
