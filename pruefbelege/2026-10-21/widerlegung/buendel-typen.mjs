import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const {Netz} = await import(R + 'app/js/netz.js');
const O = JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8'));
for(const k of ['kette-gewebe', 'kette-claude']){
  const g = JSON.parse(readFileSync(R + 'testdaten/' + k + '/state.json', 'utf8'));
  const B = bestand(g), N = new Netz(B, O);
  const nm = b => b === 'mitte' ? 'Mitte' : b === 'ohne' ? 'ohne' : N.daecher[b].name;
  console.log('==', k, 'Werke', B.monde.length, 'Fäden', N.faeden.length, 'Bündel', N.buendel.length);
  for(const x of N.buendel) console.log('  Bündel', nm(x.von), '->', nm(x.nach), JSON.stringify([...x.typen]), 'kanten', x.kanten);
  console.log('  innen', JSON.stringify([...N.innen]));
  // Fäden nach Typ: innerhalb/über Bezirk
  const t = {};
  for(const f of N.faeden){ const s = f.bzVon === f.bzNach ? 'innen' : 'quer'; t[f.typ + ':' + s] = (t[f.typ + ':' + s] || 0) + f.kanten.length; }
  console.log('  Fäden', JSON.stringify(t));
  // Kanten im selben Werk (verworfen)
  const idx = new Map(B.monde.map((m, i) => [m.id, i])); const selbst = {};
  for(const e of B.roh.edges){ const a = idx.get(B.werkVon(e.from_variant_id)), b = idx.get(B.werkVon(e.to_variant_id)); if(a == null || b == null || a === b){ selbst[e.edge_type] = (selbst[e.edge_type] || 0) + 1; } }
  console.log('  im selben Werk/ohne Ort', JSON.stringify(selbst));
}
