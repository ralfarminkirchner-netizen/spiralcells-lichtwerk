/* Ein Inhalt (Ralf, 10.11.2026): „Das sind keine verschiedenen Apps, es ist eine. Ein Inhalt, nur verschiedene Ansichten.“

   Aus dem Fundus-Graph wird einmal das gemeinsame Gefüge gebaut, das jede Ansicht liest:
   Orte → (Bereiche →) Apps → Werke → Fassungen, dazu Gespräche an ihrer App.
   Ein Werk an mehreren Orten ist dasselbe Werk: gleicher Schlüssel an jeder Stelle.
   Schreibvarianten und Zwischenstände mit gemeinsamem Vornamen sind ein Werk.
   Nichts wird gebündelt oder weggelassen. Reine Funktionen, sie lesen nur. */

import {fassungsNamen, lesbarerName} from './namen.js';

export const FOLGE = ['Tragwerk System', 'Mitte', 'MiND-BODY-SOUL', 'GAMES', 'MUSiC', 'EDUCATiON', 'WRiTING', 'ARTS', 'PERSONAL', 'Tragwerk', 'Zur Prüfung'];
export const TRAGEND = new Set(['Tragwerk System', 'Mitte', 'Tragwerk']);   // was trägt: im Baum die Wurzeln, im Kosmos die Sonne
export const OFFEN = new Set(['Zur Prüfung']);                               // noch ohne Ort
const ORTSARTEN = new Set(['Oberdach', 'Mitte', 'Tragwerk', 'Sammlung']);
export const SCHARF = 360;   // kürzere Seite eines Bildes, ab der es gezeigt wird

const datum = s => { const m = typeof s === 'string' && s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/); return m ? Date.UTC(+m[1], +m[2] - 1, m[3] ? +m[3] : 15) : null; };
const vorname = t => { const i = t.indexOf(' · '); return i > 0 ? t.slice(0, i).trim() : ''; };
const rang = t => { const r = FOLGE.indexOf(t); return r < 0 ? FOLGE.length : r; };
const nachZeit = (a, b) => (a.von == null) - (b.von == null) || (a.von ?? 0) - (b.von ?? 0) || a.name.localeCompare(b.name, 'de');

export function baueInhalt(g, bilder = {}, gespraeche = []){
  const W = new Map((g.works || []).map(w => [w.id, w]));
  const titel = id => lesbarerName(((W.get(id) || {}).title || '').trim(), woerter);
  const woerter = new Map();   // wie Ralf ein Wort schreibt: „faska“ → „FASKA“
  for(const w of g.works || []) for(const t of String(w.title || '').split(/[^\p{L}\p{N}]+/u)) if(t.length > 2 && /\p{Lu}/u.test(t) && !woerter.has(t.toLowerCase())) woerter.set(t.toLowerCase(), t);

  const hoch = new Map(), runter = new Map(), dazu = (m, k, v) => { if(!m.has(k)) m.set(k, []); if(!m.get(k).includes(v)) m.get(k).push(v); };
  for(const k of (g.fundus && g.fundus.kanten) || []){
    if(k.ersetzt_durch || k.art !== 'gehört zu' || k.form !== 'B' || !k.gespeichert || !W.has(k.von) || !W.has(k.zu) || k.von === k.zu) continue;
    dazu(hoch, k.von, k.zu); dazu(runter, k.zu, k.von);
  }
  const istOrt = id => ORTSARTEN.has((W.get(id) || {}).work_type), istBereich = id => (W.get(id) || {}).work_type === 'Bereich';
  const zweig = new Map((g.worktrees || []).map(t => [t.id, t]));
  const stimme = new Map((g.agents || []).map(a => [a.id, a.handle]));
  const roh = new Map();
  for(const v of g.variants || []){ const z = zweig.get(v.worktree_id); if(!z) continue; if(!roh.has(z.work_id)) roh.set(z.work_id, []); roh.get(z.work_id).push(v); }

  const blaetter = id => {
    const vs = roh.get(id) || [], werk = titel(id);
    const namen = fassungsNamen(vs.map(v => ({label: v.label, zeit: datum(v.fundus && v.fundus.sortierung), zweig: (zweig.get(v.worktree_id) || {}).name, stimme: stimme.get(v.author_id)})), werk, woerter);
    return vs.map((v, i) => { const t = datum(v.fundus && v.fundus.sortierung), b = (bilder[v.id] || []).filter(x => !(x.b && x.h) || Math.min(x.b, x.h) >= SCHARF);
      return {art: 'fassung', name: namen[i], werk, kennung: v.id, zeichen: (v.content || '').length, bilder: b, von: t, bis: t,
        stimme: stimme.get(v.author_id) || '', urteil: (v.fundus && v.fundus.urteil) || 'offen', schluessel: 'f:' + v.id}; }).sort(nachZeit);
  };

  const orteMemo = new Map();
  const orteVon = (id, weg = new Set()) => {
    if(orteMemo.has(id)) return orteMemo.get(id);
    const r = new Set(); weg.add(id);
    for(const z of hoch.get(id) || []){ if(weg.has(z)) continue; if(istOrt(z)) r.add(z); else for(const o of orteVon(z, weg)) r.add(o); }
    weg.delete(id); orteMemo.set(id, r); return r;
  };
  const orteNamen = id => [...orteVon(id)].map(titel).sort((a, b) => rang(a) - rang(b));

  const anName = new Map(), anOrt = new Map(), merke = (m, k, c) => { if(!m.has(k)) m.set(k, []); m.get(k).push(c); };
  for(const c of gespraeche){ if(c.zu && c.zu.length) for(const z of c.zu) merke(anName, z.toLowerCase(), c); else for(const o of c.orte || []) merke(anOrt, o, c); }
  const vergeben = new Set();
  const gespraechsBlaetter = liste => (liste || []).map(c => { vergeben.add(c.n); const t = datum(c.datum);
    return {art: 'gespraech', name: c.titel, nr: c.n, zeichen: 0, bilder: [], von: t, bis: t, schluessel: 'g:' + c.n}; });

  function knoten(id, art, weg){
    const nm = titel(id), unten = (runter.get(id) || []).filter(c => !weg.has(c)), weiter = new Set(weg).add(id);
    if(art === 'ort' || art === 'bereich'){
      const kinder = unten.map(c => knoten(c, istOrt(c) ? 'ort' : istBereich(c) ? 'bereich' : 'app', weiter));
      kinder.push(...blaetter(id), ...gespraechsBlaetter(art === 'ort' ? anOrt.get(nm) : anName.get(nm.toLowerCase())));
      return {art, name: nm, auch: art === 'ort' ? [] : orteNamen(id), kinder, schluessel: art + ':' + id};
    }
    const eigen = blaetter(id), gruppen = new Map(), zaehl = new Map();
    for(const w of unten){ const p = vorname(titel(w)); if(p) zaehl.set(p, (zaehl.get(p) || 0) + 1); }
    for(const w of unten){
      const t = titel(w);
      if(/^Stelle aus\b/.test(t) && !(runter.get(w) || []).length){ eigen.push(...blaetter(w).map(b => ({...b, name: t}))); continue; }
      const p = vorname(t), key = p && p.toLowerCase() !== nm.toLowerCase() && zaehl.get(p) >= 2 ? p : t;
      if(!gruppen.has(key)) gruppen.set(key, {ids: [], titel: []});
      gruppen.get(key).ids.push(w); gruppen.get(key).titel.push(t);
    }
    const kinder = [...gruppen].map(([key, gr]) => {
      if(gr.ids.length === 1 && (runter.get(gr.ids[0]) || []).some(c => !weiter.has(c))) return knoten(gr.ids[0], 'app', weiter);
      const teile = [...new Set(gr.titel)];
      const blt = gr.ids.flatMap(i => blaetter(i).map(b => teile.length > 1 && b.werk !== key ? {...b, name: b.name.startsWith(b.werk) ? b.name : `${b.werk.replace(key + ' · ', '')} · ${b.name}`} : b)).sort(nachZeit);
      return {art: 'werk', name: key, teile, auch: [...new Set(gr.ids.flatMap(orteNamen))], kinder: blt, schluessel: 'w:' + [...gr.ids].sort().join('+')};
    });
    kinder.push(...eigen.sort(nachZeit), ...gespraechsBlaetter(anName.get(nm.toLowerCase())));
    return {art: 'app', name: nm, auch: orteNamen(id), kinder, schluessel: 'a:' + id};
  }

  const oben = [...W.keys()].filter(id => istOrt(id) && !(hoch.get(id) || []).some(istOrt))
    .sort((a, b) => rang(titel(a)) - rang(titel(b)) || titel(a).localeCompare(titel(b), 'de'));
  const wurzel = {art: 'wurzel', name: 'Ralfs Werke', auch: [], kinder: oben.map(id => knoten(id, 'ort', new Set())).filter(o => o.kinder.length), schluessel: 'wurzel'};
  // Gespräche, die an keiner App und keinem Ort hängen, bleiben erreichbar: an der Wurzel
  wurzel.kinder.push(...gespraechsBlaetter(gespraeche.filter(c => !vergeben.has(c.n))).filter(Boolean));

  const alle = [], nachSchluessel = new Map();
  (function lauf(k, eltern, tiefe){
    k.eltern = eltern; k.tiefe = tiefe; k.nr = alle.length; alle.push(k);
    if(!nachSchluessel.has(k.schluessel)) nachSchluessel.set(k.schluessel, []); nachSchluessel.get(k.schluessel).push(k);
    if(!k.kinder){ k.blaetter = 1; k.fassungen = k.art === 'fassung' ? 1 : 0; k.gespraeche = k.art === 'gespraech' ? 1 : 0; k.bildzahl = k.bilder.length; return; }
    eindeutig(k.kinder);
    let z = 0, f = 0, gs = 0, bz = 0, bl = 0, von = null, bis = null;
    for(const c of k.kinder){ lauf(c, k, tiefe + 1); z += c.zeichen; f += c.fassungen; gs += c.gespraeche; bz += c.bildzahl; bl += c.blaetter;
      if(c.von != null && (von == null || c.von < von)) von = c.von; if(c.bis != null && (bis == null || c.bis > bis)) bis = c.bis; }
    Object.assign(k, {zeichen: z, fassungen: f, gespraeche: gs, bildzahl: bz, blaetter: bl, von, bis});
    if(k.art !== 'wurzel') k.kinder.sort((a, b) => !!a.kinder === !!b.kinder ? nachZeit(a, b) : a.kinder ? -1 : 1);   // das Früheste zuerst; Äste vor losen Blättern
  })(wurzel, null, 0);

  // ein Bild je Werk und App: das jüngste eigene, jedes Bild nur einmal
  const benutzt = new Set();
  const fassungenUnter = k => k.art === 'fassung' ? [k] : (k.kinder || []).flatMap(fassungenUnter);
  for(const k of alle){ if(k.art !== 'app' && k.art !== 'werk') continue;
    for(const f of fassungenUnter(k).sort((a, b) => (b.von ?? -1) - (a.von ?? -1))){ const b = f.bilder.find(x => !benutzt.has(x.pfad)); if(b){ benutzt.add(b.pfad); k.bild = b; break; } } }
  for(const k of alle) if(k.art === 'fassung') k.bild = k.bilder[0] || null;

  let von = null, bis = null; for(const k of alle){ if(k.kinder || k.von == null) continue; if(von == null || k.von < von) von = k.von; if(bis == null || k.bis > bis) bis = k.bis; }
  return {wurzel, alle, nachSchluessel, von, bis, stand: (g.fundus && g.fundus.stand_vermerk) || ''};
}

/* Geschwister tragen nie denselben Namen: erst das belegte Datum dazu, dann eine Zählung */
function eindeutig(kinder){
  const zaehle = () => { const z = new Map(); for(const c of kinder) z.set(c.name, (z.get(c.name) || 0) + 1); return z; };
  let z = zaehle();
  for(const c of kinder) if(z.get(c.name) > 1 && !c.kinder && c.von != null) c.name += ' · ' + new Date(c.von).toLocaleDateString('de-DE', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});
  z = zaehle(); const lauf = new Map();
  for(const c of kinder) if(z.get(c.name) > 1){ const i = (lauf.get(c.name) || 0) + 1; lauf.set(c.name, i); c.name2 = `${i} von ${z.get(c.name)}`; }
  for(const c of kinder) if(c.name2){ c.name += ' · ' + c.name2; delete c.name2; }
}

/* Der Weg von der Wurzel zu einem Knoten */
export const wegZu = k => { const w = []; for(let q = k; q; q = q.eltern) w.unshift(q); return w; };

/* Worte statt Kennungen */
const n = (x, e, m) => `${x.toLocaleString('de-DE')} ${x === 1 ? e : m}`;
export const ARTWORT = {wurzel: 'Alles', ort: 'Ort', bereich: 'Bereich', app: 'App', werk: 'Werk', fassung: 'Fassung', gespraech: 'Gespräch'};
export function mengenWort(k){
  if(k.art === 'gespraech') return 'Gespräch';
  if(k.art === 'fassung') return k.zeichen < 1000 ? n(k.zeichen, 'Zeichen', 'Zeichen') : `${Math.round(k.zeichen / 1000).toLocaleString('de-DE')} Tsd. Zeichen`;
  const t = []; const unter = (k.kinder || []).filter(c => c.kinder).length;
  if(k.art === 'wurzel') t.push(n(unter, 'Ort', 'Orte')); else if(k.art === 'ort' || k.art === 'bereich') t.push(n(unter, 'App', 'Apps')); else if(k.art === 'app' && unter) t.push(n(unter, 'Werk', 'Werke'));
  t.push(n(k.fassungen, 'Fassung', 'Fassungen')); if(k.gespraeche) t.push(n(k.gespraeche, 'Gespräch', 'Gespräche')); if(k.bildzahl) t.push(n(k.bildzahl, 'Bild', 'Bilder'));
  return t.join(' · ');
}
const MON = {month: 'long', year: 'numeric', timeZone: 'UTC'};
export function zeitWort(k){
  if(k.von == null) return 'Zeit nicht belegt';
  const a = new Date(k.von).toLocaleDateString('de-DE', MON), b = new Date(k.bis).toLocaleDateString('de-DE', MON);
  return a === b ? a : `${a} bis ${b}`;
}
/* lesbare Adresse eines Knotens: nur Buchstaben, Ziffern, Bindestriche */
export const adresse = k => wegZu(k).slice(1).map(q => q.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)).join('/');
