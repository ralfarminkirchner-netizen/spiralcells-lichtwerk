/* Büro — tatsächlich mit dem Bestand arbeiten.

   Links: finden und sichten (Suchwort, Ort, Art, mit Bild, mit Zeit; Reihenfolge).
   Mitte: der Tisch. Bis zu vier Stücke liegen nebeneinander: Bild, Daten, Wortlaut, Beziehungen.
   Rechts im Tisch: Mappen. Eine Mappe ist eine benannte Zusammenstellung, die bleibt.

   Persönlich und getrennt vom Fundus: Tisch und Mappen liegen nur in diesem Browser (localStorage)
   und verändern nichts am Bestand. Der Stand wird immer ausgesprochen: „gespeichert“ oder „nicht gespeichert“. */

import {el, knopf, farbe, titelBild, bildEl, fassungenUnter, tagWort, n} from './gemein.js';
import {adresse, wegZu, mengenWort, zeitWort, ARTWORT} from './inhalt.js';
import {lesetext} from './lesen.js';

export const legende = `<p><b>Finden</b> links: Suchwort, Ort, Art, nur mit Bild, nur mit belegter Zeit. Ein Tipp wählt; „Auf den Tisch“ legt dazu.</p>
<p><b>Tisch</b>: bis zu vier Stücke nebeneinander, mit Bild, Daten, Wortlaut und Beziehungen. Lesen öffnet das Lesepult.</p>
<p><b>Mappen</b> halten eine Zusammenstellung unter einem Namen. Tisch und Mappen liegen nur in diesem Browser und verändern nichts am Fundus.</p>`;

const TISCH = 'werkansichten.tisch', MAPPEN = 'werkansichten.mappen';
const lies = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } };
const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e){ return false; } };

export function starte(flaeche, K){
  const I = K.inhalt;
  const nachAdresse = new Map(I.alle.filter(k => k.art !== 'wurzel').map(k => [adresse(k), k]));
  const raum = el('div', 'buero'); flaeche.append(raum);
  const finden = el('section', 'bfinden'); finden.setAttribute('aria-label', 'Finden');
  const tisch = el('section', 'btisch'); tisch.setAttribute('aria-label', 'Tisch');
  raum.append(finden, tisch);
  const speicherOk = schreib('werkansichten.probe', 1);

  // ---------- Finden ----------
  const F = {q: '', ort: '', art: 'fassung', bild: false, zeit: false, folge: 'neu', seite: 1};
  const kopf = el('div', 'bfkopf');
  const q = el('input'); q.type = 'search'; q.placeholder = 'Wort im Namen'; q.setAttribute('aria-label', 'Wort im Namen');
  const ort = el('select'); ort.setAttribute('aria-label', 'Ort'); ort.append(new Option('Alle Orte', ''));
  for(const o of I.wurzel.kinder.filter(o => o.kinder)) ort.append(new Option(o.name, o.name));
  const art = el('select'); art.setAttribute('aria-label', 'Art');
  for(const [w, t] of [['fassung', 'Fassungen'], ['werk', 'Werke und Apps'], ['gespraech', 'Gespräche'], ['alle', 'Alles']]) art.append(new Option(t, w));
  const folge = el('select'); folge.setAttribute('aria-label', 'Reihenfolge');
  for(const [w, t] of [['neu', 'Neueste zuerst'], ['alt', 'Älteste zuerst'], ['name', 'Nach Namen'], ['gross', 'Größte zuerst']]) folge.append(new Option(t, w));
  const hak = (t, schl) => { const l = el('label', 'bhak'); const c = el('input'); c.type = 'checkbox'; c.onchange = () => { F[schl] = c.checked; F.seite = 1; liste(); }; l.append(c, ' ' + t); return l; };
  q.oninput = () => { F.q = q.value; F.seite = 1; liste(); };
  ort.onchange = () => { F.ort = ort.value; F.seite = 1; liste(); }; art.onchange = () => { F.art = art.value; F.seite = 1; liste(); }; folge.onchange = () => { F.folge = folge.value; liste(); };
  const reihe2 = el('div', 'bfreihe'); reihe2.append(ort, art);
  const reihe3 = el('div', 'bfreihe'); reihe3.append(hak('mit Bild', 'bild'), hak('mit belegter Zeit', 'zeit'), folge);
  kopf.append(q, reihe2, reihe3);
  const zahl = el('p', 'klein bfzahl'), ul = el('ul', 'bfliste');
  finden.append(kopf, zahl, ul);
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function treffer(){
    const w = norm(F.q).split(/\s+/).filter(Boolean), gesehen = new Set();
    const r = I.alle.filter(k => {
      if(k.art === 'wurzel' || k.art === 'ort') return false;
      if(F.art === 'fassung' && k.art !== 'fassung') return false;
      if(F.art === 'gespraech' && k.art !== 'gespraech') return false;
      if(F.art === 'werk' && k.art !== 'werk' && k.art !== 'app') return false;
      if(gesehen.has(k.schluessel)) return false;
      if(F.ort && !(I.nachSchluessel.get(k.schluessel) || [k]).some(x => wegZu(x)[1]?.name === F.ort)) return false;
      if(F.bild && !titelBild(k)) return false;
      if(F.zeit && k.von == null) return false;
      if(w.length){ const t = norm(k.name + ' ' + (k.werk || '') + ' ' + (k.stimme || '')); if(!w.every(x => t.includes(x))) return false; }
      gesehen.add(k.schluessel); return true; });
    const z = (a, b) => (a.von == null) - (b.von == null);
    if(F.folge === 'neu') r.sort((a, b) => z(a, b) || (b.bis ?? 0) - (a.bis ?? 0));
    else if(F.folge === 'alt') r.sort((a, b) => z(a, b) || (a.von ?? 0) - (b.von ?? 0));
    else if(F.folge === 'name') r.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    else r.sort((a, b) => (b.fassungen || b.zeichen || 0) - (a.fassungen || a.zeichen || 0));
    return r;
  }
  function liste(){
    const r = treffer(), zeig = r.slice(0, F.seite * 80);
    zahl.textContent = r.length ? `${n(r.length, 'Stück', 'Stücke')} gefunden` + (zeig.length < r.length ? ` · ${zeig.length} gezeigt` : '') : 'Nichts gefunden. Filter lockern?';
    ul.replaceChildren();
    for(const k of zeig){
      const li = el('li', 'bfeintrag' + (K.gewaehlt() && K.gewaehlt().schluessel === k.schluessel ? ' an' : ''));
      const w = knopf('bfwahl', null, () => K.waehle(k, {vonAnsicht: true}));
      w.append(bildEl(K, titelBild(k), 240, 'mini'));
      const t = el('span', 'rtext'); const e = wegZu(k);
      t.append(el('span', 'rname', k.name), el('small', '', (k.art === 'fassung' ? '' : ARTWORT[k.art] + ' · ') + (e[e.length - 2]?.name || '') + ' · ' + (k.von != null ? tagWort(k.von) : 'Zeit nicht belegt')));
      w.append(t); w.style.setProperty('--ort', farbe(k).f);
      const auf = knopf('bfauf', liegt(k) ? '✓' : '+', () => { liegt(k) ? weg(k) : lege(k); liste(); }, liegt(k) ? 'Vom Tisch nehmen: ' + k.name : 'Auf den Tisch: ' + k.name);
      li.append(w, auf); ul.append(li);
    }
    if(zeig.length < r.length){ const mehr = knopf('knopf', `Weitere ${Math.min(80, r.length - zeig.length)} zeigen`, () => { F.seite++; liste(); }); const li = el('li'); li.append(mehr); ul.append(li); }
  }

  // ---------- Tisch und Mappen ----------
  let T = lies(TISCH, []).filter(a => nachAdresse.has(a));
  let mappe = null;   // Name der zuletzt geladenen oder gespeicherten Mappe
  let gespeichertAls = null;   // Inhalt der Mappe beim Speichern, um Änderungen zu erkennen
  const liegt = k => T.includes(adresse(k));
  const merkeTisch = () => schreib(TISCH, T);
  function lege(k){ const a = adresse(k); if(T.includes(a)) return; T.push(a); merkeTisch(); zeichneTisch(); }
  function weg(k){ T = T.filter(a => a !== adresse(k)); merkeTisch(); zeichneTisch(); }
  // Die Hülle legt über „Auf den Tisch“ ebenfalls in den Speicher: beim Anzeigen neu lesen
  addEventListener('storage', e => { if(e.key === TISCH){ T = lies(TISCH, []).filter(a => nachAdresse.has(a)); zeichneTisch(); } });

  const tkopf = el('div', 'btkopf'), staende = el('div', 'bstuecke'), mappenEl = el('aside', 'bmappen');
  tisch.append(tkopf, staende, mappenEl);
  const textCache = new Map();
  async function auszug(k){
    if(k.art !== 'fassung' && k.art !== 'gespraech') return null;
    if(textCache.has(k.schluessel)) return textCache.get(k.schluessel);
    const p = lesetext(k, K.texte, K.bildUrl).then(h => { const d = new DOMParser().parseFromString(h || '', 'text/html').body; d.querySelectorAll('details, img').forEach(x => x.remove()); return d.textContent.replace(/\s+\n/g, '\n').trim(); }).catch(() => null);
    textCache.set(k.schluessel, p); return p;
  }
  function zeichneTisch(){
    T = T.filter(a => nachAdresse.has(a));
    const stuecke = T.map(a => nachAdresse.get(a));
    const geaendert = mappe && JSON.stringify(gespeichertAls) !== JSON.stringify(T);
    tkopf.replaceChildren();
    const titel = el('h2', '', 'Tisch'); tkopf.append(titel);
    const stand = el('p', 'bstand klein');
    stand.textContent = !speicherOk ? 'Dieser Browser erlaubt kein Speichern: der Tisch geht beim Schließen verloren.'
      : stuecke.length ? `${n(stuecke.length, 'Stück', 'Stücke')} · der Tisch bleibt in diesem Browser liegen` + (mappe ? (geaendert ? ` · Mappe „${mappe}“: Änderungen nicht gespeichert` : ` · gespeichert als Mappe „${mappe}“`) : ' · noch in keiner Mappe gespeichert') : 'Leer. Links etwas finden und mit + auf den Tisch legen, oder in jeder Ansicht „Auf den Tisch“.';
    tkopf.append(stand);
    const tun = el('div', 'tun');
    if(K.gewaehlt() && K.gewaehlt().art !== 'wurzel' && !liegt(K.gewaehlt())) tun.append(knopf('knopf', '+ ' + K.gewaehlt().name.slice(0, 40), () => lege(K.gewaehlt())));
    if(stuecke.length){ tun.append(knopf('knopf haupt', mappe && geaendert ? `Mappe „${mappe}“ speichern` : 'Als Mappe speichern', () => speichere(mappe && geaendert ? mappe : null)));
      tun.append(knopf('knopf', 'Tisch abräumen', () => { if(confirm('Alle Stücke vom Tisch nehmen? Gespeicherte Mappen bleiben.')){ T = []; mappe = null; merkeTisch(); zeichneTisch(); liste(); } })); }
    tkopf.append(tun);

    staende.replaceChildren(); staende.dataset.zahl = Math.min(4, stuecke.length);
    if(!stuecke.length){ const leer = el('div', 'bleer'); leer.append(el('p', '', 'Der Tisch ist leer.'), el('p', 'klein', 'Lege bis zu vier Stücke nebeneinander, um sie zu vergleichen. Mehr dürfen liegen; dann blätterst du.')); staende.append(leer); }
    for(const k of stuecke){
      const s = el('article', 'bstueck'); s.style.setProperty('--ort', farbe(k).f); s.style.setProperty('--ort-d', farbe(k).d);
      const kp = el('header'); kp.append(el('p', 'artwort', ARTWORT[k.art] + ' · ' + wegZu(k).slice(1, -1).map(x => x.name).join(' › ')));
      const h = knopf('bsname', k.name, () => K.waehle(k, {vonAnsicht: true})); kp.append(h);
      kp.append(el('p', 'klein', (k.kinder ? mengenWort(k) + ' · ' + zeitWort(k) : (k.von != null ? tagWort(k.von) : 'Zeit nicht belegt') + (k.stimme ? ' · ' + k.stimme : ''))));
      s.append(kp);
      const bilder = k.kinder ? fassungenUnter(k).flatMap(f => f.bilder).slice(0, 6) : (k.bilder || []).slice(0, 6);
      if(bilder.length){ const g = el('div', 'bsbilder'); bilder.forEach((b, i) => g.append(bildEl(K, b, i ? 240 : 960, 'bild'))); s.append(g); }
      else s.append(bildEl(K, null, 240, 'bild bsohne'));
      if(k.kinder){ const l = el('ol', 'bsfolge'); for(const f of fassungenUnter(k).slice(0, 12)){ const li = el('li'); li.append(knopf('', f.name + (f.von != null ? ' · ' + tagWort(f.von) : ' · Zeit nicht belegt'), () => K.oeffne(f))); l.append(li); }
        const z = fassungenUnter(k).length; if(z > 12) l.append(el('li', 'klein', `und ${z - 12} weitere`)); s.append(l); }
      else { const t = el('div', 'bstext', 'Wortlaut wird geladen …'); s.append(t); auszug(k).then(x => { t.textContent = x == null ? 'Kein Wortlaut.' : x ? x.slice(0, 1400) + (x.length > 1400 ? ' …' : '') : 'Kein Wortlaut.'; }); }
      const bz = K.bezug.von(k).filter(r => r.belegt); if(bz.length) s.append(el('p', 'klein', `${n(bz.length, 'belegte Beziehung', 'belegte Beziehungen')}`));
      const tun2 = el('div', 'tun');
      if(!k.kinder) tun2.append(knopf('knopf haupt', 'Lesen', () => K.oeffne(k)));
      tun2.append(knopf('knopf', 'Im Baum', () => K.wechsle('baum', k)), knopf('knopf', 'Vom Tisch', () => { weg(k); liste(); }, 'Vom Tisch nehmen: ' + k.name));
      s.append(tun2); staende.append(s);
    }
    zeichneMappen();
  }
  function speichere(name){
    if(!name){ name = prompt('Name der Mappe:', mappe || ''); if(!name || !name.trim()) return; name = name.trim(); }
    const M = lies(MAPPEN, {});
    if(M[name] && name !== mappe && !confirm(`Eine Mappe „${name}“ gibt es schon. Ersetzen?`)) return;
    M[name] = {stuecke: T.slice(), zeit: Date.now()};
    if(!schreib(MAPPEN, M)){ K.sage('Die Mappe konnte in diesem Browser nicht gespeichert werden.'); return; }
    mappe = name; gespeichertAls = T.slice(); K.sage(`Mappe „${name}“ gespeichert (in diesem Browser).`); zeichneTisch();
  }
  function zeichneMappen(){
    const M = lies(MAPPEN, {}); mappenEl.replaceChildren(el('h3', '', 'Mappen'));
    const namen = Object.keys(M).sort((a, b) => M[b].zeit - M[a].zeit);
    if(!namen.length) mappenEl.append(el('p', 'klein', 'Noch keine. „Als Mappe speichern“ hält den Tisch unter einem Namen fest.'));
    const ul2 = el('ul', 'liste');
    for(const nm of namen){ const m = M[nm], fehlen = m.stuecke.filter(a => !nachAdresse.has(a)).length;
      const li = el('li', 'bmappe' + (nm === mappe ? ' an' : ''));
      const b = knopf('zeile', null, () => { T = m.stuecke.filter(a => nachAdresse.has(a)); mappe = nm; gespeichertAls = T.slice(); merkeTisch(); zeichneTisch(); liste(); K.sage(`Mappe „${nm}“ liegt auf dem Tisch.`); });
      const t = el('span', 'rtext'); t.append(el('span', 'rname', nm), el('small', '', n(m.stuecke.length, 'Stück', 'Stücke') + ' · ' + new Date(m.zeit).toLocaleString('de-DE', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) + (fehlen ? ` · ${fehlen} nicht mehr im Bestand` : '')));
      b.append(t); li.append(b, knopf('bfauf', '×', () => { if(confirm(`Mappe „${nm}“ löschen? Das lässt sich nicht rückgängig machen.`)){ const M2 = lies(MAPPEN, {}); delete M2[nm]; schreib(MAPPEN, M2); if(mappe === nm) mappe = null; zeichneTisch(); } }, 'Mappe löschen: ' + nm));
      ul2.append(li); }
    mappenEl.append(ul2);
    // Sichern als Datei: für einen anderen Browser oder als Beleg
    if(namen.length){ const a = knopf('knopf', 'Mappen als Datei sichern', () => { const blob = new Blob([JSON.stringify({art: 'Werkansichten-Mappen', stand: new Date().toISOString(), mappen: M}, null, 2)], {type: 'application/json'});
        const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = 'Mappen.json'; l.click(); setTimeout(() => URL.revokeObjectURL(l.href), 2000); }); mappenEl.append(a); }
    const ein = el('label', 'knopf bdatei'); ein.textContent = 'Mappen aus Datei holen'; const f = el('input'); f.type = 'file'; f.accept = 'application/json'; f.hidden = true;
    f.onchange = async () => { try { const d = JSON.parse(await f.files[0].text()); const M2 = lies(MAPPEN, {}); let z = 0; for(const [nm, m] of Object.entries(d.mappen || {})) if(Array.isArray(m.stuecke)){ M2[M2[nm] ? nm + ' (geholt)' : nm] = {stuecke: m.stuecke.filter(x => typeof x === 'string'), zeit: Number(m.zeit) || Date.now()}; z++; }
      schreib(MAPPEN, M2); K.sage(`${n(z, 'Mappe', 'Mappen')} geholt.`); zeichneMappen(); } catch(e){ K.sage('Diese Datei enthält keine lesbaren Mappen.'); } };
    ein.append(f); mappenEl.append(ein);
  }

  liste(); zeichneTisch();
  return {
    zeige(){ T = lies(TISCH, []).filter(a => nachAdresse.has(a)); liste(); zeichneTisch(); },
    suche(s){ if(s.q && !F.q){ q.value = s.q; F.q = s.q; F.seite = 1; liste(); } },
    ende(){ raum.remove(); }
  };
}
