/* =====================================================================
   STOFF — der Übergang vom Lichtkorn ins tatsächliche Material.
   Ein ruhiger Leseraum im selben Licht: der ganze Text in Passagen, am Rand die
   belegten Verwendungen an genau der Stelle, an der ihr Textanker im Wortlaut steht.
   Vergleichen nach Codex' Abgleich (gemeinsame Wörter und Reihenfolge, keine Bedeutung),
   der Zweig als Perlenfaden, eine Lesestelle, die Werkwechsel und Neuladen übersteht.
   Fortsetzen ohne Formular: ⌘V oder Ablegen, dann Halten, als Weiterarbeit mit den
   gelesenen Fassungen. Keine Kennung im Bild.
   ===================================================================== */
import {materialParagraphs, alignParagraphs, appSource} from '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/materialraum.js';
import {W} from '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/welt.js';
import {STIMMEN, MENSCH, kurz, menschlich, datum, nameVon, TYP_SATZ, STATUS_SATZ, MODUS_SATZ} from '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/daten.js';
import {ahnen} from '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/wuchs.js';

const $ = s => document.querySelector(s);
const el = (tag, cls, text) => { const n = document.createElement(tag); if(cls) n.className = cls; if(text != null) n.textContent = text; return n; };
const knopf = (text, fn, cls) => { const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', fn); return b; };
const farbeVon = st => typeof st === 'number' ? STIMMEN[st].hex : st === MENSCH ? '#e6ecff' : '#d8cfc0';
const VERTRAEGLICH = {conditional: 'unter Bedingungen', open: 'offen', complementary: 'ergänzend', incompatible: 'nicht verträglich', direct: 'direkt'};
const VERTRAEGLICH_SATZ = {conditional: 'Unter Bedingungen.', open: 'Verträglichkeit offen.', complementary: 'Ergänzend.', incompatible: 'Nicht verträglich.', direct: 'Direkt.'};
/* Eine Kante von der anderen Fassung zu dieser: einmal als Etikett am Rand, einmal als Satz über diesen Teil */
const RUECK = {'verweist-auf': 'wird erwähnt von', 'remixt-aus': 'weiterverwendet von', 'erweitert': 'erweitert von', 'testet': 'geprüft von', 'widerspricht': 'widersprochen von'};
const AUF_DIESEN = {'verweist-auf': 'verweist auf diesen Teil', 'remixt-aus': 'ist neu gemischt aus diesem Teil', 'erweitert': 'erweitert diesen Teil', 'testet': 'prüft diesen Teil',
  'widerspricht': 'widerspricht diesem Teil', 'bewertet': 'bewertet diesen Teil', 'gehört-zu': 'gehört zu diesem Teil'};
const satzEnde = s => /[.!?…:]$/.test(s) ? s : s + '.';
const istSeite = f => /^<!doctype html>/i.test(String((f && f.content) || '').trimStart());

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
  const kopf = a => norm(a.heading || (String(a.text).match(/^\s{0,3}#{1,6}\s+(.*)$/m) || [])[1] || '');
  const treffer = absaetze.filter(a => (' ' + norm(a.text) + ' ').includes(' ' + t + ' ') || norm(a.text).includes(t));
  if(treffer.length){ const k = treffer.find(a => kopf(a) && kopf(a).includes(t)) || treffer[0];   // bei mehreren: die Überschrift zuerst
    return {index: k.index, art: 'wörtlich', mehrfach: treffer.length}; }
  for(const a of absaetze){ const h = kopf(a);
    if(h && h.length >= 3 && (h === t || h.includes(t) || (t.includes(h) && h.length >= 8))) return {index: a.index, art: 'abschnitt', mehrfach: 1}; }
  return null;
}
/* Rundenschlüssel und relative Cloud-Pfade aus Verwendungstexten lesbar machen */
const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
const zeige = t => menschlich(t)
  .replace(/\b[a-z]+(?:-[a-z]+)+-(20\d{2})(\d{2})(\d{2})\b/g, (_, y, mo, d) => `Runde vom ${Number(d)}. ${MON[Number(mo) - 1] || ''}`.trim())
  .replace(/(?:Library\/)?Mobile Documents\/[^\s<>"'`)\]]+/g, x => x.split(/[\/:]/).filter(Boolean).pop() || '[Ablage]');
/* Verwendungen (Kanten mit beschriebener Verwendung) an dieser Fassung, je mit eigenem und fremdem Teil */
function verwendungen(v){
  const out = [];
  for(const e of W.B.roh.edges){ if(!e.usage) continue;
    if(e.from_variant_id === v.id) out.push({e, raus: true, teil: e.usage.from_part, fremd: e.to_variant_id, fremdTeil: e.usage.to_part});
    else if(e.to_variant_id === v.id) out.push({e, raus: false, teil: e.usage.to_part, fremd: e.from_variant_id, fremdTeil: e.usage.from_part}); }
  return out;
}

/* ------------------------------------------------------------ Öffnen */
const HINTEN = '#gl, #lese, .corner, #zurueck, #marke, #siegel ~ .corner';
export function oeffne({mond, i, keim, variantId, modus = 'lesen', vergleich = null, stelle = null, ungefaehr = false}){
  if(variantId){ const si = mond.samen.findIndex(s => s.id === variantId); if(si >= 0){ i = si; keim = false; } else if(mond.keim.some(k => k.id === variantId)) keim = true; }
  const v = keim ? (mond.keim.find(k => k.id === variantId) || mond.keim[mond.keim.length - 1]) : mond.samen[i] && mond.samen[i].fassung; if(!v) return false;
  z = {mond, v, si: keim ? -1 : i, modus, vergleich: vergleich === (v && v.id) ? null : vergleich, stelle, ungefaehr: ungefaehr && stelle != null ? stelle : null};
  if(modus === 'vergleich' && !W.B.fassungen.get(vergleich)) z.vergleich = vorschlag();
  if(modus === 'vergleich' && !z.vergleich) z.modus = 'lesen';
  baue();
  // Ruhige Einblendung beim Öffnen; bei reduzierter Bewegung nur ein Aufhellen ohne Bewegung
  const R = roh(); R.classList.toggle('still', !!W.RM); R.hidden = false; document.body.classList.add('im-stoff');
  document.querySelectorAll(HINTEN).forEach(n => { n.inert = true; });   // ein Dialog: dahinter ist nichts erreichbar
  requestAnimationFrame(() => { if(!z) return; springe(z.stelle); R.querySelector('.stoff-flaeche').focus({preventScroll: true}); });
  hilfe.ansage(`Material: ${kurz(v.label, 120)}. Escape führt zurück in die Zelle.`);
  hilfe.merkeOrt && hilfe.merkeOrt();
  return true;
}
export function schliesse(){
  if(!z) return; z = null; const R = roh(); R.hidden = true; document.body.classList.remove('im-stoff');
  document.querySelectorAll(HINTEN).forEach(n => { n.inert = false; });
  hilfe.merkeOrt && hilfe.merkeOrt();
}
/* Nach erneuern(): derselbe Mond, dieselbe Fassung, neue Indizes */
export function umhaengen(){
  if(!z || !W.B) return; const m = W.B.mondVon.get(z.mond.id); if(!m){ schliesse(); return; }
  const si = m.samen.findIndex(s => s.id === z.v.id), keim = si < 0 && m.keim.some(k => k.id === z.v.id);
  if(si < 0 && !keim){ schliesse(); return; }
  const f = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k : null;
  z = {...z, mond: m, si: keim ? -1 : si, v: W.B.fassungen.get(z.v.id) || z.v};
  if(z.vergleich && !W.B.fassungen.get(z.vergleich)){ z.vergleich = null; z.modus = 'lesen'; }
  const oben = roh().querySelector('.stoff-flaeche').scrollTop, loseOffen = !!roh().querySelector('.stoff-text details.lose[open]');
  baue(); const lose = loseOffen && roh().querySelector('.stoff-text details.lose'); if(lose) lose.open = true;
  roh().querySelector('.stoff-flaeche').scrollTop = oben; fokus(f);
}
function fokus(k){ if(!k) return; const n = roh().querySelector(`[data-k="${k}"]`); if(n) n.focus({preventScroll: true}); }

/* ------------------------------------------------------------ Gemeinsamer Wortlaut */
/* Wie viel Wortlaut zwei Fassungen teilen. Das misst Wortlaut, nie Bedeutung. */
const woerterVon = new WeakMap();
function woerter(v){
  let w = woerterVon.get(v); if(w) return w;
  const t = typeof v.content === 'string' ? v.content : v.content == null ? '' : JSON.stringify(v.content);
  w = new Set((t.toLocaleLowerCase('de').match(/[\p{L}\p{N}]+/gu) || []).filter(x => x.length > 1)); woerterVon.set(v, w); return w;
}
/* Gemeinsame Wörter beider Fassungen, ohne Reihenfolge: ein schneller Vorblick zum Ordnen der Gegenüber */
function wortAnteil(a, b){
  const A = woerter(a), Bw = woerter(b); if(!A.size || !Bw.size) return 0;
  const [klein, gross] = A.size < Bw.size ? [A, Bw] : [Bw, A]; let n = 0; for(const w of klein) if(gross.has(w)) n++;
  return 2 * n / (A.size + Bw.size);
}
/* Der Abgleich zugeordneter Passagen, Wort für Wort, und welcher Anteil des Wortlauts (Zeichen ohne Leerraum) dabei unmarkiert bliebe */
function abgleich(paare){
  const zeichen = s => s.replace(/\s+/g, '').length, wv = new Map(); let gemein = 0, alle = 0;
  for(const p of paare){
    const a = p.a ? zeige(p.a.text) : '', b = p.b ? zeige(p.b.text) : ''; alle += zeichen(a) + zeichen(b);
    if(!p.a || !p.b) continue;
    if(p.a.text === p.b.text){ gemein += zeichen(a) + zeichen(b); continue; }
    const v = wortVergleich(a, b); wv.set(p, v);
    if(v.grob === 'keiner'){ gemein += (p.score || 0) * (zeichen(a) + zeichen(b)); continue; }
    v.A.forEach((t, i) => { if(v.ka.has(i)) gemein += zeichen(t); }); v.Bt.forEach((t, i) => { if(v.kb.has(i)) gemein += zeichen(t); });
  }
  return {anteil: alle ? gemein / alle : 0, wv};
}
/* Kaum gemeinsam: weniger als ein Fünftel des Wortlauts bliebe unmarkiert, oder kaum eine Passage ist zugeordnet und auch der Wortlaut nur zum kleinen Teil gleich */
function kaumGemeinsam(paare, anteil){
  const gepaart = paare.filter(p => p.a && p.b).length;
  return !paare.length || anteil < 0.2 || (gepaart < 0.2 * paare.length && anteil < 0.35);
}
const geteilt = new WeakMap();   // je Fassung: welche anderen Wortlaut mit ihr teilen (die Objekte wechseln mit jedem Auffrischen)
function teilenWortlaut(a, b){
  let mit = geteilt.get(a); if(!mit) geteilt.set(a, mit = new WeakMap()); if(mit.has(b)) return mit.get(b);
  let ja = false;
  if(wortAnteil(a, b) >= 0.1){ const paare = alignParagraphs(materialParagraphs(a.content), materialParagraphs(b.content)); ja = !kaumGemeinsam(paare, abgleich(paare).anteil); }
  mit.set(b, ja); return ja;
}

/* Mögliche Gegenüber, in der Reihenfolge, in der sie naheliegen:
   zuerst Fassungen mit Kante oder Verwendung zu dieser (gleicher Mond zuerst, dann mit mehr gemeinsamen Wörtern),
   dann die Herkunft im Wuchs; eine Vorgängerin in der Kette nur, wenn sie Wortlaut mit dieser teilt; zuletzt gelesene.
   Innerhalb dieser Reihenfolge kommt nach vorn, was tatsächlich Wortlaut teilt. Eine Seite (Form) ist kein Text zum Abgleichen. */
function kandidaten(){
  const v = z.v, m = z.mond, out = new Map(), lesbar = f => f && f.id !== v.id && !istSeite(f);
  const ort = id => { const om = W.B.mondVon.get(W.B.werkVon(id)); return om && om.id !== m.id ? ` · in „${kurz(om.titel, 24)}“` : ''; };
  const dazu = (id, wie) => { const f = W.B.fassungen.get(id); if(!out.has(id) && lesbar(f)) out.set(id, {id, wie: wie + ort(id), f}); };
  const kanten = [];
  for(const e of W.B.roh.edges){ const raus = e.from_variant_id === v.id; if(!raus && e.to_variant_id !== v.id) continue;
    const id = raus ? e.to_variant_id : e.from_variant_id, f = W.B.fassungen.get(id); if(!lesbar(f)) continue;
    kanten.push({id, wie: (raus ? TYP_SATZ : RUECK)[e.edge_type] || 'verbunden mit', hier: W.B.werkVon(id) === m.id ? 1 : 0, w: wortAnteil(v, f)}); }
  kanten.sort((a, b) => (b.hier - a.hier) || (b.w - a.w));
  for(const k of kanten) dazu(k.id, k.wie);
  const Z = W.Z, i = z.si;
  if(i >= 0 && Z && Z.m === m){
    const Wu = Z.W, p = Wu.eltern[i], art = Wu.art[i];
    if(p >= 0){ const f = m.samen[p].fassung;
      if(art !== 'kette' && art !== 'reihe') dazu(m.samen[p].id, 'fortgesetzt aus');
      else if(f && teilenWortlaut(v, f)) dazu(m.samen[p].id, 'Vorgängerin im Zweig'); }
    const zw = Wu.zweige[Wu.zweigVon[i]], k = zw.indexOf(i);
    if(k > 0){ const f = m.samen[zw[k - 1]].fassung; if(f && !out.has(f.id) && teilenWortlaut(v, f)) dazu(f.id, 'Vorgängerin im Zweig'); }
  }
  for(const id of ((v.contribution || {}).seen_variant_ids || [])) dazu(id, 'gelesen');
  const alle = [...out.values()], teilt = new Set(alle.slice(0, 24).filter(k => teilenWortlaut(v, k.f)));
  return [...alle.filter(k => teilt.has(k)), ...alle.filter(k => !teilt.has(k))].map(({id, wie}) => ({id, wie}));
}
/* Die naheliegende zweite Fassung. Gibt es keine, bleibt Vergleichen trotzdem möglich: mit der Herkunft oder der Vorgängerin,
   und der Vergleich sagt dann, dass die beiden kaum Wortlaut teilen. */
function vorschlag(){
  const erste = kandidaten()[0]; if(erste) return erste.id;
  const Z = W.Z, i = z.si; if(i < 0 || !Z || Z.m !== z.mond) return null;
  const zw = Z.W.zweige[Z.W.zweigVon[i]], k = zw.indexOf(i);
  for(const j of [Z.W.eltern[i], k > 0 ? zw[k - 1] : -1]) if(j >= 0 && !istSeite(z.mond.samen[j].fassung)) return z.mond.samen[j].id;
  return null;
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
  const lesen = knopf('Lesen', () => { z.modus = 'lesen'; baue(); fokus('lesen'); hilfe.merkeOrt && hilfe.merkeOrt(); }, 'stoff-knopf');
  const vergl = knopf('Vergleichen', () => { z.modus = 'vergleich'; z.vergleich = z.vergleich || vorschlag(); if(!z.vergleich){ hilfe.zeile('Für diese Fassung gibt es noch keine zweite zum Vergleichen.'); z.modus = 'lesen'; } baue(); fokus('vergleich'); hilfe.merkeOrt && hilfe.merkeOrt(); }, 'stoff-knopf');
  lesen.dataset.k = 'lesen'; vergl.dataset.k = 'vergleich';
  lesen.setAttribute('aria-pressed', String(z.modus === 'lesen')); vergl.setAttribute('aria-pressed', String(z.modus === 'vergleich'));
  tun.append(lesen, vergl);
  baueFaden();
  const text = R.querySelector('.stoff-text'); text.innerHTML = ''; text.className = 'stoff-text' + (z.modus === 'vergleich' ? ' im-vergleich' : '');
  if(/^<!doctype html>/i.test(String(v.content || '').trimStart())){ text.append(el('p', 'stoff-leise', 'Diese Fassung ist eine Seite. Sie öffnet sich im Lichttisch, nicht als Rohtext.')); return; }
  if(z.modus === 'vergleich') baueVergleich(text); else baueLesen(text);
}

/* Der Zweig als Perlenfaden: Herkunft, die Fassungen des Zweigs, Abzweige; im Vergleich zusätzlich die gelesenen und verbundenen.
   Eine Perle ist so groß, wie ihre Fassung Text trägt, und hat die Farbe ihrer Stimme. Keine Ziffern: Einen Kurztitel tragen nur
   „hier“, ihre beiden Nachbarn und das Gegenüber; alle anderen nennen Titel und Datum nur dem Bildschirmleser. */
function baueFaden(){
  const nav = roh().querySelector('.stoff-faden'); nav.innerHTML = '';
  const Z = W.Z, m = z.mond; if(z.si < 0 || !Z || Z.m !== m) return;
  const Wu = Z.W, zw = Wu.zweige[Wu.zweigVon[z.si]], strang = el('div', 'strang'), p = Wu.eltern[zw[0]];
  const folgeIm = (p >= 0 ? [p] : []).concat(zw), hierK = folgeIm.indexOf(z.si);
  const maxL = Math.max(1, ...folgeIm.map(i => m.samen[i].laenge || 0));
  const gross = n => (8 + 8 * Math.min(1, Math.sqrt(Math.max(0, n) / maxL))).toFixed(1) + 'px';   // 8 bis 16 px, nach Textmenge
  const laengeVon = f => typeof f.content === 'string' ? f.content.length : f.content == null ? 0 : JSON.stringify(f.content).length;
  let nr = 0;
  const perle = (id, {sichtbar = '', unter = '', farbe, laenge = 0, art = '', vorweg = ''}) => {
    const f = W.B.fassungen.get(id), b = el('button', 'perle ' + art), k = 'p' + (nr++), punkt = el('i'); b.type = 'button'; b.dataset.k = k;
    punkt.style.setProperty('--farbe', farbe); punkt.style.setProperty('--gr', gross(laenge));
    b.append(punkt); if(sichtbar) b.append(el('span', null, sichtbar)); if(unter) b.append(el('small', null, unter));
    const hier = id === z.v.id, gegen = z.modus === 'vergleich' && id === z.vergleich;
    if(hier) b.classList.add('hier'); if(gegen) b.classList.add('gegenueber');
    b.setAttribute('aria-label', [vorweg, f ? `„${kurz(zeige(f.label), 80)}“` : '', f ? datum(Date.parse(f.created_at)) : '', unter, hier ? 'diese Fassung' : '', gegen ? 'gegenüber' : ''].filter(Boolean).join(', '));
    b.addEventListener('click', () => { waehle(id); fokus(k); }); if(!f) b.disabled = true; return b; };
  const mitTitel = j => Math.abs(j - hierK) <= 1 || (z.modus === 'vergleich' && m.samen[folgeIm[j]].id === z.vergleich);
  const kurztitel = i => kurz(zeige(m.samen[i].label), 18);
  if(p >= 0){ strang.append(perle(m.samen[p].id, {sichtbar: mitTitel(0) ? kurztitel(p) : '', unter: 'Herkunft', farbe: farbeVon(m.samen[p].stimme), laenge: m.samen[p].laenge, art: 'herkunft'}), el('span', 'glied')); }
  zw.forEach((i, k) => { if(k) strang.append(el('span', 'glied'));
    const ab = Wu.kinder[i].filter(c => Wu.zweigVon[c] !== Wu.zweigVon[i]).length, j = k + (p >= 0 ? 1 : 0);
    strang.append(perle(m.samen[i].id, {sichtbar: mitTitel(j) ? kurztitel(i) : '', farbe: farbeVon(m.samen[i].stimme), laenge: m.samen[i].laenge, art: ab ? 'gabelt' : '',
      vorweg: `${k + 1}. von ${zw.length} im Zweig${ab ? `, ${ab} ${ab === 1 ? 'Abzweig' : 'Abzweige'}` : ''}`})); });
  nav.append(el('span', 'faden-satz', z.modus === 'vergleich' ? 'Gegenüber wählen' : 'Dieser Zweig'), strang);
  if(z.modus === 'vergleich'){
    const weitere = new Map();
    for(const id of ((z.v.contribution || {}).seen_variant_ids || [])) if(id !== z.v.id) weitere.set(id, 'gelesen');
    for(const e of W.B.roh.edges){ if(e.from_variant_id === z.v.id) weitere.set(e.to_variant_id, TYP_SATZ[e.edge_type] || 'verbunden mit'); else if(e.to_variant_id === z.v.id) weitere.set(e.from_variant_id, RUECK[e.edge_type] || 'verbunden mit'); }
    const reihe = el('div', 'strang weitere');
    for(const [id, wie] of weitere){ const f = W.B.fassungen.get(id); if(!f || zw.some(i => m.samen[i].id === id)) continue;
      const om = W.B.mondVon.get(W.B.werkVon(id)), wo = om && om.id !== m.id ? ` · in „${kurz(om.titel, 24)}“` : '';
      reihe.append(perle(id, {sichtbar: kurz(zeige(f.label), 24), unter: wie + wo, farbe: farbeVon(W.B.stimmeDer(id)), laenge: laengeVon(f), art: 'fremd'})); if(reihe.childElementCount >= 12) break; }
    if(reihe.childElementCount) nav.append(reihe);
  }
  // Die Perle „hier“ in die Mitte des Fadens holen, ohne die Seite zu bewegen
  requestAnimationFrame(() => { const h = nav.querySelector('.perle.hier'); if(!h || !nav.clientWidth) return;
    const a = nav.getBoundingClientRect(), b = h.getBoundingClientRect(); nav.scrollLeft += (b.left + b.width / 2) - (a.left + a.width / 2); });
}
function waehle(id){
  if(z.modus === 'vergleich'){ if(id === z.v.id) return; z.vergleich = id; baue(); hilfe.merkeOrt && hilfe.merkeOrt(); return; }
  if(id === z.v.id) return;
  const m = z.mond, si = m.samen.findIndex(s => s.id === id);
  if(si >= 0){ z = {...z, v: m.samen[si].fassung, si, stelle: null, ungefaehr: null, vergleich: z.vergleich === id ? null : z.vergleich}; hilfe.waehleKorn && hilfe.waehleKorn(si); baue(); springe(null); hilfe.merkeOrt && hilfe.merkeOrt(); }
}

/* ------------------------------------------------------------ Lesen */
function passage(a, rand){
  const sec = el('section', 'passage'); sec.dataset.i = String(a.index);
  const nr = knopf(String(a.index + 1), () => { z.stelle = a.index; markiere(); hilfe.merkeOrt && hilfe.merkeOrt();
    try{ navigator.clipboard.writeText(a.text).then(() => hilfe.zeile('Stelle gemerkt. Der Absatz liegt in der Zwischenablage.'), () => hilfe.zeile('Stelle gemerkt.')); }catch(_){ hilfe.zeile('Stelle gemerkt.'); } }, 'nr');
  nr.setAttribute('aria-label', `Passage ${a.index + 1} als Lesestelle merken und kopieren`);
  sec.append(nr);
  const koerper = el('div', 'koerper');
  if(a.heading && a.role) koerper.append(el('h3', null, zeige(a.heading)));
  const h = !a.structured && String(a.text).match(/^\s{0,3}#{1,6}\s+(.*)$/);
  if(h && a.text.split('\n').length === 1) koerper.append(el('h3', null, zeige(h[1])));
  else if(a.structured) koerper.append(el('pre', null, zeige(a.text)));   // ohne Kennungen; der unveränderte Wortlaut bleibt in den Technischen Details
  else { const p = el('p'); p.append(gesetzt(zeige(a.text).replace(/^\s{0,3}#{1,6}\s+/, '').replace(/^\s*>\s?/gm, ''))); if(/^\s*>/.test(a.text)) p.className = 'zitat'; koerper.append(p); }
  sec.append(koerper);
  if(rand && rand.length){ const r = el('aside', 'rand'); for(const x of rand) r.append(x); sec.append(r); sec.classList.add('mit-rand'); }
  return sec;
}
/* Randnotizen dürfen neben die folgenden Passagen fließen, solange diese keinen eigenen Rand haben:
   eine kurze Überschrift mit zwei Notizen reißt sonst ein Loch in den Text. Nur, wenn der Rand eine eigene Spalte hat */
function randFliessen(text){
  if(!text.isConnected) return; const secs = [...text.querySelectorAll(':scope > .passage')];
  secs.forEach((sec, k) => { const rand = sec.querySelector(':scope > .rand'), koerper = sec.querySelector(':scope > .koerper'); if(!rand || !koerper) return; rand.style.marginBottom = '';
    if(getComputedStyle(sec).gridTemplateColumns.split(' ').length < 3) return;
    const ueber = rand.offsetHeight - koerper.offsetHeight; if(ueber <= 24) return;
    let platz = 0; for(let j = k + 1; j < secs.length && !secs[j].querySelector(':scope > .rand'); j++) platz += secs[j].offsetHeight;
    const weg = Math.min(ueber, platz); if(weg > 0) rand.style.marginBottom = `-${Math.round(weg)}px`; });
}
if(typeof addEventListener === 'function') addEventListener('resize', () => { const t = z && document.querySelector('#stoff .stoff-text'); if(t) randFliessen(t); });
function randNotiz(u){
  const f = W.B.fassungen.get(u.fremd); if(!f) return null;
  const om = W.B.mondVon.get(W.B.werkVon(u.fremd)), wo = om && om.id !== z.mond.id ? ` in „${kurz(om.titel, 36)}“` : '';
  const typ = u.e.edge_type, satz = (u.raus ? TYP_SATZ : RUECK)[typ] || 'verbunden mit';
  const b = el('button', 'notiz'); b.type = 'button';
  const ziel = `„${kurz(zeige(f.label), 60)}“${wo}`, teil = u.fremdTeil ? `dort: „${kurz(zeige(u.fremdTeil), 70)}“` : '', zweck = u.e.usage.purpose ? kurz(zeige(u.e.usage.purpose), 150) : '';
  b.append(el('span', 'art', satz), el('span', 'ziel', ziel));
  if(teil) b.append(el('span', 'teil', teil));
  if(zweck) b.append(el('span', 'zweck', zweck));
  const vt = VERTRAEGLICH[u.e.usage.compatibility]; if(vt) b.append(el('span', 'vertraeglich', vt));
  const vo = u.verortet, ungenau = vo && vo.art === 'abschnitt' ? 'Abschnitt, nicht wörtlich' : vo && vo.mehrfach > 1 ? `steht ${vo.mehrfach}-mal im Wortlaut, hier die erste passende Stelle` : '';
  if(ungenau) b.append(el('span', 'ungefaehr', ungenau));
  b.setAttribute('aria-label', [satz, ziel, teil, zweck, vt, ungenau].filter(Boolean).join('. ') + '. Folgen öffnet diese Fassung.');
  b.addEventListener('click', () => folge(u));
  return b;
}
/* Eine Verwendung ohne Fundstelle als ein lesbarer Satz statt Etiketten-Zeilen */
function satzNotiz(u){
  const f = W.B.fassungen.get(u.fremd); if(!f) return null;
  const om = W.B.mondVon.get(W.B.werkVon(u.fremd)), wo = om && om.id !== z.mond.id ? ` in „${kurz(om.titel, 36)}“` : '';
  const typ = u.e.edge_type, ziel = `„${kurz(zeige(f.label), 60)}“`, teil = u.teil ? `„${kurz(zeige(u.teil), 70)}“` : '';
  const dort = u.fremdTeil ? ` (dort: „${kurz(zeige(u.fremdTeil), 70)}“)` : '';
  const b = el('button', 'notiz satz'); b.type = 'button';
  if(u.raus) b.append(`${teil ? `Dieser Teil, ${teil},` : 'Diese Fassung'} ${TYP_SATZ[typ] || 'ist verbunden mit'} `, el('span', 'ziel', ziel), `${wo}${dort}.`);
  else { const verb = AUF_DIESEN[typ] || 'ist mit diesem Teil verbunden';
    b.append(el('span', 'ziel', ziel), `${wo} ${teil ? `${verb}: ${teil}` : verb.replace('diesen Teil', 'diese Fassung').replace('diesem Teil', 'dieser Fassung')}${dort}.`); }
  if(u.e.usage.purpose) b.append(' ' + satzEnde(kurz(zeige(u.e.usage.purpose), 150)));
  const vt = VERTRAEGLICH_SATZ[u.e.usage.compatibility]; if(vt) b.append(' ' + vt);
  b.setAttribute('aria-label', b.textContent + ' Folgen öffnet diese Fassung.');
  b.addEventListener('click', () => folge(u));
  return b;
}
/* Einer Verwendung folgen: in die andere Fassung, an ihren Teil, mit Rückweg */
function folge(u){
  const om = W.B.mondVon.get(W.B.werkVon(u.fremd)); if(!om) return;
  const ziel = W.B.fassungen.get(u.fremd), abs = materialParagraphs(ziel.content), wo = u.fremdTeil ? verorte(u.fremdTeil, abs) : null;
  // Nur ein eindeutiger wörtlicher Fund wird Lesestelle; sonst „ungefähr hier“
  hilfe.folgeStoff(u.fremd, om, {modus: 'lesen', stelle: wo ? wo.index : null, ungefaehr: !!wo && (wo.art !== 'wörtlich' || wo.mehrfach > 1)});
}
function baueLesen(text){
  const abs = materialParagraphs(z.v.content);
  if(!abs.length){ text.append(el('p', 'stoff-leise', 'Für diese Fassung ist kein Text im Bestand hinterlegt.')); return; }
  if(appSource(z.v.content)) text.append(el('p', 'stoff-leise', 'Ein gespeichertes App-Quellpaket: Beschreibung, Umfang und Quellabschnitte, so wie sie übernommen wurden.'));
  const us = verwendungen(z.v).map(u => ({...u, verortet: verorte(u.teil, abs)})), proStelle = new Map(), lose = [];
  for(const u of us){
    if(!u.verortet){ const n = satzNotiz(u); if(n) lose.push(n); continue; }
    const n = randNotiz(u); if(!n) continue; if(!proStelle.has(u.verortet.index)) proStelle.set(u.verortet.index, []); proStelle.get(u.verortet.index).push(n); }
  for(const a of abs) text.append(passage(a, proStelle.get(a.index)));
  requestAnimationFrame(() => randFliessen(text));
  text.append(el('p', 'stoff-ende', 'Das Material endet hier.'));
  // Zuerst das Material. Verwendungen, deren Teil nicht im Wortlaut steht, werden ehrlich genannt, aber danach und zugeklappt.
  if(lose.length){ const d = el('details', 'lose'), liste = el('div', 'lose-liste');
    d.append(el('summary', null, `${lose.length} ${lose.length === 1 ? 'Verwendung' : 'Verwendungen'} ohne Fundstelle im Wortlaut`));
    for(const n of lose) liste.append(n); d.append(liste); text.append(d); }
  markiere();
}

/* ------------------------------------------------------------ Vergleichen */
/* Längste gemeinsame Folge über Zeichenfolgen-Stücke; null, wenn es zu groß wird */
function lcs(A, Bt){
  if(A.length * Bt.length > 90000) return null;
  const ka = new Set(), kb = new Set(), w = Bt.length + 1, dp = new Uint32Array((A.length + 1) * w);
  for(let i = A.length - 1; i >= 0; i--) for(let j = Bt.length - 1; j >= 0; j--) dp[i * w + j] = A[i] === Bt[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
  let i = 0, j = 0; while(i < A.length && j < Bt.length){ if(A[i] === Bt[j]){ ka.add(i++); kb.add(j++); } else if(dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++; else j++; }
  return {ka, kb};
}
/* Erst Wort für Wort; wird das zu groß, Zeile für Zeile; wird auch das zu groß, gar nicht – und das wird gesagt */
function wortVergleich(a, b){
  let A = a.match(/\s+|[^\s]+/g) || [], Bt = b.match(/\s+|[^\s]+/g) || [], k = lcs(A, Bt);
  if(k) return {A, Bt, ...k, grob: null};
  A = a.split(/(\n)/); Bt = b.split(/(\n)/); k = lcs(A, Bt);
  if(k) return {A, Bt, ...k, grob: 'zeilen'};
  return {A: [a], Bt: [b], ka: new Set([0]), kb: new Set([0]), grob: 'keiner'};
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
  const hierA = materialParagraphs(z.v.content), dortA = materialParagraphs(o.content), paare = alignParagraphs(hierA, dortA), abw = [];
  const {anteil, wv: abgeglichen} = abgleich(paare);
  if(kaumGemeinsam(paare, anteil)){ baueRuhig(text, hierA, dortA, o); return; }   // dann ist nichts zugeordnet, und der Satz darüber entfällt
  text.append(el('p', 'stoff-leise', (appSource(z.v.content) || appSource(o.content) ? 'Quellabschnitte nach gleichen Abschnittstiteln zugeordnet. ' : 'Passagen nach gemeinsamen Wörtern und Reihenfolge zugeordnet. ')
    + 'Das ist ein Textabgleich, kein Urteil über Bedeutung.'));
  let gleichLauf = null;
  const leer = t => !t || !String(t.text || '').trim();
  for(const p of paare){
    if(leer(p.a) && leer(p.b)) continue;   // eine leere Passage ist kein Unterschied
    const gleich = p.a && p.b && p.a.text === p.b.text;
    if(gleich){ if(!gleichLauf){ gleichLauf = {n: 0, el: el('details', 'gleich')}; gleichLauf.sum = el('summary'); gleichLauf.el.append(gleichLauf.sum); text.append(gleichLauf.el); }
      gleichLauf.n++; gleichLauf.sum.textContent = `${gleichLauf.n} ${gleichLauf.n === 1 ? 'Passage' : 'Passagen'} unverändert`; gleichLauf.el.append(passage(p.a)); continue; }
    gleichLauf = null;
    const zeile = el('section', 'paar'); zeile.dataset.i = p.a ? String(p.a.index) : '';
    const wv = abgeglichen.get(p) || null;
    for(const [teil, seite] of [[p.a, 'hier'], [p.b, 'dort']]){
      const zelle = el('div', 'zelle ' + seite);
      if(leer(teil)){ zelle.classList.add('leer'); zelle.setAttribute('aria-hidden', 'true'); zeile.append(zelle); continue; }
      zelle.append(el('span', 'nr-klein', `${seite === 'hier' ? 'Passage' : 'gegenüber'} ${teil.index + 1}`));
      const t = el(teil.structured ? 'pre' : 'p');
      // Unter- und Durchstreichen nur für Wortunterschiede in zugeordneten Passagen; eine Passage ohne Gegenstück bleibt ungezeichnet
      if(wv){ markiert(t, seite === 'hier' ? wv.A : wv.Bt, seite === 'hier' ? wv.ka : wv.kb, seite === 'hier' ? 'del' : 'ins');
        if(wv.grob && seite === 'hier') zelle.append(el('span', 'grob', wv.grob === 'zeilen' ? 'zu lang für den Wortabgleich: Zeile für Zeile verglichen' : 'zu lang für einen Abgleich: unmarkiert')); }
      else { zelle.classList.add('allein'); zelle.append(el('span', 'vermerk', seite === 'hier' ? 'nur hier' : 'nur gegenüber')); t.append(zeige(teil.text)); }
      zelle.append(t); zeile.append(zelle); }
    text.append(zeile); abw.push(zeile);
  }
  // Zahl und Legende in einer Zeile; die Legende nur, wenn tatsächlich Wörter markiert sind
  const wortweise = !!text.querySelector('.paar del, .paar ins');
  const nav = el('div', 'vergleich-nav'); let k = -1;
  const geh = d => { if(!abw.length) return; k = (k + d + abw.length) % abw.length; abw[k].scrollIntoView({block: 'start'}); abw[k].tabIndex = -1; abw[k].focus({preventScroll: true}); };
  nav.append(el('span', null, abw.length ? `${abw.length} ${abw.length === 1 ? 'abweichende Passage' : 'abweichende Passagen'}` : 'Kein Unterschied im Wortlaut.'));
  if(wortweise){ const leg = el('span', 'legende'); leg.append(el('del', null, 'durchgestrichen'), ' nur hier, ', el('ins', null, 'unterstrichen'), ' nur gegenüber'); nav.append(leg); }
  if(abw.length > 1) nav.append(knopf('← vorige', () => geh(-1), 'stoff-knopf leise'), knopf('nächste →', () => geh(1), 'stoff-knopf leise'));
  text.insertBefore(nav, text.children[2] || null);
}
/* Teilen zwei Fassungen kaum Wortlaut, wird nichts markiert: ein ehrlicher Satz, andere Gegenüber zur Wahl, beide Texte ruhig nebeneinander */
function baueRuhig(text, hierA, dortA, o){
  text.append(el('p', 'vergleich-satz', 'Diese beiden Fassungen teilen kaum Wortlaut.'));
  // Angeboten wird nur, was mit dieser Fassung wirklich Wortlaut teilt; sonst dreht man sich im Kreis
  const andere = kandidaten().filter(k => k.id !== o.id && teilenWortlaut(z.v, W.B.fassungen.get(k.id))).slice(0, 4);
  if(andere.length){ const wahl = el('div', 'vergleich-wahl'); wahl.append(el('span', 'vergleich-wahl-satz', 'Ein anderes Gegenüber:'));
    andere.forEach((k, n) => { const f = W.B.fassungen.get(k.id), b = el('button', 'stoff-knopf leise'); b.type = 'button'; b.dataset.k = 'w' + n;
      b.append(el('small', null, k.wie), el('span', null, `„${kurz(zeige(f.label), 48)}“`));
      b.setAttribute('aria-label', `Gegenüber wählen: „${kurz(zeige(f.label), 80)}“, ${k.wie}, ${datum(Date.parse(f.created_at))}`);
      b.addEventListener('click', () => { waehle(k.id); fokus('vergleich'); }); wahl.append(b); });
    text.append(wahl); }
  else text.append(el('p', 'stoff-leise', 'Keine verbundene Fassung teilt nennenswert Wortlaut mit dieser. Beide Texte stehen hier ungezeichnet nebeneinander.'));
  const ruhig = el('div', 'vergleich-ruhig');
  for(const [abs, seite] of [[hierA, 'hier'], [dortA, 'dort']]){ const sp = el('div', 'spalte ' + seite);
    sp.append(el('span', 'nr-klein', seite === 'hier' ? 'diese Fassung' : 'gegenüber'));
    for(const a of abs){ const t = el(a.structured ? 'pre' : 'p', null, zeige(a.text)); if(seite === 'hier') t.dataset.i = String(a.index); sp.append(t); }
    if(!abs.length) sp.append(el('p', 'stoff-leise', 'Für diese Fassung ist kein Text im Bestand hinterlegt.'));
    ruhig.append(sp); }
  text.append(ruhig);
}

/* ------------------------------------------------------------ Lesestelle */
function markiere(){ const R = roh(); R.querySelectorAll('.passage.stelle, .passage.ungefaehr').forEach(n => n.classList.remove('stelle', 'ungefaehr'));
  if(z && z.ungefaehr != null){ const n = R.querySelector(`.stoff-text > .passage[data-i="${z.ungefaehr}"]`); if(n) n.classList.add('ungefaehr'); }
  if(z && z.stelle != null && z.stelle !== z.ungefaehr){ const n = R.querySelector(`.stoff-text > .passage[data-i="${z.stelle}"]`); if(n) n.classList.add('stelle'); } }
function springe(i){ const f = roh().querySelector('.stoff-flaeche'); if(i == null){ f.scrollTop = 0; return; }
  const n = roh().querySelector(`.stoff-text [data-i="${i}"]`); if(n){ n.scrollIntoView({block: 'start'}); f.scrollTop -= 24; markiere(); } }
let rollT = 0;
function beimRollen(){ if(!z) return; const jetzt = performance.now(); if(jetzt - rollT < 180) return; rollT = jetzt;
  const f = roh().querySelector('.stoff-flaeche'), oben = f.getBoundingClientRect().top + 60; let i = null;
  for(const n of roh().querySelectorAll('.stoff-text > .passage, .stoff-text > .paar, .vergleich-ruhig .hier > [data-i]')){ if(n.getBoundingClientRect().top > oben) break; if(n.dataset.i !== '') i = Number(n.dataset.i); }
  if(i !== z.stelle){ z.stelle = i; hilfe.merkeOrt && hilfe.merkeOrt(); } }

/* ------------------------------------------------------------ Tasten und Ablegen */
export function taste(e){
  if(!z) return false;
  if(e.key === 'Escape'){ e.preventDefault(); hilfe.zurueckAusStoff(); return true; }
  if((e.key === '[' || e.key === ']') && !e.metaKey && !e.ctrlKey){ const Z = W.Z; if(z.si < 0 || !Z || Z.m !== z.mond) return true; const zw = Z.W.zweige[Z.W.zweigVon[z.si]], k = zw.indexOf(z.si) + (e.key === ']' ? 1 : -1);
    if(k >= 0 && k < zw.length) waehle(z.mond.samen[zw[k]].id); return true; }
  return false;
}
/* Abgelegter Text wird Weiterarbeit dieser Fassung; gelesen sind sie selbst und das Gegenüber */
export function ablegen(text){ if(!z || z.si < 0) return false; hilfe.einwurf(text, {zielId: z.v.id, gesehen: [z.v.id, z.modus === 'vergleich' ? z.vergleich : null].filter(Boolean)}); return true; }

export function installiere(){
  const R = roh();
  R.querySelector('.stoff-zurueck').addEventListener('click', () => hilfe.zurueckAusStoff());
  R.querySelector('.stoff-flaeche').addEventListener('scroll', beimRollen, {passive: true});
  // Am Touchgerät gibt es kein ⌘V; „Hierzu ablegen“ steht dort schon in der Lesefläche
  const fuss = R.querySelector('.stoff-fuss'), grob = matchMedia('(pointer: coarse)'), fussZeigen = () => { if(fuss) fuss.hidden = grob.matches; };
  fussZeigen(); if(grob.addEventListener) grob.addEventListener('change', fussZeigen);
}

export {kandidaten, teilenWortlaut, abgleich, kaumGemeinsam, wortAnteil, vorschlag};
export function setzeZ(x){ z = x; }
