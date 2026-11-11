/* Garten — Entwicklung, Pflege und Nebeneinander.

   Beete sind Ralfs Orte, in seiner Reihenfolge, getrennt durch Kieswege mit dem Ortsnamen als Wegschild.
   Im Beet steht jede App als eigene Gruppe; Bereiche (FASKA, Rebeca Wild) und Orte im Ort sind Unterbeete.
   Jedes Werk ist eine Pflanze: am Stängel sitzen seine Fassungen in belegter Zeitfolge, unten die früheste,
   oben als Blüte die jüngste. Ihre echten Bilder sind die Blätter, Fassungen ohne Bild sind Papierblätter.
   Was keine belegte Zeit hat, liegt in der Saatschale am Fuß und behauptet keine Reihenfolge.
   Monatsmarken und ihre Jahreszeitfarbe stehen nur an Fassungen mit belegtem Monat.
   Ein Tipp auf eine Pflanze öffnet darunter ihren Entwicklungsstreifen: alle Fassungen in Zeitfolge,
   dazu Wegweiser zu verwandten Werken, belegt getrennt von berechnet.
   Lage, Abstand und der Schwung des Stängels sind Gestaltung, keine Aussage. */

import {el, knopf, farbe, bildEl, titelBild, behaelter, tagWort, monatKurz, n, stil, ruhig} from './gemein.js';
import {mengenWort, zeitWort, wegZu, ARTWORT} from './inhalt.js';
import {BELEGT, BERECHNET} from './bezug.js';

export const legende = `<p><b>Beete</b> sind die Orte, in Ralfs Reihenfolge, getrennt durch Wege mit dem Ortsnamen als Schild. Jede App ist eine Gruppe im Beet; Bereiche wie FASKA sind Unterbeete.</p>
<p>Jede <b>Pflanze</b> ist ein Werk. Am Stängel sitzen seine Fassungen in belegter Zeitfolge: unten die früheste, oben als <b>Blüte</b> die jüngste. Mit Bild als Bild, ohne Bild als Papierblatt.</p>
<p>Die <b>Monatsmarke</b> neben einem Blatt ist belegt. Ihre Farbe nennt nur die Jahreszeit dieses Monats:
<span class="z gjz-winter"></span>Winter <span class="z gjz-fruehling"></span>Frühling <span class="z gjz-sommer"></span>Sommer <span class="z gjz-herbst"></span>Herbst.</p>
<p>In der <b>Saatschale</b> am Fuß liegen Fassungen ohne belegte Zeit. Sie haben keine Reihenfolge und keine Farbe.</p>
<p>Die Höhe folgt nur der Zahl der Fassungen mit belegter Zeit. Ab acht wird der Stängel gefaltet („+ N weitere“); der Streifen zeigt alle.</p>
<p>Ein Tipp auf eine Pflanze öffnet darunter ihren <b>Entwicklungsstreifen</b> mit Wegweisern zu verwandten Werken. Belegt verwandte Pflanzen sind dann blau umrandet; berechnete Nähe steht nur im Streifen. Ein zweiter Tipp auf eine gewählte Fassung öffnet sie zum Lesen.</p>`;

const jahreszeit = t => { const m = new Date(t).getUTCMonth(); return m === 11 || m < 2 ? 'winter' : m < 5 ? 'fruehling' : m < 8 ? 'sommer' : 'herbst'; };
const MONAT = {month: 'long', year: 'numeric', timeZone: 'UTC'};
const monatLang = t => new Date(t).toLocaleDateString('de-DE', MONAT);
const MAXSTUFEN = 8, MAXSAAT = 6;

export function starte(flaeche, K){
  stil('garten');
  const I = K.inhalt;
  const raum = el('div', 'garten'); flaeche.append(raum);

  let M, schmalJetzt, PFL, pflanzeVon, kopfVon, beetVon, planVon, blattEls, karten;
  let offen = null, streifen = null, gew = null, wunsch = null, markiert = [], verwandt = [];
  const verhalten = sofort => sofort || K.still || ruhig() ? 'auto' : 'smooth';

  /* ---------- Aufbau ---------- */
  function baue(){
    schmalJetzt = K.schmal();
    M = schmalJetzt ? {L: 48, B: 76, S: 36, W: 132, base: 10} : {L: 56, B: 88, S: 40, W: 150, base: 12};
    PFL = []; pflanzeVon = new Map(); kopfVon = new Map(); beetVon = new Map(); planVon = new Map(); blattEls = new Map(); karten = new Map();
    offen = null; streifen = null; markiert = []; verwandt = [];
    raum.replaceChildren();
    raum.classList.toggle('schmal', schmalJetzt);
    const plan = el('nav', 'gplan'); plan.setAttribute('aria-label', 'Gartenplan: zu einem Beet gehen');
    const beete = el('div', 'gbeete');
    raum.append(plan, beete);
    for(const o of I.wurzel.kinder) if(o.kinder){ const b = beet(o, true); beete.append(b); planKnopf(plan, o, b); }
    const lose = I.wurzel.kinder.filter(c => !c.kinder);
    if(lose.length){   // Gespräche ohne Ort bleiben erreichbar
      const sek = el('section', 'gbeet'), weg = el('div', 'gweg'), leib = el('div', 'gbeetleib');
      weg.append(el('span', 'gwegschild ohneort', 'Ohne Ort'), el('span', 'gwinfo', n(lose.length, 'Eintrag', 'Einträge') + ' ohne Ort'));
      leib.append(gruppe(I.wurzel, [pflanze(I.wurzel, true, 'Ohne Ort')], 'Noch keinem Ort zugeordnet'));
      sek.append(weg, leib); beete.append(sek); beetVon.set(I.wurzel, sek); planKnopf(plan, {name: 'Ohne Ort', fassungen: lose.length, gespraeche: 0}, sek);
    }
    groesse();
  }
  function setzeFarbe(e, k){ const f = farbe(k); e.style.setProperty('--ort-f', f.f); e.style.setProperty('--ort-d', f.d); e.style.setProperty('--ort-h', f.h); }

  function planKnopf(plan, o, sek){
    const b = knopf('gplanort', null, () => { const pl = raum.querySelector('.gplan'); raum.scrollTo({top: sek.offsetTop - (getComputedStyle(pl).position === 'sticky' ? pl.offsetHeight : 0), behavior: verhalten()}); });
    if(o.art) setzeFarbe(b, o);
    b.append(el('span', 'gpname', o.name), el('span', 'gpzahl', n(o.fassungen + (o.gespraeche || 0), 'Fassung', 'Fassungen')));
    plan.append(b); planVon.set(sek, {b, o});
  }

  /* Ein Beet: Weg mit Schild, darin die Gruppen der Apps und die Unterbeete */
  function beet(o, haupt){
    const sek = el('section', haupt ? 'gbeet' : 'gbeet unter'); setzeFarbe(sek, o);
    const weg = el('div', haupt ? 'gweg' : 'gunterweg');
    const schild = knopf('gwegschild', null, () => K.waehle(o, {vonAnsicht: true}));
    if(!haupt) schild.append(el('span', 'gwart', ARTWORT[o.art]));
    schild.append(el('span', 'gwname', o.name));
    weg.append(schild, el('span', 'gwinfo', mengenWort(o) + ' · ' + zeitWort(o)));
    kopfVon.set(o, schild); beetVon.set(o, sek);
    const leib = el('div', 'gbeetleib');
    fuelle(leib, o);
    sek.append(weg, leib);
    return sek;
  }
  function fuelle(leib, c){
    const eigen = (c.kinder || []).filter(x => !x.kinder);
    if(eigen.length) leib.append(gruppe(c, [pflanze(c, true)], 'Direkt im ' + (c.art === 'bereich' ? 'Bereich' : 'Ort')));
    const werkeOhneApp = (c.kinder || []).filter(x => x.art === 'werk');
    if(werkeOhneApp.length) leib.append(gruppe(c, werkeOhneApp.map(w => pflanze(w, false)), 'Werke direkt im Ort'));
    for(const x of c.kinder || []){
      if(!x.kinder || x.art === 'werk') continue;
      if(x.art === 'app') appGruppen(leib, x); else leib.append(beet(x, false));
    }
  }
  function appGruppen(leib, a){
    const pfl = [];
    if((a.kinder || []).some(x => !x.kinder)) pfl.push(pflanze(a, true));
    for(const w of a.kinder || []) if(w.art === 'werk') pfl.push(pflanze(w, false));
    leib.append(gruppe(a, pfl));
    for(const x of a.kinder || []) if(x.kinder && x.art !== 'werk') appGruppen(leib, x);   // Apps in Apps: daneben, nicht verloren
  }
  function gruppe(k, pfl, titel){
    const g = el('div', 'ggruppe'); setzeFarbe(g, k);
    const kopf = knopf('ggkopf', null, () => K.waehle(k, {vonAnsicht: true}));
    const werke = (k.kinder || []).filter(x => x.art === 'werk').length;
    kopf.append(el('span', 'ggname', titel || k.name),
      el('span', 'gginfo', titel ? n(pfl.reduce((s, p) => s + p.bl.length, 0), 'Fassung', 'Fassungen') : (werke ? n(werke, 'Werk', 'Werke') + ' · ' : '') + n(k.fassungen + k.gespraeche, 'Fassung', 'Fassungen') + ' · ' + zeitWort(k)));
    if(!titel && !kopfVon.has(k)) kopfVon.set(k, kopf);
    const box = el('div', 'gpflanzen');
    for(const p of pfl) box.append(p.el);
    if(!pfl.length) box.append(el('p', 'gleer', 'In dieser App liegt noch nichts.'));
    box.addEventListener('scroll', () => { if(offen && offen.el.parentElement === box) zeiger(); }, {passive: true});
    g.append(kopf, box);
    return g;
  }

  /* Eine Pflanze: Stängel mit datierten Fassungen, Saatschale mit unbelegten, Schild mit Namen und Zeit */
  function pflanze(k, eigen, name){
    const bl = eigen ? (k.kinder || []).filter(c => !c.kinder) : (k.kinder || []).filter(c => !c.kinder);
    const mit = bl.filter(f => f.von != null).sort((a, b) => a.von - b.von);
    const ohne = bl.filter(f => f.von == null);
    const p = {k, eigen, bl, mit, ohne, von: mit.length ? mit[0].von : null, bis: mit.length ? mit[mit.length - 1].von : null};
    const e = el('div', 'pflanze' + (eigen ? ' eigen' : '')); p.el = e; setzeFarbe(e, k);
    const oben = el('div', 'goben');
    if(mit.length) oben.append(trieb(p));
    if(ohne.length) oben.append(schale(p));
    if(!bl.length) oben.append(el('span', 'gleer', 'noch ohne Fassung'));
    const schild = knopf('gschild', null, () => tippPflanze(p));
    const zahl = mit.length && ohne.length ? `${n(bl.length, 'Fassung', 'Fassungen')}, ${ohne.length} ohne Zeit` : n(bl.length, 'Fassung', 'Fassungen');
    schild.append(el('span', 'gsname', name || k.name), el('span', 'gszeit', zeitWort(p)),
      el('span', 'gszahl', eigen && k.art === 'app' ? n(bl.length, 'Fassung', 'Fassungen') + ' an der App' : zahl));
    p.schild = schild;
    e.append(oben, el('div', 'gerde'), schild);
    e.addEventListener('click', ev => { if(!ev.target.closest('button')) tippPflanze(p); });
    pflanzeVon.set(k, p); PFL.push(p);
    return p;
  }

  function trieb(p){
    const {L, B, S, W, base} = M;
    let zeig = p.mit, falte = 0;
    if(p.mit.length > MAXSTUFEN){ zeig = [...p.mit.slice(0, 3), null, ...p.mit.slice(-4)]; falte = p.mit.length - 7; }
    const blatter = zeig.slice(0, -1), bluete = zeig[zeig.length - 1];
    // Lage der Stufen (in Stufen von unten); eine Faltung nimmt zweieinhalb Stufen, damit ihr Knopf frei steht
    const lage = []; let u = 0, letzte = -1;
    for(const f of blatter){
      if(f === null){ lage.push({falte: true, von: letzte}); u += 1.5; continue; }
      lage.push({f, u}); letzte = u; u += 1;
    }
    const yb = letzte >= 0 ? base + letzte * S + L + 10 : base;      // Unterkante der Blüte
    const H = yb + B + 24;
    const t = el('div', 'gtrieb'); t.style.height = H + 'px'; t.style.width = W + 'px';
    // Stängel und Blattstiele als Zeichnung dahinter
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('gstiel');
    const cx = W / 2, oberst = H - (yb + B / 2), len = H - oberst;
    const schwung = Math.min(4, len / 30);   // kurze Stängel stehen gerade
    let d = `M${cx} ${H} C${cx + schwung} ${H - len * .35} ${cx - schwung} ${H - len * .7} ${cx} ${oberst}`;
    let seite = -1;
    for(const s of lage){
      if(s.falte) continue;
      s.seite = seite; seite = -seite;
      const yc = H - (base + s.u * S + L / 2);
      d += ` M${cx} ${yc + 7} Q${cx + s.seite * 5} ${yc + 1} ${cx + s.seite * 9} ${yc - 1}`;
    }
    const pfad = document.createElementNS(NS, 'path'); pfad.setAttribute('d', d); svg.append(pfad);
    t.append(svg);
    for(const s of lage){
      if(s.falte){
        const y0 = base + s.von * S + L, y1 = base + (s.von + 2.5) * S;
        const b = knopf('gfalte', '+ ' + falte + ' weitere', () => tippPflanze(p, true));
        b.tabIndex = -1; b.style.bottom = ((y0 + y1) / 2 - 20) + 'px';
        t.append(b); continue;
      }
      const b = blattKnopf(s.f, p, 'gblatt ' + (s.seite < 0 ? 'links' : 'rechts'));
      b.style.bottom = (base + s.u * S) + 'px';
      if(s.seite < 0) b.style.right = (cx + 8) + 'px'; else b.style.left = (cx + 8) + 'px';
      const mo = el('span', 'gmonat gjz-' + jahreszeit(s.f.von), monatKurz(s.f.von)); mo.setAttribute('aria-hidden', 'true');
      mo.style.bottom = (base + s.u * S + L / 2 - 8) + 'px';
      if(s.seite < 0) mo.style.left = (cx + 9) + 'px'; else mo.style.right = (cx + 9) + 'px';
      t.append(b, mo);
    }
    const bb = blattKnopf(bluete, p, 'gbluete');
    bb.style.bottom = yb + 'px'; bb.style.left = (cx - B / 2) + 'px';
    const mo = el('span', 'gmonat oben gjz-' + jahreszeit(bluete.von), monatKurz(bluete.von)); mo.setAttribute('aria-hidden', 'true');
    mo.style.bottom = (yb + B + 4) + 'px';
    t.append(bb, mo);
    return t;
  }

  function schale(p){
    const s = el('div', 'gschale' + (p.ohne.length <= 2 ? ' wenig' : ''));
    const saat = el('div', 'gsaaten');
    const reihe = [...p.ohne].sort((a, b) => !!b.bild - !!a.bild);   // mit Bild zuerst: man erkennt sie wieder
    const zeig = reihe.length > MAXSAAT ? reihe.slice(0, MAXSAAT - 1) : reihe;
    for(const f of zeig) saat.append(blattKnopf(f, p, 'gsaat'));
    if(reihe.length > zeig.length){ const m = knopf('gsaatmehr', '+ ' + (reihe.length - zeig.length), () => tippPflanze(p, true), `Alle ${reihe.length} Fassungen ohne belegte Zeit zeigen`); m.tabIndex = -1; saat.append(m); }
    s.append(saat, el('span', 'gschalewort', p.ohne.length === 1 ? 'Zeit nicht belegt' : p.ohne.length + ' ohne belegte Zeit'));
    return s;
  }

  function papierEl(f, klasse = 'gpapier'){
    const s = el('span', klasse + (f.art === 'gespraech' ? ' gespraech' : '')); s.setAttribute('aria-hidden', 'true');
    s.append(el('span', 'gpzeilen'));
    return s;
  }
  function beschreibung(f){
    return f.name + ' · ' + (f.von != null ? tagWort(f.von) : 'Zeit nicht belegt') + (f.art === 'gespraech' ? ' · Gespräch' : f.bild ? '' : ' · ohne Bild');
  }
  function blattKnopf(f, p, klasse){
    const b = knopf(klasse, null, () => tippBlatt(f, p), beschreibung(f));
    b.tabIndex = -1; b.title = beschreibung(f);
    b.append(f.bild ? bildEl(K, f.bild, 240, 'gbild') : papierEl(f));
    if(!blattEls.has(f)) blattEls.set(f, []); blattEls.get(f).push(b);
    return b;
  }

  /* ---------- Der Entwicklungsstreifen ---------- */
  function baueStreifen(p){
    karten = new Map();
    const k = p.k, s = el('div', 'gstreifen'); setzeFarbe(s, k);
    s.setAttribute('role', 'region'); s.setAttribute('aria-label', 'Entwicklung von ' + k.name);
    const kopf = el('div', 'gstkopf'), titel = el('div', 'gsttitel');
    const weg = wegZu(k).slice(1, -1).map(x => x.name).join(' › ');
    const wort = !p.eigen ? weg : k.art === 'wurzel' ? 'Noch keinem Ort zugeordnet' : (k.art === 'app' ? 'Fassungen direkt an der App' : 'Fassungen direkt im ' + ARTWORT[k.art]) + (weg ? ' · ' + weg : '');
    titel.append(el('p', 'gstweg', wort), el('h3', '', k.name),
      el('p', 'gstmenge', [n(p.bl.length, 'Fassung', 'Fassungen'), p.mit.length ? p.mit.length + ' mit belegter Zeit, ' + zeitWort(p) : 'keine mit belegter Zeit', p.ohne.length ? p.ohne.length + ' ohne belegte Zeit' : ''].filter(Boolean).join(' · ')));
    const zu = knopf('knopf gzu', 'Zuklappen', () => { const q = offen; schliesse(); q?.schild.focus(); });
    kopf.append(titel, zu); s.append(kopf);
    // dasselbe Werk an anderen Orten
    const gleiche = (I.nachSchluessel.get(k.schluessel) || []).filter(q => q !== k);
    if(gleiche.length){ const a = el('div', 'gstauch'); a.append(el('span', 'gstklein', 'Dasselbe Werk steht auch in'));
      for(const q of gleiche){ const b = knopf('gwegweiser', null, () => K.waehle(q)); setzeFarbe(b, q); b.append(el('span', 'gwwname', wegZu(q).slice(1, -1).map(x => x.name).join(' › ')), el('span', 'gwwpfeil', '→')); a.append(b); }
      s.append(a); }
    // in belegter Zeit: eine Folge mit Monatsgrenzen
    if(p.mit.length){
      s.append(el('h4', 'gsth', 'Entwicklung in belegter Zeit · früheste links'));
      const ol = el('ol', 'gfolge'); let monat = '';
      for(const f of p.mit){
        const m = monatLang(f.von);
        if(m !== monat){ monat = m; const li = el('li', 'gtrenner gjz-' + jahreszeit(f.von)); li.append(el('span', '', m)); li.setAttribute('aria-hidden', 'true'); ol.append(li); }
        ol.append(karte(f, p));
      }
      s.append(rolle(ol));
    }
    if(p.ohne.length){
      s.append(el('h4', 'gsth', 'Ohne belegte Zeit · keine Reihenfolge behauptet'));
      const ol = el('ol', 'gohne' + (p.ohne.length > 10 ? ' zweireihig' : ''));
      for(const f of [...p.ohne].sort((a, b) => !!b.bild - !!a.bild || a.name.localeCompare(b.name, 'de'))) ol.append(karte(f, p));
      s.append(rolle(ol));
    }
    s.append(wegweiser(p));
    return s;
  }
  /* Ein waagrecht rollendes Band mit Knöpfen zum Weiterrollen (Maus ohne Rad, Tastatur) */
  function rolle(ol){
    const w = el('div', 'grolle'), zur = knopf('grknopf zurueck', '‹', () => ol.scrollBy({left: -ol.clientWidth * .8, behavior: verhalten()}), 'Früher'),
      vor = knopf('grknopf vor', '›', () => ol.scrollBy({left: ol.clientWidth * .8, behavior: verhalten()}), 'Weiter');
    const stand = () => { zur.hidden = ol.scrollLeft < 4; vor.hidden = ol.scrollLeft + ol.clientWidth >= ol.scrollWidth - 4; };
    ol.addEventListener('scroll', stand, {passive: true}); requestAnimationFrame(stand); w._stand = stand;
    w.append(ol, zur, vor); return w;
  }
  function karte(f, p){
    const li = el('li'), b = knopf('gkarte' + (f.von == null ? ' ohnezeit' : ' gjz-' + jahreszeit(f.von)), null, () => tippBlatt(f, p));
    b.append(f.bild ? bildEl(K, f.bild, 240, 'gkbild') : papierEl(f, 'gpapier gkbild gkpapier'));
    b.append(el('span', 'gkdatum', f.von != null ? tagWort(f.von) : 'Zeit nicht belegt'), el('span', 'gkname', f.name));
    const dazu = []; if(f.art === 'gespraech') dazu.push('Gespräch'); else if(!f.bild) dazu.push('ohne Bild'); else if(f.bilder.length > 1) dazu.push(n(f.bilder.length, 'Bild', 'Bilder'));
    if(dazu.length) b.append(el('span', 'gkmehr', dazu.join(' · ')));
    li.append(b); karten.set(f, b);
    if(K.suche.treffer && !K.istTreffer(f)) b.classList.add('gedaempft');
    return li;
  }

  /* Verwandte Werke: auf ihre Pflanze gehoben, belegt getrennt von berechnet */
  function verwandteVon(p){
    const eigene = new Set(p.bl);
    const rs = p.eigen ? p.bl.flatMap(f => K.bezug.von(f)) : K.bezug.von(p.k);
    const ziele = new Map();
    for(const r of rs){
      const z = behaelter(r.andere), ziel = z.art === 'werk' ? z : r.andere;
      if(z === p.k || eigene.has(r.andere)) continue;
      const key = (r.belegt ? 'b' : 'r') + ziel.nr;
      if(!ziele.has(key)) ziele.set(key, {ziel, belegt: r.belegt, arten: new Set(), zahl: 0});
      const e = ziele.get(key); e.zahl++;
      e.arten.add(r.belegt ? (BELEGT[r.art] ? (r.aus ? BELEGT[r.art].wort : BELEGT[r.art].rueck) : r.art) : (BERECHNET[r.art] ? BERECHNET[r.art].wort : r.art));
    }
    return [...ziele.values()].sort((a, b) => b.zahl - a.zahl || a.ziel.name.localeCompare(b.ziel.name, 'de'));
  }
  function wegweiser(p){
    const alle = verwandteVon(p), sek = el('div', 'gwege');
    const belegt = alle.filter(r => r.belegt), berechnet = alle.filter(r => !r.belegt);
    if(!alle.length){ sek.append(el('p', 'gstklein', 'Zu diesem Werk ist im Fundus keine Verbindung zu anderen Werken gespeichert oder berechnet.')); return sek; }
    const liste = (titel, satz, l, max, art) => {
      if(!l.length) return;
      const g = el('div', 'gwgruppe ' + art); g.append(el('h4', 'gsth', titel), el('p', 'gstklein', satz));
      const box = el('div', 'gwliste');
      const zeichne = bis => { box.replaceChildren();
        for(const r of l.slice(0, bis)){
          const b = knopf('gwegweiser ' + art, null, () => K.waehle(r.ziel)); setzeFarbe(b, r.ziel);
          const ort = wegZu(r.ziel)[1], hier = wegZu(p.k)[1], tb = titelBild(r.ziel);
          if(tb) b.append(bildEl(K, tb, 240, 'gbild gwwbild'));
          const txt = el('span', 'gwwtext'); txt.append(el('span', 'gwwart', [...r.arten].join(', ')), el('span', 'gwwname', r.ziel.name));
          b.append(txt);
          if(ort && ort !== r.ziel && ort !== hier) b.append(el('span', 'gwwort', ort.name));
          b.append(el('span', 'gwwpfeil', '→'));
          box.append(b);
        }
        if(l.length > bis) box.append(knopf('knopf gwmehr', 'Alle ' + l.length + ' zeigen', () => zeichne(l.length)));
      };
      zeichne(max); g.append(box); sek.append(g);
    };
    liste('Führt zu · belegt im Fundus', 'Gespeicherte Verbindungen. Ein Tipp führt zur Pflanze.', belegt, 18, 'belegt');
    liste('In der Nähe · berechnet', 'Nur berechnete Nähe (gleiches Gebiet, gleicher Quellbestand), keine gespeicherte Verbindung.', berechnet, 8, 'berechnet');
    return sek;
  }
  function zeigeVerwandte(p){
    for(const e of verwandt) e.classList.remove('verwandt'); verwandt = [];
    if(!p) return;
    for(const r of verwandteVon(p)){ if(!r.belegt) continue;
      const z = r.ziel.kinder ? r.ziel : r.ziel.eltern;
      for(const q of I.nachSchluessel.get(z.schluessel) || [z]){ const pq = pflanzeVon.get(q); if(pq && pq !== p){ pq.el.classList.add('verwandt'); verwandt.push(pq.el); } } }
  }

  /* Der Streifen steht unter der Zeile, in der die Pflanze steht */
  function platziere(){
    if(!streifen || !offen) return;
    streifen.remove();
    const box = offen.el.parentElement, grp = box.parentElement, leib = grp.parentElement;
    const unten = x => x.offsetTop + x.offsetHeight;
    if(K.schmal()) grp.append(streifen);
    else if(grp.offsetWidth >= leib.clientWidth - 30){
      let letzte = offen.el; const u = unten(offen.el);
      for(const c of box.children) if(Math.abs(unten(c) - u) < 3) letzte = c;
      letzte.after(streifen);
    } else {
      let letzte = grp; const u = unten(grp);
      for(const c of leib.children) if(c.classList.contains('ggruppe') && Math.abs(unten(c) - u) < 3) letzte = c;
      letzte.after(streifen);
    }
    zeiger();
    for(const w of streifen.querySelectorAll('.grolle')) w._stand?.();
  }
  function zeiger(){
    if(!streifen || !offen) return;
    const pr = offen.el.getBoundingClientRect(), sr = streifen.getBoundingClientRect();
    streifen.style.setProperty('--zeiger', Math.max(18, Math.min(sr.width - 18, pr.left + pr.width / 2 - sr.left)) + 'px');
  }
  function oeffne(p){
    if(offen === p && streifen && streifen.isConnected) return;
    const vor = p.el.getBoundingClientRect().top;
    schliesse(true);
    offen = p; p.el.classList.add('offen'); p.schild.setAttribute('aria-expanded', 'true');
    streifen = baueStreifen(p); platziere(); zeigeVerwandte(p);
    const nach = p.el.getBoundingClientRect().top;
    if(Math.abs(nach - vor) > 1) raum.scrollTop += nach - vor;   // ein geschlossener Streifen darüber soll nichts verrutschen
  }
  function schliesse(still){
    if(offen){ offen.el.classList.remove('offen'); offen.schild.setAttribute('aria-expanded', 'false'); }
    if(streifen) streifen.remove();
    for(const f of karten.keys()){ const l = blattEls.get(f); if(l) blattEls.set(f, l.filter(e => e.isConnected)); }
    offen = null; streifen = null; karten = new Map();
    if(!still) zeigeVerwandte(null);
  }

  /* ---------- Bedienung ---------- */
  function tippPflanze(p, mehr){
    if(K.gewaehlt() === p.k && offen === p && !mehr){ schliesse(); return; }
    wunsch = p; K.waehle(p.k, {vonAnsicht: true});
    if(mehr && offen === p) requestAnimationFrame(() => hin(streifen, false, false, true));
  }
  function tippBlatt(f, p){
    if(K.gewaehlt() === f) return K.oeffne(f);
    wunsch = p; K.waehle(f, {vonAnsicht: true});
  }

  function markiere(k, p){
    for(const e of markiert) e.classList.remove('gewaehlt'); markiert = [];
    const dazu = e => { if(e){ e.classList.add('gewaehlt'); markiert.push(e); } };
    if(!k.kinder){ for(const e of blattEls.get(k) || []) dazu(e); dazu(karten.get(k)); }
    if(p && p.k === k) dazu(p.el);
    if(k.kinder && !(p && p.k === k)) dazu(kopfVon.get(k));
    // im Gartenplan: das Beet des Gewählten
    const ort = wegZu(k)[1];
    for(const [sek, {b, o}] of planVon) b.classList.toggle('hat', o === ort || (sek === beetVon.get(I.wurzel) && k.eltern === I.wurzel));
  }

  function pflanzeFuer(k){
    if(wunsch && (wunsch.k === k || wunsch.bl.includes(k))){ const p = wunsch; wunsch = null; return p; }
    wunsch = null;
    if(!k.kinder) return pflanzeVon.get(k.eltern) || null;
    if(k.art === 'werk') return pflanzeVon.get(k) || null;
    const q = pflanzeVon.get(k);
    return q && !(k.kinder || []).some(c => c.kinder) ? q : null;   // eine App nur mit eigenen Fassungen ist selbst die Pflanze
  }

  /* Hinrollen: senkrecht im Garten, waagrecht in der Reihe oder im Streifen */
  function klebt(e){
    let h = 0;
    const plan = raum.querySelector('.gplan'); if(plan && getComputedStyle(plan).position === 'sticky') h += plan.offsetHeight;
    const weg = e && e.closest('.gbeet:not(.unter)')?.querySelector('.gweg'); if(weg) h += weg.offsetHeight;
    return h;
  }
  function hin(e, sofort, oben, nahe){
    if(!e || !e.isConnected) return;
    const rr = raum.getBoundingClientRect(), r = e.getBoundingClientRect();
    const deckel = klebt(e) + 10, boden = (K.schmal() ? K.rand().unten : 0) + 10;
    let ziel = raum.scrollTop + r.top - rr.top - deckel;
    if(nahe){
      const sicht = rr.height - deckel - boden;
      if(r.top >= rr.top + deckel && r.bottom <= rr.bottom - boden) ziel = null;
      else if(r.height < sicht && r.top >= rr.top + deckel) ziel = raum.scrollTop + r.bottom - rr.bottom + boden;
    } else if(!oben){
      const sicht = rr.height - deckel - boden;
      if(r.height < sicht * .8) ziel -= Math.min(60, (sicht - r.height) / 3);
    }
    if(ziel != null) raum.scrollTo({top: Math.max(0, ziel), behavior: verhalten(sofort)});
    waagrecht(e, sofort);
  }
  /* Pflanze und Streifen zusammen: passt beides, ganz zeigen; sonst ab dem Schild der Pflanze */
  function zeigePaar(p, sofort){
    const rr = raum.getBoundingClientRect(), a = p.el.getBoundingClientRect(), b = streifen.getBoundingClientRect();
    const deckel = klebt(p.el) + 10, boden = (K.schmal() ? K.rand().unten : 0) + 10, sicht = rr.height - deckel - boden;
    const oben = Math.min(a.top, b.top), unten = Math.max(a.bottom, b.bottom);
    if(oben >= rr.top + deckel && unten <= rr.bottom - boden) return;
    let ziel;
    if(unten - oben <= sicht) ziel = oben < rr.top + deckel ? raum.scrollTop + oben - rr.top - deckel : raum.scrollTop + unten - rr.bottom + boden;
    else ziel = raum.scrollTop + p.schild.getBoundingClientRect().top - rr.top - deckel - 40;
    raum.scrollTo({top: Math.max(0, ziel), behavior: verhalten(sofort)});
  }
  function waagrecht(e, sofort){
    const sc = e && e.closest('.gpflanzen, .gfolge, .gohne'); if(!sc || sc.scrollWidth <= sc.clientWidth + 2) return;
    const r = e.getBoundingClientRect(), sr = sc.getBoundingClientRect();
    if(r.left >= sr.left + 8 && r.right <= sr.right - 8) return;
    sc.scrollTo({left: sc.scrollLeft + r.left - sr.left - (sr.width - r.width) / 2, behavior: verhalten(sofort)});
  }

  /* Wo bin ich im Garten: das Beet unter dem Weg ist im Plan hervorgehoben */
  let rollZeit = 0;
  function amRollen(){
    if(rollZeit) return;
    rollZeit = requestAnimationFrame(() => { rollZeit = 0;
      const rr = raum.getBoundingClientRect(); let jetzt = null;
      for(const sek of planVon.keys()){ if(sek.getBoundingClientRect().top <= rr.top + 140) jetzt = sek; else break; }
      for(const [sek, {b}] of planVon){ const an = sek === jetzt; if(an !== b.classList.contains('hier')){ b.classList.toggle('hier', an);
        if(an){ const pl = b.parentElement; if(pl.scrollWidth > pl.clientWidth){ const br = b.getBoundingClientRect(), plr = pl.getBoundingClientRect(); if(br.left < plr.left || br.right > plr.right) pl.scrollLeft += br.left - plr.left - 24; } } } }
    });
  }
  raum.addEventListener('scroll', amRollen, {passive: true});

  let messZeit = 0, breite = 0;
  const beob = new ResizeObserver(() => {
    cancelAnimationFrame(messZeit);
    messZeit = requestAnimationFrame(() => {
      if(K.schmal() !== schmalJetzt){ baue(); if(gew) zeige(gew, true); return; }
      if(raum.clientWidth !== breite){ breite = raum.clientWidth; platziere(); }
    });
  });

  function groesse(){
    raum.style.setProperty('--unten', ((K.schmal() ? K.rand().unten : 0) + 24) + 'px');
    const plan = raum.querySelector('.gplan'); if(plan) raum.style.setProperty('--plan-h', (getComputedStyle(plan).position === 'sticky' ? plan.offsetHeight : 0) + 'px');
    platziere();
  }

  function zeige(k, sofort, vonAnsicht){
    if(!k) return;
    gew = k;
    const p = k.art === 'wurzel' ? null : pflanzeFuer(k);
    if(p) oeffne(p); else if(k.kinder) schliesse();
    markiere(k, p);
    if(K.suche.treffer) suche(K.suche);
    if(vonAnsicht){
      if(!k.kinder && karten.get(k)) waagrecht(karten.get(k), sofort);
      if(streifen && p) zeigePaar(p, sofort);
      return;
    }
    if(k.art === 'wurzel'){ raum.scrollTo({top: 0, behavior: verhalten(sofort)}); return; }
    if(k.art === 'ort' && beetVon.get(k) && !beetVon.get(k).classList.contains('unter')){ const pl = raum.querySelector('.gplan');
      raum.scrollTo({top: beetVon.get(k).offsetTop - (getComputedStyle(pl).position === 'sticky' ? pl.offsetHeight : 0), behavior: verhalten(sofort)}); return; }
    const ziel = p ? p.el : k.art === 'ort' || k.art === 'bereich' ? beetVon.get(k)?.querySelector('.gunterweg') : kopfVon.get(k)?.parentElement;
    const blattHier = p && !k.kinder ? (blattEls.get(k) || []).find(e => p.el.contains(e)) : null, karteHier = !k.kinder ? karten.get(k) : null;
    if(blattHier && karteHier){
      // eine Fassung: ihr Blatt an der Pflanze und ihre Karte im Streifen, beides möglichst zugleich im Blick
      waagrecht(karteHier, true);
      const rr = raum.getBoundingClientRect(), deckel = klebt(p.el) + 10, boden = (K.schmal() ? K.rand().unten : 0) + 10;
      const st = raum.scrollTop, oben = st + p.el.getBoundingClientRect().top - rr.top - deckel,
        amBlatt = st + blattHier.getBoundingClientRect().top - rr.top - deckel - 16, anKarte = st + karteHier.getBoundingClientRect().bottom - rr.bottom + boden + 12;
      raum.scrollTo({top: Math.max(0, Math.min(amBlatt, Math.max(oben, anKarte))), behavior: verhalten(sofort)});
      waagrecht(blattHier, sofort);
      return;
    }
    hin(ziel, sofort, !!p);
    if(blattHier) waagrecht(blattHier, sofort);
    if(karteHier) waagrecht(karteHier, sofort);
  }

  function suche(s){
    const an = !!(s && s.treffer);
    raum.classList.toggle('sucht', an);
    for(const p of PFL){
      const hit = !an || (p.eigen ? s.treffer.has(p.k.schluessel) || p.bl.some(f => s.treffer.has(f.schluessel)) : K.istTreffer(p.k));
      p.el.classList.toggle('gedaempft', !hit);
    }
    for(const [f, els] of blattEls) for(const e of els) e.classList.toggle('gedaempft', an && !K.istTreffer(f));
    for(const [f, b] of karten) b.classList.toggle('gedaempft', an && !K.istTreffer(f));
    for(const [, {b, o}] of planVon) b.classList.toggle('gedaempft', an && !!o.schluessel && !K.istTreffer(o));
  }

  /* Erst mit der eigenen Gestaltung anlegen: vorher stimmen keine Maße, und alle Bilder würden auf einmal geladen */
  let gebaut = false;
  const anlegen = () => { if(gebaut || !raum.isConnected) return; gebaut = true; baue(); beob.observe(raum); if(gew) zeige(gew, true); };
  const eigenStil = [...document.querySelectorAll('link[rel="stylesheet"]')].find(l => /\/garten\.css$/.test(l.href));
  if(eigenStil && !eigenStil.sheet){ raum.append(el('div', 'laedt', 'Der Garten wird angelegt …')); eigenStil.addEventListener('load', anlegen, {once: true}); eigenStil.addEventListener('error', anlegen, {once: true}); }
  else anlegen();
  return {
    zeige(k, sofort, vonAnsicht){ if(!gebaut){ gew = k; return; } zeige(k, sofort, vonAnsicht); },
    suche(s){ if(gebaut) suche(s); },
    groesse(){ if(gebaut) groesse(); },
    ende(){ beob.disconnect(); cancelAnimationFrame(messZeit); cancelAnimationFrame(rollZeit); raum.removeEventListener('scroll', amRollen); raum.remove(); }
  };
}
