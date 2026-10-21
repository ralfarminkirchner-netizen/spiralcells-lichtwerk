import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, CAM, toScreen} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
const namen = ['Mitte', ...N.daecher.map(d => d.name), 'ohne Dach'];
const [w, h] = [1200, 800]; CAM.cssW = w; CAM.cssH = h;
for(const nz of [0, 37, 114, 200]){
  Object.assign(U, {netK: 1, netT: 1, dach: null, dachK: 0, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: nz, netDir: 1, flug: null});
  const cam = regie(U, null, N, false); setCamera(cam, w, h);
  const aus = []; B.monde.forEach((m, i) => { if(N.baum.material.has(i)) return; const p = toScreen(...N.pos[i]); if(p[1] > h - 40) aus.push(`${m.titel || m.name || '?'} [${namen[(b => b === 'mitte' ? 0 : b === 'ohne' ? namen.length - 1 : b + 1)(N.bezirk(i))]}] y=${Math.round(p[1])}`); });
  // Mitte der Zentrale auf dem Schirm
  const z = toScreen(0, 0, 0);
  console.log(`${nz}s: Zentrale y=${Math.round(z[1])}; Werke unter h-40: ${aus.join('; ') || '-'}`);
}
