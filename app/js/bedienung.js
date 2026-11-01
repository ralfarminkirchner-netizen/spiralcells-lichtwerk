/* =====================================================================
   BEDIENUNG — Tippen entfaltet eine Stufe (Marke am Licht → Lesefläche),
   Ziehen dreht, Halten verbindet, ⌘V oder Ablegen wirft Material ein.
   Jede folgenreiche Handlung braucht ein Halten im Bild. Keine Formulare.
   ===================================================================== */
import {innenPlan, ABTEILUNG} from './innen.js';
import {zeichneText} from './textgrund.js';
import {clamp, sstep, DEG, CAM, toScreen, pointerWorld, SILVER} from './licht.js';
import {U, W} from './welt.js';
import {STIMMEN, MENSCH, menschlich, kurz, datum, nameVon, MODUS_SATZ, STATUS_SATZ, TYP_SATZ, URTEIL_SATZ, BELEG_SATZ, REIFE} from './daten.js';
import {burst} from './zelle.js';
import {AU, toggle as klangToggle, wake as klangWake, klang} from './klang.js';
import * as schreib from './schreiben.js';
import * as formen from './formen.js';
import * as stoff from './stoff.js';
import {teilnahmeMarke, spurMarke, alsSatz, zellSatz, STAND_SATZ} from './alsformen.js';
import {quellAdresse, quellFassung, quellName} from './quelle.js';
import {werkFarbe} from './verschraenkung.js';

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
  const grund = mondSatzGrund(m), A = W.N && W.N.als, i = m && W.B ? W.B.monde.indexOf(m) : -1, als = A && i >= 0 ? zellSatz(A, i) : '';
  return als ? grund + ' ' + als : grund;
}
function mondSatzGrund(m){
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
  const N = W.N, d = N && N.baum ? N.baum.daecher.length : 0;
  if(d){ const ohne = N.baum.ohne.length;
    return `Die Zentrale in der Mitte, ${zahlwort(d)} ${d === 1 ? 'Dach' : 'Dächer'} darum` + (ohne ? `, ${zahlwort(ohne)} Werke noch ohne Dach.` : '.') + (N.baum.bestaetigt ? '' : ' Diese Ordnung ist ein Vorschlag, noch nicht von dir bestätigt.'); }
  const mit = B.monde.filter(m => m.stimmen.length).length;
  return `${B.monde.length} Werke, noch ohne Ordnung. In ${zahlwort(mit)} sprechen die Stimmen.`;
}

/* ---------------------------------------------------------------- Marke */
export function zeigeMarke(titel, satz, knoepfe){ markeEl.querySelector('.marke-titel').textContent = titel; markeEl.querySelector('.marke-satz').textContent = satz;
  const tun = markeEl.querySelector('.marke-tun'); if(tun){ tun.innerHTML = ''; for(const k of knoepfe || []) tun.append(k); tun.hidden = !(knoepfe && knoepfe.length); }
  markeEl.hidden = false; markeW = markeEl.offsetWidth || 200; }
/* An einem gewählten Werk mit Alsformen: zwei leise Wege, auch ohne Tastatur */
function alsKnoepfe(sel){
  const A = W.N && W.N.als, hier = A && sel && U.als && U.als.gi === sel.i ? U.als.fokus : null;
  if(!A || !sel || sel.art !== 'mond' || U.netK < 0.5 || (!A.hat(sel.i) && !hier)) return null;
  const k = (text, fokus) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'marke-knopf'; b.textContent = text;
    b.addEventListener('pointerdown', e => e.stopPropagation()); b.addEventListener('click', e => { e.stopPropagation(); typeof fokus === 'function' ? fokus() : api.alsFokus(sel.i, fokus); }); return b; };
  const out = [];
  if(A.proGegenstand.has(sel.i) && hier !== 'mond') out.push(k('Zusammenhänge zeigen', 'mond'));
  if((A.entstehung.has(sel.i) || A.proKontext.has(sel.i)) && hier !== 'planet') out.push(k('Als Planet: Entstehung', 'planet'));
  if(hier && !A.proGegenstand.has(sel.i) && hier !== 'mond') out.push(k('Als Mond', 'mond'));
  // Im Blick auf den Gegenstand: ihn in einen weiteren Zusammenhang stellen oder seine Entstehung belegen (immer mit Halten)
  if(hier === 'mond') out.push(k('In einen Zusammenhang stellen …', () => api.teilnahmeWaehlen(sel.i)));
  if(hier === 'planet') out.push(k('Spur eintragen …', () => api.spurFragen(sel.i, {})));
  return out; }
export function verbirgMarke(){ markeEl.hidden = true; }
let markeW = 200;
export function setzeMarke(sx, sy){
  const w = markeW, links = sx > CAM.cssW - w - 40;
  markeEl.classList.toggle('links', links);
  const x = clamp(links ? sx - w - 22 : sx + 22, 12, Math.max(12, CAM.cssW - w - 12)), y = clamp(sy - 16, 60, CAM.cssH - 140);
  markeEl.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
}

export function markeFuer(sel){
  const m = sel.mond;
  if(sel.art === 'same'){ const s = m.samen[sel.i]; const teile = [nameVon(W.B.agenten.get(s.fassung.author_id)), datum(s.zeit)];
    if(s.form) teile.push('Form ohne Modell'); else { if(s.modus) teile.push(MODUS_SATZ[s.modus]); if(s.status !== 'entwurf') teile.push(STATUS_SATZ[s.status]); }
    const her = herkunftSatz(sel); if(her) teile.push(her);
    if(U.stufe < 2 && gleich(U.sel, sel)) teile.push('tippen liest');
    return [kurz(s.label, 96), teile.join(' · ')]; }
  if(sel.art === 'keim') return [m.keimSatz, 'Ausgangsfrage' + (m.keimKristall ? ' · Grundformation' : '') + (m.keim.length > 1 ? ` · ${m.keim.length} Fassungen` : '') + (gleich(U.sel, sel) ? ' · tippen liest' : '')];
  if(sel.art === 'kopf'){ const v = STIMMEN[sel.i]; return [v.name, `${v.rolle} · ${v.schrift} · tippen zeigt ihre Spur allein`]; }
  if(sel.art === 'mond'){ const nv = m.stimmen.length;
    const teile = [nv ? `${Zahlwort(nv)} ${nv === 1 ? 'Stimme' : 'Stimmen'}` : 'ohne Stimmen', `${m.samen.length + m.keim.length} ${m.samen.length + m.keim.length === 1 ? 'Ausprägung' : 'Ausprägungen'}`, m.reife];
    const A = W.N && W.N.als; if(A && A.hat(sel.i)) teile.push(alsSatz(A, sel.i));
    if(gleich(U.sel, sel)) teile.push('tippen öffnet');
    return [m.titel, teile.join(' · ')]; }
  if(sel.art === 'echo' && W.N && W.N.als && W.N.als.teilnahmen[sel.i]){ const [t, s] = teilnahmeMarke(W.N.als, W.B, sel.i); return [t, s + (gleich(U.sel, sel) && U.stufe < 2 ? ' · tippen liest' : '')]; }
  if(sel.art === 'spur' && W.N && W.N.als && W.N.als.spuren[sel.i]){ const [t, s] = spurMarke(W.N.als, sel.i); return [t, s + (gleich(U.sel, sel) && U.stufe < 2 ? ' · tippen liest' : '')]; }
  if(sel.art === 'tuer'){ const t = W.N.tueren[sel.i]; return [t.satz, t.wach ? 'wach · noch einmal tippen öffnet' : 'ruht gerade']; }
  if(sel.art === 'mitte'){ const b = W.N.baum, n = W.N.werkeIn('mitte').length; return [b.mitte.name || 'Zentrale', [`die Mitte · ${n} ${n === 1 ? 'Werk' : 'Werke'} · ${b.daecher.length} ${b.daecher.length === 1 ? 'Dach' : 'Dächer'} darum`, gleich(U.sel, sel) ? 'tippen fährt hinein' : ''].filter(Boolean).join(' · ')]; }
  if(sel.art === 'ohne'){ const n = W.N.werkeIn('ohne').length; return ['ohne Dach', [`${n} ${n === 1 ? 'Werk' : 'Werke'}, noch keinem Dach belegt zugeordnet`, gleich(U.sel, sel) ? 'tippen fährt hinein' : ''].filter(Boolean).join(' · ')]; }
  if(sel.art === 'dach'){ const d = W.N.daecher[sel.i], n = d.bereiche.reduce((a, x) => a + x.werke.length, 0), kn = W.N.knospenIn(sel.i), fi = W.N.innen.get(sel.i) || 0;
    const werke = `${n} ${n === 1 ? 'Werk' : 'Werke'} in ${d.bereiche.length} ${d.bereiche.length === 1 ? 'Bereich' : 'Bereichen'}` + (kn ? `, ${kn} davon nur mit ihrer Ausgangsfassung` : '');
    return [d.name, [d.satz, werke, fi ? `${fi} ${fi === 1 ? 'Verbindung' : 'Verbindungen'} darin` : '', gleich(U.sel, sel) ? 'tippen fährt hinein' : ''].filter(Boolean).join(' · ')]; }
  if(sel.art === 'faden'){ const f = W.N.faeden[sel.i], A = W.B.monde[f.von], Bm = W.B.monde[f.nach];
    const satz = {'remixt-aus': `„${kurz(Bm.titel, 40)}“ übernimmt Material aus „${kurz(A.titel, 40)}“`, 'erweitert': `„${kurz(Bm.titel, 40)}“ erweitert „${kurz(A.titel, 40)}“`}[f.typ]
      || `„${kurz(A.titel, 40)}“ ${({'verweist-auf': 'verweist auf', 'testet': 'prüft', 'widerspricht': 'widerspricht', 'gehört-zu': 'gehört zu'})[f.typ] || 'hängt zusammen mit'} „${kurz(Bm.titel, 40)}“`;
    // Die gewählte Verbindung des Bündels: welcher Teil wohin geht, wozu, unter welchen Grenzen
    const k = gleich(U.sel, sel) ? Math.min(U.fadenK || 0, f.kanten.length - 1) : 0, e = f.kanten[k], u = e.usage, teile = [];
    if(f.kanten.length > 1) teile.push(`Verbindung ${k + 1} von ${f.kanten.length}` + (gleich(U.sel, sel) ? ' · ←/→ wählt' : ''));
    if(u){ const q = t => `„${kurz(menschlich(t), 50)}“`; if(u.from_part || u.to_part) teile.push([u.from_part && q(u.from_part), u.to_part && q(u.to_part)].filter(Boolean).join(' → ')); if(u.purpose) teile.push(kurz(menschlich(u.purpose), 80)); }
    else if(f.verwendung) teile.push(`${f.verwendung} mit beschriebener Verwendung`);
    if(gleich(U.sel, sel)) teile.push(u && u.to_part ? 'tippen liest die Stelle' : 'tippen folgt'); return [satz, teile.join(' · ')]; }
  if(sel.art === 'buendel'){ const x = W.N.buendel[sel.i], name = b => b === 'mitte' ? W.N.baum.mitte.name : b === 'ohne' ? 'ohne Dach' : W.N.daecher[b].name;
    const teile = [`${x.faeden.length} ${x.faeden.length === 1 ? 'Faden' : 'Fäden'}`, `${x.kanten} ${x.kanten === 1 ? 'Verbindung' : 'Verbindungen'}`]; if(x.verwendung) teile.push(`${x.verwendung} mit beschriebener Verwendung`);
    if(gleich(U.sel, sel)) teile.push(`tippen fährt in ${name(x.von)}`);
    return [`${name(x.von)} → ${name(x.nach)}`, teile.join(' · ')]; }
  return ['', ''];
}

/* Woher eine Ausprägung kommt und wo sie in ihrem Zweig steht: nur, was belegt ist */
export function herkunftSatz(sel){
  const Z = sel.zelle || W.Z; if(!Z || !Z.W || Z.m !== sel.mond) return '';
  const W2 = Z.W, i = sel.i, p = W2.eltern[i], art = W2.art[i], s = sel.mond.samen;
  const name = j => j >= 0 ? `„${kurz(s[j].label, 34)}“` : '';
  const zweig = W2.zweige[W2.zweigVon[i]].length, stelle = zweig > 1 ? `${W2.reihe[i]}. von ${zweig} im Zweig` : '';
  const satz = {kette: '', keim: 'aus der Ausgangsfrage', frei: 'ohne belegte Herkunft', form: `Form von ${name(p)}`,
    gabel: `fortgesetzt aus ${name(p)}${typeof s[p]?.stimme === 'number' ? ' (' + STIMMEN[s[p].stimme].name + ')' : ''}`, reihe: 'Teil einer Übernahme, keine Entwicklung'}[art] || '';
  // Fortsetzungen sind nur belegte Abstammung; eine Übernahmereihe und behaltene Formen heißen, was sie sind
  const ks = W2.kinder[i], fort = ks.filter(k => W2.art[k] === 'kette' || W2.art[k] === 'gabel').length, reihe = ks.filter(k => W2.art[k] === 'reihe').length, formen = ks.filter(k => W2.art[k] === 'form').length;
  const ab = [fort > 1 ? `${fort} Fortsetzungen` : '', reihe > 1 ? `${reihe} übernommene Fassungen` : '', formen ? `${formen} ${formen === 1 ? 'Form' : 'Formen'}` : ''].filter(Boolean).join(' · ');
  // In einem großen Übernahmefächer: die Familie (Namensanfang) und die Stelle darin, zur Orientierung unter vielen Fassungen
  const fam = W2.familie && W2.familie[i], glieder = fam && p >= 0 ? W2.kinder[p].filter(k => W2.familie[k] === fam) : [];
  const familie = glieder.length > 1 ? `${fam} · ${glieder.indexOf(i) + 1} von ${glieder.length}` : '';
  return [satz, familie, stelle, ab].filter(Boolean).join(' · ');
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
  if(!gleicheFassung && !stoff.offen()) ansage(`${leseEl.querySelector('.lese-wer').textContent}: ${leseEl.querySelector('.lese-titel').textContent}. Lesefläche offen, Escape schließt.`);
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
  tun.append(stillerKnopf('Ganz lesen', 'Material, Vergleich, Herkunft', () => api.oeffneStoff(sel)));
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

/* ------------------------------------------------- Lesefläche: Alsformen
   Eine Teilnahme oder eine Spur der Entstehung, im selben Licht wie eine Ausprägung.
   Nur lesen: gebundene Fassungen, Zusammenhang, Gegenstand und die Originalstelle sind Wege, keine Schalter. */
const hexAus = c => '#' + c.map(x => Math.round(Math.pow(clamp(x, 0, 1), 1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');
const SPUR_FARBE = {origin: '#fff1d6', counterevidence: '#c4786a', interpretation: '#e6ecff', gap: '#d8cfc0'};
function wegZeile(art, text, tun){ const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
  b.innerHTML = `<span class="art">${esc(art)}</span>${esc(text)}`; b.addEventListener('click', tun); li.append(b); return li; }
/* Die Tür zur gebundenen Originalstelle; ohne geprüften Weg nur der ehrliche Satz */
function quellTuer(ref, ids){
  if(!ref) return {knopf: null, satz: ''};
  // Nennt die gespeicherte Quelle selbst eine Fassung, gehört sie zu den Kandidaten; quellFassung prüft sie wie jede andere
  let genannt = null; try{ genannt = new URL(ref.locator).searchParams.get('fassung'); }catch(_){}
  if(genannt && W.B.fassungen.has(genannt)) ids = [...new Set([...ids, genannt])];
  const vid = quellFassung(ref, ids, W.B.fassungen), url = vid ? quellAdresse(ref, vid, W.B.fassungen.get(vid)) : null;
  if(!url) return {knopf: null, satz: 'Die Quellenbindung ist gespeichert. Ein geprüfter Weg zur Originalstelle ist dafür nicht hinterlegt.'};
  const a = document.createElement('a'); a.className = 'halten still'; a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  a.innerHTML = `<span>Gebundene Originalstelle öffnen ↗<small>${esc(quellName(ref))}, genaue Passage und Fassung</small></span>`; return {knopf: a, satz: ''}; }
function stilleWahl(text, unter, tun){ const b = document.createElement('button'); b.type = 'button'; b.className = 'halten still'; b.innerHTML = `<span>${roh(text)}${unter ? `<small>${roh(unter)}</small>` : ''}</span>`; b.addEventListener('click', tun); return b; }
function mondDerFassung(v){ const id = W.B.werkVon(v.id); return id ? W.B.monde.findIndex(m => m.id === id) : -1; }
function oeffneLeseAls(sel){
  const A = W.N && W.N.als; if(!A) return;
  const key = sel.art + ':' + sel.i, gleicheStelle = !leseEl.hidden && leseV === key, scroll = leseEl.scrollTop, fokusInnen = leseEl.contains(document.activeElement);
  const ul = leseEl.querySelector('.lese-faeden'), tun = leseEl.querySelector('.lese-tun'); stoppeHalten(tun);
  let wer = '', html = '', zeilen = [], rohText = '', titel = '';
  if(sel.art === 'echo'){
    const t = A.teilnahmen[sel.i]; if(!t) return; const gm = W.B.monde[t.gegenstand], km = W.B.monde[t.kontext];
    ul.innerHTML = ''; tun.innerHTML = ''; leseV = key; wer = 'Teilnahme'; titel = `„${kurz(gm.titel, 110)}“ als ${t.rolle}`;
    leseEl.querySelector('.lese-punkt').style.color = t.stand === 'withdrawn' ? '#c4786a' : hexAus(werkFarbe(W.N, t.gegenstand));
    leseEl.querySelector('.lese-wann').textContent = datum(t.wann);
    leseEl.querySelector('.lese-art').textContent = [`in „${kurz(km.titel, 80)}“`, STAND_SATZ[t.stand], t.fassung ? (t.bindung === 'latest' ? 'jeweils aktuelle Fassung' : 'fest an eine Fassung gebunden') : 'ohne lesbare Fassung'].join(' · ');
    ul.append(wegZeile('der Gegenstand', `„${kurz(gm.titel, 80)}“`, () => api.alsOeffne(t.gegenstand, null)));
    ul.append(wegZeile('der Zusammenhang', `„${kurz(km.titel, 80)}“`, () => api.alsOeffne(t.kontext, null)));
    if(t.fassung){ const fm = mondDerFassung(t.fassung); ul.append(wegZeile(t.bindung === 'latest' ? 'jeweils aktuelle Fassung' : 'gebundene Fassung', `„${kurz(t.fassung.label || 'Unbenannte Fassung', 80)}“`, () => { if(fm >= 0) api.alsOeffne(fm, t.fassung.id); })); }
    const teile = [];
    if(t.stand === 'withdrawn' && t.ruecknahme) teile.push(`<p><strong>Zurückgenommen</strong> am ${esc(datum(t.ruecknahme.wann))}, eingetragen von ${esc(t.ruecknahme.wer)}.</p>`, absaetze(t.ruecknahme.grund), '<h3>Ursprüngliche Begründung</h3>');
    teile.push(absaetze(t.grund));
    if(t.gueltig) teile.push(`<p class="zitat">Gilt: ${esc(t.gueltig)}</p>`);
    if(t.abgeloest) teile.push(`<p class="leise">Diese Eintragung löst eine frühere vom ${esc(datum(t.abgeloest))} ab. Beide bleiben erhalten.</p>`);
    teile.push(`<p class="leise">Eingetragen von ${esc(t.wer)}${t.modell ? ' als Modellbeitrag. Eine menschliche Bestätigung folgt daraus nicht.' : '.'} Die Rolle gilt in diesem Zusammenhang; der Gegenstand bleibt derselbe, einmal gespeichert.</p>`);
    const q = quellTuer(t.quelle, t.fassung ? [t.fassung.id] : []); if(q.satz) teile.push(`<p class="leise">${esc(q.satz)}</p>`);
    html = teile.join('');
    const hier = U.als ? U.als.gi + ':' + U.als.fokus : '';
    if(hier !== t.gegenstand + ':mond') tun.append(stilleWahl('Alle Zusammenhänge', 'der Gegenstand als Mond', () => { schliesseLese(true); api.alsFokus(t.gegenstand, 'mond'); }));
    if(hier !== t.kontext + ':planet') tun.append(stilleWahl('Der Zusammenhang als Planet', 'was um ihn kreist, woraus er wurde', () => { schliesseLese(true); api.alsFokus(t.kontext, 'planet'); }));
    if(q.knopf) tun.append(q.knopf);
    if(t.stand !== 'withdrawn') tun.append(stilleWahl('Zurücknehmen …', 'mit Grund; die Teilnahme bleibt als Asche', () => { schliesseLese(true); api.teilnahmeZurueck(t); }));
    zeilen = [['Teilnahme', t.id], ['Gegenstand', gm.id], ['Zusammenhang', km.id], ['Fassung', t.roh.variant_id], ['Bindung', t.roh.version_binding], ['Rolle (gespeichert)', t.roh.role], ['Eintragungen', t.kette.map(x => `${x.id} (${x.status}, ${x.created_at})`).join(' → ')]];
    rohText = JSON.stringify(t.kette, null, 2);
  } else {
    const s = A.spuren[sel.i]; if(!s) return; const wm = W.B.monde[s.werk];
    ul.innerHTML = ''; tun.innerHTML = ''; leseV = key; wer = 'Entstehung'; titel = s.titel;
    leseEl.querySelector('.lese-punkt').style.color = SPUR_FARBE[s.art] || '#fff6e0';
    leseEl.querySelector('.lese-wann').textContent = 'aufgezeichnet ' + s.aufgezeichnet.satz;
    leseEl.querySelector('.lese-art').textContent = [s.artWort, `in „${kurz(wm.titel, 70)}“`, s.stand === 'documented' ? 'dokumentiert' : 'vorgeschlagen, nicht bestätigt'].join(' · ');
    for(const f of s.fassungen){ const fm = mondDerFassung(f); ul.append(wegZeile(fm >= 0 && fm !== s.werk ? `Fassung in „${kurz(W.B.monde[fm].titel, 34)}“` : 'gebundene Fassung', `„${kurz(f.label || 'Unbenannte Fassung', 80)}“`, () => { if(fm >= 0) api.alsOeffne(fm, f.id); })); }
    for(const j of s.widerspricht) ul.append(wegZeile('widerspricht', `„${kurz(A.spuren[j].titel, 80)}“`, () => waehle({art: 'spur', i: j}, 2)));
    for(const j of s.widersprochen) ul.append(wegZeile('widersprochen von', `„${kurz(A.spuren[j].titel, 80)}“`, () => waehle({art: 'spur', i: j}, 2)));
    const teile = [absaetze(s.text), '<h3>Drei Zeiten</h3>',
      `<p>Ereigniszeit: ${s.ereignis.art === 'offen' ? 'offen. Eine spätere Eintragung datiert das Geschehen nicht zurück.' : esc(s.ereignis.satz)}</p>`,
      `<p>Aufgezeichnet: ${esc(s.aufgezeichnet.satz)}</p>`, `<p>Gedeutet: ${s.gedeutet.art === 'offen' ? 'keine eigene Deutungszeit' : esc(s.gedeutet.satz)}</p>`];
    if(s.bedingungen.length) teile.push('<h3>Bedingungen</h3>', ...s.bedingungen.map(b => `<p>· ${zier(b)}</p>`));
    teile.push(`<p class="leise">Eingetragen von ${esc(s.wer)}${s.modell ? ' als Modellbeitrag. Eine menschliche Bestätigung folgt daraus nicht.' : '.'} Die Spur dokumentiert; sie behauptet keinen zwangsläufigen Verlauf.</p>`);
    const q = quellTuer(s.quelle, s.fassungen.map(f => f.id)); if(q.satz) teile.push(`<p class="leise">${esc(q.satz)}</p>`);
    html = teile.join('');
    if(!(U.als && U.als.gi === s.werk && U.als.fokus === 'planet')) tun.append(stilleWahl('Die ganze Entstehung', 'das Werk als Planet', () => { schliesseLese(true); api.alsFokus(s.werk, 'planet'); }));
    if(q.knopf) tun.append(q.knopf);
    tun.append(stilleWahl('Gegenbefund eintragen …', 'widerspricht dieser Spur, löscht sie nicht', () => { schliesseLese(true); api.spurFragen(s.werk, {art: 'counterevidence', widerspricht: s}); }));
    zeilen = [['Spur', s.id], ['Werk', wm.id], ['Art (gespeichert)', s.roh.kind], ['Status', s.roh.status], ['Fassungen', (s.roh.variant_ids || []).join(', ') || '—'],
      ['Ereigniszeit', s.roh.event_time || '—'], ['aufgezeichnet', s.roh.recorded_at], ['gedeutet', s.roh.interpretation_time || '—'], ['widerspricht', (s.roh.contradicts_event_ids || []).join(', ') || '—']];
    rohText = JSON.stringify(s.roh, null, 2);
  }
  leseEl.querySelector('.lese-wer').textContent = wer;
  leseEl.querySelector('.lese-titel').textContent = titel;
  leseEl.querySelector('.lese-text').innerHTML = html;
  const det = leseEl.querySelector('.technik'); det.open = false;   // Technische Details: geschlossen, öffnen nie von selbst
  det.querySelector('.technik-liste').innerHTML = zeilen.map(([k, w]) => `<dt>${roh(k)}</dt><dd>${roh(w)}</dd>`).join('');
  det.querySelector('.technik-roh').textContent = rohText;
  leseEl.hidden = false; U.lese = true; document.body.classList.add('lesend');
  leseEl.scrollTop = gleicheStelle ? scroll : 0;
  if(!gleicheStelle || fokusInnen) leseEl.focus({preventScroll: true});
  verbirgMarke();
  if(!gleicheStelle) ansage(`${wer}: ${titel}. Lesefläche offen, Escape schließt.`);
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
  setTimeout(() => { const f = w.querySelector('textarea, input') || w.querySelector('button'); f && f.focus({preventScroll: true}); }, 60);
}
/* Ein leises Feld im Siegel: Begründung, Titel, Text. Die Beschriftung bleibt sichtbar, nicht nur als Platzhalter */
export function siegelFeld(beschriftung, mehrzeilig, wert = ''){
  const l = document.createElement('label'); l.className = 'siegel-feld';
  const f = document.createElement(mehrzeilig ? 'textarea' : 'input'); if(!mehrzeilig) f.type = 'text'; else f.rows = 3;
  f.value = wert; f.maxLength = mehrzeilig ? 4000 : 180;
  // Tippen und Einfügen gehören dem Feld: kein Tastenweg im Bild, kein Einwurf aus der Zwischenablage. Escape lässt das Siegel.
  f.addEventListener('keydown', e => { if(e.key !== 'Escape') e.stopPropagation(); }); f.addEventListener('paste', e => e.stopPropagation());
  const s = document.createElement('span'); s.textContent = beschriftung; l.append(s, f); return {el: l, wert: () => f.value.trim()};
}
/* Eine Wahl unter mehreren (Rolle, Spurart): eine ist gewählt, die Auswahl bleibt sichtbar */
export function siegelWahl(optionen, start){
  const el = document.createElement('div'); el.className = 'siegel-optionen'; el.setAttribute('role', 'radiogroup'); let gewaehlt = start ?? null;
  for(const [wert, text] of optionen){ const b = document.createElement('button'); b.type = 'button'; b.className = 'siegel-option'; b.textContent = text;
    b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(wert === gewaehlt));
    b.addEventListener('click', () => { gewaehlt = wert; el.querySelectorAll('.siegel-option').forEach(x => x.setAttribute('aria-checked', String(x === b))); }); el.append(b); }
  return {el, wert: () => gewaehlt};
}
export function stoppeHalten(wurzel){ (wurzel || document).querySelectorAll('.halten.drueckt').forEach(b => b.dispatchEvent(new Event('pointercancel'))); }
export function schliesseSiegel(){ stoppeHalten(siegelEl); const innen = siegelEl.contains(document.activeElement) || document.activeElement === document.body; siegelEl.hidden = true; U.siegel = null;
  if(innen) (stoff.offen() ? document.querySelector('#stoff .stoff-flaeche') : U.lese ? leseEl : canvas).focus({preventScroll: true}); }

/* ------------------------------------------------------------ Auswahl */
export function waehle(sel, stufe){
  if(!(sel && sel.art === 'faden' && U.sel && U.sel.art === 'faden' && U.sel.i === sel.i)) U.fadenK = 0;   // ein anderer Faden beginnt bei seiner ersten Verbindung
  U.sel = sel; U.stufe = sel ? (stufe || 1) : 0;
  U.linkedSeeds = null;
  if(sel && sel.art === 'same'){ const m = sel.mond, id = m.samen[sel.i].id, idx = new Map(m.samen.map((s, i) => [s.id, i])), set = new Set();
    for(const f of m.faeden){ if(f.von === id && idx.has(f.nach)) set.add(idx.get(f.nach)); if(f.nach === id && idx.has(f.von)) set.add(idx.get(f.von)); }
    U.linkedSeeds = set; }
  if(!sel){ verbirgMarke(); schliesseLese(); return; }
  const [t, s] = markeFuer(sel); zeigeMarke(t, s, alsKnoepfe(sel)); if(U.stufe < 2) ansage(t + '. ' + s);
  if(U.stufe >= 2 && (sel.art === 'same' || sel.art === 'keim')) oeffneLese(sel);
  else if(U.stufe >= 2 && (sel.art === 'echo' || sel.art === 'spur')) oeffneLeseAls(sel);
  else if(U.lese) schliesseLese(true);
  if(api && (sel.art === 'same' || sel.art === 'keim')) api.merkeOrt();
}

/* --------------------------------------------------------------- Treffer */
const TMP = [0, 0, 0];
function kornWelt(sel){ const Z = W.Z; if(!sel || !Z || sel.mond !== Z.m) return null; const p = [0, 0, 0];
  if(sel.art === 'same') Z.seedPos(sel.i, p); else if(sel.art === 'keim') Z.keimPos(p); else return null; return p; }
function kornAufSchirm(sel){ const p = kornWelt(sel); if(!p) return null; const s = toScreen(p[0], p[1], p[2]); return s[2] > 0 ? s : null; }
export function trefferSame(sx, sy, maxPx = 16){
  const Z = W.Z; if(!Z || U.netK > 0.4) return -1;
  // Bei vielen Fassungen überlappen die Blätter: dann rastet die Wahl auf die Mitte eines Blatts ein, nicht auf ein zufälliges Einzelkorn
  if(Z.m.samen.length > 60){ let best = -1, bd = (maxPx * 1.6) ** 2;
    for(let i = 0; i < Z.m.samen.length; i++){ Z.mittePos(i, TMP); const s = toScreen(TMP[0], TMP[1], TMP[2]); if(s[2] <= 0) continue;
      const d = (s[0] - sx) ** 2 + (s[1] - sy) ** 2; if(d < bd){ bd = d; best = i; } }
    return best; }
  let best = -1, bd = maxPx * maxPx; const step = 1;
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

function trefferSchirm(liste, sx, sy, r){ if(U.netK < 0.5) return -1; let best = -1, bd = r * r;
  for(let i = 0; i < liste.length; i++){ const h = liste[i]; if(!h || h[2] <= 0) continue; const d = (h[0] - sx) ** 2 + (h[1] - sy) ** 2; if(d < bd){ bd = d; best = i; } } return best; }
/* Die Namen der Bezirke sind anfassbar: wer auf „FASKA“ tippt, meint FASKA */
function trefferName(sx, sy){ if(U.netK < 0.5 || !W.N) return null; const el = document.getElementById('dachnamen'); if(!el) return null; const nd = W.N.daecher.length;
  for(let j = 0; j < el.children.length; j++){ const s = el.children[j]; if(Number(s.style.opacity || 0) < 0.15) continue; const r = s.getBoundingClientRect();
    if(sx >= r.left - 8 && sx <= r.right + 8 && sy >= r.top - 8 && sy <= r.bottom + 8) return j === 0 ? {art: 'mitte'} : j <= nd ? {art: 'dach', i: j - 1} : {art: 'ohne'}; }
  return null; }
export function treffer(sx, sy){
  const na = trefferName(sx, sy); if(na) return na;
  if(U.netK >= 0.5){   // im Netz: das Nächstliegende gewinnt, gleich welcher Art
    const kand = [], d2 = h => h && h[2] > 0 ? (h[0] - sx) ** 2 + (h[1] - sy) ** 2 : Infinity, nimm = (h, r, x) => { const d = d2(h); if(d < r * r) kand.push([d / (r * r), x]); };
    U.tueren.forEach((h, i) => nimm(h, 30, {art: 'tuer', i}));
    U.monde.forEach((h, i) => nimm(h, 30, {art: 'mond', i, mond: W.B.monde[i]}));
    U.knoten.forEach((h, i) => nimm(h, 26, {art: 'faden', i}));
    U.echos.forEach((h, i) => nimm(h, 26, {art: 'echo', i}));   // ein Gegenstand an einem anderen Werk
    U.spuren.forEach((h, i) => nimm(h, 26, {art: 'spur', i}));   // eine Spur der Entstehung
    if(U.dach == null) U.buendelKnoten.forEach((h, i) => nimm(h, 28, {art: 'buendel', i}));
    if(U.dach == null){ U.daecherSchirm.forEach((h, i) => nimm(h, 46, {art: 'dach', i})); nimm(U.mitteSchirm, 46, {art: 'mitte'}); nimm(U.ohneSchirm, 46, {art: 'ohne'}); }
    const k = trefferKopf(sx, sy); if(k >= 0) kand.push([0.6, {art: 'kopf', i: k}]);
    kand.sort((a, b) => a[0] - b[0]); return kand.length ? kand[0][1] : null; }
  const k = trefferKopf(sx, sy); if(k >= 0) return {art: 'kopf', i: k};
  if(trefferKeim(sx, sy)) return {art: 'keim', mond: W.Z.m, zelle: W.Z};
  const s = trefferSame(sx, sy); if(s >= 0) return {art: 'same', i: s, mond: W.Z.m, zelle: W.Z};
  return null;
}
const gleich = (a, b) => !!(a && b && a.art === b.art && (a.art === 'same' ? a.mond.samen[a.i]?.id === b.mond.samen[b.i]?.id : a.i === b.i) && (a.mond?.id ?? null) === (b.mond?.id ?? null));

/* ----------------------------------------------------------------- Tippen */
function tippen(sx, sy){
  if(U.innen && U.innenT > 0 && U.netT > 0.5){ innenTippen(sx, sy); return; }
  { const q = treffer(sx, sy); if(q && q.art === 'mond' && (U.stil === 'campus' || U.stil === 'buero') && U.bauK > 0.5 && !W.N.baum.material.has(q.i)){ hineingehen(q.i); return; } }
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
  if(t.art === 'mond' && U.teilnahme && t.i !== U.teilnahme.gegenstand){ const g = U.teilnahme.gegenstand; U.teilnahme = null; api.teilnahmeFragen(g, t.i); return; }
  if(t.art === 'mond'){ if(gleich(U.sel, t)){ api.oeffneMond(t.i, {}); return; } waehle(t, 1); return; }
  if(t.art === 'dach'){ if(gleich(U.sel, t)){ api.insDach(t.i); return; } waehle(t, 1); return; }
  if(t.art === 'mitte' || t.art === 'ohne'){ if(gleich(U.sel, t)){ api.insDach(t.art); return; } waehle(t, 1); return; }
  if(t.art === 'faden'){ if(gleich(U.sel, t)){ const k = U.fadenK || 0; waehle(null); api.folgeFaden(t.i, k); return; } waehle(t, 1); return; }
  if(t.art === 'buendel'){ if(gleich(U.sel, t)){ buendelHinein(t.i); return; } waehle(t, 1); return; }
  // Same oder Keim: erste Berührung Marke, zweite Lesefläche
  if(gleich(U.sel, t)){ if(U.stufe < 2){ waehle(t, 2); } return; }
  waehle(t, U.lese ? 2 : 1);
}

/* Ein Bündel führt in den Bezirk, aus dem es kommt; dort ist sein erster Faden gewählt */
function buendelHinein(bi){ const x = W.N && W.N.buendel[bi]; if(!x) return; api.insDach(x.von);
  waehle({art: 'faden', i: x.faeden[0]}, 1); const [t, s] = markeFuer(U.sel); ansage(t + '. ' + s + (x.faeden.length > 1 ? ` F zeigt die anderen ${x.faeden.length - 1}.` : '')); }
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
  stoff.init({ansage, zeile, herkunft: herkunftSatz, merkeOrt: () => api.merkeOrt(), folgeStoff: (id, m, o) => api.folgeStoff(id, m, o), zurueckAusStoff: () => api.zurueckAusStoff(),
    rueckSatz: () => api.rueckSatz(), waehleKorn: si => { const Z = W.Z; if(Z) waehle({art: 'same', i: si, mond: Z.m, zelle: Z}, 2); }, einwurf: (t, o) => api.einwurf(t, null, null, o)});
  stoff.installiere();
  formen.init({absaetze, kurz, ansage, zeile, haltKnopf, behalten: (v, k) => api.formBehalten(v, k), funke(){ const p = kornWelt(U.sel); if(p) burst(p[0], p[1], p[2], SILVER, 18, 0.3, 0.7, 0.01); }});
  canvas.addEventListener('pointerdown', e => {
    if(U.fahrt){ U.netK = U.netT; U.fahrt = null; }
    U.flug = null; clearTimeout(U.lesenUhr);   // Berührung schneidet den Flug ab, und das Lesen danach
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
  canvas.addEventListener('dblclick', e => { if(U.innen || ((U.stil === 'campus' || U.stil === 'buero') && U.bauK > 0.5)) return; const t = treffer(e.clientX, e.clientY); if(t && t.art === 'mond') api.oeffneMond(t.i, {}); });

  addEventListener('keydown', e => {
    if(U.fahrt){ U.netK = U.netT; U.fahrt = null; if(e.key === 'Escape') return; }
    if(U.formen){ if(U.siegel){ if(e.key === 'Escape'){ e.preventDefault(); zurueck(); } return; } formen.taste(e); return; }
    if(stoff.offen()){ if(U.siegel){ if(e.key === 'Escape'){ e.preventDefault(); zurueck(); } return; } stoff.taste(e); return; }
    if(e.target.closest && e.target.closest('.halten,.lese,.siegel') && (e.key === ' ' || e.key === 'Enter')) return;
    if(e.target.closest && e.target.closest('.lese') && /^(ArrowUp|ArrowDown|Page|Home|End)/.test(e.key)) return;   // dort scrollen sie
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key; klangWake();
    if(k === 'Escape'){ zurueck(); }
    else if(U.innen && U.innenT > 0 && U.netT > 0.5 && (k === 'ArrowUp' || k === 'ArrowDown')){ e.preventDefault(); etageSchritt(k === 'ArrowUp' ? 1 : -1); }
    else if(k === ' '){ e.preventDefault(); U.paused = !U.paused; zeile(U.paused ? 'Angehalten.' : ''); }
    else if(k >= '1' && k <= '5'){ const i = +k - 1; U.solo = U.solo === i ? -1 : i; ansage(U.solo >= 0 ? `${STIMMEN[i].name} allein.` : 'Alle Stimmen.'); }
    else if(k === '0'){ U.solo = -1; }
    else if(k === 's' || k === 'S'){ seite(); }
    else if(k === 'g' || k === 'G'){ spirale(); }
    else if(k === 'b' || k === 'B'){ ansicht('garten'); }
    else if(k === 'd' || k === 'D'){ ansicht('dorf'); }
    else if(k === 'c' || k === 'C'){ ansicht('campus'); }
    else if(k === 'o' || k === 'O'){ ansicht('buero'); }
    else if(k === 't' || k === 'T'){ ansicht('text'); }
    else if(k === 'l' || k === 'L'){ ansicht('licht'); }
    else if(k === 'm' || k === 'M'){ ansicht('galaxie'); }
    else if(k === 'n' || k === 'N'){ api.zumNetz(); }
    else if(k === 'w' || k === 'W'){ const tu = W.N && W.N.tueren.find(x => x.name === 'Werkraum'); if(tu) tuerOeffnen(tu); else zeile('Den Werkraum gibt es hier nicht.'); }
    else if((k === 'ArrowRight' || k === 'ArrowLeft') && U.sel && U.sel.art === 'faden' && W.N && W.N.faeden[U.sel.i].kanten.length > 1){ e.preventDefault();   // durch die Verbindungen eines Bündels
      const n = W.N.faeden[U.sel.i].kanten.length; U.fadenK = ((U.fadenK || 0) + (k === 'ArrowRight' ? 1 : -1) + n) % n; const [t, s] = markeFuer(U.sel); zeigeMarke(t, s); ansage(t + '. ' + s); }
    else if(k === 'ArrowRight' || k === 'ArrowLeft'){ e.preventDefault(); schritt(k === 'ArrowRight' ? 1 : -1); }
    else if(k === '?'){ U.hintUntil = W.wall + 8; hintEl.textContent = 'S Seite · G Spirale · B Garten · L Lichtansicht · M Galaxie · D Dorf · C Campus · O Büro · T Text · N Netz · A Zusammenhänge · P Planet · W Werkraum · 1–5 eine Stimme · ⌘V legt ab · Halten verbindet · Esc zurück'; }
    else if(k === 'Enter' && U.waehlen && U.sel && (U.sel.art === 'same' || U.sel.art === 'keim')){ const w = U.waehlen, nach = U.sel.art === 'same' ? U.sel.mond.samen[U.sel.i].id : U.sel.mond.keim[U.sel.mond.keim.length - 1].id;
      U.waehlen = null; if(nach !== w.von && U.sel.mond.id === w.mondId) api.kanteFragen(w.von, nach); else zeile('Nichts verbunden.'); }
    else if(k === 'Enter' && U.teilnahme && U.sel && U.sel.art === 'mond' && U.sel.i !== U.teilnahme.gegenstand){ const g = U.teilnahme.gegenstand; U.teilnahme = null; api.teilnahmeFragen(g, U.sel.i); }
    else if(k === 'Enter'){ if(U.sel){ const s = U.sel;
      if(s.art === 'mond') api.oeffneMond(s.i, {}); else if(s.art === 'dach') api.insDach(s.i); else if(s.art === 'mitte' || s.art === 'ohne') api.insDach(s.art);
      else if(s.art === 'faden'){ const k = U.fadenK || 0; waehle(null); api.folgeFaden(s.i, k); }
      else if(s.art === 'buendel') buendelHinein(s.i);
      else if(s.art === 'tuer') tuerOeffnen(W.N.tueren[s.i]); else waehle(s, 2); } }
    else if((k === 'f' || k === 'F') && U.netK > 0.5 && W.N && W.N.faeden.length){   // Fäden zwischen Werken, einer nach dem anderen
      const n = W.N.faeden.length; let i = U.sel && U.sel.art === 'faden' ? U.sel.i + (e.shiftKey ? -1 : 1) : 0; i = (i + n) % n;
      waehle({art: 'faden', i}, 1); const [t, s] = markeFuer(U.sel); ansage(`Faden ${i + 1} von ${n}: ${t}. ${s}`); }
    else if((k === 'a' || k === 'A') && W.N && W.N.als){ const A = W.N.als, i = alsZielVon(U.sel);   // Alsformen: der Gegenstand in allen Zusammenhängen
      if(i < 0) zeile('Erst einen Gegenstand wählen.'); else if(A.proGegenstand.has(i)) api.alsFokus(i, 'mond'); else if(A.hat(i)) api.alsFokus(i, 'planet');
      else zeile('Dieser Gegenstand nimmt noch an keinem anderen Zusammenhang teil.'); }
    else if((k === 'p' || k === 'P') && W.N && W.N.als){ const i = U.als ? U.als.gi : alsZielVon(U.sel);   // Planet ⇄ Mond: derselbe Gegenstand, ein anderer Blick
      if(i < 0) zeile('Erst ein Werk wählen.'); else api.alsFokus(i, U.als && U.als.gi === i && U.als.fokus === 'planet' ? 'mond' : 'planet'); }
    else if(k === 'ArrowUp'){ U.elevOff = clamp(U.elevOff + 0.08, 2 * DEG - U.baseElev, 90 * DEG - U.baseElev); }
    else if(k === 'ArrowDown'){ U.elevOff = clamp(U.elevOff - 0.08, 2 * DEG - U.baseElev, 90 * DEG - U.baseElev); }
    else if((k === 'h' || k === 'H') && !U.keyHold){ U.keyHold = true; setHold(true, CAM.cssW / 2, CAM.cssH / 2); }
    activity();
  });
  addEventListener('keyup', e => { if(U.formen){ formen.tasteLos(e); return; } if((e.key === 'h' || e.key === 'H') && U.keyHold){ U.keyHold = false; setHold(false); } });
  addEventListener('blur', () => { if(U.keyHold){ U.keyHold = false; setHold(false); } if(U.mode === 'hold'){ U.mode = null; setHold(false); } });

  // Einwurf: Text einfügen oder ablegen
  addEventListener('paste', e => { if(U.formen) return; const t = e.clipboardData && e.clipboardData.getData('text/plain'); if(t && t.trim()){ e.preventDefault(); if(!stoff.ablegen(t)) api.einwurf(t, null, null); } });
  addEventListener('dragover', e => { e.preventDefault(); activity(); });
  addEventListener('drop', async e => { e.preventDefault(); if(U.formen) return;
    const dt = e.dataTransfer; let text = '';
    if(dt.files && dt.files.length){ const f = dt.files[0];
      if(f.size > 2_000_000){ zeile('Das ist zu groß zum Ablegen.'); return; }
      if(!/^text\/|json|xml|markdown/.test(f.type) && !/\.(md|txt|markdown|json|csv|html?|xml|yaml|yml)$/i.test(f.name)){ zeile('Ablegen geht im Moment nur mit Text.'); return; }
      text = await f.text(); }
    else text = dt.getData('text/plain');
    if(text && text.trim()){ if(!stoff.ablegen(text)) api.einwurf(text, e.clientX, e.clientY); } });

  // Im Gebäude
  $('#etage-hoch').addEventListener('click', () => { etageSchritt(1); activity(); }); $('#etage-runter').addEventListener('click', () => { etageSchritt(-1); activity(); }); $('#etage-raus').addEventListener('click', () => { zurueck(); activity(); });
  B_schilder();
  // Ecken
  $('#snd').addEventListener('click', () => { const on = klangToggle(); const b = $('#snd'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', on ? 'Klang ausschalten' : 'Klang einschalten'); activity(); });
  $('#seite').addEventListener('click', () => { seite(); activity(); });
  $('#spiralknopf').addEventListener('click', () => { spirale(); activity(); });
  $('#ansichtknopf').addEventListener('click', () => { const w = $('#ansichten'); w.hidden = !w.hidden; $('#ansichtknopf').setAttribute('aria-expanded', w.hidden ? 'false' : 'true'); activity(); });
  document.querySelectorAll('#ansichten button').forEach(b => b.addEventListener('click', () => { const a = b.dataset.a; if(a === 'kosmos'){ if(U.imText) textfassung(false); if(U.ansicht !== 'kosmos') ansicht(U.ansicht); } else if(a === U.ansicht && !U.imText){ /* bleibt */ } else ansicht(a); $('#ansichten').hidden = true; activity(); }));
  $('#netzknopf').addEventListener('click', () => { if(U.netT > 0.5 && W.Z) api.zurZelle(); else api.zumNetz(); activity(); });
  ortEl.addEventListener('click', () => { schliesseSiegel(); U.waehlen = null; if(U.lese) schliesseLese(true); api.ortZurueck(); });   // direkt, nicht durch die Escape-Kette
  markeEl.addEventListener('click', () => { const s = U.sel || (U.hoverMarke ? U.hover : null); if(!s) return;
    if(s.art === 'mond') api.oeffneMond(s.i, {}); else if(s.art === 'tuer'){ tuerOeffnen(W.N.tueren[s.i]); } else if(s.art === 'dach'){ api.insDach(s.i); }
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
/* Dieselben Werke, andere Darstellung. Am Bestand ändert sich nichts */
const ANSICHT = {kosmos: () => netzSatz(W.B), licht: () => 'Lichtansicht: dieselben Werke, die Spirale steigt als Pflanze aus Licht auf.', garten: () => 'Derselbe Mechanismus als Garten: Bäume und Ranken wachsen aus der Abstammung, Blätter, Blüten und Früchte sind Fassungen, das Mycel sind die Verbindungen.', galaxie: () => 'Derselbe Bestand als Galaxie: Planeten sind Werke, Monde sind Fassungen. Die Galaxie dreht sich und fliegt, darum werden ihre Bahnen Spiralen.',
  dorf: () => 'Derselbe Bestand als Dorf: Häuser sind Werke, jedes helle Fenster eine Fassung, die Wege sind die Verbindungen.', campus: () => 'Derselbe Mechanismus als Campus: jeder Turm ein Werk, jede Etage ein Zeitabschnitt, jedes helle Fenster eine Fassung. Tippe auf ein Gebäude und geh hinein.', buero: () => 'Derselbe Mechanismus als Bürokomplex: Riegel an Straßen, unten das Älteste, oben das Jüngste. Tippe auf ein Gebäude und geh hinein.'};
function ansicht(a){ if(U.netT < 0.5 && a !== 'text') return;
  if(a === 'text'){ textfassung(!U.imText); return; } if(U.imText) textfassung(false);
  U.ansicht = U.ansicht === a ? 'kosmos' : a; const v = U.ansicht, ort = v === 'dorf' || v === 'campus' || v === 'buero';
  U.gartenT = v === 'licht' || v === 'garten' || ort ? 1 : 0; U.landT = v === 'garten' || ort ? 1 : 0; U.galT = v === 'galaxie' ? 1 : 0; U.stilZiel = ort ? v : null; if(!U.stil && ort){ U.stil = v; U.bauK = 0; }
  wahlZeigen(); zeile(ANSICHT[v]()); }
function wahlZeigen(){ document.querySelectorAll('#ansichten button').forEach(b => { b.setAttribute('aria-pressed', (U.imText ? b.dataset.a === 'text' : b.dataset.a === U.ansicht) ? 'true' : 'false'); }); }
function textfassung(an){ U.imText = an; const el = $('#textgrund'); el.hidden = !an; if(an){ zeichneText(el, W.N, i => { textfassung(false); api.oeffneMond(i, {}); }, () => textfassung(false)); el.focus({preventScroll: true}); } else canvas.focus({preventScroll: true}); wahlZeigen(); }
/* In ein Gebäude hinein: das Ganze im Schnitt, dann Etage für Etage */
function hineingehen(n){ const o = W.N.ort[n]; U.innen = {n, stil: U.stil, etage: -1, wahl: null, plan: innenPlan(W.N, n, U.stil, [o[0], 0, o[2]])}; U.innenT = 1; U.sel = null; document.body.classList.add('imhaus'); $('#etagen').hidden = false; etageSagen(); }
function hinausgehen(){ U.innenT = 0; $('#etagen').hidden = true; zeile(ANSICHT[U.ansicht]()); }
function etageSetzen(k){ const I = U.innen; I.etage = k; I.wahl = null; etageSagen(); }
function etageSchritt(d){ const I = U.innen, max = I.plan.reihen.length - 1; etageSetzen(I.etage < 0 ? (d > 0 ? 0 : max) : Math.max(0, Math.min(max, I.etage + d))); }
function etageSagen(){ const I = U.innen, m = W.B.monde[I.n], max = I.plan.reihen.length; if(!m.samen.length){ zeile(`${m.titel}: noch leer. Es gibt nur die Ausgangsfassung, darum steht hier kein Schreibtisch.`); return; } if(I.etage < 0){ zeile(`${m.titel}: ${max} ${max === 1 ? 'Etage' : 'Etagen'}, unten das Älteste. In der Mitte die Treppe, je Stimme eine Abteilung. Tippe auf eine Etage.`); return; }
  const r = I.plan.reihen[I.etage], t = x => x && x !== 'ohne Datum' ? new Date(x).toLocaleDateString('de-DE', {day: 'numeric', month: 'long'}) : 'ohne Datum'; zeile(`Etage ${I.etage + 1} von ${max}: ${r.von === r.bis ? t(r.von) : t(r.von) + ' bis ' + t(r.bis)}, ${r.zahl} ${r.zahl === 1 ? 'Schreibtisch' : 'Schreibtische'}. Ein Tisch ist eine Fassung, der Stapel ihre Textmenge.`); }
function innenTippen(sx, sy){ const I = U.innen, pl = I.plan; if(I.etage < 0){ let b = -1, bd = Infinity; pl.reihen.forEach((r, k) => { const s = toScreen(pl.o[0], r.y + 1, pl.o[2]), d = Math.abs(s[1] - sy); if(d < bd){ bd = d; b = k; } }); if(b >= 0) etageSetzen(b); return; }
  let t = null, bd = 44 * 44; for(const x of pl.tische){ if(x.k !== I.etage) continue; const s = toScreen(x.x, x.y, x.z), d = (s[0] - sx) ** 2 + (s[1] - sy) ** 2; if(d < bd){ bd = d; t = x; } }
  if(!t){ I.wahl = null; etageSagen(); return; } const m = W.B.monde[I.n], sa = m.samen[t.i];
  if(I.wahl === t.i){ api.oeffneMond(I.n, {waehle: sa.id, stufe: 2}); return; } I.wahl = t.i; zeile(`${sa.label || 'Fassung'} · ${(sa.laenge || 0).toLocaleString('de-DE')} Zeichen · noch einmal tippen zum Lesen.`); }
function spirale(){ if(U.netT > 0.5) return; U.spiralT = U.spiralT > 0.5 ? 0 : 1;
  const b = $('#spiralknopf'); b.setAttribute('aria-pressed', U.spiralT > 0.5 ? 'true' : 'false'); b.setAttribute('aria-label', U.spiralT > 0.5 ? 'Als Wuchs zeigen' : 'Als Spirale zeigen');
  const m = W.Z && W.Z.m;
  zeile(U.spiralT > 0.5 ? (m && m.kristall.length ? 'Dieser Mond ist eingerastet.' : 'Als Spirale gesehen. Eingerastet ist damit nichts.') : mondSatz(m)); }
function seite(){ if(U.netT > 0.5) return; U.kelchT = U.kelchT > 0.5 ? 0 : 1; U.elevOff = 0;
  const b = $('#seite'); b.setAttribute('aria-pressed', U.kelchT > 0.5 ? 'true' : 'false'); b.setAttribute('aria-label', U.kelchT > 0.5 ? 'Von oben: das Werk' : 'Von der Seite: Geschichte');
  zeile(U.kelchT > 0.5 ? 'Von der Seite: die Geschichte. Unten der Keim, oben das Jüngste.' : mondSatz(W.Z && W.Z.m)); }
function B_schilder(){ const host = $('#innenschilder'); schilderMalen = () => { const I = U.innen, an = I && U.innenK > 0.7 && U.innenT > 0; if(!an){ if(host.childElementCount) host.innerHTML = ''; host._f = null; return; } const pl = I.plan, modus = I.etage < 0 ? 'ganz' : 'etage' + I.etage, liste = I.etage < 0 ? pl.reihen.map((r, k) => ({t: `${k + 1}`, x: pl.o[0] + pl.R * 1.12, y: r.y + 1.2, z: pl.o[2]})) : pl.schilder.map(s => ({t: s.name, x: pl.o[0] + s.x, y: I.etage * pl.HOEHE + 1.4, z: pl.o[2] + s.z})); if(host._f !== modus){ host._f = modus; host.innerHTML = ''; for(const q of liste){ const e = document.createElement('span'); e.textContent = q.t; host.append(e); } } liste.forEach((q, j) => { const s = toScreen(q.x, q.y, q.z), e = host.children[j]; if(e){ e.style.opacity = s[2] > 0 ? '.9' : '0'; e.style.transform = `translate(${Math.round(s[0])}px,${Math.round(s[1])}px) translate(-50%,-50%)`; } }); }; }
let schilderMalen = () => {};
export const innenSchilder = () => schilderMalen();
export function zurueck(){
  clearTimeout(U.lesenUhr);
  if(U.imText){ textfassung(false); return; }
  if(U.innen && U.innenT > 0 && U.netT > 0.5){ if(U.innen.wahl != null){ U.innen.wahl = null; etageSagen(); return; } if(U.innen.etage >= 0){ etageSetzen(-1); return; } hinausgehen(); return; }
  if(U.siegel){ const l = U.siegel.lassen; schliesseSiegel(); l && l(); return; }
  if(U.waehlen){ U.waehlen = null; zeile(mondSatz(W.Z && W.Z.m)); return; }
  if(U.teilnahme){ U.teilnahme = null; zeile('Nichts eingetragen.'); return; }
  if(U.lese){ schliesseLese(true); U.stufe = 1; return; }
  if(U.sel){ waehle(null); return; }
  if(U.solo >= 0){ U.solo = -1; return; }
  if(U.kelchT > 0.5){ seite(); return; }
  api.zurueck();
}
/* Welches Werk eine Wahl meint: der Mond selbst, der Gegenstand einer Erscheinung, das Werk einer Spur; in der Zelle das offene */
function alsZielVon(sel){
  const A = W.N && W.N.als; if(!A) return -1;
  if(sel && sel.art === 'mond') return sel.i; if(sel && sel.art === 'echo' && A.teilnahmen[sel.i]) return A.teilnahmen[sel.i].gegenstand;
  if(sel && sel.art === 'spur' && A.spuren[sel.i]) return A.spuren[sel.i].werk;
  return U.netK < 0.5 && W.Z && W.aktiv >= 0 ? W.aktiv : -1; }
function schritt(d){
  if(U.netK > 0.5 && U.als && W.N && W.N.als){   // im Blick auf einen Gegenstand: er selbst, seine Erscheinungen, seine Spuren
    const A = W.N.als, gi = U.als.gi;
    const ring = [{art: 'mond', i: gi, mond: W.B.monde[gi]}, ...A.teilnahmen.map((t, i) => t.gegenstand === gi || t.kontext === gi ? {art: 'echo', i} : null).filter(Boolean), ...(A.entstehung.get(gi) || []).map(i => ({art: 'spur', i}))];
    let j = U.sel ? ring.findIndex(r => gleich(r, U.sel)) : -1; j = j < 0 ? (d > 0 ? 0 : ring.length - 1) : ((j + d) % ring.length + ring.length) % ring.length;
    waehle(ring[j], U.lese && ring[j].art !== 'mond' ? 2 : 1); if(!U.lese){ const [t, s] = markeFuer(U.sel); ansage(t + '. ' + s); } return; }
  if(U.netK > 0.5){
    if(U.dach == null && W.N.daecher.length){   // die Mitte, die Dächer und „ohne Dach“
      const ring = [{art: 'mitte'}, ...W.N.daecher.map((_, i) => ({art: 'dach', i})), ...(W.N.L.ohne ? [{art: 'ohne'}] : [])], n = ring.length;
      let i = U.sel ? ring.findIndex(r => gleich(r, U.sel)) : -1; i = i < 0 ? (d > 0 ? 0 : n - 1) : ((i + d) % n + n) % n;
      waehle(ring[i], 1); const [t, s] = markeFuer(U.sel); ansage(t + '. ' + s + '. Eingabe fährt hinein.'); return; }
    const liste = U.dach != null ? W.N.werkeIn(U.dach) : W.B.monde.map((_, k) => k), n = liste.length; if(!n) return;
    let j = U.sel && U.sel.art === 'mond' ? liste.indexOf(U.sel.i) + d : (d > 0 ? 0 : n - 1); j = (j + n) % n; const i = liste[j];
    waehle({art: 'mond', i, mond: W.B.monde[i]}, 1); const [t, s] = markeFuer(U.sel); ansage(t + '. ' + s); return; }
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
  if(!U.sel && !U.namenAn && !U.siegel && t && (t.art === 'mond' || t.art === 'tuer' || t.art === 'same' || t.art === 'keim' || t.art === 'kopf' || t.art === 'dach' || t.art === 'mitte' || t.art === 'ohne' || t.art === 'faden' || t.art === 'buendel' || t.art === 'echo' || t.art === 'spur')){ const [a, b] = markeFuer(t); zeigeMarke(a, b); U.hoverMarke = true; }
  else if(!U.sel && U.hoverMarke){ verbirgMarke(); U.hoverMarke = false; } }

/* Lage der Marke und der leisen Anzeigen, jedes Bild */
export function uiFrame(){
  const sel = U.sel || (U.hoverMarke ? U.hover : null);
  if(sel && !markeEl.hidden){ let p = null; const Z = W.Z;
    if(sel.art === 'same' && Z && sel.mond === Z.m){ Z.seedPos(sel.i, TMP); p = toScreen(TMP[0], TMP[1], TMP[2]); }
    else if(sel.art === 'keim' && Z){ p = toScreen(Z.origin[0], Z.origin[1], Z.origin[2]); }
    else if(sel.art === 'mond'){ p = U.monde[sel.i]; }
    else if(sel.art === 'tuer'){ p = U.tueren[sel.i]; }
    else if(sel.art === 'dach'){ p = U.daecherSchirm[sel.i]; }
    else if(sel.art === 'mitte'){ p = U.mitteSchirm; }
    else if(sel.art === 'ohne'){ p = U.ohneSchirm; }
    else if(sel.art === 'faden'){ p = U.knoten[sel.i]; }
    else if(sel.art === 'buendel'){ p = U.buendelKnoten[sel.i]; }
    else if(sel.art === 'echo'){ p = U.echos[sel.i]; }
    else if(sel.art === 'spur'){ p = U.spuren[sel.i]; }
    else if(sel.art === 'kopf'){ p = (U.netK > 0.6 ? U.bigHeads : U.heads)[sel.i]; }
    if(p && p[2] > 0) setzeMarke(p[0], p[1]); }
  hintEl.classList.toggle('on', W.wall < U.hintUntil && !U.lese && !U.siegel);
  if(W.wall - U.last > 3.2 && !U.paused){ document.body.classList.remove('active'); if(W.wall > 8) document.body.classList.add('dim'); }
}
export {klang, AU, burst, SILVER, REIFE, stoff};
