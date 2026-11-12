/* =====================================================================
   DORF — die dritte 3D-Welt (12.11.2026, Fable). Derselbe Inhalt wie in jeder Ansicht, hier als Dorf in der Blauen Stunde.
   Marktplatz = Zentrale (Tragwerk System), ihre Häuser stehen in Ringen um den Platz, das Rathaus im Norden.
   Viertel = Oberdach, je eine Straße vom Markt nach außen, das Älteste zuerst. Bereich (FASKA, Rebeca Wild) = eigener Hof am Ende der Straße.
   Haus = App, jedes einzeln entworfen (dorf/haeuser.js). Fenster = genau eine Fassung und zeigt ihr echtes Bild als Licht;
   ohne Bild leuchtet es als mattes warmes Glas. Stockwerk = Zeitabschnitt, Dachboden = ohne belegtes Datum. Läden = Farbe der Stimme.
   „Zur Prüfung“ = Baustelle am Dorfrand. Himmel, Hügel, Laternen, Bäume sind Grund und tragen nichts. Nichts wird geschrieben.
   ===================================================================== */
import * as THREE from 'three/webgpu';
import {uniform, vec2, vec3, vec4, float, uv, mix, smoothstep, sin, cos, abs, floor, step, normalize, dot, pow, exp, max, min, clamp, length,
  positionLocal, positionWorld, positionView, normalView, texture, attribute, hash, normalMap, pass, mrt, output, screenUV, mx_noise_float, builtinAOContext, fog} from 'three/tsl';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';
import {ao} from 'three/addons/tsl/display/GTAONode.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {$, rahmen, ladeBestand, sage, klein, tablet, ruhig, bildUrl, stimmeVon, ORTFARBE, fassungenVon, OFFEN, TRAGEND} from './rahmen.js';
import {Sammler, farbe, toene, zufall, hashS} from './dorf/bau.js';
import {entwirf, baue} from './dorf/haeuser.js';
import {FUNKTIONEN, NACH_TITEL, NACH_BEREICH} from '../../app/js/funktion.js';
import {ego} from './ego.js';

const canvas = $('#welt'), T0 = performance.now(), messung = {erstesBild: 0, bestand: 0, fps: 0};
const NEU = 'neu/';

/* ---------- Grafik ---------- */
const forceWebGL = /[?&]webgl/.test(location.search) || !navigator.gpu || !(await navigator.gpu.requestAdapter().catch(() => null));
const renderer = new THREE.WebGPURenderer({canvas, antialias: true, forceWebGL, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, klein ? 1.5 : tablet ? 1.4 : 1.6)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.55; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
try{ await renderer.init(); }catch(e){ sage('Diese Welt braucht WebGPU oder WebGL 2.', 0); throw e; }
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(klein && innerHeight > innerWidth ? 58 : 40, innerWidth / innerHeight, 0.15, 6000);
const U = {zeit: uniform(0), selA: uniform(-1), selB: uniform(-1), selAn: uniform(0), fokus: uniform(60)};
const R = rahmen({welt: 'dorf', artName, waehleInWelt, zusatz, blattTitel});
sage('Im Dorf gehen die Lichter an. Der Bestand wird gelesen …', 0);

/* Himmel der Blauen Stunde: gerechnet, das Abendrot steht im Westen (−x) */
const himmelJS = d => { const h = Math.max(d.y, 0), w = Math.max(0, -d.x / (Math.hypot(d.x, d.z) || 1)) , t = Math.min(1, h / 0.6), s = t * t * (3 - 2 * t);
  const c = [0.085 + (0.010 - 0.085) * s, 0.14 + (0.022 - 0.14) * s, 0.27 + (0.07 - 0.27) * s], g = Math.pow(w, 3) * Math.exp(-h * 6) * 0.9, v = Math.pow(w, 2) * Math.exp(-h * 3) * 0.22;
  return [c[0] + g + v * 0.5, c[1] + g * 0.42 + v * 0.25, c[2] + g * 0.15 + v * 0.35]; };
{ const W = 64, H = 32, daten = new Float32Array(W * H * 4); for(let j = 0; j < H; j++) for(let i = 0; i < W; i++){ const ph = (i + 0.5) / W * Math.PI * 2 - Math.PI, th = (j + 0.5) / H * Math.PI, y = Math.cos(th), r = Math.sin(th), c = himmelJS({x: r * Math.cos(ph), y: Math.abs(y) < 0 ? 0 : y, z: r * Math.sin(ph)}), a = ((H - 1 - j) * W + i) * 4; const dunkel = y < 0 ? 0.35 : 1; daten[a] = c[0] * dunkel; daten[a + 1] = c[1] * dunkel; daten[a + 2] = c[2] * dunkel; daten[a + 3] = 1; }
  const env = new THREE.DataTexture(daten, W, H, THREE.RGBAFormat, THREE.FloatType); env.mapping = THREE.EquirectangularReflectionMapping; env.magFilter = env.minFilter = THREE.LinearFilter; env.needsUpdate = true; scene.environment = env; scene.environmentIntensity = 3.2; }
{ const m = new THREE.MeshBasicNodeMaterial({side: THREE.BackSide, depthWrite: false, fog: false}), d = normalize(positionLocal), h = max(d.y, 0), w = max(d.x.negate().div(length(vec2(d.x, d.z)).max(0.0001)), 0), s = smoothstep(0, 0.6, h);
  const grund = mix(vec3(0.085, 0.14, 0.27), vec3(0.010, 0.022, 0.07), s), glut = pow(w, 3).mul(exp(h.mul(-6))).mul(0.9), viol = pow(w, 2).mul(exp(h.mul(-3))).mul(0.22);
  const zelle = floor(d.mul(620)), z1 = hash(zelle.x.add(zelle.y.mul(157.3)).add(zelle.z.mul(311.7))), stern = step(0.99945, z1).mul(smoothstep(0.03, 0.35, d.y)).mul(sin(U.zeit.mul(1.7).add(z1.mul(900))).mul(0.3).add(0.7)).mul(z1.sub(0.99945).mul(2600).add(0.5));
  const mr = normalize(vec3(0.55, 0.5, -0.67)), md = dot(d, mr), mond = smoothstep(0.99955, 0.9997, md).mul(smoothstep(0.99975, 0.9996, dot(d, normalize(vec3(0.562, 0.505, -0.655)))));
  const wolke = mx_noise_float(vec3(d.x.mul(3), d.y.mul(14), d.z.mul(3))).mul(0.5).add(0.5).mul(smoothstep(0.02, 0.1, d.y)).mul(smoothstep(0.34, 0.12, d.y));
  m.colorNode = grund.add(vec3(1, 0.42, 0.15).mul(glut)).add(vec3(0.5, 0.25, 0.35).mul(viol)).add(vec3(0.9, 0.45, 0.3).mul(wolke).mul(w.mul(0.16).add(0.012))).add(vec3(0.85, 0.9, 1).mul(stern)).add(vec3(1.6, 1.5, 1.3).mul(mond));
  const kugel = new THREE.Mesh(new THREE.SphereGeometry(5200, 48, 24), m); kugel.renderOrder = -10; kugel.frustumCulled = false; scene.add(kugel); }
const NEBEL = vec3(0.075, 0.115, 0.22);
{ const dist = positionView.z.negate(), tief = exp(positionWorld.y.max(0).mul(-0.045)); scene.fogNode = fog(NEBEL, exp(dist.mul(dist).mul(-0.0000007).sub(dist.mul(tief).mul(0.0007))).oneMinus()); }
const mond = new THREE.DirectionalLight(0xa9c0ff, 2.6); mond.position.set(190, 240, -150); mond.castShadow = !/[?&]ohne=[^&]*schatten/.test(location.search); mond.shadow.mapSize.set(klein ? 2048 : 4096, klein ? 2048 : 4096); mond.shadow.bias = -0.0006; mond.shadow.normalBias = 0.05;
Object.assign(mond.shadow.camera, {left: -330, right: 330, top: 330, bottom: -330, near: 10, far: 800}); scene.add(mond, mond.target);
const glut = new THREE.DirectionalLight(0xff9a5a, 1.1); glut.position.set(-300, 40, 30); scene.add(glut);

const Pipe = THREE.RenderPipeline || THREE.PostProcessing, pipe = new Pipe(renderer), sp = pass(scene, camera);
let bildKnoten = sp;
const AUS = k => new RegExp('[?&]ohne=[^&]*' + k).test(location.search);
if(!klein && !AUS('ao')){ const vor = pass(scene, camera); vor.setMRT(mrt({output: normalView})); const aoP = ao(vor.getTextureNode('depth'), vor.getTextureNode(), camera); aoP.resolutionScale = 0.5; aoP.radius.value = 1.1; sp.contextNode = builtinAOContext(aoP.getTextureNode().sample(screenUV).r); }
{ const b = sp.getTextureNode('output'), mit = b.add(bloom(b, 0.42, 0.55, 1.0)), l = dot(mit.rgb, vec3(0.3, 0.6, 0.1)), ton = mix(vec3(l), mit.rgb, 1.12).mul(mix(vec3(0.93, 0.98, 1.1), vec3(1.06, 1.0, 0.94), smoothstep(0.05, 0.9, l)));
  const rand = smoothstep(1.25, 0.35, length(screenUV.sub(0.5).mul(vec2(1.15, 1.0)).mul(2))); pipe.outputNode = vec4(ton.max(0).mul(mix(0.55, 1, rand)), 1); }
const steuer = new OrbitControls(camera, canvas); steuer.enableDamping = true; steuer.dampingFactor = 0.08; steuer.maxPolarAngle = 1.5; steuer.minDistance = 2; steuer.maxDistance = 900; steuer.listenToKeyEvents(window); steuer.keyPanSpeed = 14; steuer.touches = {ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN};
camera.position.set(260, 150, 420); steuer.target.set(0, 6, 0);

/* ---------- Stoffe: echte Oberflächen von Poly Haven, Maße in Metern ---------- */
const lader = new THREE.TextureLoader(), bildT = (pfad, srgb) => { const t = lader.load(pfad); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if(srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
const farbV = attribute('color', 'vec4');
function stoff(ordner, mass, {grau = 0, rauh = 1, metall = null} = {}){
  const m = new THREE.MeshStandardNodeMaterial(), u = uv().div(mass), p = NEU + 'stoffe/' + ordner + '/'; let f = texture(bildT(p + 'farbe.jpg', true), u).rgb;
  if(grau) f = mix(f, vec3(dot(f, vec3(0.3, 0.6, 0.1))).mul(1.9), grau);
  const fleck = mx_noise_float(positionWorld.mul(0.3)).mul(0.5).add(0.5), feucht = smoothstep(1.3, 0.0, farbV.a).mul(0.8), arm = texture(bildT(p + 'arm.jpg'), u);
  m.colorNode = f.mul(farbV.rgb).mul(mix(0.78, 1.06, fleck)).mul(mix(1, 0.6, feucht)); m.roughnessNode = arm.g.mul(rauh).mul(mix(1, 0.65, feucht)).clamp(0.05, 1); m.metalnessNode = metall == null ? arm.b : float(metall); m.aoNode = arm.r;
  m.normalNode = normalMap(texture(bildT(p + 'normal.jpg'), u)); return m;
}
const schlicht = (rauh, metall, leucht) => { const m = new THREE.MeshStandardNodeMaterial(); m.colorNode = leucht ? vec3(0.05) : farbV.rgb; m.roughnessNode = float(rauh); m.metalnessNode = float(metall); if(leucht) m.emissiveNode = leucht; return m; };
const STOFFE = {putz: () => stoff('painted_plaster_wall', 2.6), stein: () => stoff('medieval_blocks_02', 1.15), lack: () => stoff('weathered_brown_planks', 1.6, {grau: 1}), holz: () => stoff('dark_wooden_planks', 2), bretter: () => stoff('weathered_brown_planks', 2),
  ziegelwand: () => stoff('red_brick_03', 1.7), putzziegel: () => stoff('rough_plaster_brick_02', 2.4), dachziegel: () => stoff('clay_roof_tiles_02', 2.3), schiefer: () => stoff('roof_slates_02', 2.1), kupfer: () => stoff('green_metal_rust', 2, {metall: 0.5}),
  zink: () => schlicht(0.45, 0.85), lampe: () => schlicht(0.4, 0, vec3(1.0, 0.62, 0.28).mul(4)), uhr: () => schlicht(0.5, 0, vec3(1.0, 0.86, 0.6).mul(0.55))};

/* Boden vor den Daten: Wiese bis zum Horizont, Hügel erst außerhalb des Dorfs */
const rauschen = (x, z) => Math.sin(x * 0.004 + 1.3) * Math.cos(z * 0.0035 - 0.4) * 0.6 + Math.sin(x * 0.011 - z * 0.008) * 0.25 + Math.sin(x * 0.027 + z * 0.021) * 0.08;
const hoehe = (x, z) => { const r = Math.hypot(x, z), a = Math.min(1, Math.max(0, (r - 300) / 700)); return a * a * (3 - 2 * a) * (rauschen(x, z) * 90 + 34 * Math.min(1, (r - 300) / 1500)); };
const karte = document.createElement('canvas'); karte.width = karte.height = 2048; const KW = 760, kx = karte.getContext('2d'); kx.fillStyle = '#000'; kx.fillRect(0, 0, 2048, 2048);
const karteT = new THREE.CanvasTexture(karte); karteT.colorSpace = THREE.NoColorSpace; karteT.anisotropy = 8;
{ const g = new THREE.PlaneGeometry(9000, 9000, 220, 220); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for(let i = 0; i < p.count; i++) p.setY(i, hoehe(p.getX(i), p.getZ(i))); g.computeVertexNormals();
  const m = new THREE.MeshStandardNodeMaterial(), w = positionWorld.xz, ku = w.div(KW).add(0.5), kt = texture(karteT, vec2(ku.x, ku.y.oneMinus())), innen = step(abs(w.x), KW / 2).mul(step(abs(w.y), KW / 2));
  const kante = mx_noise_float(vec3(w.x.mul(0.9), 0, w.y.mul(0.9))).mul(0.18), pflaster = smoothstep(0.42, 0.58, kt.r.add(kante)).mul(innen), erde = smoothstep(0.4, 0.6, kt.g.add(kante)).mul(innen).mul(pflaster.oneMinus());
  const T = (o, s, n, srgb) => texture(bildT(NEU + 'stoffe/' + o + '/' + n + '.jpg', srgb), w.div(s));
  const gross = mx_noise_float(vec3(w.x.mul(0.012), 3, w.y.mul(0.012))).mul(0.5).add(0.5), pfuetze = smoothstep(0.52, 0.75, mx_noise_float(vec3(w.x.mul(0.11), 7, w.y.mul(0.11))).mul(0.5).add(0.5));
  const gras = T('aerial_grass_rock', 14, 'farbe', true).rgb.mul(mix(vec3(0.5, 0.62, 0.42), vec3(0.72, 0.74, 0.5), gross)), stein = T('cobblestone_floor_04', 3.2, 'farbe', true).rgb.mul(mix(0.5, 0.82, pfuetze.oneMinus())), boden = T('brown_mud_dry', 4, 'farbe', true).rgb.mul(0.7);
  m.colorNode = mix(mix(gras, boden, erde), stein, pflaster);
  m.roughnessNode = mix(mix(T('aerial_grass_rock', 14, 'arm').g, float(0.9), erde), T('cobblestone_floor_04', 3.2, 'arm').g.mul(mix(0.62, 0.12, pfuetze)), pflaster);
  m.metalnessNode = float(0); m.normalNode = normalMap(mix(T('aerial_grass_rock', 14, 'normal'), T('cobblestone_floor_04', 3.2, 'normal'), pflaster), mix(vec2(1), vec2(0.35), pfuetze.mul(pflaster)));
  const boden3 = new THREE.Mesh(g, m); boden3.receiveShadow = true; scene.add(boden3); }

/* ---------- Der Ortsplan aus dem Inhalt ---------- */
const HAEUSER = [], VIERTEL = [], LATERNEN = [], jeKnoten = new Map(), FENSTER = [];
const ZUSATZ_TITEL = [[/racer|Racing|TAXi|Taxi|Rally|Rush/, 'garage'], [/Einhorn|Märchen|Hörni|RAiNBOW|KiRi|Briefgarten/, 'maerchen'], [/Kleben|KLEBEN/, 'bastel'], [/Studio|MUSiC|KLANG|Klang|Music|KiNMiX|Narben/, 'musik'], [/ARCHiV|Archiv/, 'bibliothek'],
  [/atlas|Atlas|verstehen/, 'museum'], [/SEiN\b|Sadho/, 'kapelle'], [/TiSCH|Tisch|Begegnung/, 'saal'], [/Writer|Leser|REiM|honetic|Wort|Text|TXT|Passage|WORTEN/, 'schreibstube'], [/Deutsch|deutsch|Begleitraum/, 'schule'],
  [/Lichtwerk|KiNFORMER|WERK|Werk|deck|DECK|Pult/, 'werkstatt'], [/ZEIT|Lebensspirale|Denkentwicklung/, 'aussicht'], [/Spiral|SPiRAL|MiNDLAXY|Variantenfeld|Musterraum/, 'sternwarte'], [/GARDEN|Fugenland|Dazwischen|Rote Fäden/, 'heilhaus'], [/KiNTEGRiTY|iNVARiANT|Wirkgefüge/, 'post'], [/FUNKEN|ENTFALT|ENTDECK/, 'spielhof']];
const NACH_ORT = {'MiND-BODY-SOUL': 'heilhaus', 'GAMES': 'spielhof', 'MUSiC': 'musik', 'EDUCATiON': 'schule', 'WRiTING': 'schreibstube', 'ARTS': 'bastel', 'PERSONAL': 'klause', 'Tragwerk System': 'werkstatt', 'Zur Prüfung': 'werkstatt'};
function funktionFuer(k, ort){ for(const [re, f] of NACH_TITEL) if(re.test(k.name)) return f; if(k.eltern && k.eltern.art === 'bereich' && NACH_BEREICH[k.eltern.name]) return NACH_BEREICH[k.eltern.name];
  for(const [re, f] of ZUSATZ_TITEL) if(re.test(k.name)) return f; return NACH_ORT[ort] || 'schreibstube'; }
const MONAT = t => { const d = new Date(t); return d.getUTCFullYear() * 12 + d.getUTCMonth(); };
const monatsWort = m => new Date(Date.UTC(Math.floor(m / 12), m % 12, 15)).toLocaleDateString('de-DE', {month: 'long', year: 'numeric', timeZone: 'UTC'});

function plane(I){
  let nr = 0; const entwuerfe = [], unikat = new Set();
  const haus = (k, ort, bereich) => { const fass = fassungenVon(k).filter(f => f.art === 'fassung'), dat = fass.filter(f => f.von != null), monate = [...new Set(dat.map(f => MONAT(f.von)))].sort((a, b) => a - b), F = Math.min(3, monate.length);
    const etagen = Array.from({length: F}, () => []), zeiten = Array.from({length: F}, () => []); for(const f of dat){ const e = Math.floor(monate.indexOf(MONAT(f.von)) * F / monate.length); etagen[e].push(f); zeiten[e].push(MONAT(f.von)); }
    const dach = fass.filter(f => f.von == null), funktion = fass.length === 1 && /^Stelle aus/.test(k.name) ? 'bildstock' : funktionFuer(k, ort.name);
    let E, name = k.name + '|' + ort.name; for(let v = 0; v < 6; v++){ E = entwirf({name: name + (v ? '#' + v : ''), funktion, etagen: etagen.map(l => l.length), dachboden: dach.length, baustelle: OFFEN.has(ort.name)}); const sig = funktion + Math.round(E.breite * 2) + E.putz.join() + E.giebelstaendig + E.stock; if(!unikat.has(sig)){ unikat.add(sig); break; } }
    k._a = nr; for(const f of fassungenVon(k)) if(f.art === 'fassung'){ f._nr = nr++; f._a = f._nr; f._b = f._nr; } k._b = nr - 1;
    for(const w of k.kinder || []) if(w.kinder){ const fs = fassungenVon(w).filter(f => f.art === 'fassung'); if(fs.length){ w._a = Math.min(...fs.map(f => f._nr)); w._b = Math.max(...fs.map(f => f._nr)); } }
    const ord = l => l.slice().sort((a, b) => stimmeVon(a.stimme).n.localeCompare(stimmeVon(b.stimme).n) || a._nr - b._nr);
    const h = {k, E, ort, bereich, funktion, etagen: etagen.map(ord), dach: ord(dach), zeiten: zeiten.map(z => z.length ? [Math.min(...z), Math.max(...z)] : null), x: 0, z: 0, dreh: 0}; HAEUSER.push(h); jeKnoten.set(k, h); return h; };
  const appsIn = (k, ort, bereich, aus = []) => { for(const c of k.kinder || []){ if(c.art === 'app') aus.push(haus(c, ort, bereich)); else if(c.art === 'bereich' || c.art === 'ort') appsIn(c, ort, c.art === 'bereich' ? c : bereich, aus); } return aus; };
  const orte = I.wurzel.kinder.filter(k => k.art === 'ort'), mitte = orte.find(o => TRAGEND.has(o.name)), rest = orte.filter(o => o !== mitte);
  const STR = rest.map((o, j) => -Math.PI / 2 + Math.PI / 8 + j * Math.PI * 2 / Math.max(8, rest.length)), stell = (h, x, z, fx, fz) => { h.x = x; h.z = z; h.dreh = Math.atan2(fx, fz); };
  const wege = [], plaetze = [{x: 0, z: 0, r: 30}], ringe = [];
  // Zentrale: Ringe um den Markt, das Rathaus im Norden mit Blick nach Süden
  let Raus = 34;
  if(mitte){ const hs = appsIn(mitte, mitte, null).sort((a, b) => (b.k.name === 'Zentrale') - (a.k.name === 'Zentrale') || (a.k.von ?? 9e15) - (b.k.von ?? 9e15));
    let Rr = 36, a = -Math.PI / 2 - (hs[0] ? (hs[0].E.breite + 3) / Rr / 2 : 0), a0 = a, tief = 0; ringe.push(Rr - 3);
    for(const h of hs){ let bogen = (h.E.breite + 3.5) / (Rr + h.E.tiefe / 2);
      for(let v = 0; v < 12; v++){ const s = STR.find(t => { let d = ((t - (a + bogen / 2)) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI; return Math.abs(d) < bogen / 2 + 4.5 / Rr; }); if(s == null) break; a = s + 4.5 / Rr + ((((a - s) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI > 0 ? 0 : 0); a = s + 4.6 / Rr; while(a < a0) a += Math.PI * 2; }
      if(a + bogen > a0 + Math.PI * 2){ Rr += tief + 13; ringe.push(Rr - 3); a = a0 = -Math.PI / 2 + 0.2; tief = 0; bogen = (h.E.breite + 3.5) / (Rr + h.E.tiefe / 2); }
      const am = a + bogen / 2, rc = Rr + h.E.tiefe / 2; stell(h, Math.cos(am) * rc, Math.sin(am) * rc, -Math.cos(am), -Math.sin(am)); a += bogen; tief = Math.max(tief, h.E.tiefe); }
    Raus = Rr + tief + 9; VIERTEL.push({k: mitte, name: mitte.name, x: 0, z: 0, r: Raus, markt: true}); }
  // Viertel: je eine Straße nach außen, Häuser beidseits, das Älteste zuerst; Bereiche als Hof
  rest.forEach((o, j) => { const t = STR[j], dx = Math.cos(t), dz = Math.sin(t), px = -dz, pz = dx, alle = appsIn(o, o, null), direkt = alle.filter(h => !h.bereich).sort((a, b) => (a.k.von ?? 9e15) - (b.k.von ?? 9e15));
    let s = [Raus + 6, Raus + 6];
    for(const h of direkt){ const i = s[0] <= s[1] ? 0 : 1, sd = i ? 1 : -1, c = s[i] + h.E.breite / 2, q = 3.4 + h.E.tiefe / 2 + 1.2; stell(h, dx * c + px * sd * q, dz * c + pz * sd * q, -px * sd, -pz * sd); s[i] += h.E.breite + 3.5;
      if(LATERNEN.length % 1 === 0 && Math.floor(c / 22) !== Math.floor((c - h.E.breite - 3.5) / 22)) LATERNEN.push({x: dx * c + px * sd * 3.1, z: dz * c + pz * sd * 3.1}); }
    let ende = Math.max(s[0], s[1]);
    for(const b of [...new Set(alle.map(h => h.bereich).filter(Boolean))]){ const hs = alle.filter(h => h.bereich === b).sort((a, c) => c.E.breite - a.E.breite), um = hs.reduce((q, h) => q + h.E.breite + 4, 0) + 9, rB = Math.max(15, um / (Math.PI * 2)), cx = dx * (ende + rB + 5), cz = dz * (ende + rB + 5);
      let wl = 0, wr = 0; hs.forEach((h, n) => { const bogen = (h.E.breite + 4) / rB; let a; if(n === 0){ a = t; wl = wr = bogen / 2; } else if(n % 2){ a = t + wl + bogen / 2; wl += bogen; } else { a = t - wr - bogen / 2; wr += bogen; }
        const rc = rB + h.E.tiefe / 2; stell(h, cx + Math.cos(a) * rc, cz + Math.sin(a) * rc, -Math.cos(a), -Math.sin(a)); });
      plaetze.push({x: cx, z: cz, r: rB - 1, name: b.name, k: b}); for(let n = 0; n < 5; n++){ const a = t + Math.PI + (n - 2) * 1.1; LATERNEN.push({x: cx + Math.cos(a) * (rB - 2.5), z: cz + Math.sin(a) * (rB - 2.5)}); }
      ende += 2 * rB + Math.max(...hs.map(h => h.E.tiefe)) * 0.3 + 12; }
    wege.push({x0: dx * 26, z0: dz * 26, x1: dx * (ende - 4), z1: dz * (ende - 4), b: 5.4}); VIERTEL.push({k: o, name: o.name, x: dx * (Raus + 30), z: dz * (Raus + 30), tx: dx * (Raus + ende) / 2, tz: dz * (Raus + ende) / 2, r: (ende - Raus) / 2 + 20, winkel: t}); });
  for(let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2 + 0.2; LATERNEN.push({x: Math.cos(a) * 27, z: Math.sin(a) * 27, markt: true}); }
  // Straßenkarte für den Boden: rot = Pflaster, grün = Erde der Gärten
  const P = v => (v / KW + 0.5) * 2048; kx.lineCap = 'round'; kx.globalCompositeOperation = 'lighter'; kx.shadowBlur = 5;
  kx.fillStyle = kx.strokeStyle = kx.shadowColor = '#00ff00'; for(const h of HAEUSER){ kx.save(); kx.translate(P(h.x), P(h.z)); kx.rotate(-h.dreh); const s = 2048 / KW; kx.fillRect(-(h.E.breite / 2 + 2.5) * s, -(h.E.tiefe / 2 + 7) * s, (h.E.breite + 5) * s, (h.E.tiefe + 9.5) * s); kx.restore(); }
  kx.fillStyle = kx.strokeStyle = kx.shadowColor = '#ff0000'; for(const p of plaetze){ kx.beginPath(); kx.arc(P(p.x), P(p.z), p.r * 2048 / KW, 0, 7); kx.fill(); }
  for(const w of wege){ kx.lineWidth = w.b * 2048 / KW; kx.beginPath(); kx.moveTo(P(w.x0), P(w.z0)); kx.lineTo(P(w.x1), P(w.z1)); kx.stroke(); }
  for(const r of ringe){ kx.lineWidth = 4.4 * 2048 / KW; kx.beginPath(); kx.arc(P(0), P(0), r * 2048 / KW, 0, 7); kx.stroke(); }
  for(const h of HAEUSER){ kx.lineWidth = 1.6 * 2048 / KW; const fx = Math.sin(h.dreh), fz = Math.cos(h.dreh); kx.beginPath(); kx.moveTo(P(h.x + fx * h.E.tiefe / 2), P(h.z + fz * h.E.tiefe / 2)); kx.lineTo(P(h.x + fx * (h.E.tiefe / 2 + 5.5)), P(h.z + fz * (h.E.tiefe / 2 + 5.5))); kx.stroke(); }
  karteT.needsUpdate = true; return {plaetze, wege, ringe, Raus};
}

/* ---------- Bauen ---------- */
const ATLAS = 4096, ATLAS_H = 2048, KW_B = 160, KH_B = 100, SPALTEN = Math.floor(ATLAS / KW_B), atlas = document.createElement('canvas'); atlas.width = ATLAS; atlas.height = ATLAS_H; const ax = atlas.getContext('2d'); ax.fillStyle = '#000'; ax.fillRect(0, 0, ATLAS, ATLAS_H);
const atlasT = new THREE.CanvasTexture(atlas); atlasT.colorSpace = THREE.SRGBColorSpace; atlasT.anisotropy = 8; atlasT.generateMipmaps = true;
let PLAN = null;
function baueDorf(I){
  PLAN = plane(I); const S = new Sammler(); let feldNr = 0; const mitBild = [];
  for(const h of HAEUSER){ h.lage = new THREE.Matrix4().makeRotationY(h.dreh).setPosition(h.x, 0, h.z); h.invers = h.lage.clone().invert();
    const beleg = l => l.map(f => ({nummer: f._nr, hatBild: !!f.bild, stimme: toene(farbe(stimmeVon(f.stimme).f), stimmeVon(f.stimme).n === 'Übernommener Bestand' ? 0.55 : 0.8), f}));
    const erg = baue(S, h.E, h.lage, {etagen: h.etagen.map(beleg), dach: beleg(h.dach)}); h.bau = erg; h.fenster = [];
    const jeNr = new Map(); for(const l of [...h.etagen, h.dach]) for(const f of l) jeNr.set(f._nr, f);
    for(const w of erg.fenster){ const f = jeNr.get(w.nummer); w.f = f; w.haus = h; f._fenster = w; h.fenster.push(w); FENSTER.push(w);
      if(f.bild){ const n = feldNr++, sp = n % SPALTEN, ze = Math.floor(n / SPALTEN), b = S.scheiben.b, pad = 3; w.feld = [sp * KW_B, ze * KH_B]; mitBild.push(w);
        for(let e = 0; e < 4; e++){ const o = (w.ecke + e) * 4; b[o] = (sp * KW_B + pad) / ATLAS; b[o + 1] = 1 - ((ze + 1) * KH_B - pad) / ATLAS_H; b[o + 2] = (KW_B - 2 * pad) / ATLAS; b[o + 3] = (KH_B - 2 * pad) / ATLAS_H; } }
      else { const b = S.scheiben.b; for(let e = 0; e < 4; e++) b[(w.ecke + e) * 4 + 3] = 0; } }
    for(const l of erg.lampen) LATERNEN.push({x: l.x, z: l.z, y: l.y, tuer: true}); }
  // Laternen: Mast, Arm, Leuchte
  for(const l of LATERNEN){ if(l.tuer) continue; S.fuss = 0; S.mit(new THREE.Matrix4().makeRotationY(Math.atan2(-l.x, -l.z)).setPosition(l.x, 0, l.z), () => { const Z = [0.12, 0.13, 0.15];
    S.drehkoerper('zink', 0, 0, [[0.14, 0], [0.09, 0.5], [0.05, 0.7], [0.045, 3.7]], 8, Z); S.balken('zink', [0, 3.65, 0], [0, 3.85, 0.75], 0.045, 0.045, Z); S.drehkoerper('zink', 0, 0.75, [[0.2, 3.8], [0.03, 3.98]], 6, Z); S.drehkoerper('lampe', 0, 0.75, [[0.07, 3.48], [0.15, 3.78]], 6, [1, 1, 1]); l.y = 3.6; }); }
  // Brunnen auf dem Markt
  S.fuss = 0; S.drehkoerper('stein', 0, 0, [[3.4, -0.3], [3.4, 0.75], [3.1, 0.75], [3.1, 0.45], [0, 0.45]], 24, [0.8, 0.78, 0.74]); S.drehkoerper('stein', 0, 0, [[0.45, 0.4], [0.35, 2.2], [1.1, 2.4], [1.15, 2.55], [0.2, 2.6], [0.14, 3.3], [0, 3.4]], 16, [0.8, 0.78, 0.74]);
  for(const [name, mk] of Object.entries(STOFFE)){ const g = S.geometrie(name); if(!g) continue; const m = new THREE.Mesh(g, mk()); m.castShadow = name !== 'lampe' && name !== 'uhr'; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); }
  // Fensterscheiben: das echte Bild der Fassung als Licht
  { const g = S.scheibenGeometrie(), m = new THREE.MeshBasicNodeMaterial(), feld = attribute('feld', 'vec4'), nr = attribute('nummer', 'float'), hat = step(0.00001, feld.z);
    const bild = texture(atlasT, feld.xy.add(uv().mul(feld.zw))).rgb, da = smoothstep(0.0, 0.04, max(bild.r, max(bild.g, bild.b))).mul(hat), z = hash(nr.add(3.7));
    const matt = vec3(1.0, 0.6, 0.27).mul(mix(0.55, 1.0, z)).mul(mix(0.75, 1.1, uv().y)).mul(mx_noise_float(vec3(uv().x.mul(3), uv().y.mul(2), nr)).mul(0.12).add(0.9));
    const drin = step(U.selA, nr).mul(step(nr, U.selB)), wahl = mix(float(1), mix(float(0.3), float(1.7), drin), U.selAn);
    m.colorNode = mix(matt.mul(0.5), bild.mul(0.95).add(vec3(0.03, 0.018, 0.006)), da).mul(wahl); const sch = new THREE.Mesh(g, m); sch.frustumCulled = false; scene.add(sch); }
  // Lichtflecke am Boden unter Laternen und Türlampen
  { const p = [], u = [], ix = []; LATERNEN.forEach((l, n) => { const r = l.tuer ? 3.2 : 9, i0 = n * 4, cx = l.x, cz = l.z; for(const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ p.push(cx + a * r, 0.05, cz + b * r); u.push(a, b); } ix.push(i0, i0 + 2, i0 + 1, i0, i0 + 3, i0 + 2); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); g.setIndex(ix);
    const m = new THREE.MeshBasicNodeMaterial({transparent: true, blending: THREE.AdditiveBlending, depthWrite: false}); const rr = length(uv()); m.colorNode = vec3(1.0, 0.55, 0.22).mul(pow(rr.oneMinus().max(0), 2.2)).mul(0.5); const k = new THREE.Mesh(g, m); k.frustumCulled = false; k.renderOrder = 2; scene.add(k); }
  const naechste = AUS('licht') ? [] : LATERNEN.filter(l => l.markt).slice(0, klein ? 4 : 10); for(const l of naechste){ const pl = new THREE.PointLight(0xffb060, 90, 34, 2); pl.position.set(l.x * 0.97, 3.5, l.z * 0.97); scene.add(pl); }
  ladeBilder(mitBild); pflanze();
}
async function ladeBilder(liste){ let i = 0, offen = 0, neu = false; const zeit = setInterval(() => { if(neu){ atlasT.needsUpdate = true; neu = false; } if(i >= liste.length && !offen) { clearInterval(zeit); atlasT.needsUpdate = true; } }, 2600);
  const einer = async () => { while(i < liste.length){ const w = liste[i++]; offen++; try{ const r = await fetch(bildUrl(w.f.bild, 240)); if(r.ok){ const bm = await createImageBitmap(await r.blob()), s = Math.max(KW_B / bm.width, KH_B / bm.height), bw = KW_B / s, bh = KH_B / s; ax.drawImage(bm, (bm.width - bw) / 2, (bm.height - bh) / 2, bw, bh, w.feld[0], w.feld[1], KW_B, KH_B); neu = true; } }catch(e){ /* das Fenster bleibt mattes Glas */ } offen--; } };
  for(let n = 0; n < 8; n++) einer(); }
/* Bäume und Büsche in den Gärten und am Rand: Grund, trägt nichts */
async function pflanze(){ const gl = new GLTFLoader(), z = zufall(77), frei = (x, zz, r) => !HAEUSER.some(h => Math.hypot(h.x - x, h.z - zz) < Math.max(h.E.breite, h.E.tiefe) / 2 + r) && Math.hypot(x, zz) > 33;
  const setze = async (datei, hoch, stellen) => { try{ const g = await gl.loadAsync(NEU + 'modelle/' + datei); g.scene.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(g.scene), k = hoch / (box.max.y - box.min.y), d = new THREE.Object3D();
      g.scene.traverse(o => { if(!o.isMesh) return; const im = new THREE.InstancedMesh(o.geometry, o.material, stellen.length); stellen.forEach((s, n) => { d.position.set(s[0], hoehe(s[0], s[1]) - box.min.y * k * s[2], s[1]); d.rotation.set(0, s[3], 0); d.scale.setScalar(k * s[2]); d.updateMatrix(); im.setMatrixAt(n, d.matrix.clone().multiply(o.matrixWorld)); }); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); }); }catch(e){ /* ohne Bäume */ } };
  const baeume = [], buesche = []; for(const h of HAEUSER){ const bx = -Math.sin(h.dreh), bz = -Math.cos(h.dreh), qx = Math.cos(h.dreh), qz = -Math.sin(h.dreh); for(let n = 0; n < 2; n++){ const a = h.E.tiefe / 2 + 3 + z() * 4, s = (z() - 0.5) * h.E.breite, x = h.x + bx * a + qx * s, zz = h.z + bz * a + qz * s; if(frei(x, zz, 2.5)) (n ? buesche : baeume).push([x, zz, 0.7 + z() * 0.7, z() * 7]); } }
  // Ferner Wald: leichte dunkle Kronen, im Dunst nur Umriss
  { const kr = new THREE.IcosahedronGeometry(1, 1), m = new THREE.MeshStandardNodeMaterial(); m.colorNode = vec3(0.035, 0.06, 0.04).mul(mx_noise_float(positionWorld.mul(0.6)).mul(0.25).add(0.9)); m.roughnessNode = float(1); const N = klein ? 500 : 1100, im = new THREE.InstancedMesh(kr, m, N), d = new THREE.Object3D();
    for(let n = 0; n < N; n++){ const a = z() * Math.PI * 2, r = 300 + Math.pow(z(), 1.6) * 1500, x = Math.cos(a) * r, zz = Math.sin(a) * r, g = 4 + z() * 5; d.position.set(x, hoehe(x, zz) + g * 0.9, zz); d.scale.set(g * (0.8 + z() * 0.5), g * (1.2 + z() * 0.6), g * (0.8 + z() * 0.5)); d.rotation.set(0, z() * 7, 0); d.updateMatrix(); im.setMatrixAt(n, d.matrix); } im.frustumCulled = false; scene.add(im); }
  // Gartenbäume: Stamm und Krone, leicht; das feine Modell steht nur als Dorflinde und an wenigen Plätzen
  { const kr = new THREE.SphereGeometry(1, 14, 10), kp = kr.attributes.position; for(let i = 0; i < kp.count; i++){ const f = 1 + Math.sin(kp.getX(i) * 5.1 + kp.getY(i) * 3.3) * 0.13 + Math.sin(kp.getZ(i) * 6.7) * 0.1; kp.setXYZ(i, kp.getX(i) * f, kp.getY(i) * f, kp.getZ(i) * f); } kr.computeVertexNormals();
    const lm = new THREE.MeshStandardNodeMaterial(); lm.colorNode = vec3(0.09, 0.15, 0.07).mul(mx_noise_float(positionWorld.mul(1.7)).mul(0.5).add(0.85)); lm.roughnessNode = float(0.95); const sm = STOFFE.holz ? new THREE.MeshStandardNodeMaterial({color: 0x2a2018, roughness: 1}) : null;
    const kronen = new THREE.InstancedMesh(kr, lm, baeume.length * 3), staemme = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.2, 1, 6), sm, baeume.length), d = new THREE.Object3D();
    baeume.forEach((b, n) => { const hh = 4.5 * b[2] + 1.5; d.rotation.set(0, 0, 0); d.position.set(b[0], hh * 0.3, b[1]); d.scale.set(1, hh * 0.6, 1); d.updateMatrix(); staemme.setMatrixAt(n, d.matrix);
      for(let q = 0; q < 3; q++){ const r = (1.5 + z() * 0.9) * b[2]; d.position.set(b[0] + (z() - 0.5) * 1.6 * b[2], hh * (0.62 + q * 0.16), b[1] + (z() - 0.5) * 1.6 * b[2]); d.scale.set(r, r * (0.8 + z() * 0.3), r); d.rotation.set(z(), z() * 6, 0); d.updateMatrix(); kronen.setMatrixAt(n * 3 + q, d.matrix); } });
    for(const im of [kronen, staemme]){ im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); } }
  await setze('tree_small_02.glb', 9, [[-12, 10, 1, 1]]); await setze('shrub_02.glb', 1.5, buesche.slice(0, klein ? 40 : 110)); }

/* ---------- Wahl, Kamera, Namen ---------- */
const hausVon = k => { for(let q = k; q; q = q.eltern) if(jeKnoten.has(q)) return jeKnoten.get(q); return null; };
function artName(k){ if(k.art === 'ort') return TRAGEND.has(k.name) ? 'Marktplatz · Zentrale' : OFFEN.has(k.name) ? 'Baustelle · noch ohne Ort' : 'Viertel'; if(k.art === 'bereich') return 'Hof'; const h = jeKnoten.get(k); if(h) return 'Haus · ' + (FUNKTIONEN[h.funktion] || {name: ''}).name; if(k.art === 'fassung') return k.von == null ? 'Fenster · Dachboden' : 'Fenster'; return ''; }
function blattTitel(k){ const h = jeKnoten.get(k); if(h){ const t = h.zeiten.map((z, i) => z ? `${i === 0 ? 'unten' : i === h.zeiten.length - 1 ? 'oben' : 'Mitte'} ${z[0] === z[1] ? monatsWort(z[0]) : monatsWort(z[0]) + ' bis ' + monatsWort(z[1])}` : '').filter(Boolean); return (t.length ? 'Stockwerke: ' + t.join(', ') + '. ' : '') + (h.dach.length ? `Unter dem Dach: ${h.dach.length} ${h.dach.length === 1 ? 'Fassung' : 'Fassungen'} ohne belegtes Datum.` : ''); }
  if(k.art === 'fassung') return k.von == null ? 'Sitzt unter dem Dach, weil kein Datum belegt ist.' : ''; return ''; }
function zusatz(k, kn){ if(k.art !== 'ort') kn('Hingehen', () => egoStart(k)); }
let flug = null;
function fliege(pos, ziel, dauer = 2.4){ if(ruhig){ camera.position.copy(pos); steuer.target.copy(ziel); return; } flug = {p0: camera.position.clone(), z0: steuer.target.clone(), p1: pos, z1: ziel, t: 0, dauer}; }
function sichtAuf(k){ const h = hausVon(k);
  if(k && k.art === 'fassung' && k._fenster){ const w = k._fenster, n = w.n, ab = 6.5; return [w.mitte.clone().addScaledVector(n, ab).add(new THREE.Vector3(0, 0.6, 0)).setY(Math.max(1.7, w.mitte.y + 0.6)), w.mitte.clone()]; }
  if(h){ const f = new THREE.Vector3(Math.sin(h.dreh), 0, Math.cos(h.dreh)), q = new THREE.Vector3(f.z, 0, -f.x), ab = Math.max(h.E.breite * 0.95, h.E.hoehe * 1.5, 13) + h.E.tiefe / 2, m = new THREE.Vector3(h.x, h.E.hoehe * 0.45, h.z); return [m.clone().addScaledVector(f, ab).addScaledVector(q, ab * 0.32).setY(h.E.hoehe * 0.55 + 3), m]; }
  const v = k && (VIERTEL.find(v => v.k === k) || PLAN.plaetze.find(p => p.k === k)); if(v && v.markt) return [new THREE.Vector3(34, 26, 62), new THREE.Vector3(0, 5, -8)];
  if(v){ const x = v.tx ?? v.x, z = v.tz ?? v.z, r = v.r; return [new THREE.Vector3(x * 0.62 + 20, r * 0.75 + 20, z * 0.62 + r * 0.9), new THREE.Vector3(x, 4, z)]; }
  return [new THREE.Vector3(150, 95, 300), new THREE.Vector3(0, 8, 0)]; }
function waehleInWelt(k, mitFlug){ if(!HAEUSER.length) return; if(k && k._a != null){ U.selA.value = k._a - 0.5; U.selB.value = k._b + 0.5; U.selAn.value = 1; } else if(k && (k.art === 'ort' || k.art === 'bereich')){ const hs = HAEUSER.filter(h => h.ort === k || h.bereich === k); if(hs.length){ U.selA.value = Math.min(...hs.map(h => h.k._a)) - 0.5; U.selB.value = Math.max(...hs.map(h => h.k._b)) + 0.5; U.selAn.value = 0.6; } } else U.selAn.value = 0;
  if(mitFlug && !Ego.an){ const [p, z] = sichtAuf(k); fliege(p, z); } }
const strahl = new THREE.Raycaster(), maus = new THREE.Vector2(), lo = new THREE.Vector3(), ld = new THREE.Vector3(), v3 = new THREE.Vector3();
function treffe(x, y, radius){ maus.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); strahl.setFromCamera(maus, camera); let best = null, bt = Infinity;
  for(const h of HAEUSER){ lo.copy(strahl.ray.origin).applyMatrix4(h.invers); ld.copy(strahl.ray.direction).transformDirection(h.invers); const mn = [-h.E.breite / 2 - 0.5, 0, -h.E.tiefe / 2 - 0.5], mx = [h.E.breite / 2 + 0.5, h.E.hoehe, h.E.tiefe / 2 + 0.5], o = [lo.x, lo.y, lo.z], d = [ld.x, ld.y, ld.z]; let t0 = 0, t1 = Infinity;
    for(let a = 0; a < 3; a++){ const i = 1 / d[a]; let n = (mn[a] - o[a]) * i, f = (mx[a] - o[a]) * i; if(n > f) [n, f] = [f, n]; t0 = Math.max(t0, n); t1 = Math.min(t1, f); } if(t0 <= t1 && t0 < bt){ bt = t0; best = h; } }
  if(!best) return null; if(bt > 70) return best.k; let bw = null, bd = radius * 1.6;
  for(const w of best.fenster){ if(v3.subVectors(camera.position, w.mitte).dot(w.n) < 0) continue; v3.copy(w.mitte).project(camera); if(v3.z > 1) continue; const d = Math.hypot((v3.x + 1) / 2 * innerWidth - x, (1 - v3.y) / 2 * innerHeight - y); if(d < bd){ bd = d; bw = w; } }
  return bw ? bw.f : best.k; }
R.tippen(canvas, treffe, () => { flug = null; fahrtAus(); });

/* Geführte Fahrt als Einstieg, überspringbar */
let fahrt = null; const fahrtKn = $('#fahrt');
function fahrtAus(){ if(fahrt){ fahrt = null; fahrtKn.hidden = true; } }
fahrtKn.onclick = () => { fahrtAus(); const [p, z] = sichtAuf(R.gewaehlt); fliege(p, z, 1.6); };
function fahrtStart(){ if(ruhig || R.gewaehlt){ const [p, z] = sichtAuf(R.gewaehlt); camera.position.copy(p); steuer.target.copy(z); return; }
  const P = new THREE.CatmullRomCurve3([new THREE.Vector3(330, 120, 560), new THREE.Vector3(170, 60, 330), new THREE.Vector3(60, 22, 150), new THREE.Vector3(20, 9, 62), new THREE.Vector3(34, 26, 62)]), Z = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 20, 0), new THREE.Vector3(0, 12, 0), new THREE.Vector3(0, 8, -10), new THREE.Vector3(0, 7, -30), new THREE.Vector3(0, 5, -8)]);
  fahrt = {P, Z, t: 0, dauer: 15}; fahrtKn.hidden = false; }

/* Ich-Ansicht: zu Fuß durchs Dorf */
const Ego = ego({camera, canvas, steuer, boden: hoehe, augen: 1.7, tempo: 9, schnell: 28, knopf: $('#knEgo'), sage,
  sperre: (x, z) => { for(const h of HAEUSER){ if(Math.abs(h.x - x) > 40 || Math.abs(h.z - z) > 40) continue; const c = Math.cos(h.dreh), s = Math.sin(h.dreh), lx = c * (x - h.x) - s * (z - h.z), lz = s * (x - h.x) + c * (z - h.z); if(Math.abs(lx) < h.E.breite / 2 + 0.5 && Math.abs(lz) < h.E.tiefe / 2 + 0.5) return true; } return Math.hypot(x, z) < 3.8; },
  beiStart: () => { flug = null; fahrtAus(); }});
function egoStart(k){ const h = hausVon(k); if(h){ const f = new THREE.Vector3(Math.sin(h.dreh), 0, Math.cos(h.dreh)), ab = h.E.tiefe / 2 + 9; Ego.start(new THREE.Vector3(h.x, 0, h.z).addScaledVector(f, ab), new THREE.Vector3(h.x, h.E.hoehe * 0.4, h.z)); } else Ego.start(); }

const proj = new THREE.Vector3();
function namen(){ const kand = [], cp = camera.position;
  for(const v of VIERTEL){ const d = cp.distanceTo(v3.set(v.x, 0, v.z)); kand.push({text: v.markt ? 'Marktplatz' : v.name, unter: v.markt ? 'Zentrale · Tragwerk System' : OFFEN.has(v.name) ? 'Baustelle · noch ohne Ort' : `${HAEUSER.filter(h => h.ort === v.k).length} Häuser`, klasse: v.markt ? 'kern' : 'sonne', prio: 900 - d * 0.1, p: [v.x, v.markt ? 16 : 14, v.z]}); }
  for(const p of PLAN.plaetze) if(p.name) kand.push({text: p.name, unter: 'Hof', klasse: 'sonne', prio: 700, p: [p.x, 12, p.z]});
  for(const h of HAEUSER){ const d = Math.hypot(cp.x - h.x, cp.z - h.z, cp.y - h.E.hoehe); if(d > 230 && R.gewaehlt !== h.k) continue; kand.push({text: h.k.name, klasse: R.gewaehlt === h.k ? 'gew' : '', prio: (R.gewaehlt === h.k ? 2000 : 500) - d + Math.min(40, h.k.fassungen), p: [h.x, h.E.hoehe + 1.2, h.z]}); }
  const g = R.gewaehlt; if(g && g.art === 'fassung' && g._fenster) kand.push({text: g.name, klasse: 'gew', prio: 3000, p: [g._fenster.mitte.x, g._fenster.mitte.y + 1, g._fenster.mitte.z]});
  R.namen(kand, c => { proj.set(c.p[0], c.p[1], c.p[2]).project(camera); return proj.z > 1 ? null : [(proj.x + 1) / 2 * innerWidth, (1 - proj.y) / 2 * innerHeight, 4]; }, klein ? 14 : 34); }

let letzte = performance.now(), bilder = 0, fpsZeit = performance.now();
function lauf(){ const jetzt = performance.now(), dt = Math.min(0.05, (jetzt - letzte) / 1000); letzte = jetzt; U.zeit.value += dt;
  if(fahrt){ fahrt.t += dt / fahrt.dauer; const t = Math.min(1, fahrt.t), e = t * t * (3 - 2 * t); camera.position.copy(fahrt.P.getPoint(e)); steuer.target.copy(fahrt.Z.getPoint(e)); camera.lookAt(steuer.target); if(t >= 1) fahrtAus(); }
  else if(flug){ flug.t += dt / flug.dauer; const t = Math.min(1, flug.t), e = t * t * t * (t * (6 * t - 15) + 10); camera.position.lerpVectors(flug.p0, flug.p1, e); camera.position.y += Math.sin(e * Math.PI) * Math.min(30, flug.p0.distanceTo(flug.p1) * 0.12); steuer.target.lerpVectors(flug.z0, flug.z1, e); camera.lookAt(steuer.target); if(t >= 1) flug = null; }
  else if(Ego.an) Ego.schritt(dt); else steuer.update();
  if(!Ego.an) camera.position.y = Math.max(camera.position.y, hoehe(camera.position.x, camera.position.z) + 1.2);
  if(HAEUSER.length) namen(); pipe.render();
  if(!messung.erstesBild) messung.erstesBild = Math.round(jetzt - T0); bilder++; if(jetzt - fpsZeit > 1000){ messung.fps = Math.round(bilder * 1000 / (jetzt - fpsZeit)); bilder = 0; fpsZeit = jetzt; } }
renderer.setAnimationLoop(lauf);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

/* ---------- Der Bestand ---------- */
try{ const {I, bezug} = await ladeBestand(); const k0 = R.start(I, bezug); baueDorf(I); messung.bestand = Math.round(performance.now() - T0);
  if(k0) R.waehle(k0, false, false); fahrtStart();
  sage(`${HAEUSER.length} Häuser, ${FENSTER.length} Fenster, jedes eine Fassung. Ziehen dreht · Tippen wählt · zweimal tippen liest · „Gehen“ führt zu Fuß hindurch`, 9000);
}catch(e){ console.error(e); sage('Der Bestand ließ sich nicht lesen. Läuft der Dienst?', 0); }
window.__dorf = {messung, renderer, get gewaehlt(){ return R.gewaehlt && R.gewaehlt.name; }, fliege: name => { const k = R.I && R.I.alle.find(x => x.name === name); if(k) R.waehle(k); return !!k; }, ueberspringe: () => fahrtKn.onclick(), zahlen: () => ({haeuser: HAEUSER.length, fenster: FENSTER.length, mitBild: FENSTER.filter(w => w.feld).length, arten: [...new Set(HAEUSER.map(h => h.funktion))].length}), ego: Ego, camera, steuer, HAEUSER};
