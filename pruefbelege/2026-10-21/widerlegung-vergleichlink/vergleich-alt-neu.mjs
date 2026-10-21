import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {W} = await import(ROOT + 'app/js/welt.js');
const {Zelle} = await import(ROOT + 'app/js/zelle.js');
const NEU = await import('../stoff-kopie.mjs');
const ALT = await import('./stoff-alt.mjs');
for(const satz of ['kette-gewebe', 'kette-claude']){
  W.B = bestand(JSON.parse(readFileSync(ROOT + 'testdaten/' + satz + '/state.json', 'utf8')));
  const r = {n: 0, neuFremd: 0, altFremd: 0, neuKeim: 0, altKeim: 0, beideFremdGleich: 0, nurNeuFremd: 0};
  for(const m of W.B.monde){ if(!m.samen.length) continue; W.Z = new Zelle(m, {ohneAufzug: true});
    const imSamen = id => m.samen.some(s => s.id === id);
    for(let si = 0; si < m.samen.length; si++){ const v = m.samen[si].fassung; const zz = {mond: m, v, si, modus: 'vergleich', vergleich: null, stelle: null};
      NEU.setzeZ({...zz}); ALT.setzeZ({...zz}); const vn = NEU.vorschlag(), va = ALT.vorschlag(); r.n++;
      const nf = vn && !imSamen(vn), af = va && !imSamen(va);
      if(nf){ r.neuFremd++; if(W.B.werkVon(vn) === m.id) r.neuKeim++; }
      if(af){ r.altFremd++; if(W.B.werkVon(va) === m.id) r.altKeim++; }
      if(nf && af && vn === va) r.beideFremdGleich++;
      if(nf && !af) r.nurNeuFremd++;
    } }
  console.log(satz, r);
}
