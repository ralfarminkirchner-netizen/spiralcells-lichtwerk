/* Was jede gezeichnete Ansicht gleich bedient: Knöpfe zum Näher- und Weitergehen, Tastatur, Treffer der Zeichnung. */

import {el, knopf} from './gemein.js';

/* Knöpfe unten links: näher, weiter, ganz sehen */
export function zoomKnoepfe(flaeche, B, ganz, ganzWort = 'Ganz sehen'){
  const z = el('div', 'zoomknoepfe');
  const um = f => { const s = Math.max(B.sMin, Math.min(B.sMax, B.s * f)); B.fliege({cx: B.cx, cy: B.cy, s}, 260); };
  z.append(knopf('knopf rund', '+', () => um(1.6), 'Näher heran'), knopf('knopf rund', '−', () => um(1 / 1.6), 'Weiter weg'), knopf('knopf', ganzWort, ganz));
  flaeche.append(z); return z;
}

/* Tastatur auf der Bühne: hoch = Eltern, runter = erstes Kind, links/rechts = Geschwister, Eingabe = öffnen */
export function tasten(flaeche, K, extra){
  flaeche.tabIndex = 0; flaeche.setAttribute('role', 'application');
  flaeche.setAttribute('aria-roledescription', 'Ansicht');
  flaeche.setAttribute('aria-label', 'Zeichnung. Pfeiltasten wandern durch den Bestand, Eingabe öffnet, plus und minus zoomen.');
  flaeche.addEventListener('keydown', e => {
    const k = K.gewaehlt(); if(!k) return;
    if(extra && extra(e, k)) return;
    const geschw = k.eltern ? k.eltern.kinder : [k], i = geschw.indexOf(k);
    let ziel = null;
    if(e.key === 'ArrowUp') ziel = k.eltern; else if(e.key === 'ArrowDown') ziel = k.kinder && k.kinder[0];
    else if(e.key === 'ArrowRight') ziel = geschw[(i + 1) % geschw.length]; else if(e.key === 'ArrowLeft') ziel = geschw[(i - 1 + geschw.length) % geschw.length];
    else if(e.key === 'Enter'){ K.oeffne(k); e.preventDefault(); return; }
    if(ziel){ K.waehle(ziel); e.preventDefault(); }
  });
}

/* Was gezeichnet wurde, kann getroffen werden: Rechtecke und Kreise in Bildschirmpunkten, zuletzt gezeichnet zuerst */
export function trefferliste(){
  let l = [];
  return {
    leer(){ l = []; },
    rechteck(k, x, y, w, h, pad = 4){ l.push({k, x0: x - pad, y0: y - pad, x1: x + w + pad, y1: y + h + pad}); },
    kreis(k, x, y, r, pad = 4){ l.push({k, x0: x - r - pad, y0: y - r - pad, x1: x + r + pad, y1: y + r + pad, cx: x, cy: y, r: r + pad}); },
    finde(px, py){
      for(let i = l.length - 1; i >= 0; i--){ const t = l[i];
        if(px < t.x0 || px > t.x1 || py < t.y0 || py > t.y1) continue;
        if(t.r != null && Math.hypot(px - t.cx, py - t.cy) > t.r) continue;
        return t.k; }
      return null;
    }
  };
}

/* Ein Namensschild am Zeiger, nur Zusatz: alles steht auch im Blatt */
export function schild(flaeche){
  const s = el('div', 'schild'); s.hidden = true; s.setAttribute('aria-hidden', 'true'); flaeche.append(s);
  return {zeige(t, x, y){ s.textContent = t; s.hidden = false; const w = flaeche.clientWidth; s.style.left = Math.min(x + 14, w - s.offsetWidth - 8) + 'px'; s.style.top = (y + 16) + 'px'; }, weg(){ s.hidden = true; }};
}
