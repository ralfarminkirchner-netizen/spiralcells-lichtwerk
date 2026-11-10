import {buehne, bildlager} from './buehne.js';
import {zeitWort} from './inhalt.js';

export const blaetterUnter = q => q.kinder ? q.kinder.flatMap(blaetterUnter) : [q];
export const bildUnter = q => q.bild || q.bilder?.[0] || (q.kinder || []).map(bildUnter).find(Boolean);
export const rahmen = (punkte, luft = 0) => ({
  x0: Math.min(...punkte.map(p => p.x - p.r)) - luft,
  x1: Math.max(...punkte.map(p => p.x + p.r)) + luft,
  y0: Math.min(...punkte.map(p => p.y - p.r)) - luft,
  y1: Math.max(...punkte.map(p => p.y + p.r)) + luft
});

export function textZeilen(x, text, breite, max = 2){
  const woerter = String(text).split(/\s+/), zeilen = []; let z = '';
  for(const wort of woerter){
    if(z && x.measureText(z + ' ' + wort).width > breite){ zeilen.push(z); z = wort; }
    else z += (z ? ' ' : '') + wort;
  }
  if(z) zeilen.push(z);
  if(zeilen.length > max){ zeilen.length = max; zeilen[max - 1] += '…'; }
  return zeilen.map(t => { while(t.length > 1 && x.measureText(t).width > breite) t = t.slice(0, -2) + '…'; return t; });
}

// One shared, static 2D stage. The two layouts retain their own visual language.
export function kosmischeBuehne(el, K, opt){
  const bilder = bildlager(K.bildUrl, 2200, 10), merker = new WeakMap();
  let W, fokus = null, schweb = null, tot = false, letztesRand = '', letzteBreite = false;
  const stil = document.createElement('style');
  stil.textContent = `.kosmisch-werkzeuge{position:absolute;z-index:8;display:flex;gap:5px;padding:5px;border:1px solid var(--ko-linie);border-radius:28px;background:var(--ko-glas);color:var(--ko-text);box-shadow:0 3px 15px #0001;backdrop-filter:blur(14px)}.kosmisch-werkzeuge button{width:36px;height:36px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;font:20px system-ui;cursor:pointer}.kosmisch-werkzeuge button:hover,.kosmisch-werkzeuge button:focus-visible{background:var(--ko-linie);outline:2px solid var(--ko-text);outline-offset:1px}.kosmisch-werkzeuge button:disabled{opacity:.3;cursor:default}.kosmisch-werkzeuge .kosmisch-ganz{width:auto;padding:0 12px;font:12px system-ui}.kosmisch-status{position:absolute;z-index:4;pointer-events:none;color:var(--ko-text);font:11px/1.45 system-ui;letter-spacing:.02em;max-width:280px}.kosmisch-status strong{display:block;font:500 19px/1.3 Georgia,serif;margin-bottom:3px}.kosmisch-status small{font:10px/1.5 system-ui;opacity:.7}@media(max-width:600px){.kosmisch-status strong{font-size:16px}.kosmisch-status{font-size:10px;max-width:230px}.kosmisch-werkzeuge button{width:34px;height:34px}.kosmisch-werkzeuge{gap:2px}}`;
  const knoepfe = document.createElement('div'); knoepfe.className = 'kosmisch-werkzeuge'; knoepfe.setAttribute('role', 'toolbar'); knoepfe.setAttribute('aria-label', opt.name + ' steuern');
  const status = document.createElement('div'); status.className = 'kosmisch-status';
  const kopf = document.createElement('strong'), info = document.createElement('span'), hilfe = document.createElement('small');
  hilfe.textContent = 'Ziehen · Vergrößern · Auswählen · Nochmals antippen zum Lesen';
  status.append(kopf, info, document.createElement('br'), hilfe);
  for(const e of [knoepfe, status]){ e.style.setProperty('--ko-text', opt.farben.text); e.style.setProperty('--ko-linie', opt.farben.linie); e.style.setProperty('--ko-glas', opt.farben.glas); }
  el.append(stil, status, knoepfe);
  const knopf = (text, titel, fn, klasse = '') => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.title = titel; b.setAttribute('aria-label', titel); b.className = klasse; b.onclick = fn; knoepfe.append(b); return b; };
  const B = buehne(el, {zeichne, tipp, schwebe, doppelklickZoom: false});
  const zurueck = knopf('↑', 'Eine Ebene zurück', () => fokus?.eltern && K.waehle(fokus.eltern));
  knopf('−', 'Verkleinern', () => zoom(.7)); knopf('+', 'Vergrößern', () => zoom(1.42));
  knopf('Überblick', 'Diesen Bereich vollständig zeigen', () => passe(), 'kosmisch-ganz');
  bilder.beiBild = B.neu;
  function zoom(f){ B.setze({cx: B.cx, cy: B.cy, s: Math.max(B.sMin, Math.min(B.sMax, B.s * f))}); }
  function rand(){
    const r = K.rand();
    status.style.left = (r.links + 14) + 'px'; status.style.top = (r.oben + 10) + 'px';
    knoepfe.style.right = (r.rechts + 10) + 'px'; knoepfe.style.bottom = (r.unten + 10) + 'px';
    B.rand = {...r, oben: r.oben + (B.w < 600 ? 82 : 88), unten: r.unten + 58};
    letztesRand = JSON.stringify(r);
  }
  function passe(){ if(!W) return; rand(); const blick = B.blickAuf(W.rahmen, 1.04); B.sMin = Math.min(.2, blick.s * .55); B.setze(blick); }
  function lege(q){
    fokus = q; letzteBreite = B.w < 600; W = opt.lege(q, letzteBreite);
    kopf.textContent = opt.name + ' · ' + q.name; info.textContent = W.info;
    zurueck.disabled = !q.eltern; schweb = null; passe();
  }
  function zeige(q){
    q ||= K.inhalt.wurzel;
    if(q.kinder){ if(fokus !== q) lege(q); else passe(); }
    else if(!W || !W.punkte.some(p => p.q === q)){ lege(q.eltern || K.inhalt.wurzel); }
    else { rand(); B.neu(); }
  }
  B.beiGroesse = () => { if(fokus && letzteBreite !== (B.w < 600)) lege(fokus); else passe(); };
  function treffer(px, py){
    if(!W) return null; let gut = null, wert = Infinity;
    for(const p of W.punkte){
      const dx = px - B.zuX(p.x), dy = py - B.zuY(p.y), r = p.r * B.s;
      const d = p.eckig ? Math.max(Math.abs(dx), Math.abs(dy)) : Math.hypot(dx, dy);
      const abstand = d / Math.max(r, 10);
      if(abstand <= 1.15 && abstand < wert){ gut = p; wert = abstand; }
      if(p.hit && px > p.hit[0] && px < p.hit[2] && py > p.hit[1] && py < p.hit[3]){ gut = p; wert = 0; }
    }
    return gut;
  }
  function tipp(px, py){ const p = treffer(px, py); if(!p) return; if(!p.q.kinder && K.gewaehlt() === p.q) K.oeffne(p.q); else K.waehle(p.q); }
  function schwebe(px, py){ const p = px < 0 ? null : treffer(px, py); if(p !== schweb){ schweb = p; B.c.style.cursor = p ? 'pointer' : 'grab'; B.neu(); } }
  function bildFuer(q){ if(!merker.has(q)) merker.set(q, bildUnter(q) || null); return merker.get(q); }
  function koerper(p){
    const x = B.x, px = B.zuX(p.x), py = B.zuY(p.y), r = p.r * B.s, gewaehlt = p.q === K.gewaehlt(), hover = p === schweb;
    p.hit = null;
    if(px + r < 0 || py + r < 0 || px - r > B.w || py - r > B.h || r < .45) return;
    const bild = bildFuer(p.q), da = bild && bilder.nimm(bild, r > 160 ? 960 : 240);
    x.save(); x.beginPath(); if(p.eckig) x.roundRect(px - r, py - r, 2 * r, 2 * r, Math.min(3, r * .15)); else x.arc(px, py, r, 0, Math.PI * 2); x.clip();
    x.fillStyle = '#e9e1d0'; x.fillRect(px - r, py - r, 2 * r, 2 * r);
    if(da){ const im = da.bild, s = Math.max(2 * r / im.naturalWidth, 2 * r / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s; x.drawImage(im, px - w / 2, py - h / 2, w, h); }
    else if(r > 2){
      x.fillStyle = '#b0a38c'; const strich = Math.max(.7, r * .025);
      for(let i = 0; i < 4; i++) x.fillRect(px - r * .48, py + (i - 1.5) * r * .22, r * (i === 3 ? .57 : .96), strich);
      if(!bild && r > 35){ x.fillStyle = '#61584a'; x.font = `${Math.min(11, r * .17)}px system-ui`; x.textAlign = 'center'; x.fillText(p.q.art === 'gespraech' ? 'Gespräch' : 'Text', px, py + r * .7); }
    }
    x.restore();
    x.beginPath(); if(p.eckig) x.roundRect(px - r, py - r, 2 * r, 2 * r, Math.min(3, r * .15)); else x.arc(px, py, r, 0, Math.PI * 2);
    x.lineWidth = gewaehlt ? 3 : hover ? 2 : Math.max(.6, Math.min(1.3, r * .03)); x.strokeStyle = gewaehlt || hover ? opt.farben.akzent : opt.farben.rand; x.stroke();
    if(p.q.kinder && !p.eckig){ x.beginPath(); x.arc(px, py, r + 4, 0, Math.PI * 2); x.lineWidth = .7; x.strokeStyle = opt.farben.linie; x.stroke(); }
    if(p.label && r >= 9){
      const font = Math.max(10, Math.min(p.zentrum ? 18 : 14, r * .32)), breite = Math.min(p.zentrum ? 235 : 190, Math.max(56, r * 3.7));
      x.font = `${p.zentrum ? 500 : 600} ${font}px ${p.zentrum ? 'Georgia,serif' : 'system-ui'}`; x.textAlign = 'center'; x.textBaseline = 'top';
      const zeilen = textZeilen(x, p.q.name, breite, 2), y = py + r + (p.zentrum ? 12 : 9), lh = font * 1.25;
      x.lineJoin = 'round'; x.lineWidth = 4; x.strokeStyle = opt.farben.hintergrund; x.fillStyle = opt.farben.text;
      zeilen.forEach((z, i) => { x.strokeText(z, px, y + i * lh); x.fillText(z, px, y + i * lh); });
      p.hit = [px - breite / 2, y, px + breite / 2, y + zeilen.length * lh + 3];
      if(p.q.kinder && r > 17){ x.font = `${Math.max(9, font - 2)}px system-ui`; x.fillStyle = opt.farben.leise; x.fillText(`${p.q.kinder.length} ${p.q.kinder.every(c => c.art === 'fassung') ? 'Fassungen' : 'Inhalte'}`, px, y + zeilen.length * lh + 4); }
    }
  }
  function zeichne(){
    const x = B.x; x.clearRect(0, 0, B.w, B.h); x.fillStyle = opt.farben.hintergrund; x.fillRect(0, 0, B.w, B.h); if(!W) return;
    if(JSON.stringify(K.rand()) !== letztesRand) rand();
    opt.hintergrund(B, W);
    const gewaehlt = W.punkte.find(p => p.q === K.gewaehlt());
    for(const p of W.punkte) if(p !== gewaehlt) koerper(p);
    if(gewaehlt) koerper(gewaehlt);
    if(schweb && !schweb.zentrum){
      const px = B.zuX(schweb.x), py = B.zuY(schweb.y), r = schweb.r * B.s;
      x.font = '600 13px system-ui'; const bw = Math.min(276, B.w - 32), zz = textZeilen(x, schweb.q.name, bw - 24, 3), bh = 25 + zz.length * 17 + 20;
      const bx = Math.max(8, Math.min(B.w - bw - 8, px - bw / 2)), by = Math.max(B.rand.oben - 72, Math.min(B.h - B.rand.unten - bh, py - r - bh - 10));
      x.fillStyle = opt.farben.tooltip; x.beginPath(); x.roundRect(bx, by, bw, bh, 9); x.fill(); x.fillStyle = opt.farben.tooltipText; x.textAlign = 'left'; x.textBaseline = 'top'; zz.forEach((z, i) => x.fillText(z, bx + 12, by + 12 + i * 17));
      x.font = '11px system-ui'; x.fillText(zeitWort(schweb.q), bx + 12, by + 17 + zz.length * 17);
    }
  }
  zeige(K.gewaehlt());
  return {zeige, neu: B.neu, ende(){ if(tot) return; tot = true; bilder.beiBild = null; B.ende(); stil.remove(); status.remove(); knoepfe.remove(); }};
}
