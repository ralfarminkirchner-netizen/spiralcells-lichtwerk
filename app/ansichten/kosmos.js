import {kosmischeBuehne, rahmen} from './kosmisch-basis.js';

export const legende = '<span>Ein Bildkörper ist ein Ort oder ein Werk. Seine Umlaufbahn zeigt die direkte Zugehörigkeit. Antippen führt eine Ebene hinein.</span>';
const TAU = Math.PI * 2;
const farben = {hintergrund: '#f0eee6', text: '#183849', leise: '#667a80', linie: '#788b8d55', rand: '#fcfaf3', akzent: '#b96e35', glas: '#f8f5eede', tooltip: '#173749', tooltipText: '#fffaf0'};

export function legeKosmos(q){
  const punkte = [{q, x: 0, y: 0, r: 28, label: true, zentrum: true}], ringe = [];
  const kinder = q.kinder || []; let i = 0, ring = 0;
  while(i < kinder.length){
    const radius = 94 + ring * 72, kapazitaet = Math.max(9, Math.floor(TAU * radius / 62));
    const anzahl = Math.min(kinder.length - i, kapazitaet), start = -Math.PI / 2 + (ring % 2 ? .16 : 0);
    ringe.push(radius);
    for(let j = 0; j < anzahl; j++, i++){
      const k = kinder[i], winkel = start + j / anzahl * TAU;
      const r = k.kinder ? 17 + Math.min(5, Math.log2(1 + k.blaetter) * .55) : 17;
      punkte.push({q: k, x: Math.cos(winkel) * radius, y: Math.sin(winkel) * radius, r, label: true, winkel});
    }
    ring++;
  }
  const r = rahmen(punkte, 23); r.y1 += 14;
  return {punkte, ringe, rahmen: r, info: kinder.length ? `${kinder.length.toLocaleString('de-DE')} direkte Inhalte · Innen der gewählte Ort, außen seine Werke` : 'Der gewählte Inhalt im Mittelpunkt'};
}

function hintergrund(B, W){
  const x = B.x, cx = B.zuX(0), cy = B.zuY(0);
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(B.w, B.h) * .7); g.addColorStop(0, '#fffdf5'); g.addColorStop(1, '#e6eae5'); x.fillStyle = g; x.fillRect(0, 0, B.w, B.h);
  for(let i = 0; i < W.ringe.length; i++){
    const r = W.ringe[i] * B.s;
    x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.strokeStyle = '#637c8150'; x.lineWidth = .8; x.stroke();
    x.beginPath(); x.arc(cx, cy, r + 5, .16, 1.33); x.strokeStyle = '#b58c5648'; x.lineWidth = 1; x.stroke();
    for(let j = 0; j < 48; j++){
      const a = j / 48 * TAU, d = j % 4 ? 2 : 5;
      x.beginPath(); x.moveTo(cx + Math.cos(a) * (r - d), cy + Math.sin(a) * (r - d)); x.lineTo(cx + Math.cos(a) * (r + d), cy + Math.sin(a) * (r + d)); x.strokeStyle = '#63808732'; x.lineWidth = .6; x.stroke();
    }
  }
  for(const p of W.punkte.slice(1)){
    const d = Math.hypot(p.x, p.y), a = p.winkel;
    x.beginPath(); x.moveTo(cx + Math.cos(a) * 35 * B.s, cy + Math.sin(a) * 35 * B.s); x.lineTo(cx + Math.cos(a) * (d - p.r - 6) * B.s, cy + Math.sin(a) * (d - p.r - 6) * B.s);
    x.strokeStyle = '#607d8322'; x.lineWidth = .7; x.stroke();
  }
  x.textAlign = 'center'; x.textBaseline = 'bottom'; x.font = '10px system-ui'; x.fillStyle = '#667b80';
  if(B.w >= 600 && B.s > .75) x.fillText('IM MITTELPUNKT', cx, cy - 28 * B.s - 12);
}

export function starte(el, K){ return kosmischeBuehne(el, K, {name: 'Kosmos', farben, lege: legeKosmos, hintergrund}); }
