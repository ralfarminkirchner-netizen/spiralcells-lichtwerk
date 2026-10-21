// Draufsicht der Körner (neu oder alt) als Bild, Blätter einzeln gefärbt, um Bildstellen Blättern zuzuordnen.
import {readFileSync, writeFileSync} from 'node:fs';
const BASE = '/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/';
const ver = process.argv[2] || 'neu', titel = process.argv[3] || 'Zentrale', out = process.argv[4] || 'draufsicht.ppm', flip = process.argv[5] === 'flip';
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
const D = 'file://' + BASE + ver + '/js/';
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const B = bestand(state), m = B.monde.find(m => m.titel.startsWith(titel)), Z = new Zelle(m, {ohneAufzug: true});
const N = 900, img = new Float32Array(N * N * 3), o = [0, 0, 0], R = Z.Rfinal * 1.05;
const pal = [[255,180,92],[56,200,255],[134,224,112],[155,123,255],[255,94,138]];
const extra = [[255,255,255],[255,255,0],[0,255,255],[255,0,255]];
console.log(ver, m.titel, 'rot', Z.S.rot);
for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); const i = Z.gSeed[g], st = m.samen[i].stimme; let c = typeof st === 'number' ? pal[st] : [200,200,200];
  if(i === 9 && titel === 'Zentrale') c = [255,255,255];
  const px = (o[0] / R * 0.5 + 0.5) * N, py = ((flip ? -1 : 1) * o[2] / R * 0.5 + 0.5) * N;
  for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++){ if(dx*dx+dy*dy > 4.5) continue; const x = Math.round(px + dx), y = Math.round(py + dy); if(x<0||y<0||x>=N||y>=N) continue;
    const q = (y * N + x) * 3; img[q] += c[0] * 0.6; img[q+1] += c[1] * 0.6; img[q+2] += c[2] * 0.6; } }
const buf = Buffer.alloc(N * N * 3); for(let k = 0; k < N * N * 3; k++) buf[k] = Math.min(255, img[k]);
writeFileSync(out, Buffer.concat([Buffer.from(`P6\n${N} ${N}\n255\n`), buf]));
