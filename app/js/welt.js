/* Gemeinsamer Zustand der Oberfläche. Kein Datenbestand: nur Blick, Auswahl und Gesten. */
import {pointerWorld} from './licht.js';

export const U = {
  mode: null, x0: 0, y0: 0, x: 0, y: 0, t0: 0, yawOff: 0, elevOff: 0, baseElev: Math.PI / 2, zoom: 1, last: -99, px: 0, py: 0,
  pp: new Map(), pinch0: 0, zoom0: 1, solo: -1, soloA: [1, 1, 1, 1, 1], paused: false, pwT: -99, keyHold: false,
  heads: [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]], bigHeads: [], monde: [], spiegel: [], tueren: [], daecherSchirm: [], knoten: [], buendelKnoten: [], mitteSchirm: null, ohneSchirm: null, dach: null, dachK: 0,
  kelchT: 0, kelchK: 0, spiralT: 0, spiralK: 0, gartenT: 0, gartenK: 0, landT: 0, landK: 0, galT: 0, galK: 0, galZeit: 0, ansicht: 'kosmos', innen: null, innenT: 0, innenK: 0, stil: null, stilZiel: null, bauK: 0, art: [0, 0, 0], netT: 0, netK: 0, netDir: 1, kelchZeit: 0, netZeit: 0,
  sel: null, stufe: 0, hover: null, lese: false, leseK: 0, reading: false, linkedSeeds: null,
  bind: null, siegel: null, weg: [], hinted: false, hintUntil: -1, pressW: null, pressSeed: -1, waehlen: null,
  als: null, alsK: 0, echos: [], spuren: [], alsSchilder: [],   // Alsformen: der Blick auf einen Gegenstand (als Mond) oder ein Werk (als Planet)
  pointerWorldAt(tgt){ return pointerWorld((this.px + 0.5) * innerWidth, (this.py + 0.5) * innerHeight, tgt); },
};
export const W = {B: null, N: null, Z: null, aktiv: -1, RM: false, wall: 0, ruht: false, stand: null, umgebung: []};
