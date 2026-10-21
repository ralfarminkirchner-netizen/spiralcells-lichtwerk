// Überblick mit W.aktiv = zuletzt geöffnetes Werk, keine Wahl: welche Fäden einzeln, welche Bündel, und wie nah liegen sie auf dem Schirm
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const W_ = +(process.argv[3] || 800), H_ = +(process.argv[4] || 600); globalThis.innerWidth = W_; globalThis.innerHeight = H_;
const kette = process.argv[2] || 'kette-gewebe';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const L = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/' + kette + '/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
L.CAM.cssW = W_; L.CAM.cssH = H_;
const name = b => b === 'mitte' ? N.baum.mitte.name : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
console.log(kette, 'Fäden', N.faeden.length, 'Bündel', N.buendel.length);
N.buendel.forEach((x, bi) => console.log(' Bündel', bi, name(x.von), '->', name(x.nach), 'Fäden', JSON.stringify(x.faeden), 'Kanten', x.kanten, 'Typ', x.typ));
// Für jedes Werk: wie viele Bündel bestünden nur aus seinen Fäden (also vollständig doppelt gezeigt), wenn es aktiv ist
const proWerk = [];
for(let a = 0; a < N.N; a++){ const eigen = N.faeden.map((f, fi) => f.von === a || f.nach === a ? fi : -1).filter(x => x >= 0); if(!eigen.length) continue;
  const quer = eigen.filter(fi => N.faeden[fi].bzVon !== N.faeden[fi].bzNach);
  const ganz = N.buendel.filter(x => x.faeden.every(fi => eigen.includes(fi))).length, teil = N.buendel.filter(x => x.faeden.some(fi => eigen.includes(fi))).length;
  proWerk.push([B.monde[a].titel, eigen.length, quer.length, teil, ganz]); }
proWerk.sort((p, q) => q[3] - p[3]); console.log('Werk | eigene Fäden | über Bezirksgrenzen | Bündel mit eigenem Faden | Bündel nur aus eigenen Fäden');
for(const r of proWerk.slice(0, 12)) console.log(' ', r.join(' | '));
const titel = process.argv[5] || 'Ein Inhalt';
const aktiv = B.monde.findIndex(m => m.titel.startsWith(titel)); console.log('aktiv', aktiv, B.monde[aktiv] && B.monde[aktiv].titel, 'Bezirk', name(N.bezirk(aktiv)));
for(const zeit of [0, 0.25, 0.5, 0.75]){
  Object.assign(U, {netK: 1, netT: 1, netDir: 1, kelchK: 0, dach: null, dachK: 0, dachZiel: null, flug: null, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: zeit * 2 * Math.PI / 0.012, sel: {art: 'mitte'}, hover: null, solo: -1});
  U.monde = []; U.knoten = []; U.buendelKnoten = []; U.daecherSchirm = []; U.tueren = [];
  L.setCamera(regie(U, null, N, false), W_, H_); baueNetz(N, U, 0, 1, aktiv, 0);
  const einzeln = U.knoten.map((h, fi) => h ? fi : -1).filter(x => x >= 0);
  const zeilen = [];
  U.buendelKnoten.forEach((h, bi) => { if(!h) return; const x = N.buendel[bi]; const doppelt = x.faeden.filter(fi => U.knoten[fi]);
    const abst = doppelt.map(fi => Math.hypot(U.knoten[fi][0] - h[0], U.knoten[fi][1] - h[1]).toFixed(0));
    zeilen.push(`${name(x.von)}→${name(x.nach)}: ${x.faeden.length} Fäden, davon einzeln gezeigt ${doppelt.length}${abst.length ? ' (Knotenabstand px ' + abst.join(',') + ')' : ''}`); });
  console.log(`Drehlage ${zeit}: einzeln gezeigte Fäden ${einzeln.length} [${einzeln.join(',')}], Bündel ${U.buendelKnoten.filter(Boolean).length}`);
  for(const z of zeilen) console.log('   ', z);
}
