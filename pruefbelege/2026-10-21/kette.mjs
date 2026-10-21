import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
const {bestand, STIMMEN} = await import(R + 'app/js/daten.js');
const {wuchs} = await import(R + 'app/js/wuchs.js');
const welche = process.argv[2] || 'kette-gewebe';
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + welche + '/state.json', 'utf8')));
let quer = 0, alle = 0;
for(const m of B.monde){ const W = wuchs(m);
  for(let i = 0; i < W.n; i++){ const p = W.eltern[i]; if(p < 0) continue; if(W.art[i] !== 'kette' && W.art[i] !== 'reihe') continue; alle++;
    if(m.samen[p].baum !== m.samen[i].baum){ quer++; if(quer < 15) console.log('QUER', m.titel, '|', W.art[i], '|', m.samen[p].label.slice(0, 40), '->', m.samen[i].label.slice(0, 40), '| stimme', m.samen[p].stimme, '->', m.samen[i].stimme, '| wechsel', W.wechsel[i]); } }
  // wechsel statistik
  const nw = W.wechsel.reduce((a, x) => a + x, 0); if(nw) console.log('WECHSEL', m.titel, nw, [...Array(W.n).keys()].filter(i => W.wechsel[i]).map(i => `${m.samen[W.eltern[i]].stimme}->${m.samen[i].stimme}:${W.art[i]}`).join(' '));
}
console.log('kette/reihe gesamt', alle, 'davon über Zweiggrenze', quer);
