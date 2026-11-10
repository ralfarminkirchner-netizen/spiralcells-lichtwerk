import {landschaft, e, juengste} from './landschaft-hilfe.js';
import {mengenWort} from './inhalt.js';

export const legende = '<p>Der Garten verzweigt sich vom Ort zum Werk. Jedes Beet trägt seinen wirklichen Namen. Die jüngste datierte Fassung steht zuerst; daneben liegen Bilder aus dem Bestand. Fassungen ohne Datum bleiben im jeweiligen Werk erreichbar.</p><p>Ein Tipp betritt ein Beet oder wählt eine Fassung. Ein weiterer Tipp öffnet ihren Wortlaut und ihre Bilder. „Ohne Bild“ bezeichnet vorhandenes Material ohne Abbildung.</p>';

export function starte(el, K){
  return landschaft(el, K, 'garten', 'Garten', 'Verzweigte Beete. Was gewachsen ist, liegt an seinem Ort.', (q, S) => {
    const g = e('div', 'garten-wege');
    const kinder = q.kinder || [];
    if(kinder.every(c => !c.kinder)){
      g.classList.add('garten-fassungen');
      const beet = e('section', 'garten-ernte');
      beet.append(e('h2', '', 'Die Fassungen dieses Werks'));
      const reihe = e('div', 'garten-auslage');
      for(const f of kinder) reihe.append(S.material(f));
      beet.append(reihe); g.append(beet); return g;
    }
    for(const c of kinder){
      const beet = e('section', 'garten-beet');
      const schild = S.knopf(c, 'garten-schild');
      schild.append(e('span', 'garten-name', c.name), e('span', 'garten-menge', c.kinder ? mengenWort(c) : 'Gespräch lesen'));
      beet.append(schild);
      if(c.kinder){
        const frisch = juengste(c, 3, true), bilder = e('div', 'garten-auslage');
        for(const f of frisch) bilder.append(S.material(f));
        beet.append(bilder);
        const zweige = e('nav', 'garten-zweige'); zweige.setAttribute('aria-label', 'Weiter in ' + c.name);
        for(const z of c.kinder.filter(n => n.kinder).slice(0, 5)) zweige.append(S.textknopf(z));
        beet.append(zweige);
        const weiter = S.knopf(c, 'garten-weiter', 'Das ganze Beet betreten →'); beet.append(weiter);
      } else beet.append(S.material(c));
      g.append(beet);
    }
    return g;
  });
}
