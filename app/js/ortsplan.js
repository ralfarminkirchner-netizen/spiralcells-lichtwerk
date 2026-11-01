/* =====================================================================
   ORTSPLAN — das Dorf als Dorf. Mitte = Marktplatz: Zentrale rund um den Platz. Dach = Viertel an einer eigenen Straße, Bereich = Gasse.
   In jeder Gasse das Älteste an der Straße. Stille Viertel (SEiN, MiNDLAXY) liegen auf den Höhen. Stellen stehen als Bildstöcke am Feldweg, andere Werke ohne Dach als Höfe außerhalb.
   Rechnet nur, speichert nichts. Läuft im Browser und in Node.
   ===================================================================== */
import {dorfBreite, alterVon} from './anlage.js';
import {funktionVon} from './funktion.js';
const STILL = /SEiN|MiNDLAXY/;
export function ortsplan(N, hoehe){ const pos = new Array(N.N), yaw = new Array(N.N).fill(0), seite = new Array(N.N), mitten = new Map(), ziele = new Map(), wege = [], alt = n => alterVon(N.B.monde[n]), nachAlter = l => [...l].sort((a, b) => alt(a) - alt(b)), PL = 9;
  const stelle = (n, x, z, sx, sz) => { pos[n] = [x, 0, z]; seite[n] = [sx, sz]; yaw[n] = Math.atan2(sx, sz); };
  // Platz je Bauwerk: sein Grundstück, Nebenbauten eingerechnet
  const rad = n => { const m = N.B.monde[n], f = funktionVon(N, n), b = dorfBreite(N.rM[n]); if(f === 'bildstock') return 0.9; const lose = m.samen.length > 8 ? Math.ceil(m.samen.length / 6) : 0, reihen = Math.ceil(lose / 5); return Math.max(b * 1.05, 1.5) + (reihen ? 2 + reihen * 0.55 : 0); };
  // Marktplatz: die Zentrale steht rundum, das Rathaus vorn
  const mitte = nachAlter(N.werkeIn('mitte')), vorn = mitte.findIndex(n => funktionVon(N, n) === 'rathaus'); if(vorn > 0) mitte.unshift(mitte.splice(vorn, 1)[0]); const seiten = [[0, -1], [1, 0], [-1, 0], [0, 1]]; mitte.forEach((n, i) => { const s = seiten[i % 4], k = Math.floor(i / 4), v = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 5.2 + (i % 4 && !k ? 0 : 0), d = PL + rad(n) * 0.75 + 0.6; stelle(n, s[0] * d + s[1] * v, s[1] * d + s[0] * v, s[0], s[1]); });
  mitten.set('mitte', [0, 0]); ziele.set('mitte', {mitte: [0, 0, 0], R: PL + 8});
  // Richtungen: jedes Viertel eine, stille Viertel dorthin, wo der Boden am höchsten ist
  const dd = N.daecher.map((_, j) => j).filter(j => N.werkeIn(j).length), zahl = dd.length, ri = dd.map((_, q) => (q + 0.5) / zahl * Math.PI * 2 + 0.3), rH = 34, hoehen = ri.map(a => hoehe(Math.cos(a) * rH, Math.sin(a) * rH)), still = dd.filter(j => STILL.test(N.daecher[j].name)), sonst = dd.filter(j => !STILL.test(N.daecher[j].name)).sort((a, b) => N.werkeIn(b).length - N.werkeIn(a).length), frei = ri.map((_, i) => i).sort((a, b) => hoehen[b] - hoehen[a]), zu = new Map(); still.forEach(j => zu.set(j, frei.shift())); const rest = frei.sort((a, b) => a - b); sonst.forEach(j => zu.set(j, rest.shift()));
  let aussen = PL + 10;
  for(const j of dd){ const th = ri[zu.get(j)], u = [Math.cos(th), Math.sin(th)], v = [-u[1], u[0]], P = (s, q) => [u[0] * s + v[0] * q, u[1] * s + v[1] * q]; let s = PL + 3.5; const gassen = N.daecher[j].bereiche.filter(b => b.werke.length), haupt = [P(0, 0)], lose = N.werkeIn(j).filter(n => !gassen.some(b => b.werke.includes(n)));
    gassen.sort((a, b) => Math.min(...a.werke.map(alt)) - Math.min(...b.werke.map(alt))).forEach((b, gi) => { const li = nachAlter(b.werke); if(li.length <= 2 && gassen.length > 1){ li.forEach((n, i) => { const r = rad(n), sg = i % 2 ? 1 : -1, q = P(s + r, sg * (r + 1.5)); stelle(n, q[0], q[1], v[0] * sg, v[1] * sg); }); s += Math.max(...li.map(rad)) * 2 + 1.5; return; }
      const sg = gi % 2 ? 1 : -1, tiefe = Math.max(...li.map(rad)), mitteS = s + tiefe + 1.6; let q = 2.6; const seitenLauf = [q, q]; li.forEach((n, i) => { const r = rad(n), a = i % 2, l = seitenLauf[a] + r, oben = a ? 1 : -1, w = P(mitteS + oben * (r + 1.1), sg * l); stelle(n, w[0], w[1], u[0] * oben, u[1] * oben); seitenLauf[a] = l + r + 0.5; }); const lang = Math.max(...seitenLauf); wege.push({punkte: [P(mitteS, 0), P(mitteS, sg * lang)], breit: 1.1}); aussen = Math.max(aussen, Math.hypot(mitteS, lang) + tiefe); s = mitteS + tiefe + 1.6; });
    lose.forEach((n, i) => { const r = rad(n), sg = i % 2 ? 1 : -1, q = P(s + r, sg * (r + 1.5)); stelle(n, q[0], q[1], v[0] * sg, v[1] * sg); s += i % 2 ? r * 2 + 0.6 : 0; });
    haupt.push(P(s + 1, 0)); wege.push({punkte: haupt, breit: 1.9, dach: j}); aussen = Math.max(aussen, s + 3); const m = P(s * 0.62, 0); mitten.set(j, m); ziele.set(j, {mitte: [m[0], 0, m[1]], R: Math.max(9, s * 0.55)}); }
  // Der Feldweg um den Ort: an ihm die Bildstöcke; weiter draußen die Höfe ohne Dach
  const ohne = nachAlter(N.werkeIn('ohne')), RF = aussen + 5, stoecke = ohne.filter(n => funktionVon(N, n) === 'bildstock'), hoefe = ohne.filter(n => funktionVon(N, n) !== 'bildstock'); wege.push({punkte: Array.from({length: 97}, (_, i) => { const a = i / 96 * Math.PI * 2, w = RF + Math.sin(a * 5) * 1.6; return [Math.cos(a) * w, Math.sin(a) * w]; }), breit: 0.9}); stoecke.forEach((n, i) => { const a = i / stoecke.length * Math.PI * 2 + 0.2, w = RF + Math.sin(a * 5) * 1.6 + 1.3; stelle(n, Math.cos(a) * w, Math.sin(a) * w, Math.cos(a), Math.sin(a)); });
  hoefe.forEach((n, i) => { const a = i * 2.39996 + 1, r = RF + 7 + 3.2 * Math.sqrt(i + 1) * 2; stelle(n, Math.cos(a) * r, Math.sin(a) * r, Math.cos(a), Math.sin(a)); }); if(ohne.length){ const n = ohne[Math.floor(ohne.length / 2)]; mitten.set('ohne', [pos[n][0], pos[n][2]]); ziele.set('ohne', {mitte: [0, 0, 0], R: RF + 20}); }
  for(let n = 0; n < N.N; n++) if(!pos[n]) stelle(n, RF + 3, 0, 1, 0);
  return {pos, yaw, seite, mitten, ziele, wege, R: RF, platz: PL}; }
