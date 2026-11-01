// Netz mit Ralfs Ordnung: die Mitte trägt, die Fäden sind gebündelt und führen bis in die Passage (nur lesen).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bestand} from '../app/js/daten.js';

globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const B = bestand(JSON.parse(readFileSync('testdaten/kette-claude/state.json', 'utf8')));
const O = JSON.parse(readFileSync('app/ordnung.json', 'utf8'));
const {Netz, arbeit} = await import('../app/js/netz.js');
const N = new Netz(B, O);

test('Netz: die Mitte ist so groß wie ein großes Dach, ihre Werke liegen in ihr', () => {
  const groesstes = Math.max(...N.daecher.map(d => d.R));
  assert.ok(N.L.mitte.R >= 0.7 * groesstes - 1e-9, `Mitte ${N.L.mitte.R} gegen Dach ${groesstes}`);
  for(const i of N.baum.mitte.werke) assert.ok(Math.hypot(N.pos[i][0], N.pos[i][2]) + N.rM[i] <= N.L.mitte.R * 1.05, B.monde[i].titel);
});
test('Netz: Bezirke überlappen nicht, „ohne Dach“ liegt im Kranz statt weit draußen', () => {
  const k = N.kreise;
  for(let a = 0; a < k.length; a++) for(let b = a + 1; b < k.length; b++) assert.ok(Math.hypot(k[a].x - k[b].x, k[a].z - k[b].z) >= k[a].R + k[b].R - 1e-6, `${a} ${b}`);
  if(N.L.ohne){ const weitestesDach = Math.max(...N.daecher.map(d => Math.hypot(d.mitte[0], d.mitte[2]) + d.R));
    assert.ok(Math.hypot(N.L.ohne.mitte[0], N.L.ohne.mitte[2]) < weitestesDach, 'ohne Dach nicht jenseits aller Dächer'); }
});
test('Netz: jeder Faden kennt seine Bezirke; Bündel nur über Bezirksgrenzen, mit allen Kanten', () => {
  let ueber = 0;
  for(const f of N.faeden){ assert.ok(f.bzVon !== undefined && f.bzNach !== undefined); if(f.bzVon !== f.bzNach) ueber += f.kanten.length;
    // Kanten mit beschriebener Verwendung stehen vorn: sie führen bis in die Passage
    const v = f.kanten.map(e => !!e.usage); assert.deepEqual(v, [...v].sort((a, b) => b - a)); }
  assert.equal(N.buendel.reduce((a, x) => a + x.kanten, 0), ueber);
  for(const x of N.buendel){ assert.notEqual(x.von, x.nach); for(const fi of x.faeden){ assert.equal(N.faeden[fi].bzVon, x.von); assert.equal(N.faeden[fi].bzNach, x.nach); } }
});
test('Netz: ein Werk nur mit seiner Ausgangsfassung ist eine Knospe, kein großer leerer Kreis', () => {
  const k = B.monde.findIndex((m, i) => !m.samen.length && !N.baum.material.has(i));
  if(k >= 0) assert.ok(N.rM[k] < 0.5);
  const voll = B.monde.findIndex(m => m.samen.length > 20); assert.ok(N.rM[voll] > 1);
});
test('Garten: dieselben Werke am selben Ort; wer mehr Arbeit trägt, hat die längere Spirale und steht höher', () => {
  const m = n => ({samen: Array.from({length: n}, () => ({laenge: 2000}))});
  assert.ok(arbeit(m(1)) < arbeit(m(10)) && arbeit(m(10)) < arbeit(m(100)));
  const voll = B.monde.findIndex(x => x.samen.length > 20), klein = B.monde.findIndex((x, i) => x.samen.length === 1 && !N.baum.material.has(i));
  assert.ok(N.mini[voll].H > N.mini[klein].H);
  for(let i = 0; i < N.N; i++) assert.equal(N.mini[i].ptsG.length / 3, N.mini[i].pts.length / 6);
});
test('Pflanze: die Form folgt der Abstammung; ohne belegte Herkunft kein Stängel von Fassung zu Fassung', async () => {
  const {wuchs} = await import('../app/js/wuchs.js');
  const verzweigt = B.monde.findIndex((m, i) => m.samen.length > 3 && !N.baum.material.has(i) && [...wuchs(m).kinder].some(k => k.length > 1 && k.every(x => wuchs(m).art[x] !== 'reihe')));
  if(verzweigt >= 0){ const P = N.mini[verzweigt].ptsG; let weit = 0; for(let p = 0; p < P.length / 3; p++) weit = Math.max(weit, Math.hypot(P[p * 3], P[p * 3 + 2])); assert.ok(weit > 0); }
  for(let i = 0; i < N.N; i++){ const m = N.mini[i]; for(let p = 0; p < m.ptsG.length / 3; p++) assert.ok(Number.isFinite(m.ptsG[p * 3 + 1]) && m.ptsG[p * 3 + 1] > 0); }
});
