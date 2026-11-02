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
import {ueberlappen} from './dorfbau.mjs';

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
soll(W.werke.every(w => w.fassungen.every((f, i) => !i || (w.fassungen[i - 1].etage <= f.etage && w.fassungen[i - 1].dorfEtage <= f.dorfEtage))), 'Stockwerke steigen mit der Zeit, auch im Dorf mit höchstens vier');
soll(W.werke.every(w => !w.dorf || w.dorf.stockwerke <= 4), 'im Dorf höchstens vier Stockwerke');
{ const hs = Object.values(W.bau.dorf.haeuser); let n = 0; hs.forEach((a, i) => hs.forEach((c, j) => { if(j > i && ueberlappen(a, c, 0)) n++; })); soll(n === 0, `kein Haus steht in einem anderen (Maßstab ${W.bau.dorf.regeln.massstab})` + (n ? `: ${n} Paare` : '')); }
soll(Object.values(W.bau.dorf.haeuser).reduce((a, h) => a + h.fenster.length, 0) === W.zaehlung.fassungen && Object.values(W.bau.dorf.haeuser).reduce((a, h) => a + h.tueren.length, 0) === W.zaehlung.ausgang, 'Bauform: jede Fassung ein Fenster, jede Ausgangsfrage eine Tür');
soll(W.werke.every(w => { const pos = new Map(w.fassungen.map((f, i) => [f.id, i])); return w.fassungen.every((f, i) => f.eltern == null || (pos.has(f.eltern) && pos.get(f.eltern) < i)); }), 'Verzweigung nur innerhalb des Werks, Eltern älter als das Kind');
soll(W.reihenfolge.length === W.werke.length && W.reihenfolge.every((id, i) => W.werke[i].id === id), 'Reihenfolge der Werke steht fest');
const stimmen = [...new Set(W.werke.flatMap(w => w.fassungen.map(f => f.stimme)))].sort(); soll(JSON.stringify(stimmen) === JSON.stringify(W.zaehlung.stimmen), `Stimmen: ${stimmen.join(', ')}`);

// 3. was jede Fassung wirklich gebaut hat: {name, pruefsumme, werke: [{id, fassungen: [id…]}]}
for(const pfad of args){
  if(!existsSync(pfad)){ fehler.push(`${pfad} fehlt`); continue; }
  const G = JSON.parse(readFileSync(pfad, 'utf8')), teil = G.teil ? W.daecher.find(d => d.name === G.teil) : null, wer = (G.name || pfad) + (teil ? ` (nur ${teil.name})` : '');
  if(G.teil && !teil){ fehler.push(`${wer}: Dach ${G.teil} gibt es nicht`); continue; }
  // Ein Teilstück (ein Dach) muss genau dessen Werke in der Reihenfolge des Dachs enthalten
  const sollWerke = teil ? teil.werke.map(id => W.werke.find(w => w.id === id)) : W.werke;
  soll(G.pruefsumme === W.pruefsumme, `${wer}: liest dieselbe Weltbeschreibung`);
  soll(G.werke.length === sollWerke.length && G.werke.every((w, i) => w.id === sollWerke[i].id), `${wer}: dieselben ${sollWerke.length} Werke in derselben Reihenfolge`);
  const nach = new Map(G.werke.map(w => [w.id, w.fassungen]));
  soll(sollWerke.every(w => JSON.stringify(nach.get(w.id) || []) === JSON.stringify(w.fassungen.map(f => f.id))), `${wer}: jede Fassung genau ein Ding, in derselben Folge`);
  // Die Bauform: jedes Fenster steht dort, wo die Beschreibung es hinsetzt (auf 1 cm)
  if(G.werke.some(w => w.fenster)){ const bau = W.bau.dorf.haeuser, lage = new Map(); for(const h of Object.values(bau)) for(const f of h.fenster) lage.set(f.fassung, [f.x, f.y, f.z]);
    let ab = 0, n = 0; for(const w of G.werke) (w.fenster || []).forEach((p, i) => { const s = lage.get(w.fassungen[i]); n++; if(!p || !s || Math.hypot(p[0] - s[0], p[1] - s[1], p[2] - s[2]) > 0.01) ab++; });
    soll(ab === 0 && n === W.zaehlung.fassungen, `${wer}: alle ${n} Fenster an ihrem Ort aus der Bauform` + (ab ? `, ${ab} weichen ab` : '')); }
}

for(const s of ok) console.log('  ja    ' + s);
for(const s of fehler) console.log('  NEIN  ' + s);
console.log(fehler.length ? `\nNicht grün: ${fehler.length} von ${ok.length + fehler.length} Prüfungen scheitern.` : `\nGrün: alle ${ok.length} Prüfungen bestehen.`);
process.exit(fehler.length ? 1 : 0);
