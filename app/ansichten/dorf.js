import {landschaft, e} from './landschaft-hilfe.js';
import {mengenWort} from './inhalt.js';

export const legende = '<p>Orte bilden Nachbarschaften. Apps und Werke stehen an ihrer gemeinsamen Straße. Die Fronten zeigen Bilder aus dem jeweiligen Bestand; Namen führen weiter ins Haus.</p><p>Die Nachbarschaft ist eine andere Anordnung desselben Inhalts. Ein Werk an mehreren Orten behält seine Identität. Erst wählen, dann eine Fassung erneut antippen, um sie zu öffnen.</p>';

export function starte(el, K){
  return landschaft(el, K, 'dorf', 'Dorf', 'Eine gemeinsame Straße. Viele eigene Werkstätten.', (q, S) => {
    const d = e('div', 'dorf-plan');
    d.append(e('div', 'dorf-strasse'));
    const kinder = q.kinder || [];
    if(kinder.every(c => !c.kinder)){
      d.classList.add('dorf-werkstatt');
      const front = e('section', 'dorf-offenes-haus');
      front.append(e('h2', '', 'In dieser Werkstatt'));
      const auslage = e('div', 'dorf-auslage');
      for(const f of kinder) auslage.append(S.material(f));
      front.append(auslage); d.append(front); return d;
    }
    for(const c of kinder){
      const quartier = e('section', 'dorf-quartier');
      const wegweiser = S.knopf(c, 'dorf-wegweiser');
      wegweiser.append(e('span', 'dorf-ort', c.name), e('span', 'dorf-menge', c.kinder ? mengenWort(c) : 'Gespräch'));
      quartier.append(wegweiser);
      const haeuser = e('div', 'dorf-haeuser');
      const nachbarn = c.kinder?.length ? c.kinder.slice(0, 6) : [c];
      for(const n of nachbarn){
        const haus = S.knopf(n, 'dorf-haus');
        haus.append(S.bild(n, 'dorf-front'), e('span', 'dorf-haustitel', n.name), e('span', 'dorf-hausart', n.kinder ? mengenWort(n) : 'Fassung wählen'));
        haeuser.append(haus);
      }
      quartier.append(haeuser);
      if(c.kinder) quartier.append(S.knopf(c, 'dorf-eintreten', c.kinder.length > 6 ? `Alle ${c.kinder.length} Orte im Haus →` : 'Dieses Haus betreten →'));
      d.append(quartier);
    }
    return d;
  });
}
