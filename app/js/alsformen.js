/* =====================================================================
   ALSFORMEN — derselbe Gegenstand in mehreren Zusammenhängen, und wie etwas entstand.
   Eine Linse über participations und emergence_events aus GET /api/graph.
   Ein Gegenstand ist einmal gespeichert; jede Teilnahme zeigt ihn an einem anderen Werk
   in einer begründeten Rolle (Quelle, Material, Instrument, Gegenbeispiel …). Die Rolle
   wechselt, die Identität nicht. Eine Rücknahme löscht nichts: sie löst die frühere
   Eintragung ab und behält deren Begründung.
   Entstehungsspuren dokumentieren eine Spur, keinen zwangsläufigen Verlauf. Drei Zeiten
   bleiben getrennt: Ereigniszeit, Aufzeichnungszeit, Deutungszeit. Was unbekannt ist,
   bleibt offen; nichts bekommt eine erfundene Uhrzeit.
   Rechnet nur, speichert nichts. Läuft im Browser und in Node.
   ===================================================================== */
import {menschlich, kurz, datum, nameVon} from './daten.js';

const ms = s => { const t = Date.parse(s); return Number.isNaN(t) ? 0 : t; };
const klein = s => String(s || '').trim().toLowerCase();

/* Rollen kommen als Schlüssel oder schon als Wort; beides wird dasselbe Wort */
const ROLLE = {quelle: 'Quelle', source: 'Quelle', material: 'Material', werk: 'Werk', work: 'Werk', instrument: 'Instrument',
  gegenbeispiel: 'Gegenbeispiel', counterexample: 'Gegenbeispiel'};
export function rollenWort(r){ const k = klein(r); if(ROLLE[k]) return ROLLE[k]; const t = menschlich(String(r || '')).trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'ohne benannte Rolle'; }

export const ART = {origin: 'Originalspur', encounter: 'Begegnung', attempt: 'Erprobung', workpiece: 'Werkstück', interpretation: 'Spätere Deutung',
  counterevidence: 'Gegenbefund', gap: 'Offene Lücke', proposal: 'Vorschlag', reuse: 'Weitere Verwendung'};
export const STAND = {active: 'aktiv', proposed: 'vorgeschlagen', withdrawn: 'zurückgenommen'};
export const STAND_SATZ = {active: 'aktive Teilnahme', proposed: 'vorgeschlagen, nicht bestätigt', withdrawn: 'zurückgenommen'};

/* ------------------------------------------------------------- Zeiten
   Eine Zeitangabe ist entweder ein Zeitpunkt (mit Uhrzeit), ein Tag (ohne) oder freier Text.
   Ein Tag bekommt nie eine Uhrzeit; freier Text bleibt, wie er ist; fehlt sie, ist sie offen. */
export function zeitAngabe(wert){
  if(wert == null || !String(wert).trim()) return {art: 'offen', satz: 'offen', t: 0};
  const s = String(wert).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){ const [y, mo, d] = s.split('-').map(Number); const t = new Date(y, mo - 1, d).getTime(); return {art: 'tag', satz: datum(t, false), t}; }
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && ms(s)) return {art: 'punkt', satz: datum(ms(s)), t: ms(s)};
  return {art: 'text', satz: kurz(s, 90), t: 0};
}

/* ----------------------------------------------------------- Teilnahmen
   Eintragungen bilden Ketten über supersedes_id. Es gilt die jüngste Eintragung einer Kette;
   die Kette selbst bleibt lesbar (frühere Begründung, Zeitpunkt der Ablösung). */
function ketten(liste){
  const nach = new Map(liste.map(p => [p.id, p])), abgeloest = new Set(liste.map(p => p.supersedes_id).filter(Boolean));
  const gilt = liste.filter(p => !abgeloest.has(p.id));
  return gilt.map(p => { const kette = [p]; let q = p, n = 0;
    while(q.supersedes_id && nach.has(q.supersedes_id) && n++ < 50){ q = nach.get(q.supersedes_id); kette.unshift(q); }
    return kette; });
}

export function alsformen(B){
  const g = B.roh || {}, idx = new Map(B.monde.map((m, i) => [m.id, i]));
  const teilnahmen = [];
  for(const kette of ketten(g.participations || [])){
    const p = kette[kette.length - 1], gi = idx.get(p.work_id), ki = idx.get(p.context_work_id);
    if(gi == null || ki == null) continue;   // ein Gegenstand oder Zusammenhang, den der Bestand nicht kennt, wird nicht geraten
    const stand = STAND[p.status] ? p.status : 'proposed';
    // Bei einer Rücknahme trägt die jüngste Eintragung den Grund der Rücknahme; die frühere den der Teilnahme
    const vorher = stand === 'withdrawn' ? [...kette].reverse().find(q => q.status !== 'withdrawn') || null : null;
    const fassung = B.fassungen.get(p.variant_id) || null;
    teilnahmen.push({
      id: p.id, roh: p, kette, gegenstand: gi, kontext: ki, stand,
      rolle: rollenWort(p.role), grund: menschlich(vorher ? vorher.reason : p.reason),
      ruecknahme: stand === 'withdrawn' ? {grund: menschlich(p.reason), wann: ms(p.created_at), wer: nameVon(B.agenten.get(p.author_id))} : null,
      fassung, fassungMond: fassung ? idx.get(B.werkVon(fassung.id)) ?? null : null, bindung: p.version_binding === 'latest' ? 'latest' : 'pinned',
      wer: nameVon(B.agenten.get((vorher || p).author_id)), modell: (B.agenten.get((vorher || p).author_id) || {}).agent_type === 'model',
      wann: ms((vorher || p).created_at), abgeloest: stand !== 'withdrawn' && kette.length > 1 ? ms(kette[kette.length - 2].created_at) : 0,
      gueltig: p.validity ? menschlich(p.validity) : '', quelle: p.source_ref || null,
    });
  }
  // Je Gegenstand eine Phase: alle seine Erscheinungen kreisen im Gleichtakt
  const proGegenstand = new Map(), proKontext = new Map();
  teilnahmen.forEach((t, i) => {
    if(!proGegenstand.has(t.gegenstand)) proGegenstand.set(t.gegenstand, []); proGegenstand.get(t.gegenstand).push(i);
    if(!proKontext.has(t.kontext)) proKontext.set(t.kontext, []); proKontext.get(t.kontext).push(i); });

  // Entstehung: je Werk die Spuren in der Reihenfolge ihrer Aufzeichnung (die einzige Zeit, die immer bekannt ist)
  const ereignisIdx = new Map(), spuren = [];
  for(const e of (g.emergence_events || [])){ const wi = idx.get(e.work_id); if(wi == null) continue;
    spuren.push({id: e.id, roh: e, werk: wi, art: ART[e.kind] ? e.kind : 'proposal', artWort: ART[e.kind] || 'Spur', titel: menschlich(e.title || '') || 'Unbenannte Spur',
      text: menschlich(e.body || ''), stand: e.status === 'documented' ? 'documented' : 'proposed',
      ereignis: zeitAngabe(e.event_time), aufgezeichnet: zeitAngabe(e.recorded_at), gedeutet: zeitAngabe(e.interpretation_time),
      bedingungen: (e.conditions || []).map(menschlich).filter(Boolean),
      fassungen: (e.variant_ids || []).map(id => B.fassungen.get(id)).filter(Boolean),
      wer: nameVon(B.agenten.get(e.author_id)), modell: (B.agenten.get(e.author_id) || {}).agent_type === 'model',
      quelle: e.source_ref || null, widerspricht: [], widersprochen: [], k: 0, n: 0}); }
  spuren.forEach((s, i) => ereignisIdx.set(s.id, i));
  for(const s of spuren) for(const z of (s.roh.contradicts_event_ids || [])){ const j = ereignisIdx.get(z); if(j == null) continue; s.widerspricht.push(j); spuren[j].widersprochen.push(ereignisIdx.get(s.id)); }
  const entstehung = new Map();
  spuren.forEach((s, i) => { if(!entstehung.has(s.werk)) entstehung.set(s.werk, []); entstehung.get(s.werk).push(i); });
  for(const liste of entstehung.values()){
    liste.sort((a, b) => spuren[a].aufgezeichnet.t - spuren[b].aufgezeichnet.t || a - b);
    liste.forEach((si, k) => { spuren[si].k = k; spuren[si].n = liste.length; }); }

  return {teilnahmen, proGegenstand, proKontext, spuren, entstehung,
    /* Wer zu einem Gegenstand gehört: er selbst, seine Zusammenhänge und alles, was in ihm teilnimmt */
    beteiligte(gi){ const s = new Set([gi]); for(const t of proGegenstand.get(gi) || []) s.add(teilnahmen[t].kontext); for(const t of proKontext.get(gi) || []) s.add(teilnahmen[t].gegenstand); return s; },
    /* Was zu einem Werk als Planet gehört: es selbst und alles, was um es kreist */
    umPlanet(gi){ const s = new Set([gi]); for(const t of proKontext.get(gi) || []) s.add(teilnahmen[t].gegenstand); return s; },
    hat(gi){ return proGegenstand.has(gi) || proKontext.has(gi) || entstehung.has(gi); }};
}

/* --------------------------------------------------------------- Sätze */
const zw = n => ['keinen', 'einem', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'][n] ?? String(n);
const zahlM = n => ['kein', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'][n] ?? String(n);
const zahl = n => ['keine', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'][n] ?? String(n);

/* Was an einem Werk im Netz steht, wenn es Alsformen hat */
export function alsSatz(A, gi){
  const aus = (A.proGegenstand.get(gi) || []).map(i => A.teilnahmen[i]).filter(t => t.stand !== 'withdrawn');
  const ein = (A.proKontext.get(gi) || []).map(i => A.teilnahmen[i]).filter(t => t.stand !== 'withdrawn'), sp = (A.entstehung.get(gi) || []).length;
  const teile = [];
  if(aus.length) teile.push(`in ${zw(aus.length)} ${aus.length === 1 ? 'weiteren Zusammenhang' : 'weiteren Zusammenhängen'}`);
  if(ein.length) teile.push(`${zahlM(ein.length)} ${ein.length === 1 ? 'Gegenstand kreist' : 'Gegenstände kreisen'} um es`);
  if(sp) teile.push(`${zahl(sp)} ${sp === 1 ? 'Spur' : 'Spuren'} seiner Entstehung`);
  return teile.join(' · ');
}
/* Die Bildzeile im Mond-Blick: ein Gegenstand, einmal gespeichert, mit seinen Rollen */
export function mondBlickSatz(A, gi, titel){
  const ts = (A.proGegenstand.get(gi) || []).map(i => A.teilnahmen[i]), da = ts.filter(t => t.stand !== 'withdrawn'), weg = ts.length - da.length;
  if(!ts.length) return `„${kurz(titel, 50)}“ nimmt noch an keinem anderen Zusammenhang teil.`;
  const rollen = [...new Set(da.map(t => t.stand === 'proposed' ? `als ${t.rolle} (vorgeschlagen)` : `als ${t.rolle}`))];
  const r = rollen.length <= 1 ? rollen.join('') : rollen.slice(0, -1).join(', ') + ' und ' + rollen[rollen.length - 1];
  return `Ein Gegenstand, einmal gespeichert` + (da.length ? `, in ${zw(da.length)} ${da.length === 1 ? 'weiteren Zusammenhang' : 'weiteren Zusammenhängen'}: ${r}.` : '.')
    + (weg ? ` ${weg === 1 ? 'Eine Teilnahme ist' : zahl(weg).charAt(0).toUpperCase() + zahl(weg).slice(1) + ' Teilnahmen sind'} zurückgenommen und bleibt sichtbar.` : '');
}
/* Die Bildzeile im Planeten-Blick: was um das Werk kreist und woraus es wurde */
export function planetBlickSatz(A, gi, titel){
  const ein = (A.proKontext.get(gi) || []).map(i => A.teilnahmen[i]).filter(t => t.stand !== 'withdrawn'), liste = (A.entstehung.get(gi) || []).map(i => A.spuren[i]);
  const teile = [`„${kurz(titel, 46)}“ als Planet`];
  if(liste.length){ const offen = liste.filter(s => s.ereignis.art === 'offen').length;
    teile.push(`${zahl(liste.length)} ${liste.length === 1 ? 'Spur' : 'Spuren'} seiner Entstehung, innen die zuerst aufgezeichnete` + (offen ? `; bei ${offen === liste.length ? 'allen' : zahl(offen)} ist die Ereigniszeit offen` : '')); }
  if(ein.length) teile.push(`${zahlM(ein.length)} ${ein.length === 1 ? 'Gegenstand kreist' : 'Gegenstände kreisen'} um es`);
  if(!liste.length && !ein.length) teile.push('noch ohne Spuren und ohne Gegenstände, die um es kreisen');
  return teile[0] + ': ' + teile.slice(1).join('; ') + '.';
}
/* Ein Satz in der Zelle: was dieser Mond außerhalb seiner selbst ist */
export function zellSatz(A, gi){
  const aus = (A.proGegenstand.get(gi) || []).filter(i => A.teilnahmen[i].stand !== 'withdrawn').length;
  const ein = (A.proKontext.get(gi) || []).filter(i => A.teilnahmen[i].stand !== 'withdrawn').length, sp = (A.entstehung.get(gi) || []).length, t = [];
  if(aus) t.push(`nimmt in ${zw(aus)} weiteren ${aus === 1 ? 'Zusammenhang' : 'Zusammenhängen'} teil`);
  if(sp) t.push(`trägt ${zahl(sp)} ${sp === 1 ? 'Spur' : 'Spuren'} seiner Entstehung`);
  if(ein) t.push(`${zahlM(ein)} ${ein === 1 ? 'Gegenstand kreist' : 'Gegenstände kreisen'} um ihn`);
  if(!t.length) return '';
  return 'Dieser Mond ' + (t.length === 1 ? t[0] : t.slice(0, -1).join(', ') + ' und ' + t[t.length - 1]) + '.';
}
/* Die Marke einer Erscheinung im Netz */
export function teilnahmeMarke(A, B, i){
  const t = A.teilnahmen[i], gm = B.monde[t.gegenstand], km = B.monde[t.kontext];
  const titel = `„${kurz(gm.titel, 56)}“ als ${t.rolle}`;
  const teile = [`in „${kurz(km.titel, 48)}“`, STAND_SATZ[t.stand]];
  if(t.fassung) teile.push(t.bindung === 'latest' ? 'jeweils aktuelle Fassung' : `fest an „${kurz(t.fassung.label || 'Unbenannte Fassung', 36)}“`);
  return [titel, teile.join(' · ')];
}
export function spurMarke(A, i){
  const s = A.spuren[i], teile = [s.artWort + (s.stand === 'proposed' ? ' · vorgeschlagen' : '')];
  teile.push(s.ereignis.art === 'offen' ? 'Ereigniszeit offen' : `geschehen ${s.ereignis.satz}`);
  teile.push(`aufgezeichnet ${s.aufgezeichnet.satz}`);
  if(s.gedeutet.art !== 'offen') teile.push(`gedeutet ${s.gedeutet.satz}`);
  return [kurz(s.titel, 90), teile.join(' · ')];
}
