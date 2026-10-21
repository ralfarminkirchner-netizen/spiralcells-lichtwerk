import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, CAM, L, PD, STR} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const state = JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8'));
const O = JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8'));
const B = bestand(state);
function lauf(name, N){
  let fehler = 0; CAM.cssW = 1200; CAM.cssH = 800;
  const sels = [null, {art: 'mitte'}, {art: 'ohne'}, ...N.daecher.map((_, i) => ({art: 'dach', i})), ...N.faeden.map((_, i) => ({art: 'faden', i})), ...N.buendel.map((_, i) => ({art: 'buendel', i})), {art: 'mond', i: 3, mond: N.B.monde[3]}];
  for(const dach of [null, 'mitte', 'ohne', ...N.daecher.map((_, j) => j)]){ if(dach === 'ohne' && !N.L.ohne) continue;
    for(const sel of sels) for(const RM of [false, true]) for(const solo of [-1, 2]){
      Object.assign(U, {netK: 0.8, netT: 1, dach, dachK: 0.5, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 3, netDir: 1, flug: null, sel, hover: sel, solo, RM});
      try{ const cam = regie(U, null, N, RM); setCamera(cam, 1200, 800); L.pc = 0; baueNetz(N, U, 5, 0.9, 5, 0.3);
        for(let i = 0; i < L.pc * STR; i++) if(!Number.isFinite(PD[i])){ fehler++; console.log(name, 'NaN', dach, sel && sel.art); break; } }
      catch(e){ fehler++; if(fehler < 5) console.log(name, 'WIRFT', dach, sel && sel.art, e.message); } } }
  console.log(name, 'fertig, Fehler', fehler);
}
lauf('Ordnung', new Netz(B, O));
lauf('ohne Ordnung', new Netz(B, null));
// Material an einem Dach, das es nicht gibt; ein leeres Bestandsstück; Netz ohne Fäden
const O2 = structuredClone(O); O2.material = [{werk: 'Émile Durkheim', dach: 'Gibt es nicht'}, {werk: 'Alfred Radcliffe-Brown', dach: 'FASKA'}];
const N2 = new Netz(B, O2); const iD = B.monde.findIndex(m => m.titel === 'Émile Durkheim'), iR = B.monde.findIndex(m => m.titel === 'Alfred Radcliffe-Brown');
for(const i of [iD, iR]){ const b = N2.bezirk(i), z = N2.bezirkZiel(b), p = N2.pos[i]; console.log(B.monde[i].titel, 'Bezirk', b, '→', typeof b === 'number' ? N2.daecher[b].name : b, 'Abstand zur Bezirksmitte', Math.hypot(p[0] - z.mitte[0], p[2] - z.mitte[2]).toFixed(1), 'R', z.R.toFixed(1)); }
lauf('Material-Dach unbekannt', N2);
const s3 = structuredClone(state); s3.edges = []; lauf('ohne Fäden', new Netz(bestand(s3), O));
