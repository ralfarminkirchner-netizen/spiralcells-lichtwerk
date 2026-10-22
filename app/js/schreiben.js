/* =====================================================================
   SCHREIBEN — die vorgesehenen Wege, immer erst nach Bestätigung im Bild:
   Einwurf → POST /api/variant-branches (mit fester request_id, bei Wiederholung dieselbe)
   Kristallisieren → POST /api/variants/{id}/status
   Verbinden → POST /api/edges
   Dazu einmalig Ralfs eigener Eintrag (POST /api/agents), nur nach seinem Halten,
   und Behalten einer Form (POST /lichtwerk/formen/behalten): der Server formt neu und legt ab.
   Teilnahme, Rücknahme und Entstehungsbeleg nutzen die vorhandenen Mooncells-Verträge.
   Diese Belege haben keine Wiederholungskennung: bei unklarer Antwort zuerst neu lesen.
   ===================================================================== */

export class Ruhe extends Error {}
export class Abgelehnt extends Error { constructor(satz, status){ super(satz); this.status = status; } }

const BELEG_UNKLAR = 'Ob der Beleg gespeichert wurde, ist gerade unklar. Bitte lade den Bestand neu, bevor du erneut speicherst.';

async function senden(pfad, body, unklar = null){
  let r;
  try{ r = await fetch(pfad, {method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, body: JSON.stringify(body), cache: 'no-store'}); }
  catch(e){ throw new Ruhe(unklar || 'Nicht angekommen.'); }
  let daten = null; try{ daten = await r.json(); }catch(e){}
  if(r.status === 503) throw new Ruhe((daten && daten.satz) || unklar || 'SPiRALCELLS ruht gerade.');
  if(unklar && ((r.ok && (!daten || typeof daten !== 'object' || typeof daten.id !== 'string' || !daten.id)) || r.status >= 500 || r.status === 408)) throw new Ruhe(unklar);
  if(!r.ok) throw new Abgelehnt((daten && (daten.satz || (typeof daten.detail === 'string' ? daten.detail : ''))) || 'Das wurde nicht angenommen.', r.status);
  return daten;
}
export async function lesen(pfad){
  let r;
  try{ r = await fetch(pfad, {headers: {'Accept': 'application/json'}, cache: 'no-store'}); }
  catch(e){ throw new Ruhe('Nicht erreichbar.'); }
  if(r.status === 503) throw new Ruhe('SPiRALCELLS ruht gerade.');
  if(!r.ok) throw new Abgelehnt('Nicht lesbar.', r.status);
  return r.json();
}

export async function lesenMitStand(pfad){
  let r;
  try{ r = await fetch(pfad, {headers: {'Accept': 'application/json'}, cache: 'no-store'}); }
  catch(e){ throw new Ruhe('Nicht erreichbar.'); }
  if(r.status === 503) throw new Ruhe('SPiRALCELLS ruht gerade.');
  if(!r.ok) throw new Abgelehnt('Nicht lesbar.', r.status);
  return {daten: await r.json(), stand: r.headers.get('X-Stand')};
}

export function neueKennung(){
  const z = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : Array.from({length: 4}, () => Math.random().toString(36).slice(2, 10)).join('-');
  return 'lichtwerk-' + z;
}

/* Ein offener Einwurf überlebt ein Neuladen und behält seine Kennung */
const OFFEN = 'spiralcells-lichtwerk-einwurf';
export function merkeEinwurf(e){ try{ sessionStorage.setItem(OFFEN, JSON.stringify(e)); }catch(_){} }
export function offenerEinwurf(){ try{ return JSON.parse(sessionStorage.getItem(OFFEN) || 'null'); }catch(_){ return null; } }
export function vergissEinwurf(){ try{ sessionStorage.removeItem(OFFEN); }catch(_){} }

export function etikett(text){
  const zeile = String(text).split(/\r?\n/).map(s => s.replace(/^[#>*\-\s]+/, '').trim()).find(Boolean) || '';
  if(!zeile) return 'Einwurf von Ralf';
  return zeile.length > 80 ? zeile.slice(0, 79).trimEnd() + '…' : zeile;
}

/* Baut den Einwurf als Weiterarbeit in Ralfs eigenem Zweig dieses Monds */
export function einwurfKoerper(B, mond, text, zielId, ralf, rid){
  const eigene = B.roh.worktrees.filter(t => t.work_id === mond.id && t.author_id === ralf.id)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const body = {work_id: mond.id, request_id: rid, label: etikett(text), content: String(text), notes: 'Im Lichtwerk abgelegt.',
    author_id: ralf.id, contribution: {mode: 'continuation'}};
  const quelle = zielId || (mond.keim.length ? mond.keim[mond.keim.length - 1].id : null);
  if(eigene.length){
    const baum = eigene[eigene.length - 1];
    const fs = B.roh.variants.filter(v => v.worktree_id === baum.id).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    body.worktree_id = baum.id; body.derived_from = fs.length ? fs[fs.length - 1].id : null;
    if(!body.derived_from) delete body.derived_from;
  } else body.new_worktree = true;
  if(quelle && quelle !== body.derived_from) body.source_variant_id = quelle;
  if(body.new_worktree && !body.source_variant_id) body.contribution = {mode: 'review', seen_variant_ids: []};
  return body;
}

export const ablegen = body => senden('/api/variant-branches', body);
export const statusSetzen = (id, status) => senden('/api/variants/' + encodeURIComponent(id) + '/status', {status});
export const verbinden = (von, nach, typ, ralf) => senden('/api/edges', {edge_type: typ, from_variant_id: von, to_variant_id: nach, note: 'Von Ralf im Lichtwerk verbunden.', author_id: ralf.id});
export const formBehalten = (id, richtung) => senden('/lichtwerk/formen/behalten', {auspraegung: id, richtung});
export const teilnahmeAblegen = body => senden('/api/participations', body, BELEG_UNKLAR);
export const teilnahmeZuruecknehmen = (id, body) => senden('/api/participations/' + encodeURIComponent(id) + '/withdraw', body, BELEG_UNKLAR);
export const entstehungAblegen = body => senden('/api/emergence-events', body, BELEG_UNKLAR);
export const ralfAnlegen = () => senden('/api/agents', {handle: 'Ralf', agent_type: 'human', description: 'Ralf, letzte Instanz. Angelegt im SPiRALCELLS-Lichtwerk auf eigenes Halten.'});
