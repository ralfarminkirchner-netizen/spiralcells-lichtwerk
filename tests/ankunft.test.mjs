// Wiederkommen (Etappe 4) und lesbare Links (Etappe 5), gegen die gesicherte state.json (nur lesen).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {bestand} from '../app/js/daten.js';
import {neuSeit, satzAus, zahlenVon, ankunftSatz, letzte, zuletztSatzAus, ZULETZT} from '../app/js/ankunft.js';
import {grundname, namen, lies, bau, VON} from '../app/js/link.js';

const datei = readdirSync('sicherung').filter(f => f.startsWith('state-vor-start-')).sort()[0];
const state = JSON.parse(readFileSync('sicherung/' + datei, 'utf8'));

test('Ankunftssatz wie im Server, an denselben Beispielen', () => {
  // tests/test_neu.py prüft die Python-Fassung an genau diesen Beispielen
  for(const b of JSON.parse(readFileSync('tests/ankunft-beispiele.json', 'utf8'))) assert.equal(satzAus(b.zahlen), b.satz);
});

test('Ohne Merker ist nichts neu; Ralfs Einträge und Formen nie', () => {
  const B = bestand(state);
  assert.equal(ankunftSatz(neuSeit(B, null)), 'Seit deinem letzten Besuch ist nichts dazugekommen.');
  const s = structuredClone(state), Z = bestand(state).monde.find(m => m.titel.startsWith('Zentrale'));
  const codex = s.agents.find(a => /^codex/i.test(a.handle)), baum = s.worktrees.find(t => t.work_id === Z.id && t.author_id === codex.id);
  s.agents.push({id: 'ralf-probe', agent_type: 'human', handle: 'Ralf'});
  s.worktrees.push({id: 'baum-ralf', work_id: Z.id, author_id: 'ralf-probe', created_at: '2026-10-21T08:00:00+00:00'});
  const neu = (id, wo, wer, t, extra = {}) => ({id, worktree_id: wo, author_id: wer, label: id, content: 'Text.', notes: '', created_at: t, derived_from: null, status: 'entwurf', tags: [], ...extra});
  s.variants.push(neu('codex-1', baum.id, codex.id, '2026-10-21T08:00:00+00:00'), neu('codex-2', baum.id, codex.id, '2026-10-21T09:30:00+02:00'),
    neu('ralf-1', 'baum-ralf', 'ralf-probe', '2026-10-21T08:05:00+00:00'),
    neu('form-1', 'baum-ralf', 'ralf-probe', '2026-10-21T08:06:00+00:00', {content: '<!doctype html><p>x</p>', notes: 'Form ohne Modell · KiNFORMER · Karten. 1 Karte.'}));
  s.edges.push({id: 'k-form', edge_type: 'verweist-auf', from_variant_id: 'form-1', to_variant_id: 'codex-1', author_id: 'ralf-probe', created_at: '2026-10-21T08:06:01+00:00'});
  const B2 = bestand(s), seit = Date.parse('2026-10-21T07:00:00Z');
  const n = neuSeit(B2, seit);
  assert.equal(n.zahl, 2, 'nur die zwei von Codex; Ralfs Einwurf und seine Form zählen nicht');
  assert.equal(ankunftSatz(n), 'Seit deinem letzten Besuch eingetragen: zwei Ausprägungen von Codex.');
  assert.equal(n.juengster, Z.id);
  assert.deepEqual(n.monde.get(Z.id).map(x => x.id), ['codex-2', 'codex-1'], 'in echter Reihenfolge (09:30+02:00 ist früher als 08:00Z)');
  // UTC verglichen: 09:30+02:00 ist 07:30Z, also nach 07:00Z, aber vor 07:45Z
  assert.equal(neuSeit(B2, Date.parse('2026-10-21T07:45:00Z')).zahl, 1);
  assert.deepEqual(zahlenVon(neuSeit(B2, Date.parse('2026-10-21T08:30:00Z'))).stimmen, []);
});

test('Lesbare Namen: der kurze Name gehört dem ältesten Mond dieses Titels', () => {
  for(const b of JSON.parse(readFileSync('tests/link-beispiele.json', 'utf8'))) assert.equal(grundname(b.titel), b.name, b.titel);
  const monde = [
    {titel: 'Doppelt', werk: {created_at: '2026-10-19T12:05:00+00:00'}},
    {titel: 'Doppelt', werk: {created_at: '2026-10-12T08:00:00+00:00'}},
    {titel: 'Doppelt', werk: {created_at: '2026-10-19T09:00:00+00:00'}},
    {titel: 'Anders', werk: {created_at: '2026-10-01T08:00:00+00:00'}},
  ];
  assert.deepEqual(namen(monde), ['doppelt-19-okt-1405', 'doppelt', 'doppelt-19-okt', 'anders']);
  const echt = namen(bestand(state).monde);
  assert.equal(new Set(echt).size, echt.length, 'jeder Name nur einmal');
  assert.ok(echt.every(n => /^[a-z0-9-]{1,90}$/.test(n)));
});

test('Link lesen: nur bekannte Schlüssel und feste Herkunft', () => {
  const mv = l => ({mond: l.mond, von: l.von});
  assert.deepEqual(mv(lies('#mond=zentrale-material-bekommt-form&von=sternwerft')), {mond: 'zentrale-material-bekommt-form', von: 'sternwerft'});
  assert.deepEqual(mv(lies('#mond=x&von=http://evil.example')), {mond: 'x', von: null});
  assert.deepEqual(mv(lies('#mond=../etc&von=kinos')), {mond: null, von: 'kinos'});
  assert.deepEqual(mv(lies('#mond=Zentrale')), {mond: null, von: null}, 'nur Kleinbuchstaben');
  // Die genaue Stelle bleibt lesbar: Fassung und Passage als kleine Zahlen, nie eine Kennung
  assert.deepEqual(lies('#mond=x&fassung=3&lesen=1&stelle=4'), {mond: 'x', von: null, fassung: 3, stelle: 4, lesen: true, vergleich: null, frage: false});
  assert.equal(bau('x', null, {frage: true, lesen: true, stelle: 0}), '#mond=x&frage=1&lesen=1&stelle=1');
  assert.equal(lies('#mond=x&fassung=a1b2c3d4-0000').fassung, null);
  assert.equal(bau('x', null, {fassung: 3, lesen: true, stelle: 3}), '#mond=x&fassung=3&lesen=1&stelle=4');
  assert.equal(bau('x', null, {fassung: 3}), '#mond=x&fassung=3');
  assert.equal(bau('emile-durkheim', 'kinos'), '#mond=emile-durkheim&von=kinos');
  assert.equal(bau('emile-durkheim', 'fremd'), '#mond=emile-durkheim');
  for(const v of Object.values(VON)) assert.ok(v.adresse.startsWith('http://127.0.0.1:'));
});

test('Die letzten Einträge, immer: ohne Ralf und ohne Formen, jüngste zuerst; Satz wie im Server', () => {
  for(const b of JSON.parse(readFileSync('tests/zuletzt-beispiele.json', 'utf8'))) assert.equal(zuletztSatzAus(b.eintrag), b.satz);
  const B = bestand(state), liste = letzte(B);
  assert.equal(liste.length, ZULETZT);
  for(let i = 1; i < liste.length; i++) assert.ok(liste[i - 1].t >= liste[i].t);
  const s = structuredClone(state), Z = B.monde.find(m => m.titel.startsWith('Zentrale'));
  s.agents.push({id: 'ralf-probe', agent_type: 'human', handle: 'Ralf'});
  s.worktrees.push({id: 'baum-ralf', work_id: Z.id, author_id: 'ralf-probe', created_at: '2026-10-21T08:00:00+00:00'});
  s.variants.push({id: 'ralf-neu', worktree_id: 'baum-ralf', author_id: 'ralf-probe', label: 'Ralf', content: 'x', notes: '', created_at: '2030-01-01T00:00:00Z', derived_from: null, status: 'entwurf', tags: []});
  assert.ok(!letzte(bestand(s)).some(e => e.id === 'ralf-neu'), 'Ralfs eigener Eintrag ist keine Nachricht für ihn');
});
