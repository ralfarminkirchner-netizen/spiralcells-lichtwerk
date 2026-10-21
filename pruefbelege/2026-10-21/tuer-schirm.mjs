import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, CAM, L} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
N.tueren = [{name: 'KiN OS', wach: true}, {name: 'Zentrale', wach: true}, {name: 'KiNFORMER', wach: true}, {name: 'KiN', wach: true}];
for(const [w, h] of [[1200, 800], [375, 812]]) for(const dach of [null, 'mitte']){ CAM.cssW = w; CAM.cssH = h;
  Object.assign(U, {netK: 1, netT: 1, dach, dachK: dach == null ? 0 : 1, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 20, netDir: 1, flug: null, sel: null, hover: null, tueren: []});
  const cam = regie(U, null, N, false); setCamera(cam, w, h); L.pc = 0; baueNetz(N, U, 3, 1, -1, 0);
  for(let i = 0; i < N.tueren.length; i++){ const t = U.tueren[i]; let best = null;
    U.monde.forEach((p, j) => { if(!p || N.bezirk(j) === 'mitte') return; const d = Math.hypot(p[0] - t[0], p[1] - t[1]); if(!best || d < best[0]) best = [d, j]; });
    if(best[0] < 40) console.log(`${w}x${h} ${dach ?? 'Überblick'}: Tür „${N.tueren[i].name}“ ${best[0].toFixed(0)} px neben „${B.monde[best[1]].titel}“ (${typeof N.bezirk(best[1]) === 'number' ? N.daecher[N.bezirk(best[1])].name : N.bezirk(best[1])})`); } }
