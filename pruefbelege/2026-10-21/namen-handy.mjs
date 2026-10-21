import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 375; globalThis.innerHeight = 812;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, CAM, L} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
for(const [w, h] of [[375, 812], [1200, 800], [800, 600]]){ CAM.cssW = w; CAM.cssH = h;
 for(const dach of [null, 0, 'mitte']){
  Object.assign(U, {netK: 1, netT: 1, dach, dachK: dach == null ? 0 : 1, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 20, netDir: 1, flug: null, sel: null, hover: null});
  const cam = regie(U, null, N, false); setCamera(cam, w, h); L.pc = 0; baueNetz(N, U, 3, 1, -1, 0);
  const namen = [N.baum.mitte.name, ...N.daecher.map(d => d.name), 'ohne Dach'], nd = N.daecher.length, belegt = [], aus = [];
  const bezirkVon = j => j === 0 ? 'mitte' : j <= nd ? j - 1 : 'ohne';
  const setze = j => { const p = j === 0 ? U.mitteSchirm : j <= nd ? U.daecherSchirm[j - 1] : U.ohneSchirm; const bw = namen[j].length * 10.6 + 4;
    if(!p || p[2] <= 0) return aus.push(namen[j] + ' (kein Punkt)'); const px = clamp(p[0], 12 + bw / 2, w - 12 - bw / 2);
    const unter = j === 0 && dach !== 'mitte', y0 = unter ? p[1] + 10 : p[1] - 30, rr = {x: px - bw / 2, y: y0, w: bw, h: 16};
    const frei = !belegt.some(q => rr.x < q.x + q.w + 6 && q.x < rr.x + rr.w + 6 && rr.y < q.y + q.h + 2 && q.y < rr.y + rr.h + 2);
    if(!frei || y0 < 60 || y0 > h - 64) return aus.push(`${namen[j]} (${!frei ? 'überdeckt' : 'y=' + Math.round(y0)})`); belegt.push(rr); };
  if(dach == null) for(let j = 0; j < namen.length; j++) setze(j); else { const hier = namen.map((_, j) => j).filter(j => bezirkVon(j) === dach); hier.forEach(setze); for(let j = 0; j < namen.length; j++) if(!hier.includes(j)) setze(j); }
  console.log(`${w}x${h} dach=${dach}: gezeigt ${belegt.length}/${namen.length}; schweigen: ${aus.join(', ')}`);
 } }
