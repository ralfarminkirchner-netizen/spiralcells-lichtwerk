/* Die Textfassung im Bild: aufklappbarer Text, sonst nichts. Der Inhalt kommt aus textfassung.js. */
import {alsText, LEGENDE, ENTSPRECHUNG} from './textfassung.js';
import {FADEN_SATZ, arbeit} from './netz.js';

const el = (tag, klasse, text) => { const e = document.createElement(tag); if(klasse) e.className = klasse; if(text != null) e.textContent = text; return e; };
const klapp = (kopf, klasse) => { const d = el('details'), s = el('summary', klasse, kopf); d.append(s); return d; };

export function zeichneText(wurzel, N, oeffne, schliesse){
  if(wurzel._netz === N) return; wurzel._netz = N; wurzel.innerHTML = '';
  const T = alsText(N, FADEN_SATZ, arbeit), zu = el('button', 'zu', 'schließen (Esc)'); zu.type = 'button'; zu.addEventListener('click', schliesse);
  wurzel.append(zu, el('h1', '', 'SPiRALCELLS als Text'), el('p', '', T.kopf), el('p', '', 'Dieselbe Logik wie in allen Bildern, nur aus Text und Zeichen. Zeilen mit ▸ klappen auf.'), el('p', '', ' '));
  const leg = klapp('Zeichen und was sie bedeuten', 'b'), e = el('div', 'e'); for(const [a, b] of LEGENDE) e.append(el('p', 'z', `${a}: ${b}`)); e.append(el('p', '', ' '), el('p', 'b', 'Was einander in den Ansichten entspricht')); for(const [a, b] of ENTSPRECHUNG) e.append(el('p', 'z', `${a}: ${b}`)); leg.append(e); wurzel.append(leg);
  for(const b of T.bezirke){ const d = klapp(`${b.name} · ${b.zeile}`, 'b'); d.open = T.bezirke.length < 3; const inn = el('div', 'e'); if(b.satz) inn.append(el('p', 'z', b.satz));
    const werkZeile = w => { const dw = klapp(`${w.titel} · ${w.zeile}`), iw = el('div', 'e'), o = el('button', '', 'öffnen'); o.type = 'button'; o.addEventListener('click', () => oeffne(w.n)); iw.append(o);
      dw.addEventListener('toggle', () => { if(!dw.open || iw._voll) return; iw._voll = true; for(const f of w.fassungen) iw.append(el('p', 'z', f.zeile)); if(!w.fassungen.length && !w.material) iw.append(el('p', 'z', 'Nur die Ausgangsfassung.')); for(const z of w.bezuege) iw.append(el('p', 'z', z)); }, {once: false}); dw.append(iw); return dw; };
    if(b.teile){ const gesehen = new Set(); for(const t of b.teile){ inn.append(el('p', 'b', `Bereich ${t.name}`)); for(const w of b.werke) if(t.werke.has(w.n)){ inn.append(werkZeile(w)); gesehen.add(w.n); } } for(const w of b.werke) if(!gesehen.has(w.n)) inn.append(werkZeile(w)); }
    else for(const w of b.werke) inn.append(werkZeile(w));
    d.append(inn); wurzel.append(d); }
}
