/* Menschliche Namen (Grundmanifest): keine Ordnernamen als Titel, keine zwei Geschwister mit demselben Namen.
   Es wird nichts erfunden: Ordnernamen werden nur lesbar geschrieben, gleiche Namen bekommen ihren belegten
   Zusammenhang dazu (Zeit, Zweig, Stimme) und erst zuletzt eine Zählung. */

const ORDNER = /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/;
const TAG = {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'};
const tagWort = t => new Date(t).toLocaleDateString('de-DE', TAG);
const gross = w => w.charAt(0).toUpperCase() + w.slice(1);

/* „faska-lernlandschaft-frisch“ → „FASKA Lernlandschaft · frisch“; ein Datum am Ende wird ein Datum */
/* Zahlfolgen wie „20261015 224747“ als Datum und Uhrzeit lesen; sonst unverändert */
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
function datumsWoerter(t){
  return t.replace(/\b(20\d{2})(\d{2})(\d{2})(?:[ _-]?(\d{2})(\d{2})(\d{2})?)?\b/g, (m, j, mo, d, h, mi) => {
    if(+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return m;
    const tag = `${+d}. ${MONATE[+mo - 1]} ${j}`;
    return h != null && +h < 24 && +mi < 60 ? `${tag}, ${h}:${mi} Uhr` : tag; });
}
export function lesbarerName(s, woerter = new Map()){
  const t = datumsWoerter(String(s || '').trim());
  if(/^[a-z][a-z0-9]{3,}$/.test(t)) return woerter.get(t) || gross(t);   // einzelner Ordnername: nur groß geschrieben
  if(!ORDNER.test(t)) return t;
  let teile = t.split(/[-_]/), tag = '';
  const letzter = teile[teile.length - 1], m = letzter.match(/^(20\d{2})(\d{2})(\d{2})$/);
  if(m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31){ tag = tagWort(Date.UTC(+m[1], +m[2] - 1, +m[3])); teile = teile.slice(0, -1); }
  const KLEIN = new Set(['und', 'der', 'die', 'das', 'als', 'in', 'im', 'zu', 'von', 'mit', 'aus', 'auf', 'fuer', 'für']);
  const wort = (w, i) => woerter.get(w) || (/^\d+$/.test(w) ? w : /^v\d+$/.test(w) ? 'Version ' + w.slice(1) : /^r\d+$/.test(w) ? 'Runde ' + w.slice(1) : i && KLEIN.has(w) ? w : gross(w));
  return teile.map(wort).join(' ') + (tag ? ' · ' + tag : '');
}

/* Namen für die Fassungen eines Werks: jede unterscheidbar, keine wiederholt nur den Werknamen */
export function fassungsNamen(fassungen, werk, woerter){
  const namen = fassungen.map(f => lesbarerName(f.label, woerter) || 'Fassung');
  const zaehle = l => { const z = new Map(); for(const x of l) z.set(x, (z.get(x) || 0) + 1); return z; };
  const ergaenze = wert => { const z = zaehle(namen);
    namen.forEach((nm, i) => { if(z.get(nm) < 2) return; const w = wert(fassungen[i]); if(w && !nm.includes(w)) namen[i] = nm + ' · ' + w; }); };
  ergaenze(f => f.zeit != null ? tagWort(f.zeit) : '');
  ergaenze(f => f.zweig ? lesbarerName(f.zweig, woerter) : '');
  ergaenze(f => f.stimme || '');
  const z = zaehle(namen), lauf = new Map();
  return namen.map(nm => { if(z.get(nm) < 2) return nm; const i = (lauf.get(nm) || 0) + 1; lauf.set(nm, i); return `${nm} · ${i} von ${z.get(nm)}`; });
}
