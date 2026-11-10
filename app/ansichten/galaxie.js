import {kosmischeBuehne, blaetterUnter, rahmen} from './kosmisch-basis.js';

export const legende = '<span>Die Bildbänder folgen den belegten Monaten: innen früher, außen später. Inhalte ohne belegte Zeit stehen in einem eigenen Feld.</span>';
const TAU = Math.PI * 2, START = -.25, ENDE = TAU - .64, BOGEN = ENDE - START;
const farben = {hintergrund: '#111f2b', text: '#f2edda', leise: '#a9bac1', linie: '#bfd7dd38', rand: '#d3c7ae88', akzent: '#ebbe6b', glas: '#172b3ce8', tooltip: '#f2ecd9', tooltipText: '#162e3e'};
const monatWort = t => new Date(t).toLocaleDateString('de-DE', {month: 'short', year: 'numeric', timeZone: 'UTC'});

export function legeGalaxie(q, schmal = false){
  const alle = blaetterUnter(q), monate = new Map(), ohne = [];
  for(const k of alle){
    if(k.von == null || !Number.isFinite(k.von)){ ohne.push(k); continue; }
    const d = new Date(k.von), key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if(!monate.has(key)) monate.set(key, []); monate.get(key).push(k);
  }
  const punkte = [], baender = []; let radius = 23;
  for(const [key, inhalte] of [...monate].sort(([a], [b]) => a.localeCompare(b))){
    inhalte.sort((a, b) => a.von - b.von || a.name.localeCompare(b.name, 'de'));
    const innen = radius - 3.3; let i = 0;
    while(i < inhalte.length){
      const kapazitaet = Math.max(8, Math.floor(BOGEN * radius / 7.2)), n = Math.min(kapazitaet, inhalte.length - i);
      // Each band denotes one evidenced month; positions within it make room for its images.
      for(let j = 0; j < n; j++, i++){
        const a = START + (j + .5) / n * BOGEN;
        punkte.push({q: inhalte[i], x: Math.cos(a) * radius, y: Math.sin(a) * radius, r: 2.35, eckig: true});
      }
      radius += 7.2;
    }
    baender.push({key, innen, aussen: radius - 3, mitte: (innen + radius - 3) / 2, titel: monatWort(inhalte[0].von), anzahl: inhalte.length});
    radius += 5.5;
  }
  const aussen = baender.length ? radius - 2 : 0;
  // Undated works have a separate, equally real image inventory, never a fake date.
  let undatiert = null;
  if(ohne.length){
    const spalten = Math.max(6, Math.ceil(Math.sqrt(ohne.length * (schmal ? 1.6 : .8)))), zeilen = Math.ceil(ohne.length / spalten), schritt = 6.3;
    const breite = spalten * schritt, hoehe = zeilen * schritt;
    const x = !aussen ? -breite / 2 : schmal ? -breite / 2 : aussen + 20;
    const y = !aussen ? -hoehe / 2 : schmal ? aussen + 27 : -hoehe / 2;
    undatiert = {x, y, breite, hoehe, anzahl: ohne.length};
    ohne.sort((a, b) => a.name.localeCompare(b.name, 'de')).forEach((k, i) => punkte.push({q: k, x: x + (i % spalten + .5) * schritt, y: y + (Math.floor(i / spalten) + .5) * schritt, r: 2.35, eckig: true}));
  }
  const r = punkte.length ? rahmen(punkte, 10) : {x0: -40, x1: 40, y0: -40, y1: 40};
  if(aussen){ r.x0 = Math.min(r.x0, -aussen - 8); r.y0 = Math.min(r.y0, -aussen - 8); r.y1 = Math.max(r.y1, aussen + 8); r.x1 = Math.max(r.x1, aussen + 8); }
  if(undatiert) r.y0 = Math.min(r.y0, undatiert.y - 18);
  const datiert = alle.length - ohne.length;
  return {punkte, baender, aussen, undatiert, rahmen: r, info: `${datiert.toLocaleString('de-DE')} zeitlich belegt · ${ohne.length.toLocaleString('de-DE')} ohne belegte Zeit · ${alle.length.toLocaleString('de-DE')} Inhalte`};
}

function hintergrund(B, W){
  const x = B.x, cx = B.zuX(0), cy = B.zuY(0);
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(B.w, B.h)); g.addColorStop(0, '#233c4b'); g.addColorStop(.6, '#132838'); g.addColorStop(1, '#0e1c29'); x.fillStyle = g; x.fillRect(0, 0, B.w, B.h);
  for(let i = 0; i < W.baender.length; i++){
    const b = W.baender[i], innen = b.innen * B.s, aussen = b.aussen * B.s;
    x.beginPath(); x.arc(cx, cy, aussen, START, ENDE); x.arc(cx, cy, innen, ENDE, START, true); x.closePath(); x.fillStyle = i % 2 ? '#c9e7df08' : '#c9e7df12'; x.fill();
    x.beginPath(); x.arc(cx, cy, innen - 2 * B.s, START, ENDE); x.strokeStyle = '#b7cfd02b'; x.lineWidth = .6; x.stroke();
    const a = -.445, r = b.mitte * B.s, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    x.save(); x.translate(px, py); x.rotate(a + Math.PI / 2); x.font = `${Math.max(8, Math.min(12, B.s * 5.2))}px system-ui`; x.fillStyle = '#d2d7ca'; x.textAlign = 'center'; x.textBaseline = 'middle';
    if(B.s * (b.aussen - b.innen + 5.5) > 9) x.fillText(b.titel, 0, 0); x.restore();
  }
  if(W.baender.length){
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#e5d9b9'; x.font = 'italic 14px Georgia,serif';
    if(B.s > .65){ x.fillText('Früher', cx, cy - 7); x.font = '9px system-ui'; x.fillStyle = '#aabfc4'; x.fillText('nach außen später', cx, cy + 12); }
    const a = -.445, r = (W.aussen + 5) * B.s;
    x.beginPath(); x.moveTo(cx + Math.cos(a) * 19 * B.s, cy + Math.sin(a) * 19 * B.s); x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.strokeStyle = '#d7b56a50'; x.lineWidth = .8; x.stroke();
  }
  if(W.undatiert){
    const u = W.undatiert, px = B.zuX(u.x - 3), py = B.zuY(u.y - 3), w = (u.breite + 6) * B.s, h = (u.hoehe + 6) * B.s;
    x.fillStyle = '#e7debe09'; x.fillRect(px, py, w, h); x.strokeStyle = '#d9c79a55'; x.lineWidth = .8; x.setLineDash([4, 5]); x.strokeRect(px, py, w, h); x.setLineDash([]);
    x.textAlign = 'left'; x.textBaseline = 'bottom'; x.fillStyle = '#eadfc1'; x.font = `${Math.max(10, Math.min(16, B.s * 8))}px Georgia,serif`; x.fillText('Zeit nicht belegt', px, py - 16);
    x.font = '10px system-ui'; x.fillStyle = '#aebfbe'; x.fillText(`${u.anzahl.toLocaleString('de-DE')} Inhalte · nach Titel geordnet`, px, py - 3);
  }
}

export function starte(el, K){ return kosmischeBuehne(el, K, {name: 'Galaxie', farben, lege: legeGalaxie, hintergrund}); }
