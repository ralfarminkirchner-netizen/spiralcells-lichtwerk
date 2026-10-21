import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const W_ = +(process.argv[2] || 800), H_ = +(process.argv[3] || 600); globalThis.innerWidth = W_; globalThis.innerHeight = H_;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const L = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
L.CAM.cssW = W_; L.CAM.cssH = H_;
const name = b => b === 'mitte' ? N.baum.mitte.name : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
const im = p => p && p[2] > 0 && p[0] >= 0 && p[0] <= W_ && p[1] >= 0 && p[1] <= H_;
const n = 36;
for(const [bi, x] of N.buendel.entries()){ const fi = x.faeden[0]; let aus = 0;
  for(let k = 0; k < n; k++){ Object.assign(U, {netK: 1, netT: 1, netDir: 1, kelchK: 0, dach: x.von, dachK: 1, dachZiel: null, flug: null, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: k / n * 2 * Math.PI / 0.012, sel: {art: 'faden', i: fi}, hover: null, solo: -1});
    U.monde = []; U.knoten = []; U.buendelKnoten = []; U.daecherSchirm = []; U.tueren = [];
    L.setCamera(regie(U, null, N, false), W_, H_); baueNetz(N, U, 0, 1, -1, 0); if(!im(U.knoten[fi])) aus++; }
  console.log(`${W_}x${H_} Bündel ${name(x.von)}→${name(x.nach)}: Knoten des gewählten Fadens in ${aus} von ${n} Drehlagen außerhalb des Bilds`); }
