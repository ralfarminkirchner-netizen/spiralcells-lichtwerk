import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const [WW, HH] = (process.argv[2] || '1200x800').split('x').map(Number);
globalThis.innerWidth = WW; globalThis.innerHeight = HH;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Zelle, DT} = await import(ROOT + 'app/js/zelle.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, CAM, toScreen} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
CAM.cssW = WW; CAM.cssH = HH;
console.log('Monde > 60:', B.monde.filter(m => m.samen.length > 60).map(m => m.titel + ' (' + m.samen.length + ')').join(' | '));
for(const m of B.monde.filter(x => x.samen.length > 60)){
  const Z = new Zelle(m, {});
  console.log('\n' + m.titel, m.samen.length, 'D', Z.S.D);
  for(const sek of [2, 4, 6, 8, 10, 12, 14]){
    while(Z.S.clock < sek && Z.S.aufzug) Z.step(DT, false);
    if(!Z.S.aufzug){ console.log('  Aufzug zu Ende bei', Z.S.clock.toFixed(1)); break; }
    Object.assign(U, {netK: 0, netT: 0, kelchK: 0, dach: null, dachK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, flug: null});
    setCamera(regie(U, Z, null, false), WW, HH);
    const T = [0, 0, 0], geb = i => Z.gBorn[Z.seedCore[i]] !== -1;
    // sichtbare Körner auf dem Schirm
    const sicht = []; for(let g = 0; g < Z.G; g++){ if(Z.gBorn[g] === -1 || Z.S.clock - Z.gBorn[g] < 0) continue; Z.kornPos(g, T); const s = toScreen(...T); if(s[2] > 0) sicht.push([s[0], s[1], Z.gSeed[g]]); }
    const mit = []; for(let i = 0; i < m.samen.length; i++){ Z.mittePos(i, T); const s = toScreen(...T); mit.push(s); }
    const c = toScreen(...Z.center());
    let rVis = 0; for(const p of sicht) rVis = Math.max(rVis, Math.hypot(p[0] - c[0], p[1] - c[1]));
    let n = 0, neuUng = 0, neuGeb = 0, neuLeer = 0, altGeb = 0, altLeer = 0, nIn = 0, inUng = 0, inLeer = 0, inAltLeer = 0;
    for(let x = 6; x < WW; x += 12) for(let y = 6; y < HH; y += 12){ n++;
      let best = -1, bd = (16 * 1.6) ** 2; for(let i = 0; i < mit.length; i++){ const s = mit[i]; if(s[2] <= 0) continue; const d = (s[0] - x) ** 2 + (s[1] - y) ** 2; if(d < bd){ bd = d; best = i; } }
      let ab = -1, ad = 16 * 16; for(const p of sicht){ const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if(d < ad){ ad = d; ab = p[2]; } }
      if(best < 0) neuLeer++; else if(geb(best)) neuGeb++; else neuUng++;
      if(ab < 0) altLeer++; else altGeb++;
      const inn = Math.hypot(x - c[0], y - c[1]) <= Math.max(40, rVis);
      if(inn){ nIn++; if(best >= 0 && !geb(best)) inUng++; if(best < 0) inLeer++; if(ab < 0) inAltLeer++; } }
    const gebN = m.samen.filter((_, i) => geb(i)).length;
    const ungAufSchirm = mit.filter((s, i) => !geb(i) && s[2] > 0 && s[0] >= 0 && s[0] <= WW && s[1] >= 0 && s[1] <= HH).length;
    console.log(`  t=${sek}s geboren ${gebN}/${m.samen.length}, ungeborene Mitten auf dem Schirm ${ungAufSchirm}, sichtbarer Radius ${rVis.toFixed(0)} px | ganzer Schirm (${n} Tipps): neu ungeboren ${neuUng}, neu leer ${neuLeer} (alt leer ${altLeer}) | im sichtbaren Kreis (${nIn}): neu ungeboren ${inUng} (${(100*inUng/Math.max(1,nIn)).toFixed(0)}%), neu leer ${inLeer}, alt leer ${inAltLeer}`);
  }
}
