/* =====================================================================
   HANDY — die Handy-Fassung von Lichtgrund mit eigener Engine (three.js 0.187, WebGL 2).
   Liest NUR die Weltbeschreibung (handy/welt.json, aus welt/weltbeschreibung.json kopiert) und rechnet keine eigenen Inhalte:
   Lage, Funktion, Stockwerke und Fassungen kommen von dort. Hier steht nur, wie es aussieht.
   Mechanismus im Dorf: Haus = Werk, Stockwerk = Zeitabschnitt (unten das Älteste), Fenster = genau eine Fassung,
   Tür = Ausgangsfrage, Licht im Fenster = Status der Fassung.
   ===================================================================== */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const NEU = 'neu/', klein = Math.min(innerWidth, innerHeight) < 700;
const satz = document.getElementById('satz'), ort = document.getElementById('ort');
const sage = (a, b) => { satz.textContent = a; if(b){ const s = document.createElement('small'); s.textContent = b; satz.append(s); } };
const W = await (await fetch('handy/welt.json', {cache: 'no-store'})).json();
const DACH = new URLSearchParams(location.search).get('dach') || 'FASKA';
const dach = W.daecher.find(d => d.name === DACH) || W.daecher[1];
const nachId = new Map(W.werke.map(w => [w.id, w])), werke = dach.werke.map(id => nachId.get(id)).filter(w => w && w.dorf);
ort.textContent = `${dach.name} · Dorf`;

/* ---------- Bühne ---------- */
const canvas = document.getElementById('welt');
const R = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(innerWidth, innerHeight);
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0; R.outputColorSpace = THREE.SRGBColorSpace;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const S = new THREE.Scene(), K = new THREE.PerspectiveCamera(klein ? 52 : 40, innerWidth / innerHeight, 0.3, 2000);
const pm = new THREE.PMREMGenerator(R);
new HDRLoader().load(NEU + 'himmel.hdr', t => { t.mapping = THREE.EquirectangularReflectionMapping; S.environment = pm.fromEquirectangular(t).texture; S.background = t; S.backgroundBlurriness = 0.02; S.environmentIntensity = 0.75; });
S.fog = new THREE.Fog(0xb7c2cc, 90, 360);
const sonne = new THREE.DirectionalLight(0xfff1dc, 3.2); sonne.position.set(-60, 90, 45); sonne.castShadow = true;
const sm = klein ? 1024 : 2048; sonne.shadow.mapSize.set(sm, sm); sonne.shadow.bias = -0.0004; sonne.shadow.normalBias = 0.04;
Object.assign(sonne.shadow.camera, {left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 300}); S.add(sonne, sonne.target);
S.add(new THREE.HemisphereLight(0xdfe8f2, 0x5a5a40, 0.35));

/* ---------- Stoffe (Poly Haven, CC0): Farbe, Normalen, AO/Rauheit/Metall ---------- */
const TL = new THREE.TextureLoader(), stoffe = new Map();
function stoff(name, {meter = 2, farbe = 0xffffff, rau = 1} = {}){ const k = name + meter + farbe; if(stoffe.has(k)) return stoffe.get(k);
  const lade = (f, srgb) => { const t = TL.load(`${NEU}stoffe/${name}/${f}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / meter, 1 / meter); t.anisotropy = 8; if(srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const arm = lade('arm'), m = new THREE.MeshStandardMaterial({map: lade('farbe', true), normalMap: lade('normal'), aoMap: arm, roughnessMap: arm, metalnessMap: arm, color: farbe, roughness: rau, metalness: 1});
  stoffe.set(k, m); return m; }
// UVs in Metern: die Kachel bleibt auf jeder Wand gleich groß
function meterUV(g){ g.computeBoundingBox(); const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for(let i = 0; i < p.count; i++){ const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if(ay >= ax && ay >= az){ uv[i * 2] = x; uv[i * 2 + 1] = z; } else if(ax >= az){ uv[i * 2] = z; uv[i * 2 + 1] = y; } else { uv[i * 2] = x; uv[i * 2 + 1] = y; } }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('uv1', new THREE.BufferAttribute(uv, 2)); return g; }
const kiste = (w, h, d) => meterUV(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0));
const teil = (g, m, schatten = true) => { const x = new THREE.Mesh(g, m); x.castShadow = schatten; x.receiveShadow = true; return x; };

const PUTZ = stoff('painted_plaster_wall', {meter: 3}), LEHM = stoff('clay_plaster', {meter: 3, farbe: 0xfff4e4}), ZIEGEL = stoff('clay_roof_tiles_02', {meter: 2.2}),
  PFLASTER = stoff('cobblestone_floor_04', {meter: 2.5}), WIESE = stoff('aerial_grass_rock', {meter: 9}), HOLZ = stoff('weathered_brown_planks', {meter: 2}), BETON = stoff('anti_slip_concrete', {meter: 3, farbe: 0xb8b2a8});
// Putzfarbe nach Funktion: Schule hell, Archiv steinern, Spielhof gelb, Musik warm; dieselbe Funktion, dieselbe Farbe
const WAND = {schule: PUTZ, schularchiv: stoff('painted_plaster_wall', {meter: 3, farbe: 0xd9d4c8}), spielhof: stoff('painted_plaster_wall', {meter: 3, farbe: 0xf3dd9a}), musik: stoff('painted_plaster_wall', {meter: 3, farbe: 0xe9b88f}), sonst: LEHM};
const RAHMEN = new THREE.MeshStandardMaterial({color: 0xf3efe6, roughness: 0.55}), STEIN = new THREE.MeshStandardMaterial({color: 0x8d8579, roughness: 0.9});
// Licht im Fenster = Status der Fassung; jede Fassung genau ein Fenster
const GLAS = {entwurf: [0xffc27a, 1.1], 'geprüft': [0xfff0d0, 1.9], grundformation: [0xffcf4a, 3.2], verworfen: [0x30343a, 0.0]};
const glasStoff = Object.fromEntries(Object.entries(GLAS).map(([k, [c, e]]) => [k, new THREE.MeshStandardMaterial({color: 0x1c2228, roughness: 0.08, metalness: 0.2, emissive: c, emissiveIntensity: e})]));

/* ---------- Boden ---------- */
const mitte = werke.reduce((a, w) => [a[0] + w.dorf.x / werke.length, a[1] + w.dorf.z / werke.length], [0, 0]), M = 2.6;
const lage = w => new THREE.Vector3((w.dorf.x - mitte[0]) * M, 0, (w.dorf.z - mitte[1]) * M);
// Die Wiese bekommt große, ruhige Flecken (Rauschen in den Eckfarben), damit die Kachel nicht als Raster sichtbar wird
{ const g = meterUV(new THREE.PlaneGeometry(900, 900, 150, 150).rotateX(-Math.PI / 2)), p = g.attributes.position, farbe = new Float32Array(p.count * 3);
  const h = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }, rausch = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return (h(ix, iz) * (1 - u) + h(ix + 1, iz) * u) * (1 - v) + (h(ix, iz + 1) * (1 - u) + h(ix + 1, iz + 1) * u) * v; };
  for(let i = 0; i < p.count; i++){ const x = p.getX(i), z = p.getZ(i), n = rausch(x / 38, z / 38) * 0.6 + rausch(x / 11, z / 11) * 0.4, k = 0.72 + n * 0.5;
    farbe[i * 3] = k * (0.95 + n * 0.1); farbe[i * 3 + 1] = k * (1.02 + n * 0.08); farbe[i * 3 + 2] = k * 0.86; }
  g.setAttribute('color', new THREE.BufferAttribute(farbe, 3)); const m = WIESE.clone(); m.vertexColors = true; for(const t of [m.map, m.normalMap, m.aoMap]) t.repeat.set(1 / 14, 1 / 14);
  S.add(teil(g, m, false)); }

/* ---------- Häuser aus der Beschreibung ---------- */
const STOCK = 3.2, SOCKEL = 0.5, treffer = [], gebaut = {name: 'Handy', pruefsumme: W.pruefsumme, teil: dach.name, werke: []};
const fensterListe = Object.fromEntries(Object.keys(GLAS).map(k => [k, []])), rahmenListe = [];
const altesteSchule = werke.filter(w => w.funktion.schluessel === 'schule').sort((a, b) => a.rang - b.rang)[0];

function haus(w){
  const g = new THREE.Group(), p = lage(w); g.position.copy(p); g.rotation.y = w.dorf.drehung; S.add(g); g.updateMatrixWorld();
  const stock = Math.max(1, w.dorf.stockwerke), proStock = Array.from({length: stock}, () => []);
  w.fassungen.forEach(f => proStock[Math.min(stock - 1, f.dorfEtage)].push(f));
  const meist = Math.max(1, ...proStock.map(l => l.length)), turm = false;
  // Grundriss: höchstens vier Stockwerke, darum wird das Haus mit der Arbeit länger, bis jede Fassung ihr Fenster hat
  const T = meist > 24 ? 8.4 : 6.6, plaetzeBei = b => 2 * Math.max(1, Math.floor((b - 1) / 1.8)) + 2 * Math.max(1, Math.floor((T - 1) / 1.8)) - 1;
  let B = 7.2; while(plaetzeBei(B) < meist) B += 1.8;
  const H = SOCKEL + stock * STOCK, wand = WAND[w.funktion.schluessel] || WAND.sonst;
  g.add(teil(kiste(B + 0.3, SOCKEL, T + 0.3), BETON));
  const koerper = teil(kiste(B, H - SOCKEL, T).translate(0, SOCKEL, 0), wand); koerper.userData.werk = w; treffer.push(koerper); g.add(koerper);
  for(let k = 1; k < stock; k++) g.add(teil(kiste(B + 0.12, 0.16, T + 0.12).translate(0, SOCKEL + k * STOCK - 0.08, 0), RAHMEN, false));   // Gesims: hier beginnt ein neuer Zeitabschnitt
  dach_(g, B, T, H, turm);
  // Tür = Ausgangsfrage, vorn in der Mitte
  w.ausgang.forEach((a, i) => { const x = (i - (w.ausgang.length - 1) / 2) * 1.6; g.add(teil(kiste(1.3, 2.3, 0.12).translate(x, SOCKEL, T / 2 + 0.02), HOLZ)); g.add(teil(kiste(1.9, 0.12, 0.9).translate(x, SOCKEL + 2.55, T / 2 + 0.45), RAHMEN)); });
  // Fenster: Stockwerk für Stockwerk, vorn, rechts, hinten, links; im Erdgeschoss bleibt die Tür frei
  const seiten = [[0, T / 2, 0, B], [B / 2, 0, Math.PI / 2, T], [0, -T / 2, Math.PI, B], [-B / 2, 0, -Math.PI / 2, T]];
  const ids = [];
  proStock.forEach((liste, k) => { const plaetze = []; [0, 2, 1, 3].map(s => seiten[s]).forEach(([sx, sz, dreh, len], s) => { const n = Math.max(1, Math.floor((len - 1) / 1.8)); for(let j = 0; j < n; j++){ const u = (j - (n - 1) / 2) * 1.8; if(k === 0 && s === 0 && Math.abs(u) < 1.4) continue; plaetze.push({sx, sz, dreh, u}); } });
    if(liste.length > plaetze.length) throw new Error('zu wenig Fensterplätze');   // nie zwei Fassungen in einem Fenster
    liste.forEach((f, i) => { const pl = plaetze[i], y = SOCKEL + k * STOCK + 1.0, c = Math.cos(pl.dreh), s = Math.sin(pl.dreh);
      const ox = pl.sx + c * pl.u, oz = pl.sz - s * pl.u, m = new THREE.Matrix4().makeRotationY(pl.dreh).setPosition(ox, y, oz), welt = new THREE.Matrix4().multiplyMatrices(g.matrixWorld, m);
      fensterListe[GLAS[f.status] ? f.status : 'entwurf'].push({matrix: welt, f, w}); rahmenListe.push(welt); ids.push(f.id); }); });
  gebaut.werke.push({id: w.id, fassungen: ids});
  beiwerk(w, g, B, T, H);
}
function dach_(g, B, T, H, turm){
  const ue = 0.45;
  if(turm){ const d = teil(new THREE.ConeGeometry((B + ue * 2) * 0.72, B * 0.55, 4, 1).rotateY(Math.PI / 4).translate(0, H + B * 0.275, 0), ZIEGEL); meterUV(d.geometry); g.add(d); return; }
  const h = (T / 2 + ue) * Math.tan(36 * Math.PI / 180), b = B / 2 + ue, t = T / 2 + ue;
  const v = [-b, H, t, b, H, t, b, H + h, 0, -b, H, t, b, H + h, 0, -b, H + h, 0, b, H, -t, -b, H, -t, -b, H + h, 0, b, H, -t, -b, H + h, 0, b, H + h, 0];
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); dg.computeVertexNormals();
  const uv = []; for(let i = 0; i < v.length; i += 3) uv.push(v[i], Math.hypot(v[i + 1] - H, Math.abs(v[i + 2]) - t)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); dg.setAttribute('uv1', new THREE.Float32BufferAttribute(uv, 2));
  g.add(teil(dg, ZIEGEL));
  const gv = [-B / 2, H, T / 2, -B / 2, H, -T / 2, -B / 2, H + h * (T / 2) / t, 0, B / 2, H, -T / 2, B / 2, H, T / 2, B / 2, H + h * (T / 2) / t, 0];
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gv, 3)); gg.computeVertexNormals(); meterUV(gg); g.add(teil(gg, PUTZ));
  g.add(teil(kiste(0.7, 1.6, 0.7).translate(B * 0.28, H + h * 0.45, -T * 0.12), STEIN));   // Schornstein
}

/* ---------- Was ein Werk ist, zeigt sich am Beiwerk ---------- */
const GL = new GLTFLoader(), modell = new Map();
const lade = n => { if(!modell.has(n)) modell.set(n, GL.loadAsync(`${NEU}modelle/${n}.glb`).then(x => { x.scene.traverse(o => { if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } }); return x.scene; })); return modell.get(n); };
// Viele gleiche Pflanzen: als Instanzen, ein Zeichenaufruf je Teilmodell (wichtig fürs Handy)
const pflanzen = new Map(), pflanze = (n, x, z, dreh, gr) => { if(!pflanzen.has(n)) pflanzen.set(n, []); pflanzen.get(n).push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dreh), new THREE.Vector3(gr, gr, gr))); };
const pflanzeAus = () => { for(const [n, li] of pflanzen) lade(n).then(m => { m.updateMatrixWorld(true); m.traverse(o => { if(!o.isMesh) return; const im = new THREE.InstancedMesh(o.geometry, o.material, li.length);
  li.forEach((x, i) => im.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(x, o.matrixWorld))); im.castShadow = true; im.receiveShadow = true; S.add(im); }); }); };
const stelle = (n, g, x, z, dreh = 0, gr = 1) => lade(n).then(m => { const c = m.clone(); c.position.set(x, 0, z); c.rotation.y = dreh; c.scale.setScalar(gr); g.add(c); });
const LOGO = ['#bd182a', '#e25e2b', '#ffce05', '#44a735', '#3da6da'];
function beiwerk(w, g, B, T, H){ const f = w.funktion.schluessel;
  if(w === altesteSchule){ schild(g, T); LOGO.forEach((c, i) => fahne(g, -B / 2 - 1.2 - i * 1.5, T / 2 + 3.2, c)); stelle('standing_chalkboard_01', g, B / 2 + 1.5, T / 2 + 2, -0.5); }
  if(f === 'schularchiv') stelle('wooden_bookshelf_worn', g, B / 2 + 1.3, T / 2 + 0.8, -Math.PI / 2, 0.9);
  if(f === 'spielhof'){ stelle('rubber_duck_toy', g, 2, T / 2 + 2.5, 0.6, 3); stelle('painted_wooden_bench', g, -2.2, T / 2 + 2.6, 0); }
  if(f === 'musik'){ const r = Math.min(B, T) * 0.42, h = Math.min(H, 4.2); const halle = teil(meterUV(new THREE.CylinderGeometry(r, r, h, 28)).translate(B / 2 + r * 0.7, h / 2, 0), LEHM); g.add(halle);
    g.add(teil(meterUV(new THREE.SphereGeometry(r * 1.04, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2)).translate(B / 2 + r * 0.7, h, 0), ZIEGEL)); stelle('portable_cassette_player', g, B / 2 + r * 1.9, T / 2 + 1, 0.4, 2); }
  stelle('planter_box_01', g, B / 2 - 0.6, T / 2 + 1.1, 0); }
function schild(g, T){ const img = new Image(); img.src = NEU + 'zeichen/faska.svg';
  img.onload = () => { const c = document.createElement('canvas'); c.width = 1360; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#fbf8f1'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const tafel = teil(new THREE.PlaneGeometry(4.2, 1.24), new THREE.MeshStandardMaterial({map: t, roughness: 0.6})); tafel.position.set(0, SOCKEL + 2.85, T / 2 + 0.95); g.add(tafel); }; }
function fahne(g, x, z, farbe){ g.add(teil(new THREE.CylinderGeometry(0.05, 0.06, 7, 8).translate(x, 3.5, z), RAHMEN));
  const fg = new THREE.PlaneGeometry(1.6, 1.0, 12, 4), p = fg.attributes.position; for(let i = 0; i < p.count; i++){ const u = p.getX(i) + 0.8; p.setZ(i, Math.sin(u * 3.1) * 0.12 * u); } fg.computeVertexNormals(); fg.translate(0.8, 6.3, 0);
  const fl = teil(fg, new THREE.MeshStandardMaterial({color: farbe, roughness: 0.75, side: THREE.DoubleSide})); fl.position.set(x, 0, z); g.add(fl); }

werke.forEach(haus);
// Fenster als Instanzen: ein Ding je Fassung, Rahmen und Glas
const fensterTreffer = [];
for(const [st, li] of Object.entries(fensterListe)){ if(!li.length) continue; const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.0, 1.4).translate(0, 0.7, 0.03), glasStoff[st], li.length);
  li.forEach((x, i) => im.setMatrixAt(i, x.matrix)); im.userData.fenster = li; S.add(im); fensterTreffer.push(im); }
{ const leiste = (w, h, x, y) => new THREE.BoxGeometry(w, h, 0.12).translate(x, y, 0.06), fr = mergeGeometries([leiste(1.24, 0.12, 0, 1.46), leiste(1.24, 0.12, 0, -0.06), leiste(0.12, 1.6, -0.56, 0.7), leiste(0.12, 1.6, 0.56, 0.7), leiste(1.0, 0.06, 0, 0.95), leiste(0.06, 1.4, 0, 0.7)]);
  const bank = new THREE.BoxGeometry(1.4, 0.08, 0.3).translate(0, -0.12, 0.15), im = new THREE.InstancedMesh(fr, RAHMEN, rahmenListe.length), ib = new THREE.InstancedMesh(bank, STEIN, rahmenListe.length);
  rahmenListe.forEach((m, i) => { im.setMatrixAt(i, m); ib.setMatrixAt(i, m); }); im.castShadow = ib.castShadow = true; S.add(im, ib); }

/* ---------- Wege: vom Schulhof zu jedem Werk, Bäume und Laternen am Rand ---------- */
const hof = altesteSchule ? lage(altesteSchule) : new THREE.Vector3();
{ const platz = teil(meterUV(new THREE.CircleGeometry(16, 48).rotateX(-Math.PI / 2)), PFLASTER, false); platz.position.set(hof.x, 0.02, hof.z); S.add(platz); }
werke.forEach((w, i) => { if(w === altesteSchule) return; const p = lage(w), d = p.clone().sub(hof), L = d.length(), weg = teil(meterUV(new THREE.PlaneGeometry(2.4, L).rotateX(-Math.PI / 2)), PFLASTER, false);
  weg.position.set((p.x + hof.x) / 2, 0.015 + i * 0.0005, (p.z + hof.z) / 2); weg.rotation.y = Math.atan2(d.x, d.z); S.add(weg);
  if(i % 2) stelle('street_lamp_01', S, weg.position.x + Math.cos(weg.rotation.y) * 1.8, weg.position.z - Math.sin(weg.rotation.y) * 1.8, weg.rotation.y, 1); });
// Bäume sind Grund und tragen nichts: auf festen Plätzen am Rand, nie auf einem Haus
const kernX = werke.reduce((a, w) => a + lage(w).x, 0) / werke.length, kernZ = werke.reduce((a, w) => a + lage(w).z, 0) / werke.length;
{ let r = 1; const zufall = () => (r = (r * 16807) % 2147483647) / 2147483647, frei = (x, z) => werke.every(w => lage(w).distanceTo(new THREE.Vector3(x, 0, z)) > 13) && Math.hypot(x - hof.x, z - hof.z) > 18;
  // Baumgruppen statt Streuung: ein Hain um das Viertel, ein paar Hofbäume dazwischen
  let n = 0; const ziel = klein ? 46 : 90; for(let k = 0; k < 2000 && n < ziel; k++){ const gr = Math.floor(zufall() * 9), a = gr / 9 * Math.PI * 2 + zufall() * 0.5, d = 70 + zufall() * 70 + (k % 3) * 8, x = kernX + Math.cos(a) * d, z = kernZ + Math.sin(a) * d;
    if(!frei(x, z)) continue; n++; pflanze('tree_small_02', x, z, zufall() * 6, 2.2 + zufall() * 1.4); }
  for(let k = 0; k < 600 && n < ziel + 14; k++){ const x = kernX + (zufall() - 0.5) * 110, z = kernZ + (zufall() - 0.5) * 110; if(frei(x, z)){ n++; pflanze('tree_small_02', x, z, zufall() * 6, 2.0 + zufall() * 1.0); } }
  for(let k = 0; k < (klein ? 40 : 80); k++){ const x = kernX + (zufall() - 0.5) * 150, z = kernZ + (zufall() - 0.5) * 150; if(frei(x, z)) pflanze('shrub_02', x, z, zufall() * 6, 1.4 + zufall() * 0.8); } }
pflanzeAus();

/* ---------- Blick und Tippen ---------- */
// Der erste Blick zeigt das ganze Viertel, schräg von oben, mit dem Schulhof vorn
const box = new THREE.Box3(); werke.forEach(w => box.expandByPoint(lage(w))); const kern = box.getCenter(new THREE.Vector3()), weite = box.getSize(new THREE.Vector3()).length() * 0.5 + 18;
const C = new OrbitControls(K, canvas); C.enableDamping = true; C.maxPolarAngle = 1.4; C.minDistance = 8; C.maxDistance = 320; C.target.copy(kern).add(new THREE.Vector3(0, 2, 0));
const blick = hof.clone().sub(kern).setY(0).normalize(), abst = weite / Math.tan(K.fov * Math.PI / 360) * (klein ? 0.95 : 0.75);
K.position.copy(kern).addScaledVector(blick.lengthSq() ? blick : new THREE.Vector3(0, 0, 1), abst * 0.78).add(new THREE.Vector3(0, abst * 0.62, 0)); C.update();
sage(`${dach.name}: ${werke.length} Werke, ${gebaut.werke.reduce((a, w) => a + w.fassungen.length, 0)} Fassungen`, 'Jedes Fenster ist eine Fassung, unten die älteste. Antippen nennt sie.');
const ray = new THREE.Raycaster(), zeiger = new THREE.Vector2(); let unten = null;
canvas.addEventListener('pointerdown', e => { unten = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => { if(!unten || Math.hypot(e.clientX - unten[0], e.clientY - unten[1]) > 6) return;
  zeiger.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(zeiger, K);
  const t = ray.intersectObjects([...fensterTreffer, ...treffer], false)[0]; if(!t) return;
  if(t.object.userData.fenster){ const {f, w} = t.object.userData.fenster[t.instanceId]; sage(f.name, `${w.titel} · ${f.stimme} · ${f.zeit ? new Date(f.zeit).toLocaleDateString('de-DE') : 'ohne Datum'}`); }
  else { const w = t.object.userData.werk, st = w.dorf.stockwerke; sage(w.titel, `${w.funktion.name} · ${w.fassungen.length} ${w.fassungen.length === 1 ? 'Fassung' : 'Fassungen'} auf ${st} ${st === 1 ? 'Stockwerk' : 'Stockwerken'}`); } });
addEventListener('resize', () => { K.aspect = innerWidth / innerHeight; K.updateProjectionMatrix(); R.setSize(innerWidth, innerHeight); });
globalThis.lichtgrundGebaut = gebaut;   // für die Prüfung: was hier wirklich gebaut wurde
let bilder = 0, t0 = performance.now(); globalThis.lichtgrundBildrate = () => Math.round(bilder * 1000 / (performance.now() - t0));
R.setAnimationLoop(() => { C.update(); R.render(S, K); bilder++; });
