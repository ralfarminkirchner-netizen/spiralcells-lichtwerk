/* Beziehungen und Gebiete, aus dem Fundus gelesen, nie geschrieben.

   Drei Sorten werden nie vermischt:
   - belegt:    gespeicherte Kanten im Fundus (folgt auf, remixt aus, verweist auf, erweitert, …)
   - berechnet: vom Fundus abgeleitete Nähe (gleiche Themen, gemeinsamer Quellpfad); keine Aussage über Absicht
   - Ort:       dasselbe Werk an mehreren Orten („gehört zu“, belegt) */

export const BELEGT = {
  'folgt auf':             {wort: 'folgt auf', rueck: 'davor kam', satz: 'Diese Fassung folgt zeitlich oder sachlich auf die andere.'},
  'kannte beim Entstehen': {wort: 'kannte beim Entstehen', rueck: 'war bekannt bei', satz: 'Beim Entstehen lag die andere schon vor.'},
  'stammt aus':            {wort: 'stammt aus', rueck: 'ist Quelle von', satz: 'Herkunft aus der anderen.'},
  'remixt aus':            {wort: 'remixt aus', rueck: 'wurde remixt in', satz: 'Nimmt Teile der anderen neu auf.'},
  'verweist auf':          {wort: 'verweist auf', rueck: 'wird verwiesen von', satz: 'Verweist ausdrücklich auf die andere.'},
  'erweitert':             {wort: 'erweitert', rueck: 'wird erweitert von', satz: 'Baut die andere aus.'},
  'gemeinsamer Bestand':   {wort: 'gemeinsamer Bestand', rueck: 'gemeinsamer Bestand', satz: 'Liegen im selben Bestand; keine Richtung behauptet.'}
};
export const BERECHNET = {
  'gleiche Themen':        {wort: 'gleiches Gebiet', satz: 'Berechnete Nähe: beide liegen im selben Gebiet. Keine gespeicherte Verbindung.'},
  'gemeinsamer Quellpfad': {wort: 'gleicher Quellbestand', satz: 'Berechnete Nähe: stammen aus demselben Quellbestand. Keine gespeicherte Verbindung.'}
};

const tagListe = s => Array.isArray(s) ? s : String(s || '').match(/'([^']+)'|"([^"]+)"/g)?.map(t => t.slice(1, -1)) || [];

export function baueBezuege(g, I){
  const werkKn = new Map(), dazu = (m, k, v) => { if(!m.has(k)) m.set(k, []); m.get(k).push(v); };
  for(const k of I.alle){
    if(k.art === 'app') dazu(werkKn, k.schluessel.slice(2), k);
    else if(k.art === 'werk') for(const id of k.schluessel.slice(2).split('+')) dazu(werkKn, id, k);
  }
  const fass = id => (I.nachSchluessel.get('f:' + id) || [])[0];
  const werk = id => (werkKn.get(id) || [])[0];
  const finde = id => fass(id) || werk(id);

  // Gebiete (Themen) je Werk, so wie der Fundus sie berechnet hat
  const tags = new Map((g.works || []).map(w => [w.id, tagListe(w.tags)]));
  for(const k of I.alle){
    if(k.art !== 'werk' && k.art !== 'app') continue;
    const ids = k.art === 'app' ? [k.schluessel.slice(2)] : k.schluessel.slice(2).split('+');
    k.gebiete = [...new Set(ids.flatMap(i => tags.get(i) || []))];
  }

  const kanten = [], je = new Map(), gesehen = new Set();
  for(const e of (g.fundus && g.fundus.kanten) || []){
    if(e.ersetzt_durch || e.art === 'gehört zu') continue;
    const belegt = !!BELEGT[e.art] && (e.gespeichert === true || e.gespeichert === 'True');
    const berechnet = !!BERECHNET[e.art];
    if(!belegt && !berechnet) continue;
    const a = finde(e.von), b = finde(e.zu); if(!a || !b || a === b) continue;
    const sig = e.art + '|' + a.schluessel + '|' + b.schluessel; if(gesehen.has(sig)) continue; gesehen.add(sig);
    const kante = {von: a, zu: b, art: e.art, belegt, satz: e.zweck || e.grund || '', geltung: e.geltung || ''};
    kanten.push(kante); dazu(je, a.schluessel, kante); dazu(je, b.schluessel, kante);
  }
  /* Beziehungen eines Knotens; für Werk und App auch die ihrer Fassungen, auf die Behälter gehoben */
  const behaelter = k => { for(let q = k; q; q = q.eltern) if(q.art === 'werk' || q.art === 'app') return q; return k; };
  function von(k){
    const eigene = je.get(k.schluessel) || [];
    if(k.art === 'fassung' || k.art === 'gespraech') return eigene.map(e => ({...e, andere: e.von === k ? e.zu : e.von, aus: e.von === k}));
    const unter = new Set(); (function lauf(q){ unter.add(q.schluessel); for(const c of q.kinder || []) lauf(c); })(k);
    const r = [], doppelt = new Set();
    for(const s of unter) for(const e of je.get(s) || []){
      const hier = unter.has(e.von.schluessel), dort = unter.has(e.zu.schluessel); if(hier && dort) continue;
      const andere = hier ? e.zu : e.von, sig = e.art + andere.schluessel + hier; if(doppelt.has(sig)) continue; doppelt.add(sig);
      r.push({...e, andere, aus: hier});
    }
    return r;
  }
  /* Zwischen Behältern zusammengefasst: für Galaxie und Campus */
  function zwischenBehaeltern(){
    const m = new Map();
    for(const e of kanten){ const a = behaelter(e.von), b = behaelter(e.zu); if(a === b) continue;
      const [p, q] = a.nr < b.nr ? [a, b] : [b, a], key = p.nr + '|' + q.nr;
      if(!m.has(key)) m.set(key, {a: p, b: q, belegt: 0, berechnet: 0, arten: new Set()});
      const z = m.get(key); if(e.belegt) z.belegt++; else z.berechnet++; z.arten.add(e.art); }
    return [...m.values()];
  }
  return {kanten, von, zwischenBehaeltern, behaelter};
}
