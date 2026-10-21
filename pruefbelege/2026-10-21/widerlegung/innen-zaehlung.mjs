import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const kette = process.argv[2] || 'kette-gewebe';
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + kette + '/state.json', 'utf8')));
const O = JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8'));
const {Netz} = await import(R + 'app/js/netz.js');
const N = new Netz(B, O);
const idx = new Map(B.monde.map((m, i) => [m.id, i]));
const bn = b => b === 'mitte' ? 'Mitte' : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
const alle = new Map(), zwischen = new Map(), inWerk = new Map(), typenInWerk = new Map();
for(const e of B.roh.edges){ const a = idx.get(B.werkVon(e.from_variant_id)), b = idx.get(B.werkVon(e.to_variant_id)); if(a == null || b == null) continue;
  const ba = N.bezirk(a), bb = N.bezirk(b); if(ba !== bb) continue;
  alle.set(ba, (alle.get(ba)||0)+1);
  if(a === b){ inWerk.set(ba, (inWerk.get(ba)||0)+1); const t = typenInWerk.get(ba) || {}; t[e.edge_type] = (t[e.edge_type]||0)+1; typenInWerk.set(ba, t); }
  else zwischen.set(ba, (zwischen.get(ba)||0)+1); }
const keys = new Set([...alle.keys(), ...N.innen.keys()]);
for(const k of keys) console.log(bn(k), 'alle', alle.get(k)||0, 'zwischen', zwischen.get(k)||0, 'inWerk', inWerk.get(k)||0, JSON.stringify(typenInWerk.get(k)||{}), 'N.innen', N.innen.get(k)||0);
// Kanten innerhalb eines Werks insgesamt und Typen
let tot = 0; const ty = {}; for(const e of B.roh.edges){ const a = idx.get(B.werkVon(e.from_variant_id)), b = idx.get(B.werkVon(e.to_variant_id)); if(a != null && a === b){ tot++; ty[e.edge_type] = (ty[e.edge_type]||0)+1; } }
console.log('Kanten innerhalb eines Werks gesamt', tot, JSON.stringify(ty), 'von', B.roh.edges.length);
// Typ und Schlüssel von sel.i für Dächer
console.log('innen keys', [...N.innen.keys()].map(k => typeof k + ':' + k).join(','));
