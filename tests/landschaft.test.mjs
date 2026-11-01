// Landschaft und Galaxie zeigen denselben Bestand: nichts kommt dazu, nichts fehlt; die Bahnen sind Spiralen (nur lesen).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bestand} from '../app/js/daten.js';

globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const B = bestand(JSON.parse(readFileSync('testdaten/kette-claude/state.json', 'utf8')));
const O = JSON.parse(readFileSync('app/ordnung.json', 'utf8'));
const {Netz, arbeit} = await import('../app/js/netz.js');
const {pflanzen, BLATT, FELD} = await import('../app/js/gelaende.js');
const {galaxie, mondOrt, planetOrt, FLUG} = await import('../app/js/mondbahn.js');
const N = new Netz(B, O), material = N.baum.material.size, fassungen = B.monde.reduce((a, m, i) => a + (N.baum.material.has(i) ? 0 : m.samen.length), 0);   // Lesematerial zeigt sich als eines, wie im Kosmos

test('Landschaft: jede Fassung genau ein Blatt, plus je ein liegendes Blatt fürs Lesematerial', () => {
  const P = pflanzen(N); assert.equal(P.blaetter, fassungen); assert.equal(P.werke.length, B.monde.length);
  let z = 0; for(const w of P.werke) for(let i = 0; i < w.I.length; i += FELD) if(w.I[i + 7] === BLATT) z++;
  assert.equal(z, fassungen + material);
});
test('Landschaft: ein Beet mit mehr Arbeit liegt nicht tiefer; Bezirke sind eben, die Lichtung bleibt eine Mulde', () => {
  const f = N.land.flaechen, d = f.slice(0, -1); for(const b of d) assert.ok(Math.abs(N.land.y(b.x, b.z) - b.h) < 1e-6);
  assert.ok(N.land.y(0, 0) < Math.max(...d.map(b => b.h)));
});
test('Galaxie: jedes Werk ein Planet, jede Fassung ein Mond', () => {
  const G = galaxie(N, arbeit); assert.equal(G.planeten.length, B.monde.length); assert.equal(G.monde.length, fassungen);
});
test('Galaxie: zur Zeit 0 steht jeder Planet an seinem Platz im Kosmos', () => {
  const G = galaxie(N, arbeit), o = [0, 0, 0]; G.planeten.forEach(p => { planetOrt(p, 0, o); assert.ok(Math.hypot(o[0] - N.pos[p.n][0], o[2] - N.pos[p.n][2]) < 1e-6); });
});
test('Galaxie: die Bahn eines Monds schließt sich nicht; sie ist eine Spirale, keine Kreisbahn', () => {
  const G = galaxie(N, arbeit), q = G.monde.reduce((a, x) => x.tau > a.tau ? x : a), p = G.planeten[q.planet], T = 2 * Math.PI / q.wm, a = [0, 0, 0], b = [0, 0, 0];
  mondOrt(p, q, 100, 0, a); mondOrt(p, q, 100, T, b);
  const steigt = b[1] - a[1]; assert.ok(Math.abs(steigt - FLUG * T) < 1e-6, 'steigt je Umlauf um den Flug'); assert.ok(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) > q.rm * 0.05, 'nach einem Umlauf nicht am selben Ort');
  assert.ok(q.tau > T, 'die längste Spur hat mehr als einen Umlauf');
});
test('Galaxie: mehr Arbeit, längere Spur', () => {
  const G = galaxie(N, arbeit), lang = new Map(); for(const q of G.monde) lang.set(q.planet, Math.max(lang.get(q.planet) || 0, q.tau / N.rM[q.planet]));
  const paare = [...lang].map(([n, l]) => [arbeit(B.monde[n]), l]).sort((a, b) => a[0] - b[0]); assert.ok(paare[paare.length - 1][1] >= paare[0][1]);
});

test('Dorf, Campus und Büro: jede Fassung genau ein Fenster oder Blatt', async () => {
  const {bauplan} = await import('../app/js/bauplan.js');
  for(const stil of ['dorf', 'campus', 'buero']) assert.equal(bauplan(N, stil).fensterZahl, fassungen, stil);
});
test('Textfassung: jedes Werk und jede Fassung steht da, keine Kennung', async () => {
  const {alsText} = await import('../app/js/textfassung.js'), {FADEN_SATZ} = await import('../app/js/netz.js');
  const T = alsText(N, FADEN_SATZ, arbeit), W = T.bezirke.flatMap(b => b.werke), Z = W.flatMap(w => w.fassungen);
  assert.equal(W.length, B.monde.length); assert.equal(Z.length, fassungen);
  const alles = JSON.stringify(T); for(const m of B.monde) for(const s of m.samen) assert.ok(!alles.includes(s.id), 'keine Kennung einer Fassung');
});
