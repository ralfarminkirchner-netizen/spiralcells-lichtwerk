import test from 'node:test';
import assert from 'node:assert/strict';
import {teilnahmeAblegen, teilnahmeZuruecknehmen, entstehungAblegen, Ruhe, Abgelehnt} from '../app/js/schreiben.js';

test('Belege verwenden exakt die vorhandenen Mooncells-Wege und unveränderte Daten', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    calls.push({path, init});
    return {status:201, ok:true, json:async () => ({id:'synthetic-record'})};
  });
  const body = {author_id:'synthetic-actor', source_ref:{system:'vault', locator:'/synthetic/only'}, variant_id:'synthetic-version'};
  await teilnahmeAblegen(body);
  await teilnahmeZuruecknehmen('synthetic/id?wrong', {author_id:'synthetic-actor', reason:'Rücknahme'});
  await entstehungAblegen(body);
  assert.deepEqual(calls.map(c => c.path), ['/api/participations', '/api/participations/synthetic%2Fid%3Fwrong/withdraw', '/api/emergence-events']);
  for(const {init} of calls){
    assert.equal(init.method, 'POST');
    assert.equal(init.cache, 'no-store');
  }
  assert.deepEqual(JSON.parse(calls[0].init.body), body);
  assert.deepEqual(JSON.parse(calls[2].init.body), body);
});

test('Unklare Belegantworten verlangen Bestandslesen und werden nie wiederholt', async t => {
  const fetch = t.mock.method(globalThis, 'fetch');
  const cases = [
    async () => {throw new TypeError('synthetic connection failure');},
    async () => ({status:201, ok:true, json:async () => {throw new SyntaxError('synthetic bad JSON');}}),
    async () => ({status:201, ok:true, json:async () => ({})}),
    async () => ({status:502, ok:false, json:async () => ({})}),
    async () => ({status:503, ok:false, json:async () => ({})}),
    async () => ({status:408, ok:false, json:async () => ({})}),
  ];
  for(const result of cases){
    fetch.mock.mockImplementation(result);
    const before = fetch.mock.callCount();
    await assert.rejects(teilnahmeAblegen({}), e => e instanceof Ruhe && /unklar/.test(e.message) && /Bestand neu/.test(e.message));
    assert.equal(fetch.mock.callCount(), before + 1);
  }
});

test('Fachliche Ablehnung bleibt eine Ablehnung ohne erneuten POST', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => ({status:422, ok:false,
    json:async () => ({satz:'Die Teilnahme wurde nicht angenommen.'})}));
  await assert.rejects(teilnahmeZuruecknehmen('synthetic-participation', {}),
    e => e instanceof Abgelehnt && e.status === 422 && e.message === 'Die Teilnahme wurde nicht angenommen.');
  assert.equal(fetch.mock.callCount(), 1);
});
