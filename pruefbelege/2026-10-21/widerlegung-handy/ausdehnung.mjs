// Ausdehnung des Netzes auf dem Schirm (Bezirkskreise samt Hüllenhöhe), alt (26356a7) gegen neu (35c59bc)
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const ALT = '/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-handy/alt/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const kette = process.argv[2] || 'kette-gewebe';
for(const [tag, base, ord] of [['alt', ALT, ALT + 'app/ordnung.json'], ['neu', ROOT, ROOT + 'app/ordnung.json']]){
  const {bestand} = await import(base + 'app/js/daten.js');
  const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/' + kette + '/state.json', 'utf8')));
  let O; try { O = JSON.parse(readFileSync(ord, 'utf8')); } catch { O = JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')); }
  const {Netz} = await import(base + 'app/js/netz.js');
  const {CAM, setCamera, toScreen} = await import(base + 'app/js/licht.js');
  const {regie} = await import(base + 'app/js/regie.js');
  const N = new Netz(B, O);
  const kreise = [{x: 0, z: 0, R: N.L.mitte.R, h: N.L.mitte.R * 0.42}, ...N.daecher.map(d => ({x: d.mitte[0], z: d.mitte[2], R: d.R, h: d.R * 0.38}))];
  if(N.L.ohne) kreise.push({x: N.L.ohne.mitte[0], z: N.L.ohne.mitte[2], R: N.L.ohne.R, h: 0.5});
  for(const [name, w, h] of [['Mac 800x600', 800, 600], ['Handy 375x812', 375, 812]]){
    for(const netZeit of [0, 30, 60]){
      CAM.cssW = w; CAM.cssH = h;
      const U = {kelchK: 0, netK: 1, dachK: 0, dach: null, dachZiel: null, netDir: 1, netZeit, kelchZeit: 0, elevOff: 0, yawOff: 0, px: 0, py: 0, zoom: 1, leseK: 0, lese: false, flug: null};
      const cam = regie(U, null, N, false); setCamera(cam, w, h);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for(const k of kreise) for(let s = 0; s < 64; s++){ const t = s / 64 * Math.PI * 2; for(const yy of [-k.h, 0, k.h]){ const p = toScreen(k.x + Math.cos(t) * k.R * (yy ? 0.0 : 1), yy, k.z + Math.sin(t) * k.R * (yy ? 0.0 : 1)); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } }
      const f = v => v.toFixed(0);
      console.log(tag, name, 'netZeit', netZeit, 'S', cam.S.toFixed(1), 'yaw', cam.yaw.toFixed(2), '| x', f(x0), '..', f(x1), `(${f((x1 - x0) / w * 100)}% Breite, Rand ${x0 < 0 || x1 > w ? 'ANGESCHNITTEN' : 'frei'})`, '| y', f(y0), '..', f(y1), `(${f((y1 - y0) / h * 100)}% Höhe)`);
    }
  }
}
