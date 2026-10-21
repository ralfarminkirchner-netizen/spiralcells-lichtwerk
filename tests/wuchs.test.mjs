// Wuchs (Abstammung im Raum) und Ordnung (Mitte, Dächer, Werke) gegen eine Kopie des echten Bestands (nur lesen).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bestand} from '../app/js/daten.js';
import {wuchs, ahnen, nachkommen, rangRadien, KEIM, FREI} from '../app/js/wuchs.js';
import {ordne, lage, werkSchluessel} from '../app/js/ordnung.js';

const state = JSON.parse(readFileSync('testdaten/kette-claude/state.json', 'utf8'));
const B = bestand(state);
const mond = t => B.monde.find(m => m.titel.startsWith(t));

test('Wuchs: jede Ausprägung hängt nur an Früherem, nie im Kreis', () => {
  for(const m of B.monde){ const W = wuchs(m);
    for(let i = 0; i < W.n; i++){ const p = W.eltern[i]; assert.ok(p === KEIM || p === FREI || (p >= 0 && p < i), `${m.titel}: ${i} → ${p}`);
      assert.ok(Number.isFinite(W.th0[i]) && Number.isFinite(W.th1[i]) && W.s1[i] > W.s0[i]); } }
});
test('Wuchs: Zentrale wächst aus dem Briefing, jede Stimme auf ihrer Speiche', () => {
  const m = mond('Zentrale'), W = wuchs(m);
  const wurzeln = W.wurzeln.map(i => m.samen[i].stimme).sort();
  assert.deepEqual(wurzeln, [0, 1, 2, 3, 4]);
  for(const r of W.wurzeln){ assert.equal(W.art[r], 'keim'); assert.ok(Math.abs(W.th1[r] - m.samen[r].stimme * 144 * Math.PI / 180) < 1e-9); }
  assert.ok(W.lese.length >= 10, 'Gegenlese der zweiten Runde ist Gewebe');
});
test('Wuchs: Gabeln aus fremden Zweigen in „Ein Inhalt“, Gegenlese ist nie Abstammung', () => {
  const m = mond('Ein Inhalt'), W = wuchs(m);
  const gabeln = [...W.art.keys()].filter(i => W.art[i] === 'gabel');
  assert.ok(gabeln.length >= 5);
  for(const i of gabeln) assert.notEqual(m.samen[i].baum, m.samen[W.eltern[i]].baum, 'eine Gabel verbindet zwei Zweige');
  for(const [i, j] of W.lese) assert.notEqual(W.eltern[i], j);
});
test('Wuchs: ein Fächer bleibt ein Fächer, die Hauptlinie bleibt gerade', () => {
  const m = mond('FASKA Varianten · Vergleich'), W = wuchs(m);
  const f = W.kinder.findIndex(k => k.length >= 90); assert.ok(f >= 0);
  const kinder = W.kinder[f], winkel = kinder.map(k => W.th1[k]);
  assert.ok(Math.max(...winkel) - Math.min(...winkel) > 1.5, 'die Kinder spannen einen weiten Bogen');
  // in einer reinen Kette ohne Abzweig erbt jedes Glied die Richtung
  for(let i = 0; i < W.n; i++){ const p = W.eltern[i]; if(p >= 0 && W.kinder[p].length === 1) assert.ok(Math.abs(W.th1[i] - W.th1[p]) < 1e-9); }
  assert.deepEqual(ahnen(W, kinder[0]).slice(-2), [f, kinder[0]]);
  assert.ok(nachkommen(W, f).length >= kinder.length);
});
test('Radien nach Rang: Gleichstände liegen auf demselben Radius', () => {
  const r = rangRadien([0, 1, 1, 1, 2]);
  assert.equal(r[1], r[2]); assert.equal(r[2], r[3]); assert.ok(r[0] < r[1] && r[3] < r[4] && r[4] <= 1);
});
test('Ordnung: jeder Mond genau einmal, Ungeordnetes bleibt „ohne Dach“', () => {
  const O = {mitte: {name: 'Zentrale', werke: ['Zentrale · Material bekommt Form']},
    daecher: [{name: 'Probe', bereiche: [{name: 'Einer', werke: ['ordner:/Volumes/ThunderBolt4_2TB/MeineApps/faska-app-bau']}]}],
    material: [{werk: 'Émile Durkheim', an: 'Zentrale · Material bekommt Form'}]};
  const b = ordne(B, O);
  assert.equal(b.mitte.werke.length, 1); assert.equal(b.daecher[0].bereiche[0].werke.length, 1);
  const alle = [...b.mitte.werke, ...b.daecher.flatMap(d => d.bereiche.flatMap(x => x.werke)), ...b.material.keys(), ...b.ohne];
  assert.equal(alle.length, B.monde.length); assert.equal(new Set(alle).size, B.monde.length);
  assert.equal(b.ort[B.monde.findIndex(m => m.titel === 'Émile Durkheim')].ebene, 'material');
  const L = lage(b, B.monde.map(() => 0.6));
  assert.ok(L.pos.every(p => p && p.every(Number.isFinite)));
  assert.ok(Math.hypot(L.pos[b.mitte.werke[0]][0], L.pos[b.mitte.werke[0]][2]) < L.mitte.R, 'die Mitte liegt in der Mitte');
});
test('Werkschlüssel ohne Katalogkennung', () => {
  for(const m of B.monde){ const k = werkSchluessel(m.werk); assert.ok(!/appgprj|hosted-sources/.test(k), k); }
});

test('Zelle und Netz: alle Monde bauen, jede Lage endlich, Punktbudget gehalten', async () => {
  globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
  const {Zelle, baueZelle} = await import('../app/js/zelle.js');
  const {Netz, baueNetz} = await import('../app/js/netz.js');
  const {setCamera, L, CAM} = await import('../app/js/licht.js');
  const {U} = await import('../app/js/welt.js');
  CAM.cssW = 1200; CAM.cssH = 800;
  let maxPc = 0;
  for(const m of B.monde){
    const Z = new Zelle(m, {ohneAufzug: true}); Z.sofort();
    for(let k = 0; k < 240; k++) Z.step(1 / 120, false);
    if(m.samen.length) U.sel = {art: 'same', i: m.samen.length - 1, mond: m, zelle: Z};   // mit Auswahl: Abstammungslicht
    const o = [0, 0, 0];
    for(let g = 0; g < Z.G; g++){ Z.kornPos(g, o); assert.ok(o.every(Number.isFinite), m.titel); }
    for(let i = 0; i < m.samen.length; i++){ Z.seedPos(i, o); assert.ok(o.every(Number.isFinite), m.titel); }
    setCamera({target: Z.center(), dist: 5, yaw: 0, pitch: 1.4, fov: 0.6, S: Z.S.Sc, shift: 0, shiftX: 0}, 1200, 800);
    L.pc = 0; baueZelle(Z, U, 3, 1 / 60, 1); maxPc = Math.max(maxPc, L.pc);
    U.kelchK = 1; Z.kelchK = 1; L.pc = 0; baueZelle(Z, U, 3.1, 1 / 60, 1); maxPc = Math.max(maxPc, L.pc); U.kelchK = 0; U.sel = null;
  }
  assert.ok(maxPc < 40000, 'Punkte je Zelle ' + maxPc);
  const N = new Netz(B, null);
  setCamera({target: N.mitte, dist: N.Rm2 * 3, yaw: 0.35, pitch: 0.87, fov: 0.7, S: N.Rm2, shift: 0, shiftX: 0}, 1200, 800);
  L.pc = 0; baueNetz(N, U, 2, 1, -1, 0); assert.ok(L.pc > 1000 && L.pc < 60000, 'Punkte im Netz ' + L.pc);
  assert.equal(N.baum.ohne.length, B.monde.length, 'ohne Ordnung steht alles „ohne Dach“');
  const N2 = new Netz(B, JSON.parse(readFileSync('ordnung.json', 'utf8')));
  L.pc = 0; baueNetz(N2, U, 2, 1, -1, 0); assert.ok(L.pc < 80000, 'Punkte im Netz mit Dächern ' + L.pc);
});

test('Ordnung: Formfehler werden „fehlt“, nie eine Ausnahme', () => {
  for(const O of [{material: [{}]}, {mitte: {werke: [null, 3, {x: 1}]}}, {daecher: {}}, {daecher: [{bereiche: [null, {werke: 'FASKA GOLD'}]}]}, {mitte: 'x'}, [], 'kaputt', null]){
    const b = ordne(B, O); assert.equal(b.mitte.werke.length + b.ohne.length + b.material.size + b.daecher.reduce((a, d) => a + d.bereiche.reduce((x, y) => x + y.werke.length, 0), 0), B.monde.length); }
  const b = ordne(B, {mitte: {werke: [null, 'Zentrale · Material bekommt Form']}}); assert.ok(b.fehlt.length >= 1 && b.mitte.werke.length === 1);
});

test('Wuchs: eine nachträglich behauptete Kante wird nie Abstammung', () => {
  const s = structuredClone(state), m = B.monde.find(x => x.titel.startsWith('Zentrale')), kimi = m.samen.find(x => x.stimme === 4), claude = m.samen.find(x => x.stimme === 0);
  s.edges.push({id: 'probe-kante', edge_type: 'erweitert', from_variant_id: kimi.id, to_variant_id: claude.id, author_id: 'ralf-probe', created_at: '2030-01-01T00:00:00Z', note: 'Von Ralf im Lichtwerk verbunden.'});
  const m2 = bestand(s).monde.find(x => x.id === m.id), W2 = wuchs(m2), i = m2.samen.findIndex(x => x.id === kimi.id);
  assert.notEqual(W2.art[i], 'gabel'); assert.notEqual(W2.eltern[i], m2.samen.findIndex(x => x.id === claude.id));
});
