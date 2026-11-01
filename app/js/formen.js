/* =====================================================================
   FORMEN — der KiNFORMER als Werkstatt in Ralfs Hand, keine Stimme.
   Ein stiller Handgriff in der Lesefläche fächert nur die Richtungen auf,
   die der KiNFORMER gerade meldet. Die Form liegt auf einem Lichttisch über
   der gedimmten Zelle, in einer abgeschlossenen Fläche ohne Skripte.
   Unten läuft der Fassungsfaden: das Original, dann je Form eine Perle.
   Ansehen schreibt nichts. Der Server formt; der Browser spricht nie mit 9062.
   Solange der Tisch offen ist, ist alles dahinter unerreichbar (inert).
   ===================================================================== */
import {U, W} from './welt.js';

const $ = s => document.querySelector(s);
const tischEl = $('#formen'), flaecheEl = tischEl.querySelector('.formen-flaeche'), blattEl = tischEl.querySelector('.formen-blatt'),
  originalEl = tischEl.querySelector('.formen-original'), satzEl = tischEl.querySelector('.formen-satz'),
  leiseEl = tischEl.querySelector('.formen-leise'), fadenEl = tischEl.querySelector('.formen-faden'),
  zurueckEl = tischEl.querySelector('.formen-zurueck'), randEl = tischEl.querySelector('.formen-rand'), tunEl = tischEl.querySelector('.formen-tun');
const roh = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const RUHT = 'Der KiNFORMER ruht gerade. Formen geht, sobald er wach ist.';
const HINTERGRUND = ['#lese', '#gl', '#snd', '#seite', '#spiralknopf', '#netzknopf', '#zurueck', '#marke'];
const handy = () => matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const tastatur = () => matchMedia('(any-pointer: fine)').matches;

let hilfe = null;       // aus der Bedienung: Lesetext, Kürzen, Zeile, Ansage, Halten, Behalten, Funken am Korn
let z = null;           // offener Lichttisch: {v, titel, richtungen, jetzt, formen, knopf, behaltene}
let richtungen = null, richtungenT = 0;
let verfuegbar = null;  // kennt der laufende Server den Formweg? Ohne ihn gibt es keinen Handgriff, der ins Leere führt

export function init(h){ hilfe = h; }
export const offen = () => !!z;

/* Gibt es hier Formen? null heißt ja; sonst ein ruhiger Satz statt des Handgriffs */
export function formbar(v, mond){
  const t = String(v.content || '').trim();
  if(/^[[{]/.test(t)){ try{ JSON.parse(t); return 'Das ist ein gespeicherter App-Zustand. Formen gibt es für Texte.'; }catch(_){} }
  if(mond && mond.art !== 'text') return 'Das gehört zu einer App. Formen gibt es für Texte.';
  if(!t) return 'Diese Ausprägung hat keinen Text zum Formen.';
  return null;
}

export async function pruefe(){ try{ await holeRichtungen(); }catch(_){} }
async function holeRichtungen(){
  if(richtungen && performance.now() - richtungenT < 60000) return richtungen;
  const r = await fetch('/lichtwerk/formen/richtungen', {headers: {'Accept': 'application/json'}, cache: 'no-store'});
  if(r.status === 404){ verfuegbar = false; throw new Error('Formen ist in diesem Lichtwerk noch nicht eingeschaltet.'); }
  verfuegbar = true;
  const d = await r.json().catch(() => null);
  if(!r.ok || !d || !Array.isArray(d.richtungen)) throw new Error((d && d.satz) || RUHT);
  richtungen = d.richtungen; richtungenT = performance.now(); return richtungen;
}
async function vorschau(id, richtung){
  let r;
  try{ r = await fetch('/lichtwerk/formen/vorschau', {method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
    body: JSON.stringify({auspraegung: id, richtung}), cache: 'no-store'}); }
  catch(_){ return {geht: false, satz: 'Das Lichtwerk antwortet gerade nicht.'}; }
  const d = await r.json().catch(() => null);
  if(!r.ok) return {geht: false, satz: (d && d.satz) || 'Diese Form ließ sich gerade nicht setzen.'};
  return d || {geht: false, satz: 'Diese Form ließ sich gerade nicht setzen.'};
}
/* Welche Formen dieses Originals liegen schon in Ralfs Zweig? (Namen der Richtungen) */
function behalteneNamen(v){
  const B = W.B, aus = new Set(); if(!B || !B.formen) return aus;
  for(const [fid, oid] of B.formen){ if(oid !== v.id) continue;
    const m = String((B.fassungen.get(fid) || {}).notes || '').match(/^Form ohne Modell · KiNFORMER · ([^.]+)\./); if(m) aus.add(m[1]); }
  return aus;
}

/* -------------------------------------------------------------- Handgriff */
export function handgriff(v, mond, tun, ursprung){
  if(verfuegbar === false) return;
  const nein = formbar(v, mond);
  if(nein){ const p = document.createElement('p'); p.className = 'lese-leise'; p.textContent = nein; tun.append(p); return; }
  const b = document.createElement('button'); b.type = 'button'; b.className = 'halten still formen-griff';
  b.innerHTML = '<span>Formen<small>ansehen · schreibt nichts</small></span>'; b.setAttribute('aria-expanded', 'false');
  const faecher = document.createElement('div'); faecher.className = 'faecher'; faecher.hidden = true;
  faecher.setAttribute('role', 'group'); faecher.setAttribute('aria-label', 'Formen'); faecher.setAttribute('aria-live', 'polite');
  b.addEventListener('click', async () => {
    if(!faecher.hidden){ faecher.hidden = true; b.setAttribute('aria-expanded', 'false'); return; }
    faecher.hidden = false; b.setAttribute('aria-expanded', 'true'); faecher.innerHTML = '<p class="faecher-leise">Einen Augenblick …</p>';
    let liste;
    try{ liste = await holeRichtungen(); }
    catch(e){ faecher.innerHTML = `<p class="faecher-leise">${roh(e.message || RUHT)}</p>`; return; }
    faecher.innerHTML = '';
    for(const r of liste.filter(r => !r.kommt)){
      const k = document.createElement('button'); k.type = 'button'; k.className = 'faecher-knopf';
      k.innerHTML = `<span>${roh(r.name)}</span><small>${roh(r.satz)}</small>`;
      k.addEventListener('click', () => oeffne(v, r.key, liste, {knopf: b, ursprung}));
      faecher.append(k);
    }
    const kommt = liste.filter(r => r.kommt).map(r => r.name);
    if(kommt.length){ const p = document.createElement('p'); p.className = 'faecher-leise';
      p.textContent = (kommt.length === 1 ? kommt[0] + ' kommt' : kommt.slice(0, -1).join(', ') + ' und ' + kommt[kommt.length - 1] + ' kommen') + ' noch.'; faecher.append(p); }
    faecher.querySelector('button')?.focus({preventScroll: true});
    faecher.scrollIntoView({block: 'nearest', behavior: W.RM ? 'auto' : 'smooth'});
  });
  tun.append(b, faecher);
}

/* -------------------------------------------------------------- Lichttisch */
/* Eine behaltene Form als Seite: dieselbe Fläche, ihre Perle zeigt die gespeicherte Seite */
export async function zeigeBehalten(form, original, mond, ursprung){
  let liste = [];
  try{ liste = await holeRichtungen(); }catch(_){}
  const name = (String(form.notes || '').match(/^Form ohne Modell · KiNFORMER · ([^.]+)\./) || [])[1] || 'Form';
  let r = liste.find(x => x.name === name);
  if(!r){ r = {key: 'behalten', name, satz: '', kommt: false}; liste = [...liste, r]; }
  const gespeichert = {geht: true, gespeichert: true, behalten: false, titel: form.label || name, html: String(form.content || ''),
    satz: `Behalten am ${new Date(Date.parse(form.created_at)).toLocaleDateString('de-DE', {day: 'numeric', month: 'long'})}. So liegt die Seite in deinem Zweig.`};
  oeffne(original || form, r.key, liste, {knopf: document.activeElement, ursprung, vorab: [r.key, gespeichert], zurueckTitel: form.label});
}

function hintergrund(aus){ for(const q of HINTERGRUND){ const el = $(q); if(el) el.inert = aus; } }

function oeffne(v, key, liste, opt = {}){
  z = {v, titel: v.label || 'Ausprägung', richtungen: liste.filter(r => !r.kommt), jetzt: null, formen: new Map(opt.vorab ? [opt.vorab] : []),
    knopf: opt.knopf || null, behaltene: behalteneNamen(v)};
  U.formen = true; document.body.classList.add('formend'); hintergrund(true);
  zurueckEl.querySelector('.formen-zurueck-satz').textContent = `zurück zu „${hilfe.kurz(opt.zurueckTitel || z.titel, 42)}“`;
  const p = opt.ursprung && opt.ursprung();
  flaecheEl.style.transformOrigin = p ? `${Math.round(p[0])}px ${Math.round(p[1])}px` : '50% 50%';
  tischEl.classList.toggle('still', !!W.RM);
  tischEl.hidden = false; tischEl.classList.remove('auf'); void tischEl.offsetWidth; tischEl.classList.add('auf');
  if(p && !W.RM) hilfe.funke();
  baueFaden(); zeige(key);
  tischEl.focus({preventScroll: true});
  hilfe.ansage(`Lichttisch offen. ${hilfe.kurz(z.titel, 80)}. Pfeiltasten wechseln die Form, Escape führt zurück.`);
}
/* still: ohne Fokus und ohne Satz (beim Behalten und wenn die Lesefläche selbst schließt) */
export function schliesse(still){
  if(!z) return;
  const knopf = z.knopf; z = null; U.formen = false;
  tunEl.querySelectorAll('.halten.drueckt').forEach(b => b.dispatchEvent(new Event('pointercancel'))); tunEl.innerHTML = '';
  tischEl.hidden = true; tischEl.classList.remove('auf'); document.body.classList.remove('formend'); hintergrund(false);
  blattEl.removeAttribute('srcdoc'); originalEl.innerHTML = ''; leiseEl.textContent = '';
  if(!still){ (knopf && knopf.isConnected ? knopf : $('#lese')).focus({preventScroll: true});
    hilfe.zeile('Zurück. Nichts behalten.'); hilfe.ansage('Lichttisch zu. Nichts behalten.'); }
}

function stationen(){ return ['original', ...z.richtungen.map(r => r.key)]; }
function baueFaden(){
  fadenEl.innerHTML = '';
  const strang = document.createElement('div'); strang.className = 'strang';
  stationen().forEach((key, i) => {
    if(i){ const g = document.createElement('span'); g.className = 'glied'; g.setAttribute('aria-hidden', 'true'); strang.append(g); }
    const name = key === 'original' ? 'Original' : z.richtungen.find(r => r.key === key).name, schon = key !== 'original' && z.behaltene.has(name);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'perle' + (key === 'original' ? ' original' : '') + (schon ? ' behalten' : ''); b.dataset.key = key;
    b.innerHTML = `<i aria-hidden="true"></i><span>${roh(name)}</span>`; b.setAttribute('aria-label', schon ? name + ', schon in deinem Zweig' : name);
    b.addEventListener('click', () => zeige(key));
    strang.append(b);
  });
  fadenEl.append(strang);
}
function markiere(){
  for(const b of fadenEl.querySelectorAll('.perle')){ const an = b.dataset.key === z.jetzt; b.classList.toggle('gewaehlt', an); if(an) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }
  const jetzt = fadenEl.querySelector('.perle.gewaehlt'); jetzt && jetzt.scrollIntoView({inline: 'nearest', block: 'nearest', behavior: W.RM ? 'auto' : 'smooth'});
}

async function zeige(key){
  if(!z) return;
  z.jetzt = key; markiere(); leiseEl.textContent = ''; behaltenKnopf(null);
  if(key === 'original'){
    blattEl.hidden = true; originalEl.hidden = false;
    originalEl.innerHTML = `<article class="papier"><h1>${roh(hilfe.kurz(z.titel, 220))}</h1>${hilfe.absaetze(z.v.content || '')}</article>`;
    originalEl.scrollTop = 0; satzEl.textContent = 'Das Original, so wie du es in der Lesefläche liest.'; return;
  }
  const r = z.richtungen.find(x => x.key === key), name = r ? r.name : 'Form';
  let f = z.formen.get(key);
  if(!f){ satzEl.textContent = `${name} wird gesetzt …`; const v = z.v; f = await vorschau(v.id, key); if(!z || z.v !== v) return; if(f.geht) z.formen.set(key, f); }
  if(z.jetzt !== key) return;
  if(!f.geht){ satzEl.textContent = f.satz; return; }
  originalEl.hidden = true; originalEl.innerHTML = ''; blattEl.hidden = false;
  blattEl.title = hilfe.kurz(f.titel, 120); blattEl.srcdoc = f.html;
  const schon = !f.gespeichert && z.behaltene.has(name);
  satzEl.textContent = f.satz + (schon ? ' Diese Form liegt schon in deinem Zweig.' : '');
  if(key === 'spiel' && handy()) leiseEl.textContent = 'Am Handy zum Ansehen: die Zahlen sind für den Daumen zu klein.';
  else if(key === 'schaubild' && handy()) leiseEl.textContent = 'Am Handy sehr klein: das Schaubild ist für den großen Bildschirm gesetzt.';
  behaltenKnopf(f.behalten && !schon && !(key === 'spiel' && handy()) ? key : null);
}
/* Halten auf „Behalten“: erst dann wird geschrieben, in Ralfs Namen; Lassen schreibt nichts */
function behaltenKnopf(key){
  tunEl.querySelectorAll('.halten.drueckt').forEach(b => b.dispatchEvent(new Event('pointercancel'))); tunEl.innerHTML = '';
  if(!key || !z) return;
  const v = z.v;
  const b = hilfe.haltKnopf('Behalten', tastatur() ? 'halten · H · als Fassung unter deinem Namen' : 'halten · als Fassung unter deinem Namen', '', 1500, async () => {
    if(!z || z.v !== v || z.jetzt !== key) return;
    satzEl.textContent = 'Wird behalten …'; tunEl.innerHTML = ''; tischEl.focus({preventScroll: true});
    const r = await hilfe.behalten(v, key);
    if(r && r.ok){ schliesse(true); return; }
    if(z && z.v === v){ satzEl.textContent = (r && r.satz) || 'Nichts behalten.'; if(z.jetzt === key) behaltenKnopf(key); }
  });
  b.setAttribute('aria-label', 'Behalten, als Fassung unter deinem Namen. Zum Bestätigen gedrückt halten' + (tastatur() ? ', auch mit der Taste H.' : '.'));
  b.setAttribute('aria-keyshortcuts', 'H');
  tunEl.append(b);
}
function schritt(d){ const s = stationen(), i = s.indexOf(z.jetzt); const j = Math.max(0, Math.min(s.length - 1, i + d)); if(j !== i) zeige(s[j]); }

/* Tasten gelten nur hier, solange der Lichttisch offen ist */
export function taste(e){
  if(!z) return false;
  if(e.metaKey || e.ctrlKey || e.altKey) return true;
  if(e.key === 'Escape'){ e.preventDefault(); schliesse(); }
  else if((e.key === 'h' || e.key === 'H') && !e.repeat){ const b = tunEl.querySelector('.halten'); if(b){ b.focus({preventScroll: true}); b.dispatchEvent(new KeyboardEvent('keydown', {key: ' '})); } }
  else if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ e.preventDefault(); schritt(e.key === 'ArrowRight' ? 1 : -1); }
  return true;
}
export function tasteLos(e){
  if(!z || (e.key !== 'h' && e.key !== 'H')) return;
  const b = tunEl.querySelector('.halten'); if(b) b.dispatchEvent(new KeyboardEvent('keyup', {key: ' '}));
}

/* Tasten in der Form erreichen die Seite nicht. Ein Tippen in die Fläche gibt den Fokus darum gleich an den Tisch
   zurück, damit Esc, Pfeile und H weiter gelten; wer mit Tab hineingeht, bekommt einen Satz, wie er hinauskommt. */
let zeigerDrauf = false;
blattEl.addEventListener('pointerenter', () => { zeigerDrauf = true; });
blattEl.addEventListener('pointerleave', () => { zeigerDrauf = false; });
const inDieForm = () => { if(!z || document.activeElement !== blattEl) return;
  if(zeigerDrauf) setTimeout(() => { if(z && document.activeElement === blattEl) tischEl.focus({preventScroll: true}); }, 0);
  else leiseEl.textContent = 'In der Form gelten ihre eigenen Tasten. Tab führt wieder hinaus.'; };
blattEl.addEventListener('focus', inDieForm);
addEventListener('blur', () => setTimeout(inDieForm, 0));
blattEl.addEventListener('blur', () => { if(leiseEl.textContent.startsWith('In der Form gelten')) leiseEl.textContent = ''; });

/* Wischen nur auf dem Rand um die Fläche: in der Fläche erreicht eine Geste die Seite nicht */
let wx = null, wy = 0;
randEl.addEventListener('pointerdown', e => { if(e.target !== randEl && !e.target.classList.contains('formen-flaeche')) return; wx = e.clientX; wy = e.clientY; });
randEl.addEventListener('pointerup', e => { if(wx == null) return; const dx = e.clientX - wx, dy = e.clientY - wy; wx = null; if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) schritt(dx < 0 ? 1 : -1); });
randEl.addEventListener('pointercancel', () => { wx = null; });
zurueckEl.addEventListener('click', () => schliesse());
