import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/kette-gewebe/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
const name = b => b === 'mitte' ? N.baum.mitte.name : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
// Fäden zwischen demselben Werkpaar (gleiche Knotenlage)
const paar = new Map();
N.faeden.forEach((f, fi) => { const k = [f.von, f.nach].sort((a, b) => a - b).join('-'); if(!paar.has(k)) paar.set(k, []); paar.get(k).push(fi); });
for(const [k, l] of paar) if(l.length > 1) console.log('gleiches Werkpaar:', l.map(fi => `${fi} ${N.faeden[fi].typ} „${B.monde[N.faeden[fi].von].titel}“→„${B.monde[N.faeden[fi].nach].titel}“ (${N.faeden[fi].kanten.length} K, ${N.faeden[fi].verwendung} mit Verw.)`).join(' | '));
for(const fi of [0, 25, 3, 4, 27, 28]){ const f = N.faeden[fi]; console.log(fi, f.typ, name(f.bzVon), '→', name(f.bzNach), `„${B.monde[f.von].titel}“ → „${B.monde[f.nach].titel}“`, 'Kanten', f.kanten.length, 'mit to_part', f.kanten.filter(e => e.usage && e.usage.to_part).length); }
// Bündel mit mehreren Kanten in einem Faden: am Handy ohne ←/→ erreichbar?
for(const [fi, f] of N.faeden.entries()) if(f.kanten.length > 1) console.log(`Faden ${fi}: ${f.kanten.length} Kanten, mit Verwendung ${f.verwendung}; nur ←/→ erreicht Kante 2..: Teile`, f.kanten.map(e => e.usage ? (e.usage.to_part ? 'to_part' : 'usage') : '-').join(','));
