/* Lesender Anschluss für Claudes bestehende Alsformen-Quellentür.
   Die öffentlichen Signaturen bleiben erhalten. Nur eine vorhandene Fassung
   derselben Quelle darf den bereits geprüften Reader-Rückweg verwenden. */
import {ursprung} from './zusammenhang.js';

const LEBEN = new Set(['lebensspirale', 'lifespiral', 'lebenserschliessung']);
const system = ref => typeof ref?.system === 'string' ? ref.system.toLowerCase() : '';
const hash = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);

function selbeQuelle(a, b){
  if(!a || !b || !system(a) || system(a) !== system(b)) return false;
  if(a.kind !== b.kind || a.source_id !== b.source_id || a.content_sha256 !== b.content_sha256) return false;
  if(system(a) === 'vault') return typeof a.locator === 'string' && a.locator.startsWith('/')
    && a.locator === b.locator && hash(a.content_sha256);
  return LEBEN.has(system(a)) && typeof a.kind === 'string' && !!a.kind.trim()
    && typeof a.source_id === 'string' && !!a.source_id;
}

function gleicheAdresse(a, b){
  if(!a || !b) return false;
  const links = [new URL(a), new URL(b)];
  for(const link of links) link.searchParams.sort();
  return links[0].href === links[1].href;
}

/* Die explizit genannte oder genau eine passende, vorhandene Fassung.
   Weder eine fremde Fassung noch die Reihenfolge ersetzt eine fehlende Bindung. */
export function quellFassung(ref, ids, fassungen){
  if(!Array.isArray(ids) || typeof fassungen?.get !== 'function') return null;
  const passend = [...new Set(ids)].filter(id => quellAdresse(ref, id, fassungen.get(id)));
  let gebunden = null;
  try{
    const namen = new URL(ref?.locator).searchParams.getAll('fassung');
    if(namen.length > 1) return null;
    gebunden = namen[0] || null;
  }catch(_){ /* Vault-Verweise behalten ihren ursprünglichen Dateipfad. */ }
  return gebunden ? passend.find(id => id === gebunden) || null : passend.length === 1 ? passend[0] : null;
}

export function quellAdresse(ref, fassungId, fassung){
  try{
    if(!fassung || fassung.id !== fassungId || !selbeQuelle(ref, fassung.source_ref)) return null;
    const adresse = ursprung(fassung);
    // Auch die vom Aufrufer verwendete Referenz muss dieselbe Revision und
    // Passage binden. Nur der Fassungsparameter wird durch die echte Fassung ersetzt.
    const angefragt = ursprung({...fassung, source_ref:ref});
    return gleicheAdresse(adresse, angefragt) ? adresse : null;
  }catch(_){ return null; }
}

/* Menschlich lesbare Herkunft; Pfade, Kennungen und Hashes bleiben in den Daten. */
export function quellName(ref){
  if(system(ref) === 'vault') return 'aus dem Vault';
  return LEBEN.has(system(ref)) ? 'in der Lebensspirale' : 'an der Quelle';
}
