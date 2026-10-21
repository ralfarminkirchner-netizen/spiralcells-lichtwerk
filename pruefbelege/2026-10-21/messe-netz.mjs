// Nur lesend: misst Punkte und CPU je Bild im Netz und in der Zelle gegen eine Testkette.
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const KETTE = process.argv[2] || 'kette-gewebe';
const VW = +(process.argv[3] || 800), VH = +(process.argv[4] || 600);
globalThis.innerWidth = VW; globalThis.innerHeight = VH;
const {bestand} = await import(ROOT + '/app/js/daten.js');
const licht = await import(ROOT + '/app/js/licht.js');
const {L, CAM, setCamera, toScreen, MAXP} = licht;
const {Netz, baueNetz} = await import(ROOT + '/app/js/netz.js');
const {Zelle, baueZelle} = await import(ROOT + '/app/js/zelle.js');
const {regie} = await import(ROOT + '/app/js/regie.js');
const {U, W} = await import(ROOT + '/app/js/welt.js');

const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${KETTE}/state.json`, 'utf8')));
const O = JSON.parse(readFileSync(`${ROOT}/app/ordnung.json`, 'utf8'));
const N = new Netz(B, O);
CAM.cssW = VW; CAM.cssH = VH; const DPR = VW < 700 ? 1.5 : 2;
console.log(`Kette ${KETTE}, Ansicht ${VW}x${VH}; Monde ${B.monde.length}, Dächer ${N.daecher.length}, Fäden ${N.faeden.length}, Bündel ${N.buendel.length}, Kanten ${B.roh.edges.length}`);

function zeit(fn, n = 60){ for(let i = 0; i < 5; i++) fn(); const c = []; for(let i = 0; i < n; i++){ const t = performance.now(); fn(); c.push(performance.now() - t); } c.sort((a, b) => a - b); return {median: +c[n >> 1].toFixed(2), p90: +c[Math.floor(n * 0.9)].toFixed(2)}; }

const zi = B.monde.findIndex(m => m.titel.startsWith('Zentrale'));
W.RM = false; U.RM = false;
function netzBild(dach, aktiv, opt = {}){
  const Z = new Zelle(B.monde[aktiv], {origin: N.pos[aktiv], ohneAufzug: true});
  U.netK = 1; U.netT = 1; U.netDir = 1; U.dach = dach; U.dachK = dach != null ? 1 : 0; U.dachZiel = dach != null ? N.bezirkZiel(dach) : null; U.kelchK = 0;
  U.sel = opt.sel || null; U.hover = null; U.solo = -1; U.netZeit = 10;
  const cam = regie(U, Z, N, false); setCamera(cam, VW * DPR, VH * DPR);
  let pc = 0;
  const t = zeit(() => { L.pc = 0; regie(U, Z, N, false); baueNetz(N, U, 12.3, 1, aktiv, 0); pc = L.pc; });
  return {pc, ...t};
}
const zeilen = [];
zeilen.push(['Überblick (dach=null)', netzBild(null, zi)]);
zeilen.push(['Mitte (dach=mitte)', netzBild('mitte', zi)]);
if(N.L.ohne) zeilen.push(['ohne Dach', netzBild('ohne', zi)]);
N.daecher.forEach((d, j) => { const w = N.werkeIn(j); zeilen.push([`Dach ${d.name} (${w.length} Werke)`, netzBild(j, w.find(i => !N.baum.material.has(i)) ?? zi)]); });
// gewählter Mond mit den meisten Fäden im Überblick
const fadenZahl = B.monde.map((_, i) => N.faeden.filter(f => f.von === i || f.nach === i).length), meist = fadenZahl.indexOf(Math.max(...fadenZahl));
zeilen.push([`Überblick, gewählt: ${B.monde[meist].titel.slice(0, 30)} (${fadenZahl[meist]} Fäden)`, netzBild(null, zi, {sel: {art: 'mond', i: meist, mond: B.monde[meist]}})]);
for(const [n, r] of zeilen) console.log(`${n.padEnd(60)} Punkte ${String(r.pc).padStart(6)}  ${((r.pc / MAXP) * 100).toFixed(1).padStart(5)} % MAXP  CPU median ${r.median} ms, p90 ${r.p90} ms`);

// Größte Netzposten einzeln: Werke, Fäden, Hülle
let werkPts = 0, stiel = 0; for(let n = 0; n < N.N; n++){ werkPts += N.mini[n].pts.length / 6; stiel += N.mini[n].stiel.length / 6; }
console.log(`Werkpunkte gesamt ${werkPts}, Stiele ${stiel}`);

// Zellen: kelchK 0 und 1
const nach = (k) => B.monde.map((m, i) => [m, i]).sort((a, b) => k(b[0]) - k(a[0]));
const grossG = B.monde.map((m, i) => { const Z = new Zelle(m, {origin: N.pos[i], ohneAufzug: true}); return {i, G: Z.G, n: m.samen.length, Z}; }).sort((a, b) => b.G - a.G || b.n - a.n);
const meisteSamen = [...grossG].sort((a, b) => b.n - a.n)[0];
const proben = [grossG[0], meisteSamen, grossG.find(x => x.Z.W.familie.some(Boolean))].filter(Boolean);
const gesehen = new Set();
for(const x of proben){ if(gesehen.has(x.i)) continue; gesehen.add(x.i);
  const Z = x.Z, m = B.monde[x.i];
  for(const kk of [0, 1]){
    U.netK = 0; U.netT = 0; U.dach = null; U.dachK = 0; U.kelchK = kk; U.kelchT = kk; Z.kelchK = kk; U.sel = null; U.hover = null; U.solo = -1; U.pwT = -99; U.kelchZeit = 1;
    const cam = regie(U, Z, N, false); setCamera(cam, VW * DPR, VH * DPR);
    let pc = 0; const t = zeit(() => { L.pc = 0; regie(U, Z, null, false); baueZelle(Z, U, 12.3, 1 / 60, 1); pc = L.pc; }, 40);
    // familienNamen: die Rechnung je Bild (ohne DOM)
    let fam = null;
    if(Z.W.familie.some(Boolean)){
      const bloecke = new Map(); Z.W.familie.forEach((f, i) => { if(!f) return; const k = Z.W.eltern[i] + ':' + f; if(!bloecke.has(k)) bloecke.set(k, {f, glieder: []}); bloecke.get(k).glieder.push(i); });
      const q = [0, 0, 0];
      const tf = zeit(() => { const c = toScreen(...Z.center()); let feld = 0; for(let g = 0; g < Z.G; g += 7){ Z.kornPos(g, q); const s = toScreen(q[0], q[1], q[2]); if(s[2] > 0) feld = Math.max(feld, Math.hypot(s[0] - c[0], s[1] - c[1])); }
        for(const b of bloecke.values()) for(const i of b.glieder){ Z.mittePos(i, q); toScreen(q[0], q[1], q[2]); } }, 60);
      fam = {bloecke: bloecke.size, glieder: [...bloecke.values()].reduce((a, b) => a + b.glieder.length, 0), ...tf};
    }
    // trefferSame
    const TMP = [0, 0, 0];
    const tt = zeit(() => { if(m.samen.length > 60){ for(let i = 0; i < m.samen.length; i++){ Z.mittePos(i, TMP); toScreen(TMP[0], TMP[1], TMP[2]); } } else { for(let g = 0; g < Z.G; g++){ if(Z.gBorn[g] === -1) continue; Z.kornPos(g, TMP); toScreen(TMP[0], TMP[1], TMP[2]); } } }, 60);
    // Schritt der Zelle (2 Schritte je Bild bei 60 Hz)
    const ts = zeit(() => { Z.step(1 / 120, false); Z.step(1 / 120, false); }, 60);
    console.log(`Zelle ${m.titel.slice(0, 40).padEnd(40)} n=${m.samen.length} G=${Z.G} kelchK=${kk}: Punkte ${pc} (${(pc / MAXP * 100).toFixed(1)} %), baueZelle median ${t.median} ms p90 ${t.p90}; step×2 ${ts.median} ms; trefferSame ${tt.median} ms` + (fam ? `; familienNamen ${fam.bloecke} Blöcke/${fam.glieder} Glieder ${fam.median} ms` : ''));
  }
}
