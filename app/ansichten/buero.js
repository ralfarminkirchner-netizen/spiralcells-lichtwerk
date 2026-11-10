import {e, knopf, foto, papier, bilderVon, auswahl, rahmen, kopf, mengenWort, zeitWort, ARTWORT} from './leseraum-basis.js';

export const legende = '<p>Der Materialtisch zeigt die Werke als Mappen und ihre Fassungen als einzelne Blätter. Die Bilder stammen aus dem vorhandenen Material.</p><p>Eine Mappe öffnet ihren Inhalt. Ein Blatt wählen Sie zuerst aus; mit „Fassung lesen“ öffnen Sie Bilder und Wortlaut. Der Weg oben führt wieder zurück.</p>';

export function starte(el, K) {
  const R = rahmen(el, K, 'buero-raum', CSS); let aktuell = null;
  function mappe(k, index) {
    const b = knopf('', () => auswahl(k, K), 'buero-mappe' + (!k.kinder ? ' einzelblatt' : ''));
    b.setAttribute('aria-label', k.name + ' · ' + (k.kinder ? mengenWort(k) : zeitWort(k)) + ' · Öffnen');
    b.style.setProperty('--neigung', ((index % 5) - 2) * .65 + 'deg');
    b.style.setProperty('--mappe', ['#b6bc9e','#d8ba8f','#aabfba','#c5b5a4','#b4b6c7'][index % 5]);
    const lasche = e('span', 'buero-lasche', ARTWORT[k.art] || 'Inhalt');
    const stapel = e('span', 'buero-stapel'), bilder = bilderVon(k, 3);
    if(bilder.length) for(const [i, bild] of bilder.entries()) { const blatt = e('span', 'buero-fotoblatt'); blatt.style.setProperty('--blatt', i); blatt.append(foto(bild, K, false, '')); stapel.append(blatt); }
    else stapel.append(papier(k));
    const beschriftung = e('span', 'buero-beschriftung'); beschriftung.append(e('strong', '', k.name), e('small', '', k.kinder ? mengenWort(k) : zeitWort(k)));
    b.append(lasche, stapel, beschriftung); return b;
  }
  function zeige(k) {
    R.masse(); if(aktuell === k) return; aktuell = k; R.raum.replaceChildren(kopf(k, K, 'Büro · Auf dem Materialtisch')); R.raum.scrollTop = 0;
    if(k.kinder) {
      const g = e('div', 'buero-mappen');
      k.kinder.forEach((c, i) => g.append(mappe(c, i))); R.raum.append(g);
      if(!k.kinder.length) R.raum.append(e('p', 'lr-empty', 'In dieser Mappe liegt noch kein Material.'));
    } else {
      const leiste = e('div', 'buero-lesezeile'); leiste.append(e('p', '', k.art === 'gespraech' ? 'Ein Gespräch liegt auf dem Tisch.' : 'Diese Fassung liegt auf dem Tisch.'), knopf(k.art === 'gespraech' ? 'Gespräch lesen ↗' : 'Fassung lesen ↗', () => K.oeffne(k), 'lr-action')); R.raum.append(leiste);
      const g = e('div', 'buero-auslage');
      if(k.bilder?.length) k.bilder.forEach((b, i) => { const f = knopf('', () => K.oeffne(k), 'buero-abzug'); f.style.setProperty('--neigung', ((i % 3) - 1) * 1.1 + 'deg'); f.setAttribute('aria-label', k.name + ' · Bild ' + (i + 1) + ' · Fassung lesen'); f.append(foto(b, K, i === 0, '')); if(b.text) f.append(e('span', '', b.text)); g.append(f); });
      else { const p = e('div', 'buero-ohne-bild'); p.append(papier(k), e('p', '', k.art === 'gespraech' ? 'Der Wortlaut ist im Gespräch lesbar.' : 'Zu dieser Fassung ist kein Bild hinterlegt.'), knopf('Wortlaut öffnen', () => K.oeffne(k), 'lr-action')); g.append(p); }
      R.raum.append(g);
      const andere = (k.eltern?.kinder || []).filter(c => c !== k); if(andere.length) { R.raum.append(e('h2', 'lr-section-title', 'In derselben Mappe')); const g = e('div', 'buero-mappen buero-andere'); andere.forEach((c, i) => g.append(mappe(c, i))); R.raum.append(g); }
    }
  }
  zeige(K.gewaehlt()); return {zeige, neu:R.masse, ende:R.ende};
}

const CSS = `
.buero-raum-grund{background:radial-gradient(ellipse at 75% 15%,#f0e6cf,#d7c9ab 75%)}.buero-raum-grund::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 163px,#a8997320 164px,transparent 165px);opacity:.6}.buero-raum{color:#363629}.buero-raum .lr-kopf{border-bottom:1px solid #b6aa8b;padding-bottom:23px}.buero-raum .lr-kopf h1{font-style:italic}.buero-mappen{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:48px 30px;padding:16px 8px}.buero-mappe{position:relative;display:flex;flex-direction:column;align-items:stretch;text-align:left;border:0;background:var(--mappe);padding:16px 13px 0;min-width:0;transform:rotate(var(--neigung));box-shadow:0 2px 3px #453b2b16,0 14px 19px -15px #3c3329b3;border-radius:3px 3px 5px 5px;transition:transform .18s ease,box-shadow .18s ease}.buero-mappe:hover{transform:rotate(0) translateY(-4px);box-shadow:0 10px 25px -12px #3c3329a0}.buero-lasche{position:absolute;top:-18px;left:0;max-width:75%;background:var(--mappe);padding:7px 16px 6px;border-radius:5px 7px 0 0;font-size:9px;letter-spacing:.13em;text-transform:uppercase}.buero-stapel{height:168px;display:block;position:relative;margin:0 4px 0}.buero-fotoblatt{position:absolute;inset:calc(var(--blatt) * 7px) calc(var(--blatt) * -3px) calc(var(--blatt) * -3px);padding:6px 6px 16px;background:#fbfaf4;box-shadow:0 2px 5px #342f2926;transform:rotate(calc((var(--blatt) - 1) * 2deg));z-index:calc(3 - var(--blatt))}.buero-fotoblatt img{width:100%;height:100%;object-fit:contain;background:#e9e7df}.buero-stapel .lr-papier{height:100%;min-height:0;padding:16px 22px}.buero-beschriftung{z-index:5;display:flex;flex-direction:column;gap:8px;background:#f9f6ea;margin:14px -13px 0;padding:16px 17px 18px;min-height:96px;border-radius:0 0 4px 4px;border-top:1px solid #ded5bf;box-shadow:0 -2px 4px #55442a0a}.buero-beschriftung strong{font-family:var(--serif,Georgia,serif);font-size:22px;line-height:1.1;font-weight:500;overflow-wrap:anywhere}.buero-beschriftung small{font-size:10px;line-height:1.5;color:#666650}.buero-mappe.einzelblatt{background:#faf8ee;padding-top:8px}.buero-mappe.einzelblatt .buero-lasche{background:#faf8ee}.buero-lesezeile{display:flex;justify-content:space-between;align-items:center;gap:20px;margin:-8px 0 32px}.buero-lesezeile p{font-family:var(--serif,Georgia,serif);font-size:21px}.buero-auslage{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:30px;padding:8px}.buero-abzug{background:#fbfaf5;border:0;padding:12px 12px 20px;box-shadow:0 5px 18px #493b2928;transform:rotate(var(--neigung));display:flex;flex-direction:column;gap:15px;min-width:0;text-align:left}.buero-abzug:first-child{grid-column:1/-1}.buero-abzug img{width:100%;height:auto;max-height:530px;object-fit:contain;background:#e9e7df}.buero-abzug span{font-family:var(--serif,Georgia,serif);font-size:16px;overflow-wrap:anywhere}.buero-ohne-bild{grid-column:1/-1;max-width:440px;background:#faf7e9;box-shadow:0 8px 20px #493b2928;padding:35px;transform:rotate(-1deg);font-size:14px;line-height:1.65}.buero-ohne-bild .lr-papier{padding:5px;min-height:180px}.buero-andere{grid-template-columns:repeat(3,minmax(0,1fr));margin-top:32px}
@media(max-width:1100px){.buero-mappen,.buero-andere{grid-template-columns:repeat(2,minmax(0,1fr));gap:42px 25px}.buero-stapel{height:155px}}
@media(max-width:759px){.buero-raum{padding:20px 18px 55px}.buero-mappen,.buero-andere{grid-template-columns:1fr;gap:40px;padding:12px 9px}.buero-stapel{height:180px}.buero-beschriftung{min-height:85px}.buero-beschriftung strong{font-size:25px}.buero-lesezeile{align-items:flex-start;flex-direction:column;gap:8px;margin-bottom:24px}.buero-lesezeile p{font-size:19px;margin:0 0 8px}.buero-auslage{grid-template-columns:1fr;gap:25px;padding:3px}.buero-abzug{padding:8px 8px 16px}.buero-abzug:first-child{grid-column:auto}.buero-ohne-bild{padding:25px}.buero-raum .lr-kopf h1{font-size:36px}}
@media(prefers-reduced-motion:reduce){.buero-mappe{transition:none}}
`;
