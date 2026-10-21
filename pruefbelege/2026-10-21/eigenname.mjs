import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, CAM, L} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
for(const [w, h] of [[1280, 700], [1280, 720], [1280, 740], [1366, 700], [1440, 760], [1600, 760], [600, 400], [812, 375]]){ CAM.cssW = w; CAM.cssH = h; const zeile = [];
  for(const dach of ['mitte', 'ohne', ...N.daecher.map((_, j) => j)]){
    Object.assign(U, {netK: 1, netT: 1, dach, dachK: 1, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 20, netDir: 1, flug: null, sel: null, hover: null});
    const cam = regie(U, null, N, false); setCamera(cam, w, h); L.pc = 0; baueNetz(N, U, 3, 1, -1, 0);
    const p = dach === 'mitte' ? U.mitteSchirm : dach === 'ohne' ? U.ohneSchirm : U.daecherSchirm[dach]; const y0 = p ? p[1] - 30 : NaN;
    if(!(y0 >= 60)) zeile.push(`${dach === 'mitte' ? 'Zentrale' : dach === 'ohne' ? 'ohne Dach' : N.daecher[dach].name} y0=${Math.round(y0)}`); }
  console.log(`${w}x${h}: eigener Name schweigt in: ${zeile.join(', ') || '—'}`); }
