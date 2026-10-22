// Alsformen: Teilnahmen, Rücknahmen, Entstehungsspuren und der Weg zur Originalstelle.
// Ein kleiner erfundener Bestand mit derselben Gestalt wie GET /api/graph (nur lesen, keine echten Texte).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bestand} from '../app/js/daten.js';
import {alsformen, rollenWort, zeitAngabe, alsSatz, mondBlickSatz, planetBlickSatz, zellSatz, teilnahmeMarke, spurMarke} from '../app/js/alsformen.js';
import {quellAdresse, quellFassung} from '../app/js/quelle.js';
import {Netz} from '../app/js/netz.js';
import {fokusZiel, echoPos, echoPhase} from '../app/js/verschraenkung.js';

const uuid = n => `0000000${n}-aaaa-4bbb-8ccc-${String(n).padStart(12, '0')}`;
const T = (h, m = 0) => `2026-10-22T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+00:00`;
const codex = {id: uuid(1), handle: 'Codex — Architektur und Prüfung', agent_type: 'model'};
const ralf = {id: uuid(2), handle: 'Ralf', agent_type: 'human'};
const werk = (n, titel, t) => ({id: uuid(100 + n), title: titel, work_type: 'text', created_at: T(8, n)});
const baum = n => ({id: uuid(200 + n), work_id: uuid(100 + n), author_id: codex.id, created_at: T(8, n)});
const fassung = (n, k, label, inhalt, extra = {}) => ({id: uuid(300 + n * 10 + k), worktree_id: uuid(200 + n), author_id: codex.id, label, content: inhalt, status: 'entwurf', created_at: T(9, n * 3 + k), ...extra});

// Quelle in der Lebensspirale: Tag, Revision, genaue Passage
const stelle = {start: 10, end: 15, quote: 'Monde'}, quelle = {kind: 'chronology', key: '2026-10-22', offset: 0, source_revision_id: 'rev_1'};
const locator = 'http://127.0.0.1:53450/?quelle=' + encodeURIComponent(JSON.stringify(quelle)) + '&stelle=' + encodeURIComponent(JSON.stringify(stelle));
const ref = {system: 'lebensspirale', kind: 'research-original', source_id: '2026-10-22@rev_1#10-15@0123456789abcdef', title: 'Originalgedanke', locator};

const g = {
  agents: [codex, ralf],
  works: [werk(1, 'Torus-Tisch · Werkversuch'), werk(2, 'Gemeinsame Gegenstände · Originalgedanke'), werk(3, 'Selbstkorrektur · Zusammenhangsvorschlag')],
  worktrees: [baum(1), baum(2), baum(3)],
  variants: [fassung(1, 0, 'Quellfassung', 'Monde'), fassung(2, 0, 'Teilnahmekarte', 'Ein Text an zwei Tischen', {source_ref: ref}), fassung(3, 0, 'Lesefrage', 'Was ändert sich?')],
  edges: [], findings: [],
  participations: [
    {id: uuid(401), work_id: uuid(101), context_work_id: uuid(102), variant_id: uuid(310), version_binding: 'pinned', role: 'Quelle', reason: 'Die fünf Sätze binden die Karte.', author_id: codex.id, status: 'active', supersedes_id: null, created_at: T(11, 51)},
    {id: uuid(402), work_id: uuid(101), context_work_id: uuid(102), variant_id: uuid(310), version_binding: 'pinned', role: 'Quelle', reason: 'Die fünf Sätze binden die Karte.', author_id: codex.id, status: 'active', supersedes_id: uuid(401), created_at: T(11, 59)},
    {id: uuid(403), work_id: uuid(101), context_work_id: uuid(103), variant_id: uuid(310), version_binding: 'pinned', role: 'Gegenbeispiel', reason: 'Die Wortspur widerspricht.', author_id: codex.id, status: 'proposed', supersedes_id: null, created_at: T(11, 52)},
    {id: uuid(404), work_id: uuid(102), context_work_id: uuid(103), variant_id: uuid(320), version_binding: 'pinned', role: 'instrument', reason: 'Als Instrument vorgeschlagen.', author_id: codex.id, status: 'proposed', supersedes_id: null, created_at: T(12, 9)},
    {id: uuid(405), work_id: uuid(102), context_work_id: uuid(103), variant_id: uuid(320), version_binding: 'pinned', role: 'instrument', reason: 'Zur Prüfung des Rückwegs zurückgenommen.', author_id: codex.id, status: 'withdrawn', supersedes_id: uuid(404), created_at: T(12, 10)},
    {id: uuid(406), work_id: uuid(999), context_work_id: uuid(102), variant_id: uuid(310), version_binding: 'pinned', role: 'Quelle', reason: 'Ein unbekannter Gegenstand.', author_id: codex.id, status: 'active', supersedes_id: null, created_at: T(12, 11)},
  ],
  emergence_events: [
    {id: uuid(503), work_id: uuid(102), title: 'Deutung', body: 'Die Korrektur präzisiert.', kind: 'interpretation', author_id: codex.id, variant_ids: [uuid(320)], source_ref: ref, event_time: null, interpretation_time: '2026-10-22', conditions: [], contradicts_event_ids: [], status: 'documented', recorded_at: T(11, 53)},
    {id: uuid(501), work_id: uuid(102), title: 'Originalgedanke', body: 'Monde um Planeten.', kind: 'origin', author_id: codex.id, variant_ids: [uuid(310)], source_ref: ref, event_time: null, interpretation_time: null, conditions: ['Gepinnte Quelle'], contradicts_event_ids: [], status: 'documented', recorded_at: T(11, 51)},
    {id: uuid(504), work_id: uuid(102), title: 'Gegenlesart', body: 'Die frühere Wortspur bleibt.', kind: 'counterevidence', author_id: codex.id, variant_ids: [], source_ref: null, event_time: null, interpretation_time: '2026-10-22', conditions: [], contradicts_event_ids: [uuid(503)], status: 'documented', recorded_at: T(11, 54)},
    {id: uuid(505), work_id: uuid(102), title: 'Vorschlag', body: 'Ein Zusammenhang könnte entstehen.', kind: 'proposal', author_id: codex.id, variant_ids: [], source_ref: null, event_time: '22.10.2026 · heute', interpretation_time: null, conditions: [], contradicts_event_ids: [], status: 'proposed', recorded_at: T(11, 55)},
  ],
};
const B = bestand(g), A = alsformen(B);
const idx = titel => B.monde.findIndex(m => m.titel.startsWith(titel));
const KENNUNG = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{12,}/i;

test('Teilnahmen: es gilt die jüngste Eintragung jeder Kette; Unbekanntes wird nicht geraten', () => {
  assert.equal(A.teilnahmen.length, 3);
  const quelleT = A.teilnahmen.find(t => t.rolle === 'Quelle');
  assert.equal(quelleT.id, uuid(402)); assert.equal(quelleT.kette.length, 2); assert.equal(quelleT.stand, 'active');
  assert.ok(quelleT.abgeloest > 0, 'die frühere Eintragung bleibt als abgelöst lesbar');
  assert.equal(A.teilnahmen.find(t => t.rolle === 'Gegenbeispiel').stand, 'proposed');
});
test('Rücknahme: der Grund der Rücknahme und die ursprüngliche Begründung bleiben getrennt', () => {
  const r = A.teilnahmen.find(t => t.stand === 'withdrawn');
  assert.equal(r.rolle, 'Instrument');
  assert.equal(r.grund, 'Als Instrument vorgeschlagen.');
  assert.equal(r.ruecknahme.grund, 'Zur Prüfung des Rückwegs zurückgenommen.');
  assert.equal(r.abgeloest, 0, 'eine Rücknahme ist keine bloße Neueintragung');
});
test('Ein Gegenstand, viele Orte: je Gegenstand und je Zusammenhang gezählt, Beteiligte vollständig', () => {
  const torus = idx('Torus'), orig = idx('Gemeinsame'), selbst = idx('Selbstkorrektur');
  assert.deepEqual(A.proGegenstand.get(torus).map(i => B.monde[A.teilnahmen[i].kontext].titel).sort(), ['Gemeinsame Gegenstände · Originalgedanke', 'Selbstkorrektur · Zusammenhangsvorschlag']);
  assert.deepEqual([...A.beteiligte(torus)].sort(), [torus, orig, selbst].sort());
  assert.ok(A.hat(orig) && A.hat(selbst) && A.hat(torus));
});
test('Rollen werden ein Wort, ob als Schlüssel oder schon als Wort gespeichert', () => {
  assert.equal(rollenWort('source'), 'Quelle'); assert.equal(rollenWort('Quelle'), 'Quelle');
  assert.equal(rollenWort('counterexample'), 'Gegenbeispiel'); assert.equal(rollenWort('instrument'), 'Instrument');
  assert.equal(rollenWort('leitmotiv'), 'Leitmotiv'); assert.equal(rollenWort(''), 'ohne benannte Rolle');
});
test('Drei Zeiten: offen bleibt offen, ein Tag bekommt keine Uhrzeit, freier Text bleibt Text', () => {
  assert.deepEqual(zeitAngabe(null), {art: 'offen', satz: 'offen', t: 0});
  const tag = zeitAngabe('2026-10-22'); assert.equal(tag.art, 'tag'); assert.equal(tag.satz, '22. Okt.'); assert.ok(!/:/.test(tag.satz));
  assert.equal(zeitAngabe(T(11, 51)).art, 'punkt'); assert.match(zeitAngabe(T(11, 51)).satz, /22\. Okt\., \d\d:\d\d/);
  assert.deepEqual(zeitAngabe('22.10.2026 · heute'), {art: 'text', satz: '22.10.2026 · heute', t: 0});
});
test('Entstehung: nach Aufzeichnung geordnet, Gegenbefund in beide Richtungen verknüpft', () => {
  const orig = idx('Gemeinsame'), liste = A.entstehung.get(orig).map(i => A.spuren[i]);
  assert.deepEqual(liste.map(s => s.art), ['origin', 'interpretation', 'counterevidence', 'proposal']);
  assert.deepEqual(liste.map(s => s.k), [0, 1, 2, 3]);
  const gegen = liste[2], deutung = liste[1];
  assert.deepEqual(gegen.widerspricht.map(j => A.spuren[j].titel), ['Deutung']);
  assert.deepEqual(deutung.widersprochen.map(j => A.spuren[j].titel), ['Gegenlesart']);
  assert.equal(liste[3].stand, 'proposed'); assert.equal(liste[3].ereignis.art, 'text');
});
test('Sätze: richtig gebeugt, ehrlich über Vorschläge und Rücknahmen, ohne Kennung', () => {
  const torus = idx('Torus'), orig = idx('Gemeinsame'), selbst = idx('Selbstkorrektur');
  assert.equal(mondBlickSatz(A, torus, B.monde[torus].titel), 'Ein Gegenstand, einmal gespeichert, in zwei weiteren Zusammenhängen: als Quelle und als Gegenbeispiel (vorgeschlagen).');
  assert.match(mondBlickSatz(A, orig, B.monde[orig].titel), /Eine Teilnahme ist zurückgenommen und bleibt sichtbar\./);
  assert.equal(zellSatz(A, orig), 'Dieser Mond trägt vier Spuren seiner Entstehung und ein Gegenstand kreist um ihn.');
  assert.equal(zellSatz(A, torus), 'Dieser Mond nimmt in zwei weiteren Zusammenhängen teil.');
  assert.match(planetBlickSatz(A, orig, B.monde[orig].titel), /als Planet: vier Spuren seiner Entstehung, innen die zuerst aufgezeichnete; bei drei ist die Ereigniszeit offen; ein Gegenstand kreist um es\.$/);
  assert.equal(alsSatz(A, selbst), 'ein Gegenstand kreist um es');
  const alle = [mondBlickSatz(A, torus, 'x'), planetBlickSatz(A, orig, 'y'), ...A.teilnahmen.map((_, i) => teilnahmeMarke(A, B, i).join(' ')), ...A.spuren.map((_, i) => spurMarke(A, i).join(' '))];
  for(const s of alle) assert.ok(!KENNUNG.test(s), 'keine Kennung im Satz: ' + s);
});
test('Originalstelle: nur ein geprüfter Weg in die Lebensspirale, an die genannte Fassung gebunden', () => {
  const karte = uuid(320);
  const url = quellAdresse(ref, karte, B.fassungen.get(karte));
  assert.ok(url && url.startsWith('http://127.0.0.1:53450/?'));
  assert.equal(new URL(url).searchParams.get('fassung'), karte);
  assert.equal(quellAdresse({...ref, locator: locator.replace('53450', '53451')}, karte), null, 'ein anderer Port ist kein Weg in die Lebensspirale');
  assert.equal(quellAdresse({...ref, source_id: '2026-10-22@rev_1#10-16@0123456789abcdef'}, karte), null, 'die Passage muss genau passen');
  assert.equal(quellAdresse({...ref, locator: 'http://127.0.0.1:53450/?stelle=' + encodeURIComponent(JSON.stringify(stelle))}, karte), null);
  assert.equal(quellAdresse({system: 'web', kind: 'x', source_id: 'y', locator: 'javascript:alert(1)'}, karte), null);
  assert.equal(quellAdresse({system: 'web', kind: 'x', source_id: 'y', locator: 'https://example.org/a'}, karte, B.fassungen.get(karte)), null, 'eine fremde Adresse ist keine gebundene Originalstelle');
  const gebunden = {...ref, locator: locator + '&fassung=' + uuid(999)};
  assert.equal(quellFassung(gebunden, [uuid(310), uuid(320)], B.fassungen), null, 'ist die genannte Fassung nicht dabei, gibt es keinen Ersatz');
  assert.equal(quellFassung(ref, [uuid(320)], B.fassungen), uuid(320));
});
test('Im Netz: alle Erscheinungen eines Gegenstands stehen in derselben Phase; der Blick fasst alle Beteiligten', () => {
  const O = JSON.parse(readFileSync('app/ordnung.json', 'utf8'));
  const N = new Netz(B, O), torus = idx('Torus');
  const [a, b] = N.als.proGegenstand.get(torus), Pa = [0, 0, 0], Pb = [0, 0, 0];
  // Phase: der Winkel auf der eigenen Bahn ist für beide gleich, zu jeder Zeit
  for(const t of [0, 3.7, 12.1]){ assert.equal(echoPhase(N.als, a, t, false), echoPhase(N.als, b, t, false));
    echoPos(N, N.als, a, t, false, Pa); echoPos(N, N.als, b, t, false, Pb); assert.ok(Number.isFinite(Pa[0]) && Number.isFinite(Pb[0])); assert.notDeepEqual(Pa, Pb, 'an verschiedenen Orten'); }
  const andere = N.als.teilnahmen.findIndex(t => t.gegenstand !== torus); assert.notEqual(echoPhase(N.als, andere, 1, false), echoPhase(N.als, a, 1, false), 'ein anderer Gegenstand hat eine andere Phase');
  echoPos(N, N.als, a, 5, true, Pa); const ruhig = [...Pa]; echoPos(N, N.als, a, 9, true, Pa); assert.deepEqual(Pa, ruhig, 'reduzierte Bewegung: die Erscheinung steht still');
  const z = fokusZiel(N, N.als, torus, 'mond');
  for(const i of N.als.beteiligte(torus)) assert.ok(Math.hypot(N.pos[i][0] - z.mitte[0], N.pos[i][2] - z.mitte[2]) <= z.R, 'jedes beteiligte Werk liegt im Blick');
  const p = fokusZiel(N, N.als, idx('Gemeinsame'), 'planet'); assert.ok(p.R >= 3.2);
});
