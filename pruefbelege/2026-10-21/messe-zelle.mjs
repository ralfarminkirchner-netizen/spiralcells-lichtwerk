// Nur lesend: Zelle nach einigen Sekunden Lauf (Spuren voll), kelchK 0 und 1, Übergang Zelle↔Netz
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const KETTE = process.argv[2] || 'kette-gewebe', VW = +(process.argv[3] || 800), VH = +(process.argv[4] || 600);
globalThis.innerWidth = VW; globalThis.innerHeight = VH;
const {bestand} = await import(ROOT + '/app/js/daten.js');
const {L, CAM, setCamera, MAXP} = await import(ROOT + '/app/js/licht.js');
const {Netz, baueNetz} = await import(ROOT + '/app/js/netz.js');
const {Zelle, baueZelle} = await import(ROOT + '/app/js/zelle.js');
const {regie} = await import(ROOT + '/app/js/regie.js');
const {U, W} = await import(ROOT + '/app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${KETTE}/state.json`, 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(`${ROOT}/app/ordnung.json`, 'utf8')));
CAM.cssW = VW; CAM.cssH = VH; const DPR = VW < 700 ? 1.5 : 2;
const zeit = (fn, n = 80) => { for(let i = 0; i < 5; i++) fn(); const c = []; for(let i = 0; i < n; i++){ const t = performance.now(); fn(); c.push(performance.now() - t); } c.sort((a, b) => a - b); return `median ${c[n >> 1].toFixed(2)} ms, p90 ${c[Math.floor(n * 0.9)].toFixed(2)} ms, max ${c[n - 1].toFixed(2)} ms`; };
const verteilung = B.monde.map(m => m.samen.length).sort((a, b) => b - a); console.log('Ausprägungen je Mond, größte:', verteilung.slice(0, 8).join(', '));
const kand = B.monde.map((m, i) => i).sort((a, b) => B.monde[b].samen.length * 1 - B.monde[a].samen.length).slice(0, 2);
kand.push(B.monde.findIndex(m => m.titel.startsWith('my app')));
for(const i of kand){ const m = B.monde[i];
  const Z = new Zelle(m, {origin: N.pos[i], ohneAufzug: true}); for(let k = 0; k < 120 * 6; k++) Z.step(1 / 120, false);
  for(const kk of [0, 1]){
    Object.assign(U, {netK: 0, netT: 0, dach: null, dachK: 0, kelchK: kk, kelchT: kk, sel: null, hover: null, solo: -1, pwT: -99, kelchZeit: 1}); Z.kelchK = kk;
    setCamera(regie(U, Z, N, false), VW * DPR, VH * DPR); let pc = 0;
    const t = zeit(() => { L.pc = 0; baueZelle(Z, U, 12.3, 1 / 60, 1); pc = L.pc; });
    // mit gewählter Ausprägung (Abstammungslicht) und Zeiger auf der Hülle
    Object.assign(U, {sel: {art: 'same', i: Math.floor(m.samen.length / 2), mond: m, zelle: Z}, pwT: 12, px: 0.1, py: 0.05}); let pc2 = 0;
    const t2 = zeit(() => { L.pc = 0; baueZelle(Z, U, 12.3, 1 / 60, 1); pc2 = L.pc; });
    console.log(`${m.titel.slice(0, 36).padEnd(36)} n=${String(m.samen.length).padStart(4)} G=${Z.G} kelch=${kk}: ${pc} Punkte (${(pc / MAXP * 100).toFixed(1)} %) ${t} | gewählt+Zeiger ${pc2} Punkte ${t2}`);
  }
  // Übergang: netK 0.4, beides zugleich
  Object.assign(U, {netK: 0.4, netT: 1, netDir: 1, dach: null, dachK: 0, kelchK: 0, sel: null, pwT: -99}); Z.kelchK = 0;
  setCamera(regie(U, Z, N, false), VW * DPR, VH * DPR); let pc = 0;
  const t = zeit(() => { L.pc = 0; baueZelle(Z, U, 12.3, 1 / 60, 0.5); baueNetz(N, U, 12.3, 0.6, i, 0.5); pc = L.pc; });
  console.log(`   Übergang Zelle→Netz: ${pc} Punkte, ${t}`);
}
