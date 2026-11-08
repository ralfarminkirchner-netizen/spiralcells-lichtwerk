/* Der Spiralbaum (Ralf, 08.11.2026): vom Gesamtnetz Stufe für Stufe in eine einzelne Spiral Cell.

   Aus dem Fundus-Export wird ein Baum: Orte → Apps → Werke → Fassungen. Ein Werk an mehreren Orten steht an
   jedem dasselbe Werk (gleiche Schlüssel, Hinweis „auch in …“). Bruchstücke stehen nicht als eigene Werke:
   „Stelle aus …“ liegt im eigenen Material der App, gleich benannte Werke sind ein Werk, Zwischenstände mit
   gemeinsamem Vornamen („Invaria 2 · …“) liegen in diesem einen Werk. Auf keiner Stufe mehr als BIS Dinge;
   der Rest liegt gebündelt in „noch n kleinere“. Reine Funktionen, sie lesen nur. */

import {ORTSARTEN, FOLGE} from './ortsgraph.js';

export const BIS = 9;           // so viele Dinge stehen auf einer Stufe einzeln, dazu ein Bündel: das Bündel ist wieder dieselbe Spirale (fraktal)
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
    // Orte und Bereiche in einem Ort bleiben immer sichtbar; gebündelt wird nur, was darüber hinaus klein ist
    const fest = k.kinder.filter(c => c.art === 'ort' || c.art === 'bereich'), lose = k.kinder.filter(c => !fest.includes(c));
    const frei = Math.max(1, BIS - fest.length);
    if(lose.length > frei + 1){
      const rest = lose.slice(frei), w = wort[k.art] || 'kleinere';
      const b = zaehle({art: rest[0].art === 'fassung' ? 'buendel-fassung' : 'buendel', name: `noch ${rest.length} ${w}`, kinder: rest, schluessel: k.schluessel + '/rest'});
      buendle(b, wort);
      k.kinder = [...k.kinder.filter(c => fest.includes(c) || lose.slice(0, frei).includes(c)), b];
    }
  }
  return k;
}

const vorname = t => { const i = t.indexOf(' · '); return i > 0 ? t.slice(0, i).trim() : ''; };

export function spiralbaum(g, bilder = {}){
  const W = new Map((g.works || []).map(w => [w.id, w])), name = id => ((W.get(id) || {}).title || '').trim();
  // die Kanten „gehört zu“, ohne ersetzte (der Fundus überschreibt nicht, er ersetzt)
  const hoch = new Map(), runter = new Map(), dazu = (m, k, v) => { if(!m.has(k)) m.set(k, []); if(!m.get(k).includes(v)) m.get(k).push(v); };
  for(const k of (g.fundus && g.fundus.kanten) || []){
    if(k.ersetzt_durch || k.art !== 'gehört zu' || k.form !== 'B' || !k.gespeichert || !W.has(k.von) || !W.has(k.zu) || k.von === k.zu) continue;
    dazu(hoch, k.von, k.zu); dazu(runter, k.zu, k.von);
  }
  const istOrt = id => ORTSARTEN.has((W.get(id) || {}).work_type), istBereich = id => (W.get(id) || {}).work_type === 'Bereich';
  const zweig = new Map((g.worktrees || []).map(t => [t.id, t.work_id]));
  const fassungenVon = new Map();
  for(const v of g.variants || []){ const w = zweig.get(v.worktree_id); if(!w) continue; if(!fassungenVon.has(w)) fassungenVon.set(w, []); fassungenVon.get(w).push(v); }
  const blatt = (v, werkName) => { const zeichen = (v.content || '').length, t = sortierDatum(v);
    return {art: 'fassung', name: (v.label || '').trim() || werkName, werk: werkName, zeichen, fassungen: 1, wert: Math.max(MINDESTENS, zeichen), bilder: bilder[v.id] || [],
      von: t ?? Infinity, bis: t ?? -Infinity, datiert: t == null ? 0 : 1, schluessel: v.id}; };
  const blaetter = id => (fassungenVon.get(id) || []).map(v => blatt(v, name(id)))
    .sort((a, b) => (a.von === Infinity) - (b.von === Infinity) || a.von - b.von || a.name.localeCompare(b.name, 'de'));
  // die Orte eines Werks: die nächsten Orte darüber, über Apps und Bereiche hinweg
  const orteMemo = new Map();
  const orteVon = (id, weg = new Set()) => {
    if(orteMemo.has(id)) return orteMemo.get(id);
    const r = new Set(); weg.add(id);
    for(const z of hoch.get(id) || []){ if(weg.has(z)) continue; if(istOrt(z)) r.add(z); else for(const o of orteVon(z, weg)) r.add(o); }
    weg.delete(id); orteMemo.set(id, r); return r;
  };
  const orteNamen = id => [...orteVon(id)].sort((a, b) => rang(name(a)) - rang(name(b))).map(name);
  const rang = t => { const r = FOLGE.indexOf(t); return r < 0 ? FOLGE.length : r; };

  /* Ein Knoten und alles, was zu ihm gehört – so tief, wie die Kanten reichen */
  function knoten(id, art, weg){
    const nm = name(id), unten = (runter.get(id) || []).filter(c => !weg.has(c)), weiter = new Set(weg).add(id);
    if(art === 'ort' || art === 'bereich'){
      const kinder = unten.map(c => knoten(c, istOrt(c) ? 'ort' : istBereich(c) ? 'bereich' : 'app', weiter));
      const eigen = blaetter(id);
      if(eigen.length) kinder.push({art: 'werk', name: nm, eigen: true, teile: [], auch: [], kinder: eigen, schluessel: 'eigen:' + id, ids: [id]});
      return art === 'ort' ? {art, name: nm, ortsart: W.get(id).work_type, kinder, schluessel: 'ort:' + id}
        : {art, name: nm, auch: orteNamen(id), kinder, schluessel: 'bereich:' + id, ids: [id]};
    }
    // eine App: Stellen liegen im eigenen Material, Gleichnamiges und Zwischenstände mit gemeinsamem Vornamen sind je ein Werk
    const eigen = blaetter(id), gruppen = new Map(), zaehlVorname = new Map();
    for(const w of unten){ const p = vorname(name(w)); if(p) zaehlVorname.set(p, (zaehlVorname.get(p) || 0) + 1); }
    for(const w of unten){
      const t = name(w);
      if(/^Stelle aus\b/.test(t) && !(runter.get(w) || []).length){ eigen.push(...blaetter(w).map(b => ({...b, name: t}))); continue; }
      const p = vorname(t), key = p && p.toLowerCase() !== nm.toLowerCase() && zaehlVorname.get(p) >= 2 ? p : t;
      if(!gruppen.has(key)) gruppen.set(key, {ids: [], titel: []});
      const gr = gruppen.get(key); gr.ids.push(w); gr.titel.push(t);
    }
    const kinder = [...gruppen].map(([key, gr]) => {
      // ein einzelnes Werk, unter dem selbst noch etwas hängt, ist wieder eine App: derselbe Bau eine Stufe tiefer
      if(gr.ids.length === 1 && (runter.get(gr.ids[0]) || []).some(c => !weiter.has(c))) return knoten(gr.ids[0], 'app', weiter);
      const teile = [...new Set(gr.titel)];
      const blt = gr.ids.flatMap(i => blaetter(i).map(b => teile.length > 1 ? {...b, name: b.werk === b.name ? b.werk : `${b.werk} · ${b.name}`} : b));
      const variante = teile.length > 1 || gr.ids.some(i => /variante/i.test((W.get(i) || {}).work_type || ''));
      return {art: 'werk', name: key, teile, variante, auch: [...new Set(gr.ids.flatMap(orteNamen))], kinder: blt, schluessel: 'werk:' + [...gr.ids].sort().join('+'), ids: gr.ids};
    });
    // Ralf, 08.11.: „alles, von dem es mehrere Varianten gibt, auch einen eigenen Ast, auf dem diese gezeigt werden“ –
    // die Varianten einer App stehen zusammen auf einem Ast, getrennt von ihren übrigen Werken
    const varianten = kinder.filter(c => c.variante);
    if(varianten.length){ kinder.splice(0, kinder.length, ...kinder.filter(c => !c.variante),
      {art: 'varianten', name: 'Varianten', auch: [], kinder: varianten, schluessel: 'varianten:' + id, ids: [id]}); }
    if(eigen.length) kinder.push({art: 'werk', name: nm, eigen: true, teile: [], auch: orteNamen(id), kinder: eigen, schluessel: 'eigen:' + id, ids: [id]});
    return {art: 'app', name: nm, auch: orteNamen(id), kinder, schluessel: 'app:' + id, ids: [id]};
  }

  // oben stehen die Orte, die zu keinem anderen Ort gehören, in Ralfs fester Folge
  const oben = [...W.keys()].filter(id => istOrt(id) && !(hoch.get(id) || []).some(istOrt))
    .sort((a, b) => rang(name(a)) - rang(name(b)) || name(a).localeCompare(name(b), 'de'));
  const orte = oben.map(id => knoten(id, 'ort', new Set()));
  const wurzel = {art: 'wurzel', name: 'Alle Orte', kinder: orte.slice(), schluessel: 'wurzel'};   // zaehle sortiert nach Menge, die Folge bleibt in orte
  zaehle(wurzel); wurzel.kinder = orte.filter(o => o.kinder.length);   // Orte bleiben in der festen Folge; leere fallen weg
  for(const o of wurzel.kinder) buendle(o, {ort: 'kleinere Apps', bereich: 'kleinere Apps', app: 'kleinere Werke', werk: 'weitere Fassungen', varianten: 'weitere Varianten', buendel: 'kleinere'});
  verteileBilder(wurzel);
  return wurzel;
}

/* Bilder (Ralf, 08.11.: „immer das gleiche Bild für mehrere Dinge … noch schlechter geht es ja wohl nicht“, später:
   „wirklich extrem viele Bilder, die aber alle die richtigen sein sollen“). Ein Bild gehört der Fassung, der es der
   Fundus zuordnet, und steht nur einmal im Baum. Zuerst wählt die App (ihr eigenes Material, sonst ihr größtes Werk),
   dann jedes Werk (seine jüngste Fassung), zuletzt jedes Blatt das nächste eigene Bild seiner Fassung. Unscharfe
   Bilder (kürzere Seite unter SCHARF Pixel) stehen nirgends. Orte und Bereiche bekommen keins geliehen. */
export const SCHARF = 360;
const scharf = b => !(b.b && b.h) || Math.min(b.b, b.h) >= SCHARF;
function verteileBilder(wurzel){
  const benutzt = new Set();
  const jungZuerst = l => l.slice().sort((a, b) => (b.von === Infinity ? -Infinity : b.von) - (a.von === Infinity ? -Infinity : a.von));
  const fassungenUnter = k => k.art === 'fassung' ? [k] : (k.kinder || []).flatMap(fassungenUnter);
  const nimm = kandidaten => { for(const f of kandidaten) for(const b of f.bilder || []) if(scharf(b) && !benutzt.has(b.pfad)){ benutzt.add(b.pfad); return b; } return null; };
  const gib = (k, b) => { if(b) Object.assign(k, {bild: b.pfad, bildText: b.text, bildHoch: b.b && b.h ? b.h / b.b : 1}); };
  const stufe = [wurzel], blaetter = [];
  while(stufe.length){   // Stufe für Stufe: was weiter außen steht, wählt zuerst
    const k = stufe.shift();
    if(k.art === 'app'){ const eigen = (k.kinder || []).find(c => c.eigen);
      gib(k, nimm([...jungZuerst(eigen ? fassungenUnter(eigen) : []), ...(k.kinder || []).flatMap(c => jungZuerst(fassungenUnter(c)))])); }
    else if(k.art === 'werk') gib(k, nimm(jungZuerst(fassungenUnter(k))));
    for(const c of k.kinder || []) (c.art === 'fassung' ? blaetter : stufe).push(c);
  }
  for(const f of blaetter) gib(f, nimm([f]));
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
  if(k.art === 'bereich') return `${n(k.anzahl, 'App', 'Apps')} · ${n(k.fassungen, 'Fassung', 'Fassungen')}`;
  if(k.art === 'fassung') return zeichenWort(k.zeichen);
  if(k.art === 'varianten') return `${n(k.anzahl, 'Variante', 'Varianten')} · ${n(k.fassungen, 'Fassung', 'Fassungen')}`;
  return n(k.fassungen, 'Fassung', 'Fassungen');
}
