import {readFileSync} from 'node:fs';
const S = '/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/js/';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(S + 'daten.js');
const {W} = await import(S + 'welt.js');
const {wuchs} = await import(S + 'wuchs.js');
const st = await import(S + 'stoff.js');
const {materialParagraphs, alignParagraphs} = await import(S + 'materialraum.js');
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/kette-gewebe/state.json', 'utf8'))); W.B = B;
const istSeite = f => /^<!doctype html>/i.test(String((f && f.content) || '').trimStart());
const mess = (a, b) => { const pa = materialParagraphs(a.content), pb = materialParagraphs(b.content), paare = alignParagraphs(pa, pb), {anteil, wv} = st.abgleich(paare);
  const gep = paare.filter(p => p.a && p.b).length; const grob = [...wv.values()].map(v => v.grob).filter(Boolean); return {paare: paare.length, gep, anteil, kaum: st.kaumGemeinsam(paare, anteil), grob}; };
const paare = [];
for(const e of B.roh.edges){ const a = B.fassungen.get(e.from_variant_id), b = B.fassungen.get(e.to_variant_id); if(!a || !b || istSeite(a) || istSeite(b)) continue; paare.push(['kante ' + e.edge_type, a, b]); }
for(const m of B.monde){ const Wu = wuchs(m); for(let i = 0; i < Wu.n; i++){ const p = Wu.eltern[i]; if(p < 0) continue; const a = m.samen[i].fassung, b = m.samen[p].fassung; if(istSeite(a) || istSeite(b)) continue; if(Wu.art[i] === 'reihe') continue; paare.push(['eltern ' + Wu.art[i], a, b]); } }
let n = 0, grenz = [], schwach = [];
for(const [wie, a, b] of paare){ const r = mess(a, b); n++;
  if(r.kaum && r.anteil >= 0.2) grenz.push([wie, a.label, b.label, r]);
  if(!r.kaum && r.anteil < 0.3) schwach.push([wie, a.label, b.label, r]); }
console.log('Paare', n);
console.log('kaum trotz anteil>=0.2:', grenz.length); for(const g of grenz.slice(0, 10)) console.log('  ', g[0], '|', g[1].slice(0, 40), '<>', g[2].slice(0, 40), JSON.stringify({...g[3], anteil: +g[3].anteil.toFixed(3)}));
console.log('nicht kaum bei anteil<0.3:', schwach.length); for(const g of schwach.slice(0, 10)) console.log('  ', g[0], '|', g[1].slice(0, 40), '<>', g[2].slice(0, 40), JSON.stringify({...g[3], anteil: +g[3].anteil.toFixed(3)}));
