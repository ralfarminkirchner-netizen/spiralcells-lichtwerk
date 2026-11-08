// Lebensspirale: vom Netz in eine Zelle und durch alle Welten, immer am selben Werk.
// Grundgesetz (Ralf, 07.11.2026): Ein Ansichtswechsel ändert nie eine Relation. Muster: `fundus invarianz`.
// Liest den Fundus-Export (testdaten/fundus/graph.json, außerhalb von Git: `fundus export --graph`).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {bestand} from '../app/js/daten.js';
import {fundusBezuege, werkVonKnoten} from '../app/js/bezuege.js';
import {WELTEN, wechsle, werkDerAuswahl, bezuegeDesWerks, mitWerk, werkAus} from '../app/js/auswahl.js';
import {etagen} from '../app/js/anlage.js';

globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const PFAD = 'testdaten/fundus/graph.json', DA = existsSync(PFAD), ohne = DA ? false : 'Fundus-Export fehlt (fundus export --graph)';
const g = DA ? JSON.parse(readFileSync(PFAD, 'utf8')) : null;
const B = DA ? bestand(g) : null;
const {Netz} = await import('../app/js/netz.js');
const N = DA ? new Netz(B, JSON.parse(readFileSync('app/ordnung.json', 'utf8'))) : null;

test('Zelle: Fassungen nach belegter Zeit (sortierung), Undatiertes im Saum dahinter', {skip: ohne}, () => {
  const sort = new Map(g.variants.map(v => [v.id, v.fundus.sortierung || null]));
  let saum = 0, datiert = 0;
  for(const m of B.monde){
    const s = m.samen; let imSaum = false;
    for(let i = 0; i < s.length; i++){
      const so = sort.get(s[i].id);
      assert.equal(!!s[i].saum, !so, `${m.titel}: Saum genau dann, wenn keine belegte Zeit`);
      if(s[i].saum){ imSaum = true; saum++; continue; }
      datiert++;
      assert.ok(!imSaum, `${m.titel}: Datiertes steht nie hinter dem Saum`);
      if(i > 0 && !s[i - 1].saum) assert.ok(Date.parse(sort.get(s[i - 1].id)) <= Date.parse(so), `${m.titel}: unten das Älteste`);
      if(i > 0) assert.ok(s[i - 1].zeit <= s[i].zeit, `${m.titel}: Lagezeit steigt`);
    }
  }
  assert.ok(saum > 0 && datiert > 0);
});

test('Etagen: Saum heißt „ohne Datum“, nie ein erfundenes Datum', {skip: ohne}, () => {
  const m = B.monde.find(x => x.samen.some(s => s.saum) && x.samen.some(s => !s.saum));
  assert.ok(m, 'ein Werk mit Datiertem und Saum');
  const e = etagen(m, 1, 16);
  const letzte = e[e.length - 1];
  assert.equal(letzte.bis, 'ohne Datum');
  for(const x of e) for(const i of x.fassungen) if(!m.samen[i].saum) assert.notEqual(x.von, 'ohne Datum');
});

test('Bezüge: jede gespeicherte Verbindung zwischen zwei Werken kommt genau einmal im Netz an, berechnete getrennt', {skip: ohne}, () => {
  const werk = werkVonKnoten(g), varianten = new Set(g.variants.map(v => v.id));
  // unabhängig gezählt: gespeicherte Relationen über Werkgrenzen, die nicht schon als Fassungskante kommen
  const erwartet = new Set(), berechnet = new Set();
  for(const k of g.fundus.kanten){ const a = werk.get(k.von), b = werk.get(k.zu); if(a == null || b == null || a === b) continue;
    if(k.gespeichert){ if(!(k.relation[0] === 'B' && varianten.has(k.von) && varianten.has(k.zu))) erwartet.add(JSON.stringify(k.relation)); }
    else berechnet.add([k.von, k.zu, k.art].join('|')); }
  const liste = fundusBezuege(g);
  assert.deepEqual(new Set(liste.filter(x => x.gespeichert).map(x => x.schluessel)), erwartet);
  assert.deepEqual(new Set(liste.filter(x => !x.gespeichert).map(x => x.schluessel)), berechnet);
  // im Netz: jede gespeicherte genau einmal, als Faden mit durchgezogenem Strich
  const imNetz = [];
  for(const f of N.faeden) for(const e of f.kanten) if(e.fundus) imNetz.push(e.schluessel);
  // Kanten der Ordnung (Ralf, 08.11.: „gehört zu“ zu App oder Ort) kommen als Lage an, nicht als Faden
  const lage = N.ordnungsKanten || new Set();
  for(const k of lage) assert.ok(erwartet.has(k), 'nur gespeicherte Kanten ordnen');
  const gesp = imNetz.filter(s => erwartet.has(s));
  assert.equal(gesp.length + lage.size, erwartet.size, 'keine doppelt, keine fehlt');
  assert.ok(!gesp.some(s => lage.has(s)), 'eine Ordnungskante ist nie zugleich Faden');
  assert.deepEqual(new Set([...gesp, ...lage]), erwartet);
  for(const f of N.faeden) assert.equal(!!f.abgeleitet, f.typ === 'nahe', 'nur Berechnetes heißt „nahe“');
  for(const f of N.faeden) if(!f.abgeleitet) for(const e of f.kanten) assert.ok(!e.abgeleitet);
  // die Fassungskanten aus Mooncells-Form bleiben vollständig
  const kantenImNetz = new Set(N.faeden.flatMap(f => f.kanten.filter(e => !e.fundus).map(e => e.id)));
  const idx = new Map(B.monde.map((m, i) => [m.id, i]));
  for(const e of g.edges){ const a = idx.get(B.werkVon(e.from_variant_id)), b = idx.get(B.werkVon(e.to_variant_id)); if(a != null && b != null && a !== b) assert.ok(kantenImNetz.has(e.id)); }
});

test('Gespeichert durchgezogen, berechnet gestrichelt', {skip: ohne}, async () => {
  const {STIL} = await import('../app/js/netz.js');
  for(const [typ, st] of Object.entries(STIL)) assert.equal(!!st.strich, typ === 'nahe', `${typ}`);
});

test('Wechsel: dieselbe Auswahl und dieselben Kanten vor und nach jedem Ansichtswechsel', {skip: ohne}, () => {
  const kandidaten = B.monde.map((m, i) => i).filter(i => N.faeden.some(f => f.von === i || f.nach === i));
  assert.ok(kandidaten.length > 10);
  const siegel = () => JSON.stringify(N.faeden.map(f => [f.von, f.nach, f.typ, f.kanten.length]));
  const s0 = siegel();
  let zufall = 7; const r = n => { zufall = (zufall * 48271) % 2147483647; return zufall % n; };
  for(const w of kandidaten.slice(0, 40)){
    const vorher = bezuegeDesWerks(N, w);
    assert.ok(vorher.gespeichert.length + vorher.berechnet.length > 0);
    // aus der offenen Zelle heraus und aus dem Netz, durch jede Welt und in zufälliger Folge
    let z = {welt: 'kosmos', werk: werkDerAuswahl({art: 'same', i: 0}, w), zelle: true};
    const folge = [...WELTEN, ...Array.from({length: 24}, () => WELTEN[r(WELTEN.length)])];
    for(const ziel of folge){
      z = wechsle(z, ziel);
      assert.equal(z.werk, w, `Auswahl nach ${ziel}`);
      assert.equal(z.zelle, false, 'die neue Welt beginnt außen, am Werk');
      assert.deepEqual(bezuegeDesWerks(N, z.werk), vorher, `Kanten nach ${ziel}`);
    }
  }
  assert.equal(siegel(), s0, 'kein Wechsel ändert eine Verbindung');
});

test('Auswahl: nur ein Werk wird mitgenommen, sonst nichts', () => {
  assert.equal(werkDerAuswahl({art: 'mond', i: 5}, null), 5);
  assert.equal(werkDerAuswahl({art: 'same', i: 2}, 9), 9);
  assert.equal(werkDerAuswahl({art: 'keim'}, 9), 9);
  assert.equal(werkDerAuswahl(null, 4), 4);
  assert.equal(werkDerAuswahl({art: 'dach', i: 1}, null), null);
  assert.equal(werkDerAuswahl({art: 'faden', i: 1}, null), null);
  assert.equal(wechsle({welt: 'galaxie', werk: 3, zelle: false}, 'galaxie').welt, 'kosmos', 'zweimal dieselbe Welt führt zurück');
  assert.equal(wechsle({welt: 'galaxie', werk: 3, zelle: false}, 'gibtesnicht').welt, 'galaxie');
});

test('Adresse: das Werk steht unter seinem lesbaren Namen und bleibt neben anderen Angaben', () => {
  assert.equal(werkAus(mitWerk('', 'ein-inhalt')), 'ein-inhalt');
  const h = mitWerk('#von=netz', 'material-bekommt-form');
  assert.equal(werkAus(h), 'material-bekommt-form');
  assert.match(h, /von=netz/);
  assert.equal(werkAus(mitWerk(h, null)), null);
  assert.equal(werkAus('#werk=../boese'), null, 'nur lesbare Namen');
  assert.equal(werkAus('#werk=a&werk=b'), null);
});

test('Spirale im Netz: Länge ist die Menge, der Saum liegt hinten, Dauer nur wenn belegt', {skip: ohne}, async () => {
  const {menge, strecke, fassungBei, windungen} = await import('../app/js/menge.js');
  assert.equal(windungen(1000), 1); assert.equal(windungen(10000), 2); assert.equal(windungen(100000), 3);
  assert.ok(windungen(10) >= 0.3 && windungen(1e9) <= 5);
  for(const m of B.monde){
    const st = strecke(m.samen), x = menge(m);
    if(!m.samen.length){ assert.equal(x.windungen, 0); continue; }
    // mehr Material, nie kürzere Spirale
    assert.ok(x.windungen > 0);
    // der Saum beginnt erst, wo das Datierte endet
    for(let i = 0; i < m.samen.length; i++){ if(m.samen[i].saum) assert.ok(st.von[i] >= st.saumAb - 1e-12); else assert.ok(st.bis[i] <= st.saumAb + 1e-12); }
    for(let i = 0; i < m.samen.length; i++) assert.equal(fassungBei(st, (st.von[i] + st.bis[i]) / 2), i);
    // nie eine Dauer ohne zwei datierte Fassungen, nie ein Datum ohne datierte
    if(x.datiert === 0) assert.doesNotMatch(x.satz, /belegt am|über \d/);
    if(x.datiert < 2) assert.doesNotMatch(x.satz, /über \d/);
    assert.doesNotMatch(x.satz, /[0-9a-f]{8}-[0-9a-f]{4}/, 'keine Kennung');
  }
  const gross = [...B.monde].sort((a, b) => menge(b).zeichen - menge(a).zeichen);
  assert.ok(menge(gross[0]).windungen > menge(gross[gross.length - 100]).windungen, 'viel Material, lange Spirale');
});
