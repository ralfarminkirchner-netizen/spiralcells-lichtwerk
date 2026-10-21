// Nur lesend: Öffnen eines großen Monds aus dem Netz (mit Aufzug), Bild für Bild wie haupt.advance; prüft trefferSame alt/neu
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const VW = +(process.argv[2] || 800), VH = +(process.argv[3] || 600), KETTE = process.argv[4] || 'kette-gewebe';
globalThis.innerWidth = VW; globalThis.innerHeight = VH;
const {bestand} = await import(ROOT + '/app/js/daten.js');
const {CAM, setCamera, toScreen, clamp} = await import(ROOT + '/app/js/licht.js');
const {Netz} = await import(ROOT + '/app/js/netz.js');
const {Zelle, DT} = await import(ROOT + '/app/js/zelle.js');
const {regie} = await import(ROOT + '/app/js/regie.js');
const {U, W} = await import(ROOT + '/app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${KETTE}/state.json`, 'utf8')));
const O = JSON.parse(readFileSync(`${ROOT}/app/ordnung.json`, 'utf8'));
const N = new Netz(B, O); CAM.cssW = VW; CAM.cssH = VH;
const T = [0, 0, 0];
const neu = (Z, sx, sy, maxPx = 16) => { let best = -1, bd = (maxPx * 1.6) ** 2;
  for(let i = 0; i < Z.m.samen.length; i++){ Z.mittePos(i, T); const s = toScreen(T[0], T[1], T[2]); if(s[2] <= 0) continue; const d = (s[0] - sx) ** 2 + (s[1] - sy) ** 2; if(d < bd){ bd = d; best = i; } } return best; };
const alt = (Z, sx, sy, maxPx = 16) => { let best = -1, bd = maxPx * maxPx;
  for(let g = 0; g < Z.G; g++){ if(Z.gBorn[g] === -1) continue; Z.kornPos(g, T); const s = toScreen(T[0], T[1], T[2]); if(s[2] <= 0) continue; const d = (s[0] - sx) ** 2 + (s[1] - sy) ** 2; if(d < bd){ bd = d; best = Z.gSeed[g]; } } return best; };
// sichtbar wie baueZelle: geboren und Alter >= 0
const sichtbar = (Z, i) => { for(let g = Z.seedFirst[i]; g < Z.seedFirst[i] + Z.seedCount[i]; g++){ const b = Z.gBorn[g]; if(b !== -1 && (b <= -5 || Z.S.clock - b >= 0)) return true; } return false; };
for(const m of B.monde.filter(m => m.samen.length > 60)){
  const i = B.monde.indexOf(m);
  const Z = new Zelle(m, {origin: N.pos[i]});
  Object.assign(U, {netK: 1, netT: 0, netDir: -1, kelchK: 0, kelchT: 0, dach: null, dachK: 0, dachZiel: null, leseK: 0, lese: false, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, flug: null, kelchZeit: 0, netZeit: 10, fahrt: null});
  console.log(`„${m.titel}“ ${m.samen.length} Ausprägungen, Aufzug ${Z.S.aufzug}, D ${Z.S.D}s`);
  let wall = 0, acc = 0; const marken = [2, 3, 5, 8, 11, 13.5];
  for(const tm of marken){
    while(wall < tm){ const rdt = 1 / 60; wall += rdt; U.netK += (U.netT - U.netK) * (1 - Math.exp(-rdt / 1.5)); U.netZeit += rdt; acc += rdt; while(acc >= DT){ Z.step(DT, false); acc -= DT; } }
    const cam = regie(U, Z, N, false); setCamera(cam, VW * 2, VH * 2);
    if(U.netK > 0.4 || !Z.S.aufzug){ console.log(`  t=${tm}s netK=${U.netK.toFixed(2)} aufzug=${Z.S.aufzug} – kein Same-Treffer möglich/kein Aufzug`); continue; }
    let pts = 0, regress = 0, nurNeuUngeb = 0, altBorn = 0, sofortAlt = 0, sofortNeu = 0;
    const geb = [...m.samen.keys()].filter(k => sichtbar(Z, k)).length;
    for(let x = 5; x < VW; x += 10) for(let y = 55; y < VH - 55; y += 10){ pts++;
      const a = alt(Z, x, y), n = neu(Z, x, y);
      if(a < 0) sofortAlt++; if(n < 0) sofortNeu++;
      if(n >= 0 && !sichtbar(Z, n)){ nurNeuUngeb++; if(a < 0) regress++; } }
    console.log(`  t=${tm}s netK=${U.netK.toFixed(2)} sichtbar ${geb}/${m.samen.length}: ${pts} Rasterpunkte; Tipp überspringt Aufzug alt ${sofortAlt}, neu ${sofortNeu}; neu auf unsichtbare Fassung ${nurNeuUngeb} (davon alt leer = Aufzug wäre übersprungen: ${regress})`);
  }
}
