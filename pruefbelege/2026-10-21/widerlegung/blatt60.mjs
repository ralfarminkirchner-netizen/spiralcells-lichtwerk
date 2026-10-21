import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const W_ = +(process.argv[2] || 800), H_ = +(process.argv[3] || 600), DATEN = process.argv[4] || 'kette-gewebe', KELCH = +(process.argv[5] || 0);
globalThis.innerWidth = W_; globalThis.innerHeight = H_;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Zelle, DT} = await import(ROOT + 'app/js/zelle.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const L = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/' + DATEN + '/state.json', 'utf8')));
L.CAM.cssW = W_; L.CAM.cssH = H_;
Object.assign(U, {netK: 0, netT: 0, netDir: -1, kelchK: KELCH, kelchT: KELCH, dach: null, dachK: 0, flug: null, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 0, kelchZeit: 0, lese: false});
const T = [0, 0, 0];
const neu = (Z, sx, sy, maxPx) => { let best = -1, bd = (maxPx * 1.6) ** 2;
  for(let i = 0; i < Z.m.samen.length; i++){ Z.mittePos(i, T); const s = L.toScreen(T[0], T[1], T[2]); if(s[2] <= 0) continue; const d = (s[0] - sx) ** 2 + (s[1] - sy) ** 2; if(d < bd){ bd = d; best = i; } } return best; };
const alt = (Z, sx, sy, maxPx) => { let best = -1, bd = maxPx * maxPx;
  for(let g = 0; g < Z.G; g++){ if(Z.gBorn[g] === -1) continue; Z.kornPos(g, T); const s = L.toScreen(T[0], T[1], T[2]); if(s[2] <= 0) continue; const d = (s[0] - sx) ** 2 + (s[1] - sy) ** 2; if(d < bd){ bd = d; best = Z.gSeed[g]; } } return best; };
console.log(`== ${DATEN} ${W_}x${H_} kelch=${KELCH}; Monde gesamt ${B.monde.length}, über 60: ${B.monde.filter(m => m.samen.length > 60).length}`);
for(const m of B.monde.filter(m => m.samen.length > 60)){
  const Z = new Zelle(m, {ohneAufzug: true}); for(let k = 0; k < 240; k++) Z.step(DT, false); Z.kelchK = KELCH; L.setCamera(regie(U, Z, null, false), W_, H_);
  let n = 0; const c = {leer: 0, eigen: 0, fremd: 0, leerH: 0, altEigen: 0, altLeer: 0}; let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
  for(let g = 0; g < Z.G; g++){ if(Z.gBorn[g] === -1) continue; Z.kornPos(g, T); const s = L.toScreen(T[0], T[1], T[2]); if(s[2] <= 0 || s[0] < 0 || s[0] > W_ || s[1] < 0 || s[1] > H_) continue; n++;
    minx = Math.min(minx, s[0]); maxx = Math.max(maxx, s[0]); miny = Math.min(miny, s[1]); maxy = Math.max(maxy, s[1]);
    const t = neu(Z, s[0], s[1], 16); if(t < 0) c.leer++; else if(t === Z.gSeed[g]) c.eigen++; else c.fremd++;
    if(neu(Z, s[0], s[1], 14) < 0) c.leerH++;
    const a = alt(Z, s[0], s[1], 16); if(a === Z.gSeed[g]) c.altEigen++; else if(a < 0) c.altLeer++; }
  // Blätter: ist jedes über seine Mitte erreichbar?
  let erreichbar = 0; const arten = {};
  for(let i = 0; i < m.samen.length; i++){ Z.mittePos(i, T); const s = L.toScreen(T[0], T[1], T[2]); if(neu(Z, s[0], s[1], 16) === i) erreichbar++; const a = Z.W.art[i]; arten[a] = (arten[a] || 0) + 1; }
  const pc = x => (100 * x / n).toFixed(0) + ' %';
  console.log(`„${m.titel}“ (${m.samen.length} Fassungen, kristall=${m.kristall.length}, frozen=${Z.S.frozen}, traum=${!!Z.traum}) Arten ${JSON.stringify(arten)}`);
  console.log(`   ${n} sichtbare Körner in x ${minx.toFixed(0)}–${maxx.toFixed(0)}, y ${miny.toFixed(0)}–${maxy.toFixed(0)}`);
  console.log(`   neu, Tippen genau aufs Korn: nichts ${pc(c.leer)}, eigenes Blatt ${pc(c.eigen)}, fremdes Blatt ${pc(c.fremd)}; Halten (22,4 px) nichts ${pc(c.leerH)}`);
  console.log(`   alt: eigenes Blatt ${pc(c.altEigen)}, nichts ${pc(c.altLeer)}; über die eigene Mitte erreichbar: ${erreichbar} von ${m.samen.length} Blättern`);
}
