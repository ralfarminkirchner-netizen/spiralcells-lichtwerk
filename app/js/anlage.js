/* =====================================================================
   ANLAGE — jede Welt hat ihre eigene Ordnung im Raum; übertragen wird der Mechanismus, nicht das Bild.
   Der Bürokomplex liegt im strengen Raster, Straße für Straße ein Dach. Die Zahl der Etagen ist die Arbeit,
   unten das Älteste: die Zeit steigt in jedem Gebäude von unten nach oben.
   Rechnet nur, speichert nichts. Läuft im Browser und in Node.
   ===================================================================== */
export function orteFuer(N, stil){
  const c = N._orte || (N._orte = {}); if(c[stil]) return c[stil];
  if(stil !== 'buero') return c[stil] = {pos: N.pos, mitten: null};
  const bezirke = ['mitte', ...N.daecher.map((_, j) => j), ...(N.baum.ohne.length ? ['ohne'] : [])], breit = Math.ceil(Math.sqrt(N.N * 1.25)), zelle = 6.4, gasse = 9.5, pos = new Array(N.N), mitten = new Map(); let z = 0;
  for(const b of bezirke){ const werke = N.werkeIn(b); if(!werke.length) continue; const reihen = Math.ceil(werke.length / breit); werke.forEach((n, i) => { const sp = i % breit, re = Math.floor(i / breit); pos[n] = [(sp - (Math.min(breit, werke.length) - 1) / 2) * zelle, 0, z + re * gasse]; }); mitten.set(b, [0, z + (reihen - 1) * gasse / 2]); z += reihen * gasse + 4; }
  for(let n = 0; n < N.N; n++) if(!pos[n]) pos[n] = [0, 0, z];
  const mz = z / 2; for(const p of pos) p[2] -= mz; for(const m of mitten.values()) m[1] -= mz;
  return c[stil] = {pos, mitten};
}
/* Die Etagen eines Werks: unten das Älteste. Ihre Zahl ist die geleistete Arbeit; je Etage die Fassungen eines Zeitabschnitts */
export function etagen(m, ar = 0.5, hoechstens = 16){
  const ord = m.samen.map((_, i) => i).sort((a, b) => (m.samen[a].zeit || 0) - (m.samen[b].zeit || 0)), n = ord.length; if(!n) return [];
  const F = Math.min(n, Math.max(1, Math.round(1 + (hoechstens - 1) * ar * ar * 1.25))), tag = t => t ? new Date(t).toISOString().slice(0, 10) : 'ohne Datum', raus = [];
  for(let k = 0; k < F; k++){ const li = ord.slice(Math.floor(k * n / F), Math.floor((k + 1) * n / F)); raus.push({von: tag(m.samen[li[0]].zeit), bis: tag(m.samen[li[li.length - 1]].zeit), fassungen: li}); }
  return raus;
}
