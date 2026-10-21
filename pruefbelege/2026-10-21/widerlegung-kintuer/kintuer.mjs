// Nachrechnung: liegt die Tür „KiN“ im Kreis von KiNTEGRiTY, und was trifft ein Tippen dort? (nur lesen)
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, CAM, L} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const O = JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8'));
const ALLE = [{name: 'KiN OS', wach: true}, {name: 'Zentrale', wach: true}, {name: 'KiNFORMER', wach: true}, {name: 'KiN', wach: true}, {name: 'Werkraum', wach: true}];
function treffe(sx, sy, N){ const kand = [], d2 = h => h && h[2] > 0 ? (h[0] - sx) ** 2 + (h[1] - sy) ** 2 : Infinity, nimm = (h, r, x) => { const d = d2(h); if(d < r * r) kand.push([d / (r * r), x]); };
  U.tueren.forEach((h, i) => nimm(h, 30, 'tuer:' + N.tueren[i].name)); U.monde.forEach((h, i) => nimm(h, 30, 'mond:' + i));
  U.knoten.forEach((h, i) => nimm(h, 26, 'faden')); if(U.dach == null) U.buendelKnoten.forEach((h, i) => nimm(h, 28, 'buendel'));
  if(U.dach == null){ U.daecherSchirm.forEach((h, i) => nimm(h, 46, 'dach')); nimm(U.mitteSchirm, 46, 'mitte'); nimm(U.ohneSchirm, 46, 'ohne'); }
  kand.sort((a, b) => a[0] - b[0]); return kand.length ? kand[0][1] : null; }
for(const datei of ['kette-gewebe', 'kette-claude']){
  const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/' + datei + '/state.json', 'utf8')));
  const N = new Netz(B, O); const kin = N.daecher.findIndex(d => d.name === 'KiNTEGRiTY');
  console.log(`\n== ${datei}: Rm ${N.L.mitte.R.toFixed(2)}, Türbogen ${(1.3 * N.L.mitte.R).toFixed(2)}, Dächer ab ${(N.L.mitte.R + 2).toFixed(2)}; KiNTEGRiTY bei (${N.daecher[kin].mitte[0].toFixed(1)},${N.daecher[kin].mitte[2].toFixed(1)}) R ${N.daecher[kin].R.toFixed(1)}`);
  for(const n of [4, 5]){ N.tueren = ALLE.slice(0, n); const o = [0, 0, 0];
    for(let i = 0; i < n; i++){ N.tuerPos(i, o); const drin = N.daecher.map((d, j) => [d, Math.hypot(o[0] - d.mitte[0], o[2] - d.mitte[2])]).filter(([d, a]) => a < d.R).map(([d, a]) => `${d.name} (${a.toFixed(1)} < ${d.R.toFixed(1)})`);
      let best = [Infinity, -1]; for(let j = 0; j < N.N; j++){ if(N.bezirk(j) === 'mitte') continue; const a = Math.hypot(o[0] - N.pos[j][0], o[2] - N.pos[j][2]); if(a < best[0]) best = [a, j]; }
      console.log(`  n=${n} Tür „${N.tueren[i].name}“ (${o[0].toFixed(1)},${o[2].toFixed(1)}): im Kreis von ${drin.join(', ') || '—'}; nächstes fremdes Werk ${best[0].toFixed(2)} („${B.monde[best[1]].titel.slice(0, 40)}“, Kugel ${N.rM[best[1]].toFixed(2)})`); }
    for(const [w, h] of [[800, 600], [1200, 800], [375, 812]]) for(const dach of [null, 'mitte', kin]){ CAM.cssW = w; CAM.cssH = h; globalThis.innerWidth = w; globalThis.innerHeight = h;
      Object.assign(U, {netK: 1, netT: 1, dach, dachK: dach == null ? 0 : 1, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 20, netDir: 1, flug: null, sel: null, hover: null, tueren: [], monde: [], knoten: [], buendelKnoten: [], daecherSchirm: []});
      const cam = regie(U, null, N, false); setCamera(cam, w, h); L.pc = 0; baueNetz(N, U, 3, 1, -1, 0);
      // Nachbarschaft unter Werken (Vergleich): Median der kleinsten Schirmabstände
      const nn = []; U.monde.forEach((p, a) => { if(!p || p[2] <= 0) return; let m = Infinity; U.monde.forEach((q, b) => { if(b !== a && q && q[2] > 0) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1])); }); if(m < Infinity) nn.push(m); }); nn.sort((a, b) => a - b);
      const unter6 = nn.filter(x => x < 6).length;
      for(let i = 0; i < n; i++){ const t = U.tueren[i]; if(!t || t[2] <= 0) continue; let best = null;
        U.monde.forEach((p, j) => { if(!p || p[2] <= 0) return; const d = Math.hypot(p[0] - t[0], p[1] - t[1]); if(!best || d < best[0]) best = [d, j]; });
        if(!best || best[0] >= 30) continue; const p = U.monde[best[1]];
        // Tippen im Umkreis von 8 px um das Werk: wie oft gewinnt die Tür?
        let tuer = 0, alle = 0; for(let dx = -8; dx <= 8; dx++) for(let dy = -8; dy <= 8; dy++){ if(dx * dx + dy * dy > 64) continue; alle++; const r = treffe(p[0] + dx, p[1] + dy, N); if(r && r.startsWith('tuer')) tuer++; }
        const imBild = t[0] >= 0 && t[0] <= w && t[1] >= 0 && t[1] <= h;
        console.log(`  n=${n} ${w}x${h} ${dach == null ? 'Überblick' : dach === kin ? 'in KiNTEGRiTY' : 'in der Mitte'}: „${N.tueren[i].name}“ ${best[0].toFixed(1)} px neben „${B.monde[best[1]].titel.slice(0, 32)}“${imBild ? '' : ' (außerhalb)'}; Tippen ≤8 px ums Werk trifft die Tür in ${tuer}/${alle}; Werkpaare unter 6 px: ${unter6}/${nn.length}, Median-Nachbar ${nn[nn.length >> 1].toFixed(0)} px`); } } } }
