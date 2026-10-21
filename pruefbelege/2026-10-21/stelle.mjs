import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
const {materialParagraphs} = await import(ROOT + 'app/js/materialraum.js');
// verorte aus stoff.js nachgebildet (stoff.js braucht das DOM nicht beim Import? versuchen)
let verorte; try { ({verorte} = await import(ROOT + 'app/js/stoff.js')); } catch(e){ console.log('stoff import', e.message); }
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
N.faeden.forEach((f, fi) => f.kanten.forEach((e, k) => { const u = e.usage; if(!(u && u.to_part)) return;
  const v = B.fassungen.get(e.to_variant_id), m = B.mondVon.get(B.werkVon(v.id)), wo = verorte(u.to_part, materialParagraphs(v.content));
  const keim = m.keim.some(x => x.id === v.id);
  console.log(`Faden ${fi} K${k}: „${m.titel}“ ${keim ? '(Ausgangsfrage)' : ''} Teil „${String(u.to_part).slice(0, 50)}“ →`, wo ? `${wo.art} Absatz ${wo.index} mehrfach ${wo.mehrfach} ⇒ ${wo.art !== 'wörtlich' || wo.mehrfach > 1 ? 'ungefähr' : 'genau'}` : 'nicht gefunden'); }));
