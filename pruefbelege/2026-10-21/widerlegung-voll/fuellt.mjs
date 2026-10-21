// nur lesend: deckt ein Blatt seinen Fächerbogen? Wurzeln je Keil, Lücken zwischen Keilen.
import {readFileSync} from 'node:fs';
const D = new URL('../neu/js/', import.meta.url).href;
const {bestand} = await import(D + 'daten.js'); const {Zelle} = await import(D + 'zelle.js');
const kette = process.argv[2] || 'kette-gewebe';
const state = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/' + kette + '/state.json', 'utf8'));
const B = bestand(state);
for(const t of ['Ein Inhalt', 'Zentrale']){ const m = B.monde.find(m => m.titel.startsWith(t)); if(!m) continue; const Z = new Zelle(m, {ohneAufzug: true}), W = Z.W, n = W.n;
  // Winkelausdehnung je Blatt gegen seine Fächerspanne
  let voll = 0, ges = 0;
  for(let i = 0; i < n; i++){ const f = Z.seedFirst[i], c = Z.seedCount[i]; let mn = 1e9, mx = -1e9; for(let k = f; k < f + c; k++){ mn = Math.min(mn, Z.gDt[k]); mx = Math.max(mx, Z.gDt[k]); }
    const r = (mx - mn) / Math.max(1e-6, W.spann[i]); ges += c; if(r > 0.7) voll += c; }
  const wurzeln = {}; for(const r of W.wurzeln){ const s = String(m.samen[r].stimme); wurzeln[s] = (wurzeln[s] || 0) + 1; }
  console.log(kette, t, 'Körner in Blättern, die >70 % ihres Fächerbogens quer überspannen:', voll, 'von', ges, '| Wurzeln je Stimme', JSON.stringify(wurzeln), '| Stimmen', JSON.stringify(m.stimmen)); }
