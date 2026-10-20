/* =====================================================================
   BEDIENUNG — Tippen entfaltet eine Stufe (Marke am Licht → Lesefläche),
   Ziehen dreht, Halten verbindet, ⌘V oder Ablegen wirft Material ein.
   Jede folgenreiche Handlung braucht ein Halten im Bild. Keine Formulare.
   ===================================================================== */
import {clamp, sstep, DEG, CAM, toScreen, pointerWorld, SILVER} from './licht.js';
import {U, W} from './welt.js';
import {STIMMEN, MENSCH, menschlich, kurz, datum, nameVon, MODUS_SATZ, STATUS_SATZ, TYP_SATZ, URTEIL_SATZ, BELEG_SATZ, REIFE} from './daten.js';
import {burst} from './zelle.js';
import {AU, toggle as klangToggle, wake as klangWake, klang} from './klang.js';
import * as schreib from './schreiben.js';
import * as formen from './formen.js';

const $ = s => document.querySelector(s);
const canvas = $('#gl'), lineEl = $('#line'), markeEl = $('#marke'), leseEl = $('#lese'), siegelEl = $('#siegel'), hintEl = $('#hint'), ortEl = $('#zurueck');
let api = null;
const esc = s => menschlich(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const roh = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const zahlwort = n => ['keine', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'][n] ?? String(n);
const Zahlwort = n => { const w = zahlwort(n); return w.charAt(0).toUpperCase() + w.slice(1); };
const namen = arr => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' und ' + arr[arr.length - 1];

export function activity(){ U.last = W.wall; document.body.classList.add('active'); document.body.classList.remove('dim'); }

/* ------------------------------------------------------------- Bildzeile */
let lineText = '', lineTimer = 0;
export function zeile(text){
  if(text === lineText) return; lineText = text;
  lineEl.classList.remove('on'); clearTimeout(lineTimer);
  if(!text) return;
  lineTimer = setTimeout(() => { lineEl.textContent = text; lineEl.classList.add('on'); }, W.RM ? 0 : 420);
}
export function mondSatz(m){
  if(!m) return '';
  if(m.reife === 'kanonisch') return 'Von Ralf kristallisiert. Jede Ausprägung hat ihre Lücke.';
  if(m.traumfeld) return m.samen.length ? 'Material ohne Stimmen. Ein ruhiges Feld.' : 'Ein Keim ohne Ausprägungen. Ein ruhiges Feld.';
  const nv = m.stimmen.length;
  if(nv === 1) return `${STIMMEN[m.stimmen[0]].name} spricht hier allein, auf einer eigenen Speiche.`;
  if(m.kopplung === 0) return `${Zahlwort(nv)} Stimmen, jede in ihrer eigenen Spur.`;
  const lesen = new Set(m.paare.map(p => p[0]));
  const stumm = m.stimmen.filter(i => !lesen.has(i)).map(i => STIMMEN[i].name);
  if(stumm.length){ const leser = m.stimmen.filter(i => lesen.has(i)).map(i => STIMMEN[i].name);
    return leser.length === 1 ? `${leser[0]} liest mit, ${namen(stumm)} noch nicht.` : `${Zahlwort(leser.length)} Stimmen lesen einander, ${namen(stumm)} noch nicht.`; }
  return 'Die Stimmen lesen einander. Kristallisiert hat Ralf noch nichts.';
}
export function stummeStimmen(m){ if(!m || m.stimmen.length < 2 || m.kopplung === 0) return null; const lesen = new Set(m.paare.map(p => p[0])); const s = m.stimmen.filter(i => !lesen.has(i)); return s.length ? s : null; }
export function netzSatz(B){
  const mit = B.monde.filter(m => m.stimmen.length).length;
  return `${B.monde.length} Monde. In ${zahlwort(mit)} sprechen die Stimmen.`;
}

/* ---------------------------------------------------------------- Marke */
export function zeigeMarke(titel, satz){ markeEl.querySelector('.marke-titel').textContent = titel; markeEl.querySelector('.marke-satz').textContent = satz; markeEl.hidden = false; markeW = markeEl.offsetWidth || 200; }
export function verbirgMarke(){ markeEl.hidden = true; }
let markeW = 200;
export function setzeMarke(sx, sy){
  const w = markeW, links = sx > CAM.cssW - w - 40;
  markeEl.classList.toggle('links', links);
  const x = links ? sx - w - 22 : sx + 22, y = clamp(sy - 16, 60, CAM.cssH - 140);
  markeEl.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
}

export function markeFuer(sel){
  const m = sel.mond;
  if(sel.art === 'same'){ const s = m.samen[sel.i]; const teile = [nameVon(W.B.agenten.get(s.fassung.author_id)), datum(s.zeit)];
    if(s.form) teile.push('Form ohne Modell'); else { if(s.modus) teile.push(MODUS_SATZ[s.modus]); if(s.status !== 'entwurf') teile.push(STATUS_SATZ[s.status]); }
    if(U.stufe < 2 && gleich(U.sel, sel)) teile.push('tippen liest');
    return [kurz(s.label, 96), teile.join(' · ')]; }
  if(sel.art === 'keim') return [m.keimSatz, 'Ausgangsfrage' + (m.keimKristall ? ' · Grundformation' : '') + (m.keim.length > 1 ? ` · ${m.keim.length} Fassungen` : '') + (gleich(U.sel, sel) ? ' · tippen liest' : '')];
  if(sel.art === 'kopf'){ const v = STIMMEN[sel.i]; return [v.name, `${v.rolle} · ${v.schrift} · tippen zeigt ihre Spur allein`]; }
  if(sel.art === 'mond'){ const nv = m.stimmen.length;
    const teile = [nv ? `${Zahlwort(nv)} ${nv === 1 ? 'Stimme' : 'Stimmen'}` : 'ohne Stimmen', `${m.samen.length + m.keim.length} ${m.samen.length + m.keim.length === 1 ? 'Ausprägung' : 'Ausprägungen'}`, m.reife];
    if(gleich(U.sel, sel)) teile.push('tippen öffnet');
    return [m.titel, teile.join(' · ')]; }
  if(sel.art === 'tuer'){ const t = W.N.tueren[sel.i]; return [t.satz, t.wach ? 'wach · noch einmal tippen öffnet' : 'ruht gerade']; }
  return ['', ''];
}

/* ----------------------------------------------------------- Lesefläche */
const zier = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>').replace(/`([^`]+)`/g, '$1');
function absaetze(text){
  const out = []; let buf = [];
  const flush = () => { if(buf.length){ const t = buf.join(' ').trim();
    if(t){ const ganzFett = t.match(/^\*\*([^*]+)\*\*$/);
      out.push(ganzFett ? `<h3>${esc(ganzFett[1])}</h3>` : /^>/.test(buf[0]) ? `<p class="zitat">${zier(t.replace(/^>\s?/, ''))}</p>` : `<p>${zier(t)}</p>`); } buf = []; } };
  for(const z of String(text || '').split(/\r?\n/)){
    if(/^\s*$/.test(z) || /^\s*([-*_])\1{2,}\s*$/.test(z)){ flush(); continue; }
    const h = z.match(/^\s{0,3}#{1,6}\s+(.*)$/); if(h){ flush(); out.push(`<h3>${esc(h[1])}</h3>`); continue; }
    if(/^\s*([-*•]|\d+[.)])\s+/.test(z)){ flush(); out.push(`<p>${zier(z.trim().replace(/^[-*]\s+/, '· '))}</p>`); continue; }
    buf.push(z.trim());
  }
  flush(); return out.join('');
}
export function haltKnopf(text, unter, art, dauer, tun){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'halten' + (art ? ' ' + art : '');
  b.innerHTML = `<svg viewBox="0 0 30 30" aria-hidden="true"><circle class="bahn" cx="15" cy="15" r="13"/><circle class="fuell" cx="15" cy="15" r="13"/></svg><span>${roh(text)}${unter ? `<small>${roh(unter)}</small>` : ''}</span>`;
  b.setAttribute('aria-label', text + ', zum Bestätigen gedrückt halten');
  // Der Zeitgeber entscheidet, der Bildtakt füllt nur den Ring. Jede Bewegung, jedes Verlassen bricht ab.
  let t0 = 0, raf = 0, uhr = 0, fertig = false, x0 = 0, y0 = 0;
  const lauf = () => { if(!t0) return; b.style.setProperty('--k', clamp((performance.now() - t0) / dauer, 0, 1).toFixed(3)); raf = requestAnimationFrame(lauf); };
  const sichtbar = () => b.isConnected && !b.closest('[hidden]') && !b.closest('[inert]') && getComputedStyle(b).visibility !== 'hidden' && b.getClientRects().length > 0 && !document.hidden;
  const voll = () => { if(!t0 || !sichtbar()) return stop(); fertig = true; b.style.setProperty('--k', '1'); stop(false); tun(); };
  const start = e => { if(e && e.button > 0) return; if(t0) return; fertig = false; t0 = performance.now(); b.classList.add('drueckt');
    if(e){ x0 = e.clientX; y0 = e.clientY; } raf = requestAnimationFrame(lauf); uhr = setTimeout(voll, dauer); };
  const stop = abbruch => { cancelAnimationFrame(raf); clearTimeout(uhr); t0 = 0; b.classList.remove('drueckt'); if(abbruch !== false || !fertig) b.style.setProperty('--k', '0'); };
  b.addEventListener('pointerdown', e => { start(e); });
  b.addEventListener('pointermove', e => { if(t0 && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) stop(); });
  for(const ev of ['pointerup', 'pointercancel', 'pointerleave', 'blur']) b.addEventListener(ev, () => stop());
  b.addEventListener('keydown', e => { if((e.key === ' ' || e.key === 'Enter') && !e.repeat){ e.preventDefault(); start(); } });
  b.addEventListener('keyup', e => { if(e.key === ' ' || e.key === 'Enter') stop(); });
  b.addEventListener('click', e => e.preventDefault());
  b.addEventListener('contextmenu', e => e.preventDefault());
  return b;
}
addEventListener('blur', () => document.querySelectorAll('.halten.drueckt').forEach(b => b.dispatchEvent(new Event('pointercancel'))));
document.addEventListener('visibilitychange', () => { if(document.hidden) document.querySelectorAll('.halten.drueckt').forEach(b => b.dispatchEvent(new Event('pointercancel'))); });

function stillerKnopf(text, unter, tun){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'halten still';
  b.innerHTML = `<span>${roh(text)}${unter ? `<small>${roh(unter)}</small>` : ''}</span>`; b.addEventListener('click', tun); return b;
}

let leseV = null;
export function oeffneLese(sel){
  const m = sel.mond, B = W.B;
  const v = sel.art === 'same' ? m.samen[sel.i].fassung : m.keim[m.keim.length - 1];
  if(!v){ return; }
  const gleicheFassung = !leseEl.hidden && leseV === v.id, scroll = leseEl.scrollTop, fokusInnen = leseEl.contains(document.activeElement);
  leseV = v.id;
  const a = B.agenten.get(v.author_id), st = sel.art === 'same' ? m.samen[sel.i].stimme : null;
  const farbe = typeof st === 'number' ? STIMMEN[st].hex : st === MENSCH ? '#e6ecff' : '#fff1d6';
  leseEl.querySelector('.lese-punkt').style.color = farbe;
  leseEl.querySelector('.lese-wer').textContent = sel.art === 'keim' ? 'Ausgangsfrage' : nameVon(a);
  const mode = (v.contribution || {}).mode, teile = [`in „${kurz(m.titel, 60)}“`];
  if(formKorn(sel)){ leseEl.querySelector('.lese-art').textContent = teile[0] + ' · Form ohne Modell'; }
  else {
  if(mode) teile.push(MODUS_SATZ[mode]);
  const stHtml = v.status === 'grundformation' ? '<span class="gold">Grundformation</span>' : esc(STATUS_SATZ[v.status] || 'Entwurf');
  leseEl.querySelector('.lese-art').innerHTML = esc(teile.join(' · ')) + ' · ' + stHtml; }
  // Fäden als Sätze, jeder führt weiter; erst drei, dann auf Wunsch alle
  const ul = leseEl.querySelector('.lese-faeden'); ul.innerHTML = '';
  const alle = [...m.faeden, ...m.aussen].filter(f => f.von === v.id || f.nach === v.id);
  const zeileFaden = f => {
    const raus = f.von === v.id, andere = raus ? f.nach : f.von, ov = B.fassungen.get(andere); if(!ov) return null;
    const om = B.mondVon.get(B.werkVon(andere));
    const satz = f.form ? (raus ? 'Form von' : 'als Form behalten:') : raus ? `${TYP_SATZ[f.typ] || f.typ}` : `wird ${f.typ === 'erweitert' ? 'erweitert von' : f.typ === 'widerspricht' ? 'widersprochen von' : f.typ === 'remixt-aus' ? 'weiterverwendet in' : f.typ === 'testet' ? 'geprüft von' : 'erwähnt in'}`;
    const ort = om && om !== m ? ` in „${kurz(om.titel, 40)}“` : '';
    const bf = f.befunde[0], beleg = f.urteil ? `Befund: ${URTEIL_SATZ[f.urteil]} · ${BELEG_SATZ[bf.evidence_status] || 'ohne Belegart'}` : (f.verwendung ? 'mit beschriebener Verwendung, ohne Befund' : '');
    const li = document.createElement('li'), btn = document.createElement('button'); btn.type = 'button';
    btn.innerHTML = `<span class="art">${esc(satz)}</span>„${esc(kurz(ov.label, 80))}“${esc(ort)}${beleg ? `<span class="beleg${bf && bf.evidence_status === 'executed-probe' ? ' fest' : ''}">${esc(beleg)}</span>` : ''}`;
    btn.addEventListener('click', () => api.folge(andere, om));
    li.append(btn); return li;
  };
  alle.slice(0, 3).forEach(f => { const li = zeileFaden(f); li && ul.append(li); });
  if(alle.length > 3){ const li = document.createElement('li'), mehr = document.createElement('button'); mehr.type = 'button'; mehr.className = 'mehr';
    mehr.textContent = `${alle.length - 3} weitere Verbindungen`; mehr.addEventListener('click', () => { li.remove(); alle.slice(3, 60).forEach(f => { const l = zeileFaden(f); l && ul.append(l); }); }); li.append(mehr); ul.append(li); }
  if(sel.art === 'keim' && m.keim.length > 1) for(const kv of m.keim){
    const li = document.createElement('li'), btn = document.createElement('button'); btn.type = 'button';
    btn.innerHTML = `<span class="art">${kv === v ? 'jüngste Fassung' : 'frühere Fassung'}</span>„${esc(kurz(kv.label, 80))}“`; btn.addEventListener('click', () => { zeigeText(kv, sel); leseEl.scrollTop = 0; }); li.append(btn); ul.append(li); }
  zeigeText(v, sel);
  leseEl.hidden = false; U.lese = true; document.body.classList.add('lesend');
  leseEl.scrollTop = gleicheFassung ? scroll : 0;
  if(!gleicheFassung || fokusInnen) leseEl.focus({preventScroll: true});
  verbirgMarke();
  if(!gleicheFassung) ansage(`${leseEl.querySelector('.lese-wer').textContent}: ${leseEl.querySelector('.lese-titel').textContent}. Lesefläche offen, Escape schließt.`);
}
/* Handlungen unten, still, immer an der angezeigten Fassung: zuerst Kristallisieren, Verbinden, Ablegen; der Rest auf Wunsch */
function baueTun(v, sel){
  const m = sel.mond;
  const tun = leseEl.querySelector('.lese-tun'); stoppeHalten(tun); tun.innerHTML = '';
  const form = formKorn(sel);
  if(form){   // eine behaltene Form: als Seite ansehen, zum Original, dort weiterformen; kein Status, kein Verbinden
    const original = W.B.fassungen.get(form.original);
    tun.append(stillerKnopf('Als Seite ansehen', 'im Lichttisch', () => formen.zeigeBehalten(v, original, m, () => kornAufSchirm(sel))));
    if(original){ tun.append(stillerKnopf('Zum Original', kurz(original.label, 40), () => api.folge(original.id, W.B.mondVon.get(W.B.werkVon(original.id)))));
      formen.handgriff(original, m, tun, () => kornAufSchirm(sel)); }
    return;
  }
  const setze = (status, satz) => async () => { await api.status(v, status, satz); };
  if(v.status !== 'grundformation') tun.append(haltKnopf('Kristallisieren', 'halten', 'gold', 1800, setze('grundformation', 'Kristallisiert.')));
  formen.handgriff(v, m, tun, () => kornAufSchirm(sel));
  tun.append(stillerKnopf('Verbinden', 'dann die zweite tippen', () => { U.waehlen = {von: v.id, sel, mondId: m.id}; schliesseLese(true); zeile('Tippe die Ausprägung, mit der sie zusammenhängt.'); ansage('Verbinden: die zweite Ausprägung wählen, mit Pfeiltasten und Eingabe oder durch Tippen.'); }));
  tun.append(stillerKnopf('Hierzu ablegen', W.touch ? 'Text aus der Zwischenablage' : '⌘V oder Text hierher ziehen', async () => {
    try{ const t = await navigator.clipboard.readText(); if(t && t.trim()) api.einwurf(t, null, null); else zeile('Die Zwischenablage ist leer.'); }
    catch(e){ zeile('Die Zwischenablage gibt nichts frei. Mit ⌘V geht es auch.'); } }));
  const weitere = document.createElement('div'); weitere.className = 'lese-weitere'; weitere.hidden = true;
  if(v.status === 'entwurf') weitere.append(haltKnopf('Geprüft', 'halten', '', 1200, setze('geprüft', 'Als geprüft vermerkt.')));
  if(v.status !== 'verworfen') weitere.append(haltKnopf('Beiseitelegen', 'halten · der Text bleibt', '', 1400, setze('verworfen', 'Beiseitegelegt. Der Text bleibt erhalten.')));
  if(v.status !== 'entwurf') weitere.append(haltKnopf('Zurück zum Entwurf', 'halten', '', 1400, setze('entwurf', 'Wieder ein Entwurf.')));
  const auf = stillerKnopf('· · ·', '', () => { weitere.hidden = !weitere.hidden; auf.setAttribute('aria-expanded', String(!weitere.hidden)); }); auf.classList.add('punkte'); auf.setAttribute('aria-label', 'Weitere Statuswechsel'); auf.setAttribute('aria-expanded', 'false');
  tun.append(auf, weitere);
}
const formKorn = sel => sel && sel.art === 'same' && sel.mond.samen[sel.i]?.form ? sel.mond.samen[sel.i] : null;
function zeigeText(v, sel){
  if(sel) baueTun(v, sel);
  leseEl.querySelector('.lese-titel').textContent = kurz(v.label, 220);
  leseEl.querySelector('.lese-wann').textContent = datum(Date.parse(v.created_at));
  const form = formKorn(sel);
  leseEl.querySelector('.lese-text').innerHTML = form
    ? `<p>Eine Form ohne Modell, vom KiNFORMER gesetzt und von dir behalten. Die Worte sind die des Originals.</p><p class="zitat">${esc(String(v.notes || '').replace(/^Form ohne Modell · KiNFORMER · /, ''))}</p>`
    : absaetze(v.content || v.notes || '');
  // Technische Details: standardmäßig geschlossen, öffnet nie von selbst
  const det = leseEl.querySelector('.technik'); det.open = false;
  const B = W.B, t = B.baeume.get(v.worktree_id);
  const zeilen = [['Ausprägung', v.id], ['Zweig', v.worktree_id], ['Mond', t ? t.work_id : ''], ['Urheberschaft', v.author_id], ['abgeleitet von', v.derived_from || '—'], ['angelegt', v.created_at], ['Status', v.status]];
  if(v.contribution) zeilen.push(['Entstehung', JSON.stringify(v.contribution)]);
  if(v.source_ref) zeilen.push(['Quelle', JSON.stringify(v.source_ref)]);
  det.querySelector('.technik-liste').innerHTML = zeilen.map(([k, w]) => `<dt>${roh(k)}</dt><dd>${roh(w)}</dd>`).join('');
  det.querySelector('.technik-roh').textContent = v.content || '';
}
export function schliesseLese(behalteAuswahl){
  formen.schliesse(true);
  stoppeHalten(leseEl);
  if(!leseEl.hidden && leseEl.contains(document.activeElement)) canvas.focus({preventScroll: true});
  leseEl.hidden = true; U.lese = false; document.body.classList.remove('lesend'); leseV = null;
  if(!behalteAuswahl){ U.stufe = U.sel ? 1 : 0; }
}

/* Ansage für Screenreader: was gerade gewählt ist */
const ansageEl = $('#ansage');
export function ansage(t){ if(ansageEl){ ansageEl.textContent = ''; setTimeout(() => { ansageEl.textContent = t; }, 30); } }

/* --------------------------------------------------------------- Siegel */
export function siegel(satz, vorschau, knoepfe, lassen){
  siegelEl.querySelector('.siegel-satz').textContent = satz;
  siegelEl.querySelector('.siegel-vorschau').textContent = vorschau || '';
  const w = siegelEl.querySelector('.siegel-wahl'); w.innerHTML = ''; knoepfe.forEach(k => w.append(k));
  const l = siegelEl.querySelector('.siegel-lassen'); l.onclick = () => { schliesseSiegel(); lassen && lassen(); };
  siegelEl.hidden = false; U.siegel = {lassen}; zeile(''); verbirgMarke();
  setTimeout(() => { const f = w.querySelector('button'); f && f.focus({preventScroll: true}); }, 60);
}
export function stoppeHalten(wurzel){ (wurzel || document).querySelectorAll('.halten.drueckt').forEach(b => b.dispatchEvent(new Event('pointercancel'))); }
export function schliesseSiegel(){ stoppeHalten(siegelEl); const innen = siegelEl.contains(document.activeElement); siegelEl.hidden = true; U.siegel = null; if(innen) (U.lese ? leseEl : canvas).focus({preventScroll: true}); }

/* ------------------------------------------------------------ Auswahl */
export function waehle(sel, stufe){
  U.sel = sel; U.stufe = sel ? (stufe || 1) : 0;
  U.linkedSeeds = null;
  if(sel && sel.art === 'same'){ const m = sel.mond, id = m.samen[sel.i].id, idx = new Map(m.samen.map((s, i) => [s.id, i])), set = new Set();
    for(const f of m.faeden){ if(f.von === id && idx.has(f.nach)) set.add(idx.get(f.nach)); if(f.nach === id && idx.has(f.von)) set.add(idx.get(f.von)); }
    U.linkedSeeds = set; }
  if(!sel){ verbirgMarke(); schliesseLese(); return; }
  const [t, s] = markeFuer(sel); zeigeMarke(t, s); if(U.stufe < 2) ansage(t + '. ' + s);
  if(U.stufe >= 2 && (sel.art === 'same' || sel.art === 'keim')) oeffneLese(sel); else if(U.lese) schliesseLese(true);
}

/* --------------------------------------------------------------- Treffer */
const TMP = [0, 0, 0];
function kornWelt(sel){ const Z = W.Z; if(!sel || !Z || sel.mond !== Z.m) return null; const p = [0, 0, 0];
  if(sel.art === 'same') Z.seedPos(sel.i, p); else if(sel.art === 'keim') Z.keimPos(p); else return null; return p; }
function kornAufSchirm(sel){ const p = kornWelt(sel); if(!p) return null; const s = toScreen(p[0], p[1], p[2]); return s[2] > 0 ? s : null; }
export function trefferSame(sx, sy, maxPx = 16){
  const Z = W.Z; if(!Z || U.netK > 0.4) return -1;
  let best = -1, bd = maxPx * maxPx; const step = Z.G > 1600 ? 1 : 1;
  for(let g = 0; g < Z.G; g += step){ if(Z.gBorn[g] === -1) continue; Z.kornPos(g, TMP); const s = toScreen(TMP[0], TMP[1], TMP[2]); if(s[2] <= 0) continue;
    const d = (s[0] - sx) ** 2 + (s[1] - sy) ** 2; if(d < bd){ bd = d; best = Z.gSeed[g]; } }
  return best;
}
function trefferKeim(sx, sy){ const Z = W.Z; if(!Z || U.netK > 0.4 || !Z.m.keim.length) return false; const s = toScreen(Z.origin[0], Z.origin[1], Z.origin[2]); return s[2] > 0 && (s[0] - sx) ** 2 + (s[1] - sy) ** 2 < 26 * 26; }
function trefferKopf(sx, sy){ let best = -1, bd = 40 * 40; const src = U.netK > 0.6 ? U.bigHeads : U.heads;
  for(let i = 0; i < 5; i++){ const h = src[i]; if(!h || h[2] <= 0) continue; const d = (h[0] - sx) ** 2 + (h[1] - sy) ** 2; if(d < bd){ bd = d; best = i; } } return best; }
function trefferMond(sx, sy){ if(U.netK < 0.5) return -1; let best = -1, bd = 34 * 34;
  for(let n = 0; n < U.monde.length; n++){ const h = U.monde[n]; if(!h || h[2] <= 0) continue; const d = (h[0] - sx) ** 2 + (h[1] - sy) ** 2; if(d < bd){ bd = d; best = n; } } return best; }
function trefferTuer(sx, sy){ if(U.netK < 0.5) return -1; let best = -1, bd = 36 * 36;
  for(let i = 0; i < U.tueren.length; i++){ const h = U.tueren[i]; if(!h || h[2] <= 0) continue; const d = (h[0] - sx) ** 2 + (h[1] - sy) ** 2; if(d < bd){ bd = d; best = i; } } return best; }

export function treffer(sx, sy){
  const t = trefferTuer(sx, sy); if(t >= 0) return {art: 'tuer', i: t};
  const mo = trefferMond(sx, sy); if(mo >= 0) return {art: 'mond', i: mo, mond: W.B.monde[mo]};
  const k = trefferKopf(sx, sy); if(k >= 0) return {art: 'kopf', i: k};
  if(trefferKeim(sx, sy)) return {art: 'keim', mond: W.Z.m, zelle: W.Z};
  const s = trefferSame(sx, sy); if(s >= 0) return {art: 'same', i: s, mond: W.Z.m, zelle: W.Z};
  return null;
}
const gleich = (a, b) => !!(a && b && a.art === b.art && (a.art === 'same' ? a.mond.samen[a.i]?.id === b.mond.samen[b.i]?.id : a.i === b.i) && (a.mond?.id ?? null) === (b.mond?.id ?? null));

/* ----------------------------------------------------------------- Tippen */
function tippen(sx, sy){
  const Z = W.Z; let t = treffer(sx, sy);
  // Die gewählte Ausprägung gewinnt im Umkreis von 28 px: die zweite Berührung muss nicht pixelgenau sein
  if(U.sel && U.sel.art === 'same' && Z && U.sel.mond.id === Z.m.id && (!t || t.art === 'same')){ const p = [0, 0, 0]; Z.seedPos(U.sel.i, p); const s = toScreen(p[0], p[1], p[2]);
    if(s[2] > 0 && (s[0] - sx) ** 2 + (s[1] - sy) ** 2 < 28 * 28) t = {art: 'same', i: U.sel.i, mond: Z.m, zelle: Z}; }
  // Verbinden: die zweite Ausprägung wurde gewählt
  if(U.waehlen){ const w = U.waehlen; U.waehlen = null;
    if(t && (t.art === 'same' || t.art === 'keim') && t.mond.id === w.mondId){ const nach = t.art === 'same' ? t.mond.samen[t.i].id : t.mond.keim[t.mond.keim.length - 1].id;
      if(nach !== w.von){ api.kanteFragen(w.von, nach); return; } }
    zeile('Nichts verbunden.'); return; }
  if(!t){
    if(Z && Z.S.aufzug && U.netK < 0.3){ Z.sofort(); return; }
    if(U.lese){ schliesseLese(true); U.stufe = 1; return; }
    if(U.sel){ waehle(null); return; }
    if(U.solo >= 0){ U.solo = -1; return; }
    return;
  }
  if(t.art === 'kopf'){ U.solo = U.solo === t.i ? -1 : t.i; zeile(U.solo >= 0 ? `${STIMMEN[t.i].name} allein: ihr Zweig durch alle Schichten.` : (U.netK > 0.5 ? netzSatz(W.B) : mondSatz(Z && Z.m))); return; }
  if(t.art === 'tuer'){ if(gleich(U.sel, t)){ tuerOeffnen(W.N.tueren[t.i]); return; } waehle(t, 1); return; }
  if(t.art === 'mond'){ if(gleich(U.sel, t)){ api.oeffneMond(t.i, {}); return; } waehle(t, 1); return; }
  // Same oder Keim: erste Berührung Marke, zweite Lesefläche
  if(gleich(U.sel, t)){ if(U.stufe < 2){ waehle(t, 2); } return; }
  waehle(t, U.lese ? 2 : 1);
}

/* Eine Tür in den Verbund; der Werkraum bekommt nur den lesbaren Namen des Monds mit, nie Inhalt */
function tuerOeffnen(tu){
  if(!tu || !tu.wach || !tu.adresse){ zeile(tu ? `${tu.name} ruht gerade.` : ''); return; }
  klang.tuer();
  if(tu.name === 'Werkraum'){ const n = W.namen && W.aktiv >= 0 ? W.namen[W.aktiv] : null;
    window.open(tu.adresse + (n ? '#mond=' + n : ''), '_blank', 'noopener'); zeile('Der Werkraum öffnet nur lesend. Den Mond übernimmt er, sobald Codex das eingebaut hat.'); return; }
  window.open(tu.adresse, '_blank', 'noopener');
}
/* --------------------------------------------------------------- Zeiger */
export function installiere(a){
  api = a;
  formen.pruefe();
  formen.init({absaetze, kurz, ansage, zeile, haltKnopf, behalten: (v, k) => api.formBehalten(v, k), funke(){ const p = kornWelt(U.sel); if(p) burst(p[0], p[1], p[2], SILVER, 18, 0.3, 0.7, 0.01); }});
  canvas.addEventListener('pointerdown', e => {
    if(U.fahrt){ U.netK = U.netT; U.fahrt = null; }
    try{ canvas.setPointerCapture(e.pointerId); }catch(_){} U.pp.set(e.pointerId, {x: e.clientX, y: e.clientY}); activity(); klangWake();
    if(U.pp.size === 2){ const [p, q] = [...U.pp.values()]; U.pinch0 = Math.hypot(p.x - q.x, p.y - q.y); U.zoom0 = U.zoom; U.mode = 'pinch'; setHold(false); U.bind = null; return; }
    U.mode = 'press'; U.x0 = U.x = e.clientX; U.y0 = U.y = e.clientY; U.t0 = performance.now();
    U.pressSeed = U.netK < 0.3 ? trefferSame(e.clientX, e.clientY, 14) : -1;
    U.pressW = pointerWorld(e.clientX, e.clientY, CAM.target);
  });
  canvas.addEventListener('pointermove', e => {
    U.px = e.clientX / CAM.cssW - 0.5; U.py = e.clientY / CAM.cssH - 0.5; U.pwT = W.wall; activity();
    if(!U.hinted && W.wall > 3){ U.hinted = true; U.hintUntil = W.wall + 6; }
    if(!U.pp.has(e.pointerId)){ hoverPruefen(e.clientX, e.clientY); return; }
    U.pp.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if(U.mode === 'pinch' && U.pp.size >= 2){ const [p, q] = [...U.pp.values()]; const d = Math.hypot(p.x - q.x, p.y - q.y); zoomAuf(U.zoom0 * U.pinch0 / Math.max(20, d)); return; }
    const dx = e.clientX - U.x, dy = e.clientY - U.y; U.x = e.clientX; U.y = e.clientY;
    const moved = Math.hypot(U.x - U.x0, U.y - U.y0);
    if(U.mode === 'bind'){ U.bind.x = e.clientX; U.bind.y = e.clientY; const now = performance.now(); if(now - (U.bind.tT || 0) < 40) return; U.bind.tT = now;
      const weit = Math.hypot(e.clientX - U.bind.x0, e.clientY - U.bind.y0) >= 40, s = weit ? trefferSame(e.clientX, e.clientY, 16) : -1;
      const z = s >= 0 && s !== U.bind.von ? s : -1; if(z !== U.bind.ziel){ U.bind.ziel = z; U.bind.zielT = now; } return; }
    if((U.mode === 'press' && moved > 7) || (U.mode === 'hold' && moved > 16)){ U.mode = 'drag'; setHold(false); }
    if(U.mode === 'hold' && W.Z) W.Z.S.holdP = pointerWorld(e.clientX, e.clientY, CAM.target);
    if(U.mode === 'drag'){ U.yawOff += dx * 0.0065; U.elevOff = clamp(U.elevOff - dy * 0.005, 2 * DEG - U.baseElev, 90 * DEG - U.baseElev); }
  });
  const ende = (e, cancel) => {
    U.pp.delete(e.pointerId);
    if(!cancel && U.mode === 'press' && performance.now() - U.t0 < (U.pressSeed >= 0 ? 700 : 420)) tippen(e.clientX, e.clientY);   // keine Totzone vor dem Binden
    if(U.mode === 'bind' && !cancel){ const b = U.bind; U.bind = null; const m = W.Z && W.Z.m, ruhig = b && b.ziel >= 0 && performance.now() - (b.zielT || 0) > 250;
      if(ruhig && m && m.samen[b.ziel]) api.kanteFragen(b.vonId, m.samen[b.ziel].id); else zeile('Nichts verbunden.'); }
    if(U.mode === 'hold' || cancel) setHold(false);
    if(U.pp.size === 0){ U.mode = null; U.bind = null; } activity();
  };
  canvas.addEventListener('pointerup', e => ende(e, false)); canvas.addEventListener('pointercancel', e => ende(e, true));
  canvas.addEventListener('wheel', e => { e.preventDefault(); activity();
    const f = Math.exp(e.deltaY * 0.0012);
    if(U.netK > 0.6 && f < 1){ const mo = trefferMond(e.clientX, e.clientY); if(mo >= 0 && U.zoom * f < 0.55){ U.zoom = 1; api.oeffneMond(mo, {}); return; } }
    zoomAuf(U.zoom * f); }, {passive: false});
  canvas.addEventListener('dblclick', e => { const t = treffer(e.clientX, e.clientY); if(t && t.art === 'mond') api.oeffneMond(t.i, {}); });

  addEventListener('keydown', e => {
    if(U.fahrt){ U.netK = U.netT; U.fahrt = null; if(e.key === 'Escape') return; }
    if(U.formen){ if(U.siegel){ if(e.key === 'Escape'){ e.preventDefault(); zurueck(); } return; } formen.taste(e); return; }
    if(e.target.closest && e.target.closest('.halten,.lese,.siegel') && (e.key === ' ' || e.key === 'Enter')) return;
    if(e.target.closest && e.target.closest('.lese') && /^(ArrowUp|ArrowDown|Page|Home|End)/.test(e.key)) return;   // dort scrollen sie
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key; klangWake();
    if(k === 'Escape'){ zurueck(); }
    else if(k === ' '){ e.preventDefault(); U.paused = !U.paused; zeile(U.paused ? 'Angehalten.' : ''); }
    else if(k >= '1' && k <= '5'){ const i = +k - 1; U.solo = U.solo === i ? -1 : i; ansage(U.solo >= 0 ? `${STIMMEN[i].name} allein.` : 'Alle Stimmen.'); }
    else if(k === '0'){ U.solo = -1; }
    else if(k === 's' || k === 'S'){ seite(); }
    else if(k === 'n' || k === 'N'){ api.zumNetz(); }
    else if(k === 'w' || k === 'W'){ const tu = W.N && W.N.tueren.find(x => x.name === 'Werkraum'); if(tu) tuerOeffnen(tu); else zeile('Den Werkraum gibt es hier nicht.'); }
    else if(k === 'ArrowRight' || k === 'ArrowLeft'){ e.preventDefault(); schritt(k === 'ArrowRight' ? 1 : -1); }
    else if(k === '?'){ U.hintUntil = W.wall + 8; hintEl.textContent = 'S Seite · N Netz · W Werkraum · 1–5 eine Stimme · ⌘V legt ab · Halten verbindet · Esc zurück'; }
    else if(k === 'Enter' && U.waehlen && U.sel && (U.sel.art === 'same' || U.sel.art === 'keim')){ const w = U.waehlen, nach = U.sel.art === 'same' ? U.sel.mond.samen[U.sel.i].id : U.sel.mond.keim[U.sel.mond.keim.length - 1].id;
      U.waehlen = null; if(nach !== w.von && U.sel.mond.id === w.mondId) api.kanteFragen(w.von, nach); else zeile('Nichts verbunden.'); }
    else if(k === 'Enter'){ if(U.sel){ if(U.sel.art === 'mond') api.oeffneMond(U.sel.i, {}); else if(U.sel.art === 'tuer'){ tippen(U.tueren[U.sel.i][0], U.tueren[U.sel.i][1]); } else waehle(U.sel, 2); } }
    else if(k === 'ArrowUp'){ U.elevOff = clamp(U.elevOff + 0.08, 2 * DEG - U.baseElev, 90 * DEG - U.baseElev); }
    else if(k === 'ArrowDown'){ U.elevOff = clamp(U.elevOff - 0.08, 2 * DEG - U.baseElev, 90 * DEG - U.baseElev); }
    else if((k === 'h' || k === 'H') && !U.keyHold){ U.keyHold = true; setHold(true, CAM.cssW / 2, CAM.cssH / 2); }
    activity();
  });
  addEventListener('keyup', e => { if(U.formen){ formen.tasteLos(e); return; } if((e.key === 'h' || e.key === 'H') && U.keyHold){ U.keyHold = false; setHold(false); } });
  addEventListener('blur', () => { if(U.keyHold){ U.keyHold = false; setHold(false); } if(U.mode === 'hold'){ U.mode = null; setHold(false); } });

  // Einwurf: Text einfügen oder ablegen
  addEventListener('paste', e => { if(U.formen) return; const t = e.clipboardData && e.clipboardData.getData('text/plain'); if(t && t.trim()){ e.preventDefault(); api.einwurf(t, null, null); } });
  addEventListener('dragover', e => { e.preventDefault(); activity(); });
  addEventListener('drop', async e => { e.preventDefault(); if(U.formen) return;
    const dt = e.dataTransfer; let text = '';
    if(dt.files && dt.files.length){ const f = dt.files[0];
      if(f.size > 2_000_000){ zeile('Das ist zu groß zum Ablegen.'); return; }
      if(!/^text\/|json|xml|markdown/.test(f.type) && !/\.(md|txt|markdown|json|csv|html?|xml|yaml|yml)$/i.test(f.name)){ zeile('Ablegen geht im Moment nur mit Text.'); return; }
      text = await f.text(); }
    else text = dt.getData('text/plain');
    if(text && text.trim()) api.einwurf(text, e.clientX, e.clientY); });

  // Ecken
  $('#snd').addEventListener('click', () => { const on = klangToggle(); const b = $('#snd'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', on ? 'Klang ausschalten' : 'Klang einschalten'); activity(); });
  $('#seite').addEventListener('click', () => { seite(); activity(); });
  $('#netzknopf').addEventListener('click', () => { if(U.netT > 0.5 && W.Z) api.zurZelle(); else api.zumNetz(); activity(); });
  ortEl.addEventListener('click', () => { schliesseSiegel(); U.waehlen = null; if(U.lese) schliesseLese(true); api.ortZurueck(); });   // direkt, nicht durch die Escape-Kette
  markeEl.addEventListener('click', () => { const s = U.sel || (U.hoverMarke ? U.hover : null); if(!s) return;
    if(s.art === 'mond') api.oeffneMond(s.i, {}); else if(s.art === 'tuer'){ tuerOeffnen(W.N.tueren[s.i]); }
    else if(s.art === 'kopf'){ U.solo = U.solo === s.i ? -1 : s.i; } else waehle(s, 2); });
  // Handy: die Lesefläche lässt sich am Griff nach unten wegwischen
  const griff = leseEl.querySelector('.lese-griff'); let gy = null;
  griff.addEventListener('pointerdown', e => { gy = e.clientY; try{ griff.setPointerCapture(e.pointerId); }catch(_){} });
  griff.addEventListener('pointermove', e => { if(gy != null){ leseEl.style.transition = 'none'; leseEl.style.translate = `0 ${Math.max(0, e.clientY - gy)}px`; } });
  const griffEnde = e => { if(gy == null) return; const d = e.clientY - gy; gy = null; leseEl.style.transition = ''; leseEl.style.translate = ''; if(d > 70){ schliesseLese(true); U.stufe = 1; } };
  griff.addEventListener('pointerup', griffEnde); griff.addEventListener('pointercancel', griffEnde);
  leseEl.querySelector('.lese-zu').addEventListener('click', () => { schliesseLese(true); U.stufe = 1; canvas.focus({preventScroll: true}); });
}

function setHold(on, sx, sy){ const Z = W.Z; if(!Z) return; if(on){ Z.S.holdT = 1; Z.S.holdP = pointerWorld(sx, sy, CAM.target); } else Z.S.holdT = 0; }
function zoomAuf(z){
  if(U.netK < 0.4 && z > 2.3 && W.Z){ U.zoom = 1; api.zumNetz(); return; }
  U.zoom = clamp(z, 0.35, 2.6);
}
function seite(){ if(U.netT > 0.5) return; U.kelchT = U.kelchT > 0.5 ? 0 : 1; U.elevOff = 0;
  const b = $('#seite'); b.setAttribute('aria-pressed', U.kelchT > 0.5 ? 'true' : 'false'); b.setAttribute('aria-label', U.kelchT > 0.5 ? 'Von oben: das Werk' : 'Von der Seite: Geschichte');
  zeile(U.kelchT > 0.5 ? 'Von der Seite: die Geschichte. Unten der Keim, oben das Jüngste.' : mondSatz(W.Z && W.Z.m)); }
export function zurueck(){
  if(U.siegel){ const l = U.siegel.lassen; schliesseSiegel(); l && l(); return; }
  if(U.waehlen){ U.waehlen = null; zeile(mondSatz(W.Z && W.Z.m)); return; }
  if(U.lese){ schliesseLese(true); U.stufe = 1; return; }
  if(U.sel){ waehle(null); return; }
  if(U.solo >= 0){ U.solo = -1; return; }
  if(U.kelchT > 0.5){ seite(); return; }
  api.zurueck();
}
function schritt(d){
  if(U.netK > 0.5){ const n = W.B.monde.length; let i = U.sel && U.sel.art === 'mond' ? U.sel.i + d : (d > 0 ? 0 : n - 1); i = (i + n) % n; waehle({art: 'mond', i, mond: W.B.monde[i]}, 1); const [t, s] = markeFuer(U.sel); ansage(t + '. ' + s); return; }
  const Z = W.Z; if(!Z) return; const n = Z.m.samen.length;
  if(!n){ waehle({art: 'keim', mond: Z.m, zelle: Z}, 1); return; }
  let i = U.sel && U.sel.art === 'same' ? U.sel.i + d : (d > 0 ? 0 : n - 1);
  while(U.solo >= 0 && i >= 0 && i < n && Z.m.samen[i].stimme !== U.solo) i += d > 0 ? 1 : -1;   // mit einer Stimme allein: nur durch ihren Zweig
  if(i < 0 || i >= n){ waehle({art: 'keim', mond: Z.m, zelle: Z}, U.lese ? 2 : 1); ansage('Ausgangsfrage: ' + Z.m.keimSatz); return; }
  waehle({art: 'same', i, mond: Z.m, zelle: Z}, U.lese ? 2 : 1);
  if(!U.lese){ const [t, s] = markeFuer(U.sel); ansage(t + '. ' + s); }
}
let hoverT = 0;
function hoverPruefen(sx, sy){ const now = performance.now(); if(now - hoverT < 60) return; hoverT = now;
  const t = treffer(sx, sy); U.hover = t; canvas.classList.toggle('zeigt', !!t);
  if(!U.sel && !U.namenAn && !U.siegel && t && (t.art === 'mond' || t.art === 'tuer' || t.art === 'same' || t.art === 'keim' || t.art === 'kopf')){ const [a, b] = markeFuer(t); zeigeMarke(a, b); U.hoverMarke = true; }
  else if(!U.sel && U.hoverMarke){ verbirgMarke(); U.hoverMarke = false; } }

/* Lage der Marke und der leisen Anzeigen, jedes Bild */
export function uiFrame(){
  const sel = U.sel || (U.hoverMarke ? U.hover : null);
  if(sel && !markeEl.hidden){ let p = null; const Z = W.Z;
    if(sel.art === 'same' && Z && sel.mond === Z.m){ Z.seedPos(sel.i, TMP); p = toScreen(TMP[0], TMP[1], TMP[2]); }
    else if(sel.art === 'keim' && Z){ p = toScreen(Z.origin[0], Z.origin[1], Z.origin[2]); }
    else if(sel.art === 'mond'){ p = U.monde[sel.i]; }
    else if(sel.art === 'tuer'){ p = U.tueren[sel.i]; }
    else if(sel.art === 'kopf'){ p = (U.netK > 0.6 ? U.bigHeads : U.heads)[sel.i]; }
    if(p && p[2] > 0) setzeMarke(p[0], p[1]); }
  hintEl.classList.toggle('on', W.wall < U.hintUntil && !U.lese && !U.siegel);
  if(W.wall - U.last > 3.2 && !U.paused){ document.body.classList.remove('active'); if(W.wall > 8) document.body.classList.add('dim'); }
}
export {klang, AU, burst, SILVER, REIFE};
