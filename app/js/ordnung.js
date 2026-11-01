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
  // Die Datei wird von Hand gepflegt: nur Texte und {werk: Text} gelten, alles andere wird als „fehlt“ gemeldet, nie als Ausnahme
  const text = r => typeof r === 'string' ? r : r && typeof r === 'object' && typeof r.werk === 'string' ? r.werk : null;
  const reihe = x => Array.isArray(x) ? x : [], obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : null;
  const vergeben = new Set(), finde = ref => { if(typeof ref !== 'string' || !ref.trim()) return -1;
    const kandidaten = (schl.get(key(ref)) || []).filter(i => !vergeben.has(i)); if(!kandidaten.length) return -1;
    vergeben.add(kandidaten[0]); return kandidaten[0]; };
  const suche = ref => { if(typeof ref !== 'string' || !ref.trim()) return -1; const c = schl.get(key(ref)) || []; return c.length ? c[0] : -1; };   // nur nachsehen, nichts vergeben
  const fehlt = [];
  const liste = refs => reihe(refs).map(r => { const t = text(r), i = finde(t); if(i < 0) fehlt.push(t == null ? 'unlesbarer Eintrag' : t); return i; }).filter(i => i >= 0);
  const o = obj(O) || {}, om = obj(o.mitte) || {}, name = (x, n) => typeof x === 'string' && x.trim() ? x.trim() : n;
  const mitte = {name: name(om.name, 'Zentrale'), satz: name(om.satz, ''), werke: liste(om.werke)};
  const daecher = reihe(o.daecher).map(obj).filter(Boolean).map((d, j) => ({name: name(d.name, `Dach ${j + 1}`), satz: name(d.satz, ''),
      bereiche: reihe(d.bereiche).map(obj).filter(Boolean).map((b, k) => ({name: name(b.name, `Bereich ${k + 1}`), satz: name(b.satz, ''), werke: liste(b.werke)})).filter(b => b.werke.length)}))
    .filter(d => d.bereiche.length);
  // Lesematerial: an einem Werk (dann wandert es mit ihm) oder an einem Dach
  const material = new Map();   // Mondindex → Ziel {werk: i} | {dach: name}
  for(const q of reihe(o.material).map(obj).filter(Boolean)){ const i = finde(text(q)); if(i < 0){ fehlt.push(text(q) || 'unlesbarer Eintrag'); continue; }
    const ziel = typeof q.an === 'string' ? suche(q.an) : -1;
    material.set(i, ziel >= 0 && ziel !== i ? {werk: ziel} : {dach: typeof q.dach === 'string' ? q.dach : null}); }
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
   eines Dachs, dann die Dächer und „ohne Dach“ um die Mitte. Radien in Weltmaß; groß heißt: viel darin. */
function phyllo(radien, gap){
  // Jeder Kreis kommt an den freien Platz, der der Mitte am nächsten liegt: so bleibt kein leerer Raum im Bezirk
  const n = radien.length, pos = [];
  for(let k = 0; k < n; k++){
    if(!k){ pos.push([0, 0]); continue; }
    const schritt = Math.max(0.05, radien[k] * 0.2); let best = null;
    for(let w = 0; w < 48; w++){ const a = k * GOLD + w * Math.PI / 24;
      for(let d = radien[0] * 0.2; d < 400; d += schritt){ if(best && d >= best[2]) break; const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if(pos.every((p, j) => Math.hypot(p[0] - x, p[1] - z) >= radien[j] + radien[k] + gap)){ best = [x, z, d]; break; } } }
    pos.push(best ? [best[0], best[1]] : [0, 0]);
  }
  let R = 0; pos.forEach((p, k) => { R = Math.max(R, Math.hypot(p[0], p[1]) + radien[k]); });
  return {pos, R: R + gap * 0.5};
}

export function lage(baum, rWerk, opt = {}){
  const gapW = opt.gapWerk ?? 0.35, gapB = opt.gapBereich ?? 0.8, gapD = opt.gapDach ?? 2.2;
  const pos = new Array(rWerk.length).fill(null);
  const bereichsKreis = werke => { const ord = werke.slice(); const r = ord.map(i => rWerk[i]); const p = phyllo(r, gapW); return {werke: ord, rel: p.pos, R: Math.max(p.R, 0.8)}; };
  // Dächer: Bereiche als Kreise im Dach, der Rand eng um sie
  const dk = baum.daecher.map(d => { const bs = d.bereiche.map(b => bereichsKreis(b.werke)); const p = phyllo(bs.map(b => b.R), gapB); return {bs, rel: p.pos, R: p.R + 0.3}; });
  // Die Mitte ist so groß wie ein großes Dach: sie trägt das Ganze und muss als Kern lesbar sein
  const mk = bereichsKreis(baum.mitte.werke), Rm = Math.max(3.2, mk.R * 1.25, 0.7 * Math.max(0, ...dk.map(x => x.R)));
  // „Ohne Dach“ ist ein Bezirk wie die Dächer: abgesetzt durch seine Gestalt, nicht durch Ferne
  const ohneK = bereichsKreis(baum.ohne);
  const kreise = dk.map(x => x.R); if(baum.ohne.length) kreise.push(ohneK.R);
  // Dächer um die Mitte: größtes zuerst, jedes an den nächsten freien Platz; quer darf es weiter hinaus, denn das Bild ist breit
  const ordnungD = kreise.map((_, j) => j).sort((a, b) => kreise[b] - kreise[a]);
  const D = [], gesetzt = [];
  for(const j of ordnungD){
    let best = null;
    for(let w = 0; w < 72; w++){ const a = gesetzt.length * GOLD + 0.4 + w * Math.PI / 36;
      for(let d = Rm + kreise[j] + gapD; d < 600; d += 0.25){ const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if(gesetzt.every(q => Math.hypot(D[q][0] - x, D[q][1] - z) >= kreise[q] + kreise[j] + gapD)){ const m = Math.hypot(x, z * 1.25); if(!best || m < best[2]) best = [x, z, m]; break; } } }
    D[j] = [best[0], best[1]]; gesetzt.push(j);
  }
  let Rall = Rm; kreise.forEach((r, j) => { Rall = Math.max(Rall, Math.hypot(D[j][0], D[j][1]) + r); });
  const ohneMitte = baum.ohne.length ? D[dk.length] : [0, 0];
  const y = opt.hoehe ?? 0;
  // Die Werke der Mitte füllen ihre Fläche, statt in ihrem Kern zu klumpen
  const weit = Math.max(1, Rm * 0.62 / Math.max(0.01, mk.R));
  mk.werke.forEach((i, k) => { pos[i] = [mk.rel[k][0] * weit, y, mk.rel[k][1] * weit]; });
  const daecher = dk.map((x, j) => { const c = D[j];
    const bereiche = x.bs.map((b, bi) => { const bc = [c[0] + x.rel[bi][0], c[1] + x.rel[bi][1]]; b.werke.forEach((i, k) => { pos[i] = [bc[0] + b.rel[k][0], y, bc[1] + b.rel[k][1]]; }); return {mitte: [bc[0], y, bc[1]], R: b.R}; });
    return {mitte: [c[0], y, c[1]], R: x.R, bereiche}; });
  ohneK.werke.forEach((i, k) => { pos[i] = [ohneMitte[0] + ohneK.rel[k][0], y, ohneMitte[1] + ohneK.rel[k][1]]; });
  // Lesematerial sitzt dicht an seinem Werk, sonst am Rand seines Dachs
  const proZiel = new Map();
  for(const [i, z] of baum.material){
    if(z.werk != null && pos[z.werk]){ const p = pos[z.werk], k = proZiel.get(z.werk) || 0; proZiel.set(z.werk, k + 1);
      // nach außen, weg von der Mitte seines Bezirks, nebeneinander; so überdeckt es kein fremdes Werk
      const a = Math.atan2(p[2], p[0]) + (k - 0.5) * 0.5, d = rWerk[z.werk] + 0.45 + rWerk[i];
      pos[i] = [p[0] + Math.cos(a) * d, y, p[2] + Math.sin(a) * d]; }
    else { const dj = baum.daecher.findIndex(d => d.name === z.dach); const c = dj >= 0 ? daecher[dj] : {mitte: [0, y, 0], R: Rm}; const a = i * GOLD; pos[i] = [c.mitte[0] + Math.cos(a) * c.R * 0.92, y, c.mitte[2] + Math.sin(a) * c.R * 0.92]; }
  }
  return {pos, mitte: {mitte: [0, y, 0], R: Rm}, daecher, ohne: baum.ohne.length ? {mitte: [ohneMitte[0], y, ohneMitte[1]], R: ohneK.R} : null, R: Rall};
}
