import {readFileSync} from 'node:fs';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const D = new URL('../neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
for(const datei of ['kette-gewebe', 'kette-claude']){
  const state = JSON.parse(readFileSync(`/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/${datei}/state.json`, 'utf8'));
  const B = bestand(state); const rows = [];
  for(const m of B.monde){ if(!m.traumfeld) continue;
    let Z; try { Z = new Zelle(m, {ohneAufzug: true}); } catch(e){ rows.push([m.titel, 'Fehler ' + e.message]); continue; }
    const o = [0,0,0], bins = new Array(36).fill(0);
    for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); const a = ((Math.atan2(o[2]-Z.origin[2], o[0]-Z.origin[0]) * 180 / Math.PI) % 360 + 360) % 360; bins[Math.floor(a / 10)]++; }
    const max2 = Math.max(...bins.map((b, k) => b + bins[(k + 1) % 36]));
    const leer = bins.filter(b => b < Z.G * 0.01).length;
    // gleicher th1 für viele Glieder
    const th = new Map(); for(let i = 0; i < Z.W.n; i++){ const k = Z.W.th1[i].toFixed(4); th.set(k, (th.get(k) || 0) + Z.seedCount[i]); }
    const topTh = Math.max(...th.values());
    rows.push([m.titel.slice(0, 40), 'n', m.samen.length, 'G', Z.G, 'max 20°-Anteil', (max2 / Z.G * 100).toFixed(0) + '%', 'Fächer<1%', leer, 'Körner auf einem th1', (topTh / Z.G * 100).toFixed(0) + '%']);
  }
  console.log(datei, rows.length, 'Traumfelder'); for(const r of rows) console.log('  ' + r.join(' '));
}
