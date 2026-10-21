// Nur lesend: Gegenüber-Wahl und „kaum Wortlaut“ für den Befund aus gewebe2-09 nachrechnen.
import {readFileSync} from 'node:fs';
const APP = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/app/js/';
const {materialParagraphs, alignParagraphs} = await import(APP + 'materialraum.js');
const {menschlich} = await import(APP + 'daten.js');
const datei = process.argv[2] || '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json';
const S = JSON.parse(readFileSync(datei, 'utf8'));
const V = new Map(S.variants.map(v => [v.id, v]));
const WT = new Map(S.worktrees.map(w => [w.id, w]));
const werkVon = id => { const v = V.get(id); return v && WT.get(v.worktree_id) ? WT.get(v.worktree_id).work_id : null; };

// wörtlich aus stoff.js (Z. 60–63, 111–147, 347–361)
const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
const zeige = t => menschlich(t)
  .replace(/\b[a-z]+(?:-[a-z]+)+-(20\d{2})(\d{2})(\d{2})\b/g, (_, y, mo, d) => `Runde vom ${Number(d)}. ${MON[Number(mo) - 1] || ''}`.trim())
  .replace(/(?:Library\/)?Mobile Documents\/[^\s<>"'`)\]]+/g, x => x.split(/[\/:]/).filter(Boolean).pop() || '[Ablage]');
function woerter(v){ const t = typeof v.content === 'string' ? v.content : v.content == null ? '' : JSON.stringify(v.content);
  return new Set((t.toLocaleLowerCase('de').match(/[\p{L}\p{N}]+/gu) || []).filter(x => x.length > 1)); }
function wortAnteil(a, b){ const A = woerter(a), Bw = woerter(b); if(!A.size || !Bw.size) return 0;
  const [klein, gross] = A.size < Bw.size ? [A, Bw] : [Bw, A]; let n = 0; for(const w of klein) if(gross.has(w)) n++; return 2 * n / (A.size + Bw.size); }
function lcs(A, Bt){ if(A.length * Bt.length > 90000) return null;
  const ka = new Set(), kb = new Set(), w = Bt.length + 1, dp = new Uint32Array((A.length + 1) * w);
  for(let i = A.length - 1; i >= 0; i--) for(let j = Bt.length - 1; j >= 0; j--) dp[i * w + j] = A[i] === Bt[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
  let i = 0, j = 0; while(i < A.length && j < Bt.length){ if(A[i] === Bt[j]){ ka.add(i++); kb.add(j++); } else if(dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++; else j++; }
  return {ka, kb}; }
function wortVergleich(a, b){ let A = a.match(/\s+|[^\s]+/g) || [], Bt = b.match(/\s+|[^\s]+/g) || [], k = lcs(A, Bt);
  if(k) return {A, Bt, ...k, grob: null}; A = a.split(/(\n)/); Bt = b.split(/(\n)/); k = lcs(A, Bt);
  if(k) return {A, Bt, ...k, grob: 'zeilen'}; return {A: [a], Bt: [b], ka: new Set([0]), kb: new Set([0]), grob: 'keiner'}; }
function abgleich(paare){ const zeichen = s => s.replace(/\s+/g, '').length; let gemein = 0, alle = 0;
  for(const p of paare){ const a = p.a ? zeige(p.a.text) : '', b = p.b ? zeige(p.b.text) : ''; alle += zeichen(a) + zeichen(b);
    if(!p.a || !p.b) continue; if(p.a.text === p.b.text){ gemein += zeichen(a) + zeichen(b); continue; }
    const v = wortVergleich(a, b); if(v.grob === 'keiner'){ gemein += (p.score || 0) * (zeichen(a) + zeichen(b)); continue; }
    v.A.forEach((t, i) => { if(v.ka.has(i)) gemein += zeichen(t); }); v.Bt.forEach((t, i) => { if(v.kb.has(i)) gemein += zeichen(t); }); }
  return {anteil: alle ? gemein / alle : 0}; }
function kaumGemeinsam(paare, anteil){ const gepaart = paare.filter(p => p.a && p.b).length;
  return !paare.length || anteil < 0.2 || (gepaart < 0.2 * paare.length && anteil < 0.35); }
function pruefe(a, b){ const w = wortAnteil(a, b); const paare = alignParagraphs(materialParagraphs(a.content), materialParagraphs(b.content));
  const {anteil} = abgleich(paare); const gepaart = paare.filter(p => p.a && p.b).length;
  return {w: +w.toFixed(3), anteil: +anteil.toFixed(3), paare: paare.length, gepaart, teilt: w >= 0.1 && !kaumGemeinsam(paare, anteil)}; }

const v = S.variants.find(x => x.label.startsWith('Befund · Zeitspirale ist die Lebenserschließung'));
console.log('Befund:', v.label, '| derived_from:', V.get(v.derived_from)?.label);
const kanten = [];
for(const e of S.edges){ const raus = e.from_variant_id === v.id; if(!raus && e.to_variant_id !== v.id) continue;
  const id = raus ? e.to_variant_id : e.from_variant_id, f = V.get(id);
  kanten.push({label: f.label.slice(0, 60), typ: e.edge_type, raus, usage: !!e.usage, hier: werkVon(id) === werkVon(v.id) ? 1 : 0, ...pruefe(v, f)}); }
kanten.sort((a, b) => (b.hier - a.hier) || (b.w - a.w));
console.table(kanten);
const vor = V.get(v.derived_from); if(vor) console.log('Vorgängerin', vor.label.slice(0, 60), pruefe(v, vor));
// Wo steht „Antwort“ im Zweig? (Zweig = worktree, nach Zeit)
const zw = S.variants.filter(x => x.worktree_id === v.worktree_id).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
console.log('Varianten im Worktree:', zw.length);
zw.forEach((x, i) => console.log(String(i + 1).padStart(2), x.label.slice(0, 70)));
