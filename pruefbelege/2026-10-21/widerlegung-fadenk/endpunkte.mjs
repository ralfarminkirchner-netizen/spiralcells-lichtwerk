import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
for(const datei of ['testdaten/kette-gewebe/state.json', 'testdaten/kette-claude/state.json']){
  let B; try{ B = bestand(JSON.parse(readFileSync(ROOT + datei, 'utf8'))); }catch(e){ console.log(datei, 'fehlt', e.message); continue; }
  const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
  console.log('==', datei, 'Fäden', N.faeden.length);
  const lab = id => (B.fassungen.get(id)?.label || '?').slice(0, 40);
  for(const f of N.faeden){ if(f.kanten.length < 2) continue;
    console.log(`${B.monde[f.von].titel.slice(0, 28)} → ${B.monde[f.nach].titel.slice(0, 28)} [${f.typ}]`);
    const e0 = f.kanten[0], ziel0 = e0.usage && e0.usage.to_part ? e0.to_variant_id : e0.from_variant_id;
    f.kanten.forEach((e, k) => {
      const ziel = e.usage && e.usage.to_part ? e.to_variant_id : e.from_variant_id;
      // Erreichbar über Leseraum/Lesefläche der Fassung, an der Kante 0 ankommt?
      const beruehrt = e.from_variant_id === ziel0 || e.to_variant_id === ziel0;
      console.log(`  k=${k} von „${lab(e.from_variant_id)}“ nach „${lab(e.to_variant_id)}“ usage=${!!e.usage} to_part=${!!(e.usage && e.usage.to_part)} ziel=${ziel === ziel0 ? 'gleich wie k0' : 'andere Fassung'} beruehrtZielK0=${beruehrt}`);
    }); }
}
