import test from 'node:test'; import assert from 'node:assert/strict';
import {FUNKTIONEN} from '../app/js/funktion.js';
test('Jede Funktion hat einen Namen und eine Gestalt in jeder Welt', () => { for(const [k, f] of Object.entries(FUNKTIONEN)) for(const w of ['name', 'campus', 'garten', 'galaxie', 'buero']) assert.ok(f[w], k + ' ' + w); });
