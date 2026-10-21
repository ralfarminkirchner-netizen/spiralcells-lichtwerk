// Welche Fäden haben mehrere Kanten, und wie viele davon mit to_part? (nur lesen)
import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const {Netz} = await import(R + 'app/js/netz.js');
for(const kette of ['kette-claude', 'kette-gewebe']){
  const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + kette + '/state.json', 'utf8')));
  const O = JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8'));
  const N = new Netz(B, O);
  const mehr = N.faeden.map((f, fi) => ({fi, n: f.kanten.length, tp: f.kanten.filter(e => e.usage && e.usage.to_part).length,
    ziele: new Set(f.kanten.map(e => (e.usage && e.usage.to_part) ? e.to_variant_id + '|' + e.usage.to_part : e.from_variant_id)).size}))
    .filter(x => x.n > 1);
  console.log(kette, 'Fäden', N.faeden.length, 'mit >1 Kante', mehr.length, 'davon >=2 mit to_part', mehr.filter(x => x.tp >= 2).length);
  console.log(' verschiedene Ziele je Faden (>1):', mehr.filter(x => x.ziele > 1).map(x => `${x.fi}:${x.n}/${x.tp}/${x.ziele}`).join(' '));
  const f = N.faeden[29]; if(f) console.log(' Faden 29:', f.kanten.length, 'Kanten', f.kanten.map(e => e.usage ? ('to_part=' + !!e.usage.to_part + ' ziel=' + (e.usage.to_part ? e.to_variant_id : e.from_variant_id).slice(0,4)) : 'ohne usage').join('; '));
}
