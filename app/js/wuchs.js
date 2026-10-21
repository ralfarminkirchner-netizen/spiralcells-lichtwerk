/* =====================================================================
   WUCHS — die innere Gestalt eines Monds aus seiner belegten Abstammung.
   Jede Ausprägung hängt dort, wo sie herkommt:
     Kette  an ihrer Vorgängerin im selben Zweig (derived_from),
     Gabel  an der Fassung eines anderen Zweigs, aus der ihr Zweig fortgesetzt wurde
            (Kante „erweitert“ oder „remixt-aus“ von ihr zur Quelle),
     Keim   am Rundenbriefing oder an einer Fassung der Ausgangsfrage,
     Form   an ihrem Original,
     frei   ohne belegte Herkunft: sie beginnt mit Abstand zum Keim, ohne Stiel,
     Reihe  derived_from aus einer technischen Übernahme: Reihenfolge des Imports, keine Entwicklung.
   Daraus wachsen Ranken (Ketten), Gabeln und Fächer (eine Fassung, viele Kinder).
   Gegenlese (gesehene Fassungen anderer Zweige) bleibt Gewebe, nie Abstammung.
   Rechnet nur, speichert nichts, erfindet keine Herkunft. Läuft im Browser und in Node.
   ===================================================================== */
import {MENSCH, QUELLE} from './daten.js';

const DEG = Math.PI / 180, SPEICHE = 144 * DEG;
export const KEIM = -1, FREI = -2;
const HERKUNFT = ['erweitert', 'remixt-aus'];   // so legt SPiRALCELLS das Abzweigen an (store.create_variant_branch)

/* Wohin eine Ausprägung gehört: Stimme 0–4, 'mensch' oder 'quelle' */
export const gruppeVon = s => typeof s.stimme === 'number' ? s.stimme : s.stimme === MENSCH ? 'mensch' : 'quelle';

export function wuchs(m, opt = {}){
  const sam = m.samen, n = sam.length;
  const masse = opt.masse || sam.map(s => s.form ? 1 : 1 + Math.sqrt(Math.max(1, s.laenge)) / 40);
  const idx = new Map(sam.map((s, i) => [s.id, i])), keimIds = new Set(m.keim.map(v => v.id));
  const eltern = new Int32Array(n).fill(FREI), art = new Array(n).fill('frei');

  // Kette, Form, Keim über derived_from
  for(let i = 0; i < n; i++){
    const s = sam[i], d = (s.fassung || {}).derived_from;
    if(s.form){ const o = idx.get(s.original); if(o != null && o < i){ eltern[i] = o; art[i] = 'form'; continue; } }
    if(d && idx.has(d) && idx.get(d) < i){ const p = idx.get(d); eltern[i] = p; art[i] = s.stimme === QUELLE && sam[p].stimme === QUELLE ? 'reihe' : 'kette'; continue; }
    if(d && keimIds.has(d)){ eltern[i] = KEIM; art[i] = 'keim'; }
  }
  // Gabel: die Wurzel eines Zweigs, fortgesetzt aus einer früheren Fassung dieses Monds; „erweitert“ vor „remixt-aus“, dann die älteste Kante
  const gabel = new Map();
  for(const f of m.faeden || []){
    if(!HERKUNFT.includes(f.typ) || f.form) continue;
    const c = idx.get(f.von); if(c == null || art[c] !== 'frei') continue;
    const q = idx.has(f.nach) ? idx.get(f.nach) : keimIds.has(f.nach) ? KEIM : null;
    if(q == null || (q >= 0 && q >= c)) continue;
    const rang = HERKUNFT.indexOf(f.typ), t = Date.parse((f.kante || {}).created_at) || 0, alt = gabel.get(c);
    if(!alt || rang < alt[0] || (rang === alt[0] && t < alt[2])) gabel.set(c, [rang, q, t]);
  }
  for(const [c, [, q]] of gabel){ eltern[c] = q; art[c] = q === KEIM ? 'keim' : 'gabel'; }
  // Rundenbriefing: ein unabhängiger Erstbeitrag beginnt an der Ausgangsfrage
  for(let i = 0; i < n; i++){ if(art[i] !== 'frei') continue;
    const rc = (((sam[i].fassung || {}).contribution) || {}).round_context;
    if(rc && keimIds.has(rc.source_variant_id)){ eltern[i] = KEIM; art[i] = 'keim'; } }

  const kinder = Array.from({length: n}, () => []), wurzeln = [];
  for(let i = 0; i < n; i++){ const p = eltern[i]; if(p >= 0) kinder[p].push(i); else wurzeln.push(i); }

  // Breite eines Teilbaums: seine Blätter. Sie bestimmt den Fächerwinkel, nicht die Textmenge.
  const breite = new Float64Array(n), tiefe = new Int32Array(n);
  for(let i = n - 1; i >= 0; i--){ let b = 0; for(const k of kinder[i]) b += breite[k]; breite[i] = Math.max(1, b); }
  for(let i = 0; i < n; i++) tiefe[i] = eltern[i] >= 0 ? tiefe[eltern[i]] + 1 : 0;
  // Weg vom Keim nach außen, in Masse: Kinder beginnen am Ende ihrer Eltern
  const s0 = new Float64Array(n), s1 = new Float64Array(n);
  for(let i = 0; i < n; i++){ const p = eltern[i];
    s0[i] = p >= 0 ? s1[p] + 0.15 : art[i] === 'frei' ? 0.9 : 0.3; s1[i] = s0[i] + masse[i]; }

  // Sektoren: jede Stimme behält ihre Speiche (L·144°); Quellen und Ralf nehmen freie Speichen, sonst die Mitte dazwischen
  const gruppen = new Map();
  for(const r of wurzeln){ const k = gruppeVon(sam[r]); if(!gruppen.has(k)) gruppen.set(k, []); gruppen.get(k).push(r); }
  const gw = k => gruppen.get(k).reduce((a, r) => a + breite[r], 0);
  const sektoren = new Map(), stimmen = [...gruppen.keys()].filter(k => typeof k === 'number'), andere = [...gruppen.keys()].filter(k => typeof k !== 'number').sort((a, b) => gw(b) - gw(a));
  if(stimmen.length){
    const frei = [0, 1, 2, 3, 4].filter(L => !gruppen.has(L)), halb = andere.length > frei.length, b = (halb ? 36 : 68) * DEG;
    for(const L of stimmen) sektoren.set(L, {mitte: L * SPEICHE, breite: b});
    andere.forEach((k, j) => { const mitte = j < frei.length ? frei[j] * SPEICHE : ((j - frei.length) * 2 + 0.5) * 72 * DEG; sektoren.set(k, {mitte, breite: b}); });
  } else if(andere.length){
    const ws = andere.map(k => Math.max(0.2, Math.pow(gw(k), 0.6))), W = ws.reduce((a, x) => a + x, 0); let a = -Math.PI / 2;
    andere.forEach((k, j) => { const brt = 2 * Math.PI * ws[j] / W; sektoren.set(k, {mitte: a + brt / 2, breite: brt * 0.94}); a += brt; });
  }

  // Fächer: die Hauptlinie (Kette mit dem breitesten Teilbaum) bleibt in der Mitte, Abzweige wechseln rechts und links
  const th0 = new Float64Array(n), th1 = new Float64Array(n), MAXF = 200 * DEG;
  const verteile = (knoten, a0, a1, start) => {
    if(!knoten.length) return;
    const w = k => Math.pow(breite[k], 0.75), W = knoten.reduce((a, k) => a + w(k), 0), mitte = (a0 + a1) / 2, spann = a1 - a0;
    const linie = k => art[k] === 'kette' || art[k] === 'reihe';
    let haupt = knoten[0]; for(const k of knoten) if(linie(k) > linie(haupt) || (linie(k) === linie(haupt) && breite[k] > breite[haupt])) haupt = k;
    const lage = new Map(), dh = spann * w(haupt) / W; lage.set(haupt, [mitte - dh / 2, mitte + dh / 2]);
    let rechts = mitte + dh / 2, links = mitte - dh / 2, seite = 1;
    for(const k of knoten){ if(k === haupt) continue; const d = spann * w(k) / W;
      if(seite > 0){ lage.set(k, [rechts, rechts + d]); rechts += d; } else { lage.set(k, [links - d, links]); links -= d; } seite = -seite; }
    // Die Hauptlinie bleibt gerade; ungleiche Seiten dürfen über den eigenen Keil hinausragen
    for(const k of knoten){ let [b0, b1] = lage.get(k);
      const rand = (b1 - b0) * 0.04, c = (b0 + b1) / 2; b0 += rand; b1 -= rand;
      if(b1 - b0 > MAXF){ b0 = c - MAXF / 2; b1 = c + MAXF / 2; }
      th0[k] = start == null ? c : start; th1[k] = c;
      verteile(kinder[k], b0, b1, c); }
  };
  for(const [k, sek] of sektoren) verteile(gruppen.get(k), sek.mitte - sek.breite / 2, sek.mitte + sek.breite / 2, null);

  // Gegenlese: gesehene Fassungen anderer Zweige, ohne die eigene Herkunft
  const lese = [];
  for(let i = 0; i < n; i++){ if(sam[i].form) continue;
    const gesehen = (((sam[i].fassung || {}).contribution) || {}).seen_variant_ids || [], doppelt = new Set();
    for(const id of gesehen){ const j = idx.get(id); if(j == null || j === i || j === eltern[i] || sam[j].baum === sam[i].baum || doppelt.has(j)) continue; doppelt.add(j); lese.push([i, j]); } }

  // Zweige (worktrees) in Reihenfolge ihrer ersten Fassung; Stelle jeder Fassung darin
  const proBaum = new Map(); sam.forEach((s, i) => { if(!proBaum.has(s.baum)) proBaum.set(s.baum, []); proBaum.get(s.baum).push(i); });
  const zweige = [...proBaum.values()], zweigVon = new Int32Array(n), reihe = new Int32Array(n);
  zweige.forEach((arr, z) => arr.forEach((i, j) => { zweigVon[i] = z; reihe[i] = j + 1; }));

  return {n, eltern, art, kinder, wurzeln, breite, tiefe, s0, s1, th0, th1, sektoren, lese, zweige, zweigVon, reihe, masse};
}

/* Weg vom Keim bis zu einer Ausprägung (ohne Keim) */
export function ahnen(W, i){ const out = []; for(let k = i; k >= 0; k = W.eltern[k]) out.push(k); return out.reverse(); }
/* Alle Nachkommen einer Ausprägung */
export function nachkommen(W, i){ const out = [], st = [...W.kinder[i]]; while(st.length){ const k = st.pop(); out.push(k); st.push(...W.kinder[k]); } return out; }

/* Radius nach Rang: gleiche Fläche je Korn, Gleichstände auf denselben Radius (ein Fächer wird ein Bogen) */
export function rangRadien(werte){
  const N = werte.length, ord = Array.from({length: N}, (_, i) => i).sort((a, b) => werte[a] - werte[b]), r = new Float32Array(N);
  for(let a = 0; a < N;){ let b = a; while(b + 1 < N && Math.abs(werte[ord[b + 1]] - werte[ord[a]]) < 1e-9) b++;
    const f = Math.sqrt(((a + b) / 2 + 0.5) / Math.max(1, N)); for(let k = a; k <= b; k++) r[ord[k]] = f; a = b + 1; }
  return r;
}

/* Eine Kurve von der Elternrichtung zur eigenen: sanft aus der Gabel heraus */
export const biege = (a, b, t) => { const e = t * t * (3 - 2 * t); return a + (b - a) * e; };
