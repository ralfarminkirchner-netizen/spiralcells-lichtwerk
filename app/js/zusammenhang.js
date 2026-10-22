/* Lesende Projektion des vorhandenen Graphen. Keine eigenen Identitäten,
   Statuswechsel oder Datumsannahmen; Kennungen bleiben interne Verweise. */
import {human} from './werkdaten.js';

const ROLLEN = {source:'Quelle', material:'Material', work:'Werk', instrument:'Instrument', counterexample:'Gegenbeispiel'};
const ARTEN = {origin:'Originalspur', encounter:'Begegnung', attempt:'Erprobung', workpiece:'Werkstück', interpretation:'Spätere Deutung', counterevidence:'Gegenbefund', gap:'Offene Lücke', proposal:'Vorschlag für einen Zusammenhang', reuse:'Weitere Verwendung'};
const STATUS = {active:'Aktive Teilnahme', proposed:'Vorgeschlagene Teilnahme', withdrawn:'Zurückgezogene Teilnahme'};
const lesbar = (s, fallback) => String(s ?? '').trim() ? human(s, fallback) : fallback;
const liste = x => Array.isArray(x) ? x : [];
const zeitwert = x => Number.isFinite(Date.parse(x)) ? Date.parse(x) : 0;
const zeitfolge = (a, b) => zeitwert(a.created_at || a.recorded_at) - zeitwert(b.created_at || b.recorded_at);

function index(B){
  const g = B?.roh || {};
  const werke = new Map(liste(g.works).map(x => [x.id, x]));
  const baeume = new Map(liste(g.worktrees).map(x => [x.id, x]));
  const varianten = new Map(liste(g.variants).map(x => [x.id, x]));
  const akteure = new Map(liste(g.agents).map(x => [x.id, x]));
  const werkVon = v => baeume.get(v?.worktree_id)?.work_id || null;
  const werkTitel = id => lesbar(werke.get(id)?.title, 'Zusammenhang nicht verfügbar');
  const akteurName = id => lesbar(akteure.get(id)?.handle, 'Akteur nicht hinterlegt');
  return {g, werke, varianten, akteure, werkVon, werkTitel, akteurName};
}

function fassung(x, id){
  const v = x.varianten.get(id), werkId = x.werkVon(v);
  return {id, titel:lesbar(v?.label, 'Fassung nicht verfügbar'), werkId,
    werkTitel:x.werkTitel(werkId), fehlt:!v, variante:v || null,
    quelle:v?.source_ref || null, rueckweg:v ? ursprung(v) : null};
}

/** Alle eigenen Teilnahmen und Teilnahmen von Material im geöffneten Kontext.
 *  aktuell bezeichnet das Ende einer belegten Ablösungskette, auch bei Rückzug.
 *  Ein Vorschlag ist keine wirksame oder menschlich angenommene Teilnahme. */
export function teilnahmen(B, werkId){
  const x = index(B), alle = liste(x.g.participations);
  const nachfolger = new Map();
  for(const p of alle) if(p.supersedes_id){
    if(!nachfolger.has(p.supersedes_id)) nachfolger.set(p.supersedes_id, []);
    nachfolger.get(p.supersedes_id).push(p.id);
  }
  return alle.filter(p => p.work_id === werkId || p.context_work_id === werkId).map(p => {
    const abgeloestDurch = nachfolger.get(p.id) || [], aktuell = !abgeloestDurch.length;
    const statusName = STATUS[p.status] || 'Teilnahmestatus nicht hinterlegt';
    return {...p, werkTitel:x.werkTitel(p.work_id), kontextTitel:x.werkTitel(p.context_work_id),
      rolleName:ROLLEN[p.role] || lesbar(p.role, 'Rolle nicht hinterlegt'),
      akteurName:x.akteurName(p.author_id), begruendung:lesbar(p.reason, 'Begründung nicht hinterlegt'),
      richtung:p.work_id === werkId ? 'eigene-teilnahme' : 'material-im-kontext',
      fassung:fassung(x, p.variant_id), quelle:p.source_ref || null,
      aktuell, verdraengt:!aktuell, wirksam:aktuell && p.status === 'active',
      abgeloestDurch:[...abgeloestDurch], statusName,
      statusText:aktuell ? statusName : `Frühere Teilnahme · abgelöst · ${statusName}`,
      fassungsbindung:p.version_binding === 'latest' ? 'Neuester Stand ausdrücklich gewählt; verwendete Fassung bleibt belegt' : 'Feste Fassung',
      geltung:p.validity ? lesbar(p.validity, '') : null};
  }).sort((a,b) => Number(b.aktuell) - Number(a.aktuell) || zeitfolge(a,b));
}

/** Gesamtgeschichte mit ihren jeweiligen Fassungsbezügen. Aufzeichnungszeit
 *  ordnet nur die Einträge; unsichere Ereignis-/Deutungszeiten bleiben Wortlaut. */
export function entstehung(B, werkId){
  const x = index(B), alle = liste(x.g.emergence_events), ereignisse = new Map(alle.map(e => [e.id,e]));
  const rollenNachWerk = new Map();
  const rollen = id => {
    const werk = x.werkVon(x.varianten.get(id));
    if(!werk) return [];
    if(!rollenNachWerk.has(werk)) rollenNachWerk.set(werk, teilnahmen(B, werk));
    return rollenNachWerk.get(werk).filter(p => p.variant_id === id);
  };
  const verweis = id => {
    const e = ereignisse.get(id);
    return {id, titel:lesbar(e?.title, 'Entstehungsspur nicht verfügbar'), fehlt:!e,
      typName:ARTEN[e?.kind] || 'Art nicht hinterlegt', status:e?.status || null};
  };
  return alle.filter(e => e.work_id === werkId || liste(e.variant_ids).some(id => x.werkVon(x.varianten.get(id)) === werkId)).map(e => ({
    ...e, titel:lesbar(e.title, 'Entstehungsspur ohne Titel'), text:lesbar(e.body, ''),
    werkTitel:x.werkTitel(e.work_id), akteurName:x.akteurName(e.author_id),
    typName:ARTEN[e.kind] || lesbar(e.kind, 'Art nicht hinterlegt'),
    statusText:e.status === 'documented' ? 'Dokumentierte Spur' : e.status === 'proposed' ? 'Vorschlag' : 'Status nicht hinterlegt',
    ereigniszeit:e.event_time ?? null, aufzeichnungszeit:e.recorded_at ?? null,
    deutungszeit:e.interpretation_time ?? null, bedingungen:liste(e.conditions).map(s => lesbar(s,'')),
    quelle:e.source_ref || null,
    fassungen:liste(e.variant_ids).map(id => ({...fassung(x,id), rollen:rollen(id)})),
    widerspricht:liste(e.contradicts_event_ids).map(verweis),
    widersprochenDurch:alle.filter(other => liste(other.contradicts_event_ids).includes(e.id)).map(other => verweis(other.id))
  })).sort(zeitfolge);
}

/** Nur vorhandene, übereinstimmende Quellen-/Revisions-/Passagenbindungen.
 *  Die Fassung bezeichnet den tatsächlich geöffneten gespeicherten Werktext;
 *  sie darf vom Originalzitat abgeleitet sein. Keine aktuelle Standardquelle. */
export function ursprung(v){
  try {
    let ref = v?.source_ref;
    let vault = null;
    if(ref?.system === 'vault'){
      const r = v.reader_source;
      if(!r || r.vault_path !== ref.locator || !/^[0-9a-f]{64}$/.test(ref.content_sha256)
        || r.source_ref?.content_sha256 !== ref.content_sha256
        || r.source?.source_revision_id !== ref.content_sha256) return null;
      vault = r;
      ref = r.source_ref;
    }
    if(!ref || !['lebensspirale','lifespiral','lebenserschliessung'].includes(String(ref.system).toLowerCase())
      || typeof ref.kind !== 'string' || !ref.kind.trim()
      || typeof v.id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(v.id)) return null;
    const ziel = new URL(ref.locator);
    if(ziel.protocol !== 'http:' || ziel.hostname !== '127.0.0.1' || ziel.port !== '53450'
      || ziel.pathname !== '/' || ziel.username || ziel.password || ziel.hash) return null;
    if(ziel.searchParams.getAll('quelle').length !== 1 || ziel.searchParams.getAll('stelle').length !== 1
      || ziel.searchParams.getAll('fassung').length > 1) return null;
    const quelle = JSON.parse(ziel.searchParams.get('quelle')), stelle = JSON.parse(ziel.searchParams.get('stelle'));
    if(!quelle || !['chronology','research'].includes(quelle.kind) || typeof quelle.key !== 'string'
      || !quelle.key || quelle.key.length > 4000 || quelle.key.includes('#') || quelle.offset !== 0
      || typeof quelle.source_revision_id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(quelle.source_revision_id)) return null;
    if(quelle.kind === 'research' && (!/^[0-9a-f]{64}$/.test(quelle.key) || !/^[0-9a-f]{64}$/.test(quelle.source_revision_id))) return null;
    if(vault && (quelle.kind !== 'research' || quelle.key !== vault.source.key
      || quelle.source_revision_id !== vault.source.source_revision_id)) return null;
    if(!stelle || !Number.isSafeInteger(stelle.start) || !Number.isSafeInteger(stelle.end)
      || stelle.start < 0 || stelle.end <= stelle.start || typeof stelle.quote !== 'string'
      || !stelle.quote || stelle.end - stelle.start !== stelle.quote.length) return null;
    if(vault && (stelle.start !== vault.selection?.start || stelle.end !== vault.selection?.end
      || stelle.quote !== vault.selection?.quote)) return null;
    const anfang = quelle.key + '@' + quelle.source_revision_id + '#';
    if(typeof ref.source_id !== 'string' || !ref.source_id.startsWith(anfang)) return null;
    const spanne = /^(?:o(\d+):)?(\d+)-(\d+)@([0-9a-f]{16})$/.exec(ref.source_id.slice(anfang.length));
    if(!spanne || (spanne[1] && Number(spanne[1]) !== quelle.offset)
      || Number(spanne[2]) !== stelle.start || Number(spanne[3]) !== stelle.end) return null;
    ziel.searchParams.set('fassung', v.id);
    return ziel.href;
  } catch { return null; }
}
