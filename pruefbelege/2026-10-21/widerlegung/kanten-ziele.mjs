import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 375; globalThis.innerHeight = 812;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
for(const st of ['kette-gewebe', 'kette-claude']){
const B = bestand(JSON.parse(readFileSync(ROOT + `testdaten/${st}/state.json`, 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
console.log('==', st, 'Fäden', N.faeden.length, 'mit >1 Kante', N.faeden.filter(f => f.kanten.length > 1).length);
const lab = id => { const v = B.fassungen.get(id); return v ? (v.label || '').slice(0, 40) : '?'; };
N.faeden.forEach((f, fi) => { if(f.kanten.length < 2) return;
  console.log(`Faden ${fi} ${f.typ} „${B.monde[f.von].titel}“→„${B.monde[f.nach].titel}“`);
  f.kanten.forEach((e, k) => { const u = e.usage; const ziel = u && u.to_part ? e.to_variant_id : e.from_variant_id;
    console.log(`  K${k+1}: von „${lab(e.from_variant_id)}“ nach „${lab(e.to_variant_id)}“ to_part=${!!(u&&u.to_part)} from_part=${!!(u&&u.from_part)} Ziel=${u && u.to_part ? 'to' : 'from'} gleichesTo=${e.to_variant_id === f.kanten[0].to_variant_id} gleichesFrom=${e.from_variant_id === f.kanten[0].from_variant_id}`); });
});
// gleiches Werkpaar
const paar = new Map(); N.faeden.forEach((f, fi) => { const k = [f.von, f.nach].sort((a,b)=>a-b).join('-'); (paar.get(k) || paar.set(k, []).get(k)).push(fi); });
for(const [k, l] of paar) if(l.length > 1) console.log('gleiches Werkpaar', l.join(','), l.map(fi => N.faeden[fi].typ + ' ' + N.faeden[fi].bzVon + '→' + N.faeden[fi].bzNach).join(' | '));
}
