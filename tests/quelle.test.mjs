import test from 'node:test';
import assert from 'node:assert/strict';
import {quellFassung, quellAdresse, quellName} from '../app/js/quelle.js';

function readerFassung(id = 'gespeicherte-fassung'){
  const quelle = {kind:'research', key:'a'.repeat(64), source_revision_id:'b'.repeat(64), offset:0};
  const stelle = {start:2, end:7, quote:'Tor😀'};
  const url = new URL('http://127.0.0.1:53450/');
  url.searchParams.set('quelle', JSON.stringify(quelle));
  url.searchParams.set('stelle', JSON.stringify(stelle));
  return {id, label:'Ein Inhalt, viele Verwendungen', content:'Die vorhandene Bearbeitung.',
    source_ref:{system:'lebensspirale', kind:'research-original',
      source_id:`${quelle.key}@${quelle.source_revision_id}#2-7@0123456789abcdef`,
      content_sha256:quelle.source_revision_id, locator:url.href}};
}

function vaultFassung(){
  const v = readerFassung();
  const url = new URL(v.source_ref.locator);
  return {...v, source_ref:{system:'vault', locator:'/registered/vault/Original.md', content_sha256:'b'.repeat(64)},
    reader_source:{source_ref:v.source_ref,
      source:JSON.parse(url.searchParams.get('quelle')),
      selection:JSON.parse(url.searchParams.get('stelle')),
      vault_path:'/registered/vault/Original.md', actual_file:{exists:true, revision_matches:false}}};
}

function parameterAendern(ref, key, mutate){
  const url = new URL(ref.locator), value = JSON.parse(url.searchParams.get(key));
  mutate(value); url.searchParams.set(key, JSON.stringify(value)); ref.locator = url.href;
}

test('vorhandene Reader-Fassung und genaue UTF-16-Passage bleiben gebunden', () => {
  const v = readerFassung(), vorher = structuredClone(v);
  const url = new URL(quellAdresse(v.source_ref, v.id, v));
  assert.equal(url.searchParams.get('fassung'), v.id);
  assert.deepEqual(JSON.parse(url.searchParams.get('stelle')), {start:2, end:7, quote:'Tor😀'});
  assert.equal(JSON.parse(url.searchParams.get('quelle')).source_revision_id, 'b'.repeat(64));
  assert.deepEqual(v, vorher);
});

test('Vault-Rückweg verwendet ausschließlich die transiente gebundene Reader-Quelle', () => {
  const v = vaultFassung(), vorher = structuredClone(v), ids = [v.id], varianten = new Map([[v.id, v]]);
  assert.equal(quellFassung(v.source_ref, ids, varianten), v.id);
  const url = new URL(quellAdresse(v.source_ref, v.id, v));
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.searchParams.get('fassung'), v.id);
  assert.equal(JSON.parse(url.searchParams.get('quelle')).source_revision_id, v.source_ref.content_sha256);
  assert.deepEqual(v, vorher, 'der aktuelle Dateistand ersetzt keine gespeicherte Revision');
});

test('fehlende Fassung, falsche Variantenkennung oder fremde Quelle erhalten keinen Link', () => {
  const v = readerFassung();
  assert.equal(quellAdresse(v.source_ref, v.id), null);
  assert.equal(quellAdresse(v.source_ref, 'fremde-fassung', v), null);
  assert.equal(quellAdresse({...v.source_ref, source_id:'andere-quelle'}, v.id, v), null);
  assert.equal(quellAdresse({...v.source_ref, content_sha256:'c'.repeat(64)}, v.id, v), null);
  assert.equal(quellFassung(v.source_ref, ['fehlt'], new Map([[v.id, v]])), null);
});

test('abweichende Passage oder Revision der angefragten Referenz wird nicht durch die richtige Variante verdeckt', () => {
  for(const mutate of [
    ref => parameterAendern(ref, 'stelle', s => {s.start = 3; s.end = 8;}),
    ref => parameterAendern(ref, 'stelle', s => {s.quote = 'Faux!';}),
    ref => parameterAendern(ref, 'quelle', q => {q.source_revision_id = 'c'.repeat(64);}),
  ]){
    const v = readerFassung(), ref = structuredClone(v.source_ref); mutate(ref);
    assert.equal(quellAdresse(ref, v.id, v), null);
  }
});

test('Vault-Bindung lehnt falschen Pfad, Passage, Revision und fehlende Resolverantwort ab', () => {
  for(const mutate of [
    v => {delete v.reader_source;},
    v => {v.reader_source.vault_path = '/other/Original.md';},
    v => {v.reader_source.selection.quote = 'FALSCH';},
    v => {v.reader_source.source.source_revision_id = 'c'.repeat(64);},
    v => {v.reader_source.source_ref.content_sha256 = 'c'.repeat(64);},
    v => parameterAendern(v.reader_source.source_ref, 'quelle', q => {q.source_revision_id = 'c'.repeat(64);}),
  ]){
    const v = vaultFassung(); mutate(v);
    assert.equal(quellAdresse(v.source_ref, v.id, v), null);
  }
  const v = vaultFassung();
  assert.equal(quellAdresse({...v.source_ref, locator:'/other/Original.md'}, v.id, v), null);
});

test('explizite Fassungswahl bleibt erhalten; mehrere passende Fassungen werden nicht nach Reihenfolge gewählt', () => {
  const a = readerFassung('erste-fassung'), b = readerFassung('zweite-fassung');
  const varianten = new Map([[a.id, a], [b.id, b]]), ids = [a.id, b.id];
  assert.equal(quellFassung(a.source_ref, ids, varianten), null);
  const ref = structuredClone(a.source_ref), url = new URL(ref.locator);
  url.searchParams.set('fassung', b.id); ref.locator = url.href;
  assert.equal(quellFassung(ref, ids, varianten), b.id);
  url.searchParams.set('fassung', 'nicht-vorhanden'); ref.locator = url.href;
  assert.equal(quellFassung(ref, ids, varianten), null);
});

test('externe Adressen sind keine geprüfte genaue Originalpassage', () => {
  const v = readerFassung();
  v.source_ref = {system:'extern', kind:'seite', source_id:'beleg', locator:'https://example.org/'};
  assert.equal(quellAdresse(v.source_ref, v.id, v), null);
  assert.equal(quellFassung(v.source_ref, [v.id], new Map([[v.id, v]])), null);
});

test('Quellnamen verwenden verständliche Herkunft ohne technische Kennungen', () => {
  assert.equal(quellName(vaultFassung().source_ref), 'aus dem Vault');
  assert.equal(quellName(readerFassung().source_ref), 'in der Lebensspirale');
  assert.equal(quellName({system:'extern', locator:'https://example.org/'}), 'an der Quelle');
  assert.equal(quellName(null), 'an der Quelle');
});
