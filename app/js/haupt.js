/* =====================================================================
   SPiRALCELLS · Lichtwerk — Hauptlauf und Navigation.
   Liest den echten Bestand über den eigenen Server (Proxy auf 8401), baut daraus
   das Netz der Werke und die geöffnete Zelle, fährt zwischen ihnen, hält Rückwege.
   ===================================================================== */
import {TAU, DEG, clamp, mix, sstep, P, L, CAM, setCamera, toScreen, pointerWorld, screenRing, lichtmaschine, WG, GOLDC, SILVER, KEIMC} from './licht.js';
import {bestand, STIMMEN, kurz, menschlich, QUELLE} from './daten.js';
import {Zelle, baueZelle, DT, updSparks, drawSparks, clearSparks, burst, spark} from './zelle.js';
import {Netz, baueNetz} from './netz.js';
import {regie} from './regie.js';
import {U, W} from './welt.js';
import {klang, klangFrame, AU} from './klang.js';
import * as B from './bedienung.js';
import * as schreib from './schreiben.js';
import * as ankunft from './ankunft.js';
import * as link from './link.js';

const canvas = document.getElementById('gl');
const MQ = matchMedia('(prefers-reduced-motion: reduce)');
W.RM = MQ.matches; if(MQ.addEventListener) MQ.addEventListener('change', e => { W.RM = e.matches; });
const M = lichtmaschine(canvas, () => {});
if(!M){ document.getElementById('nogl').hidden = false; canvas.hidden = true; throw new Error('WebGL2 fehlt'); }
addEventListener('resize', () => M.resize());
const angEl = document.getElementById('angle'), tageEl = document.getElementById('tage'), ortEl = document.getElementById('zurueck'), namenEl = document.getElementById('namen');
for(let i = 0; i < 5; i++){ const s = document.createElement('span'); s.textContent = STIMMEN[i].name; s.style.color = STIMMEN[i].hex; s.style.opacity = '0'; namenEl.append(s); }
const tuerEl = document.getElementById('tuernamen'), dachEl = document.getElementById('dachnamen');
/* Die Namen der Dächer und der Mitte stehen im Netz leise am Bild: sie sind die Orientierung */
function dachNamen(){ if(!dachEl || !W.N) return; dachEl.innerHTML = '';
  const neu = (t, k) => { const s = document.createElement('span'); s.textContent = t; s.className = k; s.style.opacity = '0'; dachEl.append(s); };
  neu(W.N.baum.mitte.name || 'Zentrale', 'mitte'); for(const d of W.N.daecher) neu(d.name, 'dach'); if(W.N.L.ohne) neu('ohne Dach', 'ohne'); }
function tuerNamen(){ tuerEl.innerHTML = ''; for(const t of (W.N ? W.N.tueren : [])){ const s = document.createElement('span'); s.textContent = t.wach ? t.name : t.name + ' ruht'; s.style.opacity = '0'; tuerEl.append(s); } }
const WERKSTATT = /[?&]werkstatt/.test(location.search);
const MERK = 'spiralcells-lichtwerk-mond';

/* ---------------------------------------------------------------- Daten */
const RUHEMOND = {id: '', titel: 'SPiRALCELLS ruht', samen: [], keim: [], stimmen: [], paare: [], paarZeiten: [], paarBelege: [], kopplung: 0, phase: 0.05, reife: 'frisch', kristall: [],
  faeden: [], aussen: [], befunde: [], zeitspanne: [0, 0], traumfeld: true, winkel: null, keimKristall: false, keimSatz: '', zweige: []};

async function laden(){
  const [{daten, stand}, umg, ord] = await Promise.all([schreib.lesenMitStand('/lichtwerk/graph'), schreib.lesen('/lichtwerk/umgebung').catch(() => []), schreib.lesen('/lichtwerk/ordnung').catch(() => null)]);
  W.ordnung = ord; W.B = bestand(daten); W.N = new Netz(W.B, W.ordnung); W.umgebung = umg; W.N.tueren = umg.filter(u => u.adresse); W.stand = stand; dachNamen();
  W.namen = link.namen(W.B.monde); W.geladen = Date.now(); W.N.neu = W.neuMonde || null; zuletztMerken();
  W.ruht = false; document.body.classList.remove('ruht'); tuerNamen();
}
function ruhen(){
  W.ruht = true; document.body.classList.add('ruht'); if(!W.Z || W.Z.m !== RUHEMOND){ W.Z = new Zelle(RUHEMOND, {ohneAufzug: true, RM: W.RM, au: klang}); }
  U.netT = 0; B.zeile('SPiRALCELLS schläft gerade. Das Bild wacht mit ihm auf.');
}

/* ------------------------------------------------------------ Navigation */
function mondNachId(id){ return W.B ? W.B.monde.findIndex(m => m.id === id) : -1; }
function oeffneMond(i, opt = {}){
  const m = W.B.monde[i]; if(!m) return;
  if(!opt.behalteWeg) U.weg = [];
  // Flug: von Zelle zu Zelle zieht die Kamera kurz auf, das Netz zeigt den Weg; reduzierte Bewegung schneidet
  if(W.Z && W.Z.m !== m && W.Z.m.id && !W.RM && U.netK < 0.3 && opt.flug !== false) U.flug = {von: W.Z.center(), S: W.Z.S.Sc, t0: performance.now(), dauer: 1500};
  else U.flug = null;
  W.aktiv = i;
  const Z = new Zelle(m, {origin: W.N.pos[i], RM: W.RM, au: klang, ohneAufzug: !!opt.ohneAufzug});
  W.Z = Z; clearSparks(); zuletztMarkieren(Z);
  U.netDir = -1; U.netT = 0; U.kelchT = 0; U.zoom = 1; U.yawOff = 0; U.elevOff = 0; U.solo = -1; U.waehlen = null; U.bind = null;
  document.getElementById('seite').setAttribute('aria-pressed', 'false');
  B.waehle(null);
  if(opt.waehle){ const si = m.samen.findIndex(s => s.id === opt.waehle);
    if(si >= 0){ Z.sofort(); B.waehle({art: 'same', i: si, mond: m, zelle: Z}, opt.stufe || 2); }
    else if(m.keim.some(v => v.id === opt.waehle)){ Z.sofort(); B.waehle({art: 'keim', mond: m, zelle: Z}, opt.stufe || 2); } }
  B.zeile(m.titel); W.titelBis = W.wall + (W.RM ? 2.5 : 4.5);
  W.namenAb = W.wall + (opt.ohneAufzug || W.RM ? 0.3 : 2.6); W.namenBis = W.namenAb + 4.5;   // die Stimmen sagen kurz ihren Namen
  try{ localStorage.setItem(MERK, m.id); }catch(e){}
  if(W.namen && W.namen[i] && !WERKSTATT) try{ history.replaceState(null, '', link.bau(W.namen[i], W.von)); }catch(e){}
  ortAktualisieren();
}
/* In ein Dach hinein und wieder hinaus: die Kamera fährt, die anderen Dächer treten zurück */
function insDach(j){ if(!W.N || !W.N.daecher[j]) return; U.dach = j; B.waehle(null); const d = W.N.daecher[j];
  const n = d.bereiche.reduce((a, b) => a + b.werke.length, 0); B.zeile(`${d.name}: ${n} ${n === 1 ? 'Werk' : 'Werke'} in ${d.bereiche.length} ${d.bereiche.length === 1 ? 'Bereich' : 'Bereichen'}.`); }
function ausDach(){ if(U.dach == null) return false; const j = U.dach; U.dach = null; B.waehle({art: 'dach', i: j}, 1); B.zeile(B.netzSatz(W.B)); return true; }
function zumNetz(){
  if(!W.B || W.ruht) return;
  B.waehle(null); U.netDir = 1; U.netT = 1; U.kelchT = 0; U.zoom = 1; U.elevOff = 0; U.yawOff = 0; U.waehlen = null;
  const dj = W.aktiv >= 0 && W.N ? W.N.dachVon(W.aktiv) : -1; U.dach = dj >= 0 ? dj : null;   // zurück in das Dach, aus dem du kamst
  if(W.aktiv >= 0) B.waehle({art: 'mond', i: W.aktiv, mond: W.B.monde[W.aktiv]}, 1);   // Rückweg: der Mond, aus dem du kamst, bleibt markiert
  B.zeile(B.netzSatz(W.B)); W.titelBis = -1; ortAktualisieren();
}
function zurZelle(){ if(!W.Z || W.ruht) return; U.netDir = -1; U.netT = 0; B.waehle(null); B.zeile(B.mondSatz(W.Z.m)); ortAktualisieren(); }
/* Rückweg: zuerst den gemerkten Weg zurück (auch innerhalb des Monds), sonst ins Netz */
function zurueck(){
  if(U.netT > 0.5){ if(ausDach()) return; if(W.Z && W.aktiv >= 0) zurZelle(); return; }
  if(U.weg.length){ const w = U.weg.pop(); const i = mondNachId(w.mond);
    if(i >= 0){ if(i === W.aktiv && W.Z){ const Z = W.Z;
        if(w.same){ const si = Z.m.samen.findIndex(s => s.id === w.same); if(si >= 0){ B.waehle({art: 'same', i: si, mond: Z.m, zelle: Z}, 2); stoffZurueck(w); return; } }
        if(w.keim){ B.waehle({art: 'keim', mond: Z.m, zelle: Z}, 2); return; }
        B.waehle(null); return; }
      oeffneMond(i, {ohneAufzug: true, waehle: w.same || w.keim, stufe: 2, behalteWeg: true}); stoffZurueck(w); return; } }
  zumNetz();
}
let ortText = '', ortVerborgen = null;
function ortAktualisieren(){
  const inZelle = U.netT < 0.5 && !!W.Z && !W.ruht;
  if(ortVerborgen !== !inZelle){ ortVerborgen = !inZelle; ortEl.hidden = ortVerborgen; }
  const w = U.weg[U.weg.length - 1]; let t = W.von && link.VON[W.von] ? link.VON[W.von].satz : 'Netz der Werke';
  if(w && W.B){ const wm = W.B.mondVon.get(w.mond);
    if(wm && W.Z && wm.id !== W.Z.m.id) t = `zurück zu „${kurz(wm.titel, 42)}“`;
    else if(wm){ const f = w.same ? W.B.fassungen.get(w.same) : null; t = `zurück zu „${kurz(f ? f.label : wm.keimSatz, 42)}“`; } }
  if(t !== ortText){ ortText = t; ortEl.querySelector('.ort-satz').textContent = t; }
}
/* Oben links: mit Herkunft aus einem Link zurück dorthin (feste Adresse), sonst der gemerkte Weg */
function ortZurueck(){
  if(B.stoff.offen()){ zurueckAusStoff(); return; }
  if(!U.weg.length && W.von && link.VON[W.von] && U.netT < 0.5){ location.assign(link.VON[W.von].adresse); return; }
  zurueck();
}
/* Der Leseraum: hinein aus der Lesefläche, hinaus zurück zur Lesefläche oder den gemerkten Weg zurück */
function oeffneStoff(sel, opt = {}){ if(!sel || !W.Z) return; if(sel.art === 'same') B.waehle(sel, 2); B.stoff.oeffne({mond: sel.mond, i: sel.i, keim: sel.art === 'keim', ...opt}); merkeOrt(); }
function rueckSatz(){ const w = U.weg[U.weg.length - 1]; if(!w || !w.ausStoff || !W.B) return 'zur Zelle';
  const f = w.stoff && W.B.fassungen.get(w.stoff.variantId); return f ? `zurück zu „${kurz(f.label, 40)}“` : 'zurück'; }
function zurueckAusStoff(){ const w = U.weg[U.weg.length - 1]; B.stoff.schliesse();
  if(w && w.ausStoff){ zurueck(); return; }   // über einen Faden gekommen: dorthin zurück, mit Lesestelle
  if(U.sel) B.waehle(U.sel, 2); merkeOrt(); }
function stoffZurueck(w){ if(!w || !w.stoff || !W.Z) return; const Z = W.Z, si = Z.m.samen.findIndex(s => s.id === w.stoff.variantId), keim = si < 0 && Z.m.keim.some(v => v.id === w.stoff.variantId);
  if(si < 0 && !keim) return;
  B.stoff.oeffne({mond: Z.m, i: si, keim, modus: w.stoff.modus, vergleich: w.stoff.vergleich, stelle: w.stoff.stelle}); merkeOrt(); }
/* Aus dem Leseraum einer Verwendung folgen: in die andere Fassung an ihre Stelle, der Rückweg führt an die eigene */
function folgeStoff(variantId, mond, opt){
  const Z = W.Z; if(!Z) return; const z = B.stoff.zustand(), hier = hierMerken();
  if(hier){ hier.stoff = z; hier.ausStoff = true; U.weg.push(hier); }
  B.stoff.schliesse();
  if(mond && mond.id !== Z.m.id){ const i = mondNachId(mond.id); if(i < 0) return; oeffneMond(i, {ohneAufzug: true, waehle: variantId, stufe: 2, behalteWeg: true}); }
  const Zn = W.Z, si = Zn.m.samen.findIndex(s => s.id === variantId);
  if(si >= 0){ B.waehle({art: 'same', i: si, mond: Zn.m, zelle: Zn}, 2); B.stoff.oeffne({mond: Zn.m, i: si, ...opt}); }
  else if(Zn.m.keim.some(v => v.id === variantId)){ B.waehle({art: 'keim', mond: Zn.m, zelle: Zn}, 2); B.stoff.oeffne({mond: Zn.m, keim: true, ...opt}); }
  B.zeile(`In „${kurz(Zn.m.titel, 50)}“. Der Rückweg steht oben links.`); merkeOrt();
}
/* Der Ort, an dem Ralf gerade ist: im Speicher dieses Tabs nur Kennungen, in der Adresszeile nur lesbare Zahlen */
const ORT = 'spiralcells-lichtwerk-ort';
function merkeOrt(){
  if(WERKSTATT || !W.Z || !W.namen) return; const Z = W.Z, sel = U.sel, z = B.stoff.zustand();
  const same = sel && sel.art === 'same' && sel.mond === Z.m ? Z.m.samen[sel.i]?.id : null;
  try{ sessionStorage.setItem(ORT, JSON.stringify({mond: Z.m.id, same, stufe: U.stufe, stoff: z, kelch: U.kelchT > 0.5})); }catch(_){}
  const fi = same ? Z.m.samen.findIndex(s => s.id === same) + 1 : 0, vi = z && z.vergleich ? Z.m.samen.findIndex(s => s.id === z.vergleich) + 1 : 0;
  try{ history.replaceState(null, '', link.bau(W.namen[W.aktiv], W.von, {fassung: fi || null, lesen: !!z, stelle: z ? z.stelle : null, vergleich: vi || null})); }catch(_){}
}
function ortWiederholen(ziel){
  const Z = W.Z; if(!Z) return;
  let o = null; try{ o = JSON.parse(sessionStorage.getItem(ORT) || 'null'); }catch(_){}
  if(o && o.mond !== Z.m.id) o = null;
  // Die Adresszeile gewinnt (ein geteilter Link), sonst der gemerkte Ort dieses Tabs
  const si = ziel && ziel.fassung ? ziel.fassung - 1 : o && o.same ? Z.m.samen.findIndex(s => s.id === o.same) : -1;
  if(si < 0 || !Z.m.samen[si]) return;
  Z.sofort(); B.waehle({art: 'same', i: si, mond: Z.m, zelle: Z}, 2);
  const lesen = ziel && ziel.fassung ? ziel.lesen : !!(o && o.stoff);
  if(lesen){ const vg = ziel && ziel.vergleich ? Z.m.samen[ziel.vergleich - 1]?.id : o && o.stoff ? o.stoff.vergleich : null;
    const stelle = ziel && ziel.stelle ? ziel.stelle - 1 : o && o.stoff ? o.stoff.stelle : null;
    B.stoff.oeffne({mond: Z.m, i: si, modus: vg ? 'vergleich' : 'lesen', vergleich: vg, stelle}); }
}

/* Einer belegten Beziehung folgen, auch in einen anderen Mond; der Rückweg wird gemerkt */
function hierMerken(){ const Z = W.Z; if(!Z || !U.sel) return null;
  return {mond: Z.m.id, same: U.sel.art === 'same' ? Z.m.samen[U.sel.i].id : null, keim: U.sel.art === 'keim' ? (Z.m.keim[Z.m.keim.length - 1] || {}).id : null}; }
function folge(variantId, mond){
  const Z = W.Z; if(!Z) return;
  const hier = hierMerken(); if(hier) U.weg.push(hier);
  if(mond && mond.id !== Z.m.id){
    const i = mondNachId(mond.id);
    if(i >= 0){ oeffneMond(i, {ohneAufzug: true, waehle: variantId, stufe: 2, behalteWeg: true}); B.zeile(`In „${kurz(mond.titel, 50)}“. Der Rückweg steht oben links.`); }
    return; }
  const si = Z.m.samen.findIndex(s => s.id === variantId);
  if(si >= 0) B.waehle({art: 'same', i: si, mond: Z.m, zelle: Z}, 2);
  else if(Z.m.keim.some(v => v.id === variantId)) B.waehle({art: 'keim', mond: Z.m, zelle: Z}, 2);
}

/* ------------------------------------------------- Lebendig: neue Stände */
const beschaeftigt = () => U.lese || U.siegel || U.waehlen || U.bind || U.mode || U.paar || (W.Z && W.Z.S.aufzug) || document.querySelector('.halten.drueckt');
async function nachsehen(){
  try{
    const st = await schreib.lesen('/lichtwerk/stand');
    if(W.ruht){ await laden(); start(); return; }
    if(st.stand !== W.stand){
      if(beschaeftigt()){ if(!W.neuesWartet){ W.neuesWartet = true; if(!U.siegel) B.zeile('Es gibt Neues. Es erscheint, sobald du fertig bist.'); } }
      else await erneuern(); }
  }catch(e){ if(e instanceof schreib.Ruhe && !W.ruht) B.zeile('SPiRALCELLS antwortet gerade nicht. Das Bild wartet.'); }
}
/* Nur ein Lauf zur Zeit; der Zustand wird erst nach dem Laden gelesen */
let erneuernLauf = Promise.resolve(), erneuernAktiv = 0;
function erneuern(von, opt = {}){ erneuernAktiv++; const p = erneuernLauf.then(() => erneuernJetzt(von, opt)).finally(() => { erneuernAktiv--; }); erneuernLauf = p.catch(() => {}); return p; }
async function erneuernJetzt(von, opt){
  const {daten, stand} = await schreib.lesenMitStand('/lichtwerk/graph');
  // Auffrischen aus dem Hintergrund wartet, solange gelesen, gehalten oder gesiegelt wird; eigene Schreibvorgänge (explizit) nicht
  if(!opt.explizit && beschaeftigt()){ W.neuesWartet = true; return; }
  W.neuesWartet = false;
  const alt = W.Z, altId = alt && alt.m.id, altSel = U.sel, altSelId = altSel && altSel.art === 'same' ? alt.m.samen[altSel.i]?.id : null, stufe = U.stufe;
  const altB = W.B; W.B = bestand(daten); W.stand = stand;
  const tueren = W.N ? W.N.tueren : []; W.N = new Netz(W.B, W.ordnung); W.N.tueren = tueren; W.N.neu = W.neuMonde || null; W.namen = link.namen(W.B.monde); dachNamen();
  zuletztMerken();
  if(!alt || !altId){ return; }
  const i = mondNachId(altId); if(i < 0) return;
  W.aktiv = i; const m = W.B.monde[i];
  // Hat sich an diesem Mond nichts geändert, bleibt die Zelle, wie sie ist (nur Bestand und Netz sind neu)
  const fingerabdruck = mm => mm.samen.map(s => s.id + s.status).join() + '|' + mm.keim.map(v => v.id + v.status).join() + '|' + mm.faeden.length + '|' + mm.befunde.length;
  if(fingerabdruck(m) === fingerabdruck(alt.m)){ alt.m = m; alt.origin = W.N.pos[i]; if(altSel && altSel.mond) altSel.mond = m; return; }
  const Z = new Zelle(m, {origin: W.N.pos[i], RM: W.RM, au: klang, ohneAufzug: true}); zuletztMarkieren(Z);
  // Bewegung übernehmen, damit nichts springt; Flüge (auch ein laufender Einwurf) wandern mit
  for(const k of ['theta', 'kv']) Z.S[k] = alt.S[k].slice();
  for(const k of ['clock', 'rb', 'r', 'psi', 'C', 'hold', 'holdT', 'holdP', 'alpha', 'aV', 'qTh', 'qI', 'hopP', 'hopTm', 'arrive', 'Rs', 'yRim', 'Sc', 'trH', 'trN', 'kickT', 'kickAmt', 'flights', 'waves', 'still', 'rot']) Z.S[k] = alt.S[k];
  Z.TR = alt.TR;
  const warKristall = new Set(alt.m.kristall.map(s => s.id)), neuKristall = m.kristall.some(s => !warKristall.has(s.id));
  if(alt.S.locked || alt.S.frozen){ Z.S.locked = alt.S.locked; Z.S.frozen = alt.S.frozen; Z.S.lk = alt.S.lk; Z.S.lockT = alt.S.lockT; Z.S.lockedOnce = alt.S.lockedOnce; Z.S.rot = alt.S.rot; }
  else if(m.kristall.length){ Z.S.locked = false; Z.S.frozen = false; Z.S.lk = 0; Z.S.lockT = -99; }
  if(!m.kristall.length && alt.S.locked){ Z.S.locked = false; Z.S.frozen = false; Z.S.lockedOnce = false; }   // Kristall zurückgenommen
  // gleiche Drehlage wie vorher
  const ref = m.samen.findIndex(s => alt.m.samen.some(a => a.id === s.id));
  if(ref >= 0 && !Z.S.frozen){ const ai = alt.m.samen.findIndex(a => a.id === m.samen[ref].id), A = [0, 0, 0], Bp = [0, 0, 0];
    alt.seedPos(ai, A); Z.seedPos(ref, Bp); const d = Math.atan2(A[2] - alt.origin[2], A[0] - alt.origin[0]) - Math.atan2(Bp[2] - Z.origin[2], Bp[0] - Z.origin[0]); Z.S.rot += d; }
  // neue Ausprägungen fliegen herein: vom Einwurf aus oder vom Kopf ihrer Stimme
  const altIds = new Set(alt.m.samen.map(s => s.id)), HP = [0, 0, 0, 0];
  m.samen.forEach((s, si) => { if(altIds.has(s.id)) return;
    let from = von; if(!from){ if(typeof s.stimme === 'number'){ Z.headPos(s.stimme, HP); from = [HP[0], HP[1], HP[2]]; } else from = [Z.origin[0], Z.origin[1] + Z.S.yRim + 0.6, Z.origin[2]]; }
    for(let j = 0; j < Z.seedCount[si]; j++){ const g = Z.seedFirst[si] + j; Z.gBorn[g] = Z.S.clock + j * 0.012; Z.gFrom[g * 3] = from[0]; Z.gFrom[g * 3 + 1] = from[1]; Z.gFrom[g * 3 + 2] = from[2]; }
    Z.kickAt(from); });
  W.Z = Z;
  if(neuKristall) Z.kristallisiert();
  if(U.waehlen && U.waehlen.mondId !== m.id) U.waehlen = null;
  if(altSel && (altSel.art === 'same' || altSel.art === 'keim')){
    const si = altSelId ? m.samen.findIndex(s => s.id === altSelId) : -1;
    if(altSel.art === 'keim') B.waehle({art: 'keim', mond: m, zelle: Z}, stufe); else if(si >= 0) B.waehle({art: 'same', i: si, mond: m, zelle: Z}, stufe); else B.waehle(null);
  }
}

/* ------------------------------------------------------- Schreibwege */
const SATZ = {400: 'Das Lichtwerk konnte das nicht sauber übergeben.', 403: 'Das ist im Lichtwerk nicht vorgesehen.', 409: 'Das gibt es schon.', 413: 'Das ist zu groß zum Ablegen.', 422: 'SPiRALCELLS hat das nicht angenommen.'};
const ablehnung = e => e instanceof schreib.Ruhe ? 'SPiRALCELLS antwortet gerade nicht.' : (SATZ[e.status] || 'Das wurde nicht angenommen.');
async function ralfSicher(){
  if(W.B.mensch) return W.B.mensch;
  return new Promise(res => {
    B.siegel('Für dich gibt es in SPiRALCELLS noch keinen eigenen Eintrag.', 'Ablegen, Verbinden und Behalten geschehen in deinem Namen. Halten legt den Eintrag „Ralf“ an, als Mensch, nicht als Modell.',
      [B.haltKnopf('Eintrag anlegen', 'halten', 'gold', 1500, async () => {
        try{ const a = await schreib.ralfAnlegen(); B.schliesseSiegel(); try{ await erneuern(null, {explizit: true}); }catch(_){} res(W.B.mensch || a); }
        catch(e){ B.schliesseSiegel(); B.zeile(ablehnung(e) + ' Es wurde nichts angelegt.'); res(null); } })],
      () => res(null));
  });
}
function einwurf(text, sx, sy, opt = {}){
  if(!W.B || W.ruht){ B.zeile('SPiRALCELLS schläft gerade. Ablegen geht, sobald es wach ist.'); return; }
  if(U.netT > 0.5 || !W.Z){ B.zeile('Erst einen Mond öffnen, dann darin ablegen.'); return; }
  if(U.siegel){ B.zeile('Erst das offene Siegel beantworten.'); return; }
  const Z = W.Z, m = Z.m;
  // Ablegen: die Ausprägung unter dem Finger. Einfügen (ohne Ort): die gewählte, sonst der Keim.
  const ort = sx != null; if(!ort){ sx = CAM.cssW / 2; sy = CAM.cssH * 0.96; }
  let si = opt.zielId ? m.samen.findIndex(s => s.id === opt.zielId) : ort ? B.trefferSame(sx, sy, 22) : -1; if(si < 0 && U.sel && U.sel.art === 'same') si = U.sel.i;
  const zielId = si >= 0 ? m.samen[si].id : null, zielLabel = si >= 0 ? m.samen[si].label : m.keimSatz;
  const start = pointerWorld(sx, sy, CAM.target), ziel = [0, 0, 0];
  if(si >= 0) Z.seedPos(si, ziel); else Z.keimPos(ziel);
  const dur = W.RM ? 0.05 : 0.9;
  klang.wurf(); burst(start[0], start[1], start[2], SILVER, 14, 0.25 * Math.max(1, CAM.S), 0.6, 0.01 * Math.max(1, CAM.S));
  Z.S.flights.push({x: start[0], y: start[1], z: start[2], tx: ziel[0], ty: ziel[1], tz: ziel[2], t: 0, dur, col: SILVER,
    land: () => { const Zj = W.Z; Zj && Zj.kickAt(ziel); klang.landung(); burst(ziel[0], ziel[1], ziel[2], SILVER, 40, 0.7, 0.9, 0.012); }});
  // Der Ablauf hängt nicht am Bild: auch bei Pause oder neuer Zelle geht die Frage nicht verloren
  setTimeout(() => einwurfFragen(text, zielId, zielLabel, m.id, ziel, opt.gesehen), dur * 1000 + 60);
}
async function einwurfFragen(text, zielId, zielLabel, mondId, ziel, gesehen){
  const ralf = await ralfSicher(); if(!ralf){ B.zeile('Nichts abgelegt.'); return; }
  const m = W.B.mondVon.get(mondId); if(!m){ B.zeile('Dieser Mond ist gerade nicht da. Nichts abgelegt.'); return; }
  const rid = schreib.neueKennung(), body = schreib.einwurfKoerper(W.B, m, text, zielId, ralf, rid, gesehen);
  const anders = (gesehen || []).filter(id => id !== zielId).map(id => W.B.fassungen.get(id)).filter(Boolean);
  const satz = (zielId ? `In „${kurz(m.titel, 48)}“ ablegen, als Weiterarbeit an „${kurz(zielLabel, 56)}“` : m.keim.length ? `In „${kurz(m.titel, 48)}“ ablegen, zur Ausgangsfrage` : `In „${kurz(m.titel, 48)}“ ablegen, als eigenen neuen Zweig`)
    + (anders.length ? `, gelesen mit „${kurz(anders[0].label, 40)}“?` : '?');
  const n = text.length.toLocaleString('de-DE');
  B.siegel(satz, kurz(text.replace(/^[#>\s]+/gm, ''), 240), [B.haltKnopf('Ablegen', `${n} Zeichen · halten`, 'gold', 1300, () => einwurfSenden(body, ziel))], () => B.zeile('Nichts abgelegt.'));
}
async function einwurfSenden(body, ziel){
  schreib.merkeEinwurf(body); B.schliesseSiegel(); B.zeile('Wird abgelegt …');
  try{ await schreib.ablegen(body); }
  catch(e){
    if(e instanceof schreib.Abgelehnt){ schreib.vergissEinwurf(); B.zeile(ablehnung(e) + ' Nichts abgelegt.'); return; }   // abgelehnt: kein sinnloser zweiter Versuch
    B.siegel('Nicht angekommen. SPiRALCELLS antwortet gerade nicht.', 'Der Einwurf behält seine Kennung. Ein zweiter Versuch legt ihn höchstens einmal ab.',
      [B.haltKnopf('Noch einmal', 'halten', '', 900, () => einwurfSenden(body, ziel))], () => { schreib.vergissEinwurf(); B.zeile('Nichts abgelegt.'); });
    return; }
  schreib.vergissEinwurf();
  try{ await erneuern(ziel, {explizit: true}); B.zeile('Abgelegt. Eine neue Ausprägung in deinem Zweig.'); }
  catch(e){ B.zeile('Abgelegt. Das Bild zeigt es, sobald SPiRALCELLS wieder antwortet.'); }
}
async function status(v, st, satz){
  try{ await schreib.statusSetzen(v.id, st); }
  catch(e){ B.zeile(ablehnung(e) + ' Der Status blieb, wie er war.'); return; }
  try{ await erneuern(null, {explizit: true}); }catch(e){}
  B.zeile(satz); if(U.sel) B.waehle(U.sel, 2);
}
async function kanteFragen(von, nach){
  const ralf = await ralfSicher(); if(!ralf){ B.zeile('Nichts verbunden.'); return; }
  const V = W.B.fassungen, a = V.get(von), b = V.get(nach); if(!a || !b){ B.zeile('Nichts verbunden.'); return; }
  U.paar = [von, nach];
  const knopf = (typ, satz) => B.haltKnopf(satz, 'halten', '', 1000, async () => {
    B.schliesseSiegel(); U.paar = null;
    try{ const r = await schreib.verbinden(von, nach, typ, ralf); try{ await erneuern(null, {explizit: true}); }catch(_){}
      B.zeile(r && r.schon_vorhanden ? 'Diese Verbindung gab es schon. Nichts doppelt angelegt.' : 'Verbunden. Gemischt, nicht verschmolzen.'); }
    catch(e){ B.zeile(ablehnung(e) + ' Nichts verbunden.'); } });
  B.siegel(`„${kurz(a.label, 60)}“ … „${kurz(b.label, 60)}“`, 'Wie bezieht sich die erste auf die zweite? Nichts wird zusammengeführt.',
    [knopf('verweist-auf', 'verweist auf'), knopf('erweitert', 'erweitert'), knopf('widerspricht', 'widerspricht')], () => { U.paar = null; B.zeile('Nichts verbunden.'); });
}

/* Eine Form behalten: erst Ralfs Eintrag, dann der Server; ein Licht fliegt zurück ans Original */
async function formBehalten(v, richtung){
  const ralf = await ralfSicher(); if(!ralf) return {satz: 'Nichts behalten.'};
  let r;
  try{ r = await schreib.formBehalten(v.id, richtung); }
  catch(e){ return {satz: e.message === 'Nicht angekommen.' ? 'Ob die Form angekommen ist, ist gerade unklar. Noch einmal halten legt sie höchstens einmal ab.'
    : e.message || 'Das wurde nicht angenommen. Nichts behalten.'}; }   // der Server sagt, ob etwas geschrieben sein kann
  const Z = W.Z, ziel = [0, 0, 0];
  if(Z){ const si = Z.m.samen.findIndex(s => s.id === v.id); if(si >= 0) Z.seedPos(si, ziel); else Z.keimPos(ziel);
    const start = pointerWorld(CAM.cssW / 2, CAM.cssH / 2, CAM.target), dur = W.RM ? 0.05 : 0.8;
    klang.wurf(); Z.S.flights.push({x: start[0], y: start[1], z: start[2], tx: ziel[0], ty: ziel[1], tz: ziel[2], t: 0, dur, col: SILVER,
      land: () => { const Zj = W.Z; Zj && Zj.kickAt(ziel); klang.landung(); if(!W.RM) burst(ziel[0], ziel[1], ziel[2], SILVER, 30, 0.6, 0.8, 0.01); }}); }
  try{ await erneuern(Z ? ziel : null, {explizit: true}); }catch(_){}
  // Das neue Korn zeigt sich: gewählt, mit seiner Lesefläche (Form ohne Modell, Faden zum Original)
  const Zn = W.Z, neu = Zn ? Zn.m.samen.map((s, i) => [s, i]).filter(([s]) => s.form && s.original === v.id).sort((a, b) => b[0].zeit - a[0].zeit)[0] : null;
  if(neu) B.waehle({art: 'same', i: neu[1], mond: Zn.m, zelle: Zn}, 2);
  B.zeile(r && r.schon ? 'Diese Form lag schon in deinem Zweig. Nichts doppelt angelegt.' : 'Behalten. Ein neues Korn in deinem Zweig, mit einem Faden zum Original.');
  return {ok: true};
}

/* ------------------------------------------------------------- Lauf */
let last = performance.now(), acc = 0, perfAcc = 0, perfN = 0, nachT = 0;
function advance(rdt){
  W.wall += rdt;
  const k = 1 - Math.exp(-rdt / (W.RM ? 0.12 : 0.9));
  U.netK += (U.netT - U.netK) * (1 - Math.exp(-rdt / (U.fahrt ? 0.28 : W.RM ? 0.12 : 1.5)));
  if(U.fahrt && (performance.now() > U.fahrt.bis || Math.abs(U.netT - U.netK) < 0.003)){ U.netK = U.netT; U.fahrt = null; }
  U.kelchK += (U.kelchT - U.kelchK) * (1 - Math.exp(-rdt / (W.RM ? 0.12 : 1.1)));
  U.dachK += ((U.dach != null ? 1 : 0) - U.dachK) * (1 - Math.exp(-rdt / (W.RM ? 0.1 : 0.7)));
  U.leseK += ((U.lese ? 1 : 0) - U.leseK) * k;
  U.kelchZeit += U.kelchK > 0.5 ? rdt : 0; U.netZeit += rdt;
  if(W.Z) W.Z.RM = W.RM;
  if(W.Z) W.Z.kelchK = W.RM ? Math.round(U.kelchK) : 0.5 - 0.5 * Math.cos(Math.PI * clamp(U.kelchK, 0, 1));
  if(U.mode === 'press' && performance.now() - U.t0 > (U.pressSeed >= 0 ? 700 : 450)){
    if(U.pressSeed >= 0 && W.Z){ U.mode = 'bind'; U.bind = {von: U.pressSeed, vonId: W.Z.m.samen[U.pressSeed].id, x: U.x, y: U.y, x0: U.x, y0: U.y, ziel: -1, ruhT: 0}; B.zeile('Zur zweiten Ausprägung ziehen, dort loslassen.'); }
    else if(W.Z){ U.mode = 'hold'; W.Z.S.holdT = 1; W.Z.S.holdP = pointerWorld(U.x, U.y, CAM.target); } }
  if(!U.paused && W.Z){ acc += rdt; let n = 0; while(acc >= DT && n < 30){ W.Z.step(DT, false); acc -= DT; n++; } if(n >= 30) acc = 0; }
  if(!U.paused) updSparks(rdt);
  if(!U.paused && W.wall - U.last > 4.5 && U.mode !== 'drag'){ U.yawOff = Math.atan2(Math.sin(U.yawOff), Math.cos(U.yawOff)); const kk = 1 - Math.exp(-rdt * 1.4);
    U.yawOff -= U.yawOff * kk; U.elevOff -= U.elevOff * kk; if(W.wall - U.last > 6) U.zoom += (1 - U.zoom) * kk; }
}
function draw(rdt){
  M.resize();
  const cam = regie(U, W.Z, W.ruht ? null : W.N, W.RM); setCamera(cam, M.W, M.H);
  L.pc = 0;
  const fk = U.flug ? Math.sin(Math.PI * clamp((performance.now() - U.flug.t0) / U.flug.dauer, 0, 1)) : 0;
  if(U.flug && performance.now() - U.flug.t0 > U.flug.dauer) U.flug = null;
  const visZ = W.Z ? (1 - sstep(0.25, 0.7, U.netK)) * (1 - 0.7 * fk) : 0, visN = W.N && !W.ruht ? Math.max(sstep(0.05, 0.5, U.netK), 0.75 * fk) : 0;
  if(W.Z) baueZelle(W.Z, U, W.wall, rdt, visZ);
  if(visN > 0) baueNetz(W.N, U, W.wall, visN, W.aktiv, visZ);
  // Verbinden: ein Faden folgt dem Finger
  if(U.bind && W.Z){ const A = [0, 0, 0]; W.Z.seedPos(U.bind.von, A); const Bp = pointerWorld(U.bind.x, U.bind.y, CAM.target);
    if(U.bind.ziel >= 0) W.Z.seedPos(U.bind.ziel, Bp);
    for(let s = 1; s < 40; s++){ const f = s / 40; P(mix(A[0], Bp[0], f), mix(A[1], Bp[1], f) + Math.sin(Math.PI * f) * 0.04, mix(A[2], Bp[2], f), 0.007, SILVER[0], SILVER[1], SILVER[2], 0.9 * (0.4 + 0.6 * f)); }
    if(U.bind.ziel >= 0) screenRing(Bp, 0.03 * CAM.S, GOLDC, 0.6); }
  if(U.mode === 'press' && U.pressW && W.Z && U.netK < 0.3){ const f = clamp((performance.now() - U.t0) / (U.pressSeed >= 0 ? 700 : 450), 0, 1); screenRing(U.pressW, 0.045 * CAM.S, WG, 0.3, f); }
  if(U.paar && W.Z){ const Z = W.Z, idx = id => Z.m.samen.findIndex(s => s.id === id), a = idx(U.paar[0]), b = idx(U.paar[1]);   // das Paar im Siegel, als zarter Faden
    if(a >= 0 && b >= 0){ const A = [0, 0, 0], Bp = [0, 0, 0]; Z.seedPos(a, A); Z.seedPos(b, Bp);
      for(let s = 1; s < 48; s++){ const f = s / 48; P(mix(A[0], Bp[0], f), mix(A[1], Bp[1], f) + Math.sin(Math.PI * f) * 0.04, mix(A[2], Bp[2], f), 0.006, SILVER[0], SILVER[1], SILVER[2], 0.35 + 0.25 * Math.sin(W.wall * 3 - f * 6)); } } }
  if(U.waehlen && W.Z){ const A = [0, 0, 0], v = U.waehlen.sel; if(v.art === 'same') W.Z.seedPos(v.i, A); else W.Z.keimPos(A); screenRing(A, (0.03 + 0.006 * Math.sin(W.wall * 5)) * CAM.S, SILVER, 0.6); }
  drawSparks();
  const Z = W.Z, still = Z && Z.S.still > 0 ? 1 : 0, lockGlow = Z ? Math.max(0, 1 - (Z.S.clock - Z.S.lockT) / 1.2) * (W.RM ? 0.3 : 1) : 0;
  M.render(W.wall, {neb: 0.4, thr: 0.5, par: [U.yawOff * 0.15, U.elevOff * 0.12], still: W.RM,
    bloom: 0.32 + (Z ? (0.42 * Z.S.lk * (1 - sstep(4, 10, Z.S.clock - Z.S.lockT)) + 0.1 * Z.S.lk + 0.12 * Z.S.C) * (1 - U.netK) : 0) + 0.6 * lockGlow, exp: (1.05 + 0.08 * (Z ? Z.S.hold : 0)) * (still ? 0.62 : 1)});
  ui(cam);
  klangFrame(W.ruht ? null : Z, U, [0, 0, 0, 0], U.netK);
}
function ui(cam){
  const Z = W.Z;
  // Titel, dann ein Satz über den Zustand
  if(W.titelBis > 0 && W.wall > W.titelBis && Z && U.netT < 0.5 && !U.waehlen){ W.titelBis = -1; if(!U.lese) B.zeile(B.mondSatz(Z.m)); }
  // Winkel: sichtbar beim Aufzug, beim Einrasten und kurz danach
  if(Z && !W.ruht && !Z.traum && U.netK < 0.3 && (Z.S.aufzug || Z.S.still > 0 || Z.S.clock - Z.S.lockT < 4) && Z.voices.length){
    const s = toScreen(Z.origin[0], Z.origin[1] + Z.S.yRim, Z.origin[2] - Z.S.Rs * 0.2);
    const deg = Z.winkelGrad, locked = Z.S.locked && Math.abs(deg - 137.508) < 0.03;
    angEl.textContent = (locked ? '137,508' : deg.toFixed(1).replace('.', ',')) + '°'; angEl.classList.toggle('gold', locked);
    angEl.style.transform = `translate(${Math.round(s[0] + Z.S.Rs / Math.max(0.01, CAM.S) * CAM.cssH * 0.5 + 14)}px,${Math.round(s[1] - 10)}px)`; angEl.style.opacity = '0.75';
  } else angEl.style.opacity = '0';
  // Tagesmarken am Kelch
  const zeigTage = Z && U.kelchK > 0.6 && U.netK < 0.2 && Z.tage.length;
  if(zeigTage){ if(tageEl.childElementCount !== Z.tage.length){ tageEl.innerHTML = ''; for(const t of Z.tage){ const s = document.createElement('span'); s.textContent = new Date(t.t).toLocaleDateString('de-DE', {day: 'numeric', month: 'short'}); tageEl.append(s); } }
    Z.tage.forEach((t, j) => { const s = toScreen(Z.origin[0], Z.origin[1] + t.y, Z.origin[2]); const el = tageEl.children[j]; el.style.transform = `translate(${Math.round(s[0] - Z.memR() / CAM.S * CAM.cssH * 0.55 - 70)}px,${Math.round(s[1] - 6)}px)`; el.style.opacity = String(clamp((U.kelchK - 0.6) * 3, 0, 0.9)); }); }
  else if(tageEl.childElementCount) tageEl.innerHTML = '';
  // Die Stimmen sagen kurz ihren Namen; genannte, die noch nicht lesen, leuchten dabei auf
  const namenK = Z && !W.ruht && U.netK < 0.3 && !U.lese ? clamp((W.wall - (W.namenAb || 0)) * 2, 0, 1) * clamp(((W.namenBis || 0) - W.wall) * 1.5, 0, 1) : 0;
  // Namen im Speichenwinkel auf der Hülle: eine feste Rose, auch wenn die Köpfe gerade beieinander laufen
  const mitte = Z ? toScreen(...Z.center()) : null, rpx = Z ? Z.memR() / Math.max(0.01, CAM.S) * CAM.cssH * 0.5 : 0;
  for(let i = 0; i < 5; i++){ const el = namenEl.children[i], an = namenK > 0.01 && Z && Z.has[i] && mitte && mitte[2] > 0;
    if(!an){ if(el.style.opacity !== '0') el.style.opacity = '0'; continue; }
    const R = Math.min(rpx + 22, CAM.cssH * 0.44, CAM.cssW * 0.44), a = -Math.PI / 2 + i * TAU / 5;
    const w = el.offsetWidth || 60, ca = Math.cos(a), links = ca < -0.2 ? w : ca > 0.2 ? 0 : w / 2;   // der ganze Name bleibt im Bild, auch am Handy
    const x = clamp(mitte[0] + ca * R - links, 14, CAM.cssW - 14 - w), y = clamp(mitte[1] + Math.sin(a) * R, 70, CAM.cssH - 60);
    el.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px) translate(0,-50%)`; el.style.opacity = (namenK * 0.85).toFixed(2); }
  U.namenAn = namenK > 0.01;
  // Dächer und Mitte tragen im Netz ihren Namen
  if(dachEl && W.N){ const zeig = U.netK > 0.55 && !W.ruht, kids = dachEl.children, nd = W.N.daecher.length;
    for(let j = 0; j < kids.length; j++){ const el = kids[j], p = j === 0 ? U.mitteSchirm : j <= nd ? U.daecherSchirm[j - 1] : U.ohneSchirm;
      const leise = U.dach != null && j - 1 !== U.dach ? 0.25 : 1;
      if(!zeig || !p || p[2] <= 0){ if(el.style.opacity !== '0') el.style.opacity = '0'; continue; }
      el.style.transform = `translate(${Math.round(p[0])}px,${Math.round(p[1] - 14)}px) translate(-50%,-100%)`; el.style.opacity = String((clamp((U.netK - 0.55) * 2.5, 0, 0.85) * leise).toFixed(2)); } }
  // Türen im Netz tragen leise ihren Namen
  const zeigTueren = W.N && U.netK > 0.6;
  for(let j = 0; j < tuerEl.children.length; j++){ const el = tuerEl.children[j], p = U.tueren[j];
    if(!zeigTueren || !p || p[2] <= 0){ if(el.style.opacity !== '0') el.style.opacity = '0'; continue; }
    el.style.transform = `translate(${Math.round(p[0])}px,${Math.round(p[1] + 16)}px) translateX(-50%)`; el.style.opacity = String(clamp((U.netK - 0.6) * 2.5, 0, 0.6)); }
  U.betont = namenK > 0.01 && Z ? B.stummeStimmen(Z.m) : null;
  if(W.neuesWartet && !beschaeftigt() && !erneuernAktiv){ W.neuesWartet = false; erneuern().catch(() => {}); }   // genau einmal, nicht in jedem Bild
  B.uiFrame();
  ortAktualisieren();
}
function frame(now){
  const rdt = Math.min(0.1, (now - last) / 1000); last = now;
  advance(rdt); draw(rdt);
  perfAcc += rdt; perfN++;
  if(perfAcc > 1.5){ const avg = perfAcc / perfN, at30 = Math.abs(avg - 1 / 30) < 0.004;
    if(avg > 0.024 && !at30 && M.qScale > 0.6) M.qScale = Math.max(0.6, M.qScale - 0.1);
    else if(avg < 0.017 && M.qScale < 1) M.qScale = Math.min(1, M.qScale + 0.05);
    perfAcc = 0; perfN = 0; }
  nachT += rdt; if(nachT > (W.ruht ? 5 : 6) && !document.hidden){ nachT = 0; nachsehen(); }
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------- Start */
B.installiere({oeffneMond, zumNetz, zurZelle, zurueck, ortZurueck, folge, einwurf, status, kanteFragen, formBehalten, insDach, ausDach, oeffneStoff, zurueckAusStoff, folgeStoff, merkeOrt, rueckSatz});
/* Ein lesbarer Link: im Netz beginnen und in die Zelle fahren (höchstens 1,5 s; Berührung oder Esc schneidet ab) */
function linkFahrt(ziel){
  W.von = ziel.von || W.von || null;
  const i = ziel.mond && W.namen ? W.namen.indexOf(ziel.mond) : -1;
  U.netK = 1; U.netT = 1;
  if(i < 0){ zumNetz(); try{ history.replaceState(null, '', W.von ? '#von=' + W.von : location.pathname); }catch(e){} return 'netz'; }   // unbekannter Name: still ins Netz
  oeffneMond(i, {ohneAufzug: true});
  if(W.RM) U.netK = 0; else U.fahrt = {bis: performance.now() + 1500};
  return 'zelle';
}
addEventListener('hashchange', () => { const ziel = link.lies(location.hash); if(W.B && !W.ruht && ziel.mond && (!W.namen || W.namen[W.aktiv] !== ziel.mond)) linkFahrt(ziel); });
/* Die letzten Einträge, immer: ein leiser Ring im Netz und an ihren Körnern in der Zelle, damit das Bild nie leer ist */
function zuletztMerken(){
  W.zuletzt = ankunft.letzte(W.B); W.zuletztIds = new Set(W.zuletzt.map(e => e.id));
  const monde = new Map(); for(const e of W.zuletzt){ if(!monde.has(e.mondId)) monde.set(e.mondId, []); monde.get(e.mondId).push(e); }
  if(W.N) W.N.zuletzt = monde;
  if(W.Z) zuletztMarkieren(W.Z);
}
function zuletztMarkieren(Z){ Z.zuletztIdx = W.zuletztIds ? Z.m.samen.map((s, i) => W.zuletztIds.has(s.id) ? i : -1).filter(i => i >= 0) : []; }
function zuletztSatz(){ const e = W.zuletzt && W.zuletzt[0]; return e ? ankunft.zuletztSatzAus({label: kurz(e.label, 80), stimme: typeof e.stimme === 'number' ? STIMMEN[e.stimme].name : null, titel: kurz(e.titel, 80), wann: e.wann}) : ''; }
/* Wiederkommen: nur, was seit dem letzten Besuch eingetragen wurde, fliegt ein, in echter Reihenfolge */
function einflug(Z, liste){
  if(!liste || !Z || W.RM) return 0;
  const viele = liste.filter(x => x.stimme === QUELLE).length > ankunft.UEBERNAHME_AB, HP = [0, 0, 0, 0];
  let k = 0;
  for(const x of liste){
    if(viele && x.stimme === QUELLE) continue;   // eine große technische Übernahme bekommt einen Satz statt eines Einflugs
    const si = Z.m.samen.findIndex(s => s.id === x.id); if(si < 0) continue;
    const s = Z.m.samen[si]; let from;
    if(typeof s.stimme === 'number' && Z.has[s.stimme]){ Z.headPos(s.stimme, HP); from = [HP[0], HP[1], HP[2]]; } else from = [Z.origin[0], Z.origin[1] + Z.S.yRim + 0.6, Z.origin[2]];
    const t0 = Z.S.clock + 0.9 + k * 0.5; k++;
    for(let j = 0; j < Z.seedCount[si]; j++){ const g = Z.seedFirst[si] + j; Z.gBorn[g] = t0 + j * 0.012; Z.gFrom[g * 3] = from[0]; Z.gFrom[g * 3 + 1] = from[1]; Z.gFrom[g * 3 + 2] = from[2]; }
  }
  return k ? 0.9 + k * 0.5 + 1.2 : 0;
}
function start(){
  // Ein Link (auch der eigene Name in der Adresszeile nach einem Neuladen) bestimmt den Ort; das Wiederkommen gilt trotzdem
  const ziel = WERKSTATT ? {mond: null, von: null} : link.lies(location.hash);
  const seit = WERKSTATT ? null : ankunft.zuletzt(), neu = ankunft.neuSeit(W.B, seit);
  W.neuMonde = neu.zahl ? neu.monde : null; W.N.neu = W.neuMonde;   // im Netz leuchten nur echte Ankünfte
  const ort = ziel.mond || ziel.von ? linkFahrt(ziel) : null;
  if(!ort){
    let id = null; try{ id = localStorage.getItem(MERK); }catch(e){}
    let i = neu.zahl && neu.juengster ? mondNachId(neu.juengster) : id ? mondNachId(id) : -1;
    if(i < 0){ // der jüngste Mond, in dem die Stimmen sprechen
      let best = -1, bt = -1; W.B.monde.forEach((m, j) => { if(m.stimmen.length && m.zeitspanne[1] > bt){ bt = m.zeitspanne[1]; best = j; } }); i = best >= 0 ? best : 0; }
    U.netK = 0; oeffneMond(i, {ohneAufzug: WERKSTATT || neu.zahl > 0});
  }
  if(!WERKSTATT && ort !== 'netz') ortWiederholen(ziel.mond ? ziel : null);
  if(!WERKSTATT){ const satz = neu.zahl ? ankunft.ankunftSatz(neu) : seit ? ankunft.ankunftSatz(neu) + ' ' + zuletztSatz() : zuletztSatz();
    if(satz.trim()){ B.zeile(satz.trim()); W.titelBis = W.wall + 7; } }
  // Der Merker wird erst gesetzt, wenn die Ankunft zu Ende gezeigt ist; ohne Merker war nichts neu
  const hier = ort !== 'netz' && W.Z && neu.monde.get(W.Z.m.id), dauer = neu.zahl && hier ? einflug(W.Z, hier) : 0;
  if(!WERKSTATT){ const geladen = W.geladen; setTimeout(() => ankunft.merke(geladen), dauer * 1000); }
  const touch = matchMedia('(pointer: coarse)').matches;
  document.getElementById('hint').textContent = 'Tippen entfaltet · Ziehen dreht · Halten verbindet';
  if(WERKSTATT) szene();
  W.touch = touch;
}
M.resize(); requestAnimationFrame(frame);
laden().then(() => { start(); const offen = schreib.offenerEinwurf(); if(offen && W.B.mondVon.get(offen.work_id)){
    const i = mondNachId(offen.work_id); oeffneMond(i, {ohneAufzug: true});
    B.siegel('Ein Einwurf ist vorhin nicht sicher angekommen.', kurz(offen.content, 200), [B.haltKnopf('Noch einmal', 'halten', '', 900, () => einwurfSenden(offen, null))], () => { schreib.vergissEinwurf(); B.zeile('Nichts abgelegt.'); }); } })
  .catch(() => ruhen());

/* Werkstatt-Szenen für reproduzierbare Standbilder: ?werkstatt&szene=netz|zelle|aufzug|kelch|marke|lese|solo&mond=…&same=…&stimme=… */
function szene(){
  const q = new URLSearchParams(location.search), sz = q.get('szene'); if(!sz || !W.B) return;
  const i = W.B.monde.findIndex(m => m.titel.startsWith(q.get('mond') || 'Zentrale')); if(i < 0) return;
  oeffneMond(i, {ohneAufzug: sz !== 'aufzug'});
  if(sz === 'netz') zumNetz();
  if(sz === 'kelch') U.kelchT = 1;
  if(sz === 'solo') U.solo = +(q.get('stimme') || 0);
  if(sz === 'marke' || sz === 'lese'){ const Z = W.Z, si = Z.m.samen.findIndex(s => s.label.startsWith(q.get('same') || ''));
    if(si >= 0) B.waehle({art: 'same', i: si, mond: Z.m, zelle: Z}, sz === 'lese' ? 2 : 1); }
}
/* Werkstattzugang nur mit ?werkstatt: Zustände setzen und Standbilder sichern */
if(WERKSTATT) window.__spiral = {U, W, B, schreib,
  oeffne(titel, opt = {}){ const i = W.B.monde.findIndex(m => m.titel.startsWith(titel)); if(i >= 0) oeffneMond(i, opt); return i; },
  netz: zumNetz, zelle: zurZelle, zurueck,
  kelch(on){ U.kelchT = on ? 1 : 0; }, sofort(){ W.Z && W.Z.sofort(); },
  laufe(sek){ const n = Math.round(sek * 60); for(let j = 0; j < n; j++) advance(1 / 60); draw(1 / 60); },
  waehle(i, stufe){ const Z = W.Z; if(i === 'keim') B.waehle({art: 'keim', mond: Z.m, zelle: Z}, stufe || 1); else if(i == null) B.waehle(null); else B.waehle({art: 'same', i, mond: Z.m, zelle: Z}, stufe || 1); },
  waehleMond(titel){ const i = W.B.monde.findIndex(m => m.titel.startsWith(titel)); B.waehle({art: 'mond', i, mond: W.B.monde[i]}, 1); return i; },
  async bild(name){ draw(1 / 60); const daten = canvas.toDataURL('image/jpeg', 0.9);
    const r = await fetch('/werkstatt/standbild?name=' + encodeURIComponent(name), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({bild: daten})}); return r.status; },
  kosten(n = 30){ const c = []; for(let j = 0; j < n; j++){ advance(1 / 60); const t1 = performance.now(); draw(1 / 60); c.push(performance.now() - t1); } c.sort((x, y) => x - y); return {cpuDraw: +c[n >> 1].toFixed(1), punkte: L.pc}; },
};
