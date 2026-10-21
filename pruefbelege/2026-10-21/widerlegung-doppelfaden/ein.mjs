import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz} = await import(ROOT + 'app/js/netz.js');
for(const kette of ['kette-gewebe', 'kette-claude']){
const B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/' + kette + '/state.json', 'utf8')));
const N = new Netz(B, JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8')));
const name = b => b === 'mitte' ? N.baum.mitte.name : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
const a = B.monde.findIndex(m => m.titel.startsWith('Ein Inhalt'));
console.log(kette, 'Ein Inhalt idx', a, a >= 0 && B.monde[a].samen.length, 'Ausprägungen');
N.faeden.forEach((f, fi) => { if(f.von !== a && f.nach !== a) return; console.log(' ', fi, B.monde[f.von].titel, '->', B.monde[f.nach].titel, f.typ, name(f.bzVon), '->', name(f.bzNach), f.kanten.map(e => e.created_at + ' ' + (e.author_id||'').slice(0,0)).join(';')); });
console.log(' Bündel gesamt', N.buendel.length, N.buendel.map(x => name(x.von) + '→' + name(x.nach) + '(' + x.faeden.length + ')').join(', '));
}
