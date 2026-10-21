import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const {Netz} = await import(R + 'app/js/netz.js');
const g = JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8'));   // nur im Speicher verändert, nichts wird geschrieben
const B0 = bestand(g), fass = t => B0.monde.find(m => m.titel.startsWith(t)), erste = m => (m.keim[0] || m.samen[0].fassung);
const reim = erste(fass('REiMWERK')), woerter = erste(fass('Die Wörter bleiben'));
g.edges.push({id: 'probe-1', from_variant_id: reim.id, to_variant_id: woerter.id, edge_type: 'widerspricht', author_id: reim.author_id, created_at: '2026-10-21T10:00:00Z'});
const B = bestand(g), N = new Netz(B, JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8')));
for(const x of N.buendel) if(x.typen.size > 1 || x.kanten > 3) console.log('Bündel', x.von, '->', x.nach, 'typ', x.typ, JSON.stringify([...x.typen]), 'kanten', x.kanten);
