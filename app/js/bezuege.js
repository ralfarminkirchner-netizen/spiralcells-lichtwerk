/* Bezüge aus dem Fundus zwischen ganzen Werken (nur lesen).

   Der Fundus-Export (`fundus export --graph`) trägt unter `fundus.kanten` alle gespeicherten Verbindungen
   (gespeichert: true) und die berechnete Nähe (abgeleitet). Die Fassungskanten (Bezüge zwischen zwei
   Fassungen, Form B) stehen schon in `edges` und werden hier nicht noch einmal gezählt.
   Jeder Knoten (Fassung, Baustein, Vorgang, Zelle) wird seinem Werk zugeordnet; was im selben Werk
   bleibt, ist kein Bezug zwischen Werken. Fehlt `fundus`, ist die Liste leer: dann gilt der alte Bestand. */

// Fundus-Art → Fadentyp (Bindestrich wie in Mooncells). Unbekannte Arten werden wörtlich durchgereicht.
export const TYP = {
  'remixt aus': 'remixt-aus', 'erweitert': 'erweitert', 'verweist auf': 'verweist-auf', 'testet': 'testet',
  'widerspricht': 'widerspricht', 'gehört zu': 'gehört-zu', 'folgt auf': 'folgt-auf', 'kannte beim Entstehen': 'kannte',
  'stammt aus': 'stammt-aus', 'baut auf': 'baut-auf', 'gemeinsamer Bestand': 'gemeinsamer-bestand',
  'wirkt mit in': 'wirkt-mit-in', 'ist Baustein von': 'ist-baustein-von', 'bewertet': 'bewertet',
  'Alternative zu': 'alternative-zu', 'vorgezogen vor': 'vorgezogen-vor', 'passt zu': 'passt-zu',
};
const typVon = art => TYP[art] || String(art || '').toLowerCase().replace(/\s+/g, '-');

/* Knoten → Werk: Zellen sind ihr Werk, Fassungen über ihren Zweig; Bausteine und Vorgänge
   über ihre gespeicherten „stammt aus“, „gehört zu“ bzw. „betrifft“, bis nichts mehr dazukommt. */
export function werkVonKnoten(g){
  const werk = new Map();
  for(const w of g.works || []) werk.set(w.id, w.id);
  const zweig = new Map((g.worktrees || []).map(t => [t.id, t.work_id]));
  for(const v of g.variants || []){ const w = zweig.get(v.worktree_id); if(w) werk.set(v.id, w); }
  const kanten = (g.fundus && g.fundus.kanten) || [];
  for(let runde = 0; runde < 6; runde++){ let neu = 0;
    for(const k of kanten){ if(!k.gespeichert || k.form !== 'A') continue;
      if(!werk.has(k.von) && werk.has(k.zu) && ['stammt aus', 'gehört zu', 'betrifft'].includes(k.art)){ werk.set(k.von, werk.get(k.zu)); neu++; } }
    if(!neu) break; }
  return werk;
}

/* Alle Bezüge zwischen zwei verschiedenen Werken: gespeicherte (aus dem Bestand) und berechnete (nur Ansicht). */
export function fundusBezuege(g){
  if(!g || !g.fundus || !Array.isArray(g.fundus.kanten)) return [];
  const werk = werkVonKnoten(g), varianten = new Set((g.variants || []).map(v => v.id)), raus = [];
  for(const k of g.fundus.kanten){
    const a = werk.get(k.von), b = werk.get(k.zu);
    if(a == null || b == null || a === b) continue;
    if(k.gespeichert){
      if(Array.isArray(k.relation) && k.relation[0] === 'B' && varianten.has(k.von) && varianten.has(k.zu)) continue;   // steht schon in edges
      raus.push({von: a, nach: b, art: k.art, typ: typVon(k.art), gespeichert: true, knotenVon: k.von, knotenZu: k.zu, schluessel: JSON.stringify(k.relation)});
    } else {
      raus.push({von: a, nach: b, art: k.art, typ: 'nahe', grund: k.art, gespeichert: false, knotenVon: k.von, knotenZu: k.zu, schluessel: [k.von, k.zu, k.art].join('|')});
    }
  }
  return raus;
}
