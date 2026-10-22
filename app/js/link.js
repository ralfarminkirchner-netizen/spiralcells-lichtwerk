/* =====================================================================
   LINK — ein lesbarer Weg in eine Zelle und wieder hinaus (Etappe 5).
   /#mond=zentrale-material-bekommt-form&von=sternwerft
   Der kurze Name gehört immer dem ältesten Mond dieses Titels; ein späterer
   bekommt seinen Eingangstag (…-19-okt), am selben Tag dazu die Uhrzeit.
   So bleiben alte Links heil. Keine Kennung in der Adresszeile.
   `von` kennt nur feste Werte mit fester Rückadresse; eine Adresse aus dem
   Link wird nie übernommen. Derselbe Name entsteht auf dem Server
   (GET /lichtwerk/monde), damit Sternwerft und KiN OS Links bauen können.
   ===================================================================== */
import {human} from './werkdaten.js';

const MONAT = ['jan', 'feb', 'maerz', 'apr', 'mai', 'juni', 'juli', 'aug', 'sep', 'okt', 'nov', 'dez'];
export const VON = {
  sternwerft: {satz: 'Zurück zur Sternwerft', adresse: 'http://127.0.0.1:8420/kin-os-sichten-codex/sternwerft.html'},
  kinos: {satz: 'Zurück zu KiN OS', adresse: 'http://127.0.0.1:8894/'},
};

export function grundname(titel){
  const s = String(titel || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (s.slice(0, 60).replace(/-+$/, '')) || 'mond';
}
/* Tag und Uhrzeit in Ralfs Ortszeit (Europe/Berlin), wie er sie kennt */
function teile(t){
  const f = new Intl.DateTimeFormat('de-DE', {timeZone: 'Europe/Berlin', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'});
  const p = Object.fromEntries(f.formatToParts(new Date(t)).map(x => [x.type, x.value]));
  return {tag: `${Number(p.day)}-${MONAT[Number(p.month) - 1]}`, zeit: `${p.hour}${p.minute}`};
}
/* Namen für alle Monde: [{id, name}] in gleicher Reihenfolge; nach Eingang sortiert vergeben */
export function namen(monde){
  const nachZeit = monde.map((m, i) => ({i, t: Date.parse(m.werk ? m.werk.created_at : m.created_at) || 0, g: grundname(m.titel ?? m.title)}))
    .sort((a, b) => a.t - b.t || a.i - b.i);
  const vergeben = new Set(), aus = new Array(monde.length);
  for(const x of nachZeit){
    let name = x.g;
    if(vergeben.has(name)){ const {tag, zeit} = teile(x.t); name = `${x.g}-${tag}`; if(vergeben.has(name)) name = `${x.g}-${tag}-${zeit}`;
      let k = 2; const basis = name; while(vergeben.has(name)) name = `${basis}-${k++}`; }
    vergeben.add(name); aus[x.i] = name;
  }
  return aus;
}
/* Nur die tatsächlich vorhandenen Fassungen dieses Monds. Interne Kennungen
   verbinden die Map mit dem Bestand; in den Link kommt ihr lesbarer Name. */
function fassungen(mond){
  const alle = [...(Array.isArray(mond?.keim) ? mond.keim : []),
    ...(Array.isArray(mond?.samen) ? mond.samen.map(s => s?.fassung) : [])];
  const gesehen = new Map();
  for(const v of alle) if(v && typeof v.id === 'string' && v.id && !gesehen.has(v.id)) gesehen.set(v.id, v);
  return [...gesehen.values()].sort((a, b) =>
    (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0) || a.id.localeCompare(b.id));
}
/* Der eigene Eingangstag gehört von Anfang an zum Namen. Ein rückdatierter
   Import kann dadurch keinen vorhandenen Namen erben. Keine Rangnummer und
   kein Titel-Fallback: Beides könnte später eine andere Fassung auswählen. */
function fassungstag(value){
  const datum = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2}))?$/.exec(value);
  if(!datum) return 'ohne-verlaessliches-datum';
  const [, jahr, monat, tag, stunde, minute, sekunde, bruch, zone] = datum;
  const j = Number(jahr), m = Number(monat), t = Number(tag);
  const schaltjahr = j % 4 === 0 && (j % 100 !== 0 || j % 400 === 0);
  const tage = [31, schaltjahr ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if(m < 1 || m > 12 || t < 1 || t > tage[m - 1] || !Number.isFinite(Date.parse(value))) return 'ohne-verlaessliches-datum';
  const aus = `${t}-${MONAT[m - 1]}-${jahr}`;
  if(!zone) return aus + '-ohne-uhrzeit';
  // Auch Sekundenbruchteile erhalten: Date allein würde Mikrosekunden verlieren.
  // Die gespeicherte Zeitzone bleibt ausdrücklich lesbarer Teil des Datums.
  if(Number(stunde) > 23 || Number(minute) > 59 || Number(sekunde) > 59) return 'ohne-verlaessliches-datum';
  const zeitzone = zone === 'Z' ? 'utc' : `${zone[0] === '+' ? 'plus' : 'minus'}-${zone.slice(1).replace(':', '-')}`;
  return `${aus}-um-${stunde}-${minute}-${sekunde}${bruch ? '-und-' + bruch : ''}-${zeitzone}`;
}
export function fassungsnamen(mond){
  return new Map(fassungen(mond).map(v => {
    const datum = fassungstag(v.created_at);
    const titel = grundname(human(v.label, 'Unbenannte Fassung')).slice(0, 89 - datum.length).replace(/-+$/, '');
    return [v.id, `${titel}-${datum}`];
  }));
}
export function fassung(mond, slug){
  if(!fassungsname(slug)) return null;
  const benannt = fassungsnamen(mond);
  const passend = fassungen(mond).filter(v => benannt.get(v.id) === slug);
  // Gleicher Name und gleicher/fehlender Zeitpunkt sind ohne gespeicherte
  // menschliche Unterscheidung mehrdeutig. Nie nach Kennung oder Reihenfolge raten.
  return passend.length === 1 ? passend[0] : null;
}
const slugname = value => typeof value === 'string' && /^[a-z0-9-]{1,90}$/.test(value);
// Datumszusätze sind lesbarer Kontext, keine lange technische Kennung.
// Deshalb die Wörter getrennt prüfen; rohe UUIDs bleiben ausdrücklich ungültig.
const fassungsname = value => slugname(value) &&
  !/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i.test(value) &&
  human(value.replace(/-/g, ' '), '') === value.replace(/-/g, ' ');
/* Den Teil hinter # lesen: nur bekannte Schlüssel, nur Kleinbuchstaben, Ziffern und Striche */
export function lies(hash){
  const q = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const mond = q.get('mond'), von = q.get('von');
  const aus = {mond: slugname(mond) ? mond : null, von: von && Object.prototype.hasOwnProperty.call(VON, von) ? von : null};
  if(q.has('fassung')) aus.fassung = q.getAll('fassung').length === 1 && fassungsname(q.get('fassung')) ? q.get('fassung') : null;
  if(q.has('blick')) aus.blick = q.getAll('blick').length === 1 && q.get('blick') === 'geschichte' ? 'geschichte' : null;
  return aus;
}
export function bau(name, von, option = {}){
  if(!slugname(name)) return '';
  const q = new URLSearchParams({mond: name});
  if(von && Object.prototype.hasOwnProperty.call(VON, von)) q.set('von', von);
  if(fassungsname(option?.fassung)) q.set('fassung', option.fassung);
  if(option?.blick === 'geschichte') q.set('blick', 'geschichte');
  return '#' + q;
}
