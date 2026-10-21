// Nur lesend: woraus besteht der Strich am Vergleich-Werk und die Sichel? Punkte je Werk im Kasten, Radius-Ränge
import {readFileSync} from 'node:fs';
const ver = process.argv[2] || 'neu', VH = +(process.argv[3] || 600), VW = 800;
globalThis.innerWidth = VW; globalThis.innerHeight = VH;
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const A = new URL('./' + ver + '/app/js/', import.meta.url).href;
const {bestand} = await import(A + 'daten.js');
const {L, CAM, setCamera, toScreen} = await import(A + 'licht.js');
const {Netz, baueNetz} = await import(A + 'netz.js');
const {Zelle} = await import(A + 'zelle.js');
const {regie} = await import(A + 'regie.js');
const {U, W} = await import(A + 'welt.js');
const {wuchs, rangRadien} = await import(A + 'wuchs.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/kette-gewebe/state.json`, 'utf8')));
const O = JSON.parse(readFileSync(new URL('./' + ver + '/app/ordnung.json', import.meta.url), 'utf8'));
const N = new Netz(B, O); CAM.cssW = VW; CAM.cssH = VH;
const j = N.daecher.findIndex(d => d.name === 'FASKA'), aktiv = B.monde.findIndex(m => m.titel.startsWith('Zentrale'));
const Z = new Zelle(B.monde[aktiv], {origin: N.pos[aktiv], ohneAufzug: true});
W.RM = false; U.RM = false; U.netK = 1; U.netT = 1; U.netDir = 1; U.dach = j; U.dachK = 1; U.dachZiel = N.bezirkZiel(j); U.kelchK = 0; U.sel = null; U.hover = null; U.solo = -1; U.netZeit = 10;
U.monde = U.monde || []; U.knoten = U.knoten || []; U.buendelKnoten = U.buendelKnoten || []; U.daecherSchirm = U.daecherSchirm || [];
for(let i = 0; i < 30; i++){ const cam = regie(U, Z, N, false); setCamera(cam, VW, VH); }
for(const name of ['FASKA Varianten · Vergleich', 'FASKA Varianten · Jahreskreise']){
  const n = B.monde.findIndex(m => m.titel.startsWith(name)), m = B.monde[n], o = N.pos[n], p = N.mini[n].pts, k = p.length / 6;
  const Wu = wuchs(m), rr = rangRadien(Array.from(Wu.s1));
  const arten = {}; for(let i = 0; i < m.samen.length; i++) arten[Wu.art[i]] = (arten[Wu.art[i]] || 0) + 1;
  const rcount = new Map(); for(let i = 0; i < m.samen.length; i++){ const r = rr[i].toFixed(3); rcount.set(r, (rcount.get(r) || 0) + 1); }
  const topR = [...rcount].sort((a, b) => b[1] - a[1]).slice(0, 3);
  // Punkte auf dem Schirm: wie viele liegen in einem 12x8-px-Fenster um die hellste Stelle
  const sc = []; for(let q = 0; q < k; q++) sc.push(toScreen(o[0] + p[q * 6], o[1] + p[q * 6 + 1], o[2] + p[q * 6 + 2]));
  let best = null; for(const s of sc){ const c = sc.filter(t => Math.abs(t[0] - s[0]) <= 6 && Math.abs(t[1] - s[1]) <= 4).length; if(!best || c > best.c) best = {c, at: s}; }
  const xs = sc.map(s => s[0]), ys = sc.map(s => s[1]);
  console.log(ver, m.titel.slice(0, 40), 'n', m.samen.length, 'k', k, 'Arten', JSON.stringify(arten), 'häufigste Radien', JSON.stringify(topR));
  console.log('   Schirm-Spanne x', Math.min(...xs).toFixed(0) + '–' + Math.max(...xs).toFixed(0), 'y', Math.min(...ys).toFixed(0) + '–' + Math.max(...ys).toFixed(0), '; dichteste Stelle', best.at[0].toFixed(0), best.at[1].toFixed(0), 'mit', best.c, 'Punkten in 12x8 px');
}
