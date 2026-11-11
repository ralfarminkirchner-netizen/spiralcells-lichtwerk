/* Campus — Lernen und Zusammenhänge.

   Die Ordnung des Campus sind die Gebiete, nicht die Orte: jedes Gebiet, das der Fundus berechnet hat, ist ein
   Haus des Themas. Seine Fläche folgt der Zahl der Werke darin (mit einer Mindestgröße, damit man es lesen kann).
   Häuser, die viele Werke teilen, liegen nah beieinander; die Wege zwischen ihnen sind berechnet, nicht gebaut.
   Werke mit mehreren Gebieten stehen in jedem Haus und sind dort als dasselbe Werk gekennzeichnet.
   Werke ohne Gebiet bleiben sichtbar: „Noch keinem Gebiet zugeordnet“.

   Im Haus liegt das Material: alle Werke (Bild, Name, Ort, Fassungen), die Werkstätten (Apps mit vielen Fassungen)
   und der Lesesaal (Gespräche und Fassungen, die nur Text sind).

   Der Lernweg geht von einem gewählten Werk oder einer Fassung aus:
   - belegt: Ketten über gespeicherte Kanten „folgt auf“, „erweitert“, „remixt aus“, früher links, später rechts;
   - Vorschlag, berechnet: Werke im selben Gebiet oder aus demselben Quellbestand, gestrichelt.
   Wer einer Station folgt, hinterlässt eine Spur; „Zurück zum Ausgangspunkt“ führt dorthin zurück.
   Keine Lehrpläne, keine Kompetenzen: nur, was der Fundus hat. */

import {el, knopf, farbe, titelBild, bildEl, fassungenUnter, behaelter, ortVon, n, tagWort, stil, ruhig} from './gemein.js';
import {BELEGT, BERECHNET} from './bezug.js';
import {mengenWort} from './inhalt.js';

export const legende = `<p><b>Gebiete sind vom Fundus berechnet, keine Lehrpläne.</b> Jedes Gebiet ist ein Haus. Seine Fläche folgt der Zahl der Werke darin; ganz kleine Häuser haben eine Mindestgröße. Die Zahl steht immer dabei.</p>
<p>Häuser, die viele Werke teilen, liegen nah beieinander. Die <i>gestrichelten Wege</i> zwischen ihnen sind berechnet: so viele Werke liegen in beiden. Die Lage ist Gestaltung, keine Rangfolge.</p>
<p>Ein Werk mit mehreren Gebieten steht in jedem Haus und trägt dort das Zeichen <b>⧉</b>: dasselbe Werk. Unten: Gebiete mit nur einem oder zwei Werken, und was noch keinem Gebiet zugeordnet ist.</p>
<p><b>Lernweg</b>: Ein gewähltes Werk ist der Ausgangspunkt. <span style="border-bottom:2px solid currentColor">Durchgezogen</span>: belegter Weg aus dem Fundus (folgt auf, erweitert, remixt aus), früher links, später rechts. <span style="border-bottom:2px dashed currentColor">Gestrichelt</span>: Vorschlag, berechnet. Wer einer Station folgt, hinterlässt eine Spur.</p>
<p>Ein Tipp wählt; ein zweiter Tipp auf eine gewählte Fassung öffnet sie zum Lesen.</p>`;

const WEG = new Set(['folgt auf', 'erweitert', 'remixt aus']);
const OHNE = '\u0000ohne';               // Schlüssel des Hauses „noch keinem Gebiet zugeordnet“ (nie sichtbar)
const KLEIN = 2;                          // Gebiete mit höchstens so vielen Werken stehen im Anbau
const WERKSTATT = 12;                     // Werkstatt: ein Werk oder eine App mit mindestens so vielen Fassungen
const SPALTE_ZEIGT = 6, VORSCHLAG_ZEIGT = 8, LESESAAL_ZEIGT = 80;
const inWort = k => k.eltern && k.eltern.art !== 'ort' && k.eltern.art !== 'wurzel' ? 'in ' + k.eltern.name : '';
const istBlatt = k => k.art === 'fassung' || k.art === 'gespraech';
const gleich = (a, b) => !!a && !!b && a.schluessel === b.schluessel;
const zeitfolge = (a, b) => (a.von == null) - (b.von == null) || (a.von ?? 0) - (b.von ?? 0) || a.name.localeCompare(b.name, 'de');
const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (tag, at = {}) => { const e = document.createElementNS(SVGNS, tag); for(const [a, v] of Object.entries(at)) e.setAttribute(a, v); return e; };
const textZeichen = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 11h8M8 14h8M8 17h5"/></svg>';
const gespraechZeichen = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>';

/* Was der Campus sich über einen Ausflug in eine andere Ansicht hinweg merkt: Spur, Haus, Filter */
let gedaechtnis = null;

export function starte(flaeche, K){
  stil('campus');
  const I = K.inhalt;

  /* ---------- Bestand einmal ordnen ---------- */
  // Ein Werk an mehreren Orten ist dasselbe Werk: eine Karte je Schlüssel
  const werke = [], jeSchluessel = new Map();
  for(const k of I.alle){ if(k.art !== 'werk' && k.art !== 'app') continue; if(jeSchluessel.has(k.schluessel)) continue; jeSchluessel.set(k.schluessel, k); werke.push(k); }
  const orteZahl = s => (I.nachSchluessel.get(s) || []).length;
  const gebietMap = new Map();
  for(const w of werke){ const gs = w.gebiete && w.gebiete.length ? w.gebiete : [OHNE];
    for(const g of gs){ if(!gebietMap.has(g)) gebietMap.set(g, []); gebietMap.get(g).push(w); } }
  for(const l of gebietMap.values()) l.sort((a, b) => b.fassungen - a.fassungen || a.name.localeCompare(b.name, 'de'));
  const gebieteVon = w => w.gebiete && w.gebiete.length ? w.gebiete : [OHNE];
  const gebietName = g => g === OHNE ? 'Noch keinem Gebiet zugeordnet' : g;

  const haeuser = [...gebietMap].filter(([g, l]) => g !== OHNE && l.length > KLEIN).map(([g, l]) => ({g, werke: l}));
  const anbau = [...gebietMap].filter(([g, l]) => g !== OHNE && l.length <= KLEIN).map(([g, l]) => ({g, werke: l})).sort((a, b) => b.werke.length - a.werke.length || a.g.localeCompare(b.g, 'de'));
  const ohne = {g: OHNE, werke: gebietMap.get(OHNE) || []};
  const hausVon = new Map([...haeuser, ...anbau, ohne].map(h => [h.g, h]));

  // Gemeinsame Werke zwischen Häusern: berechnet aus den Gebieten
  const teilen = new Map();
  for(const h of haeuser){ const s = new Set(h.werke.map(w => w.schluessel)); h.menge = s; }
  for(const a of haeuser) for(const b of haeuser){ if(a === b) continue; let z = 0; for(const s of a.menge) if(b.menge.has(s)) z++; if(z) teilen.set(a.g + '|' + b.g, z); }
  const geteilt = (a, b) => teilen.get(a.g + '|' + b.g) || 0;
  const nachbarn = h => haeuser.filter(x => x !== h && geteilt(h, x)).sort((x, y) => geteilt(h, y) - geteilt(h, x));

  // Reihenfolge des Plans: vom größten Haus aus immer das, das am meisten mit den schon gesetzten teilt
  const planFolge = []; { const rest = new Set(haeuser);
    while(rest.size){ let best = null, bs = -1;
      for(const h of rest){ const s = planFolge.reduce((t, q) => t + geteilt(h, q), 0) * 1000 + h.werke.length; if(s > bs){ bs = s; best = h; } }
      planFolge.push(best); rest.delete(best); } }

  // Werkstatt und Lesesaal je Haus
  const werkstaetten = h => h.werke.filter(w => w.fassungen >= WERKSTATT);
  const lesesaalMemo = new Map();
  const lesesaal = h => { if(lesesaalMemo.has(h.g)) return lesesaalMemo.get(h.g);
    const r = [], gesehen = new Set();
    for(const w of h.werke) for(const f of fassungenUnter(w)){ if(gesehen.has(f.schluessel)) continue;
      if(f.art === 'gespraech' || (f.art === 'fassung' && !f.bilder.length && f.zeichen > 0)){ gesehen.add(f.schluessel); r.push(f); } }
    r.sort((a, b) => (a.art === 'gespraech' ? 0 : 1) - (b.art === 'gespraech' ? 0 : 1) || (b.von ?? -Infinity) - (a.von ?? -Infinity) || a.name.localeCompare(b.name, 'de'));
    lesesaalMemo.set(h.g, r); return r; };
  // Bilder eines Hauses: das Titelbild seiner größten Werke, jedes Bild nur einmal
  const bilderVon = (h, max) => { const r = [], g = new Set(); for(const w of h.werke){ const b = titelBild(w); if(b && !g.has(b.pfad)){ g.add(b.pfad); r.push(b); if(r.length >= max) break; } } return r; };

  /* ---------- Belegte Wege zwischen Fassungen ---------- */
  const aelter = new Map(), juenger = new Map(), dazu = (m, s, v) => { if(!m.has(s)) m.set(s, []); m.get(s).push(v); };
  for(const e of K.bezug.kanten){ if(!e.belegt || !WEG.has(e.art)) continue;
    dazu(aelter, e.von.schluessel, {k: e.zu, art: e.art});      // „A folgt auf B“: B ist früher
    dazu(juenger, e.zu.schluessel, {k: e.von, art: e.art}); }
  const hatWeg = f => aelter.has(f.schluessel) || juenger.has(f.schluessel);

  function lernweg(start){
    const werk = istBlatt(start) ? null : start;
    const S = werk ? fassungenUnter(werk).filter(f => f.art === 'fassung' && hatWeg(f)) : [start];
    const N = new Map(), tiefe = werk ? 3 : 5, GRENZE = 360;
    for(const f of S) N.set(f.schluessel, f);
    const imWerk = f => werk && gleich(behaelter(f), werk);
    // rückwärts nur zu Früherem, vorwärts nur zu Späterem: Ketten, keine Geschwister
    for(const [m] of [[aelter], [juenger]]){
      let rand = S.map(f => [f, 0]);
      while(rand.length && N.size < GRENZE){ const neu = [];
        for(const [f, d] of rand) for(const r of m.get(f.schluessel) || []){
          if(N.has(r.k.schluessel)) continue; const dd = imWerk(r.k) ? d : d + 1; if(dd > tiefe) continue;
          N.set(r.k.schluessel, r.k); neu.push([r.k, dd]); if(N.size >= GRENZE) break; }
        rand = neu; } }
    // Stufen: längster Weg vom Frühesten her (Kreise werden gebrochen)
    const stufe = new Map(), unterwegs = new Set();
    const st = s => { if(stufe.has(s)) return stufe.get(s); if(unterwegs.has(s)) return 0; unterwegs.add(s);
      let v = 0; for(const r of aelter.get(s) || []) if(N.has(r.k.schluessel)) v = Math.max(v, st(r.k.schluessel) + 1);
      unterwegs.delete(s); stufe.set(s, v); return v; };
    const spalten = [];
    for(const [s, f] of N){ const v = st(s); (spalten[v] ||= []).push(f); }
    const voll = spalten.filter(Boolean).map(l => l.sort(zeitfolge));
    // Kanten innerhalb des Wegs
    const kanten = [];
    for(const [s, f] of N) for(const r of aelter.get(s) || []) if(N.has(r.k.schluessel)) kanten.push({frueh: r.k, spaet: f, art: r.art});
    const ohneWeg = werk ? fassungenUnter(werk).filter(f => !N.has(f.schluessel)).sort(zeitfolge) : [];
    return {spalten: voll, kanten, N, ohneWeg, werk, start};
  }

  /* Vorschläge: berechnete Nachbarn, auf Werke gehoben.
     Quellen: die berechneten Kanten des Fundus (gleiche Themen, gemeinsamer Quellpfad) und die Gebiete selbst,
     die der Fundus ebenso berechnet hat. Ein seltenes gemeinsames Gebiet wiegt mehr als ein großes. */
  function vorschlaege(start){
    const w = istBlatt(start) ? behaelter(start) : start, ich = jeSchluessel.get(w.schluessel) || w;
    const r = new Map(), eintrag = k => { const rep = jeSchluessel.get(k.schluessel) || k; if(!r.has(rep.schluessel)) r.set(rep.schluessel, {k: rep, quell: 0}); return r.get(rep.schluessel); };
    for(const b of K.bezug.von(w)){ if(b.belegt) continue; const a = behaelter(b.andere); if(gleich(a, w)) continue; const e = eintrag(a); if(b.art === 'gemeinsamer Quellpfad') e.quell++; }
    for(const g of gebieteVon(ich)){ if(g === OHNE) continue; for(const x of gebietMap.get(g) || []) if(!gleich(x, w)) eintrag(x); }
    const mein = new Set(gebieteVon(ich));
    const l = [...r.values()].map(e => { e.gemeinsam = (e.k.gebiete || []).filter(g => mein.has(g)).sort((x, y) => gebietMap.get(x).length - gebietMap.get(y).length);
      e.wert = e.gemeinsam.reduce((t, g) => t + 1 + 10 / gebietMap.get(g).length, 0) + Math.min(e.quell, 6) * 0.8; return e; }).filter(e => e.wert > 0);
    return l.sort((a, b) => b.wert - a.wert || b.k.fassungen - a.k.fassungen || a.k.name.localeCompare(b.k.name, 'de'));
  }
  /* Belegte Bezüge ohne Lernrichtung (verweist auf, kannte beim Entstehen, gemeinsamer Bestand) */
  const querBezuege = start => K.bezug.von(start).filter(b => b.belegt && !WEG.has(b.art));

  /* ---------- Zustand der Ansicht ---------- */
  const Zs = {modus: 'plan', haus: null, filter: 'alles', gew: null, ausgang: null, spur: [], folgt: false, offen: new Set(), alleVorschlaege: false, lesesaalMehr: false, suche: null};

  const raum = el('div', 'campus'); flaeche.append(raum);
  const kopf = el('header', 'ckopf'), leib = el('div', 'cleib');
  raum.append(kopf, leib);
  let svgWege = null, svgLern = null;

  function zeichneKopf(){
    kopf.replaceChildren();
    const l = el('div', 'ckopflinks');
    const titel = el('p', 'cueber'); titel.append(el('b', '', Zs.modus === 'plan' ? 'Campusplan' : 'Haus des Themas'), document.createTextNode(' · ' + n(haeuser.length + anbau.length, 'Gebiet', 'Gebiete') + ', ' + n(werke.length, 'Werk', 'Werke')));
    l.append(titel, el('p', 'chinweis', 'Gebiete sind vom Fundus berechnet, keine Lehrpläne.'));
    kopf.append(l);
    const r = el('div', 'ckopfrechts');
    if(Zs.modus === 'haus') r.append(knopf('knopf', '← Campusplan', () => { Zs.modus = 'plan'; zeichne(); fokus('.chaus.hier, .chaus'); }));
    else if(Zs.ausgang && !istOrtartig(Zs.ausgang)){ const w = istBlatt(Zs.gew || Zs.ausgang) ? behaelter(Zs.gew || Zs.ausgang) : (Zs.gew || Zs.ausgang);
      r.append(knopf('knopf', 'Lernweg ab „' + w.name + '“ →', () => { Zs.modus = 'haus'; if(!Zs.haus) Zs.haus = hausFuer(w); zeichne(); fokus('.cstart'); })); }
    kopf.append(r);
  }
  const istOrtartig = k => k.art === 'wurzel' || k.art === 'ort' || k.art === 'bereich';
  const hausFuer = w => { const gs = gebieteVon(w); if(Zs.haus && gs.includes(Zs.haus.g)) return Zs.haus; return hausVon.get(gs.find(g => hausVon.get(g) && hausVon.get(g).werke.length > KLEIN) || gs[0]) || ohne; };
  const fokus = sel => requestAnimationFrame(() => { const e = raum.querySelector(sel); if(e) e.focus({preventScroll: false}); });

  /* ---------- Campusplan ---------- */
  function zeichnePlan(){
    leib.replaceChildren(); svgLern = null;
    const schmal = raum.clientWidth < 640;
    const gew = Zs.gew, gewW = gew && !istOrtartig(gew) ? (istBlatt(gew) ? behaelter(gew) : gew) : null;
    const gewGs = gewW ? new Set(gebieteVon(jeSchluessel.get(gewW.schluessel) || gewW)) : new Set();
    const gewOrt = gew && gew.art === 'ort' ? gew : null;
    const plan = el('section', 'cplan' + (schmal ? ' alsliste' : '')); plan.setAttribute('aria-label', 'Campusplan: die Gebiete als Häuser');
    leib.append(plan);
    if(gewW) plan.append(el('p', 'cplanhier', '„' + gewW.name + '“ liegt in ' + (gewGs.has(OHNE) ? 'keinem Gebiet' : n(gewGs.size, 'Haus', 'Häusern')) + ' — orange umrandet.'));
    if(gewOrt){ const z = [...haeuser, ...anbau, ohne].map(h => ({h, c: h.werke.filter(w => { const o = ortVon(w); return o && gleich(o, gewOrt); }).length})).filter(e => e.c).sort((a, b) => b.c - a.c);
      const p = el('div', 'cortwahl cchips'); p.style.setProperty('--ort-d', farbe(gewOrt).d);
      p.append(el('span', 'klein', z.length ? 'Werke aus ' + gewOrt.name + ' liegen in: ' : 'Aus ' + gewOrt.name + ' liegt kein Werk in einem Gebiet.'));
      for(const {h, c} of z){ const b = knopf('cchip', null, () => oeffneHaus(h)); b.append(el('span', '', gebietName(h.g)), el('small', '', String(c))); b.setAttribute('aria-label', gebietName(h.g) + ', ' + n(c, 'Werk', 'Werke') + ' aus ' + gewOrt.name); p.append(b); }
      plan.append(p); }

    const hausKnopf = (h, w, hh) => {
      const tr = treffer(h), b = knopf('chaus' + (gewGs.has(h.g) ? ' hier' : '') + (tr === 0 ? ' gedaempft' : ''), null, () => oeffneHaus(h));
      b.setAttribute('aria-label', 'Haus ' + h.g + ', ' + n(h.werke.length, 'Werk', 'Werke') + (gewGs.has(h.g) ? ', hier liegt die Wahl' : ''));
      const ws = werkstaetten(h).length, ls = lesesaal(h).length;
      const dach = el('span', 'cdach'); dach.append(el('span', 'cname', h.g));
      const zeile = el('span', 'czahl'); zeile.append(el('b', '', n(h.werke.length, 'Werk', 'Werke')));
      for(const x of [ws ? n(ws, 'Werkstatt', 'Werkstätten') : '', ls ? ls + ' im Lesesaal' : ''].filter(Boolean)) zeile.append(el('span', 'cdazu', x));
      if(tr != null && tr > 0) zeile.append(el('span', 'ctreffer', n(tr, 'Treffer', 'Treffer')));
      dach.append(zeile); b.append(dach);
      const sp = schmal ? 4 : Math.max(1, Math.round((w - 10) / 74)), rh = schmal ? 1 : Math.max(1, Math.round((hh - 74) / 74));
      const bl = bilderVon(h, sp * rh);
      const mos = el('span', 'cmosaik'); mos.style.gridTemplateColumns = `repeat(${sp}, minmax(0, 1fr))`; if(!schmal) mos.style.gridTemplateRows = `repeat(${rh}, minmax(0, 1fr))`;
      if(bl.length) for(const x of bl) mos.append(bildEl(K, x, 240, 'cbild')); else mos.append(bildEl(K, null, 240, 'cbild'));
      b.append(mos, ortLeiste(h, gewOrt));
      if(schmal){ const nb = nachbarn(h).slice(0, 3); if(nb.length) b.append(el('span', 'cnachbarn', 'Nachbarn: ' + nb.map(x => x.g + ' (' + geteilt(h, x) + ')').join(', '))); }
      return b;
    };

    if(schmal){
      const ul = el('ul', 'cschilder');
      for(const h of planFolge){ const li = el('li'); li.append(hausKnopf(h, 0, 0)); ul.append(li); }
      plan.append(el('p', 'cplanlese', 'Reihenfolge: Gebiete, die viele Werke teilen, stehen nebeneinander.'), ul);
    } else {
      const W = Math.max(560, raum.clientWidth - 40), H = Math.max(360, raum.clientHeight - 150);
      const summe = haeuser.reduce((s, h) => s + h.werke.length, 0), f = Math.max(W * H * 0.42 / summe, 900), AMIN = 140 * 122;
      for(const h of planFolge){ const A = Math.max(AMIN, h.werke.length * f); h.w = Math.round(Math.min(W * 0.62, Math.max(140, Math.sqrt(A * 1.5)))); h.h = Math.round(Math.max(122, A / h.w)); }
      const hoehe = packe(planFolge, W);
      const feld = el('div', 'cfeld'); feld.style.width = W + 'px'; feld.style.height = hoehe + 'px';
      svgWege = svg('svg', {class: 'cwege', width: W, height: hoehe, 'aria-hidden': 'true'});
      // Wege: für jedes Haus zu seinen zwei engsten Nachbarn
      const gezogen = new Set();
      for(const h of planFolge) for(const x of nachbarn(h).filter((x, i) => i === 0 || geteilt(h, x) / Math.min(h.werke.length, x.werke.length) >= 0.3).slice(0, 3)){ const sig = [h.g, x.g].sort().join('|'); if(gezogen.has(sig)) continue; gezogen.add(sig);
        const z = geteilt(h, x), d = `M${h.x + h.w / 2},${h.y + h.h / 2} L${x.x + x.w / 2},${x.y + x.h / 2}`;
        svgWege.append(svg('path', {d, class: 'cpflaster', 'stroke-width': 10 + Math.min(10, z)}), svg('path', {d, class: 'cstrich', 'stroke-width': Math.min(4, 1.2 + z / 6)})); }
      feld.append(svgWege);
      for(const h of planFolge){ const b = hausKnopf(h, h.w, h.h); b.style.left = h.x + 'px'; b.style.top = h.y + 'px'; b.style.width = h.w + 'px'; b.style.height = h.h + 'px'; feld.append(b); }
      plan.append(feld);
    }
    // Anbau: kleine Gebiete, jedes erreichbar
    if(anbau.length){ const a = el('section', 'canbau'); a.append(el('h3', '', 'Kleine Gebiete · je ein oder zwei Werke'));
      const ul = el('div', 'cchips');
      for(const h of anbau){ const tr = treffer(h); const b = knopf('cchip' + (gewGs.has(h.g) ? ' hier' : '') + (tr === 0 ? ' gedaempft' : ''), null, () => oeffneHaus(h));
        b.append(el('span', '', h.g), el('small', '', String(h.werke.length))); b.setAttribute('aria-label', 'Gebiet ' + h.g + ', ' + n(h.werke.length, 'Werk', 'Werke')); ul.append(b); }
      a.append(ul); leib.append(a); }
    // Offene Zuordnung
    if(ohne.werke.length){ const s = el('section', 'cohnegebiet'); const tr = treffer(ohne);
      const b = knopf('chaus offen' + (gewGs.has(OHNE) ? ' hier' : '') + (tr === 0 ? ' gedaempft' : ''), null, () => oeffneHaus(ohne));
      b.setAttribute('aria-label', 'Noch keinem Gebiet zugeordnet, ' + n(ohne.werke.length, 'Werk', 'Werke'));
      const dach = el('span', 'cdach'); dach.append(el('span', 'cname', 'Noch keinem Gebiet zugeordnet'), el('span', 'czahl', n(ohne.werke.length, 'Werk', 'Werke') + ' · offene Zuordnung'));
      const mos = el('span', 'cmosaik reihe'); for(const x of bilderVon(ohne, schmal ? 4 : 12)) mos.append(bildEl(K, x, 240, 'cbild'));
      b.append(dach, mos); if(tr){ const fu = el('span', 'cfuss'); fu.append(el('span', 'ctreffer', n(tr, 'Treffer', 'Treffer'))); b.append(fu); } b.append(ortLeiste(ohne, gewOrt));
      s.append(b); leib.append(s); }
    leib.append(el('div', 'cunten'));
    unten();
  }
  /* Anteil der Orte in einem Haus: Farbe gehört den Orten */
  function ortLeiste(h, betont){
    const z = new Map(); for(const w of h.werke){ const o = ortVon(w); const name = o ? o.name : ''; if(!z.has(name)) z.set(name, {o, c: 0}); z.get(name).c++; }
    const s = el('span', 'cortleiste'); s.setAttribute('aria-hidden', 'true');
    for(const {o, c} of [...z.values()].sort((a, b) => b.c - a.c)){ const t = el('span'); t.style.flexGrow = c; t.style.background = farbe(o || h.werke[0]).f; if(betont && !(o && gleich(o, betont))) t.classList.add('blass'); s.append(t); }
    return s;
  }
  /* Häuser packen: jedes legt sich an das Haus, mit dem es am meisten teilt; nichts überdeckt etwas */
  function packe(hs, W){
    const gesetzt = [], gap = 22;
    const frei = (x, y, h) => x >= 0 && x + h.w <= W && y >= 0 && !gesetzt.some(q => x < q.x + q.w + gap - 1 && x + h.w > q.x - gap + 1 && y < q.y + q.h + gap - 1 && y + h.h > q.y - gap + 1);
    for(const h of hs){
      if(!gesetzt.length){ h.x = Math.round((W - h.w) / 2); h.y = 0; gesetzt.push(h); continue; }
      let best = null, bs = Infinity;
      for(const p of gesetzt){
        const xs = [p.x + p.w + gap, p.x - gap - h.w, p.x, p.x + p.w - h.w, p.x + (p.w - h.w) / 2];
        const ys = [p.y + p.h + gap, p.y - gap - h.h, p.y, p.y + p.h - h.h, p.y + (p.h - h.h) / 2];
        const kand = [];
        for(const y of ys.slice(2)) kand.push([xs[0], y], [xs[1], y]);
        for(const x of xs.slice(2)) kand.push([x, ys[0]], [x, ys[1]]);
        for(const [x0, y0] of kand){ const x = Math.round(x0), y = Math.round(y0); if(!frei(x, y, h)) continue;
          const cx = x + h.w / 2, cy = y + h.h / 2;
          let s = Math.hypot((cx - W / 2) * 0.55, cy) * 0.9;
          for(const q of gesetzt){ const o = geteilt(h, q); if(o) s += Math.hypot(cx - q.x - q.w / 2, cy - q.y - q.h / 2) * Math.min(1, o / h.werke.length) * 1.6; }
          if(s < bs){ bs = s; best = [x, y]; } }
      }
      if(!best) best = [0, Math.max(...gesetzt.map(q => q.y + q.h)) + gap];
      [h.x, h.y] = best; gesetzt.push(h);
    }
    return Math.max(...gesetzt.map(q => q.y + q.h)) + 8;
  }

  function oeffneHaus(h){ Zs.modus = 'haus'; Zs.haus = h; Zs.filter = 'alles'; Zs.lesesaalMehr = false; zeichne(); fokus('.chauskopf h2'); }

  /* ---------- Im Haus ---------- */
  function zeichneHaus(){
    leib.replaceChildren(); svgWege = null;
    const h = Zs.haus, schmal = raum.clientWidth < 640;
    const zwei = el('div', 'czwei' + (schmal ? ' einzeln' : ''));
    const links = el('section', 'cmaterial'), rechts = el('section', 'clernweg');
    links.setAttribute('aria-label', 'Material im Haus ' + gebietName(h.g)); rechts.setAttribute('aria-label', 'Lernweg');
    // Kopf des Hauses
    const hk = el('div', 'chauskopf'); hk.append(el('p', 'cartwort', h.g === OHNE ? 'Offene Zuordnung' : 'Haus des Themas · berechnet'));
    const h2 = el('h2', '', gebietName(h.g)); h2.tabIndex = -1; hk.append(h2);
    hk.append(el('p', 'cmenge', n(h.werke.length, 'Werk', 'Werke') + (h.g === OHNE ? ' ohne berechnetes Gebiet' : ' in diesem Gebiet')));
    const nb = h.menge ? nachbarn(h).slice(0, 5) : [];
    if(nb.length){ const p = el('div', 'cnachbarhaeuser'); p.append(el('span', 'klein', 'Nachbarhäuser (teilen Werke): '));
      for(const x of nb){ const b = knopf('cchip', null, () => oeffneHaus(x)); b.append(el('span', '', x.g), el('small', '', String(geteilt(h, x)))); b.setAttribute('aria-label', x.g + ', ' + n(geteilt(h, x), 'gemeinsames Werk', 'gemeinsame Werke')); p.append(b); }
      hk.append(p); }
    links.append(hk);
    // Filter
    const ws = werkstaetten(h), ls = lesesaal(h);
    const fl = el('div', 'cfilter'); fl.setAttribute('role', 'group'); fl.setAttribute('aria-label', 'Was im Haus zeigen');
    for(const [id, wort, z] of [['alles', 'Alles', h.werke.length], ['werkstatt', 'Werkstätten', ws.length], ['lesesaal', 'Lesesaal', ls.length]]){
      const b = knopf('cfilterknopf', null, () => { Zs.filter = id; Zs.lesesaalMehr = false; zeichne(); fokus('.cfilterknopf[aria-pressed="true"]'); });
      b.setAttribute('aria-pressed', String(Zs.filter === id)); b.append(el('span', '', wort), el('small', '', String(z))); fl.append(b); }
    links.append(fl);
    const erkl = {alles: 'Alle Werke dieses Gebiets, die mit den meisten Fassungen zuerst.', werkstatt: 'Werkstätten: Werke und Apps, an denen lange gearbeitet wurde, mit mindestens ' + WERKSTATT + ' Fassungen.', lesesaal: 'Lesesaal: Gespräche und Fassungen, die nur aus Text bestehen. Neueste zuerst.'}[Zs.filter];
    links.append(el('p', 'cerkl klein', erkl));
    const ul = el('ul', 'cliste');
    if(Zs.filter === 'lesesaal'){
      const zeigt = Zs.lesesaalMehr ? ls : ls.slice(0, LESESAAL_ZEIGT);
      for(const f of zeigt) ul.append(leseZeile(f));
      if(!ls.length) ul.append(el('li', 'cleer', 'In diesem Haus liegt kein reiner Text und kein Gespräch.'));
      links.append(ul);
      if(ls.length > zeigt.length) links.append(knopf('knopf cmehr', 'Alle ' + ls.length + ' zeigen', () => { Zs.lesesaalMehr = true; zeichne(); }));
    } else {
      const l = Zs.filter === 'werkstatt' ? ws : h.werke;
      for(const w of l) ul.append(materialZeile(w, h));
      if(!l.length) ul.append(el('li', 'cleer', 'In diesem Haus hat kein Werk so viele Fassungen.'));
      links.append(ul);
    }
    rechts.append(...lernwegTeile(schmal));
    if(schmal && Zs.gew && !istOrtartig(Zs.gew)) zwei.append(rechts, links); else zwei.append(links, rechts);
    leib.append(zwei);
    leib.append(el('div', 'cunten'));
    unten();
    requestAnimationFrame(zieheLernlinien); setTimeout(zieheLernlinien, 120);   // auch wenn die Seite gerade nicht malt
  }
  const unten = () => { const u = leib.querySelector('.cunten'); if(u) u.style.height = (K.schmal() ? K.rand().unten : 16) + 'px'; };

  function materialZeile(w, h){
    const li = el('li'), gew = Zs.gew, an = gew && !istOrtartig(gew) && gleich(istBlatt(gew) ? behaelter(gew) : gew, w);
    const b = knopf('cmat' + (an ? ' an' : '') + (K.istTreffer(w) ? '' : ' gedaempft'), null, () => waehleNeu(w));
    if(an) b.setAttribute('aria-current', 'true');
    const f = farbe(w); b.style.setProperty('--ort', f.f); b.style.setProperty('--ort-d', f.d);
    b.append(bildEl(K, titelBild(w), 240, 'cmatbild'));
    const t = el('span', 'cmattext'); t.append(el('span', 'cmatname', w.name));
    const o = ortVon(w), z = el('span', 'cmatdaten');
    z.append(el('span', 'cort', o ? o.name : 'ohne Ort'), document.createTextNode((inWort(w) ? ' · ' + inWort(w) : '') + ' · ' + n(w.fassungen, 'Fassung', 'Fassungen') + (w.art === 'app' ? ' · App' : '')));
    if(orteZahl(w.schluessel) > 1) z.append(document.createTextNode(' · an ' + orteZahl(w.schluessel) + ' Orten'));
    t.append(z);
    const andere = gebieteVon(w).filter(g => g !== h.g && g !== OHNE);
    if(andere.length) t.append(el('span', 'cauch', '⧉ dasselbe Werk auch in: ' + andere.join(', ')));
    b.append(t); li.append(b); return li;
  }
  function leseZeile(f){
    const li = el('li'), an = gleich(f, Zs.gew), w = behaelter(f);
    const b = knopf('cmat lese' + (an ? ' an' : '') + (K.istTreffer(f) ? '' : ' gedaempft'), null, () => { if(an) return K.oeffne(f); waehleNeu(f); });
    if(an) b.setAttribute('aria-current', 'true');
    const fa = farbe(f); b.style.setProperty('--ort', fa.f); b.style.setProperty('--ort-d', fa.d);
    const z = el('span', 'cleszeichen'); z.innerHTML = f.art === 'gespraech' ? gespraechZeichen : textZeichen; b.append(z);
    const t = el('span', 'cmattext'); t.append(el('span', 'cmatname', f.name));
    t.append(el('span', 'cmatdaten', (f.art === 'gespraech' ? 'Gespräch' : 'Text') + ' · ' + (w && w !== f ? w.name + ' · ' : '') + (f.von != null ? tagWort(f.von) : 'Zeit nicht belegt') + (f.art === 'fassung' ? ' · ' + mengenWort(f) : '')));
    if(an) t.append(el('span', 'cauch', 'Noch einmal tippen: lesen'));
    b.append(t); li.append(b); return li;
  }

  /* ---------- Lernweg ---------- */
  function lernwegTeile(schmal){
    const s = Zs.gew;
    if(!s || istOrtartig(s)){ const p = el('div', 'cleerweg');
      p.append(el('h3', '', 'Lernweg'), el('p', '', 'Wähle ein Werk aus dem Haus. Es wird zum Ausgangspunkt: von dort zeigt der Campus, was belegt davor und danach kommt, und was berechnet in der Nähe liegt.'));
      const h = Zs.haus, ein = h ? h.werke.map(w => ({w, z: fassungenUnter(w).filter(hatWeg).length})).filter(e => e.z > 1).sort((a, b) => b.z - a.z) : [];
      if(ein.length){ const box = el('section', 'ceinstiege cbelegt'); box.append(el('h3', '', 'Einstiege mit belegtem Weg'), el('p', 'cerkl klein', 'Werke in diesem Haus, deren Fassungen im Fundus als Folge gespeichert sind. Gut zum Anfangen.'));
        const r = el('div', 'cvreihe');
        for(const {w, z} of ein.slice(0, 12)){ const b = knopf('cvst belegt' + (K.istTreffer(w) ? '' : ' gedaempft'), null, () => waehleNeu(w)); const f = farbe(w); b.style.setProperty('--ort', f.f); b.style.setProperty('--ort-d', f.d);
          b.append(bildEl(K, titelBild(w), 240, 'cvbild')); const t = el('span', 'cmattext'); const o = ortVon(w);
          t.append(el('span', 'cmatname', w.name), el('span', 'cmatdaten', (o ? o.name + ' · ' : '') + 'Weg mit ' + z + ' Stationen')); b.append(t); r.append(b); }
        box.append(r); if(ein.length > 12) box.append(el('p', 'klein', 'und ' + (ein.length - 12) + ' weitere in der Liste links'));
        p.append(box); }
      return [p]; }
    const teile = [];
    const w = istBlatt(s) ? behaelter(s) : s, rep = jeSchluessel.get(w.schluessel) || w;
    // Spur und Rückweg
    const spur = el('nav', 'cspur'); spur.setAttribute('aria-label', 'Spur dieses Lernwegs');
    const ol = el('ol');
    Zs.spur.forEach((k, i) => { const li = el('li'), b = knopf(gleich(k, s) ? 'hier' : '', (i === 0 ? 'Ausgangspunkt: ' : '') + k.name, () => folge(k));
      if(gleich(k, s)) b.setAttribute('aria-current', 'step'); li.append(b); ol.append(li); });
    spur.append(ol);
    const kopfzeile = el('div', 'cspurzeile'); kopfzeile.append(spur);
    if(Zs.ausgang && !gleich(Zs.ausgang, s)) kopfzeile.append(knopf('knopf haupt czurueck', '↩ Zurück zum Ausgangspunkt', () => { const a = Zs.ausgang; Zs.spur = [a]; Zs.folgt = 'zurueck'; K.waehle(a, {vonAnsicht: true}); }));
    teile.push(kopfzeile);
    // Startkarte
    const start = el('div', 'cstart'); start.tabIndex = -1;
    const fs = farbe(w); start.style.setProperty('--ort', fs.f); start.style.setProperty('--ort-d', fs.d);
    start.append(bildEl(K, titelBild(s), schmal ? 240 : 960, 'cstartbild'));
    const st = el('div', 'cstarttext');
    st.append(el('p', 'cartwort', 'Ausgangspunkt' + (gleich(s, Zs.ausgang) ? '' : ' dieses Schritts') + ' · ' + (istBlatt(s) ? (s.art === 'gespraech' ? 'Gespräch' : 'Fassung') + ' in ' + w.name : (w.art === 'app' ? 'App' : 'Werk'))));
    st.append(el('h3', '', s.name));
    const o = ortVon(w); st.append(el('p', 'cmatdaten', (o ? o.name + ' · ' : '') + (istBlatt(s) ? (s.von != null ? tagWort(s.von) : 'Zeit nicht belegt') : n(w.fassungen, 'Fassung', 'Fassungen'))));
    const gs = gebieteVon(rep), g = el('div', 'cchips klein2');
    g.append(el('span', 'klein', gs[0] === OHNE ? 'Noch keinem Gebiet zugeordnet ' : 'Gebiete (berechnet): '));
    for(const x of gs){ if(x === OHNE){ g.append(knopf('cchip', 'Zu den Werken ohne Gebiet', () => oeffneHaus(ohne))); continue; }
      const hh = hausVon.get(x); const b = knopf('cchip' + (Zs.haus && Zs.haus.g === x ? ' an' : ''), x, () => oeffneHaus(hh)); if(Zs.haus && Zs.haus.g === x) b.setAttribute('aria-current', 'true'); g.append(b); }
    st.append(g);
    if(istBlatt(s)) st.append(el('p', 'cnoch klein', 'Noch einmal auf diese Fassung tippen, um sie zu lesen.'));
    start.append(st);
    if(istBlatt(s)){ start.classList.add('lesbar'); start.tabIndex = 0; start.setAttribute('role', 'button'); start.setAttribute('aria-label', s.name + ' lesen');
      start.onclick = e => { if(e.target.closest('button')) return; K.oeffne(s); }; start.onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); K.oeffne(s); } }; }
    teile.push(start);

    // Belegter Weg
    const L = lernweg(s);
    const bel = el('section', 'cbelegt'); bel.append(el('h3', '', 'Belegter Weg'));
    if(!L.spalten.length){
      bel.append(el('p', 'cleer', (istBlatt(s) ? 'Diese Fassung' : 'Dieses Werk') + ' hat im Fundus keinen gespeicherten Weg (folgt auf, erweitert, remixt aus).'));
    } else {
      const zahl = L.N.size, werkeZahl = new Set([...L.N.values()].map(f => behaelter(f).schluessel)).size;
      bel.append(el('p', 'cerkl klein', n(zahl, 'Station', 'Stationen') + (werkeZahl > 1 ? ' aus ' + n(werkeZahl, 'Werk', 'Werken') : '') + ', gespeichert im Fundus. ' + (schmal ? 'Oben früher, unten später.' : 'Links früher, rechts später.')));
      const bahn = el('div', 'cbahn'); bahn.setAttribute('role', 'list');
      const eingang = new Map(); for(const e of L.kanten){ if(!eingang.has(e.spaet.schluessel)) eingang.set(e.spaet.schluessel, new Set()); eingang.get(e.spaet.schluessel).add(e.art); }
      L.spalten.forEach((sp, i) => {
        const col = el('div', 'cspalte'); col.setAttribute('role', 'listitem');
        col.append(el('p', 'cstufe', i === 0 ? 'früheste' : 'Stufe ' + (i + 1)));
        const key = 'sp' + i + '|' + w.schluessel + '|' + s.schluessel, auf = Zs.offen.has(key);
        const zeigt = auf ? sp : sp.slice(0, SPALTE_ZEIGT);
        for(const f of zeigt) col.append(station(f, L, eingang.get(f.schluessel)));
        if(sp.length > zeigt.length) col.append(knopf('knopf cmehr', 'und ' + (sp.length - zeigt.length) + ' weitere', () => { Zs.offen.add(key); zeichne(); }));
        bahn.append(col);
      });
      if(L.spalten.length > 3 && !schmal){ const nav = el('div', 'cbahnnav');
        const geh = z => bahn.scrollTo({left: z === 'a' ? 0 : bahn.scrollWidth, behavior: ruhig() ? 'auto' : 'smooth'});
        nav.append(knopf('knopf', '⇤ Früheste', () => geh('a')), el('span', 'klein', n(L.spalten.length, 'Stufe', 'Stufen')), knopf('knopf', 'Späteste ⇥', () => geh('e')));
        bel.append(nav); }
      const halter = el('div', 'cbahnhalter'); halter.append(bahn);
      svgLern = svg('svg', {class: 'clinien', 'aria-hidden': 'true'}); halter.prepend(svgLern);
      halter._kanten = L.kanten;
      bel.append(halter);
      bahn.addEventListener('scroll', () => zieheLernlinien(), {passive: true});
    }
    if(L.ohneWeg.length){ const p = el('details', 'cohneweg');
      p.append(el('summary', '', n(L.ohneWeg.length, 'weitere Fassung', 'weitere Fassungen') + ' dieses Werks ohne gespeicherten Weg'));
      const l = el('div', 'cfassreihe'); for(const f of L.ohneWeg.slice(0, 60)) l.append(station(f, L, null, true));
      if(L.ohneWeg.length > 60) l.append(el('p', 'klein', 'und ' + (L.ohneWeg.length - 60) + ' weitere im Lesepult'));
      p.append(el('p', 'klein', 'Nach belegter Zeit geordnet; eine Verbindung zwischen ihnen ist nicht gespeichert.'), l); bel.append(p); }
    teile.push(bel);

    // Vorschläge, berechnet
    const V = vorschlaege(s).filter(e => !L.N.size || ![...L.N.values()].some(f => gleich(behaelter(f), e.k)));
    const vs = el('section', 'cvorschlag'); vs.append(el('h3', '', 'Vorschläge · berechnet'));
    if(!V.length) vs.append(el('p', 'cleer', 'Der Fundus hat zu diesem Werk keine berechnete Nähe.'));
    else {
      vs.append(el('p', 'cerkl klein', 'Nicht gespeichert, sondern berechnet: Werke im selben Gebiet oder aus demselben Quellbestand. Ein möglicher nächster Schritt, keine Folge.'));
      const r = el('div', 'cvreihe'), zeigt = Zs.alleVorschlaege ? V.slice(0, 60) : V.slice(0, VORSCHLAG_ZEIGT);
      for(const e of zeigt){
        const k = e.k, b = knopf('cvst' + (K.istTreffer(k) ? '' : ' gedaempft') + (Zs.spur.some(x => gleich(x, k)) ? ' besucht' : ''), null, () => folge(k));
        const f = farbe(k); b.style.setProperty('--ort', f.f); b.style.setProperty('--ort-d', f.d);
        b.append(bildEl(K, titelBild(k), 240, 'cvbild'));
        const t = el('span', 'cmattext'); t.append(el('span', 'cvgrund', 'Vorschlag, berechnet'), el('span', 'cmatname', k.name));
        const grund = []; if(e.gemeinsam.length) grund.push('teilt ' + (e.gemeinsam.length === 1 ? 'das Gebiet ' : 'die Gebiete ') + e.gemeinsam.slice(0, 3).join(', ')); if(e.quell) grund.push('gleicher Quellbestand');
        const wo = [ortVon(k)?.name, inWort(k)].filter(Boolean).join(' · ');
        if(wo) t.append(el('span', 'cfremd', wo));
        t.append(el('span', 'cmatdaten', grund.join(' · ') || BERECHNET['gleiche Themen'].wort));
        b.append(t); r.append(b);
      }
      vs.append(r);
      if(V.length > zeigt.length) vs.append(knopf('knopf cmehr', Zs.alleVorschlaege ? 'Weniger zeigen' : 'Alle ' + Math.min(V.length, 60) + ' Vorschläge zeigen', () => { Zs.alleVorschlaege = !Zs.alleVorschlaege; zeichne(); }));
      else if(Zs.alleVorschlaege) vs.append(knopf('knopf cmehr', 'Weniger zeigen', () => { Zs.alleVorschlaege = false; zeichne(); }));
      if(V.length > 60 && Zs.alleVorschlaege) vs.append(el('p', 'klein', 'und ' + (V.length - 60) + ' weitere im Haus des Gebiets'));
    }
    teile.push(vs);

    // Weitere belegte Bezüge ohne Lernrichtung
    const Q = querBezuege(s);
    if(Q.length){ const q = el('section', 'cquer'); q.append(el('h3', '', 'Weitere belegte Bezüge · ohne Wegrichtung'));
      const c = el('div', 'cchips');
      for(const r of Q.slice(0, 24)){ const b = knopf('cchip belegt', null, () => folge(r.andere)); b.append(el('small', '', BELEGT[r.art] ? (r.aus ? BELEGT[r.art].wort : BELEGT[r.art].rueck) : r.art), el('span', '', r.andere.name)); c.append(b); }
      q.append(c); if(Q.length > 24) q.append(el('p', 'klein', 'und ' + (Q.length - 24) + ' weitere im Bezugsnetz'));
      teile.push(q); }
    return teile;
  }

  function station(f, L, arten, lose){
    const w = behaelter(f), fremd = L.werk ? !gleich(w, L.werk) : !gleich(w, behaelter(L.start));
    const an = gleich(f, Zs.gew), besucht = Zs.spur.some(x => gleich(x, f));
    const b = knopf('cst' + (an ? ' an' : '') + (besucht && !an ? ' besucht' : '') + (K.istTreffer(f) ? '' : ' gedaempft') + (lose ? ' lose' : ''), null, () => { if(an) return K.oeffne(f); folge(f); });
    b._schluessel = f.schluessel; b.classList.add('mitweg'); if(an) b.setAttribute('aria-current', 'step');
    const fa = farbe(f); b.style.setProperty('--ort', fa.f); b.style.setProperty('--ort-d', fa.d);
    b.append(bildEl(K, f.bild || null, 240, 'cstbild'));
    const t = el('span', 'cmattext');
    if(arten && arten.size) t.append(el('span', 'cstart2', [...arten].join(' · ')));
    t.append(el('span', 'cmatname', f.name));
    if(fremd) t.append(el('span', 'cfremd', 'aus ' + w.name));
    t.append(el('span', 'cmatdaten', f.von != null ? tagWort(f.von) : 'Zeit nicht belegt'));
    if(an) t.append(el('span', 'cauch', 'Noch einmal tippen: lesen'));
    else if(besucht) t.append(el('span', 'cauch', 'schon besucht'));
    b.append(t); return b;
  }

  /* Durchgezogene Linien zwischen den Stationen des belegten Wegs */
  function zieheLernlinien(){
    if(!svgLern || !svgLern.isConnected) return;
    const halter = svgLern.parentElement, r0 = halter.getBoundingClientRect();
    svgLern.setAttribute('width', r0.width); svgLern.setAttribute('height', r0.height); svgLern.replaceChildren();
    const senkrecht = raum.clientWidth < 640;
    const pos = new Map(); for(const b of halter.querySelectorAll('.cst.mitweg')) pos.set(b._schluessel, b.getBoundingClientRect());
    for(const e of halter._kanten || []){
      const a = pos.get(e.frueh.schluessel), b = pos.get(e.spaet.schluessel); if(!a || !b) continue;
      let d;
      if(senkrecht){ const x1 = a.left - r0.left, y1 = a.top + a.height / 2 - r0.top, x2 = b.left - r0.left, y2 = b.top + b.height / 2 - r0.top, mx = Math.max(2, Math.min(x1, x2) - 22);
        if(y2 < y1) continue;
        d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`; }
      else { const x1 = a.right - r0.left, y1 = a.top + a.height / 2 - r0.top, x2 = b.left - r0.left, y2 = b.top + b.height / 2 - r0.top, m = Math.max(16, (x2 - x1) / 2);
        if(x2 < x1 - 4) continue;
        d = `M${x1},${y1} C${x1 + m},${y1} ${x2 - m},${y2} ${x2},${y2}`; }
      const an = gleich(e.frueh, Zs.gew) || gleich(e.spaet, Zs.gew);
      svgLern.append(svg('path', {d, class: 'clinie' + (an ? ' an' : '')}));
    }
  }

  /* ---------- Wählen und Folgen ---------- */
  function waehleNeu(k){ if(gleich(k, Zs.gew) && istBlatt(k)) return K.oeffne(k); Zs.folgt = false; K.waehle(k, {vonAnsicht: true}); }
  function folge(k){ if(gleich(k, Zs.gew)){ if(istBlatt(k)) K.oeffne(k); return; } Zs.folgt = true; K.waehle(k, {vonAnsicht: true}); }

  /* Beim Neuzeichnen bleibt, wohin man gerollt hat, solange man im selben Haus und Filter ist */
  function merkeRollen(){ const r = {sig: Zs.modus + '|' + (Zs.haus ? Zs.haus.g : '') + '|' + Zs.filter};
    for(const c of ['cleib', 'cmaterial', 'clernweg']){ const e = c === 'cleib' ? leib : leib.querySelector('.' + c); if(e) r[c] = e.scrollTop; }
    const b = leib.querySelector('.cbahn'); if(b) r.bahn = b.scrollLeft; return r; }
  function zeichne(vorher){
    vorher = vorher || merkeRollen();
    zeichneKopf();
    if(Zs.modus === 'haus' && Zs.haus) zeichneHaus(); else { Zs.modus = 'plan'; zeichnePlan(); }
    const sig = Zs.modus + '|' + (Zs.haus ? Zs.haus.g : '') + '|' + Zs.filter;
    if(sig === vorher.sig){ for(const c of ['cleib', 'cmaterial', 'clernweg']){ const e = c === 'cleib' ? leib : leib.querySelector('.' + c); if(e && vorher[c] != null) e.scrollTop = vorher[c]; }
      const b = leib.querySelector('.cbahn'); if(b && vorher.bahn != null) b.scrollLeft = vorher.bahn; }
    else leib.scrollTop = 0;
  }
  const treffer = h => { if(!Zs.suche || !Zs.suche.treffer) return null; let z = 0; for(const w of h.werke) if(K.istTreffer(w)) z++; return z; };

  let rahmenW = 0, rahmenH = 0;
  const beobachter = new ResizeObserver(() => {
    const w = raum.clientWidth, h = raum.clientHeight; if(!w) return;
    const schmalWechsel = (w < 640) !== (rahmenW < 640);
    if(Zs.modus === 'plan' && (Math.abs(w - rahmenW) > 24 || Math.abs(h - rahmenH) > 60)){ rahmenW = w; rahmenH = h; zeichne(); return; }
    if(schmalWechsel){ rahmenW = w; rahmenH = h; zeichne(); return; }
    rahmenW = w; rahmenH = h; zieheLernlinien(); unten();
  });
  beobachter.observe(raum);
  rahmenW = raum.clientWidth; rahmenH = raum.clientHeight;

  return {
    zeige(k, sofort, vonAnsicht){
      const war = Zs.gew; Zs.gew = k;
      const folgte = Zs.folgt; Zs.folgt = false;
      if(istOrtartig(k)){ Zs.modus = 'plan'; Zs.ausgang = null; Zs.spur = []; gedaechtnis = null; }
      else {
        const w = istBlatt(k) ? behaelter(k) : k, rep = jeSchluessel.get(w.schluessel) || w;
        if(folgte === true && Zs.ausgang){ const i = Zs.spur.findIndex(x => gleich(x, k)); if(i >= 0) Zs.spur = Zs.spur.slice(0, i + 1); else Zs.spur.push(k); }
        else if(folgte === 'zurueck' && Zs.ausgang){ Zs.spur = [Zs.ausgang]; }
        else if(gedaechtnis && !vonAnsicht && gedaechtnis.spur.includes(k.schluessel)){
          // zurück vom Lesen oder aus einer anderen Ansicht: die Spur geht weiter
          const knoten = s => (I.nachSchluessel.get(s) || [])[0];
          Zs.spur = gedaechtnis.spur.slice(0, gedaechtnis.spur.indexOf(k.schluessel) + 1).map(knoten).filter(Boolean);
          Zs.ausgang = Zs.spur[0] || k; Zs.filter = gedaechtnis.filter || 'alles';
          const h = hausVon.get(gedaechtnis.haus); if(h && gebieteVon(rep).includes(h.g)) Zs.haus = h;
        }
        else { Zs.ausgang = k; Zs.spur = [k]; }
        gedaechtnis = null;
        Zs.haus = hausFuer(rep); Zs.modus = 'haus';
        if(!gleich(war, k)) Zs.alleVorschlaege = false;
      }
      const vorher = merkeRollen();
      zeichne(vorher);
      requestAnimationFrame(() => {
        if(Zs.modus === 'haus'){
          const schmal = raum.clientWidth < 640, lw = leib.querySelector('.clernweg');
          if(schmal && (vonAnsicht || folgte)) leib.scrollTo({top: 0, behavior: ruhig() || sofort && !vonAnsicht ? 'auto' : 'smooth'});
          else if(!schmal && folgte && lw) lw.scrollTo({top: 0, behavior: ruhig() ? 'auto' : 'smooth'});
          if(!vonAnsicht && !schmal){ const an = leib.querySelector('.cmat.an'); if(an) an.scrollIntoView({block: 'center'}); }
          else if(!vonAnsicht) leib.scrollTop = 0;
          const st = leib.querySelector('.cst.an'); if(st){ const bahn = st.closest('.cbahn'); if(bahn){ const r = st.getBoundingClientRect(), rb = bahn.getBoundingClientRect(); if(r.left < rb.left || r.right > rb.right) bahn.scrollLeft += r.left - rb.left - rb.width / 2 + r.width / 2; } }
          zieheLernlinien();
        } else if(!vonAnsicht){ const h = leib.querySelector('.chaus.hier'); if(h) h.scrollIntoView({block: 'nearest'}); }
      });
    },
    suche(s){ Zs.suche = s && s.treffer ? s : null; zeichne(); },
    groesse(){ zeichne(); },
    ende(){
      gedaechtnis = Zs.spur.length ? {spur: Zs.spur.map(x => x.schluessel), haus: Zs.haus ? Zs.haus.g : null, filter: Zs.filter} : null;
      beobachter.disconnect(); raum.remove(); }
  };
}
