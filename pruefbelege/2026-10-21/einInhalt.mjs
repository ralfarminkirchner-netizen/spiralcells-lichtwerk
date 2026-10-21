import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand, STIMMEN} = await import(R + 'app/js/daten.js');
const {wuchs} = await import(R + 'app/js/wuchs.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8')));
const m = B.monde.find(x => x.titel.startsWith('Ein Inhalt')), W = wuchs(m);
for(let i = 0; i < W.n; i++) if(W.wechsel[i]){ const p = W.eltern[i], t = B.baeume.get(m.samen[i].baum), tp = B.baeume.get(m.samen[p].baum);
  console.log(W.art[i], STIMMEN[m.samen[p].stimme].name, '->', STIMMEN[m.samen[i].stimme].name, '|', m.samen[p].label.slice(0, 50), '->', m.samen[i].label.slice(0, 50), '| baum gleich', m.samen[i].baum === m.samen[p].baum, '| zweig-autor', B.agenten.get(t.author_id)?.handle, '| derived_from', m.samen[i].fassung.derived_from === m.samen[p].id, '| author', B.agenten.get(m.samen[i].fassung.author_id)?.handle);
  console.log('   th0', (W.th0[i] * 180 / Math.PI).toFixed(0), 'th1', (W.th1[i] * 180 / Math.PI).toFixed(0), 'parent th1', (W.th1[p] * 180 / Math.PI).toFixed(0)); }
const zw = W.zweige.map(z => z.length); console.log('zweige', zw.join(','));
