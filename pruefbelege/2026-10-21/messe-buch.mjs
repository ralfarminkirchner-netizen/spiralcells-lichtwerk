// Nur lesend, synthetisch: teilenWortlaut-Rechnung für buchlange Fassungen aus echtem Wortlaut der Testkette
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand, menschlich} = await import(ROOT + '/app/js/daten.js');
const {materialParagraphs, alignParagraphs} = await import(ROOT + '/app/js/materialraum.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/kette-gewebe/state.json`, 'utf8')));
const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
const zeige = t => menschlich(t).replace(/\b[a-z]+(?:-[a-z]+)+-(20\d{2})(\d{2})(\d{2})\b/g, (_, y, mo, d) => `Runde vom ${Number(d)}. ${MON[Number(mo) - 1] || ''}`.trim()).replace(/(?:Library\/)?Mobile Documents\/[^\s<>"'`)\]]+/g, x => x.split(/[\/:]/).filter(Boolean).pop() || '[Ablage]');
function lcs(A, Bt){ if(A.length * Bt.length > 90000) return null; const ka = new Set(), kb = new Set(), w = Bt.length + 1, dp = new Uint32Array((A.length + 1) * w);
  for(let i = A.length - 1; i >= 0; i--) for(let j = Bt.length - 1; j >= 0; j--) dp[i * w + j] = A[i] === Bt[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
  let i = 0, j = 0; while(i < A.length && j < Bt.length){ if(A[i] === Bt[j]){ ka.add(i++); kb.add(j++); } else if(dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++; else j++; } return {ka, kb}; }
function wortVergleich(a, b){ let A = a.match(/\s+|[^\s]+/g) || [], Bt = b.match(/\s+|[^\s]+/g) || [], k = lcs(A, Bt); if(k) return {A, Bt, ...k, grob: null};
  A = a.split(/(\n)/); Bt = b.split(/(\n)/); k = lcs(A, Bt); if(k) return {A, Bt, ...k, grob: 'zeilen'}; return {A: [a], Bt: [b], ka: new Set([0]), kb: new Set([0]), grob: 'keiner'}; }
function abgleich(paare){ const zeichen = s => s.replace(/\s+/g, '').length; let gemein = 0, alle = 0;
  for(const p of paare){ const a = p.a ? zeige(p.a.text) : '', b = p.b ? zeige(p.b.text) : ''; alle += zeichen(a) + zeichen(b); if(!p.a || !p.b) continue; if(p.a.text === p.b.text){ gemein += zeichen(a) + zeichen(b); continue; }
    const v = wortVergleich(a, b); if(v.grob === 'keiner') continue; v.A.forEach((t, i) => { if(v.ka.has(i)) gemein += zeichen(t); }); v.Bt.forEach((t, i) => { if(v.kb.has(i)) gemein += zeichen(t); }); } return alle ? gemein / alle : 0; }
// Echte Prosa-Absätze sammeln
const abs = []; for(const v of B.fassungen.values()){ if(typeof v.content !== 'string' || /^\s*[\[{<]/.test(v.content)) continue; for(const p of v.content.split(/\n[ \t]*\n+/)) if(p.length > 200 && p.length < 1500 && !/^\s*[#|`-]/.test(p)) abs.push(p); }
console.log('echte Prosa-Absätze 200–1500 Zeichen:', abs.length, 'mittlere Länge', Math.round(abs.reduce((a, p) => a + p.length, 0) / abs.length));
for(const n of [64, 150, 300]){
  const a = abs.slice(0, n).join('\n\n'), b = abs.slice(0, n).map((p, i) => i % 3 === 0 ? p.replace(/\b(und|der|die)\b/, 'oder') : p).join('\n\n');   // eine überarbeitete Fassung: jeder dritte Absatz leicht geändert
  const t = performance.now(); const pa = materialParagraphs(a), pb = materialParagraphs(b), paare = alignParagraphs(pa, pb), t1 = performance.now(); const an = abgleich(paare), t2 = performance.now();
  console.log(`${n} Passagen (${a.length} Zeichen): materialParagraphs+alignParagraphs ${(t1 - t).toFixed(1)} ms, abgleich ${(t2 - t1).toFixed(1)} ms, zusammen ${(t2 - t).toFixed(1)} ms, Anteil ${an.toFixed(2)}`);
}
