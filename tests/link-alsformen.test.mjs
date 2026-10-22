import test from 'node:test';
import assert from 'node:assert/strict';
import {fassungsnamen, fassung, lies, bau} from '../app/js/link.js';

const variante = (id, zeit) => ({id, label:'Lesefolge', created_at:zeit});
const mond = (...varianten) => ({keim:varianten.slice(0, 1), samen:varianten.slice(1).map(fassung => ({fassung}))});

test('Lesen, Vergleich und Alsform behalten nach Import beide gespeicherten Fassungen', () => {
  const original = variante('intern-original', '2026-06-09T08:00:00Z');
  const hier = variante('intern-hier', '2026-10-19T08:00:00Z');
  const gegenueber = variante('intern-gegenueber', '2026-10-20T08:00:00Z');
  const M = mond(original, hier, gegenueber), namen = fassungsnamen(M);
  const link = bau('spirale', 'kinos', {fassung:namen.get(hier.id), vergleich:namen.get(gegenueber.id),
    blick:'geschichte', lesen:true, stelle:3, als:'planet'});
  const ziel = lies(link);
  assert.deepEqual(ziel, {mond:'spirale', von:'kinos', fassung:namen.get(hier.id),
    vergleich:namen.get(gegenueber.id), blick:'geschichte', lesen:true, stelle:4, als:'planet'});
  const importiert = variante('intern-import', '2026-01-02T08:00:00Z');
  const erneut = mond(original, importiert, gegenueber, hier);
  assert.strictEqual(fassung(erneut, ziel.fassung), hier);
  assert.strictEqual(fassung(erneut, ziel.vergleich), gegenueber);
  assert.equal(bau('spirale', 'kinos', {...ziel, stelle:ziel.stelle - 1}), link,
    'Weitergeben verwendet den nullbasierten Index des Leseraums');
});

test('Die Frageansicht ersetzt keine genaue Keimfassung', () => {
  const a = variante('intern-frage', '2026-06-09T08:00:00Z'), M = mond(a);
  const ziel = lies(bau('spirale', null, {fassung:fassungsnamen(M).get(a.id), frage:true, lesen:true, stelle:0}));
  assert.equal(ziel.frage, true);
  assert.equal(ziel.stelle, 1);
  assert.strictEqual(fassung(M, ziel.fassung), a);
  assert.equal(bau('spirale', null, {frage:true}), '#mond=spirale&frage=1', 'ein alter Frageeingang bleibt möglich');
});

test('Passagen sind nullbasierte Caller-Indizes und einsbasierte sichtbare Zahlen', () => {
  for(const index of [0, 3, 99998]) {
    const link = bau('spirale', null, {lesen:true, stelle:index});
    assert.equal(lies(link).stelle - 1, index);
    assert.equal(lies(link).lesen, true);
  }
  for(const index of [-1, 0.5, 99999, Infinity, '3', null, undefined])
    assert.equal(bau('spirale', null, {lesen:true, stelle:index}), '#mond=spirale&lesen=1');
  assert.equal(bau('spirale', null, {stelle:0}), '#mond=spirale', 'keine offene Lesestelle ohne Lesen');
  for(const wert of ['0', '-1', '1.5', '01', '100000', '', 'quelle'])
    assert.equal(lies('#mond=spirale&lesen=1&stelle=' + wert).stelle, null, wert);
});

test('Fassungs- und Vergleichsnamen verwenden denselben Vertrag und keine beweglichen Indizes', () => {
  for(const key of ['fassung', 'vergleich']) {
    for(const wert of ['3', 3, 'c91a6299-1bd7-46f4-ad90-6cef7db784fb', 'source_91447b389aecec7d86e3', '../fremd']) {
      assert.equal(lies('#mond=spirale&' + key + '=' + encodeURIComponent(wert))[key], null);
      assert.equal(bau('spirale', null, {[key]:wert}), '#mond=spirale');
    }
    assert.equal(lies('#mond=spirale&' + key + '=erste&' + key + '=erste')[key], null);
  }
  const a = variante('intern-eins', null), b = variante('intern-zwei', null), M = mond(a, b);
  assert.equal(fassung(M, lies(bau('spirale', null, {vergleich:fassungsnamen(M).get(a.id)})).vergleich), null,
    'auch ein Vergleich errät keine mehrdeutige Fassung');
});

test('Doppelte und ungültige Ansichtsangaben werden nicht aus dem ersten Wert geraten', () => {
  for(const [key, wert] of Object.entries({mond:'spirale', von:'kinos', als:'planet', lesen:'1', frage:'1', stelle:'4', blick:'geschichte'}))
    assert.equal(lies('#mond=spirale&' + key + '=' + wert + '&' + key + '=' + wert)[key], null, key);
  for(const [key, wert] of Object.entries({als:'stern', lesen:'true', frage:'0'}))
    assert.equal(lies('#mond=spirale&' + key + '=' + wert)[key], null, key);
  assert.equal(bau('spirale', null, {lesen:'1', frage:1, als:'stern', stelle:3}), '#mond=spirale');
});

test('Bestehende Standardlinks und geschlossene Ansichten bleiben unverändert', () => {
  assert.equal(bau('spirale', 'kinos'), '#mond=spirale&von=kinos');
  assert.deepEqual(lies('#mond=spirale&von=kinos'), {mond:'spirale', von:'kinos'});
  assert.equal(bau('spirale', null, {lesen:false, frage:false, stelle:0}), '#mond=spirale');
  assert.equal(bau('spirale', null, {als:'mond'}), '#mond=spirale&als=mond');
  assert.equal(bau('spirale', null, {als:'planet'}), '#mond=spirale&als=planet');
});
