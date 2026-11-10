import {landschaft, e, juengste} from './landschaft-hilfe.js';
import {mengenWort} from './inhalt.js';

export const legende = '<p>Der Campus ist ein Lageplan des Bestands: Orte bilden Flügel, Apps und Werke öffnen ihre Räume. Die Beschriftung zeigt, was wirklich darin liegt; Bilder stammen aus den zugehörigen Fassungen.</p><p>Ein Raum führt zu seinen Unterräumen. Alle Fassungen eines Werks liegen anschließend gemeinsam im Arbeitsraum. Die Auswahl bleibt beim Wechsel der Ansicht erhalten.</p>';

export function starte(el, K){
  return landschaft(el, K, 'campus', 'Campus', 'Ein Lageplan des Werks. Vom gemeinsamen Ort bis zum offenen Arbeitsraum.', (q, S) => {
    const p = e('div', 'campus-plan');
    const kinder = q.kinder || [];
    if(kinder.every(c => !c.kinder)){
      const raum = e('section', 'campus-arbeitsraum');
      raum.append(e('h2', '', 'Arbeitsraum · alle Fassungen'));
      const tisch = e('div', 'campus-tisch');
      for(const f of kinder) tisch.append(S.material(f));
      raum.append(tisch); p.append(raum); return p;
    }
    const orientierung = e('nav', 'campus-verzeichnis'); orientierung.setAttribute('aria-label', 'Räume im Lageplan');
    for(const c of kinder) orientierung.append(S.knopf(c, 'campus-weg', c.name));
    p.append(orientierung);
    for(const c of kinder){
      const fluegel = e('section', 'campus-fluegel');
      const eingang = S.knopf(c, 'campus-eingang');
      eingang.append(e('span', 'campus-raumart', c.kinder ? 'Raum betreten' : 'Gespräch'), e('span', 'campus-raumname', c.name), e('span', 'campus-raummenge', c.kinder ? mengenWort(c) : 'Wortlaut lesen'));
      fluegel.append(eingang);
      const werkraum = e('div', 'campus-werkraum');
      if(c.kinder){
        const material = juengste(c, 2, true), auslage = e('div', 'campus-auslage');
        for(const f of material) auslage.append(S.material(f));
        werkraum.append(auslage);
        const tueren = e('div', 'campus-tueren');
        for(const z of c.kinder.slice(0, 5)) tueren.append(S.textknopf(z));
        if(c.kinder.length > 5) tueren.append(S.knopf(c, 'campus-alle', `Alle ${c.kinder.length} Bereiche öffnen →`));
        werkraum.append(tueren);
      } else werkraum.append(S.material(c));
      fluegel.append(werkraum); p.append(fluegel);
    }
    return p;
  });
}
