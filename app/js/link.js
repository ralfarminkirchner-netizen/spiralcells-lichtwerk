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
const MONAT = ['jan', 'feb', 'maerz', 'apr', 'mai', 'juni', 'juli', 'aug', 'sep', 'okt', 'nov', 'dez'];
export const VON = {
  sternwerft: {satz: 'Zurück zur Sternwerft', adresse: 'http://127.0.0.1:8420/kin-os-sichten-codex/sternwerft.html'},
  kinos: {satz: 'Zurück zu KiN OS', adresse: 'http://127.0.0.1:8895/'},
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
/* Den Teil hinter # lesen: nur bekannte Schlüssel, nur Kleinbuchstaben, Ziffern und Striche */
export function lies(hash){
  const q = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const mond = q.get('mond'), von = q.get('von');
  return {mond: mond && /^[a-z0-9-]{1,90}$/.test(mond) ? mond : null, von: von && Object.prototype.hasOwnProperty.call(VON, von) ? von : null};
}
export const bau = (name, von) => '#mond=' + name + (von && VON[von] ? '&von=' + von : '');
