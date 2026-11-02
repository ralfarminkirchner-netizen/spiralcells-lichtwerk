/* =====================================================================
   DORFBAU — die Bauform des Dorfs, einmal gerechnet, für jede Engine gleich.
   Hier steht jedes Maß: Haus, Stockwerk, jedes Fenster (= genau eine Fassung), jede Tür (= Ausgangsfrage),
   Beiwerk, Plätze, Wege, Bäume. Eine Engine setzt nur Stoffe und Modelle auf diese Maße und erfindet nichts dazu.
   Koordinaten: Meter, rechtshändig, y nach oben, Drehung um y im Bogenmaß.
   Unreal (Zentimeter, z nach oben, linkshändig): X = x·100, Y = z·100, Z = y·100, Gier = −drehung.
   ===================================================================== */
export const DORF = {massstab: 2.6, stockhoehe: 3.2, sockel: 0.5, fensterabstand: 1.8, fenster: {breite: 1.0, hoehe: 1.4, bruestung: 1.0}, tuer: {breite: 1.3, hoehe: 2.3, abstand: 1.6},
  dach: {form: 'satteldach', neigung: 36, ueberstand: 0.45}, logofarben: ['#bd182a', '#e25e2b', '#ffce05', '#44a735', '#3da6da']};
const r3 = v => Math.round(v * 1000) / 1000;
// Punkt im Haus (lx nach rechts, lz nach vorn) → Welt
const welt = (h, lx, lz) => { const c = Math.cos(h.drehung), s = Math.sin(h.drehung); return [r3(h.x + c * lx + s * lz), r3(h.z - s * lx + c * lz)]; };

// Zwei gedrehte Grundrisse (mit Abstand) überlappen? Trennende Achsen
export function ueberlappen(a, b, rand = 1.5){ const ecken = h => { const c = Math.cos(h.drehung), s = Math.sin(h.drehung), x = h.breite / 2 + rand / 2, z = h.tiefe / 2 + rand / 2; return [[-x, -z], [x, -z], [x, z], [-x, z]].map(([u, v]) => [h.x + c * u + s * v, h.z - s * u + c * v]); };
  const A = ecken(a), B = ecken(b); for(const P of [A, B]) for(let i = 0; i < 4; i++){ const [x1, z1] = P[i], [x2, z2] = P[(i + 1) % 4], nx = z1 - z2, nz = x2 - x1, pa = A.map(([x, z]) => x * nx + z * nz), pb = B.map(([x, z]) => x * nx + z * nz);
    if(Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false; } return true; }

export function dorfBau(W){
  // Der Ortsplan gibt die Ordnung, die Häuser ihre echten Maße. Wo zwei sich berühren, rücken beide auseinander, bis keins ein anderes berührt; die Ordnung bleibt
  const m = 3, roh = baue(W, m), ids = Object.keys(roh.haeuser), h = ids.map(id => ({...roh.haeuser[id]}));
  for(let runde = 0; runde < 400; runde++){ let bewegt = false;
    for(let i = 0; i < h.length; i++) for(let j = i + 1; j < h.length; j++){ if(!ueberlappen(h[i], h[j])) continue; bewegt = true;
      let dx = h[j].x - h[i].x, dz = h[j].z - h[i].z, L = Math.hypot(dx, dz); if(L < 1e-6){ dx = 1; dz = 0; L = 1; } const s = 0.6;
      h[i].x -= dx / L * s; h[i].z -= dz / L * s; h[j].x += dx / L * s; h[j].z += dz / L * s; }
    if(!bewegt) return baue(W, m, new Map(ids.map((id, k) => [id, [h[k].x, h[k].z]]))); }
  throw new Error('Häuser lassen sich nicht ohne Überlappung stellen');
}
function baue(W, massstab, lagen = new Map()){
  const D = {...DORF, massstab}, haeuser = {}, plaetze = [], wege = [], laternen = [], baeume = [];
  for(const w of W.werke){ if(!w.dorf) continue;
    const stock = w.dorf.stockwerke, pro = Array.from({length: stock}, () => []); w.fassungen.forEach(f => pro[f.dorfEtage].push(f));
    const meist = Math.max(1, ...pro.map(l => l.length)), T = meist > 24 ? 8.4 : 6.6, a = D.fensterabstand;
    // höchstens vier Stockwerke: das Haus wird mit der Arbeit länger, bis jede Fassung ihr Fenster hat (vorn bleibt Platz für die Tür)
    const plaetzeBei = b => 2 * Math.max(1, Math.floor((b - 1) / a)) + 2 * Math.max(1, Math.floor((T - 1) / a)) - 1;
    let B = 7.2; while(plaetzeBei(B) < meist) B += a;
    const l = lagen.get(w.id), h = {x: r3(l ? l[0] : w.dorf.x * D.massstab), z: r3(l ? l[1] : w.dorf.z * D.massstab), drehung: w.dorf.drehung, breite: r3(B), tiefe: T, stockwerke: stock, hoehe: r3(D.sockel + stock * D.stockhoehe),
      wand: w.funktion.schluessel, fenster: [], tueren: [], beiwerk: []};
    // Seiten in fester Folge: vorn, hinten, rechts, links; jede mit ihrer Blickrichtung
    const seiten = [[0, T / 2, 0, B], [0, -T / 2, Math.PI, B], [B / 2, 0, Math.PI / 2, T], [-B / 2, 0, -Math.PI / 2, T]];
    pro.forEach((liste, k) => { const pl = [];
      seiten.forEach(([sx, sz, dreh, len], s) => { const n = Math.max(1, Math.floor((len - 1) / a)); for(let j = 0; j < n; j++){ const u = (j - (n - 1) / 2) * a; if(k === 0 && s === 0 && Math.abs(u) < 1.4) continue; pl.push({lx: sx + Math.cos(dreh) * u, lz: sz - Math.sin(dreh) * u, dreh}); } });
      if(liste.length > pl.length) throw new Error(`${w.titel}: zu wenig Fensterplätze`);
      liste.forEach((f, i) => { const p = pl[i], [x, z] = welt(h, p.lx, p.lz); h.fenster.push({fassung: f.id, stockwerk: k, licht: f.status, x, y: r3(D.sockel + k * D.stockhoehe + D.fenster.bruestung), z, drehung: r3(h.drehung + p.dreh)}); }); });
    w.ausgang.forEach((g, i) => { const [x, z] = welt(h, (i - (w.ausgang.length - 1) / 2) * D.tuer.abstand, T / 2); h.tueren.push({ausgang: g.id, x, y: D.sockel, z, drehung: h.drehung}); });
    const bei = (art, lx, lz, mehr = {}) => { const [x, z] = welt(h, lx, lz); h.beiwerk.push({art, x, z, drehung: r3(h.drehung + (mehr.dreh || 0)), ...mehr, dreh: undefined}); };
    const f = w.funktion.schluessel;
    if(f === 'schularchiv') bei('modell:wooden_bookshelf_worn', B / 2 + 1.3, T / 2 + 0.8, {dreh: -Math.PI / 2, groesse: 0.9});
    if(f === 'spielhof'){ bei('modell:rubber_duck_toy', 2, T / 2 + 2.5, {dreh: 0.6, groesse: 3}); bei('modell:painted_wooden_bench', -2.2, T / 2 + 2.6); }
    if(f === 'musik'){ const r = r3(Math.min(B, T) * 0.42); bei('rundhalle', B / 2 + r * 0.7, 0, {radius: r, hoehe: r3(Math.min(h.hoehe, 4.2))}); bei('modell:portable_cassette_player', B / 2 + r * 1.9, T / 2 + 1, {dreh: 0.4, groesse: 2}); }
    bei('modell:planter_box_01', B / 2 - 0.6, T / 2 + 1.1);
    haeuser[w.id] = h; }

  // Je Dach ein Platz am ältesten Werk, Wege von dort zu jedem Werk des Dachs; Laterne an jedem zweiten Weg
  for(const d of W.daecher){ const ws = d.werke.map(id => W.werke.find(w => w.id === id)).filter(w => haeuser[w.id]).sort((a, b) => a.rang - b.rang); if(!ws.length || d.name === 'ohne Dach') continue;
    const m = haeuser[ws[0].id], r = r3(Math.min(16, 8 + ws.length)); plaetze.push({dach: d.name, x: m.x, z: m.z, radius: r});
    ws.slice(1).forEach((w, i) => { const p = haeuser[w.id]; wege.push({dach: d.name, von: [m.x, m.z], nach: [p.x, p.z], breite: 2.4});
      if(i % 2){ const dx = p.x - m.x, dz = p.z - m.z, L = Math.hypot(dx, dz) || 1; laternen.push({x: r3((m.x + p.x) / 2 + dz / L * 1.8), z: r3((m.z + p.z) / 2 - dx / L * 1.8), drehung: r3(Math.atan2(dx, dz))}); } }); }
  // FASKA: die älteste Schule des Dachs trägt die Logotafel, davor fünf Fahnen in den Logofarben und die Schultafel
  const faska = W.daecher.find(d => d.name === 'FASKA'), schule = faska && faska.werke.map(id => W.werke.find(w => w.id === id)).filter(w => w.funktion.schluessel === 'schule').sort((a, b) => a.rang - b.rang)[0];
  if(schule){ const h = haeuser[schule.id], at = (lx, lz) => welt(h, lx, lz);
    { const [x, z] = at(0, h.tiefe / 2 + 0.95); h.beiwerk.push({art: 'logotafel', zeichen: 'faska', breite: 4.2, hoehe: 1.24, x, y: r3(DORF.sockel + 2.85), z, drehung: h.drehung}); }
    D.logofarben.forEach((farbe, i) => { const [x, z] = at(-h.breite / 2 - 1.2 - i * 1.5, h.tiefe / 2 + 3.2); h.beiwerk.push({art: 'fahne', farbe, x, z, mast: 7, drehung: h.drehung}); });
    { const [x, z] = at(h.breite / 2 + 1.5, h.tiefe / 2 + 2); h.beiwerk.push({art: 'modell:standing_chalkboard_01', x, z, drehung: r3(h.drehung - 0.5)}); } }
  // Bäume sind Grund und tragen nichts: feste Plätze, nie auf einem Haus, Platz oder Weg
  const hs = Object.values(haeuser), frei = (x, z) => hs.every(h => Math.hypot(x - h.x, z - h.z) > Math.max(h.breite, h.tiefe) * 0.7 + 4) && plaetze.every(p => Math.hypot(x - p.x, z - p.z) > p.radius + 3)
    && wege.every(g => { const [ax, az] = g.von, [bx, bz] = g.nach, dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - ax - t * dx, z - az - t * dz) > 3; });
  let s = 1; const zufall = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const xs = hs.map(h => h.x), zs = hs.map(h => h.z), x0 = Math.min(...xs) - 60, x1 = Math.max(...xs) + 60, z0 = Math.min(...zs) - 60, z1 = Math.max(...zs) + 60;
  for(let k = 0; k < 6000 && baeume.length < 420; k++){ const x = x0 + zufall() * (x1 - x0), z = z0 + zufall() * (z1 - z0), art = zufall() < 0.72 ? 'modell:tree_small_02' : 'modell:shrub_02', dreh = zufall() * 6, gr = art.endsWith('tree_small_02') ? 2.0 + zufall() * 1.5 : 1.4 + zufall() * 0.8;
    if(frei(x, z)) baeume.push({art, x: r3(x), z: r3(z), drehung: r3(dreh), groesse: r3(gr)}); }
  return {regeln: D, haeuser, plaetze, wege, laternen, baeume};
}
