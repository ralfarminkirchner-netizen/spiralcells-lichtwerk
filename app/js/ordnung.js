/* =====================================================================
   ORDNUNG — Ralfs System, wie es ist: die Zentrale als Mitte, darum die Dächer
   (große Überordner wie FASKA), darin Bereiche, darin die Werke.
   Lesematerial (Auszüge, Artikel) ist kein Werk unter Werken: es hängt an dem,
   woraus es stammt oder worin es eingeht.
   Die Zuordnung steht in /lichtwerk/ordnung (ordnung.json im Lichtwerk), belegt aus
   Ralfs eigenen Quellen und von ihm zu bestätigen. Ein Werk ohne Zuordnung bleibt
   sichtbar „ohne Dach“, nie in einem geratenen.
   Rechnet nur, speichert nichts. Läuft im Browser und in Node.
   ===================================================================== */

const GOLD = 137.50776 * Math.PI / 180;

/* Ein Werk wiedererkennen: über seinen Quellordner, sonst über den Titel (beides lesbar, beides stabil bei Neuimport) */
export function werkSchluessel(w){
  const loc = String(((w && w.source_ref) || {}).locator || '').split('#')[0].replace(/\/+$/, '');
  if(loc && !/^https?:/.test(loc) && !/hosted-sources\.json$/.test(loc)) return 'ordner:' + loc;
  return 'titel:' + String((w && w.title) || '').trim().toLowerCase();
}

/* Baut aus Bestand und Ordnungsdatei den Baum. Jeder Mond steht genau einmal. */
export function ordne(B, O){
  const monde = B.monde, schl = new Map();
  const merke = (k, i) => { if(!schl.has(k)) schl.set(k, []); schl.get(k).push(i); };
  monde.forEach((m, i) => { const k = werkSchluessel(m.werk); merke(k, i); if(k.startsWith('ordner:')) merke('titel:' + String(m.werk.title || '').trim().toLowerCase(), i); });   // auch über den Titel auffindbar
  const key = ref => ref.startsWith('ordner:') || ref.startsWith('titel:') ? ref : 'titel:' + ref.trim().toLowerCase();
  const vergeben = new Set(), finde = ref => {
    const kandidaten = (schl.get(key(ref)) || []).filter(i => !vergeben.has(i)); if(!kandidaten.length) return -1;
    vergeben.add(kandidaten[0]); return kandidaten[0]; };
  const suche = ref => { const c = schl.get(key(ref)) || []; return c.length ? c[0] : -1; };   // nur nachsehen, nichts vergeben
  const fehlt = [];
  const liste = refs => (refs || []).map(r => { const i = finde(typeof r === 'string' ? r : r.werk); if(i < 0) fehlt.push(typeof r === 'string' ? r : r.werk); return i; }).filter(i => i >= 0);
  const o = O || {};
  const mitte = {name: (o.mitte && o.mitte.name) || 'Zentrale', satz: (o.mitte && o.mitte.satz) || '', werke: liste(o.mitte && o.mitte.werke)};
  const daecher = (o.daecher || []).map(d => ({name: d.name, satz: d.satz || '', bereiche: (d.bereiche || []).map(b => ({name: b.name, satz: b.satz || '', werke: liste(b.werke)})).filter(b => b.werke.length)}))
    .filter(d => d.bereiche.length);
  // Lesematerial: an einem Werk (dann wandert es mit ihm) oder an einem Dach
  const material = new Map();   // Mondindex → Ziel {werk: i} | {dach: name}
  for(const q of o.material || []){ const i = finde(q.werk); if(i < 0){ fehlt.push(q.werk); continue; }
    const ziel = q.an ? suche(q.an) : -1;
    material.set(i, ziel >= 0 && ziel !== i ? {werk: ziel} : {dach: q.dach || null}); }
  const ohne = monde.map((_, i) => i).filter(i => !vergeben.has(i));
  // Rückverweis: wo steht jeder Mond?
  const ort = new Array(monde.length).fill(null);
  mitte.werke.forEach(i => { ort[i] = {ebene: 'mitte'}; });
  daecher.forEach((d, di) => d.bereiche.forEach((b, bi) => b.werke.forEach(i => { ort[i] = {ebene: 'dach', dach: di, bereich: bi}; })));
  for(const [i, z] of material) ort[i] = {ebene: 'material', ...z};
  ohne.forEach(i => { ort[i] = {ebene: 'ohne'}; });
  return {mitte, daecher, material, ohne, ort, fehlt, bestaetigt: !!o.bestaetigt, stand: o.stand || null};
}

/* ------------------------------------------------------------- Lage im Raum
   Kreise packen: erst die Werke eines Bereichs (Phyllotaxis, ältestes innen), dann die Bereiche
   eines Dachs, dann die Dächer um die Mitte. Radien in Weltmaß; groß heißt: viel darin. */
function phyllo(radien, gap){
  // Kreise nach goldenem Winkel nach außen legen, ohne Überlappung (gierig, dann sanft entspannen)
  const n = radien.length, pos = [];
  for(let k = 0; k < n; k++){
    const a = k * GOLD; let d = k === 0 ? 0 : radien[0] * 0.2;
    for(let t = 0; t < 400; t++){ const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if(pos.every((p, j) => Math.hypot(p[0] - x, p[1] - z) >= radien[j] + radien[k] + gap)) { pos.push([x, z]); break; }
      d += Math.max(0.02, radien[k] * 0.12); if(t === 399) pos.push([x, z]); }
  }
  let R = 0; pos.forEach((p, k) => { R = Math.max(R, Math.hypot(p[0], p[1]) + radien[k]); });
  return {pos, R: R + gap * 0.5};
}

export function lage(baum, rWerk, opt = {}){
  const gapW = opt.gapWerk ?? 0.35, gapB = opt.gapBereich ?? 0.8, gapD = opt.gapDach ?? 2.2;
  const pos = new Array(rWerk.length).fill(null);
  const bereichsKreis = werke => { const ord = werke.slice(); const r = ord.map(i => rWerk[i]); const p = phyllo(r, gapW); return {werke: ord, rel: p.pos, R: Math.max(p.R, 0.8)}; };
  // Mitte
  const mk = bereichsKreis(baum.mitte.werke), Rm = Math.max(3.2, mk.R * 1.25);
  // Dächer: Bereiche als Kreise im Dach
  const dk = baum.daecher.map(d => { const bs = d.bereiche.map(b => bereichsKreis(b.werke)); const p = phyllo(bs.map(b => b.R), gapB); return {bs, rel: p.pos, R: p.R + 0.6}; });
  // Dächer um die Mitte: größtes zuerst, dann im goldenen Winkel nach außen
  const ordnungD = dk.map((_, j) => j).sort((a, b) => dk[b].R - dk[a].R), D = [], gesetzt = [];
  for(const j of ordnungD){
    const k = gesetzt.length, a = k * GOLD + 0.4; let d = Rm + dk[j].R + gapD;
    for(let t = 0; t < 600; t++){ const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if(gesetzt.every(q => Math.hypot(D[q][0] - x, D[q][1] - z) >= dk[q].R + dk[j].R + gapD)){ D[j] = [x, z]; break; }
      d += 0.25; if(t === 599) D[j] = [x, z]; }
    gesetzt.push(j);
  }
  // Ohne Dach: ein loser Kranz außen, ehrlich abgesetzt
  let Rall = Rm; dk.forEach((x, j) => { Rall = Math.max(Rall, Math.hypot(D[j][0], D[j][1]) + x.R); });
  const ohneK = bereichsKreis(baum.ohne);
  const ohneMitte = [0, 0]; if(baum.ohne.length){ const a = -Math.PI / 2; ohneMitte[0] = Math.cos(a) * (Rall + ohneK.R + gapD); ohneMitte[1] = Math.sin(a) * (Rall + ohneK.R + gapD); Rall = Math.hypot(...ohneMitte) + ohneK.R; }
  const y = opt.hoehe ?? 0;
  mk.werke.forEach((i, k) => { pos[i] = [mk.rel[k][0], y, mk.rel[k][1]]; });
  const daecher = dk.map((x, j) => { const c = D[j];
    const bereiche = x.bs.map((b, bi) => { const bc = [c[0] + x.rel[bi][0], c[1] + x.rel[bi][1]]; b.werke.forEach((i, k) => { pos[i] = [bc[0] + b.rel[k][0], y, bc[1] + b.rel[k][1]]; }); return {mitte: [bc[0], y, bc[1]], R: b.R}; });
    return {mitte: [c[0], y, c[1]], R: x.R, bereiche}; });
  ohneK.werke.forEach((i, k) => { pos[i] = [ohneMitte[0] + ohneK.rel[k][0], y, ohneMitte[1] + ohneK.rel[k][1]]; });
  // Lesematerial sitzt dicht an seinem Werk, sonst am Rand seines Dachs
  for(const [i, z] of baum.material){
    if(z.werk != null && pos[z.werk]){ const p = pos[z.werk], a = i * GOLD; pos[i] = [p[0] + Math.cos(a) * (rWerk[z.werk] + 0.25), y, p[2] + Math.sin(a) * (rWerk[z.werk] + 0.25)]; }
    else { const dj = baum.daecher.findIndex(d => d.name === z.dach); const c = dj >= 0 ? daecher[dj] : {mitte: [ohneMitte[0], y, ohneMitte[1]], R: ohneK.R}; const a = i * GOLD; pos[i] = [c.mitte[0] + Math.cos(a) * c.R * 0.92, y, c.mitte[2] + Math.sin(a) * c.R * 0.92]; }
  }
  return {pos, mitte: {mitte: [0, y, 0], R: Rm}, daecher, ohne: baum.ohne.length ? {mitte: [ohneMitte[0], y, ohneMitte[1]], R: ohneK.R} : null, R: Rall};
}
