import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const W_ = +(process.argv[2] || 800), H_ = +(process.argv[3] || 600);
globalThis.innerWidth = W_; globalThis.innerHeight = H_;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Zelle, DT} = await import(ROOT + 'app/js/zelle.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const L = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
L.CAM.cssW = W_; L.CAM.cssH = H_;
Object.assign(U, {netK: 0, netT: 0, netDir: -1, kelchK: 0, dach: null, dachK: 0, flug: null, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 0, kelchZeit: 0, lese: false});
const TMP = [0, 0, 0];
function cam(Z){ Z.kelchK = 0; const c = regie(U, Z, null, false); L.setCamera(c, W_, H_); }
// wie bedienung.trefferSame (Zweig > 60)
function neu(Z, sx, sy, maxPx = 16){ let best = -1, bd = (maxPx * 1.6) ** 2;
  for(let i = 0; i < Z.m.samen.length; i++){ Z.mittePos(i, TMP); const s = L.toScreen(...TMP); if(s[2] <= 0) continue; const d = (s[0] - sx) ** 2 + (s[1] - sy) ** 2; if(d < bd){ bd = d; best = i; } } return best; }
function alt(Z, sx, sy, maxPx = 16){ let best = -1, bd = maxPx * maxPx;
  for(let g = 0; g < Z.G; g++){ if(Z.gBorn[g] === -1) continue; Z.kornPos(g, TMP); const s = L.toScreen(...TMP); if(s[2] <= 0) continue; const d = (s[0] - sx) ** 2 + (s[1] - sy) ** 2; if(d < bd){ bd = d; best = Z.gSeed[g]; } } return best; }
for(const m of B.monde.filter(m => m.samen.length > 60)){
  // fertiger Stand: Tippen genau auf ein sichtbares Korn
  const Z = new Zelle(m, {ohneAufzug: true}); for(let k = 0; k < 240; k++) Z.step(DT, false); cam(Z);
  let n = 0, leer = 0, fremd = 0;
  for(let g = 0; g < Z.G; g++){ Z.kornPos(g, TMP); const s = L.toScreen(...TMP); if(s[2] <= 0 || s[0] < 0 || s[0] > W_ || s[1] < 0 || s[1] > H_) continue; n++;
    const t = neu(Z, s[0], s[1]); if(t < 0) leer++; else if(t !== Z.gSeed[g]) fremd++; }
  console.log(`„${m.titel}“ (${m.samen.length}): ${n} sichtbare Körner; Tippen genau aufs Korn trifft nichts bei ${leer} (${(100 * leer / n).toFixed(0)} %), ein anderes Blatt bei ${fremd} (${(100 * fremd / n).toFixed(0)} %)`);
  // Aufzug: nach 3 s Raster-Tippen über das Bild
  const Za = new Zelle(m, {}); for(let k = 0; k < 360; k++) Za.step(DT, false); cam(Za);
  let tap = 0, unborn = 0, altLeer = 0;
  for(let x = 10; x < W_; x += 10) for(let y = 60; y < H_ - 60; y += 10){ const t = neu(Za, x, y); if(t < 0) continue; tap++;
    const geb = Za.gBorn[Za.seedFirst[t]] !== -1; if(!geb){ unborn++; if(alt(Za, x, y) < 0) altLeer++; } }
  console.log(`   Aufzug nach 3 s: ${Za.S.nextSeed} von ${m.samen.length} geboren, aufzug=${Za.S.aufzug}; Rasterpunkte mit Treffer ${tap}, davon auf ungeborene Ausprägung ${unborn} (alter Weg: ${altLeer} davon leer → Tippen hätte den Aufzug übersprungen)`);
}
