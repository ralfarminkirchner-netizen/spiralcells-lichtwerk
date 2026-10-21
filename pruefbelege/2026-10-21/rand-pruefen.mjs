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
for(const [w, h] of [[1200, 800], [800, 600], [1440, 900], [375, 812]]){ CAM.cssW = w; CAM.cssH = h;
  for(const nz of [0, 37, 130, 260]){
    Object.assign(U, {netK: 1, netT: 1, dach: null, dachK: 0, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: nz, netDir: 1, flug: null});
    const cam = regie(U, null, N, false); setCamera(cam, w, h);
    const aus = [];
    N.kreise.forEach((k, j) => { let mx = 0, wo = '';
      for(let s = 0; s < 32; s++){ const t = s / 32 * Math.PI * 2, p = toScreen(k.x + Math.cos(t) * k.R, 0, k.z + Math.sin(t) * k.R);
        const o = Math.max(-p[0], p[0] - w, -p[1], p[1] - h); if(o > mx){ mx = o; wo = p[0] < 0 ? 'links' : p[0] > w ? 'rechts' : p[1] < 0 ? 'oben' : 'unten'; } }
      if(mx > 0) aus.push(`${namen[j]} ${Math.round(mx)}px ${wo}`); });
    console.log(`${w}x${h} netZeit=${nz}s S=${cam.S.toFixed(1)} yaw=${cam.yaw.toFixed(2)}: ${aus.join('; ') || 'alles im Bild'}`);
  } }
