// Nur lesen: baut Netz und Wuchs aus einer Testkette und prüft die neuen sichtbaren Texte (Faden-Marke, Familien) auf Kennungen.
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
const kette = process.argv[2] || 'kette-gewebe';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand, kurz, menschlich} = await import(ROOT + '/app/js/daten.js');
const {wuchs} = await import(ROOT + '/app/js/wuchs.js');
const B = bestand(JSON.parse(readFileSync(`${ROOT}/testdaten/${kette}/state.json`, 'utf8')));
const O = JSON.parse(readFileSync(ROOT + '/app/ordnung.json', 'utf8'));
const {Netz} = await import(ROOT + '/app/js/netz.js');
const N = new Netz(B, O);
const MUSTER = [
  ['Runden-Slug', /\b[a-z]+(?:-[a-z]+)+-20\d{6}\b/],
  ['UUID', /\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/i],
  ['Hash', /\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,}\b/i],
  ['Pfad', /\b[\w.-]+\/[\w./-]+\.(?:js|py|json|md|html|mjs|css)\b/],
  ['Ersatz', /\[(?:technische Kennung|Prüfsumme|lokaler Speicherort)\]/],
];
const pruefe = (wo, t) => { for(const [name, re] of MUSTER){ const m = t.match(re); if(m) console.log(`${wo} | ${name}: ${m[0]}\n    ${t}`); } };
// Faden-Marke wie bedienung.js:85-90 (gewählter Faden, Verbindung k)
console.log(`== ${kette}: ${N.faeden.length} Fäden, ${N.buendel.length} Bündel`);
N.faeden.forEach((f, fi) => { const A = B.monde[f.von], Bm = B.monde[f.nach];
  f.kanten.forEach((e, k) => { const u = e.usage, teile = [];
    if(f.kanten.length > 1) teile.push(`Verbindung ${k + 1} von ${f.kanten.length} · ←/→ wählt`);
    if(u){ const q = t => `„${kurz(menschlich(t), 50)}“`; if(u.from_part || u.to_part) teile.push([u.from_part && q(u.from_part), u.to_part && q(u.to_part)].filter(Boolean).join(' → ')); if(u.purpose) teile.push(kurz(menschlich(u.purpose), 80)); }
    pruefe(`Faden ${fi} (${kurz(A.titel,30)} → ${kurz(Bm.titel,30)}) Kante ${k + 1}`, teile.join(' · ')); }); });
// Familien: wuchs(m).familie, sichtbar in #familien (haupt.js:62-78) und in herkunftSatz (bedienung.js:113-116)
const fam = new Map();
for(const m of B.monde){ const W = wuchs(m); if(!W.familie.some(Boolean)) continue;
  const namen = new Map(); W.familie.forEach(f => { if(f) namen.set(f, (namen.get(f) || 0) + 1); });
  fam.set(m.titel, namen); }
for(const [t, namen] of fam){ console.log(`-- Familien in „${t}“: ${namen.size}`); for(const [f, n] of namen){ console.log(`   ${n}× ${JSON.stringify(f)}`); pruefe('Familie', f); } }
