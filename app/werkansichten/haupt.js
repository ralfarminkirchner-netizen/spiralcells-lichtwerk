/* Werkraum · ein Inhalt in neun Ansichten (Claude-Variante, 11.11.2026)

   Die Hülle hält, was in jeder Ansicht gleich ist:
   - der Inhalt (einmal gebaut), die Wahl, die aktive Suche, der Lesestand, die Mappe des Büros
   - die Leiste der Ansichten, der Weg (wo bin ich), das Blatt zum Gewählten, die Suche
   - Adresse, Zurück und Neuladen: #ansicht/ort/app/werk/fassung?q=suche
   Eine Ansicht zeichnet nur. Sie ändert nichts am Inhalt und hält keinen eigenen Bestand. */

import {baueInhalt, wegZu, adresse, bisherigeAdresse, mengenWort, zeitWort, ARTWORT} from './inhalt.js';
import {baueBezuege, BELEGT, BERECHNET} from './bezug.js';
import {el, knopf, farbe, titelBild, bildEl, n, tagWort, ruhig} from './gemein.js';

const $ = s => document.querySelector(s);

export const ANSICHTEN = [
  {id: 'baum',     name: 'Baum',     frage: 'Woraus ist es gewachsen?',          modul: () => import('./baum.js')},
  {id: 'tragwerk', name: 'Tragwerk', frage: 'Was trägt, was verbindet?',         modul: () => import('./tragwerk.js')},
  {id: 'kosmos',   name: 'Kosmos',   frage: 'Wie groß ist das Ganze, wo bin ich?', modul: () => import('./kosmos.js')},
  {id: 'galaxie',  name: 'Galaxie',  frage: 'Was hängt womit zusammen?',         modul: () => import('./galaxie.js')},
  {id: 'garten',   name: 'Garten',   frage: 'Wie hat es sich entwickelt?',        modul: () => import('./garten.js')},
  {id: 'dorf',     name: 'Dorf',     frage: 'Wer wohnt wo?',                      modul: () => import('./dorf.js')},
  {id: 'campus',   name: 'Campus',   frage: 'Was kann ich hier lernen?',          modul: () => import('./campus.js')},
  {id: 'buero',    name: 'Büro',     frage: 'Womit arbeite ich gerade?',          modul: () => import('./buero.js')},
  {id: 'zelle',    name: 'Zelle und Text', kurz: 'Text', frage: 'Was steht genau da?', modul: () => import('./zelle.js')}
];
const ZEICHEN = {
  baum: '<path d="M12 21v-7"/><path d="M12 14 7.5 9.5M12 14l4.5-4.5M12 11V5"/><circle cx="6.5" cy="8.5" r="2.2"/><circle cx="17.5" cy="8.5" r="2.2"/><circle cx="12" cy="4" r="2.2"/>',
  tragwerk: '<path d="M3 21h18M5 21V9h14v12M5 15h14M9 9v12M15 9v12M4 9l8-6 8 6"/>',
  kosmos: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="3.4"/><circle cx="15.5" cy="14.5" r="2.3"/><circle cx="14.5" cy="7.5" r="1.3"/>',
  galaxie: '<circle cx="5" cy="7" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="12" cy="13" r="2.4"/><circle cx="6" cy="19" r="1.6"/><circle cx="19" cy="18" r="1.8"/><path d="M6.7 8.2 10.2 11.6M16.4 6.3l-3 4.6M10.6 14.6l-3.5 3.3M14.3 14.2l3 2.6"/>',
  garten: '<path d="M3 21h18"/><path d="M7 21v-6M12 21V9M17 21v-4"/><circle cx="7" cy="13" r="2"/><circle cx="12" cy="7" r="2.3"/><circle cx="17" cy="15" r="1.8"/><path d="M12 15c-2 0-3-1-3-3M12 13c2 0 3-1 3-2.5"/>',
  dorf: '<path d="M2 21h20M4 21v-8l4-3.5 4 3.5v8M12 21v-6l4-3.5 4 3.5v6"/><path d="M7 21v-3h2v3M15 21v-2.5h2V21"/>',
  campus: '<path d="M3 21h18M5 21v-9M9.5 21v-9M14.5 21v-9M19 21v-9M3 12l9-7 9 7Z"/>',
  buero: '<rect x="3" y="4" width="8" height="10" rx="1"/><rect x="13" y="4" width="8" height="10" rx="1"/><path d="M2 18h20M6 18v3M18 18v3"/>',
  zelle: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 11h8M8 14h8M8 17h5"/>'
};
const ikon = id => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ZEICHEN[id]}</svg>`;

/* ---------- Zustand ---------- */
const lade = (k, d) => { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } };
const merke = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch(e){ /* ohne Speicher geht es auch */ } };
const Z = {
  inhalt: null, bezug: null, texte: new Map(), gewaehlt: null, ansicht: 'baum', laeuft: null, ladeNr: 0,
  suche: {q: '', treffer: null},
  lesestand: lade('werkansichten.lesestand', {}),
  blattOffen: innerWidth >= 900, blattGross: false,
  vorige: null   // Ansicht und Wahl vor dem Lesen, für „Zurück“
};
const schmal = () => innerWidth < 760;
const buehne = $('#buehne'), blatt = $('#blatt'), hinweis = $('#hinweis');

/* ---------- Kontext für die Ansichten ---------- */
export const K = {
  get inhalt(){ return Z.inhalt; },
  get bezug(){ return Z.bezug; },
  get texte(){ return Z.texte; },
  get suche(){ return Z.suche; },
  get ansicht(){ return Z.ansicht; },
  get vorige(){ return Z.vorige; },
  gewaehlt: () => Z.gewaehlt,
  still: new URLSearchParams(location.search).has('still'),
  schmal,
  waehle: (k, o) => waehle(k, o),
  oeffne: (k, o) => oeffne(k, o),
  wechsle: (id, k) => wechsle(id, k),
  zurueck: () => zurueck(),
  bildUrl: (b, breit = 240) => `/lichtwerk/bild?w=${breit >= 400 ? 960 : 240}&pfad=${encodeURIComponent(b.pfad)}`,
  lesestand: {hole: s => Z.lesestand[s] || 0, setze: (s, y) => { Z.lesestand[s] = Math.round(y); merke('werkansichten.lesestand', Z.lesestand); }},
  sage: t => sage(t),
  /* Freier Platz der Bühne, wenn Blatt oder Leiste darüber liegen (in Bildpunkten der Bühne) */
  rand: () => {
    if(schmal()) return {oben: 8, unten: blatt.hidden ? 8 : (Z.blattGross ? 8 : blatt.getBoundingClientRect().height + 8), links: 8, rechts: 8};
    return {oben: 12, unten: 12, links: 12, rechts: blatt.hidden || !Z.blattOffen ? 12 : 12};
  },
  istTreffer: k => !Z.suche.treffer || Z.suche.treffer.has(k.schluessel) || Z.suche.pfade?.has(k.schluessel)
};

/* ---------- Adresse und Verlauf ---------- */
function ausAdresse(){
  const roh = decodeURIComponent(location.hash.replace(/^#/, '')), [pfadteil, frage = ''] = roh.split('?');
  const t = pfadteil.split('/').filter(Boolean), a = ANSICHTEN.find(x => x.id === t[0]);
  return {ansicht: a ? a.id : 'baum', pfad: (a ? t.slice(1) : t).join('/'), q: new URLSearchParams(frage).get('q') || ''};
}
function hashJetzt(){
  const p = Z.gewaehlt && Z.gewaehlt.art !== 'wurzel' ? '/' + adresse(Z.gewaehlt) : '';
  return '#' + Z.ansicht + p + (Z.suche.q ? '?q=' + encodeURIComponent(Z.suche.q) : '');
}
function inAdresse(neu){
  const h = hashJetzt(); if(location.hash === h) return;
  if(neu) history.pushState({w: 1}, '', h); else history.replaceState({w: 1}, '', h);
}
function nachPfad(p){
  if(!p) return Z.inhalt.wurzel;
  return Z.inhalt.alle.find(k => k.art !== 'wurzel' && adresse(k) === p) || Z.inhalt.alle.find(k => k.art !== 'wurzel' && bisherigeAdresse(k) === p) || null;
}
addEventListener('popstate', () => {
  if(!Z.inhalt) return;
  const a = ausAdresse(), k = nachPfad(a.pfad) || Z.inhalt.wurzel;
  if(a.q !== Z.suche.q) setzeSuche(a.q, false);
  if(a.ansicht !== Z.ansicht) starteAnsicht(a.ansicht, k, false); else waehle(k, {verlauf: false});
});

/* ---------- Wählen, Öffnen, Wechseln ---------- */
function waehle(k, o = {}){
  if(!k) k = Z.inhalt.wurzel;
  const war = Z.gewaehlt; Z.gewaehlt = k;
  zeichneWeg(); zeichneBlatt();
  inAdresse(o.verlauf !== false && war !== k && !o.still);
  if(Z.laeuft && Z.laeuft.zeige && !o.vonAnsicht) Z.laeuft.zeige(k, o.sofort);
  else if(Z.laeuft && Z.laeuft.zeige && o.vonAnsicht) Z.laeuft.zeige(k, true, true);
}
/* Öffnen heißt lesen: Fassungen und Gespräche in „Zelle und Text“; sonst näher heran */
function oeffne(k){
  if(k.art === 'fassung' || k.art === 'gespraech'){
    if(Z.ansicht !== 'zelle') Z.vorige = {ansicht: Z.ansicht, k: Z.gewaehlt};
    wechsle('zelle', k);
  } else waehle(k);
}
function wechsle(id, k){ starteAnsicht(id, k || Z.gewaehlt, true); }
function zurueck(){
  if(Z.vorige){ const v = Z.vorige; Z.vorige = null; starteAnsicht(v.ansicht, Z.gewaehlt || v.k, true); return; }
  const w = wegZu(Z.gewaehlt); if(w.length > 1) waehle(w[w.length - 2]);
}

async function starteAnsicht(id, k, neu){
  const a = ANSICHTEN.find(x => x.id === id) || ANSICHTEN[0], nr = ++Z.ladeNr;
  Z.ansicht = a.id; document.body.dataset.ansicht = a.id;
  // Büro und Text brauchen die Breite selbst: dort ist das Blatt eingeklappt, bis man es öffnet
  if(!schmal()){ if(a.id === 'buero' || a.id === 'zelle'){ if(Z.blattWunsch == null) Z.blattWunsch = Z.blattOffen; Z.blattOffen = false; } else if(Z.blattWunsch != null){ Z.blattOffen = Z.blattWunsch; Z.blattWunsch = null; } }
  for(const b of document.querySelectorAll('#leiste [data-id]')){ const an = b.dataset.id === a.id; b.classList.toggle('an', an); an ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); }
  $('#leiste [aria-current]')?.scrollIntoView?.({block: 'nearest', inline: 'center'});
  document.title = a.name + ' · Ralfs Werke';
  if(Z.laeuft){ try { Z.laeuft.ende(); } catch(e){ console.warn(e); } Z.laeuft = null; }
  buehne.replaceChildren(el('div', 'laedt', a.name + ' wird aufgebaut …'));
  Z.gewaehlt = k || Z.gewaehlt || Z.inhalt.wurzel;
  zeichneWeg(); zeichneBlatt(); inAdresse(neu);
  let m; try { m = await a.modul(); } catch(e){ console.error(e); if(nr === Z.ladeNr) buehne.replaceChildren(fehlerEl('Diese Ansicht ließ sich nicht laden.', () => starteAnsicht(id, k, false))); return; }
  if(nr !== Z.ladeNr) return;
  buehne.replaceChildren();
  const fl = el('div', 'flaeche-' + a.id + ' ansichtsflaeche'); buehne.append(fl);
  try { Z.laeuft = m.starte(fl, K) || {}; } catch(e){ console.error(e); buehne.replaceChildren(fehlerEl('Beim Aufbau dieser Ansicht ist ein Fehler passiert.', () => starteAnsicht(id, k, false))); return; }
  zeichneLegende(a, m.legende);
  if(Z.laeuft.zeige) Z.laeuft.zeige(Z.gewaehlt, true);
  if(Z.suche.q && Z.laeuft.suche) Z.laeuft.suche(Z.suche);
  try { performance.mark('ansicht-bereit:' + a.id); } catch(e){ /* nur Messung */ }
}
function fehlerEl(satz, nochmal){ const d = el('div', 'fehler'); d.append(el('p', '', satz), knopf('knopf', 'Noch einmal versuchen', nochmal)); return d; }

/* ---------- Leiste der Ansichten ---------- */
function baueLeiste(){
  const nav = $('#leiste'); nav.replaceChildren();
  for(const a of ANSICHTEN){
    const b = knopf('ansicht', null, () => { if(a.id === 'zelle' && Z.gewaehlt && Z.gewaehlt.kinder && Z.ansicht !== 'zelle') Z.vorige = null; wechsle(a.id); });
    b.dataset.id = a.id; b.innerHTML = ikon(a.id) + `<span class="aname">${a.kurz || a.name}</span>`;
    b.title = a.name + ' — ' + a.frage; b.setAttribute('aria-label', a.name + ': ' + a.frage);
    nav.append(b);
  }
}
function zeichneLegende(a, legende){
  const f = $('#frage'); f.replaceChildren(el('b', '', a.name), el('span', '', ' · ' + a.frage));
  const d = $('#legende'); d.replaceChildren();
  if(legende){ const det = el('details'); det.append(el('summary', '', 'So liest man es')); const p = el('div', 'legtext'); p.innerHTML = legende; det.append(p); d.append(det); }
}

/* ---------- Der Weg ---------- */
function zeichneWeg(){
  const nav = $('#weg'); nav.replaceChildren();
  const w = wegZu(Z.gewaehlt).slice(1), ol = el('ol');   // „Ralfs Werke“ steht schon links als Marke
  if(!w.length) ol.append(el('li', 'klein', 'Der ganze Bestand'));
  w.forEach((k, i) => { const li = el('li'), b = knopf(i === w.length - 1 ? 'hier' : '', k.name, () => waehle(k));
    if(i === w.length - 1) b.setAttribute('aria-current', 'location');
    if(k.art === 'ort') b.style.setProperty('--ort', farbe(k).d);
    li.append(b); ol.append(li); });
  nav.append(ol); requestAnimationFrame(() => { nav.scrollLeft = nav.scrollWidth; });
}

/* ---------- Das Blatt zum Gewählten ---------- */
function zeichneBlatt(){
  const k = Z.gewaehlt; if(!k) return;
  // Am Handy brauchen Lesen und Büro die ganze Fläche; sie bringen ihre Handlungen selbst mit
  if(schmal() && (Z.ansicht === 'zelle' || Z.ansicht === 'buero')){ blatt.hidden = true; return; }
  const f = farbe(k); blatt.style.setProperty('--ort', f.f); blatt.style.setProperty('--ort-d', f.d); blatt.style.setProperty('--ort-h', f.h);
  blatt.classList.toggle('zu', !schmal() && !Z.blattOffen); blatt.classList.toggle('gross', Z.blattGross);
  const kopf = el('div', 'blattkopf');
  const griff = knopf('griff', null, () => { if(schmal()){ Z.blattGross = !Z.blattGross; } else Z.blattOffen = !Z.blattOffen; zeichneBlatt(); nachBlatt(); },
    schmal() ? (Z.blattGross ? 'Blatt verkleinern' : 'Blatt vergrößern') : (Z.blattOffen ? 'Blatt einklappen' : 'Blatt ausklappen'));
  griff.setAttribute('aria-expanded', String(schmal() ? Z.blattGross : Z.blattOffen));
  griff.innerHTML = '<span aria-hidden="true"></span>';
  const e = k.eltern;
  const artWort = k.art === 'wurzel' ? 'Der ganze Bestand' : ARTWORT[k.art] + (e && e.art !== 'wurzel' ? ' in ' + e.name : '');
  kopf.append(griff, el('p', 'artwort', artWort), el('h2', 'titel', k.name));
  kopf.querySelector('h2').id = 'blatttitel';
  kopf.append(el('p', 'menge', (k.art === 'gespraech' ? 'Gespräch' : mengenWort(k)) + ' · ' + zeitWort(k)));
  // Handlungen, immer an derselben Stelle
  const tun = el('div', 'tun');
  if(k.art === 'fassung' || k.art === 'gespraech') tun.append(knopf('knopf haupt', k.art === 'gespraech' ? 'Gespräch lesen' : 'Lesen', () => oeffne(k)));
  else if(k.kinder && k.kinder.length && k.art !== 'wurzel') tun.append(knopf('knopf', 'Fassungen lesen', () => { const f0 = erstesBlatt(k); if(f0) oeffne(f0); }));
  if(k.art !== 'wurzel') tun.append(knopf('knopf', 'Auf den Tisch', () => { legeAufTisch(k); }));
  const bz = k.art !== 'wurzel' && k.art !== 'ort' ? Z.bezug.von(k) : [];
  if(bz.length && Z.ansicht !== 'galaxie') { const b1 = bz.filter(r => r.belegt).length; tun.append(knopf('knopf', b1 ? `Beziehungen: ${b1} belegt` + (bz.length > b1 ? `, ${bz.length - b1} berechnet` : '') : `Nähe: ${bz.length} berechnet`, () => wechsle('galaxie', k))); }
  kopf.append(tun);
  const leib = el('div', 'blattleib');
  // auch an anderen Orten: dasselbe Werk
  const gleiche = (Z.inhalt.nachSchluessel.get(k.schluessel) || []).filter(q => q !== k);
  if(gleiche.length){ const p = el('div', 'auch'); p.append(el('span', 'klein', 'Dasselbe Werk liegt auch in: '));
    for(const q of gleiche){ const b = knopf('marke', wegZu(q).slice(1, -1).map(x => x.name).join(' › '), () => waehle(q)); b.style.setProperty('--ort', farbe(q).d); p.append(b); }
    leib.append(p); }
  if(k.gebiete && k.gebiete.length){ const p = el('p', 'gebiete klein'); p.append(el('span', '', 'Gebiete (berechnet): '), el('span', '', k.gebiete.join(', '))); leib.append(p); }
  // Bilder
  if(k.art === 'fassung' && k.bilder.length){ const band = el('div', 'bildband');
    k.bilder.slice(0, 24).forEach((b, i) => { const x = knopf('bildwahl', null, () => oeffne(k), b.text ? 'Bild: ' + b.text : 'Bild ' + (i + 1)); x.append(bildEl(K, b, i === 0 ? 960 : 240, 'bild')); band.append(x); });
    if(k.bilder.length > 24) band.append(el('p', 'klein', 'und ' + n(k.bilder.length - 24, 'weiteres Bild', 'weitere Bilder') + ' im Text'));
    leib.append(band);
  } else if(k.art !== 'wurzel' && k.art !== 'gespraech'){ const b = titelBild(k); leib.append(bildEl(K, b, 960, 'titelbild')); if(!b) leib.lastChild.title = ''; }
  if(k.art === 'fassung'){ const z = el('dl', 'daten');
    const zeile = (a, b) => { z.append(el('dt', '', a), el('dd', '', b)); };
    zeile('Zeit', tagWort(k.von)); if(k.stimme) zeile('Stimme', k.stimme); zeile('Urteil', k.urteil === 'offen' ? 'noch offen' : k.urteil);
    zeile('Umfang', mengenWort(k)); leib.append(z); }
  // Beziehungen
  if(bz.length){ const sek = el('section', 'bezuege'); sek.append(el('h3', '', 'Beziehungen'));
    const gruppe = (titel, l) => { if(!l.length) return; sek.append(el('p', 'klein', titel)); const ul = el('ul', 'liste');
      for(const r of l.slice(0, 40)){ const li = el('li'), b = knopf('zeile', null, () => waehle(r.andere));
        const art = BELEGT[r.art] ? (r.aus ? BELEGT[r.art].wort : BELEGT[r.art].rueck) : BERECHNET[r.art].wort;
        b.append(el('span', 'rart ' + (r.belegt ? 'belegt' : 'berechnet'), art), el('span', 'rname', r.andere.name), el('small', '', r.andere.eltern ? r.andere.eltern.name : ''));
        li.append(b); ul.append(li); }
      if(l.length > 40) ul.append(el('li', 'klein', 'und ' + (l.length - 40) + ' weitere in der Galaxie'));
      sek.append(ul); };
    gruppe('Belegt im Fundus', bz.filter(r => r.belegt)); gruppe('Berechnet, nur Nähe', bz.filter(r => !r.belegt));
    leib.append(sek); }
  // Kinder
  if(k.kinder && k.kinder.length){ const sek = el('section', 'kinder'); sek.append(el('h3', '', k.art === 'wurzel' ? 'Orte' : 'Darin'));
    const ul = el('ul', 'liste');
    for(const c of k.kinder){ const li = el('li'), b = knopf('zeile', null, () => waehle(c));
      const tb = titelBild(c); b.append(bildEl(K, tb, 240, 'mini'));
      const t = el('span', 'rtext'); t.append(el('span', 'rname', c.name), el('small', '', c.kinder ? mengenWort(c) : (c.art === 'gespraech' ? 'Gespräch · ' : '') + tagWort(c.von)));
      b.append(t); if(c.art === 'ort') b.style.setProperty('--ort', farbe(c).f); li.append(b); ul.append(li); }
    sek.append(ul); leib.append(sek); }
  if(k.art === 'wurzel' && Z.inhalt.stand) leib.append(el('p', 'klein', Z.inhalt.stand));
  // Technische Details: geschlossen, nur auf Wunsch
  if(k.art !== 'wurzel'){ const d = el('details', 'technik'); d.append(el('summary', '', 'Technische Details'));
    d.addEventListener('toggle', () => { if(d.open && d.children.length === 1){ const pre = el('pre'); pre.textContent = 'Schlüssel: ' + k.schluessel + (k.kennung ? '\nKennung: ' + k.kennung : '') + '\nAdresse: ' + adresse(k); d.append(pre); } });
    leib.append(d); }
  blatt.replaceChildren(kopf, leib); blatt.hidden = false;
}
const erstesBlatt = k => { if(!k.kinder) return k; for(const c of k.kinder){ const f = erstesBlatt(c); if(f) return f; } return null; };
function nachBlatt(){ requestAnimationFrame(() => Z.laeuft?.groesse?.()); }

/* ---------- Der Tisch des Büros: die Mappe ist persönlich, getrennt vom Fundus ---------- */
export const TISCH = 'werkansichten.tisch';
function legeAufTisch(k){
  let t = []; try { t = JSON.parse(localStorage.getItem(TISCH) || '[]'); } catch(e){ t = []; }
  const a = adresse(k);
  if(!t.includes(a)){ t.push(a); try { localStorage.setItem(TISCH, JSON.stringify(t)); sage('„' + k.name + '“ liegt jetzt auf dem Tisch im Büro (in diesem Browser gespeichert).'); } catch(e){ sage('Der Tisch kann in diesem Browser nicht gespeichert werden.'); } }
  else sage('„' + k.name + '“ liegt schon auf dem Tisch.');
}

/* ---------- Suche: über alle Ansichten hinweg, bleibt beim Wechsel ---------- */
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
let index = null;
function baueIndex(){ index = Z.inhalt.alle.filter(k => k.art !== 'wurzel').map(k => ({k, t: norm(k.name + ' ' + (k.werk || '') + ' ' + (k.stimme || '') + ' ' + (k.gebiete || []).join(' '))})); }
function finde(q){
  const w = norm(q).split(/\s+/).filter(Boolean); if(!w.length) return [];
  const r = []; for(const e of index) if(w.every(x => e.t.includes(x))) r.push(e.k);
  const rang = {ort: 0, bereich: 1, app: 2, werk: 3, fassung: 4, gespraech: 5};
  return r.sort((a, b) => (norm(a.name).startsWith(w[0]) ? 0 : 1) - (norm(b.name).startsWith(w[0]) ? 0 : 1) || rang[a.art] - rang[b.art] || a.name.length - b.name.length);
}
function setzeSuche(q, adr = true){
  q = (q || '').trim(); Z.suche = {q, treffer: null, pfade: null};
  if(q){ const r = finde(q); Z.suche.treffer = new Set(r.map(k => k.schluessel)); Z.suche.liste = r;
    Z.suche.pfade = new Set(); for(const k of r) for(const p of wegZu(k)) Z.suche.pfade.add(p.schluessel); }
  const chip = $('#suchstand'); chip.replaceChildren();
  if(q){ chip.append(el('span', '', `„${q}“ · ${n(Z.suche.treffer.size, 'Treffer', 'Treffer')}`), knopf('weg', '×', () => setzeSuche(''), 'Suche beenden')); chip.hidden = false; }
  else chip.hidden = true;
  if(Z.laeuft && Z.laeuft.suche) Z.laeuft.suche(Z.suche);
  if(adr) inAdresse(false);
}
function oeffneSuche(){
  const d = $('#suche'), f = d.querySelector('input'), ul = d.querySelector('ul');
  d.hidden = false; f.value = Z.suche.q; f.focus(); f.select(); let auswahl = 0, liste = [];
  const zeig = () => { const q = f.value.trim(); liste = q ? finde(q).slice(0, 60) : []; ul.replaceChildren(); auswahl = Math.min(auswahl, Math.max(0, liste.length - 1));
    d.querySelector('.zahl').textContent = q ? (liste.length ? n(finde(q).length, 'Treffer', 'Treffer') : 'Nichts gefunden. Andere Schreibweise versuchen?') : 'Name eines Orts, einer App, eines Werks, einer Fassung oder eines Gebiets';
    liste.forEach((k, i) => { const li = el('li'), b = knopf('zeile' + (i === auswahl ? ' an' : ''), null, () => nimm(k));
      b.setAttribute('role', 'option'); b.setAttribute('aria-selected', String(i === auswahl));
      b.append(bildEl(K, titelBild(k), 240, 'mini'));
      const t = el('span', 'rtext'); t.append(el('span', 'rname', k.name), el('small', '', ARTWORT[k.art] + ' · ' + wegZu(k).slice(1, -1).map(x => x.name).join(' › ')));
      b.append(t); li.append(b); ul.append(li); }); };
  const nimm = k => { schliesse(); setzeSuche(f.value); waehle(k); };
  const schliesse = () => { d.hidden = true; f.oninput = f.onkeydown = null; $('#suchknopf').focus(); };
  f.oninput = () => { auswahl = 0; zeig(); };
  f.onkeydown = e => {
    if(e.key === 'ArrowDown'){ auswahl = Math.min(liste.length - 1, auswahl + 1); zeig(); ul.children[auswahl]?.scrollIntoView({block: 'nearest'}); e.preventDefault(); }
    else if(e.key === 'ArrowUp'){ auswahl = Math.max(0, auswahl - 1); zeig(); ul.children[auswahl]?.scrollIntoView({block: 'nearest'}); e.preventDefault(); }
    else if(e.key === 'Enter'){ if(liste[auswahl]) nimm(liste[auswahl]); else { schliesse(); setzeSuche(f.value); } e.preventDefault(); }
    else if(e.key === 'Escape'){ schliesse(); e.preventDefault(); } };
  d.onclick = e => { if(e.target === d) schliesse(); };
  d.querySelector('.alle').onclick = () => { schliesse(); setzeSuche(f.value); };
  zeig();
}

/* ---------- Tastatur: überall gleich ---------- */
addEventListener('keydown', e => {
  const imFeld = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  if(!$('#suche').hidden || imFeld) return;
  if((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/'){ e.preventDefault(); oeffneSuche(); }
  else if(e.key === 'Escape' && Z.gewaehlt && Z.gewaehlt.eltern && !e.defaultPrevented){ e.preventDefault(); zurueck(); }
  else if(/^[1-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey){ wechsle(ANSICHTEN[+e.key - 1].id); }
});

let hinweisZeit = 0;
function sage(t){ hinweis.textContent = t; hinweis.classList.add('da'); clearTimeout(hinweisZeit); hinweisZeit = setTimeout(() => hinweis.classList.remove('da'), 4200); }

addEventListener('resize', () => { const s = schmal(); if(s !== document.body.classList.contains('schmal')){ document.body.classList.toggle('schmal', s); if(!s) Z.blattOffen = true; zeichneBlatt(); } });

/* ---------- Der Bestand: zuletzt gelesener Stand sofort, der frische im Hintergrund ---------- */
async function holeBestand(url = '/api/graph'){
  let lager = null; try { lager = await caches.open('werkansichten-bestand'); } catch(e){ /* ohne Ablage: immer frisch */ }
  const frisch = fetch(url).then(r => { if(!r.ok) throw new Error('Bestand ' + r.status); if(lager) lager.put(url, r.clone()).catch(() => {}); return r.text(); });
  const alt = lager ? await lager.match(url).catch(() => null) : null;
  if(alt){
    const t = await alt.text();
    frisch.then(neu => { if(neu !== t && !Z.veraltet){ Z.veraltet = true; sage('Der Bestand hat sich seit dem letzten Besuch geändert. Neu laden zeigt den neuen Stand.'); } }).catch(() => { if(url === '/api/graph') sage('Der Dienst ist gerade nicht erreichbar. Du siehst den zuletzt gelesenen Stand.'); });
    try { return JSON.parse(t); } catch(e){ /* kaputte Ablage: frisch lesen */ }
  }
  return JSON.parse(await frisch);
}

/* ---------- Start: sofort etwas sehen, dann den Bestand ---------- */
async function start(){
  document.body.classList.toggle('schmal', schmal());
  baueLeiste();
  $('#suchknopf').onclick = oeffneSuche;
  $('#marke').onclick = () => waehle(Z.inhalt ? Z.inhalt.wurzel : null);
  const a0 = ausAdresse();
  const ladeEl = el('div', 'laedt'); ladeEl.append(el('p', '', 'Der Bestand wird gelesen …'), el('p', 'klein', 'Orte, Apps, Werke, Fassungen, Bilder und Gespräche'));
  buehne.replaceChildren(ladeEl);
  let g, bilder = {}, gespraeche = [];
  try {
    const hole = async u => { const r = await fetch(u); if(!r.ok) throw new Error(r.status + ' ' + u); return r.json(); };
    const bilderDa = hole('/lichtwerk/bilder').catch(() => null);
    [g, gespraeche] = await Promise.all([holeBestand(), holeBestand('/lichtwerk/gespraeche').catch(() => [])]);
    bilder = (await bilderDa) || {};
    if(!Object.keys(bilder).length) setTimeout(() => sage('Die Bilder sind gerade nicht erreichbar. Alle Werke bleiben ohne Bild erreichbar.'), 400);
  } catch(e){
    console.error(e); buehne.replaceChildren(fehlerEl('Der Bestand ist gerade nicht erreichbar. Läuft der Lichtwerk-Dienst?', () => location.reload())); return;
  }
  for(const v of g.variants || []) Z.texte.set(v.id, v.content || '');
  try { performance.mark('bestand-geladen'); } catch(e){ /* nur Messung */ }
  Z.inhalt = baueInhalt(g, bilder, gespraeche);
  Z.bezug = baueBezuege(g, Z.inhalt);
  baueIndex();
  const k0 = nachPfad(a0.pfad);
  if(a0.pfad && !k0) setTimeout(() => sage('Die Adresse führt zu keinem Werk mehr. Hier ist der ganze Bestand.'), 300);
  if(a0.q) setzeSuche(a0.q, false);
  Z.gewaehlt = k0 || Z.inhalt.wurzel;
  history.replaceState({w: 1}, '', hashJetzt());
  starteAnsicht(a0.ansicht, Z.gewaehlt, false);
  window.__werkraum = {Z, K};   // für Prüfungen im Browser
}
start();
