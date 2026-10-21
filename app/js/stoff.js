/* =====================================================================
   STOFF — der Übergang vom Lichtkorn ins tatsächliche Material.
   Ein ruhiger Leseraum im selben Licht: der ganze Text in Passagen, am Rand die
   belegten Verwendungen an genau der Stelle, an der ihr Textanker im Wortlaut steht.
   Vergleichen nach Codex' Abgleich (gemeinsame Wörter und Reihenfolge, keine Bedeutung),
   der Zweig als Perlenfaden, eine Lesestelle, die Werkwechsel und Neuladen übersteht.
   Fortsetzen ohne Formular: ⌘V oder Ablegen, dann Halten, als Weiterarbeit mit den
   gelesenen Fassungen. Keine Kennung im Bild.
   ===================================================================== */
import {materialParagraphs, alignParagraphs, appSource} from './materialraum.js';
import {W} from './welt.js';
import {STIMMEN, MENSCH, kurz, menschlich, datum, nameVon, TYP_SATZ, STATUS_SATZ, MODUS_SATZ} from './daten.js';
import {ahnen} from './wuchs.js';

const $ = s => document.querySelector(s);
const el = (tag, cls, text) => { const n = document.createElement(tag); if(cls) n.className = cls; if(text != null) n.textContent = text; return n; };
const knopf = (text, fn, cls) => { const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', fn); return b; };
const farbeVon = st => typeof st === 'number' ? STIMMEN[st].hex : st === MENSCH ? '#e6ecff' : '#d8cfc0';
const VERTRAEGLICH = {conditional: 'unter Bedingungen', open: 'offen', complementary: 'ergänzend', incompatible: 'nicht verträglich', direct: 'direkt'};

let hilfe = null, z = null;   // z: {mond, v, si, modus, vergleich, stelle}
export function init(h){ hilfe = h; }
export const offen = () => !!z;
export const zustand = () => z ? {mondId: z.mond.id, variantId: z.v.id, modus: z.modus, vergleich: z.vergleich, stelle: z.stelle} : null;

const roh = () => $('#stoff');
/* Leichte Auszeichnung des Wortlauts (fett, kursiv, Code) als echte Knoten, nie als HTML aus dem Bestand */
function gesetzt(text){
  const f = document.createDocumentFragment();
  for(const t of String(text).split(/(\*\*[^*\n]+\*\*|(?<![\w*])\*[^*\s][^*\n]*?\*(?![\w*])|`[^`\n]+`)/)){
    if(!t) continue;
    if(/^\*\*[^*]+\*\*$/.test(t)) f.append(el('strong', null, t.slice(2, -2)));
    else if(/^\*[^*].*\*$/.test(t)) f.append(el('em', null, t.slice(1, -1)));
    else if(/^`.+`$/.test(t)) f.append(el('code', null, t.slice(1, -1)));
    else f.append(document.createTextNode(t)); }
  return f;
}

/* ------------------------------------------------------------ Textanker */
const norm = t => String(t || '').toLowerCase().replace(/[„“"'»«‚‘’*_#>`]/g, ' ').replace(/\s+/g, ' ').trim();
/* Wo steht ein Teil? 'wörtlich' im Text, 'abschnitt' als Überschrift, sonst nicht verortet. Keine erfundene Präzision. */
export function verorte(teil, absaetze){
  const t = norm(teil); if(t.length < 3) return null;
  for(const a of absaetze){ if(norm(a.text).includes(t)) return {index: a.index, art: 'wörtlich'}; }
  for(const a of absaetze){ const h = norm(a.heading || (String(a.text).match(/^\s{0,3}#{1,6}\s+(.*)$/m) || [])[1] || '');
    if(h && h.length >= 3 && (h === t || h.includes(t) || (t.includes(h) && h.length >= 8))) return {index: a.index, art: 'abschnitt'}; }
  return null;
}
/* Verwendungen (Kanten mit beschriebener Verwendung) an dieser Fassung, je mit eigenem und fremdem Teil */
function verwendungen(v){
  const out = [];
  for(const e of W.B.roh.edges){ if(!e.usage) continue;
    if(e.from_variant_id === v.id) out.push({e, raus: true, teil: e.usage.from_part, fremd: e.to_variant_id, fremdTeil: e.usage.to_part});
    else if(e.to_variant_id === v.id) out.push({e, raus: false, teil: e.usage.to_part, fremd: e.from_variant_id, fremdTeil: e.usage.from_part}); }
  return out;
}

/* ------------------------------------------------------------ Öffnen */
export function oeffne({mond, i, keim, modus = 'lesen', vergleich = null, stelle = null}){
  const v = keim ? mond.keim[mond.keim.length - 1] : mond.samen[i] && mond.samen[i].fassung; if(!v) return false;
  z = {mond, v, si: keim ? -1 : i, modus, vergleich, stelle};
  if(modus === 'vergleich' && !W.B.fassungen.get(vergleich)) z.vergleich = vorschlag();
  if(modus === 'vergleich' && !z.vergleich) z.modus = 'lesen';
  baue();
  const R = roh(); R.hidden = false; document.body.classList.add('im-stoff');
  requestAnimationFrame(() => { springe(z.stelle); R.querySelector('.stoff-flaeche').focus({preventScroll: true}); });
  hilfe.ansage(`Material: ${kurz(v.label, 120)}. Escape führt zurück in die Zelle.`);
  hilfe.merkeOrt && hilfe.merkeOrt();
  return true;
}
export function schliesse(){
  if(!z) return; z = null; const R = roh(); R.hidden = true; document.body.classList.remove('im-stoff');
  hilfe.merkeOrt && hilfe.merkeOrt();
}
/* Die naheliegende zweite Fassung: Herkunft im Wuchs, sonst die Vorgängerin im Zweig, sonst eine gelesene */
function vorschlag(){
  const Z = W.Z, i = z.si; if(i < 0 || !Z || Z.m !== z.mond) return null;
  const p = Z.W.eltern[i]; if(p >= 0) return z.mond.samen[p].id;
  const zw = Z.W.zweige[Z.W.zweigVon[i]], k = zw.indexOf(i); if(k > 0) return z.mond.samen[zw[k - 1]].id;
  const gesehen = ((z.v.contribution || {}).seen_variant_ids || []).find(id => W.B.fassungen.get(id) && id !== z.v.id); return gesehen || null;
}

/* ------------------------------------------------------------ Bauen */
function baue(){
  const R = roh(), v = z.v, m = z.mond, a = W.B.agenten.get(v.author_id), st = z.si >= 0 ? m.samen[z.si].stimme : null;
  R.querySelector('.stoff-punkt').style.color = farbeVon(st);
  R.querySelector('.stoff-name').textContent = z.si < 0 ? 'Ausgangsfrage' : nameVon(a);
  R.querySelector('.stoff-wann').textContent = datum(Date.parse(v.created_at));
  R.querySelector('.stoff-titel').textContent = kurz(v.label, 220);
  const her = [`in „${kurz(m.titel, 60)}“`]; const mode = (v.contribution || {}).mode; if(mode) her.push(MODUS_SATZ[mode]);
  if(v.status && v.status !== 'entwurf') her.push(STATUS_SATZ[v.status]);
  if(z.si >= 0 && hilfe.herkunft){ const h = hilfe.herkunft({art: 'same', i: z.si, mond: m, zelle: W.Z}); if(h) her.push(h); }
  R.querySelector('.stoff-her').textContent = her.join(' · ');
  R.querySelector('.stoff-zurueck span:last-child').textContent = (hilfe.rueckSatz && hilfe.rueckSatz()) || 'zur Zelle';
  // Lesen oder Vergleichen
  const tun = R.querySelector('.stoff-modus'); tun.innerHTML = '';
  const lesen = knopf('Lesen', () => { z.modus = 'lesen'; baue(); hilfe.merkeOrt && hilfe.merkeOrt(); }, 'stoff-knopf');
  const vergl = knopf('Vergleichen', () => { z.modus = 'vergleich'; z.vergleich = z.vergleich || vorschlag(); if(!z.vergleich){ hilfe.zeile('Für diese Fassung gibt es noch keine zweite zum Vergleichen.'); z.modus = 'lesen'; } baue(); hilfe.merkeOrt && hilfe.merkeOrt(); }, 'stoff-knopf');
  lesen.setAttribute('aria-pressed', String(z.modus === 'lesen')); vergl.setAttribute('aria-pressed', String(z.modus === 'vergleich'));
  tun.append(lesen, vergl);
  baueFaden();
  const text = R.querySelector('.stoff-text'); text.innerHTML = ''; text.className = 'stoff-text' + (z.modus === 'vergleich' ? ' im-vergleich' : '');
  if(/^<!doctype html>/i.test(String(v.content || '').trimStart())){ text.append(el('p', 'stoff-leise', 'Diese Fassung ist eine Seite. Sie öffnet sich im Lichttisch, nicht als Rohtext.')); return; }
  if(z.modus === 'vergleich') baueVergleich(text); else baueLesen(text);
}

/* Der Zweig als Perlenfaden: Herkunft, die Fassungen des Zweigs, Abzweige; im Vergleich zusätzlich die gelesenen und verbundenen */
function baueFaden(){
  const nav = roh().querySelector('.stoff-faden'); nav.innerHTML = '';
  const Z = W.Z, m = z.mond; if(z.si < 0 || !Z || Z.m !== m) return;
  const Wu = Z.W, zw = Wu.zweige[Wu.zweigVon[z.si]], strang = el('div', 'strang');
  const perle = (id, text, unter, art) => { const b = el('button', 'perle ' + (art || ''), null); b.type = 'button'; const ziel = W.B.fassungen.get(id);
    b.append(el('i'), el('span', null, text)); if(unter) b.append(el('small', null, unter));
    const gewaehlt = z.modus === 'vergleich' ? id === z.vergleich : id === z.v.id;
    if(id === z.v.id) b.classList.add('hier'); if(gewaehlt && z.modus === 'vergleich') b.classList.add('gegenueber');
    b.setAttribute('aria-label', `${text}${unter ? ', ' + unter : ''}${id === z.v.id ? ', diese Fassung' : ''}`);
    b.addEventListener('click', () => waehle(id)); if(!ziel) b.disabled = true; return b; };
  const erste = zw[0], p = Wu.eltern[erste];
  if(p >= 0){ strang.append(perle(m.samen[p].id, 'Herkunft', kurz(m.samen[p].label, 28), 'herkunft')); strang.append(el('span', 'glied')); }
  zw.forEach((i, k) => { if(k) strang.append(el('span', 'glied'));
    const ab = Wu.kinder[i].filter(c => Wu.zweigVon[c] !== Wu.zweigVon[i]).length;
    strang.append(perle(m.samen[i].id, String(k + 1), ab ? `${ab} ${ab === 1 ? 'Abzweig' : 'Abzweige'}` : '', ab ? 'gabelt' : '')); });
  nav.append(el('span', 'faden-satz', z.modus === 'vergleich' ? 'Gegenüber wählen' : 'Dieser Zweig'), strang);
  if(z.modus === 'vergleich'){
    const weitere = new Map();
    for(const id of ((z.v.contribution || {}).seen_variant_ids || [])) if(id !== z.v.id) weitere.set(id, 'gelesen');
    for(const e of W.B.roh.edges){ if(e.from_variant_id === z.v.id) weitere.set(e.to_variant_id, TYP_SATZ[e.edge_type] || 'verbunden'); else if(e.to_variant_id === z.v.id) weitere.set(e.from_variant_id, 'verbunden'); }
    const reihe = el('div', 'strang weitere');
    for(const [id, wie] of weitere){ const f = W.B.fassungen.get(id); if(!f || zw.some(i => m.samen[i].id === id)) continue;
      const om = W.B.mondVon.get(W.B.werkVon(id)), wo = om && om.id !== m.id ? ` · in „${kurz(om.titel, 24)}“` : '';
      reihe.append(perle(id, kurz(f.label, 26), wie + wo, 'fremd')); if(reihe.childElementCount >= 12) break; }
    if(reihe.childElementCount) nav.append(reihe);
  }
}
function waehle(id){
  if(z.modus === 'vergleich'){ if(id === z.v.id) return; z.vergleich = id; baue(); hilfe.merkeOrt && hilfe.merkeOrt(); return; }
  if(id === z.v.id) return;
  const m = z.mond, si = m.samen.findIndex(s => s.id === id);
  if(si >= 0){ z = {...z, v: m.samen[si].fassung, si, stelle: null}; hilfe.waehleKorn && hilfe.waehleKorn(si); baue(); springe(null); hilfe.merkeOrt && hilfe.merkeOrt(); }
}

/* ------------------------------------------------------------ Lesen */
function passage(a, rand){
  const sec = el('section', 'passage'); sec.dataset.i = String(a.index);
  const nr = knopf(String(a.index + 1), () => { z.stelle = a.index; markiere(); hilfe.merkeOrt && hilfe.merkeOrt();
    try{ navigator.clipboard.writeText(a.text).then(() => hilfe.zeile('Stelle gemerkt. Der Absatz liegt in der Zwischenablage.'), () => hilfe.zeile('Stelle gemerkt.')); }catch(_){ hilfe.zeile('Stelle gemerkt.'); } }, 'nr');
  nr.setAttribute('aria-label', `Passage ${a.index + 1} als Lesestelle merken und kopieren`);
  sec.append(nr);
  const koerper = el('div', 'koerper');
  if(a.heading && a.role) koerper.append(el('h3', null, menschlich(a.heading)));
  const h = !a.structured && String(a.text).match(/^\s{0,3}#{1,6}\s+(.*)$/);
  if(h && a.text.split('\n').length === 1) koerper.append(el('h3', null, menschlich(h[1])));
  else if(a.structured) koerper.append(el('pre', null, menschlich(a.text)));   // ohne Kennungen; der unveränderte Wortlaut bleibt in den Technischen Details
  else { const p = el('p'); p.append(gesetzt(menschlich(a.text).replace(/^\s{0,3}#{1,6}\s+/, '').replace(/^\s*>\s?/gm, ''))); if(/^\s*>/.test(a.text)) p.className = 'zitat'; koerper.append(p); }
  sec.append(koerper);
  if(rand && rand.length){ const r = el('aside', 'rand'); for(const x of rand) r.append(x); sec.append(r); sec.classList.add('mit-rand'); }
  return sec;
}
function randNotiz(u){
  const f = W.B.fassungen.get(u.fremd); if(!f) return null;
  const om = W.B.mondVon.get(W.B.werkVon(u.fremd)), wo = om && om.id !== z.mond.id ? ` in „${kurz(om.titel, 36)}“` : '';
  const typ = u.e.edge_type, satz = u.raus ? (TYP_SATZ[typ] || 'verbunden mit') : ({'verweist-auf': 'wird erwähnt in', 'remixt-aus': 'weiterverwendet in', 'erweitert': 'erweitert in', 'testet': 'geprüft in', 'widerspricht': 'widersprochen in'}[typ] || 'verbunden mit');
  const b = el('button', 'notiz'); b.type = 'button';
  b.append(el('span', 'art', `${satz}${wo}`), el('span', 'ziel', `„${kurz(f.label, 60)}“`));
  if(u.fremdTeil) b.append(el('span', 'teil', `dort: „${kurz(u.fremdTeil, 70)}“`));
  const zweck = u.e.usage.purpose; if(zweck) b.append(el('span', 'zweck', kurz(zweck, 150)));
  const vt = VERTRAEGLICH[u.e.usage.compatibility]; if(vt) b.append(el('span', 'vertraeglich', vt));
  if(u.verortet && u.verortet.art === 'abschnitt') b.append(el('span', 'ungefaehr', 'Abschnitt, nicht wörtlich'));
  b.addEventListener('click', () => folge(u));
  return b;
}
/* Einer Verwendung folgen: in die andere Fassung, an ihren Teil, mit Rückweg */
function folge(u){
  const om = W.B.mondVon.get(W.B.werkVon(u.fremd)); if(!om) return;
  const ziel = W.B.fassungen.get(u.fremd), abs = materialParagraphs(ziel.content), wo = u.fremdTeil ? verorte(u.fremdTeil, abs) : null;
  hilfe.folgeStoff(u.fremd, om, {modus: 'lesen', stelle: wo ? wo.index : null});
}
function baueLesen(text){
  const abs = materialParagraphs(z.v.content);
  if(!abs.length){ text.append(el('p', 'stoff-leise', 'Für diese Fassung ist kein Text im Bestand hinterlegt.')); return; }
  if(appSource(z.v.content)) text.append(el('p', 'stoff-leise', 'Ein gespeichertes App-Quellpaket: Beschreibung, Umfang und Quellabschnitte, so wie sie übernommen wurden.'));
  const us = verwendungen(z.v).map(u => ({...u, verortet: verorte(u.teil, abs)})), proStelle = new Map(), lose = [];
  for(const u of us){ const n = randNotiz(u); if(!n) continue; if(u.verortet){ if(!proStelle.has(u.verortet.index)) proStelle.set(u.verortet.index, []); proStelle.get(u.verortet.index).push(n); } else lose.push({u, n}); }
  if(lose.length){ const kopf = el('section', 'lose'); kopf.append(el('p', 'stoff-leise', `${lose.length} ${lose.length === 1 ? 'Verwendung nennt' : 'Verwendungen nennen'} einen Teil, der im Wortlaut nicht steht:`));
    for(const {u, n} of lose){ n.prepend(el('span', 'teil eigen', `hier: „${kurz(u.teil, 70)}“`)); kopf.append(n); } text.append(kopf); }
  for(const a of abs) text.append(passage(a, proStelle.get(a.index)));
  text.append(el('p', 'stoff-ende', 'Das Material endet hier.'));
  markiere();
}

/* ------------------------------------------------------------ Vergleichen */
function wortVergleich(a, b){
  const A = a.match(/\s+|[^\s]+/g) || [], Bt = b.match(/\s+|[^\s]+/g) || [], ka = new Set(), kb = new Set();
  if(A.length * Bt.length > 90000){ let f = 0; while(f < Math.min(A.length, Bt.length) && A[f] === Bt[f]){ ka.add(f); kb.add(f); f++; }
    let i = A.length - 1, j = Bt.length - 1; while(i >= f && j >= f && A[i] === Bt[j]){ ka.add(i--); kb.add(j--); } }
  else { const w = Bt.length + 1, dp = new Uint32Array((A.length + 1) * w);
    for(let i = A.length - 1; i >= 0; i--) for(let j = Bt.length - 1; j >= 0; j--) dp[i * w + j] = A[i] === Bt[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    let i = 0, j = 0; while(i < A.length && j < Bt.length){ if(A[i] === Bt[j]){ ka.add(i++); kb.add(j++); } else if(dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++; else j++; } }
  return {A, Bt, ka, kb};
}
function markiert(node, toks, keep, art){
  let lauf = '', an = null; const flush = () => { if(!lauf) return; node.append(an ? el(art, null, lauf) : document.createTextNode(lauf)); lauf = ''; };
  toks.forEach((t, i) => { const neu = !keep.has(i); if(neu !== an){ flush(); an = neu; } lauf += t; }); flush();
}
function baueVergleich(text){
  const o = W.B.fassungen.get(z.vergleich); if(!o){ baueLesen(text); return; }
  const om = W.B.mondVon.get(W.B.werkVon(o.id)), wo = om && om.id !== z.mond.id ? ` in „${kurz(om.titel, 40)}“` : '';
  const kopf = el('div', 'vergleich-kopf');
  const seite = (v, wer, wann) => { const d = el('div', 'seite'); d.append(el('span', 'klein', wer), el('h2', null, kurz(v.label, 120)), el('span', 'klein', wann)); return d; };
  kopf.append(seite(z.v, 'diese Fassung', nameVon(W.B.agenten.get(z.v.author_id)) + ' · ' + datum(Date.parse(z.v.created_at))),
    seite(o, 'gegenüber' + wo, nameVon(W.B.agenten.get(o.author_id)) + ' · ' + datum(Date.parse(o.created_at))));
  text.append(kopf);
  text.append(el('p', 'stoff-leise', (appSource(z.v.content) || appSource(o.content) ? 'Quellabschnitte nach gleichen Abschnittstiteln zugeordnet. ' : 'Passagen nach gemeinsamen Wörtern und Reihenfolge zugeordnet. ')
    + 'Das ist ein Textabgleich, kein Urteil über Bedeutung. Durchgestrichen: nur hier. Unterstrichen: nur gegenüber.'));
  const paare = alignParagraphs(materialParagraphs(z.v.content), materialParagraphs(o.content)), abw = [];
  let gleichLauf = null;
  for(const p of paare){
    const gleich = p.a && p.b && p.a.text === p.b.text;
    if(gleich){ if(!gleichLauf){ gleichLauf = {n: 0, el: el('details', 'gleich')}; gleichLauf.sum = el('summary'); gleichLauf.el.append(gleichLauf.sum); text.append(gleichLauf.el); }
      gleichLauf.n++; gleichLauf.sum.textContent = `${gleichLauf.n} ${gleichLauf.n === 1 ? 'Passage' : 'Passagen'} unverändert`; gleichLauf.el.append(passage(p.a)); continue; }
    gleichLauf = null;
    const zeile = el('section', 'paar'); zeile.dataset.i = p.a ? String(p.a.index) : '';
    const wv = p.a && p.b ? wortVergleich(menschlich(p.a.text), menschlich(p.b.text)) : null;
    for(const [teil, seite] of [[p.a, 'hier'], [p.b, 'dort']]){
      const zelle = el('div', 'zelle ' + seite);
      if(!teil){ zelle.append(el('p', 'stoff-leise', seite === 'hier' ? 'hier ohne Gegenstück' : 'dort ohne Gegenstück')); zeile.append(zelle); continue; }
      zelle.append(el('span', 'nr-klein', `${seite === 'hier' ? 'Passage' : 'gegenüber'} ${teil.index + 1}`));
      const t = el(teil.structured ? 'pre' : 'p');
      if(wv) markiert(t, seite === 'hier' ? wv.A : wv.Bt, seite === 'hier' ? wv.ka : wv.kb, seite === 'hier' ? 'del' : 'ins');
      else t.append(el(seite === 'hier' ? 'del' : 'ins', null, menschlich(teil.text)));
      zelle.append(t); zeile.append(zelle); }
    text.append(zeile); abw.push(zeile);
  }
  const nav = el('div', 'vergleich-nav'); let k = -1;
  const geh = d => { if(!abw.length) return; k = (k + d + abw.length) % abw.length; abw[k].scrollIntoView({block: 'start'}); abw[k].tabIndex = -1; abw[k].focus({preventScroll: true}); };
  nav.append(el('span', null, abw.length ? `${abw.length} ${abw.length === 1 ? 'abweichende Passage' : 'abweichende Passagen'}` : 'Kein Unterschied im Wortlaut.'));
  if(abw.length > 1) nav.append(knopf('← vorige', () => geh(-1), 'stoff-knopf leise'), knopf('nächste →', () => geh(1), 'stoff-knopf leise'));
  text.insertBefore(nav, text.children[2] || null);
}

/* ------------------------------------------------------------ Lesestelle */
function markiere(){ const R = roh(); R.querySelectorAll('.passage.stelle').forEach(n => n.classList.remove('stelle'));
  if(z && z.stelle != null){ const n = R.querySelector(`.stoff-text > .passage[data-i="${z.stelle}"]`); if(n) n.classList.add('stelle'); } }
function springe(i){ const f = roh().querySelector('.stoff-flaeche'); if(i == null){ f.scrollTop = 0; return; }
  const n = roh().querySelector(`.stoff-text [data-i="${i}"]`); if(n){ n.scrollIntoView({block: 'start'}); f.scrollTop -= 24; markiere(); } }
let rollT = 0;
function beimRollen(){ if(!z) return; const jetzt = performance.now(); if(jetzt - rollT < 180) return; rollT = jetzt;
  const f = roh().querySelector('.stoff-flaeche'), oben = f.getBoundingClientRect().top + 60; let i = null;
  for(const n of roh().querySelectorAll('.stoff-text > .passage, .stoff-text > .paar')){ if(n.getBoundingClientRect().top > oben) break; if(n.dataset.i !== '') i = Number(n.dataset.i); }
  if(i !== z.stelle){ z.stelle = i; hilfe.merkeOrt && hilfe.merkeOrt(); } }

/* ------------------------------------------------------------ Tasten und Ablegen */
export function taste(e){
  if(!z) return false;
  if(e.key === 'Escape'){ e.preventDefault(); hilfe.zurueckAusStoff(); return true; }
  if((e.key === '[' || e.key === ']') && !e.metaKey && !e.ctrlKey){ const Z = W.Z; if(z.si < 0 || !Z) return true; const zw = Z.W.zweige[Z.W.zweigVon[z.si]], k = zw.indexOf(z.si) + (e.key === ']' ? 1 : -1);
    if(k >= 0 && k < zw.length) waehle(z.mond.samen[zw[k]].id); return true; }
  return false;
}
/* Abgelegter Text wird Weiterarbeit dieser Fassung; gelesen sind sie selbst und das Gegenüber */
export function ablegen(text){ if(!z || z.si < 0) return false; hilfe.einwurf(text, {zielId: z.v.id, gesehen: [z.v.id, z.modus === 'vergleich' ? z.vergleich : null].filter(Boolean)}); return true; }

export function installiere(){
  const R = roh();
  R.querySelector('.stoff-zurueck').addEventListener('click', () => hilfe.zurueckAusStoff());
  R.querySelector('.stoff-flaeche').addEventListener('scroll', beimRollen, {passive: true});
}
