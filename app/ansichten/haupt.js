/* Ein Inhalt, viele Ansichten: die gemeinsame Hülle.

   Hier liegt alles, was in jeder Ansicht gleich ist: der Inhalt, was gewählt ist, der Weg dorthin, die Karte
   des Gewählten, das Lesen und der Wechsel der Ansicht. Eine Ansicht zeichnet nur; sie ändert nichts.
   Das gewählte Werk bleibt beim Wechsel gewählt. */

import {baueInhalt, wegZu, adresse, bisherigeAdresse, mengenWort, zeitWort, ARTWORT} from './inhalt.js';
import {lesetext} from './lesen.js';

const $ = s => document.querySelector(s);
const el = (tag, klasse, text) => { const e = document.createElement(tag); if(klasse) e.className = klasse; if(text != null) e.textContent = text; return e; };

const ZEICHEN = {
  baum: '<path d="M12 21v-8M12 13c-5 0-7-3-7-6a4 4 0 0 1 5-3.5A4 4 0 0 1 17 4a4 4 0 0 1 2 7c-1 1.500-3 2-7 2Z"/><path d="M12 16l3-2.500M12 14l-2.500-2"/>',
  tragwerk: '<path d="M3 20h18M5 20V8M19 20V8M3 8h18M5 8l7-5 7 5M5 14h14M5 20l7-6 7 6M5 14l7-6 7 6"/>',
  kosmos: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.200" transform="rotate(-24 12 12)"/><circle cx="20.300" cy="7.800" r="1.100" fill="currentColor"/>',
  garten: '<path d="M12 21V11"/><path d="M12 14c-4 0-6-2-6-5 4 0 6 2 6 5ZM12 12c0-4 2-6 6-6 0 4-2 6-6 6Z"/><path d="M4 21h16"/>',
  galaxie: '<path d="M12 12c0-3 2.500-5 5.500-5M12 12c3 0 5 2.500 5 5.500M12 12c0 3-2.500 5-5.500 5M12 12c-3 0-5-2.500-5-5.500"/><circle cx="12" cy="12" r="1.300" fill="currentColor"/>',
  dorf: '<path d="M3 20V11l4.500-4 4.500 4v9M12 20v-6l4-3.500 4 3.500v6M2 20h20"/><path d="M6.500 20v-4h2v4"/>',
  campus: '<path d="M3 20h18M5 20V10M9.500 20V10M14.500 20V10M19 20V10M3 10l9-6 9 6Z"/>',
  buero: '<path d="M4 5h4v14H4zM8 5h4v14H8zM13.200 6.300l3.800-1 3.300 12.700-3.800 1z"/><path d="M5.500 8h1M9.500 8h1"/>',
  zelle: '<path d="M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6"/><path d="M4 20h9M4 17h5" opacity=".7"/>'
};
const bildchen = id => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ZEICHEN[id].replace(/(\d)\.(\d)00/g, '$1.$2')}</svg>`;

const ANSICHTEN = [
  {id: 'baum', name: 'Baum', satz: 'Was woraus gewachsen ist', modul: () => import('./baum.js')},
  {id: 'tragwerk', name: 'Tragwerk', satz: 'Was worauf ruht', modul: () => import('./tragwerk.js')},
  {id: 'kosmos', name: 'Kosmos', satz: 'Was um was kreist', modul: () => import('./kosmos.js')},
  {id: 'garten', name: 'Garten', satz: 'Was gerade blüht', modul: () => import('./garten.js')},
  {id: 'galaxie', name: 'Galaxie', satz: 'Alles auf einmal, in der Zeit', modul: () => import('./galaxie.js')},
  {id: 'dorf', name: 'Dorf', satz: 'Wer neben wem wohnt', modul: () => import('./dorf.js')},
  {id: 'campus', name: 'Campus', satz: 'Wo was seinen Platz hat', modul: () => import('./campus.js')},
  {id: 'buero', name: 'Büro', satz: 'Was auf dem Tisch liegt', modul: () => import('./buero.js')},
  {id: 'zelle', name: 'Zelle und Text', satz: 'Ein Werk von nah, mit seinem Wortlaut', modul: () => import('./zelle.js')}
];

const Z = {inhalt: null, gewaehlt: null, ansicht: 'baum', laeuft: null, texte: new Map(), karteOffen: innerWidth >= 760};
const buehneEl = $('#buehne'), kopf = $('#kopf'), karte = $('#karte'), lesen = $('#lesen'), hinweis = $('#hinweis');
const schmal = () => innerWidth < 760;
let perTastatur = false;
document.addEventListener('keydown', () => { perTastatur = true; }, true);
document.addEventListener('pointerdown', () => { perTastatur = false; }, true);

/* ---------- Adresse: #baum/education/faska ---------- */
function ausAdresse(){
  const t = decodeURIComponent(location.hash.replace(/^#/, '')).split('/').filter(Boolean), a = ANSICHTEN.find(x => x.id === t[0]);
  return {ansicht: a ? a.id : 'baum', pfad: (a ? t.slice(1) : t).join('/')};
}
function inAdresse(){ const p = Z.gewaehlt && Z.gewaehlt.art !== 'wurzel' ? '/' + adresse(Z.gewaehlt) : ''; const h = '#' + Z.ansicht + p; if(location.hash !== h) history.replaceState(null, '', h); }
function nachPfad(p){ if(!p) return Z.inhalt.wurzel; return Z.inhalt.alle.find(k => k.art !== 'wurzel' && adresse(k) === p)
  || Z.inhalt.alle.find(k => k.art !== 'wurzel' && bisherigeAdresse(k) === p) || Z.inhalt.wurzel; }

/* ---------- Der Kontext, den jede Ansicht bekommt ---------- */
const K = {
  get inhalt(){ return Z.inhalt; },
  get texte(){ return Z.texte; },
  gewaehlt: () => Z.gewaehlt,
  still: new URLSearchParams(location.search).has('still'),   // ohne Wachsen: für Standbilder und Prüfungen
  waehle: k => waehle(k),
  oeffne: k => oeffne(k),
  bildUrl: (b, breit = 240) => `/lichtwerk/bild?w=${breit >= 600 ? 960 : 240}&pfad=${encodeURIComponent(b.pfad)}`,
  rand: () => { const o = kopf.getBoundingClientRect().bottom + 8;
    if(schmal()) return {oben: o, unten: karte.hidden ? 6 : Math.max(6, innerHeight - karte.getBoundingClientRect().top + 6), links: 6, rechts: 6};
    return {oben: o, unten: 20, links: karte.hidden || !Z.karteOffen ? 20 : karte.getBoundingClientRect().width + 36, rechts: 20}; }
};

function waehle(k, o = {}){
  if(!k) k = Z.inhalt.wurzel;
  const fokusFolgt = perTastatur && lesen.hidden && (karte.contains(document.activeElement) || $('#weg').contains(document.activeElement));
  Z.gewaehlt = k; zeichneWeg(); zeichneKarte(); inAdresse();
  if(fokusFolgt) karte.querySelector('.kartenkopf')?.focus({preventScroll: true});
  if(Z.laeuft && Z.laeuft.zeige) Z.laeuft.zeige(k, o.sofort);
}

/* ---------- Der Weg: wo bin ich, wie komme ich zurück ---------- */
function zeichneWeg(){
  const nav = $('#weg'); nav.replaceChildren();
  const w = wegZu(Z.gewaehlt);
  if(w.length > 1){ const z = el('button', 'zurueck'); z.type = 'button'; z.setAttribute('aria-label', 'Eine Stufe zurück zu ' + w[w.length - 2].name);
    z.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    z.onclick = () => waehle(w[w.length - 2]); nav.append(z); }
  const reihe = el('ol', 'stufen');
  w.forEach((k, i) => { const li = el('li'), b = el('button', i === w.length - 1 ? 'hier' : '', k.name); b.type = 'button';
    if(i === w.length - 1) b.setAttribute('aria-current', 'location'); b.onclick = () => waehle(k); li.append(b); reihe.append(li); });
  nav.append(reihe); requestAnimationFrame(() => { reihe.scrollLeft = reihe.scrollWidth; });
}

/* ---------- Die Karte des Gewählten ---------- */
function ortsWort(k){
  const e = k.eltern; if(!e) return 'Ein Inhalt, viele Ansichten';
  const teile = [ARTWORT[k.art] + (e.art === 'wurzel' ? '' : ' in ' + e.name)];
  const auch = (k.auch || []).filter(n => !wegZu(k).some(q => q.name === n)); if(auch.length) teile.push('auch in ' + auch.join(', '));
  return teile.join(' · ');
}
function titelBild(k){
  if(k.bild) return k.bild;
  if(k.bilder?.length) return k.bilder[0];
  for(const c of k.kinder || []){ const b=titelBild(c); if(b) return b; }
  return null;
}
function zeichneKarte(){
  const k = Z.gewaehlt, blatt = !k.kinder; karte.replaceChildren(); karte.classList.toggle('offen', Z.karteOffen);
  const kopfteil = el('button', 'kartenkopf'); kopfteil.type = 'button'; kopfteil.setAttribute('aria-expanded', String(Z.karteOffen));
  const griff = el('span', 'griff'); griff.setAttribute('aria-hidden', 'true');
  kopfteil.append(griff, el('span', 'art', ortsWort(k)), el('span', 'titel', k.name), el('span', 'menge', (k.art === 'gespraech' ? '' : mengenWort(k) + ' · ') + zeitWort(k)));
  kopfteil.onclick = () => { Z.karteOffen = !Z.karteOffen; karte.classList.toggle('offen', Z.karteOffen); kopfteil.setAttribute('aria-expanded', String(Z.karteOffen)); nachKarte(); };
  karte.append(kopfteil);
  const leib = el('div', 'kartenleib');
  if(blatt){
    if(k.bilder.length){ const band = el('div', 'bildband'); for(const [n, b] of k.bilder.slice(0, 12).entries()){
      const wahl = el('button', 'bildwahl'); wahl.type = 'button'; wahl.setAttribute('aria-label', b.text ? 'Bild öffnen: ' + b.text : 'Bild ' + (n + 1) + ' öffnen');
      const i = new Image(); i.loading = 'lazy'; i.alt = b.text || ''; i.src = K.bildUrl(b, 240);
      wahl.append(i); wahl.onclick = () => oeffne(k, b); band.append(wahl);
    } leib.append(band); }
    if(k.stimme) leib.append(el('p', 'klein', 'Stimme: ' + k.stimme));
    const l = el('button', 'haupt', k.art === 'gespraech' ? 'Gespräch lesen' : 'Fassung lesen'); l.type = 'button'; l.onclick = () => oeffne(k); leib.append(l);
  } else {
    if(k.art === 'wurzel'){ leib.append(el('p', 'klein', Z.inhalt.stand)); const lg = el('button', 'leise', 'Wie liest man diese Ansicht?'); lg.type = 'button'; lg.onclick = zeigeLegende; leib.append(lg); }
    if(k.bild){ const i = new Image(); i.className = 'titelbild'; i.alt = k.bild.text || ''; i.src = K.bildUrl(k.bild, 960); leib.append(i); }
    const liste = el('ul', 'kinder');
    for(const c of k.kinder){ const li = el('li'), b = el('button'); b.type = 'button';
      const cb = titelBild(c);
      if(cb){ const i = new Image(); i.loading = 'lazy'; i.alt = ''; i.src = K.bildUrl(cb, 240); b.append(i); } else b.append(el('span', 'punkt ' + c.art));
      const t = el('span', 'name'); t.append(el('b', '', c.name), el('small', '', c.kinder ? mengenWort(c) : c.art === 'gespraech' ? 'Gespräch · ' + zeitWort(c) : zeitWort(c)));
      b.append(t); b.onclick = () => waehle(c); li.append(b); liste.append(li); }
    leib.append(liste);
  }
  karte.append(leib);
}
function nachKarte(){ requestAnimationFrame(() => Z.laeuft?.zeige?.(Z.gewaehlt)); }

/* ---------- Lesen ---------- */
let lesefokus = null, lesehintergrund = [];
function bereiteLesen(){
  if(lesen.hidden){
    lesefokus = document.activeElement;
    lesehintergrund = [buehneEl, kopf, karte, hinweis].map(e => [e, e.inert]);
    for(const [e] of lesehintergrund) e.inert = true;
  }
  lesen.hidden = false; lesen.replaceChildren(); document.body.classList.add('liest');
}
async function oeffne(k, bild){
  bereiteLesen();
  const blatt = el('article', 'blatt'), zu = el('button', 'zu'); zu.type = 'button'; zu.setAttribute('aria-label', 'Schließen');
  zu.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'; zu.onclick = schliesse;
  const w = wegZu(k).slice(1, -1).map(q => q.name).join(' › ');
  const titel = el('h1', '', k.name); titel.id = 'lesetitel';
  blatt.append(zu, el('p', 'art', w), titel, el('p', 'menge', (k.art === 'gespraech' ? 'Gespräch' : mengenWort(k)) + ' · ' + zeitWort(k) + (k.stimme ? ' · ' + k.stimme : '')));
  if(k.bilder.length){ const g = el('div', 'bilder'); for(const b of k.bilder){ const f = el('figure'), i = new Image(); i.loading = 'lazy'; i.alt = b.text || ''; i.src = K.bildUrl(b, 960); if(b.b && b.h) i.style.aspectRatio = b.b + ' / ' + b.h;
      f.append(i); if(b.text) f.append(el('figcaption', '', b.text)); g.append(f); if(b === bild) requestAnimationFrame(() => f.scrollIntoView({block: 'center'})); } blatt.append(g); }
  const text = el('div', 'text'); text.append(el('p', 'klein', 'Der Wortlaut wird geholt …')); blatt.append(text);
  // vor und zurück unter den Geschwistern
  const ge = k.eltern.kinder.filter(c => !c.kinder), i = ge.indexOf(k), fuss = el('nav', 'weiter');
  for(const [n, wort] of [[ge[i - 1], '‹ früher'], [ge[i + 1], 'später ›']]){ const b = el('button', '', n ? `${wort}: ${n.name}` : ''); b.type = 'button'; b.disabled = !n; if(n) b.onclick = () => { waehle(n); oeffne(n); }; fuss.append(b); }
  blatt.append(fuss); lesen.append(blatt); zu.focus();
  try { const html = await lesetext(k, Z.texte, K.bildUrl); text.innerHTML = html || '<p class="klein">Zu dieser Fassung liegt kein Wortlaut vor.</p>'; }
  catch(e){ text.replaceChildren(el('p', 'klein', 'Der Wortlaut ist gerade nicht erreichbar.')); }
  for(const im of text.querySelectorAll('img')) im.onerror = () => im.remove();
}
function schliesse(){
  if(lesen.hidden) return;
  lesen.hidden = true; lesen.replaceChildren(); document.body.classList.remove('liest');
  for(const [e, vorher] of lesehintergrund) e.inert = vorher;
  const zurueck = lesefokus?.isConnected && lesefokus !== document.body ? lesefokus : karte.querySelector('.kartenkopf');
  lesefokus = null; lesehintergrund = []; zurueck?.focus({preventScroll: true});
}
lesen.addEventListener('click', e => { if(e.target === lesen) schliesse(); });
lesen.addEventListener('keydown', e => {
  if(e.key !== 'Tab') return;
  const ziele = [...lesen.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(e => e.tabIndex >= 0 && !e.closest('[hidden], [inert]') && e.getClientRects().length);
  const erstes = ziele[0], letztes = ziele[ziele.length - 1];
  if(!erstes){ e.preventDefault(); lesen.focus(); }
  else if(e.shiftKey && (document.activeElement === erstes || !ziele.includes(document.activeElement))){ e.preventDefault(); letztes.focus(); }
  else if(!e.shiftKey && (document.activeElement === letztes || !ziele.includes(document.activeElement))){ e.preventDefault(); erstes.focus(); }
});

function zeigeLegende(){
  const a = ANSICHTEN.find(x => x.id === Z.ansicht); if(!Z.legende) return;
  bereiteLesen(); const b = el('article', 'blatt schmal'), zu = el('button', 'zu', '×'); zu.type = 'button'; zu.setAttribute('aria-label', 'Schließen'); zu.onclick = schliesse;
  const titel = el('h1', '', a.name); titel.id = 'lesetitel';
  const t = el('div', 'text'); t.innerHTML = Z.legende; b.append(zu, el('p', 'art', a.satz), titel, t); lesen.append(b); zu.focus();
}

/* ---------- Ansichten ---------- */
function zeichneLeiste(){
  const nav = $('#ansichten'); nav.replaceChildren();
  const jetzt = ANSICHTEN.find(a => a.id === Z.ansicht);
  const wahl = el('button', 'wahl'); wahl.type = 'button'; wahl.setAttribute('aria-haspopup', 'true'); wahl.setAttribute('aria-expanded', 'false');
  wahl.innerHTML = bildchen(jetzt.id) + `<span>${jetzt.name}</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
  const reihe = el('div', 'reihe'); reihe.setAttribute('role', 'group');
  for(const a of ANSICHTEN){ const b = el('button', a.id === Z.ansicht ? 'an' : ''); b.type = 'button'; b.setAttribute('aria-pressed', String(a.id === Z.ansicht));
    b.innerHTML = bildchen(a.id) + `<span class="n">${a.name}</span><span class="s">${a.satz}</span>`; b.onclick = () => { nav.classList.remove('auf'); wechsle(a.id); }; reihe.append(b); }
  wahl.onclick = () => { const auf = nav.classList.toggle('auf'); wahl.setAttribute('aria-expanded', String(auf)); };
  nav.append(wahl, reihe);
}
function schliesseAnsichten(fokus = false){
  const nav = $('#ansichten'), wahl = nav.querySelector('.wahl');
  nav.classList.remove('auf'); wahl?.setAttribute('aria-expanded', 'false');
  if(fokus) wahl?.focus();
}
document.addEventListener('pointerdown', e => { const nav = $('#ansichten'); if(nav.classList.contains('auf') && !nav.contains(e.target)) schliesseAnsichten(); });

let wechsel = 0;
async function wechsle(id, sofort, ohneAnfang = false){
  const a = ANSICHTEN.find(x => x.id === id) || ANSICHTEN[0];
  const auftrag = ++wechsel;
  Z.ansicht = a.id; zeichneLeiste(); inAdresse();
  if(Z.laeuft) buehneEl.classList.add('geht');
  const [m] = await Promise.all([a.modul ? a.modul() : null, new Promise(r => setTimeout(r, Z.laeuft && !sofort ? 220 : 0))]);
  if(auftrag !== wechsel) return false;   // Nur der zuletzt gewählte Blick darf die Bühne übernehmen.
  if(Z.laeuft){ Z.laeuft.ende && Z.laeuft.ende(); Z.laeuft = null; }
  buehneEl.replaceChildren(); document.body.dataset.ansicht = a.id; Z.legende = '';
  if(m){ const kontext = Object.create(K); if(ohneAnfang) kontext.still = true;
    Z.legende = m.legende || ''; Z.laeuft = m.starte(buehneEl, kontext); }
  else {   // noch nicht neu gebaut: ehrlich sagen, die bisherige Fassung bleibt erreichbar
    const p = el('div', 'kommt'); p.innerHTML = bildchen(a.id); p.append(el('h2', '', a.name), el('p', '', a.satz + '. Diese Ansicht wird gerade neu gebaut.'));
    const l = el('a', '', 'Die bisherige Fassung öffnen'); l.href = a.alt; p.append(l); buehneEl.append(p); Z.laeuft = {ende(){}};
  }
  buehneEl.classList.remove('geht');
  return true;
}

addEventListener('keydown', e => {
  if(e.key !== 'Escape') return;
  if(!lesen.hidden) return schliesse();
  if($('#ansichten').classList.contains('auf')) return schliesseAnsichten(true);
  if(Z.gewaehlt && Z.gewaehlt.eltern) waehle(Z.gewaehlt.eltern);
});
addEventListener('hashchange', () => { if(!Z.inhalt) return; const a = ausAdresse(), k = nachPfad(a.pfad);
  if(a.ansicht !== Z.ansicht){ Z.gewaehlt = k; zeichneWeg(); zeichneKarte(); wechsle(a.ansicht); }
  else if(k !== Z.gewaehlt) waehle(k); });

/* ---------- Anfang ---------- */
async function beginne(){
  hinweis.textContent = 'Der Inhalt wird gelesen …';
  let bilderSpaeter = null, graph, gespraeche;
  try {
    const hole = async u => { const r = await fetch(u); if(!r.ok) throw new Error(u); return r.json(); };
    // Die Bilderliste braucht manchmal Sekunden. Darauf wartet nichts: erst steht alles ohne Bilder da, dann kommen sie dazu.
    const bilderDa = hole('/lichtwerk/bilder').catch(() => null);
    [graph, gespraeche] = await Promise.all([hole('/api/graph'), hole('/lichtwerk/gespraeche').catch(() => [])]);
    const g = graph;
    const frueh = await Promise.race([bilderDa, new Promise(r => setTimeout(() => r(undefined), 250))]);
    Z.inhalt = baueInhalt(g, frueh || {}, gespraeche);
    if(frueh === undefined) bilderSpaeter = bilderDa;
    for(const v of g.variants || []) Z.texte.set(v.id, v.content || '');
  } catch(e){
    hinweis.replaceChildren(el('span', '', 'Das Lichtwerk antwortet gerade nicht. ')); const b = el('button', '', 'Noch einmal versuchen'); b.type = 'button'; b.onclick = beginne; hinweis.append(b); return;
  }
  hinweis.textContent = ''; hinweis.hidden = true;
  const a = ausAdresse(); Z.gewaehlt = nachPfad(a.pfad); Z.ansicht = a.ansicht;
  zeichneWeg(); zeichneKarte(); await wechsle(Z.ansicht, true);
  if(bilderSpaeter){ const bilder = await bilderSpaeter; if(!bilder) return;
    const vorher = Z.gewaehlt, pfad = vorher && vorher.art !== 'wurzel' ? adresse(vorher) : '';
    Z.inhalt = baueInhalt(graph, bilder, gespraeche);
    const stellen = vorher ? Z.inhalt.nachSchluessel.get(vorher.schluessel) || [] : [];
    Z.gewaehlt = stellen.find(k => adresse(k) === pfad) || stellen[0] || Z.inhalt.wurzel;
    zeichneWeg(); zeichneKarte(); await wechsle(Z.ansicht, true, true);
  }
}
beginne();
