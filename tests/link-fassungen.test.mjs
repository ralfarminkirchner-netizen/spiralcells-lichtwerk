import test from 'node:test';
import assert from 'node:assert/strict';
import {fassungsnamen, fassung, lies, bau} from '../app/js/link.js';

const variant = (id, label, created_at) => ({id, label, created_at, content: `Unveränderter Text von ${id}`});
const mond = (...varianten) => ({keim: varianten.slice(0, 1), samen: varianten.slice(1).map(fassung => ({fassung}))});

test('Fassungslinks behalten nach späterem und rückdatiertem gleichnamigem Import ihre echte Fassung', () => {
  const alt = variant('intern-alt', 'Lesematrix · ursprüngliche Folge', '2026-06-09T08:00:00Z');
  const mitte = variant('intern-mitte', 'Lesematrix · ursprüngliche Folge', '2026-10-19T09:00:00Z');
  const neu = variant('intern-neu', 'Lesematrix · ursprüngliche Folge', '2026-10-19T12:05:00Z');
  const vorher = fassungsnamen(mond(alt, mitte));
  const rueckdatiert = variant('intern-import', alt.label, '2026-01-02T07:00:00Z');
  const bestand = mond(alt, rueckdatiert, neu, mitte);
  const nachher = fassungsnamen(bestand);
  assert.equal(vorher.get(alt.id), 'lesematrix-urspruengliche-folge-9-juni-2026-um-08-00-00-utc');
  assert.equal(nachher.get(mitte.id), 'lesematrix-urspruengliche-folge-19-okt-2026-um-09-00-00-utc');
  assert.equal(nachher.get(neu.id), 'lesematrix-urspruengliche-folge-19-okt-2026-um-12-05-00-utc');
  for(const [id, name] of vorher) assert.equal(nachher.get(id), name);
  for(const v of [alt, mitte]) {
    const url = bau('spiralwellentexte', 'kinos', {fassung: vorher.get(v.id), blick: 'geschichte'});
    const erneut = fassung(bestand, lies(url).fassung);
    assert.strictEqual(erneut, v, 'Reload muss die konkrete gespeicherte Fassung öffnen');
    assert.equal(erneut.content, v.content);
  }
  assert.strictEqual(fassung(bestand, nachher.get(neu.id)), neu);
  assert.equal(fassung(mond(alt), nachher.get(neu.id)), null, 'kein Sprung zu einer anderen Fassung');
  assert.equal(fassung(mond(alt), alt.id), null, 'interne Identität ist kein Linkname');
  assert.equal(fassung(bestand, 'lesematrix-urspruengliche-folge'), null, 'alter ungebundener Titel wird nicht neu zugeordnet');
});

test('Nur echte Keime und Fassungen zählen; Kennungen und Pfade werden keine Linknamen', () => {
  const original = variant('quelle-intern', 'Original', '2026-06-09T08:00:00Z');
  const technisch = variant('intern-zwei', 'c91a6299-1bd7-46f4-ad90-6cef7db784fb /Volumes/Privat/quelle', '2026-10-22T08:00:00Z');
  const M = {keim: [original], samen: [{fassung: original}, {fassung: technisch}, {id: 'ohne-fassung', label: 'Kein Beleg'}]};
  const namen = fassungsnamen(M);
  assert.deepEqual([...namen.keys()], [original.id, technisch.id]);
  assert.equal(namen.get(technisch.id), 'unbenannte-fassung-22-okt-2026-um-08-00-00-utc');
  assert.strictEqual(fassung(M, namen.get(original.id)), original);
  assert.deepEqual([...fassungsnamen(null)], []);
  assert.equal(fassung(M, null), null);
  assert.equal(original.label, 'Original', 'Originaldaten bleiben unverändert');
});

test('Fehlende oder gleiche Angaben bleiben stabil und werden bei Mehrdeutigkeit nicht erraten', () => {
  const a = variant('a-intern', '', null), b = variant('b-intern', null, 'unbekannt');
  assert.deepEqual([...fassungsnamen(mond(b, a))], [...fassungsnamen(mond(a, b))]);
  const benannt = fassungsnamen(mond(a, b));
  assert.equal(new Set(benannt.values()).size, 1, 'keine beweglichen Ordnungsnummern');
  assert.equal(benannt.get(a.id), 'unbenannte-fassung-ohne-verlaessliches-datum');
  assert.strictEqual(fassung(mond(a), benannt.get(a.id)), a);
  assert.equal(fassung(mond(a, b), benannt.get(a.id)), null, 'späterer Import darf keine andere undatierte Fassung wählen');
  const c = variant('c-intern', 'Lesefolge', '2026-10-22T08:00:00Z');
  const d = variant('d-intern', c.label, c.created_at);
  const vorImport = fassungsnamen(mond(c)).get(c.id);
  assert.equal(fassungsnamen(mond(c, d)).get(c.id), vorImport);
  assert.equal(fassung(mond(c, d), vorImport), null, 'identische Angaben sind kein Identitätsbeweis');
  assert.equal(fassung(mond(d, c), vorImport), null, 'auch nicht in anderer Reihenfolge');
});

test('Datum, Sekunde, Sekundenbruchteil und Zeitzone unterscheiden echte Fassungen ohne Kennungen', () => {
  const werte = ['2026-10-22T08:00:00.123456Z', '2026-10-22T08:00:00.123457Z',
    '2026-10-22T08:00:01Z', '2026-10-22T08:00:00+02:00', '2026-10-22T08:00:00-02:00', '2026-10-22'];
  const varianten = werte.map((zeit, i) => variant(`nur-intern-${i}`, 'Eine sehr lange verständliche Lesematrix mit einer ursprünglichen Reihenfolge und weiteren Angaben', zeit));
  const M = mond(...varianten), benannt = fassungsnamen(M);
  assert.equal(new Set(benannt.values()).size, varianten.length);
  for(const v of varianten) {
    const slug = benannt.get(v.id);
    assert.ok(/^[a-z0-9-]{1,90}$/.test(slug), slug);
    assert.ok(!slug.includes(v.id));
    const url = bau('spirale', null, {fassung: slug});
    assert.strictEqual(fassung(M, lies(url).fassung), v, 'Validator und Auflösung bewahren die tatsächliche Bindung');
  }
  assert.ok(benannt.get(varianten.at(-1).id).endsWith('-22-okt-2026-ohne-uhrzeit'), 'keine erfundene Uhrzeit');
  for(const zeit of ['2026-02-30', '2026-10-22T24:00:00Z', '2026-10-22T08:00:00'])
    assert.equal(fassungsnamen(mond(variant('ungueltig', 'Original', zeit))).get('ungueltig'), 'original-ohne-verlaessliches-datum');
});

test('Alte Links bleiben gleich; Fassung und Geschichte werden ausdrücklich gebunden', () => {
  assert.equal(bau('spiralwellentexte', 'kinos'), '#mond=spiralwellentexte&von=kinos');
  assert.deepEqual(lies('#mond=spiralwellentexte&von=kinos'), {mond: 'spiralwellentexte', von: 'kinos'});
  const link = bau('spiralwellentexte', 'kinos', {fassung: 'lesematrix-19-okt', blick: 'geschichte'});
  assert.equal(link, '#mond=spiralwellentexte&von=kinos&fassung=lesematrix-19-okt&blick=geschichte');
  assert.deepEqual(lies(link), {mond: 'spiralwellentexte', von: 'kinos', fassung: 'lesematrix-19-okt', blick: 'geschichte'});
});

test('Ungültige, doppelte oder technische Fassungsangaben werden nicht als Ersatz übernommen', () => {
  for(const wert of ['../quelle', 'https://fremd.example', 'Eine Fassung', 'c91a6299-1bd7-46f4-ad90-6cef7db784fb', 'source_91447b389aecec7d86e3', '91447b389aecec7d86e3']) {
    assert.equal(lies('#mond=spirale&fassung=' + encodeURIComponent(wert)).fassung, null, wert);
    assert.equal(bau('spirale', null, {fassung: wert}), '#mond=spirale', wert);
  }
  assert.equal(lies('#mond=spirale&fassung=erste&fassung=zweite').fassung, null);
  assert.equal(lies('#mond=spirale&blick=geschichte&blick=anders').blick, null);
  assert.deepEqual(lies('#mond=spirale&blick=fremd'), {mond: 'spirale', von: null, blick: null});
  assert.equal(bau('spirale', '__proto__', {blick: 'fremd'}), '#mond=spirale');
  assert.equal(bau('spirale&fassung=ungeprueft'), '');
});
