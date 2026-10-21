import {readFileSync} from 'node:fs';
const R = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(R + 'app/js/daten.js');
const {Netz} = await import(R + 'app/js/netz.js');
const ank = await import(R + 'app/js/ankunft.js');
const welche = process.argv[2] || 'kette-gewebe';
const B = bestand(JSON.parse(readFileSync(R + 'testdaten/' + welche + '/state.json', 'utf8')));
const O = JSON.parse(readFileSync(R + 'app/ordnung.json', 'utf8'));
const N = new Netz(B, O);
const bn = b => b === 'mitte' ? 'Zentrale' : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
const iso = t => t ? new Date(t).toISOString() : '-';
// Startwerk ohne Merker und ohne Neues: jüngster Mond mit Stimmen nach zeitspanne[1]
let best = -1, bt = -1; B.monde.forEach((m, j) => { if(m.stimmen.length && m.zeitspanne[1] > bt){ bt = m.zeitspanne[1]; best = j; } });
console.log('STARTWERK (ohne Merker):', B.monde[best].titel, bn(N.bezirk(best)), iso(bt));
const z = ank.letzte(B);
console.log('ZULETZT:'); for(const e of z) console.log('  ', e.titel, '|', e.label, '|', e.wann, '| stimme', e.stimme);
const zm = [...new Set(z.map(e => e.mondId))];
for(const id of zm){ const i = B.monde.findIndex(m => m.id === id), m = B.monde[i];
  console.log('ZULETZT-WERK', m.titel, '| Bezirk', bn(N.bezirk(i)), '| juengst', N.juengst.has(i), '| traumfeld', m.traumfeld, '| zeitspanne1', iso(m.zeitspanne[1])); }
console.log('JUENGST je Bezirk:');
for(const i of N.juengst) console.log('  ', bn(N.bezirk(i)), ':', B.monde[i].titel, iso(B.monde[i].zeitspanne[1]), 'hat zuletzt?', zm.includes(B.monde[i].id));
// Kanonische (Gold) Werke und ob sie im Überblick ihren Ring behalten
const kan = B.monde.map((m, i) => [m, i]).filter(([m, i]) => m.reife === 'kanonisch' && !N.baum.material.has(i));
console.log('KANONISCH:', kan.length); for(const [m, i] of kan) console.log('  ', m.titel, bn(N.bezirk(i)), 'juengst', N.juengst.has(i), 'traumfeld', m.traumfeld);
// Was trägt zeitspanne[1] des juengst-Werks: Ralfs Einträge oder Formen?
for(const i of N.juengst){ const m = B.monde[i]; const fs = B.roh.variants.filter(v => B.werkVon(v.id) === m.id);
  const top = fs.map(v => ({t: Date.parse(v.created_at), mensch: B.stimmeDer(v.id), form: B.formen && B.formen.has(v.id), label: v.label})).sort((a, b) => b.t - a.t)[0];
  if(top) console.log('  juengst-Treiber', m.titel, iso(top.t), 'stimme', top.mensch, 'form', top.form); }
