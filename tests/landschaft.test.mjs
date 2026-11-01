// Landschaft und Galaxie zeigen denselben Bestand: nichts kommt dazu, nichts fehlt; die Bahnen sind Spiralen (nur lesen).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bestand} from '../app/js/daten.js';

globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const B = bestand(JSON.parse(readFileSync('testdaten/kette-claude/state.json', 'utf8')));
const O = JSON.parse(readFileSync('app/ordnung.json', 'utf8'));
const {Netz, arbeit} = await import('../app/js/netz.js');
const {pflanzen, BLATT, BLUETE, FRUCHT, FELD} = await import('../app/js/gelaende.js');
const {galaxie, mondOrt} = await import('../app/js/mondbahn.js');
const N = new Netz(B, O), material = N.baum.material.size, fassungen = B.monde.reduce((a, m, i) => a + (N.baum.material.has(i) ? 0 : m.samen.length), 0);   // Lesematerial zeigt sich als eines, wie im Kosmos

test('Garten: jede Fassung genau ein Organ (Blatt, Blüte oder Frucht), plus je ein liegendes Blatt fürs Lesematerial', () => {
  const P = pflanzen(N); assert.equal(P.blaetter, fassungen); assert.equal(P.werke.length, B.monde.length);
  let z = 0; for(const w of P.werke) for(let i = 0; i < w.I.length; i += FELD) if([BLATT, BLUETE, FRUCHT].includes(w.I[i + 7])) z++;
  assert.equal(z, fassungen + material);
});
test('Landschaft: ein Beet mit mehr Arbeit liegt nicht tiefer; Bezirke sind eben, die Lichtung bleibt eine Mulde', () => {
  const f = N.land.flaechen, d = f.slice(0, -1); for(const b of d) assert.ok(Math.abs(N.land.y(b.x, b.z) - b.h) < N.L.R * 0.08);
  assert.ok(N.land.y(0, 0) < Math.max(...d.map(b => b.h)));
});
test('Galaxie: jedes Werk ein Planet, jede Fassung ein Mond', () => {
  const G = galaxie(N, arbeit); assert.equal(G.planeten.length, B.monde.length); assert.equal(G.monde.length, fassungen);
});
test('Galaxie: eigene Lage. Planeten eines Dachs kreisen um seine Sonne, im Kern das älteste zuerst, die Sonnen liegen nicht an den Orten des Netzes', () => {
  const G = galaxie(N, arbeit); N.daecher.forEach((d, j) => { const S = G.sonnen[j]; assert.ok(Math.hypot(S.x - d.mitte[0], S.z - d.mitte[2]) > 1, d.name); for(const n of N.werkeIn(j)){ const p = G.planeten[n]; assert.equal(p.sx, S.x); assert.ok(Math.hypot(p.rx, p.rz) <= S.R + 1e-6); } });
});
test('Galaxie: die Bahn schließt sich nicht; sie ist eine Spirale, keine Kreisbahn', () => {
  const G = galaxie(N, arbeit), q = G.monde.reduce((a, x) => x.tau > a.tau ? x : a), p = G.planeten[q.planet], T = 2 * Math.PI / q.wm, a = [0, 0, 0], b = [0, 0, 0];
  mondOrt(p, q, 100, 0, a); mondOrt(p, q, 100, T, b);
  assert.ok(Math.abs((a[1] - b[1]) - p.fl * T) < 1e-6, 'je Windung tiefer in die Vergangenheit'); assert.ok(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) > q.rm * 0.05);
  assert.ok(q.tau > T, 'die längste Spirale hat mehr als eine Windung');
});
test('Galaxie: jede Fassung genau ein Stück der Spirale, ohne Lücke und ohne Überlappung; unten das Älteste', () => {
  const G = galaxie(N, arbeit), je = new Map(); for(const q of G.monde){ if(!je.has(q.planet)) je.set(q.planet, []); je.get(q.planet).push(q); }
  for(const [n, li] of je){ const p = G.planeten[n], m = B.monde[n], s = [...li].sort((x, y) => y.tau - x.tau); assert.ok(Math.abs(s[0].tau - p.alt) < 1e-6); assert.ok(s[s.length - 1].tauA < 1e-6); for(let i = 1; i < s.length; i++){ assert.ok(Math.abs(s[i].tau - s[i - 1].tauA) < 1e-6); assert.ok((m.samen[s[i].i].zeit || 0) >= (m.samen[s[i - 1].i].zeit || 0), 'jünger liegt höher'); } }
});
test('Galaxie: mehr Arbeit, längere Spirale', () => {
  const G = galaxie(N, arbeit), lang = G.planeten.filter(p => p.alt).map(p => [arbeit(B.monde[p.n]), p.alt]).sort((a, b) => a[0] - b[0]); for(let i = 1; i < lang.length; i++) assert.ok(lang[i][1] >= lang[i - 1][1]);
});
test('Dorf: je Dach eine Straße, die Häuser nach Alter vom Platz weg; ohne Dach liegt jenseits der Straßen', async () => {
  const {orteFuer, alterVon} = await import('../app/js/anlage.js'), L = orteFuer(N, 'dorf'), r = n => Math.hypot(L.pos[n][0], L.pos[n][2]);
  assert.equal(L.pos.length, N.N); assert.equal(L.wege.length, 1 + N.daecher.filter((_, j) => N.werkeIn(j).length).length);
  N.daecher.forEach((_, j) => { const li = [...N.werkeIn(j)].sort((a, b) => alterVon(B.monde[a]) - alterVon(B.monde[b])); for(let i = 2; i < li.length; i++) assert.ok(r(li[i]) >= r(li[i - 2]) - 0.5, 'jünger liegt weiter draußen'); });
  const strassen = Math.max(...N.daecher.flatMap((_, j) => N.werkeIn(j).map(r))); for(const n of N.werkeIn('ohne')) assert.ok(r(n) > strassen);
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

test('Gebäude innen: jede Fassung genau ein Schreibtisch, Etagen aufsteigend nach Zeit', async () => {
  const {innenPlan} = await import('../app/js/innen.js'), {etagen} = await import('../app/js/anlage.js');
  for(const stil of ['dorf', 'campus', 'buero']) B.monde.forEach((m, n) => { if(N.baum.material.has(n) || !m.samen.length) return; const P = innenPlan(N, n, stil, [0, 0, 0]); assert.equal(P.tische.length, m.samen.length, m.titel); const E = etagen(m, 0.8); for(let k = 1; k < E.length; k++) assert.ok(E[k].von >= E[k - 1].bis); });
});
