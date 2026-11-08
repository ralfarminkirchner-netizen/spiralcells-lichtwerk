/* Die Auswahl über alle Welten (Ralf, 08.11.2026): vom Netz in eine Zelle und zurück, in jeder Welt am selben Werk.

   Mitgenommen wird beim Wechsel nur, WELCHES Werk gewählt ist. Nichts fliegt von Welt zu Welt (Ralf, 01.11.:
   kein Morph); jede Welt zeigt das Werk in ihrer eigenen Gestalt. Die Bezüge des Werks liest jede Welt aus
   demselben Netz; ein Wechsel ändert keine Relation. Reine Funktionen: lesen nur, schreiben nichts. */

export const WELTEN = ['kosmos', 'licht', 'garten', 'galaxie', 'dorf', 'campus', 'buero', 'text'];

/* Welches Werk eine Auswahl meint: ein gewähltes Werk im Netz, sonst das Werk der offenen Zelle. */
export function werkDerAuswahl(sel, offen){
  if(sel && sel.art === 'mond' && Number.isInteger(sel.i)) return sel.i;
  if(Number.isInteger(offen) && offen >= 0 && (!sel || ['same', 'keim', 'echo', 'spur'].includes(sel.art))) return offen;
  return null;
}

/* Ein Wechsel: dieselbe Welt noch einmal führt zurück in den Kosmos (wie bisher), der Text klappt auf und zu.
   Die neue Welt beginnt außen, am gewählten Werk; das Werk bleibt. */
export function wechsle(z, ziel){
  if(!WELTEN.includes(ziel)) return z;
  const welt = ziel === 'text' ? (z.welt === 'text' ? 'kosmos' : 'text') : z.welt === ziel ? 'kosmos' : ziel;
  return {welt, werk: z.werk, zelle: false};
}

/* Die Bezüge eines Werks, wie das Netz sie trägt: gespeicherte und berechnete getrennt, in fester Folge. */
export function bezuegeDesWerks(N, i){
  const gespeichert = [], berechnet = [];
  if(i == null || !N) return {gespeichert, berechnet};
  for(const f of N.faeden){ if(f.von !== i && f.nach !== i) continue;
    for(const e of f.kanten){ const k = [f.von, f.nach, f.typ, e.schluessel || e.id].join('|'); (f.abgeleitet ? berechnet : gespeichert).push(k); } }
  return {gespeichert: gespeichert.sort(), berechnet: berechnet.sort()};
}

/* Adresse: das gewählte Werk steht als `werk=<lesbarer Name>` hinter dem #, neben den übrigen Angaben. */
const lesbar = v => typeof v === 'string' && /^[a-z0-9-]{1,90}$/.test(v);
export function mitWerk(hash, name){
  const q = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  q.delete('werk'); if(lesbar(name)) q.set('werk', name);
  const s = q.toString(); return s ? '#' + s : '';
}
export function werkAus(hash){
  const q = new URLSearchParams(String(hash || '').replace(/^#/, '')), alle = q.getAll('werk');
  return alle.length === 1 && lesbar(alle[0]) ? alle[0] : null;
}
