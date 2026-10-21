import {readFileSync} from 'node:fs';
const S = '/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/js/';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(S + 'daten.js');
const {W} = await import(S + 'welt.js');
const st = await import(S + 'stoff.js');
const {materialParagraphs, alignParagraphs} = await import(S + 'materialraum.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + (process.argv[2] || 'kette-gewebe') + '/state.json', 'utf8'))); W.B = B;
const finde = l => [...B.fassungen.values()].find(v => (v.label || '').startsWith(l));
const mess = (a, b) => { const pa = materialParagraphs(a.content), pb = materialParagraphs(b.content), paare = alignParagraphs(pa, pb), {anteil} = st.abgleich(paare);
  const gep = paare.filter(p => p.a && p.b).length; return {absA: pa.length, absB: pb.length, paare: paare.length, gepaart: gep, anteil: +anteil.toFixed(3), kaum: st.kaumGemeinsam(paare, anteil), wortAnteil: +st.wortAnteil(a, b).toFixed(3)}; };
const a = finde('Befund · Zeitspirale ist die Lebenserschließung'), b = finde("Antwort · Claude auf Hermes");
console.log('A', a && a.label, '| B', b && b.label); console.log(mess(a, b));
// alle Kanten-Gegenüber
for(const e of B.roh.edges){ if(e.from_variant_id !== a.id && e.to_variant_id !== a.id) continue; const o = B.fassungen.get(e.from_variant_id === a.id ? e.to_variant_id : e.from_variant_id); console.log(' Kante', e.edge_type, '|', o.label, mess(a, o)); }
