// Nur lesend: Kosten von kandidaten()/teilenWortlaut und dem Vergleich im Leseraum, nachgebaut aus app/js/stoff.js (Stand 35c59bc).
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const KETTE = process.argv[2] || 'kette-gewebe';
globalThis.innerWidth = 800; globalThis.innerHeight = 600;
const {bestand, menschlich} = await import(ROOT + '/app/js/daten.js');
const {materialParagraphs, alignParagraphs, appSource} = await import(ROOT + '/app/js/materialraum.js');
const {wuchs} = await import(ROOT + '/app/js/wuchs.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${KETTE}/state.json`, 'utf8')));

// --- wörtlich aus stoff.js übernommen (nur Logik, ohne DOM)
const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
const zeige = t => menschlich(t)
  .replace(/\b[a-z]+(?:-[a-z]+)+-(20\d{2})(\d{2})(\d{2})\b/g, (_, y, mo, d) => `Runde vom ${Number(d)}. ${MON[Number(mo) - 1] || ''}`.trim())
  .replace(/(?:Library\/)?Mobile Documents\/[^\s<>"'`)\]]+/g, x => x.split(/[\/:]/).filter(Boolean).pop() || '[Ablage]');
const istSeite = f => /^<!doctype html>/i.test(String((f && f.content) || '').trimStart());
let woerterVon = new WeakMap();
function woerter(v){ let w = woerterVon.get(v); if(w) return w;
  const t = typeof v.content === 'string' ? v.content : v.content == null ? '' : JSON.stringify(v.content);
  w = new Set((t.toLocaleLowerCase('de').match(/[\p{L}\p{N}]+/gu) || []).filter(x => x.length > 1)); woerterVon.set(v, w); return w; }
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
function abgleich(paare){ const zeichen = s => s.replace(/\s+/g, '').length, wv = new Map(); let gemein = 0, alle = 0;
  for(const p of paare){ const a = p.a ? zeige(p.a.text) : '', b = p.b ? zeige(p.b.text) : ''; alle += zeichen(a) + zeichen(b);
    if(!p.a || !p.b) continue; if(p.a.text === p.b.text){ gemein += zeichen(a) + zeichen(b); continue; }
    const v = wortVergleich(a, b); wv.set(p, v); if(v.grob === 'keiner'){ gemein += (p.score || 0) * (zeichen(a) + zeichen(b)); continue; }
    v.A.forEach((t, i) => { if(v.ka.has(i)) gemein += zeichen(t); }); v.Bt.forEach((t, i) => { if(v.kb.has(i)) gemein += zeichen(t); }); }
  return {anteil: alle ? gemein / alle : 0, wv}; }
function kaumGemeinsam(paare, anteil){ const gepaart = paare.filter(p => p.a && p.b).length; return !paare.length || anteil < 0.2 || (gepaart < 0.2 * paare.length && anteil < 0.35); }
let geteilt = new WeakMap(), rechnungen = 0;
function teilenWortlaut(a, b){ let mit = geteilt.get(a); if(!mit) geteilt.set(a, mit = new WeakMap()); if(mit.has(b)) return mit.get(b);
  let ja = false; rechnungen++;
  if(wortAnteil(a, b) >= 0.1){ const paare = alignParagraphs(materialParagraphs(a.content), materialParagraphs(b.content)); ja = !kaumGemeinsam(paare, abgleich(paare).anteil); }
  mit.set(b, ja); return ja; }
function kandidaten(z, Wu){
  const v = z.v, m = z.mond, out = new Map(), lesbar = f => f && f.id !== v.id && !istSeite(f);
  const dazu = (id, wie) => { const f = B.fassungen.get(id); if(!out.has(id) && lesbar(f)) out.set(id, {id, wie, f}); };
  const kanten = [];
  for(const e of B.roh.edges){ const raus = e.from_variant_id === v.id; if(!raus && e.to_variant_id !== v.id) continue;
    const id = raus ? e.to_variant_id : e.from_variant_id, f = B.fassungen.get(id); if(!lesbar(f)) continue;
    kanten.push({id, wie: 'k', hier: B.werkVon(id) === m.id ? 1 : 0, w: wortAnteil(v, f)}); }
  kanten.sort((a, b) => (b.hier - a.hier) || (b.w - a.w)); for(const k of kanten) dazu(k.id, k.wie);
  const i = z.si;
  if(i >= 0){ const p = Wu.eltern[i], art = Wu.art[i];
    if(p >= 0){ const f = m.samen[p].fassung; if(art !== 'kette' && art !== 'reihe') dazu(m.samen[p].id, 'fortgesetzt aus'); else if(f && teilenWortlaut(v, f)) dazu(m.samen[p].id, 'Vorgängerin'); }
    const zw = Wu.zweige[Wu.zweigVon[i]], k = zw.indexOf(i);
    if(k > 0){ const f = m.samen[zw[k - 1]].fassung; if(f && !out.has(f.id) && teilenWortlaut(v, f)) dazu(f.id, 'Vorgängerin'); } }
  for(const id of ((v.contribution || {}).seen_variant_ids || [])) dazu(id, 'gelesen');
  const alle = [...out.values()], teilt = new Set(alle.slice(0, 24).filter(k => teilenWortlaut(v, k.f)));
  return [...alle.filter(k => teilt.has(k)), ...alle.filter(k => !teilt.has(k))].map(({id, wie}) => ({id, wie}));
}
// --- Messung je Fassung, kalter Speicher (wie nach jedem Auffrischen: neue Objekte)
const erg = [];
for(const m of B.monde){ if(!m.samen.length) continue; const Wu = wuchs(m);
  for(let si = 0; si < m.samen.length; si++){ const v = m.samen[si].fassung; if(!v || istSeite(v)) continue;
    woerterVon = new WeakMap(); geteilt = new WeakMap(); rechnungen = 0;
    const z = {v, mond: m, si}; let t = performance.now(); const liste = kandidaten(z, Wu); const tK = performance.now() - t, rK = rechnungen;
    // Vergleichen geklickt: vorschlag = erste; dann baueVergleich: Abgleich des Paars; bei „kaum gemeinsam“ baueRuhig: teilenWortlaut über ALLE Kandidaten
    let tV = 0, tR = 0, ruhig = false, rR = 0;
    if(liste.length){ const o = B.fassungen.get(liste[0].id); t = performance.now();
      const hierA = materialParagraphs(v.content), dortA = materialParagraphs(o.content), paare = alignParagraphs(hierA, dortA), {anteil} = abgleich(paare); tV = performance.now() - t;
      if(kaumGemeinsam(paare, anteil)){ ruhig = true; rechnungen = 0; t = performance.now(); kandidaten(z, Wu).filter(k => k.id !== o.id && teilenWortlaut(v, B.fassungen.get(k.id))).slice(0, 4); tR = performance.now() - t; rR = rechnungen; } }
    const P = materialParagraphs(v.content).length;
    erg.push({titel: m.titel.slice(0, 34), label: String(v.label).slice(0, 40), laenge: String(v.content || '').length, P, kand: liste.length, rK, tK, tV, tR, rR, ruhig});
  } }
erg.sort((a, b) => (b.tK + b.tV + b.tR) - (a.tK + a.tV + a.tR));
console.log(`Kette ${KETTE}: ${erg.length} Fassungen gemessen. Die teuersten (kalt):`);
for(const e of erg.slice(0, 12)) console.log(`${e.titel.padEnd(34)} | ${e.label.padEnd(40)} | ${String(e.laenge).padStart(7)} Z, ${String(e.P).padStart(4)} Pass. | Kand. ${String(e.kand).padStart(3)}, teilenWortlaut ${e.rK}× | kandidaten ${e.tK.toFixed(1)} ms | Paar-Abgleich ${e.tV.toFixed(1)} ms | ruhig ${e.ruhig ? `${e.tR.toFixed(1)} ms (${e.rR}× neu)` : '-'}`);
const summe = e => e.tK + e.tV + e.tR; console.log('Summe Klick „Vergleichen“ > 50 ms:', erg.filter(e => summe(e) > 50).length, '; > 100 ms:', erg.filter(e => summe(e) > 100).length);
