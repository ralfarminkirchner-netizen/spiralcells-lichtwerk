import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const kette = process.argv[2] || 'kette-gewebe';
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + kette + '/state.json', 'utf8')));
const O = JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8'));
const {Netz} = await import(R + 'app/js/netz.js');
const N = new Netz(B, O);
const f2 = x => x.toFixed(2);
console.log('Mitte R', f2(N.L.mitte.R), 'Rall', f2(N.L.R), 'Rm2', f2(N.Rm2));
N.daecher.forEach((d, j) => console.log('Dach', j, d.name, 'R', f2(d.R), 'mitte', f2(d.mitte[0]), f2(d.mitte[2]), 'dist', f2(Math.hypot(d.mitte[0], d.mitte[2])), 'werke', d.bereiche.flatMap(b => b.werke).length));
if(N.L.ohne) console.log('ohne', 'R', f2(N.L.ohne.R), 'mitte', f2(N.L.ohne.mitte[0]), f2(N.L.ohne.mitte[2]), 'dist', f2(Math.hypot(N.L.ohne.mitte[0], N.L.ohne.mitte[2])), 'werke', N.baum.ohne.length);
// Nachbarn von ohne
if(N.L.ohne){ const o = N.L.ohne; N.daecher.forEach((d, j) => { const g = Math.hypot(d.mitte[0] - o.mitte[0], d.mitte[2] - o.mitte[2]) - d.R - o.R; if(g < 4) console.log('  Lücke ohne <-> ', d.name, f2(g)); }); }
// Lücken zwischen Dächern
const lk = []; N.daecher.forEach((a, i) => N.daecher.forEach((b, j) => { if(j <= i) return; lk.push(Math.hypot(a.mitte[0]-b.mitte[0], a.mitte[2]-b.mitte[2]) - a.R - b.R); }));
console.log('min Lücke Dach-Dach', f2(Math.min(...lk)));
// Bündel
const bn = b => b === 'mitte' ? 'Mitte' : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
console.log('Bündel', N.buendel.length);
for(const x of N.buendel) console.log('  ', bn(x.von), '->', bn(x.nach), 'kanten', x.kanten, 'typ', x.typ, 'verw', x.verwendung, [...x.typen].map(t => t.join(':')).join(','));
console.log('innen', [...N.innen].map(([b, k]) => bn(b) + ':' + k).join(', '));
// Werke der Mitte
for(const i of N.baum.mitte.werke) console.log('Mitte-Werk', B.monde[i].titel, 'n', B.monde[i].samen.length, 'rM', f2(N.rM[i]), 'pos', f2(N.pos[i][0]), f2(N.pos[i][2]));
console.log('juengst', [...N.juengst].map(i => B.monde[i].titel + '(' + bn(N.bezirk(i)) + ')').join(' | '));
export {N, B};
