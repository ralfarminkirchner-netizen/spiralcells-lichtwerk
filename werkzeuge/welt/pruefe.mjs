/* =====================================================================
   PRÜFUNG — bestätigt für die Weltbeschreibung und jede Fassung (Mac, Handy) dieselben Zahlen.
   1. Weltbeschreibung gegen den Bestand, unabhängig nachgezählt aus dem rohen Graphen.
   2. Innere Regeln: jedes Werk in genau einem Dach, jede Fassung genau einmal, unten das Älteste,
      Eltern nur innerhalb des Werks und älter als das Kind.
   3. Jede übergebene Fassungsliste (was Unreal oder das Handy wirklich gebaut hat) gegen die Beschreibung.
   Aufruf: node werkzeuge/welt/pruefe.mjs [--dienst URL] [gebaut-mac.json gebaut-handy.json …]
   Endet mit 1, wenn etwas nicht stimmt.
   ===================================================================== */
import {readFileSync, existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), di = args.indexOf('--dienst'), DIENST = di >= 0 ? args.splice(di, 2)[1] : 'http://127.0.0.1:8470';
const W = JSON.parse(readFileSync(resolve(WURZEL, 'welt/weltbeschreibung.json'), 'utf8'));
const fehler = [], ok = [], soll = (b, satz) => (b ? ok : fehler).push(satz);

// 1. gegen den Bestand
let graph = null; try{ const r = await fetch(DIENST + '/lichtwerk/graph'); if(r.ok) graph = await r.json(); }catch(_){}
if(graph){
  soll(graph.works.length === W.zaehlung.werke, `Werke im Bestand ${graph.works.length}, in der Beschreibung ${W.zaehlung.werke}`);
  soll(graph.variants.length === W.zaehlung.fassungen + W.zaehlung.ausgang, `Fassungen im Bestand ${graph.variants.length}, in der Beschreibung ${W.zaehlung.fassungen} + ${W.zaehlung.ausgang} Ausgang`);
  const ids = new Set(graph.variants.map(v => v.id)); soll(W.werke.every(w => [...w.fassungen, ...w.ausgang].every(f => ids.has(f.id))), 'jede Fassung der Beschreibung steht im Bestand');
} else fehler.push(`Bestand am Dienst ${DIENST} nicht lesbar, Vergleich mit dem Bestand fehlt`);

// 2. innere Regeln
const imDach = new Map(); for(const d of W.daecher) for(const id of d.werke) imDach.set(id, (imDach.get(id) || 0) + 1);
soll(W.werke.every(w => imDach.get(w.id) === 1), 'jedes Werk steht in genau einem Dach');
soll(W.daecher.length === W.zaehlung.daecher, `${W.zaehlung.daecher} Dächer`);
const alle = W.werke.flatMap(w => w.fassungen.map(f => f.id)); soll(new Set(alle).size === alle.length && alle.length === W.zaehlung.fassungen, 'jede Fassung genau einmal');
soll(W.werke.every(w => w.fassungen.every((f, i) => !i || (w.fassungen[i - 1].zeit || '') <= (f.zeit || ''))), 'in jedem Werk unten das Älteste');
soll(W.werke.every(w => { const pos = new Map(w.fassungen.map((f, i) => [f.id, i])); return w.fassungen.every((f, i) => f.eltern == null || (pos.has(f.eltern) && pos.get(f.eltern) < i)); }), 'Verzweigung nur innerhalb des Werks, Eltern älter als das Kind');
soll(W.reihenfolge.length === W.werke.length && W.reihenfolge.every((id, i) => W.werke[i].id === id), 'Reihenfolge der Werke steht fest');
const stimmen = [...new Set(W.werke.flatMap(w => w.fassungen.map(f => f.stimme)))].sort(); soll(JSON.stringify(stimmen) === JSON.stringify(W.zaehlung.stimmen), `Stimmen: ${stimmen.join(', ')}`);

// 3. was jede Fassung wirklich gebaut hat: {name, pruefsumme, werke: [{id, fassungen: [id…]}]}
for(const pfad of args){
  if(!existsSync(pfad)){ fehler.push(`${pfad} fehlt`); continue; }
  const G = JSON.parse(readFileSync(pfad, 'utf8')), wer = G.name || pfad;
  soll(G.pruefsumme === W.pruefsumme, `${wer}: liest dieselbe Weltbeschreibung`);
  soll(G.werke.length === W.werke.length && G.werke.every((w, i) => w.id === W.werke[i].id), `${wer}: dieselben ${W.werke.length} Werke in derselben Reihenfolge`);
  const nach = new Map(G.werke.map(w => [w.id, w.fassungen]));
  soll(W.werke.every(w => JSON.stringify(nach.get(w.id) || []) === JSON.stringify(w.fassungen.map(f => f.id))), `${wer}: jede Fassung genau ein Ding, in derselben Folge`);
}

for(const s of ok) console.log('  ja    ' + s);
for(const s of fehler) console.log('  NEIN  ' + s);
console.log(fehler.length ? `\nNicht grün: ${fehler.length} von ${ok.length + fehler.length} Prüfungen scheitern.` : `\nGrün: alle ${ok.length} Prüfungen bestehen.`);
process.exit(fehler.length ? 1 : 0);
