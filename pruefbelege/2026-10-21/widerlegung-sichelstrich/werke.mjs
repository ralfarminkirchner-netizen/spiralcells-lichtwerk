// Nur lesend: welches Werk liegt im FASKA-Dach wo auf dem Schirm, mit Punktzahl k, rM und lit
import {readFileSync} from 'node:fs';
const ver = process.argv[2] || 'neu', KETTE = process.argv[3] || 'kette-gewebe';
const VW = +(process.argv[4] || 800), VH = +(process.argv[5] || 600);
globalThis.innerWidth = VW; globalThis.innerHeight = VH;
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const A = new URL('./' + ver + '/app/js/', import.meta.url).href;
const {bestand} = await import(A + 'daten.js');
const {L, CAM, setCamera, toScreen, PD, STR} = await import(A + 'licht.js');
const {Netz, baueNetz} = await import(A + 'netz.js');
const {Zelle} = await import(A + 'zelle.js');
const {regie} = await import(A + 'regie.js');
const {U, W} = await import(A + 'welt.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${KETTE}/state.json`, 'utf8')));
const O = JSON.parse(readFileSync(new URL('./' + ver + '/app/ordnung.json', import.meta.url), 'utf8'));
const N = new Netz(B, O);
CAM.cssW = VW; CAM.cssH = VH; const DPR = 1;
const j = N.daecher.findIndex(d => d.name === 'FASKA');
const werke = N.werkeIn(j), aktiv = B.monde.findIndex(m => m.titel.startsWith('Zentrale'));
const Z = new Zelle(B.monde[aktiv], {origin: N.pos[aktiv], ohneAufzug: true});
W.RM = false; U.RM = false;
U.netK = 1; U.netT = 1; U.netDir = 1; U.dach = j; U.dachK = 1; U.dachZiel = N.bezirkZiel(j); U.kelchK = 0; U.sel = null; U.hover = null; U.solo = -1; U.netZeit = 10;
U.monde = U.monde || []; U.knoten = U.knoten || []; U.buendelKnoten = U.buendelKnoten || []; U.daecherSchirm = U.daecherSchirm || [];
for(let i = 0; i < 30; i++){ const cam = regie(U, Z, N, false); setCamera(cam, VW * DPR, VH * DPR); }
L.pc = 0; baueNetz(N, U, 12.3, 1, aktiv, 0);
console.log(ver, KETTE, 'Dach', N.daecher[j].name, 'Werke', werke.length, 'Punkte', L.pc, 'CAM.S', CAM.S.toFixed(2));
for(const n of werke){ const m = B.monde[n]; if(N.baum.material.has(n)) continue; const k = N.mini[n].pts.length / 6, s = toScreen(...N.pos[n]);
  const lit = (m.traumfeld ? 1.4 : 2.2) * (ver === 'neu' ? Math.pow(Math.min(1, 16 / Math.max(1, k)), 0.7) : 1);
  console.log(m.titel.slice(0, 44).padEnd(44), 'n', String(m.samen.length).padStart(4), 'k', String(k).padStart(4), 'rM', N.rM[n].toFixed(2), 'traum', m.traumfeld ? 1 : 0, 'lit', lit.toFixed(3), 'k*lit', (k * lit).toFixed(1), 'k*lit/rM²', (k * lit / N.rM[n] ** 2).toFixed(1), 'Schirm', s[0].toFixed(0), s[1].toFixed(0)); }
