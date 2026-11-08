/* Ralfs neue Ordnung als Graph (08.11.2026, „Ja, zeigen“): Orte sind Knoten im Fundus, nicht Ordner.

   Im Fundus stehen zehn Ortsknoten (Zellen mit Art Oberdach, Mitte, Tragwerk, Sammlung), dazu App-Zellen und
   Kanten „gehört zu“ (Bezüge Form B) in zwei Ebenen: Werk → App und App → Ort. Ein Werk kann zu mehreren
   Apps, eine App zu mehreren Orten gehören. Ralfs Grundsatz: Die Quelle liegt einmal und erscheint an jedem
   ihrer Orte als dasselbe Werk, keine Kopie.

   Hier wird daraus die Ordnung, die Lichtwerk zeichnet: Mitte, die Orte darum als Dächer, die Apps als ihre
   Bereiche. Ein Werk steht an seinem ersten Ort (in der festen Folge unten) mit seinem Leib; an jedem weiteren
   Ort steht es als Spiegel desselben Werks. Kein zweiter Bestand: die alte Baumdatei liefert nur noch das
   Lesematerial. Reine Funktionen, sie lesen nur. */

export const ORTSARTEN = new Set(['Oberdach', 'Mitte', 'Tragwerk', 'Sammlung']);
// Die feste Folge der Orte: die Mitte trägt, dann die Oberdächer wie Ralf sie genannt hat, Tragwerk, zuletzt was noch geprüft wird
export const FOLGE = ['Mitte', 'MiND-BODY-SOUL', 'GAMES', 'MUSiC', 'EDUCATiON', 'WRiTING', 'ARTS', 'PERSONAL', 'Tragwerk', 'Zur Prüfung'];
const SATZ = {
  'Mitte': 'die Zentrale und ihre Werkzeuge', 'Tragwerk': 'die Werke, die in vielen Apps mitwirken', 'Zur Prüfung': 'noch nicht sicher eingeordnet',
};

export const istOrt = w => !!w && ORTSARTEN.has(w.work_type);

/* Hat der Export die neue Ordnung? Dann gilt sie, sonst die alte Baumdatei. */
export function hatOrtsgraph(g){
  return !!(g && Array.isArray(g.works) && g.works.some(istOrt) && g.fundus && Array.isArray(g.fundus.kanten) && g.fundus.kanten.some(k => k.art === 'gehört zu' && k.form === 'B'));
}

/* Aus dem Export: welche Werke zu welcher App, welche Apps zu welchem Ort. */
export function ortsgraph(g){
  const W = new Map((g.works || []).map(w => [w.id, w])), hoch = new Map();
  for(const k of (g.fundus && g.fundus.kanten) || []){
    if(k.art !== 'gehört zu' || k.form !== 'B' || !k.gespeichert || !W.has(k.von) || !W.has(k.zu) || k.von === k.zu) continue;
    if(!hoch.has(k.von)) hoch.set(k.von, new Set()); hoch.get(k.von).add(k.zu);
  }
  const rang = w => { const r = FOLGE.indexOf(w.title); return r < 0 ? FOLGE.length : r; };
  const orte = [...W.values()].filter(istOrt).sort((a, b) => rang(a) - rang(b) || String(a.title).localeCompare(String(b.title), 'de'));
  const ortVon = new Map(orte.map(o => [o.id, o]));
  // Apps: Werke, die selbst an einem Ort hängen. Je Ort ihre Apps, je App ihre Werke
  const apps = new Map();   // App → Set der Orte
  for(const [von, zu] of hoch) for(const z of zu) if(ortVon.has(z) && !istOrt(W.get(von))){ if(!apps.has(von)) apps.set(von, new Set()); apps.get(von).add(z); }
  const unter = new Map([...apps.keys()].map(a => [a, []]));   // App → Werke darunter
  for(const [von, zu] of hoch) for(const z of zu) if(unter.has(z) && z !== von && !apps.has(von)) unter.get(z).push(von);
  // Orte eines Werks: die seiner Apps; eine App hat ihre eigenen
  const orteVon = new Map();
  const nimm = (id, o) => { if(!orteVon.has(id)) orteVon.set(id, []); const l = orteVon.get(id); if(!l.includes(o)) l.push(o); };
  for(const [a, os] of apps) for(const o of os) nimm(a, o);
  for(const [a, ws] of unter) for(const w of ws) for(const o of apps.get(a)) nimm(w, o);
  for(const l of orteVon.values()) l.sort((p, q) => rang(ortVon.get(p)) - rang(ortVon.get(q)));
  return {W, orte, apps, unter, orteVon, name: id => (W.get(id) || {}).title || ''};
}

/* Die Ordnung im Format, das ordne() liest: Mitte, Dächer mit Bereichen (je App einer), dazu Spiegel.
   Ein Eintrag {id} trifft genau ein Werk; derselbe Eintrag darf an mehreren Stellen stehen. */
export function ordnungAusGraph(g, alt){
  const G = ortsgraph(g), alt0 = alt && typeof alt === 'object' ? alt : {};
  const titel = id => G.name(id), sortiert = ids => [...new Set(ids)].sort((a, b) => titel(a).localeCompare(titel(b), 'de'));
  const bereicheVon = o => sortiert([...G.apps].filter(([, os]) => os.has(o.id)).map(([a]) => a))
    .map(a => ({name: titel(a), werke: [{id: a}, ...sortiert(G.unter.get(a)).map(id => ({id}))]}));
  const mitteOrt = G.orte.find(o => o.work_type === 'Mitte');
  const mitte = {name: mitteOrt ? mitteOrt.title : 'Mitte', satz: SATZ.Mitte,
    werke: mitteOrt ? bereicheVon(mitteOrt).flatMap(b => b.werke) : []};
  const daecher = G.orte.filter(o => o !== mitteOrt).map(o => ({name: o.title, satz: SATZ[o.title] || '', bereiche: bereicheVon(o)})).filter(d => d.bereiche.length);
  const auch = new Map();   // Werk → Namen aller seiner Orte, in der festen Folge
  for(const [id, os] of G.orteVon) if(os.length > 1) auch.set(id, os.map(o => G.name(o)));
  const unterApps = new Map();   // Werk → Namen seiner Apps, wenn es mehrere hat (auch am selben Ort)
  const appsVon = new Map(); for(const [a, ws] of G.unter) for(const w of ws){ if(!appsVon.has(w)) appsVon.set(w, []); appsVon.get(w).push(G.name(a)); }
  for(const [w, as] of appsVon) if(as.length > 1) unterApps.set(w, as.sort((p, q) => p.localeCompare(q, 'de')));
  return {bestaetigt: false, quelle: 'fundus', stand: 'Aus dem Fundus: Orte und „gehört zu“, von Ralf noch zu bestätigen.',
    mitte, daecher, material: Array.isArray(alt0.material) ? alt0.material : [], auch, unterApps};
}

/* Ist ein Bezug eine Kante der Ordnung? „gehört zu“ von einem Werk zu einer App oder einem Ort. Solche Kanten
   zeigt Lichtwerk als Lage (das Werk steht dort), nicht als Faden. */
export function istOrdnungskante(g){
  const G = ortsgraph(g), ort = new Set(G.orte.map(o => o.id));
  return x => x.art === 'gehört zu' && x.gespeichert && (ort.has(x.nach) || G.apps.has(x.nach)) && (G.orteVon.has(x.von) || G.apps.has(x.von));
}

/* „auch in WRiTING · PERSONAL“: die übrigen Orte eines Werks, ohne den, an dem man gerade schaut */
export function auchSatz(orte, hier){
  const rest = (orte || []).filter(o => o !== hier);
  return rest.length ? 'auch in ' + rest.join(' · ') : '';
}
