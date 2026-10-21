// Ganzer Umlauf des Netzes (0.012 rad/s, 524 s): wie oft und wie weit ragen Bezirke oder Werke aus dem Bild; Rand oben vs. unten
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(process.env.ALT ? './regie-alt.mjs' : ROOT + 'app/js/regie.js');
const {setCamera, CAM, toScreen} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const datei = process.argv[2] || 'kette-gewebe';
const B = bestand(JSON.parse(readFileSync(ROOT + `testdaten/${datei}/state.json`, 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
const namen = ['Mitte', ...N.daecher.map(d => d.name), 'ohne Dach'];
const werke = B.monde.map((_, i) => i).filter(i => !N.baum.material.has(i));
for(const [w, h] of [[800, 600], [1200, 800], [1440, 900], [1920, 1080], [375, 812], [844, 390]]){ CAM.cssW = w; CAM.cssH = h;
  let nAus = 0, maxAus = 0, maxWer = '', nWerkAus = 0, maxWerk = 0, minOben = 1e9, maxUnten = -1e9, nSchritt = 0, nLabel = 0;
  for(let nz = 0; nz < 524; nz += 2){ nSchritt++;
    Object.assign(U, {netK: 1, netT: 1, dach: null, dachK: 0, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: nz, netDir: 1, flug: null});
    const cam = regie(U, null, N, false); setCamera(cam, w, h);
    let aus = 0, wer = '', oben = 1e9, unten = -1e9;
    N.kreise.forEach((k, j) => { for(let s = 0; s < 48; s++){ const t = s / 48 * Math.PI * 2, p = toScreen(k.x + Math.cos(t) * k.R, 0, k.z + Math.sin(t) * k.R);
      oben = Math.min(oben, p[1]); unten = Math.max(unten, p[1]);
      const o = Math.max(-p[0], p[0] - w, -p[1], p[1] - h); if(o > aus){ aus = o; wer = namen[j]; } } });
    if(aus > 0) nAus++; if(aus > maxAus){ maxAus = aus; maxWer = `${wer} bei ${nz}s`; }
    minOben = Math.min(minOben, oben); maxUnten = Math.max(maxUnten, unten);
    // Werke (Mittelpunkt des Werks) außerhalb des Bildes oder unter der Namensgrenze
    let wa = 0; for(const i of werke){ const p = toScreen(N.pos[i][0], N.pos[i][1], N.pos[i][2]); const o = Math.max(-p[0], p[0] - w, -p[1], p[1] - h); if(o > 0){ wa++; maxWerk = Math.max(maxWerk, o); } }
    if(wa) nWerkAus++;
    // Dachnamen: unter der Grenze cssH-64?
    N.daecher.forEach(d => { const p = toScreen(d.mitte[0], d.R * 0.42, d.mitte[2]); if(p[1] - 30 > h - 64) nLabel++; });
  }
  console.log(`${datei} ${w}x${h}: Hülle aus dem Bild in ${Math.round(100 * nAus / nSchritt)}% des Umlaufs, max ${Math.round(maxAus)}px (${maxWer}); Werk-Mitte aus dem Bild in ${nWerkAus} Schritten (max ${Math.round(maxWerk)}px); Hüllen oben min y=${Math.round(minOben)}, unten max y=${Math.round(maxUnten)}; Dachnamen unter Grenze: ${nLabel} Fälle in ${nSchritt} Schritten`);
}
