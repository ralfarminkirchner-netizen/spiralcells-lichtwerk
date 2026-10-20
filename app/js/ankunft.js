/* =====================================================================
   ANKUNFT — was seit Ralfs letztem Besuch eingetragen wurde (Etappe 4).
   Der Browser merkt sich nur den Zeitpunkt „zuletzt hier“, nie Inhalt, und
   setzt ihn erst, wenn die Ankunft zu Ende gezeigt ist. Ohne Merker ist nichts neu.
   Neu ist, was danach eingetragen wurde (UTC verglichen). Ralfs eigene Einträge
   und Formen gelten nie als neu. Statuswechsel bleiben unsichtbar, bis SPiRALCELLS
   sie belegt. Die Sätze sagen „eingetragen“: das Datum ist der Eingang.
   Derselbe Satz entsteht auf dem Server (GET /lichtwerk/neu) für KiN OS.
   ===================================================================== */
import {STIMMEN, MENSCH, QUELLE} from './daten.js';

const MERK = 'spiralcells-lichtwerk-zuletzt';
export const UEBERNAHME_AB = 12;   // mehr Übernahmen auf einmal: ein Satz statt eines Einflugs

export function zuletzt(){ try{ const t = Number(localStorage.getItem(MERK)); return Number.isFinite(t) && t > 0 ? t : null; }catch(_){ return null; } }
export function merke(t){ try{ localStorage.setItem(MERK, String(Math.round(t))); }catch(_){} }

const ms = s => { const t = Date.parse(s); return Number.isNaN(t) ? 0 : t; };

/* Alles, was nach `seit` eingetragen wurde, aus dem Graphen; ohne `seit` ist nichts neu */
export function neuSeit(B, seit){
  const leer = {zahl: 0, proStimme: new Map(), uebernahmen: 0, faeden: 0, befunde: 0, monde: new Map(), juengster: null};
  if(!B || !seit) return leer;
  const n = leer;
  let juengsterT = 0;
  for(const v of B.roh.variants){
    const t = ms(v.created_at); if(t <= seit) continue;
    if(B.formen && B.formen.has(v.id)) continue;                 // Ralfs behaltene Formen
    const st = B.stimmeDer(v.id); if(st === MENSCH) continue;     // Ralfs eigene Einträge
    const werk = B.werkVon(v.id), mond = werk && B.mondVon.get(werk); if(!mond) continue;
    n.zahl++;
    if(st === QUELLE) n.uebernahmen++; else n.proStimme.set(st, (n.proStimme.get(st) || 0) + 1);
    if(!n.monde.has(mond.id)) n.monde.set(mond.id, []);
    n.monde.get(mond.id).push({id: v.id, t, stimme: st});
    if(t > juengsterT){ juengsterT = t; n.juengster = mond.id; }
  }
  const ralf = B.mensch ? B.mensch.id : null;
  n.faeden = B.roh.edges.filter(e => ms(e.created_at) > seit && e.author_id !== ralf).length;
  n.befunde = (B.roh.findings || []).filter(f => ms(f.created_at) > seit && f.author_id !== ralf).length;
  for(const arr of n.monde.values()) arr.sort((a, b) => a.t - b.t);
  return n;
}

const ZAHL = ['keine', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
const zahl = (k, eins = 'eine') => k === 1 ? eins : ZAHL[k] ?? String(k);
const aufzaehlen = arr => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' und ' + arr[arr.length - 1];

/* Ein Satz aus Zahlen: {stimmen: [[Name, Anzahl], …], uebernahmen, faeden, befunde, monde}. Server und Browser bauen ihn gleich. */
export function satzAus(z){
  const teile = [];
  z.stimmen.forEach(([name, k], i) => teile.push(i === 0 ? `${zahl(k)} ${k === 1 ? 'Ausprägung' : 'Ausprägungen'} von ${name}` : `${zahl(k)} von ${name}`));
  if(z.uebernahmen){ const u = z.uebernahmen, wort = teile.length ? '' : (u === 1 ? ' Ausprägung' : ' Ausprägungen');
    teile.push(u > UEBERNAHME_AB ? `${u}${wort} aus einer technischen Übernahme` : `${zahl(u)}${wort} aus Quellen`); }
  const extra = [];
  if(z.faeden) extra.push(`${zahl(z.faeden, 'ein')} ${z.faeden === 1 ? 'neuer Faden' : 'neue Fäden'}`);
  if(z.befunde) extra.push(`${zahl(z.befunde, 'ein')} ${z.befunde === 1 ? 'Befund' : 'Befunde'}`);
  if(!teile.length && !extra.length) return 'Seit deinem letzten Besuch ist nichts dazugekommen.';
  let satz = teile.length ? `Seit deinem letzten Besuch eingetragen: ${aufzaehlen(teile)}` : 'Seit deinem letzten Besuch eingetragen';
  if(teile.length && z.monde > 1) satz += `, in ${zahl(z.monde, 'einem')} Monden`;
  satz += teile.length ? '.' : ': ';
  if(extra.length) satz += (teile.length ? ' Dazu ' : '') + aufzaehlen(extra) + '.';
  return satz;
}
export function zahlenVon(n){
  return {stimmen: [...n.proStimme.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([i, k]) => [STIMMEN[i].name, k]),
    uebernahmen: n.uebernahmen, faeden: n.faeden, befunde: n.befunde, monde: n.monde.size};
}
export const ankunftSatz = n => satzAus(zahlenVon(n));

/* Die letzten Einträge, immer (Ralf, 20.10. abends: „die letzten paar immer“): damit das Bild nie leer ist.
   Ohne Ralfs eigene und ohne Formen; wie zuletzt_eintraege() im Server. */
export const ZULETZT = 5;
export function letzte(B, n = ZULETZT){
  if(!B) return [];
  const liste = [];
  for(const v of B.roh.variants){
    if(B.formen && B.formen.has(v.id)) continue;
    const st = B.stimmeDer(v.id); if(st === MENSCH) continue;
    const werk = B.werkVon(v.id), mond = werk && B.mondVon.get(werk); if(!mond) continue;
    liste.push({id: v.id, mondId: mond.id, t: ms(v.created_at), stimme: st, label: v.label || 'Unbenannte Ausprägung', titel: mond.titel, wann: v.created_at});
  }
  return liste.sort((a, b) => b.t - a.t).slice(0, n);
}
const MONATE = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
/* „20. Okt., 18:30“ in Ralfs Ortszeit, wie wann_menschlich() im Server */
export function wannMenschlich(wert){
  const t = Date.parse(wert); if(Number.isNaN(t)) return 'ohne Datum';
  const p = Object.fromEntries(new Intl.DateTimeFormat('de-DE', {timeZone: 'Europe/Berlin', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'})
    .formatToParts(new Date(t)).map(x => [x.type, x.value]));
  return `${Number(p.day)}. ${MONATE[Number(p.month) - 1]}, ${p.hour}:${p.minute}`;
}
/* Ein Satz zum jüngsten Eintrag: {label, stimme (Name oder null), titel, wann}; gleich in zuletzt_satz() im Server */
export function zuletztSatzAus(e){
  if(!e) return '';
  return `Zuletzt eingetragen: „${e.label}“ ${e.stimme ? 'von ' + e.stimme : 'aus einer Quelle'} in „${e.titel}“, ${wannMenschlich(e.wann)}.`;
}
