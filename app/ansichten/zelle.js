import {lesetext} from './lesen.js';
import {e, knopf, foto, papier, bildVon, auswahl, rahmen, kopf, mengenWort, zeitWort, ARTWORT} from './leseraum-basis.js';

export const legende = '<p>Ein Werk erhält hier Platz für Bilder und Wortlaut. Bei einer Sammlung bilden ihre Inhalte das Inhaltsverzeichnis. Wählen Sie einen Eintrag, um näher hineinzulesen.</p><p>Der Originaltext bleibt unverändert. Technische Belege bleiben unter „Technische Details“ geschlossen, bis Sie diese öffnen.</p>';

export function starte(el, K) {
  const R = rahmen(el, K, 'zelle-raum', CSS); let aktuell = null, auftrag = 0, tot = false;
  function zeile(k, i) {
    const b = knopf('', () => auswahl(k, K), 'zelle-eintrag');
    b.setAttribute('aria-label', k.name + ' · ' + (k.kinder ? mengenWort(k) : zeitWort(k)) + ' · Öffnen');
    b.append(e('span', 'zelle-nummer', String(i + 1).padStart(2, '0')));
    const bild = bildVon(k), v = e('span', 'zelle-mini'); v.append(bild ? foto(bild, K, false, '') : papier(k)); b.append(v);
    const t = e('span', 'zelle-eintragtitel'); t.append(e('small', '', ARTWORT[k.art] || 'Inhalt'), e('strong', '', k.name), e('span', '', k.kinder ? mengenWort(k) : zeitWort(k))); b.append(t, e('span', 'zelle-pfeil', '↗')); return b;
  }
  async function wortlaut(k, ziel, nummer) {
    try { const html = await lesetext(k, K.texte || new Map(), K.bildUrl); if(tot || nummer !== auftrag) return; ziel.innerHTML = html || '<p class="zelle-leertext">Zu dieser Fassung liegt kein Wortlaut vor.</p>'; }
    catch { if(tot || nummer !== auftrag) return; ziel.replaceChildren(e('p', 'zelle-leertext', 'Der Wortlaut ist gerade nicht erreichbar.')); }
  }
  function zeige(k) {
    R.masse(); if(aktuell === k) return; aktuell = k; const nummer = ++auftrag; R.raum.replaceChildren(kopf(k, K, 'Zelle und Text · Ein Werk von nah')); R.raum.scrollTop = 0;
    if(k.kinder) {
      const bild = bildVon(k);
      if(bild) {
        const titelbild = e('figure', 'zelle-titelbild'); titelbild.append(foto(bild, K, true));
        const bildquelle = findeBild(k, bild), beschriftung = e('figcaption'); beschriftung.append(e('span', '', bildquelle ? bildquelle.name : k.name));
        if(bildquelle) beschriftung.append(knopf('Dieses Werk lesen ↗', () => K.waehle(bildquelle), 'zelle-bildquelle')); titelbild.append(beschriftung); R.raum.append(titelbild);
      }
      const kapitel = e('section', 'zelle-verzeichnis'); kapitel.append(e('h2', 'lr-section-title', 'Inhalt · ' + k.kinder.length + ' Einträge')); k.kinder.forEach((c, i) => kapitel.append(zeile(c, i))); R.raum.append(kapitel);
      if(!k.kinder.length) R.raum.append(e('p', 'lr-empty', 'Hier liegt noch kein Inhalt.'));
    } else {
      const seite = e('div', 'zelle-seite');
      const bilder = e('div', 'zelle-bilder'); bilder.setAttribute('aria-label', 'Bilder dieser Fassung');
      for(const b of k.bilder || []) { const f = e('figure'); f.append(foto(b, K, true)); if(b.text) f.append(e('figcaption', '', b.text)); bilder.append(f); }
      if(k.bilder?.length) { const galerie = e('section', 'zelle-galerie'); galerie.append(e('p', 'zelle-bildhinweis', k.bilder.length === 1 ? 'Ein Bild aus dieser Fassung' : k.bilder.length + ' Bilder aus dieser Fassung'), bilder); seite.append(galerie); }
      const textseite = e('article', 'zelle-wortlaut');
      const titel = e('header', 'zelle-textkopf'); titel.append(e('span', 'lr-rubrik', k.art === 'gespraech' ? 'Gespräch · Originalwortlaut' : 'Wortlaut der Fassung'));
      if(k.stimme) titel.append(e('p', '', k.stimme)); textseite.append(titel);
      const text = e('div', 'zelle-text'); text.append(e('p', 'zelle-leertext', 'Der Wortlaut wird geholt …')); textseite.append(text); seite.append(textseite); R.raum.append(seite); wortlaut(k, text, nummer);
      const andere = k.eltern?.kinder || []; if(andere.length > 1) { R.raum.append(e('h2', 'lr-section-title', 'Weiter in ' + k.eltern.name)); const n = e('nav', 'lr-geschwister'); n.setAttribute('aria-label', 'Andere Inhalte in ' + k.eltern.name); for(const c of andere) { const b = knopf(c.name, () => auswahl(c, K)); b.setAttribute('aria-current', String(c === k)); n.append(b); } R.raum.append(n); }
    }
  }
  zeige(K.gewaehlt()); return {zeige, neu:R.masse, ende(){ tot = true; ++auftrag; R.ende(); }};
}

function findeBild(k, bild) { if((k.bilder || []).some(b => b.pfad === bild.pfad)) return k; for(const c of k.kinder || []) { const q = findeBild(c, bild); if(q) return q; } return null; }

const CSS = `
.zelle-raum-grund{background:#e6ebe4;background-image:radial-gradient(ellipse at 78% 10%,#f8faf1,transparent 70%)}.zelle-raum{padding-left:40px;padding-right:40px;color:#273a30}.zelle-raum .lr-kopf{max-width:100%;padding-bottom:30px;border-bottom:1px solid #aeb9aa}.zelle-raum .lr-kopf h1{font-size:clamp(35px,4.5vw,65px)}.zelle-titelbild{margin:0 0 25px;position:relative;background:#d0d6ca;padding:22px;display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:25px;align-items:end;border-radius:65% 3% 3% 3% / 14% 3% 3% 3%}.zelle-titelbild>img{width:100%;max-height:360px;object-fit:contain;display:block;box-shadow:0 9px 24px #25382b20;background:#e4e8df}.zelle-titelbild figcaption{font-family:var(--serif,Georgia,serif);font-size:23px;line-height:1.2;display:flex;flex-direction:column;gap:22px;padding-bottom:8px;overflow-wrap:anywhere}.zelle-bildquelle{font-family:var(--sans,system-ui,sans-serif)!important;font-size:11px!important;border:0;border-bottom:1px solid #9aaa97;background:none;text-align:left;padding:9px 0}.zelle-verzeichnis>.lr-section-title{margin:32px 0 12px}.zelle-eintrag{border:0;border-bottom:1px solid #bec8ba;background:none;display:grid;grid-template-columns:25px 86px minmax(0,1fr) 25px;gap:22px;align-items:center;width:100%;text-align:left;padding:20px 0}.zelle-eintrag:hover{background:#ffffff4d}.zelle-nummer{font-family:var(--serif,Georgia,serif);color:#73826d;font-size:16px}.zelle-mini{display:block;height:68px;background:#d4dbcf;overflow:hidden}.zelle-mini img{width:100%;height:100%;object-fit:contain}.zelle-mini .lr-papier{min-height:0;height:100%;padding:9px;gap:5px}.zelle-mini .lr-papier>span{font-size:12px;margin:0}.zelle-eintragtitel{display:flex;flex-direction:column;gap:6px}.zelle-eintragtitel small{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:#6b7c64}.zelle-eintragtitel strong{font-family:var(--serif,Georgia,serif);font-size:28px;font-weight:400;line-height:1.15;overflow-wrap:anywhere}.zelle-eintragtitel>span{font-size:11px;color:#6c7766}.zelle-pfeil{font-size:24px;color:#70836c}.zelle-seite{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1fr);gap:35px;align-items:start}.zelle-galerie{min-width:0}.zelle-bildhinweis{font-size:10px;letter-spacing:.08em;color:#6d7d65;margin:0 0 12px}.zelle-bilder{display:flex;flex-direction:column;gap:25px}.zelle-bilder figure{margin:0}.zelle-bilder img{width:100%;height:auto;display:block;background:#d5dbcf;box-shadow:0 6px 16px #26362713}.zelle-bilder figcaption{font-size:11px;line-height:1.5;padding:9px 3px;color:#62725c;overflow-wrap:anywhere}.zelle-wortlaut{min-width:0;background:#fcfcf4;padding:32px;box-shadow:0 2px 8px #2c39240c;min-height:320px}.zelle-wortlaut:only-child{max-width:760px;grid-column:1/-1;margin:auto;width:100%;padding:45px}.zelle-textkopf{padding-bottom:20px;border-bottom:1px solid #e2e5d7;margin-bottom:24px}.zelle-textkopf p{font-size:12px;color:#6b7863;margin-bottom:0}.zelle-text{font-family:var(--serif,Georgia,serif);font-size:18px;line-height:1.75;overflow-wrap:anywhere}.zelle-text p{margin:0 0 1.25em}.zelle-text h2{font-size:29px;line-height:1.18;font-weight:500;margin:1.5em 0 .75em}.zelle-text h3{font-size:23px;line-height:1.3;font-weight:500;margin:1.5em 0 .6em}.zelle-text h4{font-size:20px;line-height:1.3}.zelle-text ul,.zelle-text ol{padding-left:1.2em}.zelle-text li{margin:.4em 0}.zelle-text blockquote{font-style:italic;margin:1.4em 0;padding-left:20px;border-left:2px solid #9eaf90}.zelle-text img{max-width:100%;height:auto}.zelle-text pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.65 ui-monospace,monospace;background:#edf0e5;padding:15px;overflow:auto}.zelle-text code{font-size:.76em;overflow-wrap:anywhere}.zelle-text a{color:#355c41;text-decoration-thickness:1px;text-underline-offset:3px}.zelle-text details{font-family:var(--sans,system-ui,sans-serif);font-size:12px;border-top:1px solid #d8dfcc;padding:16px 0}.zelle-text summary{cursor:pointer;color:#607455}.zelle-text .zelle-leertext{color:#7c8475;font-style:italic}.zelle-text hr{border:0;border-top:1px solid #d8dfcc;margin:28px 0}
@media(max-width:1180px){.zelle-seite{grid-template-columns:1fr}.zelle-bilder{display:flex;flex-direction:row;align-items:start;gap:18px;overflow:auto;scroll-snap-type:x proximity;padding-bottom:10px}.zelle-bilder figure{flex:0 0 85%;scroll-snap-align:start;min-width:0}.zelle-bilder img{height:300px;object-fit:contain}.zelle-wortlaut{padding:35px;max-width:760px;width:100%;margin:auto}.zelle-titelbild{grid-template-columns:1fr 150px}}
@media(max-width:759px){.zelle-raum{padding:20px 16px 45px}.zelle-raum .lr-kopf{padding-bottom:22px;margin-bottom:22px}.zelle-raum .lr-kopf h1{font-size:36px}.zelle-titelbild{grid-template-columns:1fr;padding:14px;gap:14px;border-radius:35% 3% 3% 3% / 9% 3% 3% 3%}.zelle-titelbild>img{max-height:260px}.zelle-titelbild figcaption{font-size:21px;gap:10px;padding:0 3px}.zelle-bildquelle{align-self:flex-start}.zelle-eintrag{grid-template-columns:18px 64px minmax(0,1fr);gap:12px;padding:19px 0}.zelle-mini{height:60px}.zelle-eintragtitel strong{font-size:23px}.zelle-eintragtitel small{font-size:9px}.zelle-pfeil{display:none}.zelle-nummer{font-size:13px}.zelle-eintragtitel>span{font-size:10px}.zelle-seite{gap:24px}.zelle-bilder{gap:14px}.zelle-bilder figure{flex-basis:94%}.zelle-bilder img{height:230px}.zelle-wortlaut,.zelle-wortlaut:only-child{padding:24px 20px;min-height:200px}.zelle-text{font-size:18px;line-height:1.7}.zelle-text h2{font-size:27px}.zelle-text h3{font-size:23px}}
`;
