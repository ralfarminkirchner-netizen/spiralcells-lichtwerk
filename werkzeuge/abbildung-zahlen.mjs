// Druckt die Kennzahlen je Mond, berechnet mit genau dem Datenmodul der Oberfläche.
import {bestand, STIMMEN} from '../app/js/daten.js';
const url = process.argv[2] || 'http://127.0.0.1:8401/api/graph';
const g = await (await fetch(url)).json();
const b = bestand(g);
const rows = b.monde.map(m => ({titel:m.titel.slice(0,46), art:m.art, keim:m.keim.length, samen:m.samen.length, stimmen:m.stimmen.map(i=>STIMMEN[i].name[0]).join(''), kopplung:m.kopplung.toFixed(2), winkel:m.winkel==null?"—":m.winkel.toFixed(2), reife:m.reife, faeden:m.faeden.length, aussen:m.aussen.length, befunde:m.befunde.length, traum:m.traumfeld?'ja':''}));
const reife = {}; for(const m of b.monde) reife[m.reife]=(reife[m.reife]||0)+1;
console.log('Monde', b.monde.length, 'Reife', JSON.stringify(reife), 'Traumfelder', b.monde.filter(m=>m.traumfeld).length, 'mit Stimmen', b.monde.filter(m=>m.stimmen.length).length, 'Mensch-Agent', b.mensch? 'ja':'nein');
for(const r of rows.filter(r=>r.stimmen || r.faeden || r.befunde)) console.log(Object.values(r).join(' | '));
const z = b.monde.find(m=>m.titel.startsWith('Zentrale'));
console.log('\nZENTRALE keim:', z.keim.map(v=>v.label).join(' / '), '| keimKristall', z.keimKristall);
console.log('zweige', JSON.stringify(z.zweige.map((x,i)=>({stimme:STIMMEN[i].name,...x}))));
console.log('paare', JSON.stringify(z.paare.map(([i,j])=>STIMMEN[i].name+'→'+STIMMEN[j].name)));
