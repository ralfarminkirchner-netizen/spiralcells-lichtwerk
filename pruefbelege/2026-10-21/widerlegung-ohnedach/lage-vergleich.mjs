// Nur lesen: Lage von „ohne Dach“ gegenüber den Dächern, alter und neuer Stand
import {readFileSync} from 'node:fs';
const H = '/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-ohnedach/';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const stand = process.argv[2] || 'neu', kette = process.argv[3] || 'kette-gewebe';
const A = H + stand + '/app/';
const {bestand} = await import(A + 'js/daten.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + kette + '/state.json', 'utf8')));
const O = JSON.parse(readFileSync(A + 'ordnung.json', 'utf8'));
const {Netz} = await import(A + 'js/netz.js');
const N = new Netz(B, O);
const f = x => x.toFixed(2);
const bez = N.daecher.map(d => ({name: d.name, x: d.mitte[0], z: d.mitte[2], R: d.R, n: d.bereiche.flatMap(b => b.werke).length}));
if(N.L.ohne) bez.push({name: 'ohne Dach', x: N.L.ohne.mitte[0], z: N.L.ohne.mitte[2], R: N.L.ohne.R, n: N.baum.ohne.length});
console.log(`[${stand}/${kette}] Mitte R ${f(N.L.mitte.R)}  Rall ${f(N.L.R)}`);
bez.map(b => ({...b, d: Math.hypot(b.x, b.z)})).sort((a, b) => a.d - b.d).forEach(b => console.log(`  ${b.name.padEnd(18)} Abstand ${f(b.d)}  Innenkante ${f(b.d - b.R)}  Außenkante ${f(b.d + b.R)}  R ${f(b.R)}  Winkel ${f(Math.atan2(b.z, b.x) * 180 / Math.PI)}°  Werke ${b.n}`));
const o = bez.find(b => b.name === 'ohne Dach');
if(o){ const l = bez.filter(b => b !== o).map(b => ({name: b.name, luecke: Math.hypot(b.x - o.x, b.z - o.z) - b.R - o.R})).sort((a, b) => a.luecke - b.luecke);
  console.log('  Lücken ohne Dach ->', l.slice(0, 3).map(x => x.name + ' ' + f(x.luecke)).join(', ')); }
const lk = []; bez.forEach((a, i) => bez.forEach((b, j) => { if(j <= i || a === o || b === o) return; lk.push(Math.hypot(a.x - b.x, a.z - b.z) - a.R - b.R); }));
console.log('  kleinste Lücke Dach-Dach', f(Math.min(...lk)), ' Median', f(lk.sort((a, b) => a - b)[lk.length >> 1]));
// Werke ohne Dach: ihr Abstand zur nächsten Dachhülle (Rand) und zum nächsten Werk eines Dachs
for(const i of N.baum.ohne){ const p = N.pos[i]; let best = null;
  N.daecher.forEach((d, j) => d.bereiche.forEach(b => b.werke.forEach(w => { const q = N.pos[w], g = Math.hypot(p[0] - q[0], p[2] - q[2]); if(!best || g < best.g) best = {g, name: d.name, werk: B.monde[w].titel}; })));
  const naechstOhne = Math.min(...N.baum.ohne.filter(k => k !== i).map(k => Math.hypot(p[0] - N.pos[k][0], p[2] - N.pos[k][2])));
  console.log(`   ohne: ${B.monde[i].titel.slice(0, 34).padEnd(34)} nächstes Dachwerk ${f(best.g)} (${best.name}), nächstes ohne-Werk ${f(naechstOhne)}, rM ${f(N.rM[i])}, n ${B.monde[i].samen.length}`); }
