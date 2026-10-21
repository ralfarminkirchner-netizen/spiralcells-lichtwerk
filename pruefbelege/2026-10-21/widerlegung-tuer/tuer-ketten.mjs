import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
const O = JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8'));
for(const kette of ['testdaten/kette-gewebe/state.json', 'testdaten/kette-claude/state.json', 'testdaten/state.json']){
  let B; try { B = bestand(JSON.parse(readFileSync(ROOT + kette, 'utf8'))); } catch(e){ console.log(kette, 'nicht lesbar', e.message); continue; }
  const N = new Netz(B, O); const Rm = N.L.mitte.R;
  console.log('\n==', kette, 'Rm', Rm.toFixed(2), 'Türabstand zum Mitterand', (0.3 * Rm).toFixed(2));
  // Abstand jedes Dachs zum Mitterand
  for(const d of N.daecher){ const gap = Math.hypot(d.mitte[0], d.mitte[2]) - d.R - Rm; const ang = Math.atan2(d.mitte[2], d.mitte[0]);
    if(gap < 0.3 * Rm + 1) console.log('  Dach', d.name, 'Lücke zum Mitterand', gap.toFixed(2), 'Richtung', (ang * 180 / Math.PI).toFixed(0) + '°'); }
  if(N.L.ohne){ const o = N.L.ohne; console.log('  ohne Dach Lücke', (Math.hypot(o.mitte[0], o.mitte[2]) - o.R - Rm).toFixed(2), 'Richtung', (Math.atan2(o.mitte[2], o.mitte[0]) * 180 / Math.PI).toFixed(0) + '°'); }
  for(const n of [4, 5]){ N.tueren = Array.from({length: n}, (_, i) => ({name: ['KiN OS','Zentrale','KiNFORMER','KiN','Werkraum'][i]})); const o = [0,0,0];
    for(let i = 0; i < n; i++){ N.tuerPos(i, o); const drin = N.kreise.slice(1).map((k, j) => [j < N.daecher.length ? N.daecher[j].name : 'ohne', Math.hypot(o[0]-k.x, o[2]-k.z) - k.R]).filter(q => q[1] < 0);
      let nw = Infinity, nwT = ''; for(let j = 0; j < N.N; j++){ if(N.bezirk(j) === 'mitte') continue; const d = Math.hypot(o[0]-N.pos[j][0], o[2]-N.pos[j][2]) - N.rM[j]; if(d < nw){ nw = d; nwT = B.monde[j].titel; } }
      console.log('  n=' + n, N.tueren[i].name.padEnd(10), 'in', drin.map(q => q[0] + ' ' + (-q[1]).toFixed(2) + ' tief').join(', ') || 'frei', '| nächstes fremdes Werk', nw.toFixed(2), nw < 1 ? '„' + nwT.slice(0, 40) + '“' : ''); } }
}
