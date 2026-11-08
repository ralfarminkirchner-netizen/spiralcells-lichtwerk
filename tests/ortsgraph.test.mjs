// Ralfs Ordnung als Graph (08.11.2026): Orte sind Knoten im Fundus, ein Werk liegt einmal und erscheint an jedem seiner Orte.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {bestand} from '../app/js/daten.js';
import {hatOrtsgraph, ordnungAusGraph, ortsgraph, auchSatz} from '../app/js/ortsgraph.js';
import {ordne, lage} from '../app/js/ordnung.js';

globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {Netz} = await import('../app/js/netz.js');

// Ein kleiner Export: zwei Oberdächer und die Mitte, zwei Apps, drei Werke; „Lied“ gehört zu MUSiC und WRiTING
const werk = (id, title, work_type = 'App-Variante') => ({id, title, work_type, tags: [], source_ref: null, created_at: '2026-11-08T00:00:00Z'});
const kante = (von, zu) => ({von, zu, art: 'gehört zu', form: 'B', gespeichert: true, relation: ['B', 'x', 'gehört zu', von, zu, 'h'], geltung: 'deutung'});
const klein = () => ({
  agents: [], worktrees: [], variants: [], edges: [], findings: [],
  works: [werk('o1', 'MUSiC', 'Oberdach'), werk('o2', 'WRiTING', 'Oberdach'), werk('om', 'Mitte', 'Mitte'),
    werk('a1', 'Liederbuch', 'App'), werk('a2', 'Textwerkstatt', 'App'), werk('a3', 'Werkzeug', 'App'),
    werk('w1', 'Lied'), werk('w2', 'Gedicht'), werk('w3', 'Hilfe'), werk('w4', 'Lose')],
  fundus: {kanten: [kante('a1', 'o1'), kante('a2', 'o2'), kante('a3', 'om'), kante('w1', 'a1'), kante('w1', 'a2'), kante('w2', 'a2'), kante('w3', 'a3'),
    {von: 'w4', zu: 'o1', art: 'nahe', form: 'B', gespeichert: false}]},
});

test('Ortsgraph: erkannt nur, wenn Orte und „gehört zu“ im Export stehen', () => {
  assert.equal(hatOrtsgraph(klein()), true);
  const ohneOrte = klein(); ohneOrte.works = ohneOrte.works.filter(w => !['o1', 'o2', 'om'].includes(w.id));
  assert.equal(hatOrtsgraph(ohneOrte), false);
  assert.equal(hatOrtsgraph({works: [], fundus: {kanten: []}}), false);
});

test('Ortsgraph: Orte sind keine Werke, die Apps tragen ihre Werke, ein Werk kennt alle seine Orte', () => {
  const g = klein(), B = bestand(g), G = ortsgraph(g);
  assert.deepEqual(B.monde.map(m => m.titel).sort(), ['Gedicht', 'Hilfe', 'Lied', 'Liederbuch', 'Lose', 'Textwerkstatt', 'Werkzeug']);
  assert.deepEqual([...G.orteVon.get('w1')].map(G.name), ['MUSiC', 'WRiTING'], 'feste Folge der Orte');
  assert.equal(auchSatz(['MUSiC', 'WRiTING', 'PERSONAL'], 'MUSiC'), 'auch in WRiTING · PERSONAL');
  assert.equal(auchSatz(['MUSiC'], 'MUSiC'), '');
});

test('Ordnung aus dem Graph: jedes Werk einmal mit Leib, an jedem weiteren Ort als Spiegel; Berechnetes ordnet nichts', () => {
  const g = klein(), B = bestand(g), O = ordnungAusGraph(g, {material: []}), baum = ordne(B, O), idx = t => B.monde.findIndex(m => m.titel === t);
  assert.equal(baum.quelle, 'fundus'); assert.equal(baum.bestaetigt, false, 'ein Vorschlag, bis Ralf ihn bestätigt');
  const gezaehlt = [...baum.mitte.werke, ...baum.daecher.flatMap(d => d.bereiche.flatMap(b => b.werke)), ...baum.ohne];
  assert.equal(gezaehlt.length, B.monde.length); assert.equal(new Set(gezaehlt).size, B.monde.length, 'jeder Mond genau einmal mit Leib');
  assert.deepEqual(baum.daecher.map(d => d.name), ['MUSiC', 'WRiTING']);
  assert.deepEqual(baum.mitte.werke.map(i => B.monde[i].titel), ['Werkzeug', 'Hilfe']);
  assert.deepEqual(baum.spiegel.map(s => [B.monde[s.i].titel, baum.daecher[s.dach].name]), [['Lied', 'WRiTING']]);
  assert.deepEqual(baum.auch.get('w1'), ['MUSiC', 'WRiTING']);
  assert.deepEqual(baum.ohne.map(i => B.monde[i].titel), ['Lose'], 'berechnete Nähe ist keine Zuordnung');
  assert.equal(baum.ort[idx('Lied')].dach, 0, 'der Leib steht am ersten Ort');
  const L = lage(baum, B.monde.map(() => 0.5));
  assert.equal(L.spiegel.length, 1); assert.ok(L.spiegel[0], 'der Spiegel hat seinen Platz');
  const w = L.daecher[1].bereiche[0], d = Math.hypot(L.spiegel[0][0] - w.mitte[0], L.spiegel[0][2] - w.mitte[2]);
  assert.ok(d <= w.R + 0.01, 'der Spiegel liegt in der App, zu der das Werk dort gehört');
});

test('Netz: mit Orten im Export gilt der Graph, die alte Datei liefert nur das Lesematerial', () => {
  const g = klein(), B = bestand(g), N = new Netz(B, {mitte: {werke: ['Lied']}, daecher: [{name: 'Alt', bereiche: [{name: 'x', werke: ['Gedicht']}]}], material: []});
  assert.deepEqual(N.daecher.map(d => d.name), ['MUSiC', 'WRiTING']);
  assert.equal(N.spiegel.length, 1); assert.ok(N.spiegel[0].pos);
});

test('Netz: ohne Orte im Export bleibt die Baumdatei gültig (nichts geändert)', () => {
  const g = klein(); g.works = g.works.filter(w => !['o1', 'o2', 'om'].includes(w.id));
  const B = bestand(g), N = new Netz(B, {mitte: {werke: ['Hilfe']}, daecher: [{name: 'Alt', bereiche: [{name: 'x', werke: ['Gedicht']}]}], material: []});
  assert.equal(N.baum.quelle, 'datei'); assert.deepEqual(N.daecher.map(d => d.name), ['Alt']); assert.equal(N.spiegel.length, 0);
});

// Mit dem echten Fundus-Export (außerhalb von Git): jedes Werk einmal, Spiegel nur, wo der Fundus mehrere Orte nennt
const PFAD = 'testdaten/fundus/graph.json', g = existsSync(PFAD) ? JSON.parse(readFileSync(PFAD, 'utf8')) : null;
test('Fundus: Ordnung als Graph aus dem echten Export', {skip: g && hatOrtsgraph(g) ? false : 'Export ohne Orte (fundus export --graph)'}, () => {
  const B = bestand(g), N = new Netz(B, JSON.parse(readFileSync('app/ordnung.json', 'utf8'))), b = N.baum;
  const gezaehlt = [...b.mitte.werke, ...b.daecher.flatMap(d => d.bereiche.flatMap(x => x.werke)), ...b.ohne, ...b.material.keys()];
  assert.equal(new Set(gezaehlt).size, B.monde.length);
  assert.ok(!B.monde.some(m => ['Oberdach', 'Mitte', 'Tragwerk', 'Sammlung'].includes(m.art)), 'Orte sind keine Werke');
  for(const s of N.spiegel){ assert.ok(s.pos); assert.notEqual(s.i, null); }
  const G = ortsgraph(g); for(const [id, orte] of b.auch) assert.deepEqual(orte, G.orteVon.get(id).map(G.name));
});
