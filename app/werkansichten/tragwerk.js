/* Tragwerk — was trägt, was verbindet? Ein Bau im Schnitt, Holz bei Tageslicht.

   Unten, unter dem Gelände, das Fundament: die Apps des Tragwerk System als Blöcke mit Bild.
   Darüber die Geschosse, je ein Ort, in Ralfs Reihenfolge von unten nach oben. Diese Reihenfolge ist
   Gestaltung, kein Rang. Neben dem Erdgeschoss ein Gerüst: was noch zur Prüfung liegt.
   In jedem Geschoss Räume (Apps, Bereiche als Flügel), darin die Werke als Folge echter Bilder.

   Was trägt und verbindet, wird nur gezeigt, wenn es belegt ist:
   - Stützen: dasselbe Werk an mehreren Orten (gleicher Schlüssel, im Fundus „gehört zu“), senkrecht links.
   - Streben: im Fundus gespeicherte Beziehungen, erst nach einer Wahl, mit Art und Zahl.
   Berechnete Nähe gehört nicht hierher.

   Ein gewählter Raum oder ein Werk öffnet sich im Bau: das Geschoss wird höher und zeigt alle
   Fassungen in Zeitfolge, die ohne belegte Zeit am Ende. Große Werke werden stückweise gebaut. */

import {el, knopf, farbe, titelBild, bildEl, fassungenUnter, behaelter, ortVon, tagWort, n, stil, ruhig} from './gemein.js';
import {mengenWort, zeitWort} from './inhalt.js';
import {BELEGT} from './bezug.js';

export const legende = `<p><b>Ein Bau im Schnitt.</b> Unter dem Gelände das <b>Fundament</b>: die Apps des Tragwerk System.
Darüber die <b>Geschosse</b>, je ein Ort. Die Folge von unten nach oben ist Ralfs Ordnung der Orte
(MiND-BODY-SOUL im Erdgeschoss, PERSONAL zuoberst): Gestaltung, kein Rang und kein Gewicht.
Das <b>Gerüst</b> neben dem Erdgeschoss trägt, was noch zur Prüfung liegt.</p>
<p>In jedem Geschoss stehen <b>Räume</b>: eine App mit ihren Werken als Folge echter Bilder; ein Bereich wie FASKA ist ein
<b>Flügel</b> mit eigenen Räumen. Ein Blatt Papier heißt: ohne Bild. Die Räume stehen in der Folge ihrer frühesten
belegten Zeit; ihre Breite folgt nur der Zahl ihrer Werke.</p>
<p><b>Stützen</b> (links, senkrecht): dasselbe Werk liegt belegt an mehreren Orten. Ein Quadrat an jedem Geschoss, in dem es liegt.</p>
<p><b>Streben</b> (blau) erscheinen erst, wenn du einen Raum oder ein Werk wählst: jede im Fundus gespeicherte Beziehung,
mit Art und Zahl. Berechnete Nähe steht nicht im Geschossplan, sondern im Bezugsnetz.</p>
<p>Ein Tipp öffnet einen Raum oder ein Werk im Bau: alle Fassungen in Zeitfolge, die ohne belegte Zeit am Ende.
Ein zweiter Tipp auf eine gewählte Fassung öffnet sie zum Lesen.</p>`;

const IM_RAUM = 10;      // so viele Werke zeigt ein geschlossener Raum, der Rest ist einen Tipp entfernt
const STUECK = 40;       // so viele Fassungen werden auf einmal gebaut
const GESCHOSS = i => i === 0 ? 'Erdgeschoss' : i + '. Obergeschoss';
const blaetter = k => (k.kinder || []).filter(c => !c.kinder);
const aeste = k => (k.kinder || []).filter(c => c.kinder);
const zeitfolge = (a, b) => (a.von == null) - (b.von == null) || (a.von ?? 0) - (b.von ?? 0) || a.name.localeCompare(b.name, 'de');
const MONAT = {month: 'long', year: 'numeric', timeZone: 'UTC'};
const monat = t => new Date(t).toLocaleDateString('de-DE', MONAT);

export function starte(flaeche, K){
  stil('tragwerk');
  const I = K.inhalt, wurzel = I.wurzel;
  const orte = wurzel.kinder.filter(k => k.art === 'ort');
  const fundOrt = orte.find(o => o.name === 'Tragwerk System') || null;
  const anbauOrt = orte.find(o => o.name === 'Zur Prüfung') || null;
  const geschossOrte = orte.filter(o => o !== fundOrt && o !== anbauOrt);   // schon in Ralfs Folge
  const lose = wurzel.kinder.filter(k => k.art !== 'ort');

  const bau = el('div', 'tw-bau'); bau.tabIndex = -1;
  const band = el('div', 'tw-band'); band.setAttribute('aria-label', 'Stützen: dasselbe Werk an mehreren Orten'); band.setAttribute('role', 'group');
  const bandSvg = svg('svg', {class: 'tw-bandsvg', 'aria-hidden': 'true'});
  band.append(bandSvg);
  const streben = svg('svg', {class: 'tw-streben', 'aria-hidden': 'true'});
  const inhalt = el('div', 'tw-inhalt');
  bau.append(band, inhalt, streben); flaeche.append(bau);

  const istUnter = (k, oben) => { for(let q = k; q; q = q.eltern) if(q === oben) return true; return false; };
  /* Suche: Treffer, ihre Wege und alles, was in einem Treffer liegt */
  const treffer = k => { if(K.istTreffer(k)) return true; const t = K.suche && K.suche.treffer; if(!t) return true; for(let q = k.eltern; q; q = q.eltern) if(t.has(q.schluessel)) return true; return false; };
  const elVon = new Map();      // Knoten → sein Element im Bau (Raum, Werk, Block, Kopf)
  const imOffen = new Map();    // Knoten → sein Element im geöffneten Raum (Werkreihe)
  const bereiche = [];          // Geschosse, Fundament, Gerüst: {ort, sek, offen, stufe}
  let gewaehlt = null, offenFuer = null, strebenListe = [], marken = [];

  /* ---------- Stützen: dasselbe Werk an verschiedenen Orten ---------- */
  const STUETZEN = [];
  for(const [, l] of I.nachSchluessel){
    if(l.length < 2 || !['app', 'werk', 'bereich'].includes(l[0].art)) continue;
    const os = [...new Set(l.map(ortVon))]; if(os.length < 2 || os.includes(null)) continue;
    // geerbt: liegt nur deshalb mehrfach, weil schon die App darüber mehrfach liegt
    if(l.every(k => k.eltern && (I.nachSchluessel.get(k.eltern.schluessel) || []).length > 1)) continue;
    STUETZEN.push({k: l[0], alle: l, orte: os});
  }
  const stuetzeVon = new Map(); for(const s of STUETZEN) for(const k of s.alle) stuetzeVon.set(k, s);

  /* „auch in …“: woanders liegt dasselbe Werk; Stütze, wenn ein anderes Geschoss */
  function auchIn(k){
    const l = (I.nachSchluessel.get(k.schluessel) || []).filter(q => q !== k); if(!l.length) return null;
    if(k.eltern && (I.nachSchluessel.get(k.eltern.schluessel) || []).length > 1 && !stuetzeVon.has(k)) return null;
    const hier = ortVon(k), wo = [...new Set(l.map(q => ortVon(q) === hier ? q.eltern.name : (ortVon(q) || q.eltern).name))];
    const p = el('p', stuetzeVon.has(k) ? 'tw-auch tw-stuetzt' : 'tw-auch');
    p.append(el('span', 'tw-auchwort', stuetzeVon.has(k) ? 'Stütze · auch in ' : 'auch in '), el('span', '', wo.join(', ')));
    return p;
  }

  /* ---------- Bild oder ehrliches Papierblatt ---------- */
  function bild(b, breit, klasse){
    if(b) return bildEl(K, b, breit, 'bild ' + klasse);
    const p = el('span', 'tw-papier ' + klasse); p.append(el('span', 'tw-zeilen'), el('span', 'tw-ohne', 'ohne Bild')); return p;
  }
  function tippe(k){ return () => { if(K.gewaehlt() === k && (k.art === 'fassung' || k.art === 'gespraech')) K.oeffne(k); else K.waehle(k, {vonAnsicht: true}); }; }

  /* Ein Stück der Werkfolge: Werk, Fassung oder Gespräch */
  function stueck(k, gross, karte = elVon){
    const b = knopf('tw-stueck' + (gross ? ' gross' : ''), null, tippe(k));
    b.append(bild(titelBild(k), gross ? 960 : 240, 'tw-sbild'));
    b.append(el('span', 'tw-sname', k.name));
    const m = k.kinder ? n(k.fassungen, 'Fassung', 'Fassungen') : k.art === 'gespraech' ? 'Gespräch' : (k.von != null ? tagWort(k.von) : 'ohne belegte Zeit');
    b.append(el('span', 'tw-smeta', m));
    const a = auchIn(k); if(a) b.append(a);
    if(!treffer(k)) b.classList.add('matt');
    karte.set(k, b); return b;
  }

  /* ---------- Ein Raum: eine App mit ihren Werken ---------- */
  function raum(k, wort){
    const r = el('div', 'tw-raum'); r.setAttribute('role', 'group'); r.setAttribute('aria-label', (wort || 'Raum') + ' ' + k.name);
    const kopf = knopf('tw-raumname', null, tippe(k));
    kopf.append(el('span', 'tw-rart', wort || 'App'), el('span', 'tw-rname', k.name));
    r.append(kopf);
    const teile = [...aeste(k), ...blaetter(k)];
    const zeig = teile.length > IM_RAUM ? teile.slice(0, IM_RAUM - 1) : teile;
    const folge = el('div', 'tw-folge' + (teile.length === 1 ? ' eins' : ''));
    if(!teile.length) folge.append(el('p', 'tw-leer', 'Noch keine Fassung'));
    const eins = teile.length === 1 && !!titelBild(teile[0]); if(teile.length === 1 && !eins) folge.classList.remove('eins');
    zeig.forEach(c => folge.append(stueck(c, eins)));
    if(teile.length > zeig.length){
      const rest = teile.length - zeig.length, w = knopf('tw-weiter', null, () => K.waehle(k, {vonAnsicht: true}));
      w.append(el('span', 'tw-wzahl', '+ ' + rest.toLocaleString('de-DE')), el('span', 'tw-wwort', rest === 1 ? 'weiteres im Raum' : 'weitere im Raum'), el('span', 'tw-smeta', 'öffnen'));
      folge.append(w);
    }
    r.append(folge);
    const meta = el('p', 'tw-raummeta', mengenWort(k) + ' · ' + zeitWort(k)); r.append(meta);
    const a = auchIn(k); if(a) r.append(a);
    elVon.set(k, r);
    return r;
  }
  /* Lose Fassungen direkt an einem Ort oder Bereich: ein eigener Raum, ehrlich benannt */
  function loserRaum(beh, l){
    const r = el('div', 'tw-raum tw-loser'); r.setAttribute('role', 'group'); r.setAttribute('aria-label', 'Ohne App, direkt in ' + beh.name);
    r.append(el('p', 'tw-raumname tw-ohneapp', 'Ohne App, direkt in ' + beh.name));
    const eins = l.length === 1 && !!titelBild(l[0]); const folge = el('div', 'tw-folge' + (eins ? ' eins' : '')); l.forEach(c => folge.append(stueck(c, eins))); r.append(folge);
    return r;
  }
  /* Flügel: ein Bereich (oder ein Ort im Ort) mit eigenen Räumen */
  function fluegel(k, wort, mitRaum){
    const f = el('div', 'tw-fluegel'); f.setAttribute('role', 'group'); f.setAttribute('aria-label', wort + ' ' + k.name);
    const kopf = knopf('tw-fluegelname', null, tippe(k));
    kopf.append(el('span', 'tw-rart', wort), el('span', 'tw-flname', k.name), el('span', 'tw-fmenge', mengenWort(k)));
    const reihe = el('div', 'tw-fraeume');
    for(const c of aeste(k)) reihe.append(mitRaum(c));
    if(blaetter(k).length) reihe.append(loserRaum(k, blaetter(k)));
    f.append(kopf, reihe); elVon.set(k, f); return f;
  }

  /* ---------- Ein Geschoss ---------- */
  function kopfVon(o, stufe){
    const h = el('header', 'tw-kopf'), i = el('div', 'tw-kopfinnen'); h.append(i);
    i.append(el('p', 'tw-stufe', stufe));
    const b = knopf('tw-ortname', o.name, tippe(o)); i.append(b);
    i.append(el('p', 'tw-menge', mengenWort(o)), el('p', 'tw-kzeit', zeitWort(o)));
    elVon.set(o, b);
    return h;
  }
  function geschoss(o, i, klasse, stufe){
    const s = el('section', 'tw-geschoss ' + (klasse || '')); s.setAttribute('aria-label', stufe + ': ' + o.name);
    const f = farbe(o); s.style.setProperty('--ort', f.f); s.style.setProperty('--ort-d', f.d); s.style.setProperty('--ort-h', f.h);
    const gang = el('div', 'tw-gang');
    for(const c of aeste(o)) gang.append(c.art === 'app' ? raum(c) : fluegel(c, c.art === 'bereich' ? 'Bereich' : 'Ort', q => q.art === 'app' ? raum(q) : fluegel(q, 'Bereich', raum)));
    if(blaetter(o).length) gang.append(loserRaum(o, blaetter(o)));
    const offen = el('div', 'tw-offen'); offen.hidden = true;
    s.append(kopfVon(o, stufe), gang, offen, el('div', 'tw-decke'));
    bereiche.push({ort: o, sek: s, offen, stufe: i});
    return s;
  }

  /* ---------- Das Fundament: Blöcke mit Bild ---------- */
  function block(k){
    const b = knopf('tw-block', null, tippe(k));
    b.append(bild(titelBild(k), 240, 'tw-bbild'));
    const t = el('span', 'tw-btext'); t.append(el('span', 'tw-bname', k.name), el('span', 'tw-smeta', mengenWort(k)));
    b.append(t); const a = auchIn(k); if(a) t.append(a);
    elVon.set(k, b); return b;
  }
  function fundament(o){
    const s = el('section', 'tw-geschoss tw-fundament'); s.setAttribute('aria-label', 'Fundament: ' + o.name);
    const f = farbe(o); s.style.setProperty('--ort', f.f); s.style.setProperty('--ort-d', f.d); s.style.setProperty('--ort-h', f.h);
    const bl = el('div', 'tw-bloecke');
    for(const c of aeste(o)){
      if(c.art === 'app') bl.append(block(c));
      else { const g = el('div', 'tw-bgruppe'); g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Ort ' + c.name);
        const kb = knopf('tw-fluegelname', null, tippe(c)); kb.append(el('span', 'tw-rart', c.art === 'bereich' ? 'Bereich' : 'Ort im Fundament'), el('span', 'tw-flname', c.name));
        elVon.set(c, g); g.append(kb); const innen = el('div', 'tw-binnen'); for(const q of aeste(c)) innen.append(block(q)); for(const q of blaetter(c)) innen.append(stueck(q)); g.append(innen); bl.append(g); }
    }
    for(const q of blaetter(o)) bl.append(stueck(q));
    const offen = el('div', 'tw-offen'); offen.hidden = true;
    s.append(kopfVon(o, 'Fundament'), bl, offen);
    bereiche.push({ort: o, sek: s, offen, stufe: -1});
    return s;
  }

  /* ---------- Der Bau, von oben nach unten im Dokument ---------- */
  const dach = el('div', 'tw-dach');
  dach.append(el('p', 'tw-dachname', wurzel.name), el('p', 'tw-dachmenge', mengenWort(wurzel)));
  inhalt.append(dach);
  const geschossEl = geschossOrte.map((o, i) => geschoss(o, i, '', GESCHOSS(i)));
  for(let i = geschossEl.length - 1; i >= 1; i--) inhalt.append(geschossEl[i]);
  const erde = el('div', 'tw-erdreihe');
  if(geschossEl[0]) erde.append(geschossEl[0]);
  if(anbauOrt){ const g = geschoss(anbauOrt, 0, 'tw-anbau', 'Gerüst, noch ohne festen Ort'); erde.append(g); }
  inhalt.append(erde);
  const gelaende = el('div', 'tw-gelaende'); gelaende.append(el('span', '', 'Gelände'));
  inhalt.append(gelaende);
  if(fundOrt) inhalt.append(fundament(fundOrt));
  if(lose.length){ const l = el('section', 'tw-geschoss tw-lose'); l.append(el('p', 'tw-stufe', 'Lose im Bestand, an keinem Ort'));
    const g = el('div', 'tw-gang'); g.append(loserRaum(wurzel, lose)); l.append(g); inhalt.append(l); }

  const bereichVon = k => { const o = k.art === 'ort' && k.eltern === wurzel ? k : ortVon(k); return bereiche.find(b => b.ort === o) || null; };

  /* ---------- Stützen zeichnen: senkrecht im Band links, Decken als Balken ---------- */
  const SP = 15;   // Abstand der Stützen
  const reihen = STUETZEN.map(s => ({s, ys: []}));
  function zeichneBand(){
    const schmal = K.schmal(); bau.classList.toggle('schmal', schmal);
    const W = STUETZEN.length ? STUETZEN.length * SP + 20 : 0;
    bau.style.setProperty('--band', (schmal ? 0 : W) + 'px');
    for(const j of band.querySelectorAll('.tw-gelenk, .tw-slabel')) j.remove();
    bandSvg.replaceChildren();
    if(schmal || !W) return;
    const H = inhalt.offsetHeight; bandSvg.setAttribute('width', W); bandSvg.setAttribute('height', H); band.style.height = H + 'px';
    // Decken: an der Unterkante jedes Geschosses ein Balken quer durch das Band
    const oben = inhalt.getBoundingClientRect().top, topVon = e => e.getBoundingClientRect().top - oben;
    band.style.top = inhalt.offsetTop + 'px';
    for(const b of bereiche){ if(b.sek.classList.contains('tw-anbau') || b.stufe < 0) continue;
      const y = topVon(b.sek) + b.sek.offsetHeight - 10;
      bandSvg.append(svg('rect', {x: 0, y, width: W, height: 10, class: 'tw-bbalken'})); }
    const yVon = b => topVon(b.sek) + (b.stufe < 0 ? 64 : 40);
    reihen.forEach((r, i) => {
      const x = 12 + i * SP, an = gewaehlt && r.s.alle.some(k => istUnter(gewaehlt, k));
      const punkte = r.s.alle.map(k => ({k, b: bereichVon(k)})).filter(p => p.b).map(p => ({...p, y: yVon(p.b)}));
      if(!punkte.length) return;
      const y0 = Math.min(...punkte.map(p => p.y)), y1 = Math.max(...punkte.map(p => p.y));
      bandSvg.append(svg('rect', {x: x - 2, y: y0, width: 4, height: y1 - y0, rx: 1.5, class: 'tw-stuetze' + (an ? ' an' : '') + (r.s.alle.some(treffer) ? '' : ' matt')}));
      for(const p of punkte){
        const g = knopf('tw-gelenk' + (an ? ' an' : '') + (gewaehlt === p.k ? ' hier' : ''), null, tippe(p.k), r.s.k.name + ' im Ort ' + ortVon(p.k).name);
        g.style.left = x + 'px'; g.style.top = p.y + 'px'; band.append(g);
      }
      // Name an jedem Gelenk, nach oben lesbar, so weit Platz bis zum Geschoss darüber
      const ys = punkte.map(p => p.y).sort((a, b) => a - b);
      ys.forEach((y, j) => {
        const lab = el('span', 'tw-slabel' + (an ? ' an' : '') + (r.s.alle.some(treffer) ? '' : ' matt'), r.s.k.name);
        lab.setAttribute('aria-hidden', 'true');
        lab.style.left = x + 'px'; lab.style.top = (y - 13) + 'px'; lab.style.maxHeight = Math.max(80, Math.min(300, j ? y - ys[j - 1] - 30 : y - 20)) + 'px';
        band.append(lab);
      });
    });
  }
  // Stützen ordnen: die längsten außen, dann von unten nach oben
  const stufeVon = k => { const b = bereichVon(k); return b ? b.stufe : 99; };
  reihen.forEach(r => { r.lo = Math.min(...r.s.alle.map(stufeVon)); r.hi = Math.max(...r.s.alle.map(stufeVon)); });
  reihen.sort((a, b) => (b.hi - b.lo) - (a.hi - a.lo) || a.lo - b.lo || a.s.k.name.localeCompare(b.s.k.name, 'de'));


  /* ---------- Der geöffnete Raum: alle Fassungen in Zeitfolge ---------- */
  let zeitLeiste = null, zeitBeobachter = null;
  function oeffneIm(b, beh){
    for(const x of bereiche) if(x !== b && !x.offen.hidden){ x.offen.hidden = true; x.offen.replaceChildren(); x.sek.classList.remove('auf'); }
    if(zeitBeobachter){ zeitBeobachter.disconnect(); zeitBeobachter = null; }
    if(!b){ offenFuer = null; zeitLeiste = null; imOffen.clear(); return; }
    offenFuer = beh; b.sek.classList.add('auf');
    const o = b.offen; o.replaceChildren(); o.hidden = false;
    const f = farbe(beh); o.style.setProperty('--ort', f.f); o.style.setProperty('--ort-d', f.d);
    // links: was es ist und was es trägt
    const seite = el('div', 'tw-oseite');
    const weg = el('p', 'tw-oweg');
    const kette = []; for(let q = beh.eltern; q && q.art !== 'wurzel'; q = q.eltern) kette.unshift(q);
    weg.append(el('span', 'tw-owegstufe', b.stufe < 0 ? 'Fundament' : b.sek.classList.contains('tw-anbau') ? 'Gerüst' : GESCHOSS(b.stufe)), el('span', 'tw-owegtrenn', ' · '));
    kette.forEach((q, i) => { if(i) weg.append(el('span', 'tw-owegtrenn', ' › ')); weg.append(knopf('tw-owegteil', q.name, tippe(q))); });
    const h = el('h3', 'tw-otitel', beh.name);
    seite.append(weg, h, el('p', 'tw-omenge', mengenWort(beh) + ' · ' + zeitWort(beh)));
    const a = auchIn(beh); if(a) seite.append(a);
    const fuss = el('div', 'tw-ofuss');
    fuss.append(strebenTafel(beh));
    fuss.append(knopf('tw-zu', 'Raum schließen', () => K.waehle(beh.eltern && beh.eltern.art !== 'wurzel' ? beh.eltern : wurzel, {vonAnsicht: true})));
    const haupt = el('div', 'tw-ohaupt');
    // Werke in diesem Raum
    // ein Werk zeigt seine Nachbarn in derselben App: dorthin führen die meisten Streben
    imOffen.clear();
    const app = beh.art === 'werk' && beh.eltern && beh.eltern.art === 'app' ? beh.eltern : null;
    const ws = aeste(app || beh);
    if(ws.length){ const kopf = el('p', 'tw-ozeile', (app ? 'Werke in ' + app.name : 'Werke in diesem Raum') + ' · ' + ws.length.toLocaleString('de-DE'));
      const reihe = el('div', 'tw-werkreihe'); ws.forEach(w => { const s = stueck(w, false, imOffen); s.classList.add('klein'); reihe.append(s); });
      haupt.append(kopf, reihe); }
    // Fassungen in Zeitfolge, stückweise gebaut
    const alle = fassungenUnter(beh).slice().sort(zeitfolge);
    const mit = alle.filter(x => x.von != null).length;
    const zk = el('p', 'tw-ozeile'); zk.append(el('span', '', 'Fassungen in Zeitfolge · ' + alle.length.toLocaleString('de-DE')),
      el('span', 'tw-ozahl', mit === alle.length ? 'alle mit belegter Zeit' : mit ? `${mit.toLocaleString('de-DE')} mit belegter Zeit, ${(alle.length - mit).toLocaleString('de-DE')} ohne, am Ende` : 'keine mit belegter Zeit'));
    const leiste = el('div', 'tw-zeit'); leiste.setAttribute('role', 'list');
    haupt.append(zk, leiste);
    o.append(seite, haupt, fuss);
    zeitLeiste = {beh, alle, gebaut: 0, leiste, mehr: null, letzterMonat: undefined, ohneDa: false, el: new Map()};
    baueBis(STUECK);
    if('IntersectionObserver' in window){
      zeitBeobachter = new IntersectionObserver(es => { if(es.some(e => e.isIntersecting)) baueBis(zeitLeiste.gebaut + STUECK); }, {root: leiste, rootMargin: '0px 600px 0px 0px'});
      if(zeitLeiste.mehr) zeitBeobachter.observe(zeitLeiste.mehr);
    }
  }
  function baueBis(bis){
    const z = zeitLeiste; if(!z) return; bis = Math.min(bis, z.alle.length); if(bis <= z.gebaut) return;
    if(z.mehr){ zeitBeobachter?.unobserve(z.mehr); z.mehr.remove(); z.mehr = null; }
    const frag = document.createDocumentFragment();
    for(let i = z.gebaut; i < bis; i++){
      const f = z.alle[i];
      if(f.von == null && !z.ohneDa){ z.ohneDa = true; const t = el('div', 'tw-trenn tw-ohnezeit'); t.setAttribute('role', 'presentation');
        t.append(el('span', '', 'Ohne belegte Zeit'), el('small', '', n(z.alle.length - i, 'Fassung', 'Fassungen'))); frag.append(t); }
      else if(f.von != null){ const m = monat(f.von); if(m !== z.letzterMonat){ z.letzterMonat = m; const t = el('div', 'tw-trenn'); t.setAttribute('role', 'presentation'); t.append(el('span', '', m)); frag.append(t); } }
      const li = el('div', 'tw-fwrap'); li.setAttribute('role', 'listitem');
      const b = knopf('tw-fass', null, tippe(f));
      b.append(el('span', 'tw-fdatum', f.von != null ? tagWort(f.von) : 'Zeit nicht belegt'));
      b.append(bild(f.bild || null, 240, 'tw-fbild'));
      b.append(el('span', 'tw-fname', f.name));
      const m = []; if(f.art === 'gespraech') m.push('Gespräch'); if(f.bilder && f.bilder.length > 1) m.push(n(f.bilder.length, 'Bild', 'Bilder'));
      if(z.beh.art !== 'werk' && f.eltern && f.eltern !== z.beh) m.push('aus ' + f.eltern.name);
      if(m.length) b.append(el('span', 'tw-smeta', m.join(' · ')));
      if(!treffer(f)) b.classList.add('matt');
      if(gewaehlt === f) b.classList.add('an');
      li.append(b); frag.append(li); z.el.set(f, b);
    }
    z.gebaut = bis; z.leiste.append(frag);
    if(z.gebaut < z.alle.length){
      const rest = z.alle.length - z.gebaut;
      z.mehr = knopf('tw-mehr', null, () => { const erst = z.gebaut; baueBis(z.gebaut + STUECK); z.leiste.querySelectorAll('.tw-fass')[erst]?.focus(); });
      z.mehr.append(el('span', 'tw-wzahl', '+ ' + rest.toLocaleString('de-DE')), el('span', 'tw-wwort', 'weitere Fassungen zeigen'));
      z.leiste.append(z.mehr); zeitBeobachter?.observe(z.mehr);
    }
  }

  /* ---------- Streben: belegte Beziehungen, nach Art gezählt ---------- */
  function strebenTafel(beh){
    const l = K.bezug.von(beh).filter(r => r.belegt);
    strebenListe = l;
    const t = el('section', 'tw-strebtafel');
    if(!l.length){ t.append(el('p', 'tw-ozeile', 'Streben'), el('p', 'tw-still', 'Keine im Fundus belegte Beziehung zu anderen Werken.')); return t; }
    t.append(el('p', 'tw-ozeile', 'Streben · ' + n(l.length, 'belegte Beziehung', 'belegte Beziehungen')));
    const nachArt = new Map(); for(const r of l){ const w = BELEGT[r.art] ? (r.aus ? BELEGT[r.art].wort : BELEGT[r.art].rueck) : r.art; if(!nachArt.has(w)) nachArt.set(w, []); nachArt.get(w).push(r); }
    for(const [w, rs] of nachArt){
      const d = el('details', 'tw-strebart'); if(nachArt.size <= 2 || rs.length <= 4) d.open = true;
      const s = el('summary'); s.append(el('span', 'tw-strebwort', w), el('span', 'tw-strebzahl', rs.length.toLocaleString('de-DE'))); d.append(s);
      const ul = el('ul', 'tw-streblist');
      for(const r of rs.slice(0, 60)){ const li = el('li'), b = knopf('tw-strebziel', null, () => K.waehle(r.andere, {vonAnsicht: true}));
        const o = ortVon(r.andere); b.append(el('span', 'tw-szname', r.andere.name), el('span', 'tw-smeta', [r.andere.eltern && r.andere.eltern.art !== 'ort' ? r.andere.eltern.name : '', o ? o.name : ''].filter(Boolean).join(' · ')));
        if(o) b.style.setProperty('--ziel', farbe(o).f);
        li.append(b); ul.append(li); }
      if(rs.length > 60){ const li = el('li'); li.append(knopf('tw-owegteil', 'und ' + (rs.length - 60) + ' weitere im Bezugsnetz', () => K.wechsle('galaxie', beh))); ul.append(li); }
      d.append(ul); t.append(d);
    }
    return t;
  }
  /* Woher die Streben gehen: vom Raum oder Werk im Gang, sonst vom Titel des geöffneten Raums */
  const quelleEl = () => { const e = imOffen.get(offenFuer) || elVon.get(offenFuer); if(e && e.isConnected) return e; const b = bereichVon(offenFuer); return b ? b.offen.querySelector('.tw-otitel') : null; };
  const zielEl = k => { for(let q = k; q; q = q.eltern){ for(const e of [imOffen.get(q), elVon.get(q)]) if(e && e.isConnected && !e.closest('[hidden]')) return e; } return null; };
  function setzeMarken(){
    for(const m of marken) m.remove(); marken = [];
    for(const e of bau.querySelectorAll('.tw-strebt')) e.classList.remove('tw-strebt');
    if(!strebenListe.length || !offenFuer) return;
    const quelle = quelleEl();
    const je = new Map();
    for(const r of strebenListe){ const e = zielEl(r.andere); if(!e || e === quelle || (quelle && (quelle.contains(e) || e.contains(quelle)))) continue;
      if(!je.has(e)) je.set(e, new Map()); const w = BELEGT[r.art] ? (r.aus ? BELEGT[r.art].wort : BELEGT[r.art].rueck) : r.art; je.get(e).set(w, (je.get(e).get(w) || 0) + 1); }
    for(const [e, arten] of je){ e.classList.add('tw-strebt');
      const m = el('span', 'tw-strebmarke', [...arten].map(([w, z]) => z > 1 ? w + ' · ' + z : w).join(', ')); m.setAttribute('aria-hidden', 'true');
      e.append(m); marken.push(m); }
  }
  let strebRaf = 0;
  const strebenBald = () => { if(!strebRaf) strebRaf = requestAnimationFrame(() => { strebRaf = 0; zeichneStreben(); }); };
  function zeichneStreben(){
    streben.replaceChildren();
    const W = bau.scrollWidth, H = inhalt.offsetHeight + inhalt.offsetTop; streben.setAttribute('width', W); streben.setAttribute('height', H);
    if(!strebenListe.length || !offenFuer) return;
    const quelle = quelleEl(); if(!quelle) return;
    const B = bau.getBoundingClientRect();
    const sichtbar = e => { let r = e.getBoundingClientRect(); const gang = e.parentElement && e.parentElement.closest('.tw-gang, .tw-werkreihe, .tw-bloecke');
      let x = r.left + r.width / 2, y = r.top + r.height / 2, drin = true;
      if(gang){ const g = gang.getBoundingClientRect(); if(x < g.left + 8){ x = g.left + 8; drin = false; } if(x > g.right - 8){ x = g.right - 8; drin = false; } }
      return {x: x - B.left + bau.scrollLeft, y: y - B.top + bau.scrollTop, drin}; };
    const q = sichtbar(quelle);
    const gezogen = new Set();
    for(const e of bau.querySelectorAll('.tw-strebt')){ if(gezogen.has(e)) continue; gezogen.add(e);
      const z = sichtbar(e);
      streben.append(svg('line', {x1: q.x, y1: q.y, x2: z.x, y2: z.y, class: 'tw-strebe' + (z.drin ? '' : ' fern')}));
      streben.append(svg('rect', {x: z.x - 4, y: z.y - 4, width: 8, height: 8, class: 'tw-strebfuss' + (z.drin ? '' : ' fern')}));
    }
    streben.append(svg('rect', {x: q.x - 5, y: q.y - 5, width: 10, height: 10, class: 'tw-strebkopf'}));
  }
  bau.addEventListener('scroll', strebenBald, {capture: true, passive: true});

  /* ---------- Markieren und hinscrollen ---------- */
  function markiere(){
    for(const e of bau.querySelectorAll('.tw-an, .tw-pfad')) e.classList.remove('tw-an', 'tw-pfad');
    if(!gewaehlt || gewaehlt === wurzel) return;
    for(const e of [elVon.get(gewaehlt), imOffen.get(gewaehlt)]) if(e) e.classList.add('tw-an');
    for(let q = gewaehlt.eltern; q && q !== wurzel; q = q.eltern) for(const p of [elVon.get(q), imOffen.get(q)]) if(p) p.classList.add('tw-pfad');
    const z = zeitLeiste && zeitLeiste.el.get(gewaehlt); if(z) z.classList.add('tw-an');
  }
  function zeigeEl(e, sofort, wie = 3){
    if(!e) return;
    const verhalten = sofort || K.still || ruhig() ? 'auto' : 'smooth';
    for(const gang of [e.closest('.tw-zeit'), e.closest('.tw-werkreihe'), e.closest('.tw-gang')]){ if(!gang) continue;
      const g = gang.getBoundingClientRect(), r = e.getBoundingClientRect();
      if(r.left < g.left + 8 || r.right > g.right - 8) gang.scrollTo({left: gang.scrollLeft + r.left - g.left - Math.max(16, (g.width - Math.min(r.width, g.width)) / 2), behavior: verhalten}); }
    const B = bau.getBoundingClientRect(), r = e.getBoundingClientRect(), unten = K.rand().unten;
    const frei = B.height - (K.schmal() ? unten : 0);
    if(r.top < B.top + 8 || r.bottom > B.top + frei - 8) bau.scrollTo({top: bau.scrollTop + r.top - B.top - Math.max(12, (frei - Math.min(r.height, frei)) / wie), behavior: verhalten});
  }

  /* Den geöffneten Raum so zeigen, dass darüber noch der Raum im Gang zu sehen ist */
  function zeigeOffen(b, sofort){
    const o = b.offen.getBoundingClientRect(), B = bau.getBoundingClientRect(), frei = B.height - (K.schmal() ? K.rand().unten : 0);
    if(o.top < B.top + 8 || o.top > B.top + frei * .6) bau.scrollTo({top: bau.scrollTop + o.top - B.top - frei * (K.schmal() ? .12 : .3), behavior: sofort || K.still || ruhig() ? 'auto' : 'smooth'});
  }
  function zeige(k, sofort, vonAnsicht){
    gewaehlt = k || wurzel;
    let beh = null;
    if(gewaehlt.art === 'app' || gewaehlt.art === 'werk') beh = gewaehlt;
    else if(gewaehlt.art === 'fassung' || gewaehlt.art === 'gespraech'){
      // liegt die Fassung im schon geöffneten Raum, bleibt er offen; sonst öffnet sich ihr Werk
      if(offenFuer && istUnter(gewaehlt, offenFuer)) beh = offenFuer;
      else { const b = behaelter(gewaehlt); if(b !== gewaehlt && (b.art === 'werk' || b.art === 'app')) beh = b; } }
    const b = beh ? bereichVon(beh) : null;
    if(beh !== offenFuer) oeffneIm(b, beh);
    if(zeitLeiste && (gewaehlt.art === 'fassung' || gewaehlt.art === 'gespraech')){ const i = zeitLeiste.alle.indexOf(gewaehlt); if(i >= zeitLeiste.gebaut) baueBis(i + 8); }
    markiere(); setzeMarken();
    requestAnimationFrame(() => {
      zeichneBand(); zeichneStreben();
      if(gewaehlt === wurzel){ if(!vonAnsicht) { const e = erde; bau.scrollTo({top: Math.max(0, e.offsetTop + e.offsetHeight - bau.clientHeight * .62), behavior: 'auto'}); } return; }
      // erst der Raum (Quelle der Streben) im Gang, dann das Gewählte
      const raumEl = beh ? elVon.get(beh) : null; if(raumEl) zeigeEl(raumEl, true);
      const inReihe = imOffen.get(gewaehlt) || (beh && imOffen.get(beh)); if(inReihe) zeigeEl(inReihe, true);
      if(zeitLeiste && zeitLeiste.el.get(gewaehlt)) zeigeEl(zeitLeiste.el.get(gewaehlt), sofort, 2.4);
      else if(b && !b.offen.hidden && gewaehlt === beh) zeigeOffen(b, sofort);
      else zeigeEl(elVon.get(gewaehlt) || (bereichVon(gewaehlt) || {}).sek, sofort);
      requestAnimationFrame(zeichneStreben);
    });
  }

  function suche(){
    for(const [k, e] of elVon) e.classList.toggle('matt', !treffer(k));
    if(zeitLeiste) for(const [k, e] of zeitLeiste.el) e.classList.toggle('matt', !treffer(k));
    for(const [k, e] of imOffen) e.classList.toggle('matt', !treffer(k));
    zeichneBand();
  }

  const beob = 'ResizeObserver' in window ? new ResizeObserver(() => { zeichneBand(); strebenBald(); }) : null;
  beob?.observe(inhalt); beob?.observe(bau);
  const polster = () => { bau.style.paddingBottom = (K.schmal() ? K.rand().unten : 12) + 'px'; };
  polster();
  if(K.suche && K.suche.q) suche();

  return {
    zeige,
    suche,
    groesse(){ polster(); zeichneBand(); strebenBald(); },
    ende(){ beob?.disconnect(); zeitBeobachter?.disconnect(); cancelAnimationFrame(strebRaf); bau.remove(); }
  };
}

function svg(tag, attr){ const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for(const k in attr || {}) e.setAttribute(k, attr[k]); return e; }
