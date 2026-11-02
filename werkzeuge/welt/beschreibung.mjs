/* =====================================================================
   WELTBESCHREIBUNG — die eine gemeinsame Quelle für Mac (Unreal) und Handy.
   Liest den Bestand nur (GET am Testdienst), rechnet mit derselben Logik wie Lichtgrund
   (daten, netz, funktion, ortsplan, anlage) und schreibt welt/weltbeschreibung.json.
   Keine Fassung rechnet eigene Inhalte: beide lesen genau diese Datei.
   Aufruf: node werkzeuge/welt/beschreibung.mjs [http://127.0.0.1:8470]
   ===================================================================== */
import {writeFileSync, mkdirSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

globalThis.innerWidth = 1280; globalThis.innerHeight = 800;
const HIER = dirname(fileURLToPath(import.meta.url)), WURZEL = resolve(HIER, '../..');
const DIENST = process.argv[2] || 'http://127.0.0.1:8470';
const {bestand, STIMMEN, MENSCH} = await import('../../app/js/daten.js');
const {Netz, arbeit} = await import('../../app/js/netz.js');
const {FUNKTIONEN, funktionVon} = await import('../../app/js/funktion.js');
const {ortsplan} = await import('../../app/js/ortsplan.js');
const {etagen, alterVon} = await import('../../app/js/anlage.js');
const {dorfBau} = await import('./dorfbau.mjs');

const lies = async p => { const r = await fetch(DIENST + p, {headers: {Accept: 'application/json'}}); if(!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); };
const [graph, ordnung] = await Promise.all([lies('/lichtwerk/graph'), lies('/lichtwerk/ordnung')]);
const B = bestand(graph), N = new Netz(B, ordnung), LG = ortsplan(N, (x, z) => N.land.y(x, z));

const stimmeName = s => typeof s === 'number' ? STIMMEN[s].name : s === MENSCH ? 'Ralf' : 'Quelle';
const bezirkName = b => b === 'mitte' ? 'Zentrale' : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
const iso = t => t && isFinite(t) ? new Date(t).toISOString() : null;
const r3 = v => Math.round(v * 1000) / 1000;
// Werke nach Alter: das Älteste zuerst. Gleiches Alter entscheidet der Titel, damit die Reihenfolge feststeht.
const reihe = B.monde.map((m, n) => n).sort((a, b) => (alterVon(B.monde[a]) - alterVon(B.monde[b])) || (B.monde[a].erstellt - B.monde[b].erstellt) || B.monde[a].titel.localeCompare(B.monde[b].titel));
const rang = new Map(reihe.map((n, k) => [n, k]));
const wid = n => B.monde[n].id;

const werke = B.monde.map((m, n) => {
  const material = N.baum.material.has(n), bz = N.bezirk(n), f = funktionVon(N, n), plan = N.mini[n].plan;
  const bereich = typeof bz === 'number' ? (N.daecher[bz].bereiche.find(b => b.werke.includes(n)) || {}).name || null : null;
  // Fassungen in Zeitfolge: unten das Älteste. Eltern nur, wo die Abstammung belegt ist (nicht lose).
  // Gleichstand (gemeinsam übernommene Fassungen haben dieselbe Zeit): Reihenfolge des Bestands, genau wie etagen() in anlage.js
  const folge = m.samen.map((s, i) => i).sort((a, b) => ((m.samen[a].zeit || 0) - (m.samen[b].zeit || 0)) || a - b);
  const E = material ? [] : etagen(m, N.mini[n].ar ?? 0.5, 16);
  const etageVon = new Map(); E.forEach((e, k) => e.fassungen.forEach(i => etageVon.set(i, k)));
  // Im Dorf höchstens vier Stockwerke (wie innen.js): mehr Arbeit macht das Haus dort länger, nicht höher
  const ED = material ? [] : etagen(m, N.mini[n].ar ?? 0.5, 4), dorfEtage = new Map(); ED.forEach((e, k) => e.fassungen.forEach(i => dorfEtage.set(i, k)));
  const fassungen = folge.map(i => { const s = m.samen[i], el = plan && !plan.lose[i] && plan.W.eltern[i] >= 0 ? m.samen[plan.W.eltern[i]].id : null;
    return {id: s.id, name: s.label, stimme: stimmeName(s.stimme), zeit: iso(s.zeit), zeichen: s.laenge, status: s.status, form: !!s.form, eltern: el, etage: etageVon.get(i) ?? 0, dorfEtage: dorfEtage.get(i) ?? 0}; });
  const p = LG.pos[n];
  return {id: m.id, titel: m.titel, rang: rang.get(n), bezirk: bezirkName(bz), bereich, material,
    funktion: {schluessel: f, ...FUNKTIONEN[f]}, reife: m.reife, arbeit: material || !m.samen.length ? 0 : r3(arbeit(m)),
    stimmen: [...new Set(m.samen.map(s => stimmeName(s.stimme)))].sort(), stockwerke: Math.max(1, E.length),
    dorf: p ? {x: r3(p[0]), z: r3(p[2]), drehung: r3(LG.yaw ? LG.yaw[n] : 0), stockwerke: Math.max(1, ED.length)} : null,
    ausgang: m.keim.map(v => ({id: v.id, name: v.label || 'Ausgangsfrage', zeit: v.created_at || null})), fassungen};
}).sort((a, b) => a.rang - b.rang);

const daecher = [{name: 'Zentrale', satz: N.baum.mitte.satz || null, bereiche: [], werke: N.werkeIn('mitte').map(wid)},
  ...N.daecher.map((d, j) => ({name: d.name, satz: d.satz || null, bereiche: d.bereiche.map(b => ({name: b.name, werke: b.werke.map(wid)})), werke: N.werkeIn(j).map(wid)})),
  {name: 'ohne Dach', satz: null, bereiche: [], werke: N.werkeIn('ohne').map(wid)}];
const faeden = [], schon = new Set();
for(const m of B.monde) for(const f of m.faeden) if(!f.form && !schon.has(f.kante.id)){ schon.add(f.kante.id); faeden.push({von: f.von, nach: f.nach, art: f.typ}); }

const zaehlung = {werke: werke.length, fassungen: werke.reduce((a, w) => a + w.fassungen.length, 0), ausgang: werke.reduce((a, w) => a + w.ausgang.length, 0), daecher: daecher.length,
  stimmen: [...new Set(werke.flatMap(w => w.fassungen.map(f => f.stimme)))].sort(), faeden: faeden.length};
const welt = {format: 'lichtgrund-welt/1', erzeugt: new Date().toISOString(), quelle: 'Bestand am Testdienst (Datenkopie), nur gelesen',
  hinweis: 'Funktion ist Ralfs korrigierbare Lesart aus app/js/funktion.js, kein Beleg.', zaehlung,
  stimmen: [...STIMMEN.map(s => ({name: s.name, farbe: s.hex})), {name: 'Ralf', farbe: '#e4dfcc'}, {name: 'Quelle', farbe: '#8fae62'}],
  reihenfolge: werke.map(w => w.id), daecher, werke, faeden};
// Die Bauform gehört zur Beschreibung: jede Engine baut genau diese Maße
welt.bau = {dorf: dorfBau(welt)};
welt.pruefsumme = createHash('sha256').update(JSON.stringify({z: zaehlung, r: welt.reihenfolge, f: werke.map(w => w.fassungen.map(x => [x.id, x.eltern])), bau: welt.bau})).digest('hex');

const ziel = resolve(WURZEL, 'welt/weltbeschreibung.json'); mkdirSync(dirname(ziel), {recursive: true});
writeFileSync(ziel, JSON.stringify(welt, null, 1));
console.log(`${ziel}: ${zaehlung.werke} Werke, ${zaehlung.fassungen} Fassungen, ${zaehlung.daecher} Dächer, ${zaehlung.stimmen.length} Stimmen, ${zaehlung.faeden} Fäden`);
