/* Zelle und Text — genau hinsehen und verstehen.

   Links die Fassungen des Werks in ihrer Folge (belegte Zeit zuerst, unbelegte darunter, als solche benannt)
   und die Gliederung des Textes. In der Mitte der Wortlaut in ruhiger Satzbreite, mit Bildern.
   Werkzeuge: im Text suchen, zwei Fassungen nebeneinander vergleichen, zurück zur vorigen Ansicht.
   Die Leseposition bleibt je Fassung erhalten, auch nach einem Ausflug in eine andere Ansicht. */

import {lesetext} from './lesen.js';
import {el, knopf, farbe, behaelter, fassungenUnter, bildEl, tagWort, n} from './gemein.js';
import {mengenWort} from './inhalt.js';

export const legende = `<p>Links: alle Fassungen dieses Werks. Oben die mit belegter Zeit, in ihrer Folge; darunter die ohne belegte Zeit.</p>
<p>In der Mitte steht der Wortlaut unverändert. <b>Im Text suchen</b> markiert jede Stelle; <b>Vergleichen</b> legt eine zweite Fassung daneben und färbt, was nur in einer von beiden steht.</p>
<p>Die Stelle, an der du liest, bleibt gemerkt, auch wenn du die Ansicht wechselst.</p>`;

export function starte(flaeche, K){
  const raum = el('div', 'zelle'); flaeche.append(raum);
  const seite = el('nav', 'zseite'); seite.setAttribute('aria-label', 'Fassungen und Gliederung');
  const mitte = el('div', 'zmitte');
  const werkzeug = el('div', 'zwerkzeug');
  const lese = el('article', 'zlese'); lese.tabIndex = 0;
  mitte.append(werkzeug, lese); raum.append(seite, mitte);
  let fassung = null, werk = null, vergleich = null, treffer = [], trefferNr = 0, speichernZeit = 0, nr = 0;

  lese.addEventListener('scroll', () => { if(!fassung || vergleich) return; clearTimeout(speichernZeit); speichernZeit = setTimeout(() => K.lesestand.setze(fassung.schluessel, lese.scrollTop), 180); }, {passive: true});

  function waehleWerk(k){
    const w = k.kinder ? k : behaelter(k);
    const f = k.kinder ? (fassungenUnter(k).filter(x => x.art === 'fassung').sort((a, b) => (b.von ?? -1) - (a.von ?? -1))[0] || fassungenUnter(k)[0]) : k;
    return {w, f};
  }

  function zeichneSeite(){
    seite.replaceChildren();
    const fw = farbe(werk); raum.style.setProperty('--ort', fw.f); raum.style.setProperty('--ort-d', fw.d);
    const kopf = el('div', 'zskopf'); kopf.append(el('p', 'artwort', werk.art === 'app' ? 'App' : werk.art === 'werk' ? 'Werk' : 'Ort'), knopf('zswerk', werk.name, () => K.waehle(werk)));
    seite.append(kopf);
    const alle = fassungenUnter(werk);
    const mit = alle.filter(f => f.von != null), ohne = alle.filter(f => f.von == null);
    const liste = (titel, l) => { if(!l.length) return; seite.append(el('p', 'zsgruppe', titel)); const ol = el('ol', 'zsliste');
      for(const f of l){ const li = el('li'), b = knopf('zsfass' + (f === fassung ? ' an' : '') + (vergleich === f ? ' vergleich' : ''), null, () => { if(vergleich !== null && f !== fassung){ vergleich = f; zeige(); } else K.waehle(f); });
        if(f === fassung) b.setAttribute('aria-current', 'true');
        b.append(bildEl(K, f.bild || null, 240, 'mini'));
        const t = el('span', 'rtext'); t.append(el('span', 'rname', f.name), el('small', '', (f.art === 'gespraech' ? 'Gespräch · ' : '') + (f.von != null ? tagWort(f.von) : 'Zeit nicht belegt') + (f.bilder.length ? ' · ' + n(f.bilder.length, 'Bild', 'Bilder') : '')));
        b.append(t); li.append(b); ol.append(li); }
      seite.append(ol); };
    liste(mit.length ? 'Fassungen mit belegter Zeit (' + mit.length + ')' : '', mit);
    liste('Ohne belegte Zeit (' + ohne.length + ')', ohne);
    const g = el('div', 'zgliederung'); g.append(el('p', 'zsgruppe', 'Gliederung'));
    seite.append(g);
    requestAnimationFrame(() => seite.querySelector('.an')?.scrollIntoView({block: 'nearest'}));
  }

  function zeichneGliederung(){
    const g = seite.querySelector('.zgliederung'); if(!g) return; g.replaceChildren(el('p', 'zsgruppe', 'Gliederung'));
    const hs = [...lese.querySelectorAll('.ztext h2, .ztext h3, .ztext h4')];
    if(!hs.length){ g.append(el('p', 'klein', 'Dieser Text hat keine Überschriften.')); return; }
    const ol = el('ol', 'zgl');
    hs.slice(0, 80).forEach((h, i) => { h.id = 'gl' + i; const li = el('li', 'st' + h.tagName[1]); li.append(knopf('', h.textContent, () => { lese.scrollTo({top: h.offsetTop - 16, behavior: 'smooth'}); h.focus?.(); })); ol.append(li); });
    g.append(ol);
  }

  function zeichneWerkzeug(){
    werkzeug.replaceChildren();
    if(K.vorige){ werkzeug.append(knopf('knopf zurueckzu', '← Zurück zu ' + ({baum:'Baum',tragwerk:'Tragwerk',kosmos:'Kosmos',galaxie:'Galaxie',garten:'Garten',dorf:'Dorf',campus:'Campus',buero:'Büro'}[K.vorige.ansicht] || 'vorher'), () => K.zurueck())); }
    const such = el('div', 'zsuche'); const f = el('input'); f.type = 'search'; f.placeholder = 'Im Text suchen'; f.setAttribute('aria-label', 'Im Text suchen');
    const zahl = el('span', 'klein zzahl'); const vor = knopf('knopf klein2', '↑', () => springe(-1), 'Vorige Stelle'), nach = knopf('knopf klein2', '↓', () => springe(1), 'Nächste Stelle');
    f.oninput = () => markiere(f.value, zahl); f.onkeydown = e => { if(e.key === 'Enter'){ springe(e.shiftKey ? -1 : 1); e.preventDefault(); } if(e.key === 'Escape'){ f.value = ''; markiere('', zahl); e.stopPropagation(); } };
    such.append(f, zahl, vor, nach); werkzeug.append(such);
    const andere = fassungenUnter(werk).filter(x => x !== fassung && x.art === 'fassung');
    if(fassung && fassung.art === 'fassung' && andere.length){
      const v = knopf('knopf', vergleich ? 'Vergleich beenden' : 'Vergleichen', () => { vergleich = vergleich ? null : (andere.find(x => x.von != null && fassung.von != null && x.von < fassung.von && false) || naechste(andere)); zeige(); });
      v.setAttribute('aria-pressed', String(!!vergleich)); werkzeug.append(v);
    }
  }
  const naechste = l => { if(fassung.von == null) return l[0]; let b = l[0], d = Infinity; for(const x of l){ const e = x.von == null ? 1e15 : Math.abs(x.von - fassung.von); if(e < d){ d = e; b = x; } } return b; };

  function markiere(q, zahl){
    for(const m of lese.querySelectorAll('mark.zt')) m.replaceWith(document.createTextNode(m.textContent));
    lese.normalize(); treffer = []; trefferNr = 0;
    q = q.trim(); if(q.length < 2){ zahl.textContent = ''; return; }
    const ql = q.toLowerCase(), wanderer = document.createTreeWalker(lese.querySelector('.ztext') || lese, NodeFilter.SHOW_TEXT), knoten = [];
    while(wanderer.nextNode()) knoten.push(wanderer.currentNode);
    for(const t of knoten){ const s = t.nodeValue, sl = s.toLowerCase(); let i = sl.indexOf(ql), rest = t; let off = 0;
      while(i >= 0 && treffer.length < 2000){ const vorn = rest.splitText(i - off), hinten = vorn.splitText(q.length); const m = el('mark', 'zt'); m.textContent = vorn.nodeValue; vorn.replaceWith(m); treffer.push(m); rest = hinten; off = i + q.length; i = sl.indexOf(ql, off); } }
    zahl.textContent = treffer.length ? `${treffer.length} Stellen` : 'nicht im Text';
    if(treffer.length) springe(0);
  }
  function springe(d){ if(!treffer.length) return; trefferNr = (trefferNr + d + treffer.length) % treffer.length; treffer.forEach((m, i) => m.classList.toggle('jetzt', i === trefferNr));
    const m = treffer[trefferNr], r = m.getBoundingClientRect(), lr = lese.getBoundingClientRect(); lese.scrollTop += r.top - lr.top - lr.height / 3;
    werkzeug.querySelector('.zzahl').textContent = `${trefferNr + 1} von ${treffer.length}`; }

  async function textVon(f){
    try { return await lesetext(f, K.texte, K.bildUrl) || ''; } catch(e){ return null; }
  }
  function kopfVon(f){
    const h = el('header', 'zkopf'); const w = f.eltern;
    h.append(el('p', 'artwort', (f.art === 'gespraech' ? 'Gespräch' : 'Fassung') + (w ? ' in ' + w.name : '')), el('h1', '', f.name));
    const d = []; d.push(f.von != null ? tagWort(f.von) : 'Zeit nicht belegt'); if(f.stimme) d.push('Stimme: ' + f.stimme); if(f.art === 'fassung') d.push(mengenWort(f));
    h.append(el('p', 'zdaten', d.join(' · ')));
    return h;
  }
  function bilderVon(f, max = 400){
    if(!f.bilder || !f.bilder.length) return f.art === 'fassung' ? el('p', 'zohne klein', 'Zu dieser Fassung liegt kein Bild vor.') : el('span');
    const fig = el('div', 'zbilder' + (f.bilder.length === 1 ? ' eins' : ''));
    const setze = bis => { fig.replaceChildren();
      for(const b of f.bilder.slice(0, bis)){ const a = el('figure'); const gross = knopf('zbildknopf', null, () => zeigeGross(b), 'Bild groß ansehen' + (b.text ? ': ' + b.text : '')); gross.append(bildEl(K, b, f.bilder.length === 1 ? 960 : 240, 'bild')); a.append(gross); if(b.text) a.append(el('figcaption', '', b.text)); fig.append(a); }
      if(f.bilder.length > bis){ const m = knopf('knopf zalle', `Alle ${f.bilder.length} Bilder zeigen`, () => setze(f.bilder.length)); fig.append(m); } };
    setze(Math.min(max, 8));
    return fig;
  }
  function zeigeGross(b){
    const d = el('div', 'zgross'); d.tabIndex = -1; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Bild groß');
    const i = new Image(); i.src = K.bildUrl(b, 960); i.alt = b.text || ''; d.append(i); if(b.text) d.append(el('p', '', b.text));
    const zu = knopf('knopf', 'Schließen', () => d.remove()); d.append(zu);
    d.onclick = e => { if(e.target === d) d.remove(); }; d.onkeydown = e => { if(e.key === 'Escape'){ d.remove(); e.stopPropagation(); } };
    raum.append(d); zu.focus();
  }

  async function zeige(){
    const meinNr = ++nr;
    zeichneSeite(); zeichneWerkzeug();
    lese.classList.toggle('vergleich', !!vergleich);
    if(!fassung){ lese.replaceChildren(el('p', 'zleer', 'In diesem Werk liegt noch keine Fassung.')); return; }
    if(!vergleich){
      lese.replaceChildren(kopfVon(fassung), bilderVon(fassung), el('div', 'ztext', 'Der Wortlaut wird geladen …'));
      const h = await textVon(fassung); if(meinNr !== nr) return;
      const t = lese.querySelector('.ztext');
      if(h === null) t.replaceChildren(el('p', 'zleer', 'Der Wortlaut ist gerade nicht erreichbar.'));
      else if(!h.trim()) t.replaceChildren(el('p', 'zleer', 'Zu dieser Fassung liegt kein Wortlaut vor.'));
      else { t.innerHTML = h; reinige(t); }
      for(const img of t.querySelectorAll('img')) img.onerror = () => { const s = el('span', 'ohne bild'); s.append(el('span', 'ohnewort', 'Bild nicht erreichbar')); img.replaceWith(s); };
      zeichneGliederung();
      lese.scrollTop = K.lesestand.hole(fassung.schluessel);
    } else {
      const [a, b] = await Promise.all([textVon(fassung), textVon(vergleich)]); if(meinNr !== nr) return;
      const links = el('div', 'zspalte'), rechts = el('div', 'zspalte');
      links.append(kopfVon(fassung)); rechts.append(kopfVon(vergleich));
      const wahl = el('label', 'klein zwahl'); wahl.append('Verglichen mit: '); const s = el('select');
      for(const x of fassungenUnter(werk).filter(x => x !== fassung && x.art === 'fassung')){ const o = el('option', '', x.name + (x.von != null ? ' · ' + tagWort(x.von) : '')); o.value = x.schluessel; o.selected = x === vergleich; s.append(o); }
      s.onchange = () => { vergleich = fassungenUnter(werk).find(x => x.schluessel === s.value); zeige(); }; wahl.append(s); rechts.prepend(wahl);
      const ba = bloecke(a), bb = bloecke(b), [ma, mb] = vergleiche(ba.map(x => x.t), bb.map(x => x.t));
      const male = (spalte, bl, m, wort) => { const box = el('div', 'ztext'); bl.forEach((x, i) => { const e = el(x.tag, m[i] ? '' : wort); e.textContent = x.t; box.append(e); }); spalte.append(box); };
      male(links, ba, ma, 'nur-hier'); male(rechts, bb, mb, 'nur-dort');
      const gleich = ma.filter(Boolean).length;
      const summe = el('p', 'zsumme klein', `${gleich} von ${ba.length} Absätzen stehen gleich in beiden. Rot: nur in „${fassung.name}“. Grün: nur in „${vergleich.name}“.`);
      lese.replaceChildren(summe, el('div', 'zpaar'));
      lese.querySelector('.zpaar').append(links, rechts); lese.scrollTop = 0;
      zeichneGliederung();
    }
  }
  /* Nachreinigung: keine Ereignis-Attribute, Verweise nur auf http(s) oder eigene Bilder */
  function reinige(wurzel){
    for(const e of wurzel.querySelectorAll('*')){
      if(/^(SCRIPT|IFRAME|OBJECT|EMBED|STYLE|LINK|META)$/.test(e.tagName)){ e.remove(); continue; }
      for(const a of [...e.attributes]){ const nm = a.name.toLowerCase(), v = a.value.trim().toLowerCase();
        if(nm.startsWith('on') || nm === 'style') e.removeAttribute(a.name);
        else if((nm === 'href' || nm === 'src') && !(v.startsWith('https://') || v.startsWith('http://') || v.startsWith('/lichtwerk/bild?'))) e.removeAttribute(a.name); }
    }
  }
  const bloecke = h => { const d = new DOMParser().parseFromString(h || '', 'text/html').body; d.querySelectorAll('details').forEach(x => x.remove());
    return [...d.querySelectorAll('p, h2, h3, h4, li, pre, blockquote')].map(e => ({tag: /^H/.test(e.tagName) ? e.tagName.toLowerCase() : e.tagName === 'PRE' ? 'pre' : 'p', t: e.textContent.trim()})).filter(x => x.t); };
  /* Absätze in längster gemeinsamer Folge; was nicht passt, steht nur in einer der beiden */
  function vergleiche(a, b){
    const na = a.map(s => s.toLowerCase().replace(/\s+/g, ' ')), nb = b.map(s => s.toLowerCase().replace(/\s+/g, ' '));
    if(a.length * b.length > 4e6){ const sb = new Set(nb), sa = new Set(na); return [na.map(x => sb.has(x)), nb.map(x => sa.has(x))]; }
    const L = Array.from({length: a.length + 1}, () => new Uint16Array(b.length + 1));
    for(let i = a.length - 1; i >= 0; i--) for(let j = b.length - 1; j >= 0; j--) L[i][j] = na[i] === nb[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const ma = new Array(a.length).fill(false), mb = new Array(b.length).fill(false); let i = 0, j = 0;
    while(i < a.length && j < b.length){ if(na[i] === nb[j]){ ma[i] = mb[j] = true; i++; j++; } else if(L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    return [ma, mb];
  }

  return {
    zeige(k){
      const {w, f} = waehleWerk(k);
      const neu = f !== fassung || w !== werk; werk = w;
      if(f !== fassung){ fassung = f; vergleich = null; }
      if(neu) zeige();
    },
    ende(){ if(fassung && !vergleich) K.lesestand.setze(fassung.schluessel, lese.scrollTop); raum.remove(); }
  };
}
