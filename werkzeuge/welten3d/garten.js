/* =====================================================================
   GARTEN — die zweite 3D-Welt (11.11.2026). Derselbe Inhalt wie in jeder Ansicht, hier als lebendiger Garten.
   Lichtung = Zentrale (Tragwerk System). Beete aus Erde = die sieben Oberdächer, das älteste Beet zuerst, innen das Älteste.
   Bereiche (FASKA, Rebeca Wild) = eigene Abteile im Beet, hinter einer niedrigen Hecke. Noch ohne Ort = Pflanzen in Töpfen am Eingang.
   Pflanze = App. Ihre Art folgt der belegten Abstammung (LICHTGRUND Schritt 13):
     verzweigt = Baum mit Stamm und Ästen (Ast = Werk oder belegte Gabel), lange Kette = Ranke am Stab,
     kurz oder einzeln = Blume, ohne belegte Herkunft = Blumenwiese, jede Fassung einzeln aus dem Boden.
   Eine Fassung ist genau ein Ding: ein Blatt, eine Blüte (obenauf, die jüngste eines Triebs) oder die Frucht (unten, die Grundformation).
   Farbe = Stimme. Höhe = Arbeit. Gespräche liegen als Samen am Fuß der Pflanze.
   Belegte Beziehungen zwischen Pflanzen laufen als leuchtendes Myzel am Boden, berechnete Nähe nur auf Wunsch, blau gestrichelt.
   Bäume am Rand, Gras, Büsche, Steine und Himmel sind Grund und tragen nichts. Nichts wird geschrieben.
   ===================================================================== */
import * as THREE from 'three/webgpu';
import {uniform, vec2, vec3, vec4, float, uv, mix, smoothstep, sin, cos, abs, fract, step, normalize, dot, pow, clamp,
  positionLocal, positionGeometry, positionWorld, normalWorld, texture, instancedBufferAttribute, instanceIndex, hash, normalMap, pass, max, attribute} from 'three/tsl';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Tree} from '@dgreenheck/ez-tree';
import {ego} from './ego.js';
import {$, rahmen, ladeBestand, sage, klein, tablet, ruhig, bildUrl, stimmeVon, ORTFARBE, ortVon, fassungenVon, mengenWort, OFFEN, TRAGEND} from './rahmen.js';

const canvas = $('#welt'), T0 = performance.now(), messung = {erstesBild: 0, bestand: 0, fps: 0};
const NEU = 'neu/';
function zufall(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hashS = s => { let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const arbeit = k => Math.min(1, Math.max(0.03, Math.log10(1 + (k.zeichen || 0) / 1500) / 3.4));
const alterVon = k => k.von == null ? Infinity : k.von;
const nachZeit = (a, b) => alterVon(a) - alterVon(b) || a.name.localeCompare(b.name, 'de');

/* ---------- Grafik ---------- */
const forceWebGL = /[?&]webgl/.test(location.search) || !navigator.gpu || !(await navigator.gpu.requestAdapter().catch(() => null));
const renderer = new THREE.WebGPURenderer({canvas, antialias: true, forceWebGL, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, klein ? 1.6 : tablet ? 1.5 : 1.75)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
try{ await renderer.init(); }catch(e){ sage('Diese Welt braucht WebGPU oder WebGL 2.', 0); throw e; }
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(klein && innerHeight > innerWidth ? 55 : 42, innerWidth / innerHeight, 0.05, 4000);
const U = {zeit: uniform(0), myzel: uniform(0.22), wind: uniform(1), licht: uniform(1)};
const R = rahmen({welt: 'garten', artName, waehleInWelt, zusatz, blattTitel});
sage('Der Garten wächst. Der Bestand wird gelesen …', 0);

/* Himmel: das Foto ist zugleich das Licht. Die Sonne steht, wo es am hellsten ist */
const hdr = await new HDRLoader().setDataType(THREE.FloatType).loadAsync(NEU + 'himmel.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping; scene.environment = hdr; scene.background = hdr; scene.environmentIntensity = 0.6; scene.backgroundIntensity = 0.95;
let sonneU = 0.5, sonneV = 0.25; { const {data, width, height} = hdr.image; let m = -1; const st = data.length / (width * height); for(let j = 0; j < height * 0.5; j += 2) for(let i = 0; i < width; i += 2){ const a = (j * width + i) * st, l = data[a] + data[a + 1] + data[a + 2]; if(l > m){ m = l; sonneU = i / width; sonneV = j / height; } } if(hdr.flipY) sonneV = 1 - sonneV; }
const sw = (sonneU - 0.5) * Math.PI * 2, shoch = THREE.MathUtils.clamp((0.5 - Math.min(sonneV, 1 - sonneV)) * Math.PI, 0.22, 0.75), sonneD = new THREE.Vector3(Math.cos(sw) * Math.cos(shoch), Math.sin(shoch), Math.sin(sw) * Math.cos(shoch));
const sonne = new THREE.DirectionalLight(0xffd6a8, 5.2); scene.add(sonne, sonne.target);
scene.fog = new THREE.FogExp2(0xc9b9a4, 0.0016);

/* Grund vor den Daten: ein ruhiges Gelände, damit sofort etwas da ist */
const garten = new THREE.Group(); scene.add(garten);
const Pipe = THREE.RenderPipeline || THREE.PostProcessing, pipe = new Pipe(renderer), sp = pass(scene, camera), bild = sp.getTextureNode('output');
pipe.outputNode = bild.add(bloom(bild, 0.35, 0.5, 0.82));
const steuer = new OrbitControls(camera, canvas); steuer.enableDamping = true; steuer.dampingFactor = 0.08; steuer.maxPolarAngle = 1.47; steuer.minDistance = 0.6; steuer.maxDistance = 600; steuer.listenToKeyEvents(window); steuer.keyPanSpeed = 12; steuer.touches = {ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN};
camera.position.set(140, 110, -150); steuer.target.set(0, 0, 0);

/* ---------- Bauplan des Gartens aus dem Inhalt ---------- */
const ABSTAMMUNG = new Set(['folgt auf', 'stammt aus', 'remixt aus', 'erweitert']);
const PFLANZEN = [], BEETE = [], jePflanze = new Map(), jeFassung = new Map();
let RL = 14, RG = 60;   // Radius der Lichtung, Radius des Gartens

function pflanzenArt(app, I){
  const fass = fassungenVon(app), werke = (app.kinder || []).filter(c => c.kinder && c.art !== 'gespraech');
  const set = new Set(fass), kinder = new Map(), eltern = new Map();
  for(const e of R.bezug.kanten){ if(!e.belegt || !ABSTAMMUNG.has(e.art) || !set.has(e.von) || !set.has(e.zu) || e.von === e.zu) continue;
    if(!kinder.has(e.zu)) kinder.set(e.zu, []); if(!kinder.get(e.zu).includes(e.von)) kinder.get(e.zu).push(e.von); if(!eltern.has(e.von)) eltern.set(e.von, e.zu); }
  const gabeln = [...kinder.values()].filter(l => l.length >= 2).length;
  const tiefe = new Map(), lauf = (f, weg = new Set()) => { if(tiefe.has(f)) return tiefe.get(f); if(weg.has(f)) return 0; weg.add(f); let t = 1; for(const c of kinder.get(f) || []) t = Math.max(t, 1 + lauf(c, weg)); weg.delete(f); tiefe.set(f, t); return t; };
  let kette = 0; for(const f of fass) kette = Math.max(kette, kinder.size ? lauf(f) : 1);
  let art; if(werke.length >= 2 || gabeln) art = 'baum'; else if(kette >= 3) art = 'ranke'; else if(!fass.length) art = 'stab'; else if(fass.length === 1 || kinder.size) art = 'blume'; else art = 'wiese';
  return {art, fass, werke, kinder, eltern, gabeln, kette};
}
function fussVon(p){ const a = arbeit(p.k), n = p.fass.length; return p.art === 'baum' ? Math.min(5.2, 2 + 2.2 * a + 0.08 * Math.sqrt(n)) : p.art === 'ranke' ? 1.1 : p.art === 'wiese' ? Math.min(4, 0.8 + 0.3 * Math.sqrt(n)) : p.art === 'stab' ? 0.5 : 0.75 + 0.12 * n; }

function plane(I){
  const orte = I.wurzel.kinder.filter(c => c.art === 'ort');
  const kernOrte = orte.filter(o => TRAGEND.has(o.name)), offen = orte.filter(o => OFFEN.has(o.name)), daecher = orte.filter(o => !TRAGEND.has(o.name) && !OFFEN.has(o.name)).sort(nachZeit);
  const pflanzenIn = (o, bereich) => { const r = []; for(const c of o.kinder || []){ if(c.art === 'app' || c.art === 'werk') r.push({k: c, bereich}); else if(c.art === 'ort' || c.art === 'bereich') r.push(...pflanzenIn(c, c)); } return r; };
  const neu = (k, ort, bereich) => { const p = {k, ort, bereich, ...pflanzenArt(k, I), x: 0, y: 0, z: 0, seed: hashS(k.schluessel)}; p.fuss = fussVon(p); PFLANZEN.push(p); (jePflanze.get(k) || jePflanze.set(k, p)); return p; };
  // Lichtung: die Zentrale im Sonnenblumenmuster, die älteste in der Mitte
  const kern = kernOrte.flatMap(o => pflanzenIn(o, null)).sort((a, b) => nachZeit(a.k, b.k)).map(x => neu(x.k, kernOrte[0], x.bereich));
  let r = 3.2; kern.forEach((p, i) => { const a = i * 2.39996 + 0.6; r = 3.2 + 2.25 * Math.sqrt(i + 0.3) + p.fuss * 0.25; p.x = Math.cos(a) * r; p.z = Math.sin(a) * r; });
  RL = r + 4;
  // Beete: Keile um die Lichtung, Breite nach der Fläche ihrer Pflanzen. Zwischen ihnen Wege, im Süden der Eingang
  const lagen = daecher.map(o => { const eig = pflanzenIn(o, null).filter(x => !x.bereich).sort((a, b) => nachZeit(a.k, b.k)), ber = pflanzenIn(o, null).filter(x => x.bereich); const ps = [...eig, ...ber.sort((a, b) => (a.bereich.name > b.bereich.name) - (a.bereich.name < b.bereich.name) || nachZeit(a.k, b.k))].map(x => neu(x.k, o, x.bereich)); return {o, ps, gewicht: ps.reduce((s, p) => s + (p.fuss * 2 + 0.5) ** 2, 0)}; });
  const r0 = RL + 3.6, LUECKE = 2.6, eingang = 0.42, gesamt = Math.PI * 2 - eingang;
  const gew = lagen.map(l => Math.pow(l.gewicht, 0.62)), summe = gew.reduce((a, b) => a + b, 0);
  let w = Math.PI / 2 + eingang / 2;   // Süden = +z
  lagen.forEach((l, i) => { const breite = gesamt * gew[i] / summe, a0 = w, a1 = w + breite; w = a1;
    const beet = {o: l.o, a0, a1, r0, r1: r0, hecken: [], bereiche: []}; BEETE.push(beet);
    let reihe = r0 + 0.6, tief = 0, c = null, letzterBereich = null;
    const randW = rr => (LUECKE / 2 + 0.5) / rr;
    for(const p of l.ps){
      if(p.bereich !== letzterBereich && c != null){ reihe += tief * 2 + 1.6; beet.hecken.push({r: reihe - 0.8, bereich: p.bereich}); tief = 0; c = null; }
      if(p.bereich !== letzterBereich && p.bereich) beet.bereiche.push({k: p.bereich, r: reihe});
      letzterBereich = p.bereich;
      for(;;){ const rr = reihe + p.fuss, wb = (2 * p.fuss + 0.35) / rr; if(c == null) c = a0 + randW(rr); if(c + wb <= a1 - randW(rr)){ p.winkel = c + wb / 2; p.radius = rr; c += wb; tief = Math.max(tief, p.fuss); break; } if(c === a0 + randW(rr) && tief === 0){ p.winkel = (a0 + a1) / 2; p.radius = rr; tief = p.fuss; c = a1; break; } reihe += tief * 2 + 0.45; tief = 0; c = null; }
      p.x = Math.cos(p.winkel) * p.radius; p.z = Math.sin(p.winkel) * p.radius; p.beet = beet;
    }
    beet.r1 = reihe + tief * 2 + 0.8;
  });
  // Noch ohne Ort: Töpfe am Eingang
  const toepfe = offen.flatMap(o => pflanzenIn(o, null).map(x => neu(x.k, o, null))); toepfe.forEach((p, i) => { const a = Math.PI / 2 + (i - (toepfe.length - 1) / 2) * 0.05, rr = RL + 1.6; p.x = Math.cos(a) * rr + Math.sin(a) * 0; p.z = Math.sin(a) * rr; p.topf = true; p.fuss = Math.min(p.fuss, 0.6); });
  RG = Math.max(...BEETE.map(b => b.r1), RL + 10) + 6;
}

/* ---------- Gelände: Karte für Beete, Wege und Lichtung; der Boden malt sie selbst ---------- */
let karteDaten = null, kGroesse = 0, kE = 0;
const imBeet = (x, z) => { if(!karteDaten) return 0; const i = Math.floor((x + kE) / (2 * kE) * kGroesse), j = Math.floor((z + kE) / (2 * kE) * kGroesse); if(i < 0 || j < 0 || i >= kGroesse || j >= kGroesse) return 0; return karteDaten[(j * kGroesse + i) * 4 + 1] / 255; };
const aufWeg = (x, z) => { if(!karteDaten) return 0; const i = Math.floor((x + kE) / (2 * kE) * kGroesse), j = Math.floor((z + kE) / (2 * kE) * kGroesse); if(i < 0 || j < 0 || i >= kGroesse || j >= kGroesse) return 0; return karteDaten[(j * kGroesse + i) * 4] / 255; };
const huegel = (x, z) => { const r = Math.hypot(x, z), k = THREE.MathUtils.smoothstep(r, RG + 6, RG + 70); return k * (Math.sin(x * 0.021) * 4 + Math.cos(z * 0.017 + 1) * 5 + Math.sin((x + z) * 0.037) * 1.6 + 3) + k * k * 6; };
const hoehe = (x, z) => huegel(x, z) + imBeet(x, z) * 0.16;

function baueGelaende(){
  kE = RG + 12; kGroesse = klein ? 1024 : 2048; const kv = document.createElement('canvas'); kv.width = kv.height = kGroesse; const c = kv.getContext('2d', {willReadFrequently: true}), sk = kGroesse / (2 * kE), K = (x, z) => [(x + kE) * sk, (z + kE) * sk];
  c.fillStyle = '#000'; c.fillRect(0, 0, kGroesse, kGroesse); c.globalCompositeOperation = 'lighter'; c.filter = `blur(${Math.max(1, 0.25 * sk)}px)`;
  // Lichtung (blau), Ringweg und Wege zwischen den Beeten (rot), Beete aus Erde (grün)
  c.fillStyle = '#00f'; c.beginPath(); c.arc(...K(0, 0), RL * sk, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#f00'; c.lineWidth = 2.2 * sk; c.beginPath(); c.arc(...K(0, 0), (RL + 1.8) * sk, 0, Math.PI * 2); c.stroke();
  // Erde nur, wo gepflanzt ist: Pflanzreihen in den Beeten, eine Baumscheibe auf der Lichtung
  c.fillStyle = '#0f0';
  for(const p of PFLANZEN){ if(p.topf) continue; if(p.beet){ const ri = p.radius - p.fuss - 0.35, ra = p.radius + p.fuss + 0.35, dw = (p.fuss + 0.6) / p.radius; c.beginPath(); c.arc(...K(0, 0), ra * sk, p.winkel - dw, p.winkel + dw); c.arc(...K(0, 0), ri * sk, p.winkel + dw, p.winkel - dw, true); c.closePath(); c.fill(); } else { c.beginPath(); c.arc(...K(p.x, p.z), Math.max(0.6, p.fuss * 0.55) * sk, 0, Math.PI * 2); c.fill(); } }
  for(const b of BEETE){
    c.lineWidth = 2 * sk; c.beginPath(); c.moveTo(...K(Math.cos(b.a0) * (RL + 1.8), Math.sin(b.a0) * (RL + 1.8))); c.lineTo(...K(Math.cos(b.a0) * (RG - 2), Math.sin(b.a0) * (RG - 2))); c.stroke(); }
  c.lineWidth = 2.4 * sk; c.beginPath(); c.moveTo(...K(0, RL + 1.8)); c.lineTo(...K(0, RG + 30)); c.stroke();
  karteDaten = c.getImageData(0, 0, kGroesse, kGroesse).data;
  // Boden bis zum Horizont, ohne Rand: feine Ringe nahe, weite in der Ferne
  const ringe = klein ? 220 : 340, spk = klein ? 360 : 560, Rw = 2400, kk = 5.2, weit = i => Rw * (Math.exp(kk * i / ringe) - 1) / (Math.exp(kk) - 1), pos = new Float32Array((ringe + 1) * spk * 3), ix = new Uint32Array(ringe * spk * 6); let a = 0, q = 0;
  for(let i = 0; i <= ringe; i++){ const r = weit(i); for(let j = 0; j < spk; j++){ const w = j / spk * Math.PI * 2, x = Math.cos(w) * r, z = Math.sin(w) * r; pos[a++] = x; pos[a++] = hoehe(x, z); pos[a++] = z; } }
  for(let i = 0; i < ringe; i++) for(let j = 0; j < spk; j++){ const p = i * spk + j, r = i * spk + (j + 1) % spk, s = p + spk, t = r + spk; ix[q++] = p; ix[q++] = r; ix[q++] = s; ix[q++] = r; ix[q++] = t; ix[q++] = s; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(ix, 1)); g.computeVertexNormals();
  const TL = new THREE.TextureLoader(), stoff = name => { const l = (d, s) => { const t = TL.load(`${NEU}stoffe/${name}/${d}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if(s) t.colorSpace = THREE.SRGBColorSpace; return t; }; return {farbe: l('farbe', true), normal: l('normal'), arm: l('arm')}; };
  const gras = stoff('aerial_grass_rock'), wald = stoff('forrest_ground_01'), erde = stoff('brown_mud_dry'), weg = stoff('cobblestone_floor_04'), kt = new THREE.CanvasTexture(kv); kt.flipY = false; kt.colorSpace = THREE.NoColorSpace; kt.minFilter = THREE.LinearMipmapLinearFilter; kt.anisotropy = 8;
  const xz = positionWorld.xz, t = (s, f) => texture(s, xz.mul(f)), maske = texture(kt, xz.div(2 * kE).add(0.5)), makro = t(gras.farbe, 0.011).g.mul(1.1).add(t(wald.farbe, 0.045).g.mul(0.6)), rauh = t(wald.farbe, 0.8).r.sub(0.25).mul(0.5);
  const beet = smoothstep(0.35, 0.6, maske.g.add(rauh.mul(0.4))), pfad = smoothstep(0.3, 0.62, maske.r.add(rauh.mul(0.5))), licht = smoothstep(0.2, 0.7, maske.b);
  const grund = mix(t(gras.farbe, 0.11).rgb.mul(vec3(0.6, 0.86, 0.42)), t(wald.farbe, 0.27).rgb, makro.mul(0.45).clamp(0, 1)).mul(makro.add(0.5));
  const f1 = mix(grund, grund.mul(vec3(1.08, 1.12, 0.95)), licht.mul(0.5)), f2 = mix(f1, t(erde.farbe, 0.42).rgb.mul(vec3(0.62, 0.52, 0.44)), beet), f3 = mix(f2, t(weg.farbe, 0.55).rgb.mul(vec3(1.05, 0.98, 0.9)), pfad);
  const m = new THREE.MeshStandardNodeMaterial(); m.colorNode = f3; m.roughnessNode = float(0.95); m.metalnessNode = float(0); m.normalNode = normalMap(mix(mix(t(gras.normal, 0.11).rgb, t(erde.normal, 0.42).rgb, beet), t(weg.normal, 0.55).rgb, pfad), vec2(1.2));
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; garten.add(mesh);
}

/* ---------- Gras: Halme in Bewegung, nur wo Boden frei ist ---------- */
function baueGras(){
  const N = klein ? 90000 : tablet ? 140000 : 260000, ort = new Float32Array(N * 4), art = new Float32Array(N * 4), rnd = zufall(77); let n = 0, v = 0;
  while(n < N && v++ < N * 4){ const r = Math.pow(rnd(), 0.62) * (RG + 26), a = rnd() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r; if(imBeet(x, z) > 0.25 || aufWeg(x, z) > 0.3) continue; if(PFLANZEN.some(p => p.art !== 'wiese' && (p.x - x) ** 2 + (p.z - z) ** 2 < (p.fuss * 0.6) ** 2)) continue;
    const kurz = (r < RL ? 0.55 : 1) * (1 - THREE.MathUtils.smoothstep(r, RG + 4, RG + 26) * 0.9); ort.set([x, hoehe(x, z) - 0.02, z, (0.14 + rnd() * 0.22) * kurz * (r > RG ? 1.3 : 1)], n * 4); art.set([rnd() * 6.283, rnd(), rnd(), 0.06 + rnd() * 0.05], n * 4); n++; }
  const g = new THREE.BufferGeometry(), S = 4, p = [], ix = []; for(let i = 0; i <= S; i++){ const y = i / S, w = (1 - y) * 0.5; p.push(-w, y, 0, w, y, 0); if(i < S){ const b = i * 2; ix.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix);
  const O = instancedBufferAttribute(new THREE.InstancedBufferAttribute(ort, 4)), A = instancedBufferAttribute(new THREE.InstancedBufferAttribute(art, 4));
  const m = new THREE.MeshBasicNodeMaterial({side: THREE.DoubleSide}), y = positionGeometry.y, lx = positionGeometry.x.mul(A.w), c = cos(A.x), s = sin(A.x);
  const welle = sin(U.zeit.mul(1.4).add(O.x.mul(0.19)).add(O.z.mul(0.13))).mul(0.5).add(sin(U.zeit.mul(3.3).add(A.y.mul(6.28))).mul(0.18)).add(0.35).mul(U.wind), bieg = y.mul(y).mul(O.w).mul(welle).mul(0.45);
  m.positionNode = vec3(lx.mul(c).add(bieg.mul(0.8)), y.mul(O.w), lx.mul(s).add(bieg.mul(0.6))).add(O.xyz);
  const grun = mix(vec3(0.05, 0.11, 0.02), mix(vec3(0.32, 0.46, 0.1), vec3(0.55, 0.52, 0.2), A.z.mul(0.6)), pow(y, 0.8));
  m.colorNode = grun.mul(vec3(1.05, 1.0, 0.85)).mul(0.9).mul(U.licht);
  const mesh = new THREE.Mesh(g, m); mesh.count = n; mesh.frustumCulled = false; garten.add(mesh);
}

/* ---------- Die Pflanzen ---------- */
// Ein Rohr, das sich verjüngt (Stamm, Ast, Ranke, Stiel)
function rohr(kurve, r0, r1, seg, rund = 6){
  const pos = [], nor = [], uvs = [], ix = [], P = kurve.getSpacedPoints(seg), F = kurve.computeFrenetFrames(seg, false), len = kurve.getLength();
  for(let i = 0; i <= seg; i++){ const t = i / seg, r = r0 + (r1 - r0) * t, N = F.normals[i], B = F.binormals[i];
    for(let j = 0; j <= rund; j++){ const w = j / rund * Math.PI * 2, cx = -Math.cos(w), sy = Math.sin(w), nx = cx * N.x + sy * B.x, ny = cx * N.y + sy * B.y, nz = cx * N.z + sy * B.z; pos.push(P[i].x + r * nx, P[i].y + r * ny, P[i].z + r * nz); nor.push(nx, ny, nz); uvs.push(j / rund * 2, t * len * 1.4); } }
  for(let i = 0; i < seg; i++) for(let j = 0; j < rund; j++){ const a = i * (rund + 1) + j, b = a + rund + 1; ix.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(ix); return g;
}
const STAEMME = [], STAEBE = [], ANHANG = [], HECKE = [];   // ANHANG: {k, pflanze, art: blatt|bluete|frucht|samen, pos, richtung, gr, farbe}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const farbeVon = (k, art) => { if(k.art === 'gespraech') return new THREE.Color('#e9e2cf'); const s = stimmeVon(k.stimme), c = new THREE.Color(s.f); if(s.n === 'Übernommener Bestand'){ return art === 'bluete' ? new THREE.Color('#f4efe2') : art === 'frucht' ? new THREE.Color('#a8442c') : new THREE.Color().setHSL(0.27 + (hashS(k.schluessel) % 100) / 1400, 0.55, 0.3); } if(art === 'blatt') return new THREE.Color().setHSL(0.27, 0.5, 0.28).lerp(c, 0.62); return c; };
function haenge(p, k, art, pos, richtung, gr){ const q = {k, p, art, pos, richtung: richtung.clone().normalize(), gr, farbe: farbeVon(k, art)}; ANHANG.push(q); jeFassung.set(k, q); return q; }
// Blätter entlang eines Triebs: das Älteste unten, die jüngste Fassung obenauf als Blüte
function belaube(p, kurve, liste, s0, rnd, mitBluete = true){
  const n = liste.length; liste.forEach((f, i) => { const oben = mitBluete && i === n - 1 && n >= 1, s = n === 1 ? 1 : s0 + (1 - s0) * (i / Math.max(1, n - 1)), pt = kurve.getPointAt(Math.min(1, s)), tg = kurve.getTangentAt(Math.min(1, s)), w = i * 2.39996 + rnd() * 0.6, sei = V(Math.cos(w), 0, Math.sin(w)).cross(tg).normalize();
    if(oben) haenge(p, f, 'bluete', pt.clone().addScaledVector(tg, 0.06), tg.clone().add(V(0, 0.8, 0)), 0.3 + 0.32 * arbeit(f));
    else { const rr = V(Math.cos(w), 0.35 + rnd() * 0.4, Math.sin(w)).normalize(); haenge(p, f, 'blatt', pt.clone().addScaledVector(sei, 0.03), rr, 0.34 + 0.42 * arbeit(f)); } }); }
function wachse(p){
  const rnd = zufall(p.seed), b = V(p.x, hoehe(p.x, p.z) + (p.topf ? 0.42 : 0), p.z), a = arbeit(p.k), fass = p.fass.filter(f => f.art === 'fassung').sort(nachZeit), gespr = p.fass.filter(f => f.art === 'gespraech');
  p.y = b.y; p.basis = b;
  // Gespräche: Samen am Fuß
  const alleGespr = (function g(q){ return q.art === 'gespraech' ? [q] : (q.kinder || []).flatMap(g); })(p.k);
  alleGespr.forEach((g, i) => { const w = i * 2.39996, r = p.fuss * 0.35 + 0.15; haenge(p, g, 'samen', V(b.x + Math.cos(w) * r, b.y + 0.05, b.z + Math.sin(w) * r), V(0, 1, 0), 0.07); });
  void gespr;
  if(p.art === 'stab'){ p.hoehe = 0.6; p.krone = b.clone().add(V(0, 0.4, 0)); return; }
  if(p.art === 'baum'){
    const H = 2.2 + 3.4 * a + Math.min(1.5, p.fass.length * 0.015), r0 = 0.12 + 0.24 * a, lean = V((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5);
    const stamm = new THREE.CatmullRomCurve3([b.clone().add(V(0, -0.1, 0)), b.clone().add(V(lean.x * 0.3, H * 0.33, lean.z * 0.3)), b.clone().add(V(lean.x * 0.7 + (rnd() - 0.5) * 0.3, H * 0.7, lean.z * 0.7)), b.clone().add(V(lean.x, H, lean.z))]);
    STAEMME.push(rohr(stamm, r0, r0 * 0.25, 14, 8)); p.hoehe = H;
    // Äste: Werke, sonst belegte Gabeln. Ältere unten
    let aeste = p.werke.length >= 2 ? p.werke.slice().sort(nachZeit).map(w => ({k: w, fass: fassungenVon(w).filter(f => f.art === 'fassung').sort(nachZeit)})) : [];
    let krone = fass.filter(f => !aeste.some(x => x.fass.includes(f)));
    if(!aeste.length){ const wurzeln = fass.filter(f => p.kinder.has(f) && !p.eltern.has(f)); const gesehen = new Set();
      for(const w of wurzeln){ const l = []; (function lauf(f){ if(gesehen.has(f)) return; gesehen.add(f); l.push(f); for(const c of (p.kinder.get(f) || []).slice().sort(nachZeit)) lauf(c); })(w); aeste.push({k: null, fass: l}); }
      krone = fass.filter(f => !gesehen.has(f)); }
    const n = aeste.length;
    aeste.forEach((ast, i) => { const t = n === 1 ? 0.55 : 0.32 + 0.6 * i / Math.max(1, n - 1), an = stamm.getPointAt(t), w = i * 2.39996 + rnd(), aa = ast.k ? arbeit(ast.k) : Math.min(1, ast.fass.length / 20), L = (1.1 + 2.8 * aa + 0.1 * Math.sqrt(ast.fass.length)) * (0.75 + 0.6 * (1 - t)) * (0.7 + H / 10), auf = 0.12 + rnd() * 0.42;
      const d = V(Math.cos(w), auf, Math.sin(w)).normalize(), ende = an.clone().addScaledVector(d, L), mitte = an.clone().addScaledVector(d, L * 0.5).add(V(0, L * 0.12, 0));
      const k = new THREE.CatmullRomCurve3([an, mitte, ende.clone().add(V(0, -L * 0.06, 0))]); STAEMME.push(rohr(k, r0 * (0.4 + 0.25 * aa) * (1 - t * 0.45), 0.02, 8, 6));
      // Lange Äste bekommen Zweige, damit auch 197 Fassungen ein Ast bleiben
      const fs = ast.fass, Z = Math.ceil(fs.length / 9);
      if(Z <= 1) belaube(p, k, fs, 0.3, rnd);
      else for(let z = 0; z < Z; z++){ const teil = fs.slice(z * 9, z * 9 + 9), s = 0.25 + 0.72 * z / Math.max(1, Z - 1), q = k.getPointAt(s), ww = w + (z % 2 ? 1 : -1) * (0.9 + rnd() * 0.5), lz = 0.8 + 0.08 * teil.length, dz = V(Math.cos(ww), 0.5 + rnd() * 0.5, Math.sin(ww)).normalize();
        const kz = new THREE.CatmullRomCurve3([q, q.clone().addScaledVector(dz, lz * 0.5).add(V(0, lz * 0.1, 0)), q.clone().addScaledVector(dz, lz)]); STAEMME.push(rohr(kz, 0.03, 0.01, 5, 4)); belaube(p, kz, teil, 0.15, rnd, z === Z - 1); }
    });
    // Fassungen ohne Ast: an der Krone
    const spitze = stamm.getPointAt(1); krone.forEach((f, i) => { const w = i * 2.39996, r = 0.25 + 0.1 * Math.sqrt(i), q = spitze.clone().add(V(Math.cos(w) * r, 0.1 + (i / Math.max(1, krone.length)) * 0.6, Math.sin(w) * r)); haenge(p, f, i === krone.length - 1 ? 'bluete' : 'blatt', q, V(Math.cos(w), 0.8, Math.sin(w)), (i === krone.length - 1 ? 0.32 : 0.36) + 0.4 * arbeit(f)); });
    // Die Grundformation: älteste Fassung als Frucht unten am Stamm
    if(fass.length >= 3){ const f0 = fass[0], q = jeFassung.get(f0); if(q){ q.art = 'frucht'; q.farbe = farbeVon(f0, 'frucht'); q.pos = stamm.getPointAt(0.3).add(V(r0 * 1.4, -0.08, 0)); q.gr = 0.16 + 0.1 * a; } }
    p.krone = b.clone().add(V(lean.x, H * 0.72, lean.z));
  } else if(p.art === 'ranke'){
    const n = fass.length, H = Math.min(6.5, 1.8 + 0.42 * n), stab = new THREE.LineCurve3(b.clone().add(V(0, -0.2, 0)), b.clone().add(V(0, H + 0.15, 0))); STAEBE.push(rohr(stab, 0.03, 0.025, 1, 5));
    const W = H / 0.42, pts = []; for(let i = 0; i <= 80; i++){ const t = i / 80, w = t * W * Math.PI * 2 + (p.seed % 10), r = 0.1 + 0.04 * Math.sin(t * 9); pts.push(b.clone().add(V(Math.cos(w) * r, t * H, Math.sin(w) * r))); }
    const k = new THREE.CatmullRomCurve3(pts); STAEMME.push(rohr(k, 0.03, 0.014, 120, 4)); belaube(p, k, fass, 0.06, rnd);
    p.hoehe = H; p.krone = b.clone().add(V(0, H * 0.6, 0));
  } else if(p.art === 'blume'){
    const n = fass.length, stiele = Math.max(1, Math.min(3, Math.ceil(n / 4)));
    let hmax = 0; for(let s = 0; s < stiele; s++){ const teil = fass.filter((_, i) => i % stiele === s), hh = 0.9 + 1.5 * a + rnd() * 0.35 + teil.length * 0.1, w = s * 2.1 + rnd(), d = 0.22 * s;
      const k = new THREE.CatmullRomCurve3([b.clone().add(V(Math.cos(w) * d, -0.05, Math.sin(w) * d)), b.clone().add(V(Math.cos(w) * (d + 0.06), hh * 0.5, Math.sin(w) * (d + 0.06))), b.clone().add(V(Math.cos(w) * (d + 0.14), hh, Math.sin(w) * (d + 0.14)))]);
      STAEMME.push(rohr(k, 0.035, 0.016, 8, 5)); belaube(p, k, teil, 0.25, rnd); hmax = Math.max(hmax, hh); }
    p.hoehe = hmax; p.krone = b.clone().add(V(0, hmax * 0.7, 0));
  } else {   // Blumenwiese: jede Fassung einzeln aus dem Boden
    let hmax = 0; fass.forEach((f, i) => { const w = i * 2.39996, r = Math.sqrt(i + 0.5) * (p.fuss / Math.sqrt(fass.length + 0.5)) * 0.92, x = b.x + Math.cos(w) * r, z = b.z + Math.sin(w) * r, y = hoehe(x, z), hh = 0.45 + 0.8 * arbeit(f) + rnd() * 0.2;
      const k = new THREE.LineCurve3(V(x, y - 0.02, z), V(x + (rnd() - 0.5) * 0.06, y + hh, z + (rnd() - 0.5) * 0.06)); STAEMME.push(rohr(k, 0.012, 0.007, 1, 3)); haenge(p, f, 'bluete', V(k.v2.x, k.v2.y, k.v2.z), V((rnd() - 0.5) * 0.3, 1, (rnd() - 0.5) * 0.3), 0.15 + 0.16 * arbeit(f)); hmax = Math.max(hmax, hh); });
    p.hoehe = hmax; p.krone = b.clone().add(V(0, hmax, 0));
  }
}

let blattMesh, bluetenMesh, fruchtMesh, samenMesh;
const instanzen = {};
function baueGestalt(){
  for(const p of PFLANZEN) wachse(p);
  // Rinde von ez-tree, Holz für Stäbe und Schilder
  const ezt = new Tree(); ezt.loadPreset('Oak Medium'); ezt.generate(); const rinde = ezt.branchesMesh.material;
  const borke = new THREE.MeshStandardMaterial({map: rinde.map, normalMap: rinde.normalMap, color: 0xb8a48c, roughness: 0.92});
  if(borke.map){ borke.map.wrapS = borke.map.wrapT = THREE.RepeatWrapping; } if(borke.normalMap){ borke.normalMap.wrapS = borke.normalMap.wrapT = THREE.RepeatWrapping; }
  const stammG = mergeGeometries(STAEMME, false), stamm = new THREE.Mesh(stammG, borke); stamm.castShadow = true; stamm.receiveShadow = true; garten.add(stamm);
  const holz = new THREE.MeshStandardMaterial({color: 0x7a5b3e, roughness: 0.8});
  if(STAEBE.length){ const s = new THREE.Mesh(mergeGeometries(STAEBE, false), holz); s.castShadow = true; garten.add(s); }
  // Blatt: echte Blattform mit Mittelrippe, leicht gefaltet
  const blattForm = new THREE.Shape(); blattForm.moveTo(0, 0); blattForm.bezierCurveTo(0.42, 0.25, 0.36, 0.78, 0, 1); blattForm.bezierCurveTo(-0.36, 0.78, -0.42, 0.25, 0, 0);
  const bg = new THREE.ShapeGeometry(blattForm, 10); { const p = bg.attributes.position; for(let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.abs(x) * 0.35 - y * y * 0.18); } bg.computeVertexNormals(); }
  const wind = (amp) => { const ph = hash(instanceIndex).mul(6.283), y = positionGeometry.y.add(0.4); return positionLocal.add(vec3(sin(U.zeit.mul(2.3).add(ph)), sin(U.zeit.mul(3.1).add(ph.mul(1.7))).mul(0.4), cos(U.zeit.mul(1.9).add(ph))).mul(y.mul(amp).mul(U.wind))); };
  const blattMat = new THREE.MeshStandardNodeMaterial({side: THREE.DoubleSide, roughness: 0.62}); const u = uv();
  blattMat.colorNode = vec3(1).sub(smoothstep(0.03, 0.0, abs(positionGeometry.x)).mul(0.25)).mul(mix(float(0.75), float(1.08), positionGeometry.y)); blattMat.positionNode = wind(0.07); void u;
  // Blüte: sechs Blütenblätter um eine Mitte
  const teile = []; for(let i = 0; i < 6; i++){ const pb = new THREE.ShapeGeometry(blattForm, 6); pb.scale(0.55, 0.62, 1); pb.rotateX(-Math.PI / 2 + 0.55); pb.rotateY(i / 6 * Math.PI * 2); teile.push(pb); }
  const mitte = new THREE.SphereGeometry(0.13, 8, 6); mitte.scale(1, 0.55, 1); mitte.translate(0, 0.04, 0); teile.push(mitte);
  for(const t of teile){ t.deleteAttribute('uv'); if(!t.index) continue; }
  const bluetenG = mergeGeometries(teile.map(t => t.index ? t.toNonIndexed() : t), false); { const n = bluetenG.attributes.position.count, c = new Float32Array(n * 3), mz = mitte.toNonIndexed().attributes.position.count; for(let i = 0; i < n; i++){ const istMitte = i >= n - mz; c.set(istMitte ? [0.55, 0.42, 0.12] : [1, 1, 1], i * 3); } bluetenG.setAttribute('farbe', new THREE.BufferAttribute(c, 3)); }
  const bluetenMat = new THREE.MeshStandardNodeMaterial({side: THREE.DoubleSide, roughness: 0.5}); bluetenMat.colorNode = attribute('farbe', 'vec3'); bluetenMat.positionNode = wind(0.05); bluetenMat.emissiveNode = vec3(0);
  const fruchtMat = new THREE.MeshStandardNodeMaterial({roughness: 0.32}), samenMat = new THREE.MeshStandardNodeMaterial({roughness: 0.7});
  const arten = {blatt: [bg, blattMat], bluete: [bluetenG, bluetenMat], frucht: [new THREE.SphereGeometry(1, 14, 10), fruchtMat], samen: [new THREE.SphereGeometry(1, 8, 6).scale(1, 0.6, 1.3), samenMat]};
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), oben = V(0, 1, 0);
  for(const [art, [g, mat]] of Object.entries(arten)){
    const liste = ANHANG.filter(q => q.art === art); if(!liste.length) continue;
    const im = new THREE.InstancedMesh(g, mat, liste.length); im.castShadow = art !== 'samen'; im.receiveShadow = true; im.frustumCulled = false;
    liste.forEach((q, i) => { Q.setFromUnitVectors(oben, q.richtung); if(art === 'blatt'){ const dreh = new THREE.Quaternion().setFromAxisAngle(oben, (hashS(q.k.schluessel) % 628) / 100); Q.multiply(dreh); } M4.compose(q.pos, Q, S.setScalar(q.gr)); im.setMatrixAt(i, M4); im.setColorAt(i, q.farbe); q.idx = i; });
    instanzen[art] = {im, liste}; garten.add(im);
  }
  // Töpfe für die Pflanzen ohne Ort, Hecken vor den Bereichen (Grund)
  const ton = new THREE.MeshStandardMaterial({color: 0xa2563a, roughness: 0.85});
  for(const p of PFLANZEN) if(p.topf){ const t = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.45, 18), ton); t.position.set(p.x, hoehe(p.x, p.z) + 0.22, p.z); t.castShadow = t.receiveShadow = true; garten.add(t); }
  const hecke = []; for(const b of BEETE) for(const h of b.hecken){ for(let w = b.a0 + 1.6 / h.r; w < b.a1 - 1.6 / h.r; w += 0.75 / h.r) hecke.push([Math.cos(w) * h.r, Math.sin(w) * h.r]); }
  HECKE.push(...hecke);
  // Pflanzschilder: ein Stab mit Tafel vor jeder Pflanze; das echte Bild der App, sobald man nah ist
  for(const p of PFLANZEN){ const zur = V(-p.x, 0, -p.z).normalize(), d = p.fuss * (p.art === 'wiese' ? 1.05 : 0.8) + 0.25, x = p.x + zur.x * d, z = p.z + zur.z * d, y = hoehe(x, z);
    const stab = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.55, 0.035), holz); stab.position.set(x, y + 0.27, z); stab.castShadow = true; garten.add(stab);
    const tafel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.02), holz); tafel.position.set(x, y + 0.62, z); tafel.lookAt(x - zur.x, y + 0.62 + 0.25, z - zur.z); tafel.castShadow = true; garten.add(tafel);
    p.schild = {tafel, pos: V(x, y + 0.62, z), geladen: false}; }
}

/* ---------- Myzel: belegte Beziehungen zwischen Pflanzen, als Licht im Boden ---------- */
const myzelGruppe = new THREE.Group(); scene.add(myzelGruppe); let myzel = [];
function faden(a, b, art, seed){
  const rnd = zufall(seed), n = Math.max(8, Math.floor(a.distanceTo(b) / 1.2)), pts = [], quer = V(-(b.z - a.z), 0, b.x - a.x).normalize();
  const bog = (rnd() - 0.5) * a.distanceTo(b) * 0.3;
  for(let i = 0; i <= n; i++){ const t = i / n, x = a.x + (b.x - a.x) * t + quer.x * (Math.sin(t * Math.PI) * bog + (rnd() - 0.5) * 0.25), z = a.z + (b.z - a.z) * t + quer.z * (Math.sin(t * Math.PI) * bog + (rnd() - 0.5) * 0.25); pts.push(V(x, hoehe(x, z) + 0.035, z)); }
  const k = new THREE.CatmullRomCurve3(pts), len = k.getLength(), g = rohr(k, art === 'berechnet' ? 0.018 : 0.03, art === 'berechnet' ? 0.018 : 0.03, Math.min(400, n * 4), 4);
  const m = new THREE.MeshBasicNodeMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}), s = uv().y, glanz = uniform(1);
  const farbe = art === 'belegt' ? vec3(1.0, 0.55, 0.14) : art === 'spiegel' ? vec3(0.55, 0.62, 0.8) : vec3(0.25, 0.45, 1);
  const puls = pow(fract(s.div(3).sub(U.zeit.mul(0.35))), 6).mul(1.6).add(0.3), strich = art === 'berechnet' ? step(0.5, fract(s.div(0.6))) : float(1);
  m.colorNode = farbe.mul(puls).mul(U.myzel).mul(glanz).mul(strich); m.opacityNode = float(1);
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2; myzelGruppe.add(mesh); return {mesh, glanz, len};
}
function baueMyzel(){
  const pflanzeVon = k => { for(let q = k; q; q = q.eltern){ const p = jePflanze.get(q); if(p) return p; } return null; };
  const paare = new Map();
  for(const e of R.bezug.kanten){ if(!e.belegt) continue; const a = pflanzeVon(e.von), b = pflanzeVon(e.zu); if(!a || !b || a === b) continue; const key = a.k.schluessel < b.k.schluessel ? a.k.schluessel + '|' + b.k.schluessel : b.k.schluessel + '|' + a.k.schluessel; if(!paare.has(key)) paare.set(key, {a, b, zahl: 0}); paare.get(key).zahl++; }
  for(const {a, b, zahl} of paare.values()){ const f = faden(a.basis, b.basis, 'belegt', hashS(a.k.schluessel + b.k.schluessel)); f.a = a; f.b = b; f.zahl = zahl; f.art = 'belegt'; myzel.push(f); }
  // Dasselbe Werk an mehreren Orten: silberner Faden zwischen seinen Pflanzen
  const jeS = new Map(); for(const p of PFLANZEN){ const l = jeS.get(p.k.schluessel) || []; l.push(p); jeS.set(p.k.schluessel, l); }
  for(const l of jeS.values()) for(let i = 1; i < l.length; i++){ const f = faden(l[0].basis, l[i].basis, 'spiegel', hashS(l[i].k.schluessel + i)); f.a = l[0]; f.b = l[i]; f.art = 'spiegel'; myzel.push(f); }
}
let berechnet = [];
function zeigeBerechnet(p){
  for(const f of berechnet){ myzelGruppe.remove(f.mesh); f.mesh.geometry.dispose(); f.mesh.material.dispose(); } berechnet = [];
  if(!p || !R.naeheAn) return;
  const pflanzeVon = k => { for(let q = k; q; q = q.eltern){ const x = jePflanze.get(q); if(x) return x; } return null; }, gesehen = new Set();
  for(const e of R.bezug.von(p.k)){ if(e.belegt) continue; const b = pflanzeVon(e.andere); if(!b || b === p || gesehen.has(b)) continue; gesehen.add(b); berechnet.push(faden(p.basis, b.basis, 'berechnet', hashS(b.k.schluessel))); if(berechnet.length > 40) break; }
}
R.beiNaehe = () => zeigeBerechnet(gewPflanze);

/* ---------- Grund: Wald am Rand, Büsche, Steine ---------- */
const GL = new GLTFLoader();
async function streue(quelle, zahl, rMin, rMax, groesse, schatten, abstand){
  let gruppe = quelle; if(typeof quelle === 'string'){ try{ gruppe = (await GL.loadAsync(`${NEU}modelle/${quelle}.glb`)).scene; }catch(e){ return; } }
  gruppe.updateMatrixWorld(true); const teile = []; gruppe.traverse(o => { if(o.isMesh) teile.push(o); }); const box = new THREE.Box3().setFromObject(gruppe), hoch = box.max.y - box.min.y || 1, orte = [], rnd = zufall(hashS(String(rMin) + zahl));
  let v = 0; while(orte.length < zahl && v++ < zahl * 40){ const r = rMin + (rMax - rMin) * Math.sqrt(rnd()), w = rnd() * Math.PI * 2, x = Math.cos(w) * r, z = Math.sin(w) * r; if(imBeet(x, z) > 0.1 || aufWeg(x, z) > 0.1) continue; if(orte.some(o => (o[0] - x) ** 2 + (o[2] - z) ** 2 < abstand * abstand)) continue; if(PFLANZEN.some(p => (p.x - x) ** 2 + (p.z - z) ** 2 < (p.fuss + abstand) ** 2)) continue; orte.push([x, hoehe(x, z), z, groesse * (0.7 + 0.6 * rnd()) / hoch, rnd() * 6.28]); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  for(const t of teile){ const I = new THREE.InstancedMesh(t.geometry, t.material, orte.length); t.material.side = THREE.DoubleSide; orte.forEach((o, i) => { Q.setFromEuler(E.set(0, o[4], 0)); M.compose(V(o[0], o[1] - 0.05, o[2]), Q, V(o[3], o[3], o[3])); M.multiply(t.matrixWorld); I.setMatrixAt(i, M); }); I.castShadow = schatten; I.receiveShadow = true; I.frustumCulled = false; garten.add(I); }
}
function ezBaum(preset, seed){ const T = new Tree(); T.loadPreset(preset); T.options.seed = seed; T.generate(); T.updateMatrixWorld(true); T.traverse(o => { if(o.isMesh){ const al = o.material; o.material = new THREE.MeshStandardMaterial({map: al.map, normalMap: al.normalMap, color: al.color, alphaTest: al.map && (al.alphaTest || al.transparent) ? 0.5 : 0, roughness: 0.85, side: THREE.DoubleSide}); } }); return T; }

/* ---------- Wählen, Fliegen, Namen ---------- */
let gewPflanze = null, fahrt = null, einflug = !ruhig;
const UEBER = () => ({ziel: V(0, 0, 0), pos: V(0, RG * 1.05, RG * 1.45).multiplyScalar(innerHeight > innerWidth * 1.3 ? 1.35 : 1)});
const sanft = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function fliege(ziel, pos, dauer = 2.4){ fahrt = {vonZ: steuer.target.clone(), vonP: camera.position.clone(), ziel, pos, t: 0, dauer: ruhig ? 0.001 : dauer}; }
function fahrtSchritt(dt){ if(!fahrt) return false; fahrt.t = Math.min(1, fahrt.t + dt / fahrt.dauer); const e = sanft(fahrt.t); steuer.target.lerpVectors(fahrt.vonZ, fahrt.ziel, e); camera.position.lerpVectors(fahrt.vonP, fahrt.pos, e); camera.position.y += Math.sin(Math.PI * e) * Math.min(25, fahrt.vonP.distanceTo(fahrt.pos) * 0.15); if(fahrt.t >= 1) fahrt = null; return true; }
const blickAuf = (ziel, abstand) => { const d = camera.position.clone().sub(ziel); d.y = 0; if(d.lengthSq() < 1e-4) d.set(0, 0, 1); d.normalize(); return ziel.clone().addScaledVector(d, abstand * 0.86).add(V(0, abstand * 0.5, 0)); };

function waehleInWelt(k, flug){
  const p = k ? (jePflanze.get(k) || (function(){ for(let q = k; q; q = q.eltern){ const x = jePflanze.get(q); if(x) return x; } return null; })()) : null;
  gewPflanze = p; for(const f of myzel) f.glanz.value = !p ? 1 : (f.a === p || f.b === p) ? 3.2 : 0.35; zeigeBerechnet(p);
  if(!flug) { if(p){ const z = p.krone.clone(); steuer.target.copy(z); camera.position.copy(blickAuf(z, Math.max(3.2, p.hoehe * 2.2 + p.fuss))); } return; }
  einflug = false; $('#fahrt').hidden = true;
  if(!k){ const u = UEBER(); fliege(u.ziel, u.pos, 2.6); return; }
  const q = jeFassung.get(k);
  if(q){ fliege(q.pos.clone(), blickAuf(q.pos, 1.2 + q.gr * 4), 2.2); return; }
  if(p){ const z = p.krone.clone(); fliege(z, blickAuf(z, Math.max(3.2, p.hoehe * 2.2 + p.fuss)), 2.4); return; }
  const beet = BEETE.find(b => b.o === k) || BEETE.find(b => b.bereiche.some(x => x.k === k));
  if(beet){ const bz = beet.bereiche.find(x => x.k === k), am = (beet.a0 + beet.a1) / 2, rr = bz ? bz.r + 3 : (beet.r0 + beet.r1) / 2, z = V(Math.cos(am) * rr, 0, Math.sin(am) * rr); fliege(z, z.clone().add(V(Math.cos(am) * -(beet.r1 - beet.r0 + 10), (beet.r1 - beet.r0) * 1.1 + 8, Math.sin(am) * -(beet.r1 - beet.r0 + 10))), 2.6); return; }
  if(TRAGEND.has(k.name)){ fliege(V(0, 0, 0), V(0, RL * 1.4, RL * 1.9), 2.6); }
}
function artName(k){ if(k.art === 'ort') return TRAGEND.has(k.name) ? 'Zentrale · Lichtung' : OFFEN.has(k.name) ? 'Noch ohne Ort · Töpfe am Eingang' : 'Oberdach · Beet'; if(k.art === 'bereich') return 'Bereich · Abteil im Beet'; const p = jePflanze.get(k); if(p) return {baum: 'App · Baum', ranke: 'App · Ranke', blume: 'App · Blume', wiese: 'App · Blumenwiese', stab: 'App · noch ohne Fassung'}[p.art]; if(k.art === 'werk') return 'Werk · Ast'; const q = jeFassung.get(k); if(q) return {blatt: 'Fassung · Blatt', bluete: 'Fassung · Blüte (jüngste des Triebs)', frucht: 'Fassung · Frucht (Grundformation)', samen: 'Gespräch · Samen am Fuß'}[q.art]; return ''; }
function blattTitel(k){ const p = jePflanze.get(k); if(!p) return ''; return {baum: p.werke.length >= 2 ? `Baum: ${p.werke.length} Werke sind ${p.werke.length} Äste.` : `Baum: die belegte Abstammung gabelt sich ${p.gabeln}-mal.`, ranke: `Ranke: eine belegte Kette aus ${p.kette} Fassungen, unten die älteste.`, blume: p.fass.length === 1 ? 'Blume: eine einzelne Fassung.' : 'Blume: kurze belegte Abstammung.', wiese: `Blumenwiese: ${p.fass.length} Fassungen ohne belegte Herkunft, jede einzeln aus dem Boden.`, stab: 'Noch keine Fassung: nur das Schild.'}[p.art]; }
function zusatz(k, kn){ const b = $('#knWelt'); void b; void k; void kn; }

const P3 = new THREE.Vector3();
function projiziere(c){ P3.copy(c.pos).project(camera); if(P3.z > 1 || P3.z < -1) return null; return [(P3.x * 0.5 + 0.5) * innerWidth, (-P3.y * 0.5 + 0.5) * innerHeight, c.r / (camera.position.distanceTo(c.pos) * 2 * Math.tan(camera.fov * Math.PI / 360) / innerHeight)]; }
function namen(){
  if(!R.I) return; const kand = [], cam = camera.position;
  kand.push({pos: V(0, 1.2, 0), r: 0.5, text: 'Tragwerk System', unter: 'Zentrale · Lichtung', klasse: 'kern', prio: 100});
  for(const b of BEETE){ const am = (b.a0 + b.a1) / 2, rr = b.r0 - 0.4; kand.push({pos: V(Math.cos(am) * rr, 1.1, Math.sin(am) * rr), r: 0.3, text: b.o.name, unter: mengenWort(b.o).split(' · ')[0], klasse: 'sonne', prio: 90}); for(const x of b.bereiche){ kand.push({pos: V(Math.cos(am) * x.r, 1, Math.sin(am) * x.r), r: 0.3, text: x.k.name, unter: 'Bereich', klasse: 'sonne', prio: 70}); } }
  for(const p of PFLANZEN){ const d = cam.distanceTo(p.krone); if(d < 22 || p === gewPflanze) kand.push({pos: p.krone, r: p.fuss * 0.6, text: p.k.name, klasse: p === gewPflanze ? 'gew' : '', prio: (p === gewPflanze ? 95 : 50) - d}); }
  if(gewPflanze){ for(const q of ANHANG) if(q.p === gewPflanze && cam.distanceTo(q.pos) < 4) kand.push({pos: q.pos, r: q.gr, text: q.k.name, klasse: 'mond', prio: 20 - cam.distanceTo(q.pos)}); }
  const g = R.gewaehlt && jeFassung.get(R.gewaehlt); if(g) kand.push({pos: g.pos, r: g.gr, text: g.k.name, klasse: 'gew', prio: 99});
  R.namen(kand, projiziere, klein ? 14 : 30);
}
function treffe(x, y, rad){
  let best = null, bd = Infinity; const pr = (pos, r, k) => { const s = projiziere({pos, r}); if(!s) return; const d = Math.hypot(s[0] - x, s[1] - y); if(d < Math.max(rad, s[2] * 1.1) && d - s[2] < bd){ bd = d - s[2]; best = k; } };
  for(const q of ANHANG) if(camera.position.distanceTo(q.pos) < 9) pr(q.pos, q.gr, q.k);
  for(const p of PFLANZEN){ pr(p.krone, Math.max(p.fuss * 0.7, p.hoehe * 0.4), p.k); pr(p.schild.pos, 0.3, p.k); }
  return best;
}

/* ---------- Schilder mit echtem Bild, wenn man nah ist ---------- */
const TL = new THREE.TextureLoader(); let schildFrame = 0;
function schilder(){ if(++schildFrame % 20) return; for(const p of PFLANZEN){ const s = p.schild; if(s.geladen || !p.k.bild || camera.position.distanceTo(s.pos) > 26) continue; s.geladen = true; TL.load(bildUrl(p.k.bild, 240), t => { t.colorSpace = THREE.SRGBColorSpace; const bildM = new THREE.MeshStandardMaterial({map: t, roughness: 0.55, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.18}), holz = s.tafel.material; s.tafel.material = [holz, holz, holz, holz, bildM, holz]; }); } }

const Ego = ego({camera, canvas, steuer, boden: hoehe, augen: 1.65, tempo: 7, schnell: 24, knopf: $('#knEgo'), sage, beiStart: () => { fahrt = null; einflug = false; $('#fahrt').hidden = true; }});
/* ---------- Lauf ---------- */
let letzte = performance.now(), zeit = 0, fz = 0, ft = 0, erstes = true;
const versatz = {x: 0, y: 0}, blattEl = $('#blatt');
function lauf(){
  const jetzt = performance.now(), dt = Math.min(0.05, (jetzt - letzte) / 1000); letzte = jetzt; zeit += ruhig ? 0 : dt; U.zeit.value = zeit;
  const fliegt = Ego.an ? false : fahrtSchritt(dt); if(Ego.an) Ego.schritt(dt); else { steuer.enabled = !fliegt; steuer.update(); }
  const boden = hoehe(camera.position.x, camera.position.z) + 0.35; if(camera.position.y < boden) camera.position.y = boden;
  const td = camera.position.distanceTo(steuer.target); camera.near = THREE.MathUtils.clamp(td * 0.01, 0.03, 1.5);
  const offen = !blattEl.hidden, schmal = innerWidth <= 760, zx = offen && !schmal ? (blattEl.offsetWidth + 16) / 2 : 0, zy = offen && schmal ? blattEl.offsetHeight / 2 : 0;
  versatz.x += (zx - versatz.x) * 0.08; versatz.y += (zy - versatz.y) * 0.08; if(Math.abs(versatz.x) + Math.abs(versatz.y) > 0.5) camera.setViewOffset(innerWidth, innerHeight, versatz.x, versatz.y, innerWidth, innerHeight); else camera.clearViewOffset(); camera.updateProjectionMatrix();
  // Schatten folgen dem Blick
  const sz = Math.min(RG + 8, Math.max(12, td * 1.3)); sonne.position.copy(steuer.target).addScaledVector(sonneD, 250); sonne.target.position.copy(steuer.target); Object.assign(sonne.shadow.camera, {left: -sz, right: sz, top: sz, bottom: -sz}); sonne.shadow.camera.updateProjectionMatrix();
  if(R.I){ namen(); schilder(); }
  if(canvas.clientWidth && canvas.clientHeight) pipe.render();
  if(erstes){ erstes = false; messung.erstesBild = performance.now() - T0; }
  fz++; if(jetzt - ft > 1000){ messung.fps = Math.round(fz * 1000 / (jetzt - ft)); fz = 0; ft = jetzt; }
}
sonne.castShadow = true; sonne.shadow.mapSize.set(klein ? 2048 : 4096, klein ? 2048 : 4096); sonne.shadow.bias = -0.0004; sonne.shadow.normalBias = 0.03; sonne.shadow.camera.near = 50; sonne.shadow.camera.far = 500;
renderer.setAnimationLoop(lauf);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
R.tippen(canvas, treffe, () => { if(einflug){ einflug = false; $('#fahrt').hidden = true; if(fahrt) fahrt.dauer = Math.min(fahrt.dauer, fahrt.t * fahrt.dauer + 0.9); } else if(fahrt) fahrt = null; });

// Myzel leuchten lassen: Abendlicht
const knW = $('#knWelt'); knW.hidden = false; knW.textContent = klein ? 'Abend' : 'Myzel im Abendlicht'; let abend = false;
knW.onclick = () => { abend = !abend; knW.setAttribute('aria-pressed', abend); U.myzel.value = abend ? 1.1 : 0.22; U.licht.value = abend ? 0.3 : 1; sonne.intensity = abend ? 1.1 : 5.2; scene.environmentIntensity = abend ? 0.16 : 0.6; scene.backgroundIntensity = abend ? 0.28 : 0.95; renderer.toneMappingExposure = abend ? 1.05 : 0.85; sage(abend ? 'Abendlicht: das Myzel leuchtet. Gold = belegte Beziehung, Silber = dasselbe Werk an anderem Ort.' : 'Tageslicht.'); };

/* ---------- Start ---------- */
try{
  const {I, bezug} = await ladeBestand(); R.I = I; R.bezug = bezug;
  plane(I); baueGelaende(); baueGras(); baueGestalt(); baueMyzel();
  messung.bestand = performance.now() - T0;
  const u = UEBER(); const k0 = R.start(I, bezug);
  if(einflug && !k0){ $('#fahrt').hidden = false; camera.position.set(RG * 2.6, RG * 2.2, -RG * 2.4); fliege(u.ziel, u.pos, 8); $('#fahrt').onclick = () => { fahrt = null; einflug = false; $('#fahrt').hidden = true; camera.position.copy(u.pos); steuer.target.copy(u.ziel); }; }
  else if(!k0){ camera.position.copy(u.pos); }
  if(k0) R.waehle(k0, false, false);
  const zahl = {baum: 0, ranke: 0, blume: 0, wiese: 0}; for(const p of PFLANZEN) zahl[p.art] = (zahl[p.art] || 0) + 1;
  sage(`${BEETE.length} Beete, ${PFLANZEN.length} Pflanzen: ${zahl.baum} Bäume, ${zahl.ranke} Ranken, ${zahl.blume} Blumen, ${zahl.wiese} Blumenwiesen. ${klein ? 'Ziehen dreht · zwei Finger zoomen · Tippen wählt' : 'Ziehen dreht · Rad zoomt · Klicken wählt · Doppelklick liest'}`, 10000);
  // Grund zuletzt: Wald, Büsche, Steine
  const RW = RG;
  await Promise.all([streue(ezBaum('Oak Large', 3), klein ? 14 : 30, RW + 14, RW + 70, 15, true, 7), streue(ezBaum('Pine Medium', 11), klein ? 16 : 40, RW + 25, RW + 110, 13, true, 6), streue(ezBaum('Aspen Medium', 37), klein ? 10 : 24, RW + 8, RW + 60, 10, true, 5), streue('shrub_02', klein ? 30 : 70, RL + 1, RW + 20, 1.1, true, 1.2), streue('boulder_01', 10, RW, RW + 40, 1.2, true, 3)]);
  // Hecken vor den Bereichen aus echten Büschen (Grund)
  try{ const g = (await GL.loadAsync(`${NEU}modelle/shrub_02.glb`)).scene; g.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(g), hh = box.max.y - box.min.y || 1, teile = []; g.traverse(o => { if(o.isMesh) teile.push(o); }); const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), rr = zufall(5);
    for(const t of teile){ const I = new THREE.InstancedMesh(t.geometry, t.material, HECKE.length); t.material.side = THREE.DoubleSide; HECKE.forEach(([x, z], i) => { const sk = (0.75 + rr() * 0.3) / hh; Q.setFromEuler(E.set(0, rr() * 6.28, 0)); M.compose(V(x, hoehe(x, z) - 0.05, z), Q, V(sk * 1.3, sk, sk * 1.3)); M.multiply(t.matrixWorld); I.setMatrixAt(i, M); }); I.castShadow = I.receiveShadow = true; I.frustumCulled = false; garten.add(I); } }catch(e){ /* ohne Hecke */ }
  // Bänke an der Lichtung (Grund)
  try{ const bank = (await GL.loadAsync(`${NEU}modelle/painted_wooden_bench.glb`)).scene, box = new THREE.Box3().setFromObject(bank), s = 0.9 / (box.max.y - box.min.y || 1); for(let i = 0; i < 4; i++){ const w = i * Math.PI / 2 + Math.PI / 4, b2 = bank.clone(); b2.scale.setScalar(s); const rr = RL + 0.4; b2.position.set(Math.cos(w) * rr, hoehe(Math.cos(w) * rr, Math.sin(w) * rr), Math.sin(w) * rr); b2.lookAt(0, b2.position.y, 0); b2.traverse(o => { if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } }); garten.add(b2); } }catch(e){ /* ohne Bänke */ }
}catch(e){ console.error(e); sage('Der Bestand ist gerade nicht erreichbar. Läuft der Lichtwerk-Dienst?', 0); }

window.__garten = {messung, get gewaehlt(){ return R.gewaehlt && R.gewaehlt.name; }, fliege: name => { const k = R.I && R.I.alle.find(x => x.name === name); if(k) R.waehle(k); return !!k; }, uebersicht: () => R.waehle(null), zahlen: () => { const z = {}; for(const p of PFLANZEN) z[p.art] = (z[p.art] || 0) + 1; return {pflanzen: PFLANZEN.length, ...z, anhang: ANHANG.length, myzel: myzel.length, webgl: forceWebGL}; }, ueberspringe: () => $('#fahrt').onclick && $('#fahrt').onclick(), abend: () => knW.onclick()};
