/* Wie viel Material ein Werk hat und wie viel davon zeitlich belegt ist (Ralf, 08.11.2026):
   „ohne eine Zelle anklicken zu müssen sehen, wie lang die Spirale ist“.

   Die Länge der Spirale im Netz ist die Menge: eine Windung je Verzehnfachung des Materials
   (rund 1.000 Zeichen eine Windung, 10.000 zwei, 100.000 drei). Eine Fassung ohne Text (Bild, Datei)
   zählt wie ein kurzer Text, damit sie nicht verschwindet. Der Anfang der Spirale trägt die datierten
   Fassungen in ihrer Zeitfolge, durchgezogen; dahinter liegt der Saum ohne belegte Zeit, gepunktet.
   Eine Dauer wird nur genannt, wenn sie belegt ist. Reine Funktionen, sie lesen nur. */

export const MINDESTENS = 400;           // so viel zählt eine Fassung ohne Text
const T = 864e5;

const masse = s => Math.max(MINDESTENS, Math.max(0, s.laenge || 0));

export function windungen(gesamt){ return gesamt > 0 ? Math.min(5, Math.max(0.3, Math.log10(gesamt / 100))) : 0; }

/* Die Spirale als Strecke von 0 bis 1: wo jede Fassung beginnt und endet, und wo der Saum anfängt. */
export function strecke(samen){
  const n = samen.length, gesamt = samen.reduce((a, s) => a + masse(s), 0), von = new Float64Array(n), bis = new Float64Array(n);
  let lauf = 0, saumAb = 1;
  for(let i = 0; i < n; i++){ von[i] = gesamt ? lauf / gesamt : 0; lauf += masse(samen[i]); bis[i] = gesamt ? lauf / gesamt : 1;
    if(samen[i].saum && saumAb === 1) saumAb = von[i]; }
  return {gesamt, von, bis, saumAb};
}
/* Welche Fassung an der Stelle t der Spirale liegt */
export function fassungBei(st, t){ const {von, bis} = st; let a = 0, b = bis.length - 1; if(b < 0) return -1;
  while(a < b){ const m = (a + b) >> 1; if(bis[m] < t) a = m + 1; else b = m; } return t < von[a] ? Math.max(0, a - 1) : a; }

const DATUM = {day: 'numeric', month: 'long', year: 'numeric'}, KURZ = {day: 'numeric', month: 'short'};
const tag = (ms, o = DATUM) => new Date(ms).toLocaleDateString('de-DE', o);
export function zeichenSatz(z){
  if(z < 1000) return `${z.toLocaleString('de-DE')} Zeichen`;
  if(z < 100000) return `${(Math.round(z / 100) * 100).toLocaleString('de-DE')} Zeichen`;
  return `${(Math.round(z / 1000) * 1000).toLocaleString('de-DE')} Zeichen`;
}

/* Was die Spirale eines Werks sagt, in Worten: Menge und belegte Zeit. */
export function menge(m){
  const s = m.samen || [], datiert = s.filter(x => !x.saum && Number.isFinite(x.zeit)), saum = s.length - datiert.length;
  const zeichen = s.reduce((a, x) => a + Math.max(0, x.laenge || 0), 0), st = strecke(s);
  let zeit;
  if(!s.length) zeit = 'noch keine Fassung';
  else if(!datiert.length) zeit = 'Zeit nicht belegt';
  else { const a = Math.min(...datiert.map(x => x.zeit)), b = Math.max(...datiert.map(x => x.zeit)), tage = Math.round((b - a) / T);
    zeit = tage < 1 ? `belegt am ${tag(a)}` : `über ${tage} ${tage === 1 ? 'Tag' : 'Tage'} belegt, ${tag(a, KURZ)} bis ${tag(b, KURZ)}`;
    if(saum) zeit += `, ${saum} ohne Datum`; }
  return {zeichen, fassungen: s.length, datiert: datiert.length, saum, windungen: windungen(st.gesamt),
    datiertAnteil: st.gesamt ? st.saumAb : 0, satz: s.length ? `${zeichenSatz(zeichen)} · ${zeit}` : zeit};
}
