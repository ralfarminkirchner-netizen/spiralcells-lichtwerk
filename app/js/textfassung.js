/* =====================================================================
   TEXTFASSUNG — die Grundform unter allen Ansichten: dieselbe Logik nur aus Text und Zeichen.
   Keine Grafik, keine Farbe als Träger von Bedeutung. Jede Aussage der Bilder steht hier als Zeile.
   Kennungen erscheinen nicht. Rechnet nur, speichert nichts. Läuft im Browser und in Node.
   ===================================================================== */
import {STIMMEN, MENSCH} from './daten.js';

export const STIMMZEICHEN = ['C', 'X', 'H', 'A', 'K'], RALF = 'R', QUELLE = 'Q';
const zeichen = s => s.form ? RALF : typeof s.stimme === 'number' ? STIMMZEICHEN[s.stimme] : s.stimme === MENSCH ? RALF : QUELLE;
const zahl = n => Number(n).toLocaleString('de-DE');
const datum = t => { const d = new Date(t); return Number.isNaN(d.getTime()) || !t ? '' : d.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}); };
export const balken = (w, breite = 10) => { const v = Math.round(Math.max(0, Math.min(1, w)) * breite); return '█'.repeat(v) + '░'.repeat(breite - v); };
const ARTEN = {kette: 'folgt auf', gabel: 'zweigt ab von', keim: 'aus der Ausgangsfrage', form: 'Form von', reihe: 'aus einer Übernahme', frei: 'ohne belegte Herkunft'};

/* Wie die Pflanze im Garten: Keimling, Ranke, Verzweigt, Büschel */
export function wuchsWort(m, plan){ const n = m.samen.length; if(!n || !plan) return 'nur die Ausgangsfassung'; if(n === 1) return 'einzeln'; const W = plan.W, gabeln = W.art.filter(a => a === 'gabel').length + W.kinder.filter(k => k.length > 1).length, lose = plan.lose.filter(Boolean).length;
  return gabeln ? 'verzweigt' : lose > n / 2 ? 'lose' : plan.tiefste >= 3 ? 'Kette' : 'kurz'; }

export const LEGENDE = [
  ['Stimmen', STIMMEN.map((s, i) => `${STIMMZEICHEN[i]} ${s.name}`).concat(`${RALF} Ralf`, `${QUELLE} Quelle`).join(' · ')],
  ['Abstammung', '├─ und Einrückung: folgt auf der Fassung darüber. ·  am Anfang: ohne belegte Herkunft.'],
  ['Arbeit', '█░ wie viel in einem Werk entstanden ist (Fassungen und Textmenge). Das ist die Länge der Spirale.'],
  ['Beziehung', '→ geht von diesem Werk aus, ← kommt hier an. Nur gespeicherte Beziehungen.'],
  ['Reife', 'frisch, wachsend, gereift, kanonisch: so steht es im Bestand.'],
];
export const ENTSPRECHUNG = [
  ['Text', 'Bilder: Kosmos · Garten · Galaxie · Dorf · Campus · Büro'],
  ['Mitte', 'Zentrale · Lichtung · Kern · Marktplatz · Innenhof · Empfang'],
  ['Dach', 'Hülle · Beet · Sonne · Viertel · Bauabschnitt · Abteilung'],
  ['ohne Dach', 'offener Raum · Wildwiese · freie Planeten · Streusiedlung · freies Gelände · Flur'],
  ['Werk', 'Zelle · Pflanze · Planet · Haus · Gebäude · Tisch'],
  ['Fassung', 'Korn · Blatt · Mond · Fenster · Fenster · Blatt Papier'],
  ['Arbeit', 'Spirale · Höhe · Bahnspirale · Höhe · Höhe · Stapel'],
  ['Beziehung', 'Faden · Mycel · Lichtbrücke · Weg · Weg · Linie am Boden'],
];

export function alsText(N, FADEN_SATZ, arbeit){
  const titel = i => N.B.monde[i].titel, werk = n => { const m = N.B.monde[n], plan = N.mini[n].plan, mat = N.baum.material.has(n), stimmen = [...new Set(m.samen.map(zeichen))], W = plan && plan.W;
    const fassungen = mat || !W ? [] : m.samen.map((s, i) => { const t = W.tiefe[i], herkunft = W.art[i], e = W.eltern[i], lose = plan.lose[i]; return {i, tiefe: lose ? 0 : t, zeile: `${lose ? '·  ' : '   '.repeat(t) + '├─ '}[${zeichen(s)}] ${s.label || 'Fassung'}${s.status === 'grundformation' ? ' ★' : ''} · ${zahl(s.laenge || 0)} Zeichen${datum(s.zeit) ? ' · ' + datum(s.zeit) : ''} · ${ARTEN[herkunft] || herkunft}${e >= 0 ? ' „' + (m.samen[e].label || 'Fassung') + '“' : ''}`}; });
    const bezuege = []; N.faeden.forEach(f => { if(f.von === n) bezuege.push(`→ ${FADEN_SATZ[f.typ] || f.typ} „${titel(f.nach)}“${f.kanten.length > 1 ? ` (${f.kanten.length}-mal)` : ''}`); else if(f.nach === n) bezuege.push(`← „${titel(f.von)}“ ${FADEN_SATZ[f.typ] || f.typ}${f.kanten.length > 1 ? ` (${f.kanten.length}-mal)` : ''}`); });
    return {n, titel: m.titel, material: mat, zeile: mat ? 'Lesematerial' : `${balken(arbeit(m))} · ${m.samen.length} ${m.samen.length === 1 ? 'Fassung' : 'Fassungen'} · ${stimmen.join(' ') || 'keine Stimme'} · ${m.reife || 'ohne Reife'} · ${wuchsWort(m, plan)}`, fassungen, bezuege}; };
  const bezirk = (name, satz, werke, bereiche) => { const liste = werke.map(werk), fa = liste.reduce((a, w) => a + w.fassungen.length, 0); return {name, satz, zeile: `${werke.length} ${werke.length === 1 ? 'Werk' : 'Werke'} · ${fa} ${fa === 1 ? 'Fassung' : 'Fassungen'}`, werke: liste, bereiche}; };
  const mat = b => [...N.baum.material.keys()].filter(i => N.bezirk(i) === b);
  const bezirke = [bezirk(N.baum.mitte.name, N.baum.mitte.satz, [...N.baum.mitte.werke, ...mat('mitte')]),
    ...N.baum.daecher.map((d, j) => { const b = bezirk(d.name, d.satz, [...d.bereiche.flatMap(x => x.werke), ...mat(j)]); b.teile = d.bereiche.map(x => ({name: x.name, werke: new Set(x.werke)})); return b; }),
    ...(N.baum.ohne.length ? [bezirk('Ohne Dach', 'Noch keinem Dach belegt zugeordnet.', [...N.baum.ohne, ...mat('ohne')])] : [])];
  const fassungen = bezirke.reduce((a, b) => a + b.werke.reduce((c, w) => c + w.fassungen.length, 0), 0), werke = bezirke.reduce((a, b) => a + b.werke.length, 0);
  return {kopf: `${werke} Werke · ${fassungen} Fassungen · ${N.faeden.length} Beziehungen zwischen Werken · ${N.baum.daecher.length} Dächer`, bezirke};
}
