/* =====================================================================
   ANLAGE — jede Welt hat ihre eigene Ordnung im Raum; übertragen wird der Mechanismus, nicht das Bild.
   Der Bürokomplex liegt im strengen Raster, Straße für Straße ein Dach. Das Dorf wächst vom Platz aus: je Dach eine Straße, die sich
   als Spirale nach außen windet, an ihr die Häuser nach Alter; ohne Dach = verstreute Höfe jenseits der Straßen. Die Zahl der Etagen ist die Arbeit,
   unten das Älteste: die Zeit steigt in jedem Gebäude von unten nach oben.
   Rechnet nur, speichert nichts. Läuft im Browser und in Node.
   ===================================================================== */
export function orteFuer(N, stil){
  const c = N._orte || (N._orte = {}); if(c[stil]) return c[stil];
  if(stil === 'dorf') return c[stil] = dorfLage(N);
  if(stil !== 'buero') return c[stil] = {pos: N.pos, mitten: null, ziele: null};
  const bezirke = ['mitte', ...N.daecher.map((_, j) => j), ...(N.baum.ohne.length ? ['ohne'] : [])], breit = Math.ceil(Math.sqrt(N.N * 1.25)), zelle = 6.4, gasse = 9.5, pos = new Array(N.N), mitten = new Map(), ziele = new Map(); let z = 0;
  for(const b of bezirke){ const werke = N.werkeIn(b); if(!werke.length) continue; const reihen = Math.ceil(werke.length / breit); werke.forEach((n, i) => { const sp = i % breit, re = Math.floor(i / breit); pos[n] = [(sp - (Math.min(breit, werke.length) - 1) / 2) * zelle, 0, z + re * gasse]; }); mitten.set(b, [0, z + (reihen - 1) * gasse / 2]); ziele.set(b, {mitte: [0, 0, z + (reihen - 1) * gasse / 2], R: Math.max(Math.min(breit, werke.length) * zelle, reihen * gasse) * 0.5 + 3}); z += reihen * gasse + 4; }
  for(let n = 0; n < N.N; n++) if(!pos[n]) pos[n] = [0, 0, z];
  const mz = z / 2; for(const p of pos) p[2] -= mz; for(const m of mitten.values()) m[1] -= mz; for(const q of ziele.values()) q.mitte[2] -= mz;
  return c[stil] = {pos, mitten, ziele};
}
export const dorfBreite = rM => 1.75 * Math.pow(rM, 0.55);
export const alterVon = m => m.samen.reduce((a, s) => Math.min(a, s.zeit || Infinity), Infinity);
/* Das Dorf: Platz in der Mitte, von ihm gehen die Straßen der Dächer aus, die Ältesten zuerst und nah am Platz */
function dorfLage(N){
  const pos = new Array(N.N), yaw = new Array(N.N).fill(0), seite = new Array(N.N), mitten = new Map(), ziele = new Map(), wege = [], alt = n => alterVon(N.B.monde[n]), nachAlter = l => [...l].sort((a, b) => alt(a) - alt(b)), breit = n => dorfBreite(N.rM[n]), PLATZ = 6.2;
  const mitte = nachAlter(N.werkeIn('mitte')), ringR = Math.max(PLATZ + 1.6, mitte.reduce((a, n) => a + breit(n) + 1.2, 0) / (Math.PI * 2)); mitte.forEach((n, i) => { const a = i / mitte.length * Math.PI * 2; pos[n] = [Math.cos(a) * ringR, 0, Math.sin(a) * ringR]; seite[n] = [Math.cos(a), Math.sin(a)]; yaw[n] = Math.atan2(Math.cos(a), Math.sin(a)); });
  mitten.set('mitte', [0, 0]); ziele.set('mitte', {mitte: [0, 0, 0], R: ringR + 5}); wege.push({punkte: Array.from({length: 49}, (_, i) => { const a = i / 48 * Math.PI * 2; return [Math.cos(a) * (ringR - 1.6), Math.sin(a) * (ringR - 1.6)]; }), n: mitte[0] ?? 0});
  const daecher = N.daecher.map((_, j) => j).filter(j => N.werkeIn(j).length).sort((a, b) => Math.min(...N.werkeIn(a).map(alt)) - Math.min(...N.werkeIn(b).map(alt))), gew = daecher.map(j => Math.sqrt(N.werkeIn(j).length)), summe = gew.reduce((a, b) => a + b, 0) || 1, r0 = ringR + 4; let winkel = 0.4, aussen = r0;
  daecher.forEach((j, q) => { const liste = nachAlter(N.werkeIn(j)), th0 = winkel + gew[q] / summe * Math.PI; winkel += gew[q] / summe * Math.PI * 2;
    const punkt = s => { const r = r0 + s * 0.82, th = th0 + Math.log(r / r0) * 1.05; return [Math.cos(th) * r, Math.sin(th) * r]; }; let s = 1.5; const halbe = []; liste.forEach((n, i) => { const a = punkt(s), b = punkt(s + 0.1), tx = (b[0] - a[0]) * 10, tz = (b[1] - a[1]) * 10, l = Math.hypot(tx, tz), ux = tx / l, uz = tz / l, sei = i % 2 ? 1 : -1, nx = -uz * sei, nz = ux * sei, ab = 1.45 + breit(n) * 0.36; pos[n] = [a[0] + nx * ab, 0, a[1] + nz * ab]; seite[n] = [nx, nz]; yaw[n] = Math.atan2(-uz, ux); s += (breit(n) + 1.1) * 0.6; halbe.push(a); });
    const P = []; for(let t = -2.2; t <= s; t += 0.7) P.push(punkt(Math.max(-2.2, t))); P.unshift([Math.cos(th0) * (ringR - 1.6), Math.sin(th0) * (ringR - 1.6)]); wege.push({punkte: P, n: liste[0]}); aussen = Math.max(aussen, r0 + s * 0.82);
    const m = punkt(s * 0.5); mitten.set(j, m); ziele.set(j, {mitte: [m[0], 0, m[1]], R: Math.max(7, s * 0.55)}); });
  // Ohne Dach: verstreute Höfe jenseits der Straßen, ohne Weg; je älter, desto näher
  const ohne = nachAlter(N.werkeIn('ohne')); ohne.forEach((n, i) => { const r = Math.sqrt((aussen + 5) ** 2 + 22 * (i + 1)), a = i * 2.39996 + 1; pos[n] = [Math.cos(a) * r, 0, Math.sin(a) * r]; seite[n] = [Math.cos(a), Math.sin(a)]; yaw[n] = a * 1.7; });
  if(ohne.length){ const m = pos[ohne[Math.floor(ohne.length / 2)]]; mitten.set('ohne', [m[0], m[2]]); ziele.set('ohne', {mitte: [0, 0, 0], R: Math.hypot(pos[ohne[ohne.length - 1]][0], pos[ohne[ohne.length - 1]][2]) + 2}); }
  for(let n = 0; n < N.N; n++) if(!pos[n]){ pos[n] = [ringR, 0, 0]; seite[n] = [1, 0]; }
  return {pos, yaw, seite, mitten, ziele, wege, R: aussen};
}
/* Teilt die Fassungen eines Werks nach Abstammung: 0 der Hauptstrang, dann Gabeln, negativ die Fassungen ohne belegte Herkunft (je sechs ein Schuppen) */
export function bauteile(W, zahl){ const lose = i => W.art[i] === 'frei' || W.art[i] === 'reihe', teil = new Int32Array(zahl), anbauten = []; let schuppen = 0;
  for(let i = 0; i < zahl; i++){ if(lose(i)){ teil[i] = -1 - Math.floor(schuppen++ / 6); continue; }
    if(W.art[i] === 'gabel'){ anbauten.push(i); teil[i] = anbauten.length; continue; }
    const p = W.eltern[i]; teil[i] = p >= 0 && !lose(p) ? teil[p] : 0; }
  return {teil, anbauten, schuppen: Math.ceil(schuppen / 6)}; }
/* Die Etagen eines Werks: unten das Älteste. Ihre Zahl ist die geleistete Arbeit; je Etage die Fassungen eines Zeitabschnitts */
export function etagen(m, ar = 0.5, hoechstens = 16){
  const ord = m.samen.map((_, i) => i).sort((a, b) => (m.samen[a].zeit || 0) - (m.samen[b].zeit || 0)), n = ord.length; if(!n) return [];
  const F = Math.min(n, hoechstens, Math.max(1, Math.round(1 + (hoechstens - 1) * ar * ar * 1.25))), tag = t => t ? new Date(t).toISOString().slice(0, 10) : 'ohne Datum', tagS = s => s.saum ? 'ohne Datum' : tag(s.zeit), raus = [];   // der Saum hat kein Datum
  for(let k = 0; k < F; k++){ const li = ord.slice(Math.floor(k * n / F), Math.floor((k + 1) * n / F)); raus.push({von: tagS(m.samen[li[0]]), bis: tagS(m.samen[li[li.length - 1]]), fassungen: li}); }
  return raus;
}
