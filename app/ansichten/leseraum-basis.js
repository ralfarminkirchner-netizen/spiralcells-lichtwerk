import {mengenWort, zeitWort, ARTWORT} from './inhalt.js';

export {mengenWort, zeitWort, ARTWORT};
export const e = (tag, klasse, text) => { const n = document.createElement(tag); if(klasse) n.className = klasse; if(text != null) n.textContent = text; return n; };
export function knopf(text, fn, klasse = '') { const b = e('button', klasse, text); b.type = 'button'; b.onclick = fn; return b; }
export function bildVon(k) { if(k.bild) return k.bild; if(k.bilder?.length) return k.bilder[0]; for(const c of k.kinder || []) { const b = bildVon(c); if(b) return b; } return null; }
export function bilderVon(k, zahl = 3) { const a = [], schon = new Set(); const lauf = q => { for(const b of q.bilder || []) if(a.length < zahl && !schon.has(b.pfad)) { a.push(b); schon.add(b.pfad); } for(const c of q.kinder || []) { if(a.length >= zahl) break; lauf(c); } }; lauf(k); return a; }
export function foto(b, K, gross = false, alt = b.text || '') { const i = e('img'); i.alt = alt; i.loading = 'lazy'; i.decoding = 'async'; i.src = K.bildUrl(b, gross ? 960 : 240); i.onerror = () => { const p = e('span', 'lr-fehlbild', 'Bild gerade nicht erreichbar'); i.replaceWith(p); }; return i; }
export function papier(k) { const p = e('span', 'lr-papier'); p.setAttribute('aria-hidden', 'true'); p.append(e('span', '', k.art === 'gespraech' ? '„' : 'Wort & Werk')); for(let i = 0; i < 4; i++) p.append(e('i')); return p; }
export function auswahl(k, K) { if(k === K.gewaehlt() && !k.kinder) K.oeffne(k); else K.waehle(k); }
export function rahmen(el, K, klasse, css) {
  const style = e('style'); style.textContent = GRUND + css;
  const hintergrund = e('div', 'lr-hintergrund ' + klasse + '-grund'); hintergrund.setAttribute('aria-hidden', 'true');
  const raum = e('section', 'leseraum ' + klasse); raum.setAttribute('aria-label', klasse === 'buero-raum' ? 'Der Materialtisch' : 'Zelle und Text');
  el.append(style, hintergrund, raum);
  let tot = false;
  const masse = () => { if(tot) return; const r = K.rand(); Object.assign(raum.style, {top:r.oben + 'px', bottom:r.unten + 'px', left:r.links + 'px', right:r.rechts + 'px'}); };
  const ro = new ResizeObserver(masse); ro.observe(el); window.addEventListener('resize', masse); masse();
  return {raum, masse, ende(){ tot = true; ro.disconnect(); window.removeEventListener('resize', masse); style.remove(); hintergrund.remove(); raum.remove(); }};
}
export function kopf(k, K, rubrik) {
  const h = e('header', 'lr-kopf');
  const zeile = e('div', 'lr-kopfzeile'); zeile.append(e('span', 'lr-rubrik', rubrik));
  if(k.eltern) zeile.append(knopf('↑ ' + k.eltern.name, () => K.waehle(k.eltern), 'lr-zurueck'));
  h.append(zeile, e('h1', '', k.name), e('p', 'lr-menge', mengenWort(k) + ' · ' + zeitWort(k)));
  return h;
}

const GRUND = `
.lr-hintergrund{position:absolute;inset:0;pointer-events:none}
.leseraum{position:absolute;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;isolation:isolate;color:#292e29;box-sizing:border-box;padding:24px 30px 80px;font-family:var(--sans,system-ui,sans-serif)}
.leseraum *{box-sizing:border-box}.leseraum button{font:inherit;color:inherit;cursor:pointer}.leseraum button:focus-visible,.leseraum a:focus-visible,.leseraum summary:focus-visible{outline:3px solid #98712b;outline-offset:5px}
.lr-kopf{margin-bottom:34px}.lr-kopfzeile{display:flex;justify-content:space-between;align-items:center;gap:20px}.lr-rubrik{text-transform:uppercase;letter-spacing:.2em;font-size:11px;font-weight:650}.lr-zurueck{background:none;border:0;border-bottom:1px solid #a9a596;padding:5px 0;font-size:12px;max-width:55%;text-align:right}.lr-kopf h1{font-family:var(--serif,Georgia,serif);font-weight:450;font-size:clamp(30px,4vw,58px);line-height:1.08;margin:20px 0 12px;overflow-wrap:anywhere;letter-spacing:-.035em}.lr-menge{font-size:12px;line-height:1.5;color:#666b60;margin:0}.lr-fehlbild{display:grid;place-items:center;min-height:100px;padding:20px;background:#edeade;color:#777469;font-size:12px}.lr-papier{display:flex;flex-direction:column;justify-content:center;gap:11px;background:#f7f4e9;padding:26px;color:#8c887b;width:100%;min-height:145px}.lr-papier>span{font-family:var(--serif,Georgia,serif);font-size:25px;margin-bottom:10px}.lr-papier i{display:block;height:1px;background:#d3cbbb;width:90%}.lr-papier i:nth-child(3){width:72%}.lr-papier i:last-child{width:52%}.lr-action{background:#303e37;border:1px solid #303e37;border-radius:3px;color:#fff!important;padding:11px 18px;line-height:1.4}.lr-empty{font-family:var(--serif,Georgia,serif);font-size:22px;color:#6d6b5f;padding:30px 0}.lr-section-title{font-size:11px;text-transform:uppercase;letter-spacing:.18em;font-weight:600;margin:40px 0 18px}.lr-geschwister{display:flex;flex-wrap:wrap;gap:8px;padding-top:10px;border-top:1px solid #bfc4b9}.lr-geschwister button{background:transparent;border:1px solid #c5c9bc;padding:9px 13px;font-size:12px;text-align:left;border-radius:2px}.lr-geschwister button[aria-current=true]{background:#31443b;color:#fff;border-color:#31443b}
@media(max-width:759px){.leseraum{padding:20px 16px 44px}.lr-kopf{margin-bottom:25px}.lr-kopf h1{font-size:34px;margin-top:18px}.lr-kopfzeile{gap:10px;align-items:flex-start}.lr-rubrik{font-size:10px}.lr-zurueck{font-size:11px}.lr-menge{font-size:11px}}
`;
