/* Ein Inhalt, viele Ansichten (Ralf, 09.11.2026: „Der Baum sollte nur eine Ansicht sein. Die anderen soll es nach wie
   vor geben … Umschaltbar ohne etwas zu verändern am Inhalt. Nur die Darstellung.“)

   Dieselbe Leiste auf jeder Seite: Baum, die Welten (Kosmos, Garten, Galaxie, Dorf, Campus, Büro) und Zelle und Text.
   Mitgenommen wird nur, welches Werk gewählt ist (#werk=<lesbarer Name>, wie auswahl.js). Nichts wird umgerechnet. */
import {mitWerk, werkAus} from './auswahl.js';

export const ANSICHTEN = [
  {k: 'baum', name: 'Baum', seite: 'stufen.html'},
  {k: 'kosmos', name: 'Kosmos', seite: 'welten.html?welt=kosmos'},
  {k: 'garten', name: 'Garten', seite: 'welten.html?welt=garten'},
  {k: 'galaxie', name: 'Galaxie', seite: 'welten.html?welt=galaxie'},
  {k: 'dorf', name: 'Dorf', seite: 'welten.html?welt=dorf'},
  {k: 'campus', name: 'Campus', seite: 'welten.html?welt=campus'},
  {k: 'buero', name: 'Büro', seite: 'welten.html?welt=buero'},
  {k: 'zelle', name: 'Zelle und Text', seite: 'index.html'},
];

export const ziel = (a, werk) => a.seite + mitWerk('', werk);

/* Baut die Leiste als Links. werk(): der lesbare Name des gewählten Werks oder null; er wird erst beim Antippen
   gelesen, damit immer das Werk mitgeht, das gerade gewählt ist. Seiten, die hier nicht ausgeliefert werden
   (im Netz liegt nur der Baum), bleiben weg statt ins Leere zu führen. */
export function leiste(el, jetzt, werk = () => werkAus(location.hash)){
  el.textContent = '';
  for(const a of ANSICHTEN){
    const l = document.createElement('a'); l.textContent = a.name; l.href = a.seite; l.dataset.k = a.k;
    if(a.k === jetzt) l.setAttribute('aria-current', 'page');
    l.addEventListener('click', () => { l.href = ziel(a, werk()); });
    el.append(l);
  }
  const seiten = [...new Set(ANSICHTEN.filter(a => a.k !== jetzt).map(a => a.seite.split('?')[0]))];
  for(const s of seiten) fetch(s, {method: 'HEAD'}).then(r => { if(!r.ok) throw 0; }).catch(() => {
    for(const l of el.querySelectorAll('a')) if(l.getAttribute('href').split(/[?#]/)[0] === s) l.remove(); });
  return el;
}
