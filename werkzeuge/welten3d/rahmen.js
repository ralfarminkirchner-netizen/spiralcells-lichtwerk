/* Rahmen für jede 3D-Welt: Bestand, Suche, Blatt, Weg, Adresse, Namen im Raum, Weltwechsel.
   Die Welt selbst liefert nur: wie man hinfliegt, was unter dem Finger liegt, welche Namen gerade wichtig sind.
   Mitgenommen wird zwischen den Welten nur die Wahl und die Suche (Adresse #welt/weg?q=…). */
import {baueInhalt, wegZu, adresse, bisherigeAdresse, mengenWort, zeitWort, OFFEN, TRAGEND, ARTWORT} from '../../app/werkansichten/inhalt.js';
import {baueBezuege, BELEGT, BERECHNET} from '../../app/werkansichten/bezug.js';
export {wegZu, adresse, mengenWort, zeitWort, OFFEN, TRAGEND, BELEGT, BERECHNET};

export const $ = s => document.querySelector(s);
export const WELTEN = [{id: 'galaxie', name: 'Galaxie'}, {id: 'garten', name: 'Garten'}, {id: 'dorf', name: 'Dorf'}];
export const klein = Math.min(innerWidth, innerHeight) < 700;
export const tablet = !klein && (navigator.maxTouchPoints > 1 || /iPad/.test(navigator.userAgent));
export const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

let satzZeit = 0;
export function sage(t, dauer = 5200){ const s = $('#satz'); s.textContent = t; s.classList.remove('weg'); clearTimeout(satzZeit); if(dauer) satzZeit = setTimeout(() => s.classList.add('weg'), dauer); }

export const bildUrl = (b, w = 240) => `/lichtwerk/bild?w=${w >= 400 ? 960 : 240}&pfad=${encodeURIComponent(b.pfad)}`;
export const STIMMFARBE = [[/^claude/i, '#ffb45c', 'Claude'], [/^codex/i, '#38c8ff', 'Codex'], [/^hermes/i, '#86e070', 'Hermes'], [/^anti-?\s?gravity/i, '#9b7bff', 'Antigravity'], [/^kimi/i, '#ff5e8a', 'Kimi'], [/^astra/i, '#ffe36e', 'Astra'], [/^chatgpt/i, '#4fd6a8', 'ChatGPT'], [/^cursor/i, '#c7cede', 'Cursor'], [/^grok/i, '#ff8f4a', 'Grok'], [/^gemini/i, '#6fa8ff', 'Gemini'], [/^ralf/i, '#ffffff', 'Ralf']];
export const stimmeVon = h => { for(const [m, f, n] of STIMMFARBE) if(m.test(h || '')) return {f, n}; return {f: '#b9b2a6', n: 'Übernommener Bestand'}; };
export const ORTFARBE = {'Tragwerk System': '#efc98f', 'MiND-BODY-SOUL': '#b98bd9', 'GAMES': '#4fd1b5', 'MUSiC': '#ff8a4f', 'EDUCATiON': '#6aa6ff', 'WRiTING': '#f2cf5b', 'ARTS': '#ff6f9a', 'PERSONAL': '#8fd65e', 'Zur Prüfung': '#b8b6ad'};
export const ortVon = k => { const w = wegZu(k); return w[1] ? w[1].name : ''; };
export const fassungenVon = k => k.art === 'fassung' ? [k] : (k.kinder || []).flatMap(fassungenVon);

/* Der Bestand: zuletzt gelesener Stand sofort aus der Ablage, der frische im Hintergrund */
async function holeBestand(url){
  let lager = null; try{ lager = await caches.open('welten3d-bestand'); }catch(e){ /* ohne Ablage */ }
  const frisch = fetch(url).then(r => { if(!r.ok) throw new Error(url + ' ' + r.status); if(lager) lager.put(url, r.clone()).catch(() => {}); return r.text(); });
  const alt = lager ? await lager.match(url).catch(() => null) : null;
  if(alt){ const t = await alt.text(); frisch.then(n => { if(n !== t) sage('Der Bestand hat sich seit dem letzten Besuch geändert. Neu laden zeigt den neuen Stand.'); }).catch(() => {}); try{ return JSON.parse(t); }catch(e){ /* frisch */ } }
  return JSON.parse(await frisch);
}
export async function ladeBestand(){
  const bilderDa = fetch('/lichtwerk/bilder').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  const [g, gespraeche] = await Promise.all([holeBestand('/api/graph'), holeBestand('/lichtwerk/gespraeche').catch(() => [])]);
  const I = baueInhalt(g, (await bilderDa) || {}, gespraeche || []);
  return {I, bezug: baueBezuege(g, I)};
}

/* ---------- Der Rahmen ---------- */
export function rahmen({welt, artName, waehleInWelt, zusatz, blattTitel}){
  const blattEl = $('#blatt'), namenEl = $('#namen');
  const R = {I: null, bezug: null, gewaehlt: null, suchText: '', naeheAn: false};
  $('#marke span').textContent = WELTEN.find(w => w.id === welt).name;
  document.title = 'Lichtgrund · ' + WELTEN.find(w => w.id === welt).name;

  const hashJetzt = () => '#' + welt + (R.gewaehlt ? '/' + adresse(R.gewaehlt) : '') + (R.suchText ? '?q=' + encodeURIComponent(R.suchText) : '');
  const karten = (ansicht = 'baum') => 'werkansichten.html#' + ansicht + (R.gewaehlt ? '/' + adresse(R.gewaehlt) : '') + (R.suchText ? '?q=' + encodeURIComponent(R.suchText) : '');
  function inAdresse(neu){ const h = hashJetzt(); $('#knKarten').href = karten(); if(location.hash === h) return; if(neu) history.pushState({w: 1}, '', h); else history.replaceState({w: 1}, '', h); }
  function ausAdresse(){ const roh = decodeURIComponent(location.hash.replace(/^#/, '')), [pt, fr = ''] = roh.split('?'), t = pt.split('/').filter(Boolean); if(WELTEN.some(w => w.id === t[0])) t.shift(); return {pfad: t.join('/'), q: new URLSearchParams(fr).get('q') || ''}; }
  const nachPfad = p => !p ? null : R.I.alle.find(k => k.art !== 'wurzel' && adresse(k) === p) || R.I.alle.find(k => k.art !== 'wurzel' && bisherigeAdresse(k) === p) || null;
  addEventListener('popstate', () => { if(!R.I) return; const t = location.hash.replace(/^#/, '').split(/[/?]/)[0]; if(t && t !== welt && WELTEN.some(w => w.id === t)){ location.reload(); return; } waehle(nachPfad(ausAdresse().pfad), false); });

  function waehle(k, mitAdresse = true, flug = true){
    R.gewaehlt = k && k.art !== 'wurzel' ? k : null;
    waehleInWelt(R.gewaehlt, flug);
    zeichneBlatt(); zeichneWeg(); if(mitAdresse) inAdresse(true);
  }
  const lesen = k => { location.href = 'werkansichten.html#zelle/' + adresse(k); };

  function zeichneWeg(){
    const nav = $('#weg'); nav.replaceChildren(); if(!R.gewaehlt) return;
    wegZu(R.gewaehlt).slice(1).forEach((q, i, l) => { if(i){ const s = document.createElement('i'); s.textContent = '›'; nav.append(s); } const b = document.createElement('button'); b.textContent = q.name; b.onclick = () => waehle(q); if(i === l.length - 1) b.style.color = 'var(--text)'; nav.append(b); });
  }
  function zeichneBlatt(){
    const k = R.gewaehlt; if(!k){ blattEl.hidden = true; return; }
    const B = blattEl; B.replaceChildren(); B.hidden = false;
    const zu = document.createElement('button'); zu.className = 'zu'; zu.setAttribute('aria-label', 'Zurück zum Übergeordneten'); zu.textContent = '×'; zu.onclick = () => waehle(k.eltern && k.eltern.art !== 'wurzel' ? k.eltern : null); B.append(zu);
    const bild = k.bild || (k.bilder && k.bilder[0]);
    if(bild){ const im = new Image(); im.className = 'bild'; im.alt = bild.text || ('Bild aus ' + k.name); im.decoding = 'async'; im.src = bildUrl(bild, 960); B.append(im); }
    else { const unterB = []; (function sammle(q){ for(const c of q.kinder || []){ if(unterB.length >= 4) return; if(c.bild && (c.art === 'app' || c.art === 'werk')) unterB.push(c.bild); else if(c.kinder) sammle(c); } })(k);
      if(unterB.length >= 2){ const mo = document.createElement('div'); mo.className = 'mosaik'; for(const ub of unterB){ const im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = bildUrl(ub, 240); mo.append(im); } B.append(mo); }
      else { const o = document.createElement('div'); o.className = 'ohne'; o.textContent = k.art === 'fassung' ? 'Zu dieser Fassung gibt es kein Bild.' : 'Ohne Bild'; B.append(o); } }
    const L = document.createElement('div'); L.className = 'leib'; B.append(L);
    const a = document.createElement('div'); a.className = 'art'; a.textContent = artName(k) || ARTWORT[k.art]; L.append(a);
    const h = document.createElement('h2'); h.textContent = k.name; L.append(h);
    const p1 = document.createElement('p'); p1.textContent = mengenWort(k) + ' · ' + zeitWort(k); L.append(p1);
    const erkl = blattTitel && blattTitel(k); if(erkl){ const p = document.createElement('p'); p.textContent = erkl; L.append(p); }
    if(k.auch && k.auch.length > 1){ const p = document.createElement('p'); p.textContent = 'Dasselbe Werk liegt auch in: ' + k.auch.filter(o => o !== ortVon(k)).join(', '); L.append(p); }
    const fass = fassungenVon(k), st = new Map(); for(const f of fass){ const s = stimmeVon(f.stimme); st.set(s.n, [s.f, (st.get(s.n) || [0, 0])[1] + 1]); }
    if(st.size){ const d = document.createElement('div'); d.className = 'stimmen'; [...st].sort((x, y) => y[1][1] - x[1][1]).slice(0, 7).forEach(([n, [f, z]]) => { const s = document.createElement('span'); s.className = 'stimme'; const i = document.createElement('i'); i.style.background = f; s.append(i, `${n}${fass.length > 1 ? ' ' + z : ''}`); d.append(s); }); L.append(d); }
    const tun = document.createElement('div'); tun.className = 'tun'; L.append(tun);
    const kn = (t, f, haupt) => { const b = document.createElement('button'); b.className = 'knopf' + (haupt ? ' haupt' : ''); b.textContent = t; b.onclick = f; tun.append(b); return b; };
    if(k.art === 'fassung' || k.art === 'werk' || k.art === 'app' || k.art === 'gespraech') kn('Lesen', () => lesen(k), true);
    if(zusatz) zusatz(k, kn);
    const kk = document.createElement('a'); kk.className = 'knopf'; kk.textContent = 'In den Karten'; kk.href = karten(); tun.append(kk);
    if(R.bezug && k.art !== 'ort'){
      const alle = R.bezug.von(k), bel = alle.filter(e => e.belegt), ber = alle.filter(e => !e.belegt);
      if(bel.length || ber.length){ const h3 = document.createElement('h3'); h3.textContent = 'Beziehungen'; L.append(h3);
        for(const e of bel.slice(0, 6)){ const p = document.createElement('div'); p.className = 'bez'; const w = BELEGT[e.art] ? (e.aus ? BELEGT[e.art].wort : BELEGT[e.art].rueck) : e.art; p.append(w + ' '); const b = document.createElement('b'); b.textContent = e.andere.name; p.append(b); p.style.cursor = 'pointer'; p.onclick = () => waehle(e.andere); L.append(p); }
        if(bel.length > 6){ const p = document.createElement('div'); p.className = 'bez'; p.textContent = `und ${bel.length - 6} weitere belegte`; L.append(p); }
        if(ber.length){ const p = document.createElement('div'); p.className = 'bez'; p.textContent = `${ber.length} berechnete Nähen (${[...new Set(ber.map(e => BERECHNET[e.art] ? BERECHNET[e.art].wort : e.art))].join(', ')})${R.naeheAn ? '' : ', mit „Berechnete Nähe“ sichtbar'}`; L.append(p); }
      }
    }
    const kinder = (k.kinder || []).slice(); if(kinder.length){
      const h3 = document.createElement('h3'); h3.textContent = 'Darin'; L.append(h3);
      const li = document.createElement('div'); li.className = 'liste'; L.append(li);
      kinder.slice(0, 40).forEach(c => { const b = document.createElement('button'); const tb = c.bild || (c.bilder && c.bilder[0]); if(tb){ const im = new Image(); im.loading = 'lazy'; im.alt = ''; im.src = bildUrl(tb, 240); b.append(im); } else { const e = document.createElement('i'); e.className = 'leer'; b.append(e); } const s = document.createElement('span'); s.textContent = c.name; const z = document.createElement('small'); z.textContent = c.kinder ? c.fassungen + ' F.' : (c.von != null ? new Date(c.von).toLocaleDateString('de-DE', {month: 'short', year: '2-digit', timeZone: 'UTC'}) : ''); b.append(s, z); b.onclick = () => waehle(c); li.append(b); });
      if(kinder.length > 40){ const p = document.createElement('p'); p.textContent = `und ${kinder.length - 40} weitere, über die Suche erreichbar`; L.append(p); }
    }
  }

  // Suche über alles
  const sucheEl = $('#suche'), trefferEl = $('#treffer'); let treffer = [], an = 0;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function suche(q, zeigen = true){
    R.suchText = q.trim(); inAdresse(false); if(!R.I || !R.suchText){ trefferEl.hidden = true; return; }
    const w = norm(R.suchText).split(/\s+/).filter(Boolean);
    treffer = R.I.alle.filter(k => k.art !== 'wurzel' && w.every(x => norm(k.name).includes(x))).sort((a, b) => (a.kinder ? 0 : 1) - (b.kinder ? 0 : 1) || a.name.length - b.name.length).slice(0, 30);
    trefferEl.replaceChildren(); an = 0;
    if(!treffer.length){ const p = document.createElement('button'); p.disabled = true; p.textContent = 'Nichts gefunden'; trefferEl.append(p); }
    treffer.forEach((k, i) => { const b = document.createElement('button'); b.setAttribute('role', 'option'); if(!i) b.classList.add('an'); b.textContent = k.name; const s = document.createElement('small'); s.textContent = (artName(k) || ARTWORT[k.art] || '').split(' · ')[0] + ' · ' + wegZu(k).slice(1, -1).map(q => q.name).join(' › '); b.append(s); b.onclick = () => { trefferEl.hidden = true; waehle(k); }; trefferEl.append(b); });
    trefferEl.hidden = !zeigen;
  }
  sucheEl.addEventListener('input', () => suche(sucheEl.value));
  sucheEl.addEventListener('focus', () => { if(sucheEl.value) suche(sucheEl.value); });
  sucheEl.addEventListener('keydown', e => {
    const kn = [...trefferEl.querySelectorAll('button[role=option]')];
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); an = (an + (e.key === 'ArrowDown' ? 1 : -1) + kn.length) % Math.max(1, kn.length); kn.forEach((b, i) => b.classList.toggle('an', i === an)); }
    else if(e.key === 'Enter' && treffer[an]){ trefferEl.hidden = true; waehle(treffer[an]); sucheEl.blur(); }
    else if(e.key === 'Escape'){ trefferEl.hidden = true; sucheEl.blur(); }
    e.stopPropagation();
  });
  addEventListener('keydown', e => {
    if(document.activeElement === sucheEl) return;
    if(e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))){ e.preventDefault(); sucheEl.focus(); }
    else if(e.key === 'Escape'){ if(R.gewaehlt) waehle(R.gewaehlt.eltern && R.gewaehlt.eltern.art !== 'wurzel' ? R.gewaehlt.eltern : null); }
    else if(e.key === 'Enter' && R.gewaehlt && document.activeElement === $('#welt')) lesen(R.gewaehlt);
  });
  $('#marke').onclick = () => waehle(null);
  addEventListener('pointerdown', e => { if(!trefferEl.contains(e.target) && e.target !== sucheEl) trefferEl.hidden = true; });
  const kn = $('#knNaehe'); if(kn) kn.onclick = () => { R.naeheAn = !R.naeheAn; kn.setAttribute('aria-pressed', R.naeheAn); R.beiNaehe && R.beiNaehe(R.naeheAn); zeichneBlatt(); sage(R.naeheAn ? 'Berechnete Nähe sichtbar: blau gestrichelt. Sie behauptet keine Verbindung.' : 'Nur belegte Beziehungen.'); };

  // Tippen: einmal wählen, zweimal lesen
  let unten = null, letzter = {t: 0, k: null};
  R.tippen = (canvas, treffe, beiDruck) => {
    canvas.addEventListener('pointerdown', e => { unten = {x: e.clientX, y: e.clientY, t: performance.now()}; beiDruck && beiDruck(); });
    canvas.addEventListener('pointerup', e => {
      if(!unten || !R.I) return; const d = Math.hypot(e.clientX - unten.x, e.clientY - unten.y), dt = performance.now() - unten.t; unten = null; if(d > 7 || dt > 500) return;
      const k = treffe(e.clientX, e.clientY, e.pointerType === 'touch' ? 26 : 16), jetzt = performance.now();
      if(k && letzter.k === k && jetzt - letzter.t < 420 && /^(fassung|werk|app|gespraech)$/.test(k.art)){ lesen(k); return; }
      letzter = {t: jetzt, k}; if(k) waehle(k);
    });
  };

  // Namen im Raum: gemessen, nie übereinander
  const cache = new Map(); let frame = 0;
  R.namen = (kand, projiziere, grenze) => {
    if(++frame % 2) return;
    kand.sort((a, b) => b.prio - a.prio);
    const boxen = [], w = innerWidth, h = innerHeight, sichtbar = new Set();
  for(const id of ['leiste', 'blatt']){ const e = document.getElementById(id); if(e && !e.hidden){ for(const c of e.children){ const r = c.getBoundingClientRect(); if(r.width) boxen.push([r.left - 4, r.top - 4, r.right + 4, r.bottom + 4]); } } }
    for(const c of kand){
      if(sichtbar.size >= grenze) break;
      const s = projiziere(c); if(!s) continue; const [x, y, r] = s; if(x < -40 || x > w + 40 || y < -20 || y > h + 20) continue;
      const key = c.klasse + '|' + c.text + '|' + (c.unter || ''); let el = cache.get(key);
      if(!el){ el = document.createElement('div'); el.className = 'nm ' + c.klasse; el.textContent = c.text; if(c.unter){ const u = document.createElement('small'); u.textContent = c.unter; el.append(u); } namenEl.append(el); el._w = el.offsetWidth; el._h = el.offsetHeight; cache.set(key, el); }
      if(sichtbar.has(el)) continue;
      let bx = x + Math.max(6, r + 4); const by = y - el._h / 2; if(bx + el._w > w - 4) bx = x - Math.max(6, r + 4) - el._w;
      if(boxen.some(o => bx < o[2] && bx + el._w > o[0] && by < o[3] && by + el._h > o[1])) continue; boxen.push([bx - 3, by - 2, bx + el._w + 3, by + el._h + 2]);
      el.style.transform = `translate(${bx.toFixed(1)}px,${by.toFixed(1)}px)`; el.classList.add('da'); sichtbar.add(el);
    }
    for(const el of cache.values()) if(!sichtbar.has(el)) el.classList.remove('da');
  };

  R.waehle = waehle; R.lesen = lesen; R.zeichneBlatt = zeichneBlatt;
  R.start = (I, bezug) => {
    R.I = I; R.bezug = bezug; const a = ausAdresse(); if(a.q){ sucheEl.value = a.q; suche(a.q, false); }
    const k0 = nachPfad(a.pfad); if(a.pfad && !k0) sage('Die Adresse führt zu keinem Werk mehr. Hier ist alles.');
    history.replaceState({w: 1}, '', hashJetzt()); return k0;
  };
  return R;
}
