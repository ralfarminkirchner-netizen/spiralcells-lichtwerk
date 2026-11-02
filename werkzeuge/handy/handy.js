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
const WAND = {schule: PUTZ, schularchiv: stoff('painted_plaster_wall', {meter: 3, farbe: 0xd9d4c8}), spielhof: stoff('painted_plaster_wall', {meter: 3, farbe: 0xf3dd9a}), musik: stoff('painted_plaster_wall', {meter: 3, farbe: 0xe9b88f}), sonst: stoff('painted_plaster_wall', {meter: 3, farbe: 0xf1ebe0})};
const RAHMEN = new THREE.MeshStandardMaterial({color: 0xf3efe6, roughness: 0.55}), STEIN = new THREE.MeshStandardMaterial({color: 0x8d8579, roughness: 0.9});
// Licht im Fenster = Status der Fassung; jede Fassung genau ein Fenster
const GLAS = {entwurf: [0xffc27a, 1.1], 'geprüft': [0xfff0d0, 1.9], grundformation: [0xffcf4a, 3.2], verworfen: [0x30343a, 0.0]};
const glasStoff = Object.fromEntries(Object.entries(GLAS).map(([k, [c, e]]) => [k, new THREE.MeshStandardMaterial({color: 0x1c2228, roughness: 0.08, metalness: 0.2, emissive: c, emissiveIntensity: e})]));

/* ---------- Boden ---------- */
// Die Wiese bekommt große, ruhige Flecken (Rauschen in den Eckfarben), damit die Kachel nicht als Raster sichtbar wird
const BAU = W.bau.dorf, haeuser = W.werke.filter(w => BAU.haeuser[w.id]).map(w => ({w, h: BAU.haeuser[w.id]}));
const fokus = BAU.plaetze.find(p => p.dach === dach.name) || BAU.plaetze[0], hier = haeuser.filter(x => dach.werke.includes(x.w.id));
sonne.position.set(fokus.x - 60, 90, fokus.z + 45); sonne.target.position.set(fokus.x, 0, fokus.z);   // Schatten dort, wohin man schaut
{ const g = meterUV(new THREE.PlaneGeometry(1400, 1400, 180, 180).rotateX(-Math.PI / 2).translate(fokus.x, 0, fokus.z)), p = g.attributes.position, farbe = new Float32Array(p.count * 3);
  const h = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }, rausch = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return (h(ix, iz) * (1 - u) + h(ix + 1, iz) * u) * (1 - v) + (h(ix, iz + 1) * (1 - u) + h(ix + 1, iz + 1) * u) * v; };
  for(let i = 0; i < p.count; i++){ const x = p.getX(i), z = p.getZ(i), n = rausch(x / 38, z / 38) * 0.6 + rausch(x / 11, z / 11) * 0.4, k = 0.72 + n * 0.5;
    farbe[i * 3] = k * (0.95 + n * 0.1); farbe[i * 3 + 1] = k * (1.02 + n * 0.08); farbe[i * 3 + 2] = k * 0.86; }
  g.setAttribute('color', new THREE.BufferAttribute(farbe, 3)); const m = WIESE.clone(); m.vertexColors = true; for(const t of [m.map, m.normalMap, m.aoMap]) t.repeat.set(1 / 14, 1 / 14);
  S.add(teil(g, m, false)); }

/* ---------- Häuser: genau die Maße aus der Weltbeschreibung, hier kommen nur Stoffe dazu ---------- */
const R0 = BAU.regeln, treffer = [], gebaut = {name: 'Handy', pruefsumme: W.pruefsumme, werke: []};
const fensterListe = Object.fromEntries(Object.keys(GLAS).map(k => [k, []])), rahmenListe = [];
const ort3 = (x, y, z, dreh) => new THREE.Matrix4().makeRotationY(dreh).setPosition(x, y, z);

function haus({w, h}){
  const g = new THREE.Group(); g.position.set(h.x, 0, h.z); g.rotation.y = h.drehung; S.add(g);
  const B = h.breite, T = h.tiefe, H = h.hoehe, wand = WAND[h.wand] || WAND.sonst;
  g.add(teil(kiste(B + 0.3, R0.sockel, T + 0.3), BETON));
  const koerper = teil(kiste(B, H - R0.sockel, T).translate(0, R0.sockel, 0), wand); koerper.userData.werk = w; treffer.push(koerper); g.add(koerper);
  for(let k = 1; k < h.stockwerke; k++) g.add(teil(kiste(B + 0.12, 0.16, T + 0.12).translate(0, R0.sockel + k * R0.stockhoehe - 0.08, 0), RAHMEN, false));   // Gesims: hier beginnt ein neuer Zeitabschnitt
  satteldach(g, B, T, H);
  const ids = [];
  for(const f of h.fenster){ const m = ort3(f.x, f.y, f.z, f.drehung), fa = w.fassungen.find(x => x.id === f.fassung); fensterListe[GLAS[f.licht] ? f.licht : 'entwurf'].push({matrix: m, f: fa, w}); rahmenListe.push(m); ids.push(f.fassung); }
  for(const t of h.tueren){ const d = new THREE.Group(); d.position.set(t.x, t.y, t.z); d.rotation.y = t.drehung; S.add(d);
    d.add(teil(kiste(R0.tuer.breite, R0.tuer.hoehe, 0.12).translate(0, 0, 0.02), HOLZ)); d.add(teil(kiste(1.9, 0.12, 0.9).translate(0, R0.tuer.hoehe + 0.25, 0.45), RAHMEN)); }
  for(const b of h.beiwerk) beiwerk(b);
  gebaut.werke.push({id: w.id, fassungen: ids});
}
function satteldach(g, B, T, H){
  const ue = R0.dach.ueberstand, h = (T / 2 + ue) * Math.tan(R0.dach.neigung * Math.PI / 180), b = B / 2 + ue, t = T / 2 + ue;
  const v = [-b, H, t, b, H, t, b, H + h, 0, -b, H, t, b, H + h, 0, -b, H + h, 0, b, H, -t, -b, H, -t, -b, H + h, 0, b, H, -t, -b, H + h, 0, b, H + h, 0];
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); dg.computeVertexNormals();
  const uv = []; for(let i = 0; i < v.length; i += 3) uv.push(v[i], Math.hypot(v[i + 1] - H, Math.abs(v[i + 2]) - t)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); dg.setAttribute('uv1', new THREE.Float32BufferAttribute(uv, 2));
  g.add(teil(dg, ZIEGEL));
  const gv = [-B / 2, H, T / 2, -B / 2, H, -T / 2, -B / 2, H + h * (T / 2) / t, 0, B / 2, H, -T / 2, B / 2, H, T / 2, B / 2, H + h * (T / 2) / t, 0];
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gv, 3)); gg.computeVertexNormals(); meterUV(gg); g.add(teil(gg, PUTZ));
  g.add(teil(kiste(0.7, 1.6, 0.7).translate(B * 0.28, H + h * 0.45, -T * 0.12), STEIN));   // Schornstein
}

/* ---------- Beiwerk: Art und Ort aus der Beschreibung ---------- */
const GL = new GLTFLoader(), modell = new Map();
const lade = n => { if(!modell.has(n)) modell.set(n, GL.loadAsync(`${NEU}modelle/${n}.glb`).then(x => { x.scene.traverse(o => { if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } }); return x.scene; })); return modell.get(n); };
// Viele gleiche Modelle als Instanzen, ein Zeichenaufruf je Teilmodell (wichtig fürs Handy)
const vorrat = new Map(), setze = (n, x, z, dreh = 0, gr = 1) => { if(!vorrat.has(n)) vorrat.set(n, []); vorrat.get(n).push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dreh), new THREE.Vector3(gr, gr, gr))); };
const setzeAus = () => { for(const [n, li] of vorrat) lade(n).then(m => { m.updateMatrixWorld(true); m.traverse(o => { if(!o.isMesh) return; const im = new THREE.InstancedMesh(o.geometry, o.material, li.length);
  li.forEach((x, i) => im.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(x, o.matrixWorld))); im.castShadow = !(klein && li.length > 40); im.receiveShadow = true; S.add(im); }); }); };   // am Handy werfen die vielen Bäume keinen Schatten: nur Grafik, kein Inhalt
function beiwerk(b){
  if(b.art.startsWith('modell:')) return setze(b.art.slice(7), b.x, b.z, b.drehung, b.groesse || 1);
  if(b.art === 'rundhalle'){ const r = b.radius, h = b.hoehe; S.add(teil(meterUV(new THREE.CylinderGeometry(r, r, h, 28)).translate(b.x, h / 2, b.z), WAND.musik)); S.add(teil(meterUV(new THREE.SphereGeometry(r * 1.04, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2)).translate(b.x, h, b.z), ZIEGEL)); return; }
  if(b.art === 'fahne'){ const g = new THREE.Group(); g.position.set(b.x, 0, b.z); g.rotation.y = b.drehung; S.add(g); g.add(teil(new THREE.CylinderGeometry(0.05, 0.06, b.mast, 8).translate(0, b.mast / 2, 0), RAHMEN));
    const fg = new THREE.PlaneGeometry(1.6, 1.0, 12, 4), p = fg.attributes.position; for(let i = 0; i < p.count; i++){ const u = p.getX(i) + 0.8; p.setZ(i, Math.sin(u * 3.1) * 0.12 * u); } fg.computeVertexNormals(); fg.translate(0.8, b.mast - 0.7, 0);
    g.add(teil(fg, new THREE.MeshStandardMaterial({color: b.farbe, roughness: 0.75, side: THREE.DoubleSide}))); return; }
  if(b.art === 'logotafel'){ const img = new Image(); img.src = `${NEU}zeichen/${b.zeichen}.svg`;
    img.onload = () => { const c = document.createElement('canvas'); c.width = 1360; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#fbf8f1'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const tafel = teil(new THREE.PlaneGeometry(b.breite, b.hoehe), new THREE.MeshStandardMaterial({map: t, roughness: 0.6}));
      tafel.position.set(b.x, b.y, b.z); tafel.rotation.y = b.drehung; S.add(tafel); }; }
}

haeuser.forEach(haus);
// Fenster als Instanzen: ein Ding je Fassung, Rahmen und Glas
const fensterTreffer = [];
for(const [st, li] of Object.entries(fensterListe)){ if(!li.length) continue; const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(R0.fenster.breite, R0.fenster.hoehe).translate(0, R0.fenster.hoehe / 2, 0.03), glasStoff[st], li.length);
  li.forEach((x, i) => im.setMatrixAt(i, x.matrix)); im.userData.fenster = li; S.add(im); fensterTreffer.push(im); }
{ const leiste = (w, h, x, y) => new THREE.BoxGeometry(w, h, 0.12).translate(x, y, 0.06), fr = mergeGeometries([leiste(1.24, 0.12, 0, 1.46), leiste(1.24, 0.12, 0, -0.06), leiste(0.12, 1.6, -0.56, 0.7), leiste(0.12, 1.6, 0.56, 0.7), leiste(1.0, 0.06, 0, 0.95), leiste(0.06, 1.4, 0, 0.7)]);
  const bank = new THREE.BoxGeometry(1.4, 0.08, 0.3).translate(0, -0.12, 0.15), im = new THREE.InstancedMesh(fr, RAHMEN, rahmenListe.length), ib = new THREE.InstancedMesh(bank, STEIN, rahmenListe.length);
  rahmenListe.forEach((m, i) => { im.setMatrixAt(i, m); ib.setMatrixAt(i, m); }); im.castShadow = ib.castShadow = true; S.add(im, ib); }
// Was hier wirklich steht, aus den gezeichneten Instanzen gelesen: für die Prüfung gegen die Beschreibung
const lage3 = new THREE.Vector3(), lagen = new Map(); for(const im of fensterTreffer) im.userData.fenster.forEach((x, i) => { const m = new THREE.Matrix4(); im.getMatrixAt(i, m); lage3.setFromMatrixPosition(m); lagen.set(x.f.id, [lage3.x, lage3.y, lage3.z].map(v => Math.round(v * 1000) / 1000)); });
gebaut.werke.forEach(x => { x.fenster = x.fassungen.map(id => lagen.get(id)); });

/* ---------- Plätze, Wege, Laternen, Bäume ---------- */
for(const p of BAU.plaetze){ const pl = teil(meterUV(new THREE.CircleGeometry(p.radius, 48).rotateX(-Math.PI / 2)), PFLASTER, false); pl.position.set(p.x, 0.02, p.z); S.add(pl); }
BAU.wege.forEach((g, i) => { const [ax, az] = g.von, [bx, bz] = g.nach, L = Math.hypot(bx - ax, bz - az), weg = teil(meterUV(new THREE.PlaneGeometry(g.breite, L).rotateX(-Math.PI / 2)), PFLASTER, false);
  weg.position.set((ax + bx) / 2, 0.015 + (i % 7) * 0.0005, (az + bz) / 2); weg.rotation.y = Math.atan2(bx - ax, bz - az); S.add(weg); });
for(const l of BAU.laternen) setze('street_lamp_01', l.x, l.z, l.drehung);
for(const b of BAU.baeume) setze(b.art.slice(7), b.x, b.z, b.drehung, b.groesse);
setzeAus();

/* ---------- Blick und Tippen ---------- */
// Der erste Blick zeigt das ganze Viertel, schräg von oben, mit dem Schulhof vorn
const box = new THREE.Box3(); hier.forEach(({h}) => box.expandByPoint(new THREE.Vector3(h.x, 0, h.z))); const hof = new THREE.Vector3(fokus.x, 0, fokus.z); const kern = box.getCenter(new THREE.Vector3()), weite = box.getSize(new THREE.Vector3()).length() * 0.5 + 18;
const C = new OrbitControls(K, canvas); C.enableDamping = true; C.maxPolarAngle = 1.4; C.minDistance = 8; C.maxDistance = 320; C.target.copy(kern).add(new THREE.Vector3(0, 2, 0));
const blick = hof.clone().sub(kern).setY(0).normalize(), abst = weite / Math.tan(K.fov * Math.PI / 360) * (klein ? 0.95 : 0.75);
K.position.copy(kern).addScaledVector(blick.lengthSq() ? blick : new THREE.Vector3(0, 0, 1), abst * 0.78).add(new THREE.Vector3(0, abst * 0.62, 0)); C.update();
sage(`${dach.name}: ${hier.length} Werke, ${hier.reduce((a, x) => a + x.h.fenster.length, 0)} Fassungen`, 'Jedes Fenster ist eine Fassung, unten die älteste. Antippen nennt sie.');
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
