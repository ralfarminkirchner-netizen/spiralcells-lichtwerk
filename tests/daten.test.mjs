// Datenmodell und Einwurf-Aufbau, gegen die gesicherte state.json (nur lesen).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {bestand, menschlich, kurz, STIMMEN} from '../app/js/daten.js';
import {einwurfKoerper, etikett, neueKennung} from '../app/js/schreiben.js';

const datei = readdirSync('sicherung').filter(f => f.startsWith('state-vor-start-')).sort()[0];
const state = JSON.parse(readFileSync('sicherung/' + datei, 'utf8'));
const B = bestand(state);
const Z = B.monde.find(m => m.titel.startsWith('Zentrale'));

test('Bestand: 88 Monde, 8 mit Stimmen, kein Mensch-Eintrag', () => {
  assert.equal(B.monde.length, 88);
  assert.equal(B.monde.filter(m => m.stimmen.length).length, 8);
  assert.equal(B.mensch, null);
});
test('Zentrale: Keim, fünf Stimmen, Kopplung 0,8, kein Einrasten', () => {
  assert.deepEqual(Z.keim.map(v => v.label.slice(0, 26)), ['Gemeinsamer Auftrag · Rund', 'Gemeinsamer Auftrag · Rund']);
  assert.ok(Z.keimKristall);
  assert.deepEqual(Z.stimmen, [0, 1, 2, 3, 4]);
  assert.equal(Z.samen.length, 11);
  assert.equal(Z.kopplung, 0.8);
  assert.equal(Z.kristall.length, 0);
  assert.equal(Z.reife, 'gereift');
  assert.ok(Math.abs(Z.winkel - 139.64) < 0.01);
  // Kimi liest niemanden: keine Kante „Kimi → …“
  assert.ok(!Z.paare.some(([i]) => STIMMEN[i].key === 'kimi'));
});
test('Traumfelder ohne Ordnung, Silo-Monde bei 144°', () => {
  const traum = B.monde.filter(m => m.traumfeld);
  assert.equal(traum.length, 80);
  assert.ok(traum.every(m => m.winkel === null));   // keine Ordnung: Gold bleibt dem Kristallisieren
  const hermes = B.monde.find(m => m.titel === 'Hermes-Gesamtwerk');
  assert.equal(hermes.winkel, 144);
});
test('Belegqualität und Kappung: das schwächste Urteil zählt', () => {
  const durkheim = B.monde.find(m => m.titel === 'Émile Durkheim');
  const mitBefund = [...durkheim.faeden, ...durkheim.aussen].filter(f => f.befunde.length);
  assert.ok(mitBefund.length > 0);
  for(const f of mitBefund){
    const urteile = f.befunde.map(b => b.verdict);
    if(urteile.includes('teilweise')) assert.notEqual(f.urteil, 'tragfähig');
  }
});
test('Ralfs eigenes Verbinden hebt die Kopplung der Stimmen nicht', () => {
  const g2 = structuredClone(state);
  g2.agents.push({id: 'ralf-test', agent_type: 'human', handle: 'Ralf', created_at: '2026-10-20T15:00:00+00:00'});
  const kimi = Z.samen.find(s => s.label.startsWith('Erstbeitrag Kimi')).id, claude = Z.samen.find(s => s.label.startsWith('Erstbeitrag Claude')).id;
  g2.edges.push({id: 'e-ralf', edge_type: 'verweist-auf', from_variant_id: kimi, to_variant_id: claude, author_id: 'ralf-test', created_at: '2026-10-20T15:01:00+00:00'});
  const Z2 = bestand(g2).monde.find(m => m.id === Z.id);
  assert.equal(Z2.kopplung, 0.8);
  assert.equal(Z2.faeden.length, 1);
});
test('Kurze Hashes werden verborgen, Wörter und Jahreszahlen nicht', () => {
  assert.equal(menschlich('Commit 9e5322f und 7927858a'), 'Commit [Prüfsumme] und [Prüfsumme]');
  assert.equal(menschlich('Facade, decade, 2026'), 'Facade, decade, 2026');
});
test('Sichtbare Texte: keine Kennungen, keine Pfade', () => {
  const s = menschlich('Siehe 3f2a1b4c-1111-2222-3333-444455556666 und /Volumes/ThunderBolt4_2TB/x.json sowie ' + 'a'.repeat(0) + 'cb241ef9c8f0493387d8fa104f33e6f3d2d81f7315447abae42b7cc343548b99');
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}/.test(s));
  assert.ok(!s.includes('/Volumes'));
  assert.ok(!/[0-9a-f]{40}/.test(s));
  for(const m of B.monde) assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-/.test(m.titel + m.keimSatz));
});
test('Einwurf: erster Einwurf öffnet Ralfs Zweig, der nächste setzt ihn fort', () => {
  const ralf = {id: 'ralf-test', agent_type: 'human', handle: 'Ralf'};
  const rid = neueKennung();
  assert.match(rid, /^lichtwerk-[A-Za-z0-9-]{8,80}$/);
  const ziel = Z.samen.find(s => s.label.startsWith('Erstbeitrag Kimi')).id;
  const b1 = einwurfKoerper(B, Z, '# Eine Idee\nzum Weiterdenken', ziel, ralf, rid);
  assert.equal(b1.new_worktree, true);
  assert.equal(b1.source_variant_id, ziel);
  assert.equal(b1.label, 'Eine Idee');
  assert.equal(b1.request_id, rid);
  assert.equal(b1.contribution.mode, 'continuation');
  // mit eigenem Zweig: Ableitung von Ralfs jüngster Ausprägung, Quelle bleibt die berührte
  const g2 = structuredClone(state);
  g2.worktrees.push({id: 'baum-ralf', work_id: Z.id, author_id: 'ralf-test', created_at: '2026-10-20T15:00:00+00:00'});
  g2.variants.push({id: 'v-ralf', worktree_id: 'baum-ralf', derived_from: null, label: 'x', content: 'x', status: 'entwurf', author_id: 'ralf-test', created_at: '2026-10-20T15:00:00+00:00'});
  const B2 = bestand(g2), Z2 = B2.monde.find(m => m.id === Z.id);
  const b2 = einwurfKoerper(B2, Z2, 'weiter', null, ralf, neueKennung());
  assert.equal(b2.worktree_id, 'baum-ralf');
  assert.equal(b2.derived_from, 'v-ralf');
  assert.equal(b2.source_variant_id, Z.keim[Z.keim.length - 1].id);
  assert.ok(!('new_worktree' in b2));
});
test('Etikett aus der ersten Zeile, sonst ein ehrlicher Name', () => {
  assert.equal(etikett('\n\n'), 'Einwurf von Ralf');
  assert.equal(etikett('> Zitat'), 'Zitat');
  assert.ok(etikett('x'.repeat(200)).length <= 80);
});

test('menschlich() und kurz() wie im Server, an denselben Beispielen', () => {
  // tests/test_formen.py prüft die Python-Fassung an genau diesen Beispielen
  const beispiele = JSON.parse(readFileSync('tests/menschlich-beispiele.json', 'utf8'));
  assert.ok(beispiele.length >= 10);
  for(const b of beispiele){ assert.equal(menschlich(b.eingabe), b.menschlich, b.eingabe); assert.equal(kurz(b.eingabe, 40), b.kurz40, b.eingabe); }
});

test('Form-Körner heben weder Kopplung noch Reife, werden kein Keim und bewohnen kein Traumfeld', () => {
  const Zentrale = Z, T = B.monde.find(m => m.traumfeld && m.samen.length);
  assert.ok(T, 'ein Traumfeld mit Material');
  const seite = '<!doctype html><html><head><title>x</title><style>p{color:red}</style></head><body><p>Satz eins.</p><p class="herkunft">Geformt.</p></body></html>';
  const form = (id, baum, original, status) => ({id, worktree_id: baum, label: 'Karten aus der Probe', content: seite, author_id: 'ralf-probe',
    notes: 'Form ohne Modell · KiNFORMER · Karten. 1 Karte.', created_at: '2026-10-20T19:00:00+00:00', derived_from: null, status, tags: [],
    contribution: {mode: 'review', seen_variant_ids: [original]}, source_ref: null});
  const mitFormen = faden => {
    const s = structuredClone(state);
    s.agents.push({id: 'ralf-probe', agent_type: 'human', handle: 'Ralf', description: 'Probe'});
    for(const [mond, baum] of [[Zentrale, 'baum-z'], [T, 'baum-t']]){
      const original = mond.samen[0].id;
      s.worktrees.push({id: baum, work_id: mond.id, author_id: 'ralf-probe', created_at: '2026-10-20T19:00:00+00:00'});
      s.variants.push(form('form-' + baum, baum, original, 'grundformation'));   // auch ein anderswo gesetzter Status zählt nicht
      if(faden) s.edges.push({id: 'kante-' + baum, edge_type: 'verweist-auf', from_variant_id: 'form-' + baum, to_variant_id: original,
        author_id: 'ralf-probe', note: 'Probe', created_at: '2026-10-20T19:00:01+00:00'});
    }
    return bestand(s);
  };
  const B2 = mitFormen(true), Z2 = B2.mondVon.get(Zentrale.id), T2 = B2.mondVon.get(T.id);
  for(const [vorher, nachher] of [[Zentrale, Z2], [T, T2]]){
    assert.equal(nachher.kopplung, vorher.kopplung);
    assert.equal(nachher.winkel, vorher.winkel);
    assert.equal(nachher.reife, vorher.reife);
    assert.equal(nachher.kristall.length, vorher.kristall.length);
    assert.equal(nachher.traumfeld, vorher.traumfeld);
    assert.deepEqual(nachher.keim.map(v => v.id), vorher.keim.map(v => v.id));
    assert.deepEqual(nachher.stimmen, vorher.stimmen);
    const f = nachher.samen.find(s => s.form);
    assert.ok(f && f.original === vorher.samen[0].id);
    assert.equal(f.status, 'entwurf');
    assert.equal(f.laenge, 'Satz eins. Geformt.'.length, 'Licht nach dem sichtbaren Wortlaut');
    assert.ok(nachher.faeden.some(x => x.form && x.von === f.id));
  }
  assert.equal(B2.formen.size, 2);
  // Ohne Faden (Abbruch zwischen Form und Faden) bleibt es eine Form, wie auf dem Server: nichts wird reifer oder bewohnt
  const B3 = mitFormen(false), T3 = B3.mondVon.get(T.id), Z3 = B3.mondVon.get(Zentrale.id);
  assert.equal(B3.formen.size, 2);
  assert.equal(T3.traumfeld, true);
  assert.equal(Z3.reife, Zentrale.reife);
  assert.ok(!T3.faeden.some(x => x.form), 'ohne Faden wird kein Formfaden gezeichnet');
  // Ohne Ralfs Eintrag als Urheber ist es keine Form
  const s4 = structuredClone(state); s4.agents.push({id: 'jemand', agent_type: 'model', handle: 'Codex Probe'});
  s4.worktrees.push({id: 'baum-x', work_id: T.id, author_id: 'jemand', created_at: '2026-10-20T19:00:00+00:00'});
  s4.variants.push({...form('form-x', 'baum-x', T.samen[0].id, 'entwurf'), author_id: 'jemand'});
  assert.equal(bestand(s4).formen.size, 0);
});
