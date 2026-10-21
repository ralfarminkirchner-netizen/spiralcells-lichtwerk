import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, CAM, L} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
for(const kette of ['kette-gewebe', 'kette-claude']){
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/' + kette + '/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
const mess = (w, h, dach) => { CAM.cssW = w; CAM.cssH = h;
  Object.assign(U, {netK: 1, netT: 1, dach, dachK: 1, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 20, netDir: 1, flug: null, sel: null, hover: null});
  const cam = regie(U, null, N, false); setCamera(cam, w, h); L.pc = 0; baueNetz(N, U, 3, 1, -1, 0);
  const p = dach === 'mitte' ? U.mitteSchirm : dach === 'ohne' ? U.ohneSchirm : U.daecherSchirm[dach]; return p; };
console.log(kette, 'Dächer', N.daecher.length);
for(const [w,h] of [[1280,800],[1280,760],[1280,750],[1280,745],[1280,740],[1440,900],[1440,830],[1024,700],[768,1024],[375,812],[390,844],[812,375],[1366,650],[1920,950]]){
  const r = [];
  for(const dach of ['mitte','ohne',0,3]){ const p = mess(w,h,dach); r.push(p ? `${typeof dach==='number'?N.daecher[dach].name:dach}: p1=${Math.round(p[1])} (${(p[1]/h*100).toFixed(1)}%) x=${Math.round(p[0])} y0=${Math.round(p[1]-30)}${p[1]-30<60?' SCHWEIGT':''}` : dach+': -'); }
  console.log(`${w}x${h}`, r.join(' | ')); }
}
