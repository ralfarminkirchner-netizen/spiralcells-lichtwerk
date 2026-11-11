/* Gemeinsame kleine Werkzeuge aller neun Ansichten: Farben der Orte, Bilder, Wörter.
   Eine Farbe gehört immer zu einem Ort, in jeder Ansicht dieselbe. Sie ist Wiedererkennung, keine Wertung. */

import {wegZu} from './inhalt.js';

export const el = (tag, klasse, text) => { const e = document.createElement(tag); if(klasse) e.className = klasse; if(text != null) e.textContent = text; return e; };
export const knopf = (klasse, text, tu, titel) => { const b = el('button', klasse, text); b.type = 'button'; if(tu) b.onclick = tu; if(titel) b.setAttribute('aria-label', titel); return b; };
export const sicher = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const ruhig = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Farben je Ort: gedeckt, auf Papier unterscheidbar; die dunkle Stufe ist für Schrift (Kontrast ≥ 4,5:1) */
export const ORTFARBE = {
  'Tragwerk System': {f: '#8a7356', d: '#5a4a35', h: '#efe6d6'},
  'MiND-BODY-SOUL':  {f: '#8f5fa3', d: '#62397a', h: '#efe4f2'},
  'GAMES':           {f: '#2f8a77', d: '#1d5f52', h: '#ddefe9'},
  'MUSiC':           {f: '#c4643a', d: '#8f3f1c', h: '#f6e3d9'},
  'EDUCATiON':       {f: '#4a7fbf', d: '#2b5689', h: '#e0eaf6'},
  'WRiTING':         {f: '#a8862b', d: '#715813', h: '#f3ecd6'},
  'ARTS':            {f: '#c04a6b', d: '#8b2945', h: '#f6e0e6'},
  'PERSONAL':        {f: '#5f8f3c', d: '#3d6521', h: '#e4efd9'},
  'Zur Prüfung':     {f: '#8c8a80', d: '#5c5a52', h: '#ecebe6'}
};
const NEUTRAL = {f: '#8c8a80', d: '#4a4842', h: '#ecebe6'};
export const ortVon = k => { const w = wegZu(k); return w[1] && w[1].art === 'ort' ? w[1] : null; };
export const farbe = k => { const o = k && (k.art === 'ort' ? k : ortVon(k)); return (o && ORTFARBE[o.name]) || NEUTRAL; };

/* Das Bild, das für einen Knoten steht: sein eigenes, sonst das erste darunter */
export function titelBild(k){
  if(!k) return null;
  if(k.bild) return k.bild;
  if(k.bilder && k.bilder.length) return k.bilder[0];
  for(const c of k.kinder || []){ const b = titelBild(c); if(b) return b; }
  return null;
}
export const fassungenUnter = k => !k ? [] : k.art === 'fassung' || k.art === 'gespraech' ? [k] : (k.kinder || []).flatMap(fassungenUnter);
export const bilderUnter = (k, n = 99) => { const r = [], gesehen = new Set();
  (function lauf(q){ if(r.length >= n) return; for(const b of q.bilder || []) if(!gesehen.has(b.pfad) && r.length < n){ gesehen.add(b.pfad); r.push(b); } for(const c of q.kinder || []) lauf(c); })(k); return r; };

/* Der Werk-Behälter einer Fassung: das nächste Werk oder die App darüber */
export const behaelter = k => { for(let q = k; q; q = q.eltern) if(q.art === 'werk' || q.art === 'app') return q; return k; };

export const n = (x, e, m) => `${x.toLocaleString('de-DE')} ${x === 1 ? e : m}`;
const TAG = {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'};
export const nurMonat = t => t != null && t % 1000 === 1;   // inhalt.js markiert so Zeiten ohne belegten Tag
export const tagWort = t => t == null ? 'ohne belegte Zeit' : nurMonat(t) ? new Date(t).toLocaleDateString('de-DE', {month: 'long', year: 'numeric', timeZone: 'UTC'}) : new Date(t).toLocaleDateString('de-DE', TAG);
export const monatKurz = t => new Date(t).toLocaleDateString('de-DE', {month: 'short', year: '2-digit', timeZone: 'UTC'});

/* Ein Bild als Element: ehrlich, wenn es fehlt oder nicht lädt */
export function bildEl(K, b, breit = 240, klasse = 'bild'){
  const f = el('span', klasse);
  if(!b){ f.classList.add('ohne'); f.append(el('span', 'ohnewort', 'ohne Bild')); return f; }
  const i = new Image(); i.loading = 'lazy'; i.decoding = 'async'; i.alt = b.text || ''; i.src = K.bildUrl(b, breit);
  i.onerror = () => { f.classList.add('ohne', 'kaputt'); f.replaceChildren(el('span', 'ohnewort', 'Bild nicht erreichbar')); };
  f.append(i); return f;
}

/* Papierblatt für eine Fassung ohne Bild, auf der Leinwand gezeichnet */
export function papier(x, px, py, w, h, f){
  x.save(); x.fillStyle = '#fbf8f1'; x.strokeStyle = 'rgba(60,45,30,.35)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(px, py); x.lineTo(px + w * .78, py); x.lineTo(px + w, py + h * .22); x.lineTo(px + w, py + h); x.lineTo(px, py + h); x.closePath(); x.fill(); x.stroke();
  x.strokeStyle = f || 'rgba(60,45,30,.35)'; x.globalAlpha = .55; x.lineWidth = Math.max(.6, h * .05);
  for(let i = 1; i <= 3; i++){ const y = py + h * (.3 + i * .17); x.beginPath(); x.moveTo(px + w * .16, y); x.lineTo(px + w * (i === 3 ? .55 : .84), y); x.stroke(); }
  x.restore();
}

/* Bild in einen Rahmen schneiden (cover), auf der Leinwand */
export function bildRahmen(x, img, px, py, w, h, rund = 0){
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; if(!iw || !ih) return;
  const s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
  x.save(); x.beginPath(); if(rund && x.roundRect) x.roundRect(px, py, w, h, rund); else x.rect(px, py, w, h); x.clip();
  x.drawImage(img, (iw - sw) / 2, (ih - sh) / 3, sw, sh, px, py, w, h); x.restore();
}

/* Beschriftungen ohne Überschneidung: wer zuerst kommt (wichtiger), bekommt den Platz */
export function platzhalter(){
  const belegt = [];
  return {
    frei(r){ for(const b of belegt) if(r.x0 < b.x1 && r.x1 > b.x0 && r.y0 < b.y1 && r.y1 > b.y0) return false; return true; },
    nimm(r){ belegt.push(r); },
    versuch(r){ if(this.frei(r)){ belegt.push(r); return true; } return false; }
  };
}

/* Text kürzen, ohne Wort zu zerschneiden, mit Auslassung */
export function kuerze(x, t, max){
  if(x.measureText(t).width <= max) return t;
  let lo = 0, hi = t.length; while(lo < hi){ const m = (lo + hi + 1) >> 1; if(x.measureText(t.slice(0, m) + '…').width <= max) lo = m; else hi = m - 1; }
  return t.slice(0, Math.max(1, lo)).replace(/[\s·,–-]+$/, '') + '…';
}

export const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
export const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/* Eigene Gestaltung einer Ansicht: ihre CSS-Datei wird einmal dazugeladen */
export function stil(name){
  const href = new URL(name + '.css', import.meta.url).href;
  if(![...document.styleSheets].some(x => x.href === href) && !document.querySelector(`link[href="${href}"]`)){
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.append(l); }
}
