/* Der Spiralbaum (Ralf, 08.11.2026): vom Gesamtnetz Stufe für Stufe in eine einzelne Spiral Cell.

   Aus dem Fundus-Export wird ein Baum: Orte → Apps → Werke → Fassungen. Ein Werk an mehreren Orten steht an
   jedem dasselbe Werk (gleiche Schlüssel, Hinweis „auch in …“). Bruchstücke stehen nicht als eigene Werke:
   „Stelle aus …“ liegt im eigenen Material der App, gleich benannte Werke sind ein Werk, Zwischenstände mit
   gemeinsamem Vornamen („Invaria 2 · …“) liegen in diesem einen Werk. Auf keiner Stufe mehr als BIS Dinge;
   der Rest liegt gebündelt in „noch n kleinere“. Reine Funktionen, sie lesen nur. */

import {ortsgraph} from './ortsgraph.js';

export const BIS = 16;          // so viele Dinge stehen auf einer Stufe einzeln, dazu höchstens ein Bündel
export const MINDESTENS = 400;  // so viel zählt eine Fassung ohne Text

const sortierDatum = v => {
  const f = v && v.fundus && typeof v.fundus === 'object' ? v.fundus : null, s = f && f.sortierung;
  const m = typeof s === 'string' && s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  return m ? Date.UTC(+m[1], +m[2] - 1, m[3] ? +m[3] : 15) : null;
};

/* Menge eines Knotens aus seinen Blättern */
function zaehle(k){
  if(k.art === 'fassung') return k;
  let zeichen = 0, fassungen = 0, wert = 0, von = Infinity, bis = -Infinity, datiert = 0;
  for(const c of k.kinder){ zaehle(c); zeichen += c.zeichen; fassungen += c.fassungen; wert += c.wert; datiert += c.datiert;
    if(c.von < von) von = c.von; if(c.bis > bis) bis = c.bis; }
  Object.assign(k, {anzahl: k.anzahl ?? k.kinder.length, zeichen, fassungen, wert: Math.max(wert, MINDESTENS), von, bis, datiert});
  // Fassungen bleiben in ihrer Zeitfolge (die Spirale beginnt mit der frühesten), alles andere nach Menge
  if(k.kinder.every(c => c.art === 'fassung'))
    k.kinder.sort((a, b) => (a.von === Infinity) - (b.von === Infinity) || a.von - b.von || a.name.localeCompare(b.name, 'de'));
  else k.kinder.sort((a, b) => b.wert - a.wert || a.name.localeCompare(b.name, 'de'));
  return k;
}

/* Mehr als BIS Kinder: die größten einzeln, der Rest in einem Bündel (das selbst wieder so geordnet ist) */
function buendle(k, wort){
  if(k.art === 'fassung') return k;
  for(const c of k.kinder) buendle(c, wort);
  if(k.kinder.length > BIS + 1){
    const rest = k.kinder.slice(BIS), w = wort[k.art] || 'kleinere';
    const b = zaehle({art: k.kinder[BIS].art === 'fassung' ? 'buendel-fassung' : 'buendel', name: `noch ${rest.length} ${w}`, kinder: rest, schluessel: k.schluessel + '/rest'});
    buendle(b, wort);
    k.kinder = [...k.kinder.slice(0, BIS), b];
  }
  return k;
}

const vorname = t => { const i = t.indexOf(' · '); return i > 0 ? t.slice(0, i).trim() : ''; };

export function spiralbaum(g){
  const G = ortsgraph(g);
  const zweig = new Map((g.worktrees || []).map(t => [t.id, t.work_id]));
  const fassungenVon = new Map();
  for(const v of g.variants || []){ const w = zweig.get(v.worktree_id); if(!w) continue; if(!fassungenVon.has(w)) fassungenVon.set(w, []); fassungenVon.get(w).push(v); }
  const blatt = (v, werkName) => { const zeichen = (v.content || '').length, t = sortierDatum(v);
    return {art: 'fassung', name: (v.label || '').trim() || werkName, werk: werkName, zeichen, fassungen: 1, wert: Math.max(MINDESTENS, zeichen),
      von: t ?? Infinity, bis: t ?? -Infinity, datiert: t == null ? 0 : 1, schluessel: v.id}; };
  const blaetter = id => (fassungenVon.get(id) || []).map(v => blatt(v, G.name(id)))
    .sort((a, b) => (a.von === Infinity) - (b.von === Infinity) || a.von - b.von || a.name.localeCompare(b.name, 'de'));
  const orteNamen = id => (G.orteVon.get(id) || []).map(o => G.name(o));

  const appKnoten = (a, ortName) => {
    const name = G.name(a), eigen = blaetter(a), gruppen = new Map();
    const werke = [...new Set(G.unter.get(a) || [])];
    const zaehlVorname = new Map();
    for(const w of werke){ const p = vorname(G.name(w)); if(p) zaehlVorname.set(p, (zaehlVorname.get(p) || 0) + 1); }
    for(const w of werke){
      const t = G.name(w).trim();
      if(/^Stelle aus\b/.test(t)){ eigen.push(...blaetter(w).map(b => ({...b, name: t}))); continue; }
      const p = vorname(t);
      const key = p && p.toLowerCase() !== name.toLowerCase() && zaehlVorname.get(p) >= 2 ? p : t;
      if(!gruppen.has(key)) gruppen.set(key, {ids: [], titel: []});
      const gr = gruppen.get(key); gr.ids.push(w); gr.titel.push(t);
    }
    const kinder = [...gruppen].map(([key, gr]) => {
      const auch = [...new Set(gr.ids.flatMap(orteNamen))];
      const teile = [...new Set(gr.titel)];
      const blt = gr.ids.flatMap(id => blaetter(id).map(b => teile.length > 1 ? {...b, name: b.werk === b.name ? b.werk : `${b.werk} · ${b.name}`} : b));
      return {art: 'werk', name: key, teile, auch, kinder: blt, schluessel: 'werk:' + [...gr.ids].sort().join('+'), ids: gr.ids};
    });
    if(eigen.length) kinder.push({art: 'werk', name: name, eigen: true, teile: [], auch: orteNamen(a), kinder: eigen, schluessel: 'eigen:' + a, ids: [a]});
    return {art: 'app', name, auch: orteNamen(a), kinder, schluessel: 'app:' + a, ids: [a]};
  };

  const orte = G.orte.map(o => ({art: 'ort', name: o.title, ortsart: o.work_type,
    kinder: [...G.apps].filter(([, os]) => os.has(o.id)).map(([a]) => appKnoten(a, o.title)), schluessel: 'ort:' + o.id}));
  const wurzel = {art: 'wurzel', name: 'Alle Orte', kinder: orte, schluessel: 'wurzel'};
  // Orte bleiben in Ralfs fester Folge, darum erst zählen, dann die Folge zurücksetzen
  zaehle(wurzel); wurzel.kinder = orte.slice().sort((a, b) => G.orte.findIndex(o => o.title === a.name) - G.orte.findIndex(o => o.title === b.name));
  buendle(wurzel, {ort: 'kleinere Apps', app: 'kleinere Werke', werk: 'weitere Fassungen', buendel: 'kleinere'});
  wurzel.kinder = wurzel.kinder.filter(o => o.kinder.length);
  return wurzel;
}

/* Wie viel, in Worten: Zahlen und belegte Zeit, ohne Kennungen */
const MON = {month: 'short', year: 'numeric', timeZone: 'UTC'};
export function zeichenWort(z){
  if(z < 1000) return `${z.toLocaleString('de-DE')} Zeichen`;
  if(z < 1e6) return `${Math.round(z / 1000).toLocaleString('de-DE')} Tsd. Zeichen`;
  return `${(Math.round(z / 1e5) / 10).toLocaleString('de-DE')} Mio. Zeichen`;
}
export function zeitWort(k){
  if(!k.datiert) return 'Zeit nicht belegt';
  const a = new Date(k.von).toLocaleDateString('de-DE', MON), b = new Date(k.bis).toLocaleDateString('de-DE', MON);
  return a === b ? `belegt ${a}` : `belegt ${a} – ${b}`;
}
export function zahlWort(k){
  const n = (x, e, m) => `${x} ${x === 1 ? e : m}`;
  if(k.art === 'ort') return `${n(k.anzahl, 'App', 'Apps')} · ${n(k.fassungen, 'Fassung', 'Fassungen')}`;
  if(k.art === 'app') return `${n(k.anzahl, 'Werk', 'Werke')} · ${n(k.fassungen, 'Fassung', 'Fassungen')}`;
  if(k.art === 'fassung') return zeichenWort(k.zeichen);
  return n(k.fassungen, 'Fassung', 'Fassungen');
}
