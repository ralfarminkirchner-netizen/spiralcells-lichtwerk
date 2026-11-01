import test from 'node:test'; import assert from 'node:assert/strict';
import {FUNKTIONEN} from '../app/js/funktion.js';
test('Jede Funktion hat einen Namen und eine Gestalt in jeder Welt', () => { for(const [k, f] of Object.entries(FUNKTIONEN)) for(const w of ['name', 'campus', 'garten', 'galaxie', 'buero']) assert.ok(f[w], k + ' ' + w); });
test('Ortsplan: jedes Werk hat einen Platz, keine zwei Grundstücke fallen zusammen', async () => {
  const {readFileSync} = await import('node:fs'), {bestand} = await import('../app/js/daten.js'); globalThis.innerWidth = 1200; globalThis.innerHeight = 800; const {Netz} = await import('../app/js/netz.js'), {ortsplan} = await import('../app/js/ortsplan.js');
  const B = bestand(JSON.parse(readFileSync('testdaten/kette-claude/state.json', 'utf8'))), N = new Netz(B, JSON.parse(readFileSync('app/ordnung.json', 'utf8'))), L = ortsplan(N, () => 0);
  assert.equal(L.pos.length, N.N); for(let a = 0; a < N.N; a++) for(let b = a + 1; b < N.N; b++) assert.ok(Math.hypot(L.pos[a][0] - L.pos[b][0], L.pos[a][2] - L.pos[b][2]) > 0.3, B.monde[a].titel + ' / ' + B.monde[b].titel); });
