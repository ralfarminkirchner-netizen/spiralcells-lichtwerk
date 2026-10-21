// Winkelbedeckung je Höhenband im Kelch (kelchK=1) für alle Werke: neu (35c59bc) gegen Original-Lichtwerk
import {readFileSync} from 'node:fs';
const which = process.argv[2], datei = process.argv[3] || 'kette-gewebe';
const D = which === 'orig' ? 'file:///Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk/app/js/' : new URL('../neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const state = JSON.parse(readFileSync(`/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/${datei}/state.json`, 'utf8'));
const B = bestand(state); const o = [0,0,0];
for(const m of B.monde){ if(!m.samen || m.samen.length < 3) continue;
  let Z; try { Z = new Zelle(m, {ohneAufzug: true}); } catch(e){ console.log(m.titel, 'Fehler', e.message); continue; }
  if(!Z.G) continue; Z.kelchK = 1;
  const pts = []; for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); pts.push([o[0]-Z.origin[0], o[1]-Z.origin[1], o[2]-Z.origin[2]]); }
  const ymax = Math.max(...pts.map(p => p[1])) || 1; const cov = [];
  let wsum = 0, w = 0, lr = [0,0];
  for(let b = 0; b < 10; b++){ const sel = pts.filter(p => p[1] >= b/10*ymax && p[1] < (b+1)/10*ymax + (b===9?1:0)); if(!sel.length){ cov.push('-'); continue; }
    const f = new Set(sel.map(p => Math.floor((((Math.atan2(p[2],p[0])*57.3)%360)+360)%360/10))); cov.push(f.size*10); wsum += f.size*10*sel.length; w += sel.length; }
  // Schwerpunkt-Exzentrizität: |mittlere xz| / mittlerer Radius (0 = ringsum, 1 = ganz einseitig)
  let sx = 0, sz = 0, sr = 0; for(const p of pts){ sx += p[0]; sz += p[2]; sr += Math.hypot(p[0], p[2]); }
  const ex = Math.hypot(sx, sz) / Math.max(1e-6, sr);
  const st = new Set(m.samen.map(s => s.stimme)).size;
  console.log(`${m.titel.slice(0,34).padEnd(34)} n=${String(m.samen.length).padStart(3)} G=${String(Z.G).padStart(4)} Stimmen=${st} mittl.Bedeckung=${String(Math.round(wsum/w)).padStart(3)}° Exzentr.=${ex.toFixed(2)} [${cov.join(',')}]`); }
