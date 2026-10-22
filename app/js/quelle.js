/* =====================================================================
   QUELLE — der Weg zur gebundenen Originalstelle in der Lebensspirale (LiFESPiRAL).
   Dieselbe Prüfung wie in SPiRALCELLS (server/static/source-links.js): die Tür ist an die
   aufgezeichnete Quelle, ihre Revision, die genaue Passage und die tatsächliche Fassung
   gebunden. Es wird keine Ersatzquelle und kein bloßer Tageseinstieg gebaut; passt etwas
   nicht, gibt es keinen Link, nur den ehrlichen Satz, dass die Bindung gespeichert ist.
   Rechnet nur. Läuft im Browser und in Node.
   ===================================================================== */
const LEBEN = new Set(['lebensspirale', 'lifespiral', 'lebenserschliessung']);
const identitaet = ref => ref && [ref.system, ref.kind, ref.source_id].every(v => typeof v === 'string' && v)
  ? JSON.stringify([ref.system, ref.kind, ref.source_id, ref.content_sha256 || null]) : null;

/* Die Fassung, an die eine Quelle gebunden ist: die im Link genannte, wenn sie dazugehört, sonst die erste bekannte */
export function quellFassung(ref, ids, fassungen){
  const bekannt = (ids || []).filter(id => fassungen.has(id)); let gebunden = null;
  try{ gebunden = new URL(ref && ref.locator).searchParams.get('fassung'); }catch(_){}
  return gebunden ? bekannt.find(id => id === gebunden) || null : bekannt[0] || null;
}

export function quellAdresse(ref, fassungId, fassung){
  try{
    const ziel = new URL(ref && ref.locator);
    if(!['http:', 'https:'].includes(ziel.protocol) || ziel.username || ziel.password || ['9030', '9031'].includes(ziel.port)) return null;
    const leben = LEBEN.has(String(ref.system).toLowerCase()) || ziel.port === '53450';
    if(!leben) return ziel.href;
    if(ziel.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(ziel.hostname) || ziel.port !== '53450' || ziel.pathname !== '/') return null;
    if(ziel.searchParams.getAll('quelle').length !== 1 || ziel.searchParams.getAll('stelle').length !== 1 || ziel.searchParams.getAll('fassung').length > 1) return null;
    if(typeof fassungId !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(fassungId)) return null;
    const vorher = ziel.searchParams.get('fassung');
    if(vorher && vorher !== fassungId && !(fassung && fassung.id === fassungId && identitaet(ref) && identitaet(fassung.source_ref) === identitaet(ref))) return null;
    const q = JSON.parse(ziel.searchParams.get('quelle')), st = JSON.parse(ziel.searchParams.get('stelle'));
    if(!q || !['chronology', 'research'].includes(q.kind) || typeof q.key !== 'string' || !q.key || q.key.length > 4000 || q.key.includes('#') || q.offset !== 0) return null;
    if(typeof q.source_revision_id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(q.source_revision_id)) return null;
    if(q.kind === 'research' && (!/^[0-9a-f]{64}$/.test(q.key) || !/^[0-9a-f]{64}$/.test(q.source_revision_id))) return null;
    if(!st || !Number.isSafeInteger(st.start) || !Number.isSafeInteger(st.end) || st.start < 0 || st.end <= st.start || typeof st.quote !== 'string' || !st.quote || st.end - st.start !== st.quote.length) return null;
    const vor = q.key + '@' + q.source_revision_id + '#';
    if(typeof ref.source_id !== 'string' || !ref.source_id.startsWith(vor)) return null;
    const span = ref.source_id.slice(vor.length).match(/^(?:o(\d+):)?(\d+)-(\d+)@([0-9a-f]{16})$/);
    if(!span || Number(span[1] || 0) !== q.offset || Number(span[2]) !== st.start || Number(span[3]) !== st.end) return null;
    ziel.searchParams.set('fassung', fassungId);
    return ziel.href;
  }catch(_){ return null; }
}
/* Woher der Link führt, in Worten (ohne Kennung) */
export function quellName(ref){
  try{ const z = new URL(ref.locator); return z.port === '53450' || LEBEN.has(String(ref.system).toLowerCase()) ? 'in der Lebensspirale' : 'an der Quelle'; }catch(_){ return 'an der Quelle'; }
}
