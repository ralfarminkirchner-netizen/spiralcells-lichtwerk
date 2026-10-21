// Was geschieht mit den Zuletzt-Ringen im Überblick, wenn Ralf in einem anderen Werk der Mitte etwas einträgt? (nur im Speicher)
import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const {Netz} = await import(R + 'app/js/netz.js');
const ank = await import(R + 'app/js/ankunft.js');
const g = JSON.parse(readFileSync(R + 'testdaten/' + (process.argv[2] || 'kette-gewebe') + '/state.json', 'utf8'));
const O = JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8'));
const zeige = (B, N, was) => { const z = ank.letzte(B), ids = [...new Set(z.map(e => e.mondId))];
  const mit = ids.map(id => B.monde.findIndex(m => m.id === id)).map(i => `${B.monde[i].titel}: Ring im Überblick ${N.juengst.has(i) ? 'ja' : 'nein (nur wenn aktiv/hover)'}`);
  console.log(was, '| juengst Mitte:', [...N.juengst].filter(i => N.bezirk(i) === 'mitte').map(i => B.monde[i].titel), '\n   ', mit.join('\n    ')); };
let B = bestand(g), N = new Netz(B, O); zeige(B, N, 'VORHER');
// ein anderes Werk der Mitte ohne Zuletzt-Eintrag, kein Lesematerial
const zIds = new Set(ank.letzte(B).map(e => e.mondId));
const ziel = N.baum.mitte.werke.find(i => !zIds.has(B.monde[i].id) && !N.baum.material.has(i));
const ralf = g.agents.find(a => a.agent_type === 'human' && a.handle === 'Ralf');
const vorlage = g.variants.find(v => B.werkVon(v.id) === B.monde[ziel].id);
g.variants.push({...vorlage, id: 'sim-ralf-1', derived_from: vorlage.id, author_id: ralf.id, label: 'Ralfs Einwurf', notes: '', content: 'x', status: 'entwurf', created_at: '2026-10-21T10:00:00+00:00'});
B = bestand(g); N = new Netz(B, O); console.log('Ralf trägt ein in:', B.monde[ziel].titel); zeige(B, N, 'NACHHER');
console.log('letzte() unverändert:', ank.letzte(B).map(e => e.titel).join(' / '));
