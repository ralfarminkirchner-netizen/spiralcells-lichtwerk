import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Zelle, DT} = await import(ROOT + 'app/js/zelle.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, CAM, toScreen} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
CAM.cssW = 1200; CAM.cssH = 800;
for(const titel of ['Ein Inhalt']){
  const m = B.monde.find(x => x.titel.startsWith(titel)), Z = new Zelle(m, {});   // wie api.oeffneMond(i, {}) aus dem Netz: mit Aufzug
  console.log(titel, 'Ausprägungen', m.samen.length, 'Aufzug', Z.S.aufzug, 'Dauer', Z.S.D);
  for(const sek of [1, 3, 6]){
    while(Z.S.clock < sek) Z.step(DT, false);
    Object.assign(U, {netK: 0, netT: 0, kelchK: 0, dach: null, dachK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, flug: null});
    const cam = regie(U, Z, null, false); setCamera(cam, 1200, 800);
    const geboren = i => { for(let g = Z.seedFirst[i]; g < Z.seedFirst[i] + Z.seedCount[i]; g++) if(Z.gBorn[g] !== -1) return true; return false; };
    const nGeb = m.samen.filter((_, i) => geboren(i)).length, c = toScreen(...Z.center()), T = [0, 0, 0];
    let tipps = 0, aufUngeboren = 0, aufLeer = 0;
    for(let x = c[0] - 260; x <= c[0] + 260; x += 13) for(let y = c[1] - 260; y <= c[1] + 260; y += 13){ tipps++;
      let best = -1, bd = (16 * 1.6) ** 2;   // trefferSame(sx, sy) mit maxPx 16, Zweig für mehr als 60 Ausprägungen
      for(let i = 0; i < m.samen.length; i++){ Z.mittePos(i, T); const s = toScreen(T[0], T[1], T[2]); if(s[2] <= 0) continue; const d = (s[0] - x) ** 2 + (s[1] - y) ** 2; if(d < bd){ bd = d; best = i; } }
      if(best < 0) aufLeer++; else if(!geboren(best)) aufUngeboren++; }
    console.log(`  nach ${sek}s: geboren ${nGeb}/${m.samen.length}; von ${tipps} Tipps ins Feld treffen ${aufUngeboren} eine noch ungeborene Ausprägung, ${aufLeer} nichts (nur diese schneiden den Aufzug ab)`);
  } }
