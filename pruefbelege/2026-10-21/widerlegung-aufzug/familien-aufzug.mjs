// Nur lesend: wo stünden die Familiennamen (haupt.familienNamen nachgebaut, Breite 60 px) während des Aufzugs, und wie weit reicht das sichtbare Feld
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const VW = +(process.argv[2] || 800), VH = +(process.argv[3] || 600), KETTE = process.argv[4] || 'kette-gewebe';
globalThis.innerWidth = VW; globalThis.innerHeight = VH;
const {bestand} = await import(ROOT + '/app/js/daten.js');
const {CAM, setCamera, toScreen, clamp} = await import(ROOT + '/app/js/licht.js');
const {Netz} = await import(ROOT + '/app/js/netz.js');
const {Zelle, DT} = await import(ROOT + '/app/js/zelle.js');
const {regie} = await import(ROOT + '/app/js/regie.js');
const {U} = await import(ROOT + '/app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${KETTE}/state.json`, 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(`${ROOT}/app/ordnung.json`, 'utf8'))); CAM.cssW = VW; CAM.cssH = VH;
const q = [0, 0, 0];
for(const m of B.monde){
  const i = B.monde.indexOf(m), Z = new Zelle(m, {origin: N.pos[i]});
  if(!(Z.W && Z.W.familie && Z.W.familie.some(Boolean))) continue;
  const bl = new Map(); Z.W.familie.forEach((f, k) => { if(!f) return; const key = Z.W.eltern[k] + ':' + f; if(!bl.has(key)) bl.set(key, {f, glieder: []}); bl.get(key).glieder.push(k); });
  console.log(`„${m.titel}“ ${m.samen.length}; Familienblöcke ${bl.size}: ${[...bl.values()].map(b => b.f + '(' + b.glieder.length + ')').join(', ')}`);
  Object.assign(U, {netK: 1, netT: 0, netDir: -1, kelchK: 0, kelchT: 0, dach: null, dachK: 0, dachZiel: null, leseK: 0, lese: false, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, flug: null, kelchZeit: 0, netZeit: 10});
  let wall = 0, acc = 0;
  for(const tm of [2.5, 4, 6, 9, 12, 16]){
    while(wall < tm){ const rdt = 1 / 60; wall += rdt; U.netK += (U.netT - U.netK) * (1 - Math.exp(-rdt / 1.5)); acc += rdt; while(acc >= DT){ Z.step(DT, false); acc -= DT; } }
    setCamera(regie(U, Z, N, false), VW * 2, VH * 2);
    if(U.netK >= 0.3){ console.log(`  t=${tm}: netK ${U.netK.toFixed(2)}, Namen aus`); continue; }
    const c = toScreen(...Z.center());
    let feld = 0; for(let g = 0; g < Z.G; g += 7){ Z.kornPos(g, q); const s = toScreen(q[0], q[1], q[2]); if(s[2] > 0) feld = Math.max(feld, Math.hypot(s[0] - c[0], s[1] - c[1])); }
    let feldSicht = 0; for(let g = 0; g < Z.G; g++){ const b = Z.gBorn[g]; if(b === -1 || (b > -5 && Z.S.clock - b < 0)) continue; Z.kornPos(g, q); const s = toScreen(q[0], q[1], q[2]); if(s[2] > 0) feldSicht = Math.max(feldSicht, Math.hypot(s[0] - c[0], s[1] - c[1])); }
    const belegt = [], gezeigt = [];
    for(const b of bl.values()){ let ux = 0, uy = 0, weit = -1, gebAny = false;
      for(const k of b.glieder){ if(Z.gBorn[Z.seedFirst[k]] !== -1) gebAny = true; Z.mittePos(k, q); const s = toScreen(q[0], q[1], q[2]); if(s[2] <= 0) continue; const d = Math.hypot(s[0] - c[0], s[1] - c[1]) || 1; if(d > weit){ weit = d; ux = (s[0] - c[0]) / d; uy = (s[1] - c[1]) / d; } }
      if(weit < 0 || c[2] <= 0) continue;
      const w = 60, x = c[0] + ux * (feld + 14), y = c[1] + uy * (feld + 12);
      const px = clamp(x - (ux < -0.3 ? w : ux < 0.3 ? w / 2 : 0), 8, VW - w - 8), py = y - 7, r = {x: px, y: py, w, h: 14};
      if(py < 60 || py > VH - 70 || belegt.some(o => r.x < o.x + o.w + 8 && o.x < r.x + r.w + 8 && r.y < o.y + o.h + 4 && o.y < r.y + r.h + 4)) continue;
      belegt.push(r); gezeigt.push(`${b.f}${gebAny ? '' : '[keine Fassung sichtbar]'}@(${Math.round(px)},${Math.round(py)}) Abstand ${Math.round(Math.hypot(px + w / 2 - c[0], py + 7 - c[1]))}`); }
    console.log(`  t=${tm}s aufzug=${Z.S.aufzug} geboren ${Z.S.nextSeed}/${m.samen.length}; Mitte (${Math.round(c[0])},${Math.round(c[1])}); Feld aller Körner ${Math.round(feld)} px, sichtbares Feld ${Math.round(feldSicht)} px; Namen: ${gezeigt.join(' | ') || 'keine'}`);
  }
}
