/* =====================================================================
   GALAXIE — die erste der 3D-Welten (11.11.2026).
   Derselbe Inhalt wie in jeder Ansicht (werkansichten/inhalt.js, bezug.js), hier als Spiralgalaxie:
   Kern = Zentrale (Tragwerk System). Sonnen auf den Armen = Oberdächer, das älteste innen.
   Planeten auf Umlaufbahnen = Apps, kleinere Planeten um sie = Werke, Monde = Fassungen.
   Monde liegen auf einer Zeitspirale um ihren Planeten: innen das Älteste, außen das Jüngste.
   Mehr Arbeit = größerer Körper. Farbe des Monds = Stimme. Farbe der Sonne = Farbe des Orts (wie in jeder Ansicht).
   Sterne, Staub und Nebel sind Grund und tragen nichts. Nichts wird geschrieben.
   ===================================================================== */
import * as THREE from 'three/webgpu';
import {uniform, vec2, vec3, vec4, float, uv, mix, smoothstep, exp, max, clamp, dot, normalize, abs, pow, sin, cos,
  positionGeometry, positionWorld, normalWorld, normalView, cameraPosition, modelViewMatrix, instancedBufferAttribute,
  instancedDynamicBufferAttribute, varying, mx_fractal_noise_float, mx_noise_float, atan, pass, texture, length, log} from 'three/tsl';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {baueInhalt, wegZu, adresse, bisherigeAdresse, mengenWort, zeitWort, OFFEN, TRAGEND, ARTWORT} from '../../app/werkansichten/inhalt.js';
import {baueBezuege, BELEGT, BERECHNET} from '../../app/werkansichten/bezug.js';

const $ = s => document.querySelector(s);
const canvas = $('#welt'), satzEl = $('#satz'), namenEl = $('#namen'), blattEl = $('#blatt');
const klein = Math.min(innerWidth, innerHeight) < 700, tablet = !klein && (navigator.maxTouchPoints > 1 || /iPad/.test(navigator.userAgent));
const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
const T0 = performance.now(), messung = {start: 0, erstesBild: 0, bestand: 0, fps: 0};
let satzZeit = 0; const sage = (t, dauer = 5200) => { satzEl.textContent = t; satzEl.classList.remove('weg'); clearTimeout(satzZeit); if(dauer) satzZeit = setTimeout(() => satzEl.classList.add('weg'), dauer); };

/* ---------- Zufall mit Gedächtnis: jede Galaxie sieht beim nächsten Mal gleich aus ---------- */
function zufall(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = zufall(20261111), gauss = () => { let u = 0, v = 0; while(!u) u = rnd(); while(!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const hashS = s => { let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ---------- Maße der Galaxie ---------- */
const R = 1000, R0 = 120, STEIG = 1 / Math.tan(13.5 * Math.PI / 180);         // Radius, Ansatz der Arme, Steigung der logarithmischen Spirale
const armWinkel = (r, arm) => arm * Math.PI + STEIG * Math.log(Math.max(r, 30) / R0);
const DREH = Math.PI * 2 / 2400;                                                // die Galaxie dreht sich in 40 Minuten einmal
// Plätze der Sonnen auf den beiden Hauptarmen, innen zuerst. Fest, damit Sterne und Staub schon vor den Daten stehen
const PLAETZE = [[330, 0], [385, 1], [505, 0], [580, 1], [680, 0], [790, 1], [860, 0], [930, 1], [980, 0]].map(([r, arm]) => { const a = armWinkel(r, arm) + 0.05; return {r, arm, x: Math.cos(a) * r, z: Math.sin(a) * r}; });

/* ---------- Grafik ---------- */
const forceWebGL = /[?&]webgl/.test(location.search) || !navigator.gpu || !(await navigator.gpu.requestAdapter().catch(() => null));
const renderer = new THREE.WebGPURenderer({canvas, antialias: false, forceWebGL, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, klein ? 1.6 : tablet ? 1.5 : 1.75)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
try{ await renderer.init(); }catch(e){ sage('Diese Welt braucht WebGPU oder WebGL 2. Der Browser stellt gerade keines bereit.', 0); throw e; }
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x010207);
const camera = new THREE.PerspectiveCamera(klein && innerHeight > innerWidth ? 58 : 44, innerWidth / innerHeight, 0.05, 60000);
const galaxie = new THREE.Group(); scene.add(galaxie);
const U = {zeit: uniform(0), pxWelt: uniform(0.001), kernGlanz: uniform(1), scheibe: uniform(1), grund: uniform(1)};
const setzePx = () => { U.pxWelt.value = 2 * Math.tan(camera.fov * Math.PI / 360) / innerHeight; };
setzePx();

/* Leuchtpunkt: ein Bild-Teilchen in Weltgröße, nie kleiner als ein paar Pixel; was dafür vergrößert wird, wird dunkler.
   Nahe der Kamera tritt es zurück, damit man durch die Galaxie fliegen kann */
function leuchtpunkte({lage, farbe, zahl, dynamisch = false, minPx = 1.6, nah = [4, 22], form = 'stern', mischung = THREE.AdditiveBlending, deckung = 1, glanz = null}){
  const A = new THREE.InstancedBufferAttribute(lage, 4), F = new THREE.InstancedBufferAttribute(farbe, 4);
  if(dynamisch){ A.setUsage(THREE.DynamicDrawUsage); }
  const p = dynamisch ? instancedDynamicBufferAttribute(A) : instancedBufferAttribute(A), f = dynamisch ? instancedDynamicBufferAttribute(F) : instancedBufferAttribute(F);
  const m = new THREE.SpriteNodeMaterial({transparent: true, depthWrite: false, blending: mischung});
  m.positionNode = p.xyz;
  const tiefe = modelViewMatrix.mul(vec4(p.xyz, 1)).z.negate(), s = max(p.w, tiefe.mul(U.pxWelt).mul(minPx));
  m.scaleNode = s;
  const dimm = varying(p.w.div(s).pow(2).mul(smoothstep(nah[0], nah[1], tiefe)));
  const d = uv().sub(0.5).length().mul(2), rand = clamp(float(1).sub(d), 0, 1);
  let hell;
  if(form === 'stern') hell = exp(d.mul(d).mul(-14)).mul(1.6).add(exp(d.mul(-4.5)).mul(0.35)).mul(rand);      // heller Kern, weicher Saum
  else if(form === 'wolke') hell = exp(d.mul(d).mul(-3.2)).mul(rand).mul(mx_noise_float(vec3(uv().mul(3.2), f.w.mul(17))).mul(0.45).add(0.75));
  else hell = exp(d.mul(d).mul(-5)).mul(rand);
  m.colorNode = f.rgb;
  m.opacityNode = hell.mul(dimm).mul(mischung === THREE.AdditiveBlending ? f.w : f.w.mul(deckung)).mul(glanz || float(1));
  const sp = new THREE.Sprite(m); sp.count = zahl; sp.frustumCulled = false;
  return {sp, A, F};
}

/* ---------- Der Grund: Sterne, Staub, Nebel, Kern ---------- */
const farbeLin = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const SF = {alt: farbeLin('#ffd6a0'), mittel: farbeLin('#fff1dc'), jung: farbeLin('#a9c4ff'), weiss: farbeLin('#e7eeff'), kern: farbeLin('#ffc98a'), rot: farbeLin('#ff6f8f'), rosa: farbeLin('#ff9ab4')};
const mische = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const leerUmSonne = (x, z) => { let k = 1; for(const p of PLAETZE){ const d = Math.hypot(x - p.x, z - p.z); if(d < 95) k = Math.min(k, Math.max(0, (d - 40) / 55)); } return k; };

function baueSterne(){
  const N = klein ? 150000 : tablet ? 190000 : 340000, lage = new Float32Array(N * 4), farbe = new Float32Array(N * 4); let i = 0;
  const lege = (x, y, z, gr, c, h) => { lage.set([x, y, z, gr], i * 4); farbe.set([c[0], c[1], c[2], h], i * 4); i++; };
  while(i < N){
    const w = rnd();
    if(w < 0.16){   // Bulge: alte, warme Sterne, abgeplattet
      const r = Math.abs(gauss()) * 95 + Math.abs(gauss()) * 25, a = rnd() * Math.PI * 2, c = Math.acos(2 * rnd() - 1), x = Math.sin(c) * Math.cos(a) * r, z = Math.sin(c) * Math.sin(a) * r, y = Math.cos(c) * r * 0.55;
      lege(x, y, z, 0.9 + rnd() * 1.4, mische(SF.kern, SF.alt, rnd()), 0.22 + Math.pow(rnd(), 6) * 1.6);
    } else if(w < 0.2){   // Halo: wenige, schwach
      const r = 300 + Math.pow(rnd(), 0.7) * 1500, a = rnd() * Math.PI * 2, c = Math.acos(2 * rnd() - 1);
      lege(Math.sin(c) * Math.cos(a) * r, Math.cos(c) * r * 0.7, Math.sin(c) * Math.sin(a) * r, 1 + rnd(), SF.alt, 0.12 + rnd() * 0.25);
    } else {   // Scheibe mit Armen
      let r = -310 * Math.log(rnd() * rnd() + 1e-6) * 0.62 + 40; if(r > R * 1.35){ continue; }
      const imArm = rnd() < 0.72, haupt = rnd() < 0.78, arm = haupt ? (rnd() < 0.5 ? 0 : 1) : (rnd() < 0.5 ? 0.5 : 1.5);
      const breite = (0.16 + 0.22 * Math.min(1, r / R)) * (haupt ? 1 : 1.5);
      const a = imArm ? armWinkel(r, arm) + gauss() * breite + Math.sin(r * 0.031 + arm * 7) * 0.08 : rnd() * Math.PI * 2;
      r *= 1 + gauss() * 0.03; const x = Math.cos(a) * r, z = Math.sin(a) * r, k = leerUmSonne(x, z); if(k < 1 && rnd() > k) continue;
      const nahArm = imArm ? Math.exp(-Math.pow((a - armWinkel(r, arm)) / breite, 2)) : 0, y = gauss() * (7 + 14 * r / R) * (imArm ? 0.8 : 1.2);
      const c = nahArm > 0.55 && rnd() < 0.6 ? mische(SF.jung, SF.weiss, rnd() * 0.6) : mische(SF.mittel, SF.alt, rnd());
      lege(x, y, z, 0.8 + rnd() * 1.6 + (nahArm > 0.7 && rnd() < 0.04 ? 3 : 0), c, (0.22 + Math.pow(rnd(), 9) * 3.6) * (0.45 + nahArm * 1.1));
    }
  }
  return leuchtpunkte({lage, farbe, zahl: N, minPx: klein ? 1.3 : 1.5, nah: [3, 18], glanz: U.grund});
}
/* Sternentstehung: rosa leuchtende Gebiete und junge blaue Haufen an den Armen */
function baueNebel(){
  const H = klein ? 150 : 260, je = 26, N = H * je, lage = new Float32Array(N * 4), farbe = new Float32Array(N * 4); let i = 0;
  for(let h = 0; h < H; h++){
    const arm = h % 3 === 2 ? (rnd() < 0.5 ? 0.5 : 1.5) : h % 2, r = 170 + Math.pow(rnd(), 0.8) * 900, a0 = armWinkel(r, arm) + 0.07 + gauss() * 0.06, cx = Math.cos(a0) * r, cz = Math.sin(a0) * r, gross = 5 + rnd() * 16;
    if(leerUmSonne(cx, cz) < 0.6) continue;
    for(let j = 0; j < je && i < N; j++){ const rosa = j < je * 0.62, s = rosa ? gross : gross * 0.6, x = cx + gauss() * s, z = cz + gauss() * s, y = gauss() * s * 0.25;
      lage.set([x, y, z, rosa ? 4 + rnd() * 9 : 0.9 + rnd() * 1.8], i * 4); const c = rosa ? mische(SF.rot, SF.rosa, rnd()) : mische(SF.jung, SF.weiss, rnd() * 0.5); farbe.set([c[0], c[1], c[2], rosa ? 0.16 + rnd() * 0.22 : 1.2 + rnd() * 2], i * 4); i++; }
  }
  return leuchtpunkte({lage, farbe, zahl: i, form: 'wolke', minPx: 1.2, nah: [8, 40], glanz: U.grund});
}
/* Staubbahnen: dunkle, zerfaserte Bänder an der Innenkante der Arme. Sie nehmen Licht, sie leuchten nicht */
function baueStaub(){
  const N = klein ? 26000 : 52000, lage = new Float32Array(N * 4), farbe = new Float32Array(N * 4); let i = 0;
  while(i < N){
    const arm = rnd() < 0.82 ? (rnd() < 0.5 ? 0 : 1) : (rnd() < 0.5 ? 0.5 : 1.5), r = 70 + Math.pow(rnd(), 0.9) * 1050, faser = Math.sin(r * 0.05 + arm * 3) * 0.04 + Math.sin(r * 0.013) * 0.05;
    const a = armWinkel(r, arm) - 0.12 - Math.abs(gauss()) * 0.05 + faser + (rnd() < 0.18 ? gauss() * 0.35 : 0), rr = r * (1 + gauss() * 0.012), x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if(r < 160 && rnd() < 0.5) continue; { const k = leerUmSonne(x, z); if(k < 1 && rnd() > k * 0.7) continue; }
    const dunkel = 0.006 + rnd() * 0.012; lage.set([x, gauss() * 3.2, z, 6 + rnd() * 16 * Math.min(1, r / 400 + 0.3)], i * 4); farbe.set([dunkel * 1.5, dunkel, dunkel * 0.6, 0.16 + rnd() * 0.3 * Math.min(1, r / 260)], i * 4); i++;
  }
  const s = leuchtpunkte({lage, farbe, zahl: N, form: 'wolke', mischung: THREE.NormalBlending, minPx: 0, nah: [12, 60], deckung: 1}); s.sp.renderOrder = 3; return s;
}
/* Ungelöstes Licht der Scheibe und der Bulge, damit die Galaxie kein Punkthaufen ist */
function baueScheibe(){
  const g = new THREE.CircleGeometry(R * 1.45, 220); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshBasicNodeMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide});
  const p = positionGeometry.xz, r = length(p), th = atan(p.y, p.x), lnr = log(max(r, 30).div(R0)).mul(STEIG);
  const arm = pow(cos(th.sub(lnr)).mul(0.5).add(0.5), 6).add(pow(cos(th.sub(lnr).sub(Math.PI)).mul(0.5).add(0.5), 6)).mul(0.6);
  const neb = mx_fractal_noise_float(vec3(p.mul(0.006), 1.3), 4, 2, 0.55).mul(0.5).add(0.6);
  const scheibe = exp(r.div(-340)).mul(arm.mul(neb).mul(1.25).add(0.1)), bulge = exp(r.mul(r).div(-2 * 105 * 105)).mul(0.32).add(exp(r.div(-30)).mul(0.35));
  const blick = smoothstep(0.03, 0.5, abs(dot(normalize(cameraPosition.sub(positionWorld)), vec3(0, 1, 0))));
  const c = mix(vec3(0.42, 0.52, 0.82), vec3(1.0, 0.82, 0.58), smoothstep(520, 120, r)).mul(scheibe).mul(0.55).mul(U.scheibe).add(vec3(1.0, 0.78, 0.5).mul(bulge).mul(U.kernGlanz));
  m.colorNode = c.mul(blick.mul(0.85).add(0.15)).mul(smoothstep(R * 1.45, R * 0.9, r)); m.opacityNode = float(1);
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 1; return mesh;
}
/* Der Kern: dichtes, warmes Licht. Er ist die hellste Stelle der Galaxie */
function baueKern(){
  const lage = new Float32Array([0, 0, 0, 170, 0, 0, 0, 52, 0, 0, 0, 11]), farbe = new Float32Array([1, 0.66, 0.38, 0.16, 1, 0.8, 0.55, 0.5, 1, 0.93, 0.82, 1.6]);
  const k = leuchtpunkte({lage, farbe, zahl: 3, form: 'weich', minPx: 0, nah: [1, 3]});
  k.sp.material.opacityNode = k.sp.material.opacityNode.mul(U.kernGlanz); return k;
}
/* Ferne Sterne als Himmel */
function baueHimmel(){
  const N = klein ? 5000 : 9000, lage = new Float32Array(N * 4), farbe = new Float32Array(N * 4);
  for(let i = 0; i < N; i++){ const a = rnd() * Math.PI * 2, c = Math.acos(2 * rnd() - 1), r = 30000; lage.set([Math.sin(c) * Math.cos(a) * r, Math.cos(c) * r, Math.sin(c) * Math.sin(a) * r, 40], i * 4); const f = mische(SF.weiss, SF.alt, rnd()); farbe.set([f[0], f[1], f[2], 0.12 + Math.pow(rnd(), 5) * 0.9], i * 4); }
  return leuchtpunkte({lage, farbe, zahl: N, minPx: 1.3, nah: [0, 1]});
}
const grund = {sterne: baueSterne(), nebel: baueNebel(), staub: baueStaub(), kern: baueKern()};
galaxie.add(baueScheibe(), grund.sterne.sp, grund.nebel.sp, grund.staub.sp, grund.kern.sp); scene.add(baueHimmel().sp);

/* ---------- Nachbearbeitung: Glühen nur an hellen Stellen ---------- */
const Pipe = THREE.RenderPipeline || THREE.PostProcessing, pipe = new Pipe(renderer), szene = pass(scene, camera), bild = szene.getTextureNode('output');
pipe.outputNode = bild.add(bloom(bild, klein ? 0.75 : 0.9, 0.62, 0.22));

/* ---------- Kamera und Steuerung ---------- */
const steuer = new OrbitControls(camera, canvas); steuer.enableDamping = true; steuer.dampingFactor = 0.075; steuer.rotateSpeed = 0.55; steuer.zoomSpeed = 0.9; steuer.minDistance = 0.4; steuer.maxDistance = 9000; steuer.listenToKeyEvents(window); steuer.keyPanSpeed = 18;
steuer.touches = {ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN};
const UEBERSICHT = {ziel: new THREE.Vector3(0, 0, 0), pos: new THREE.Vector3(0, 1250, 1500).multiplyScalar(innerHeight > innerWidth * 1.3 ? 1.2 : 1)};
camera.position.set(-2600, 340, 4300); steuer.target.set(0, 0, 0); camera.lookAt(0, 0, 0);

let fahrt = null;   // {von, nach, ...}
const sanft = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function fliege(zielFn, abstand, dauer = 2.4, richtung = null){
  const vonZ = steuer.target.clone(), vonP = camera.position.clone(), r0 = vonP.clone().sub(vonZ), d0 = r0.length();
  const dir = (richtung || r0.clone().normalize().lerp(new THREE.Vector3(0, 0.75, 0.66).normalize(), 0.35)).normalize();
  fahrt = {zielFn, abstand, dauer: ruhig ? 0.001 : dauer, t: 0, vonZ, vonP, d0, dir, r0n: r0.normalize()};
}
function fahrtSchritt(dt){
  if(!fahrt) return false; fahrt.t = Math.min(1, fahrt.t + dt / fahrt.dauer); const e = sanft(fahrt.t), z = fahrt.zielFn();
  const zi = fahrt.vonZ.clone().lerp(z, e), d = Math.exp(Math.log(fahrt.d0) + (Math.log(fahrt.abstand) - Math.log(fahrt.d0)) * e), dir = fahrt.r0n.clone().lerp(fahrt.dir, e).normalize();
  const bogen = Math.sin(Math.PI * e) * Math.min(fahrt.d0, 800) * 0.18;
  steuer.target.copy(zi); camera.position.copy(zi).addScaledVector(dir, d); camera.position.y += bogen;
  if(fahrt.t >= 1){ fahrt = null; } return true;
}

/* ---------- Der Bestand ---------- */
async function holeBestand(url){
  let lager = null; try{ lager = await caches.open('welten3d-bestand'); }catch(e){ /* ohne Ablage */ }
  const frisch = fetch(url).then(r => { if(!r.ok) throw new Error(url + ' ' + r.status); if(lager) lager.put(url, r.clone()).catch(() => {}); return r.text(); });
  const alt = lager ? await lager.match(url).catch(() => null) : null;
  if(alt){ const t = await alt.text(); frisch.then(n => { if(n !== t) sage('Der Bestand hat sich seit dem letzten Besuch geändert. Neu laden zeigt den neuen Stand.'); }).catch(() => {}); try{ return JSON.parse(t); }catch(e){ /* frisch */ } }
  return JSON.parse(await frisch);
}
const bildUrl = (b, w = 240) => `/lichtwerk/bild?w=${w >= 400 ? 960 : 240}&pfad=${encodeURIComponent(b.pfad)}`;

/* Stimmen und ihre Farben (wie im Lichtwerk) */
const STIMMFARBE = [[/^claude/i, '#ffb45c', 'Claude'], [/^codex/i, '#38c8ff', 'Codex'], [/^hermes/i, '#86e070', 'Hermes'], [/^anti-?\s?gravity/i, '#9b7bff', 'Antigravity'], [/^kimi/i, '#ff5e8a', 'Kimi'], [/^astra/i, '#ffe36e', 'Astra'], [/^chatgpt/i, '#4fd6a8', 'ChatGPT'], [/^cursor/i, '#c7cede', 'Cursor'], [/^grok/i, '#ff8f4a', 'Grok'], [/^gemini/i, '#6fa8ff', 'Gemini'], [/^ralf/i, '#ffffff', 'Ralf'], [/./, '#b9b2a6', 'Übernommener Bestand']];
const stimmeVon = h => { for(const [m, f, n] of STIMMFARBE) if(m.test(h || '')) return {f, n}; return {f: '#b9b2a6', n: 'Übernommener Bestand'}; };
const ORTFARBE = {'Tragwerk System': '#efc98f', 'MiND-BODY-SOUL': '#b98bd9', 'GAMES': '#4fd1b5', 'MUSiC': '#ff8a4f', 'EDUCATiON': '#6aa6ff', 'WRiTING': '#f2cf5b', 'ARTS': '#ff6f9a', 'PERSONAL': '#8fd65e', 'Zur Prüfung': '#b8b6ad'};

const satz0 = klein ? 'Ziehen dreht · zwei Finger zoomen · Tippen wählt' : 'Ziehen dreht · Rad zoomt · Klicken wählt · Doppelklick liest';
sage('Die Galaxie entsteht. Der Bestand wird gelesen …', 0);

/* Einflug: von weit draußen bis zur Übersicht, überspringbar */
let einflug = !ruhig; const fahrtKnopf = $('#fahrt');
if(einflug){ fahrtKnopf.hidden = false; fliege(() => UEBERSICHT.ziel, UEBERSICHT.pos.length(), 9, UEBERSICHT.pos.clone().normalize()); fahrt.bogenAus = true; }
else { camera.position.copy(UEBERSICHT.pos); }
const beendeEinflug = () => { if(!einflug) return; einflug = false; fahrtKnopf.hidden = true; if(fahrt && fahrt.dauer > 5){ fahrt.dauer = Math.max(fahrt.t * fahrt.dauer + 0.9, 1); } };
fahrtKnopf.onclick = () => { beendeEinflug(); if(fahrt){ fahrt.t = 1; fahrtSchritt(0); } camera.position.copy(UEBERSICHT.pos); steuer.target.set(0, 0, 0); };

/* ---------- Bauplan aus dem Inhalt ---------- */
const KOERPER = [], MONDE = [], SONNEN = [], jeKnoten = new Map(), jeSchluessel = new Map();
const lokal = new THREE.Vector3(), welt = new THREE.Vector3();
const alterVon = k => k.von == null ? Infinity : k.von;
const nachZeit = (a, b) => alterVon(a) - alterVon(b) || a.name.localeCompare(b.name, 'de');
const lg = x => Math.log10(1 + x);
function ebene(seed, kipp){ const r = zufall(seed), n = new THREE.Vector3((r() - 0.5) * kipp, 1, (r() - 0.5) * kipp).normalize(), u = new THREE.Vector3(1, 0, 0).cross(n).normalize(), v = n.clone().cross(u).normalize(); return {n, u, v}; }

function baueKoerper(k, typ, host){
  const b = {k, typ, host, kinder: [], monde: [], lokal: new THREE.Vector3(), welt: new THREE.Vector3(), a: 0, phase: 0, w: 0, e: null, spirale: 0, spiraleZiel: 0};
  const seed = hashS(k.schluessel + typ); b.seed = seed;
  if(typ === 'sonne') b.r = 3.2 + 1.2 * lg(k.fassungen);
  else if(typ === 'kern') b.r = 0;
  else if(typ === 'planet' || typ === 'wanderer') b.r = 0.9 + 0.75 * lg(k.zeichen / 3000) + 0.12 * lg(k.fassungen) * 3;
  else b.r = 0.42 + 0.4 * lg(k.zeichen / 4000);
  b.e = ebene(seed, typ === 'sonne' || typ === 'kern' ? 0.06 : 0.3);
  const blaetter = (k.kinder || []).filter(c => !c.kinder).sort(nachZeit), aeste = (k.kinder || []).filter(c => c.kinder).sort(nachZeit);
  // Monde auf der Zeitspirale: innen das Älteste (goldener Winkel, Abstand wächst mit der Wurzel der Folge)
  const schritt = Math.max(0.3, b.r * 0.32), innen = Math.max(b.r * 1.9, b.r + 0.6);
  blaetter.forEach((c, j) => { const rad = innen + schritt * Math.sqrt(j + 0.6) * 1.7; MONDE.push({k: c, host: b, j, rad, phase: j * 2.39996 + (seed % 100) * 0.07, w: 0, r: Math.max(0.05, Math.min(0.26, 0.06 + 0.07 * lg(c.zeichen / 300))), welt: new THREE.Vector3(), lokal: new THREE.Vector3()}); b.monde.push(MONDE[MONDE.length - 1]); });
  b.mondRand = b.monde.length ? b.monde[b.monde.length - 1].rad + b.r * 0.4 : b.r * 1.3;
  KOERPER.push(b); if(typ === 'sonne') SONNEN.push(b);
  let a = Math.max(b.mondRand, typ === 'sonne' ? b.r * 4.5 : b.r * 2.2);
  for(const c of aeste){
    const kt = c.art === 'ort' || c.art === 'bereich' ? 'sonne' : typ === 'sonne' || typ === 'kern' ? 'planet' : 'trabant', kb = baueKoerper(c, kt, b);
    a += kb.ausdehnung + (kt === 'sonne' ? 8 : 1.2 + kb.ausdehnung * 0.35); kb.a = a; a += kb.ausdehnung; kb.phase = (hashS(c.schluessel) % 6283) / 1000; b.kinder.push(kb);
  }
  b.ausdehnung = Math.max(b.mondRand, a, b.r * 1.5);
  return b;
}
function skaliere(b, s){ b.r *= s; b.a *= s; b.mondRand *= s; b.ausdehnung *= s; for(const m of b.monde){ m.rad *= s; m.r *= s; } for(const c of b.kinder) skaliere(c, s); }
/* Nach dem Einpassen: Körper wieder so groß, wie der Platz bis zum ersten Mond oder Planeten erlaubt */
function aufblaehen(b, s){ const innen = Math.min(b.monde.length ? b.monde[0].rad : Infinity, ...b.kinder.map(c => c.a - c.ausdehnung)); if(b.r) b.r = Math.min(b.r / Math.pow(s, 0.55), isFinite(innen) ? innen * (b.typ === 'sonne' ? 0.42 : 0.5) : b.r / Math.pow(s, 0.55));
  b.monde.forEach((m, j) => { const luecke = j + 1 < b.monde.length ? b.monde[j + 1].rad - m.rad : m.rad * 0.3; m.r = Math.min(m.r / Math.pow(s, 0.5), Math.max(luecke * 1.1, m.r)); }); for(const c of b.kinder) aufblaehen(c, s); }
// Kepler-artig: innen schneller. Monde laufen schneller als Planeten
function bahnen(b){ for(const c of b.kinder){ c.w = Math.min(0.35, 0.9 * Math.pow(Math.max(c.a, 1) / 4, -1.5)) * (c.typ === 'sonne' ? 0.25 : 1); bahnen(c); } for(const m of b.monde) m.w = Math.min(0.3, 0.45 * Math.pow(Math.max(m.rad, 0.5) / 2, -1.5)); }

function baueBestand(I){
  const orte = I.wurzel.kinder.filter(c => c.art === 'ort');
  const kernOrte = orte.filter(o => TRAGEND.has(o.name)), offen = orte.filter(o => OFFEN.has(o.name)), daecher = orte.filter(o => !TRAGEND.has(o.name) && !OFFEN.has(o.name)).sort(nachZeit);
  // Kern: die Zentrale. Ihre Apps kreisen zwischen Kern und Armansatz
  const kern = {k: kernOrte[0] || {name: 'Zentrale', schluessel: 'kern', kinder: []}, typ: 'kern', host: null, kinder: [], monde: [], lokal: new THREE.Vector3(), welt: new THREE.Vector3(), r: 0, a: 0, phase: 0, w: 0, e: ebene(7, 0)};
  for(const o of kernOrte){ const b = baueKoerper(o, 'kern', null); b.typ = 'kern'; b.kinder.forEach(c => { kern.kinder.push(c); c.host = kern; }); b.monde.forEach(m => { kern.monde.push(m); m.host = kern; }); KOERPER.splice(KOERPER.indexOf(b), 1); }
  KOERPER.unshift(kern); kern.k = kernOrte[0] || kern.k;
  { // auf 75 bis 245 einpassen
    let a = 75; const span = kern.kinder.reduce((s, c) => s + c.ausdehnung * 2 + 1.5, 0), s = Math.min(1, 165 / Math.max(1, span));
    for(const c of kern.kinder){ skaliere(c, s); aufblaehen(c, s); a += c.ausdehnung; c.a = a; a += c.ausdehnung + 1.5 * s; }
    kern.monde.forEach((m, j) => { m.rad = 40 + j * 0.6; });
  }
  bahnen(kern); kern.kinder.forEach(c => { c.w *= 0.3; }); kern.mondRand = 40; kern.ausdehnung = 245;   // um den Kern sehr langsam, damit die Galaxie ihre Ordnung behält
  // Sonnen auf den Armen: das älteste Dach innen
  daecher.forEach((o, i) => { const b = baueKoerper(o, 'sonne', null), p = PLAETZE[i] || PLAETZE[PLAETZE.length - 1], s = Math.min(1, 92 / b.ausdehnung); skaliere(b, s); aufblaehen(b, s); b.platz = p; b.lokal.set(p.x, 0, p.z); bahnen(b); });
  // Ohne Ort: Wanderer auf geneigten Bahnen außerhalb der Scheibe
  offen.forEach(o => { (o.kinder || []).filter(c => c.kinder).sort(nachZeit).forEach((c, i) => { const b = baueKoerper(c, 'wanderer', null); const s = Math.min(1, 14 / b.ausdehnung); skaliere(b, s); aufblaehen(b, s); b.a = 1180 + i * 70; b.phase = i * 1.1 + 0.4; b.w = 0.004; b.e = ebene(hashS(c.name), 0.9); b.offenOrt = o; bahnen(b); }); });
  for(const b of KOERPER){ (jeKnoten.has(b.k) || jeKnoten.set(b.k, b)); const l = jeSchluessel.get(b.k.schluessel) || []; l.push(b); jeSchluessel.set(b.k.schluessel, l); }
  for(const m of MONDE){ jeKnoten.set(m.k, m); const l = jeSchluessel.get(m.k.schluessel) || []; l.push(m); jeSchluessel.set(m.k.schluessel, l); }
}

/* Lage aller Körper zur Zeit t (im Rahmen der Galaxie) */
const tmp = new THREE.Vector3(), achse = new THREE.Vector3(0, 1, 0);
let galDreh = 0;
function zurWelt(v, o){ const c = Math.cos(galDreh), s = Math.sin(galDreh); o.set(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); return o; }
function lagen(t){
  for(const b of KOERPER){
    if(b.typ === 'wanderer'){ const an = b.phase - b.w * t; b.lokal.copy(b.e.u).multiplyScalar(Math.cos(an) * b.a).addScaledVector(b.e.v, Math.sin(an) * b.a); }
    else if(b.host){ const an = b.phase - b.w * t, h = b.host.e; b.lokal.copy(b.host.lokal).addScaledVector(h.u, Math.cos(an) * b.a).addScaledVector(h.v, Math.sin(an) * b.a); }
    zurWelt(b.lokal, b.welt);
    b.spirale += (b.spiraleZiel - b.spirale) * 0.06;
  }
  for(const m of MONDE){
    const b = m.host, an = m.phase - m.w * t, e = b.e, sp = b.spirale, n = b.monde.length, hoch = sp * (m.j + 0.5) / n * b.mondRand * 2.4, rr = m.rad * (1 - sp * 0.45);
    m.lokal.copy(b.lokal).addScaledVector(e.u, Math.cos(an) * rr).addScaledVector(e.v, Math.sin(an) * rr).addScaledVector(e.n, hoch);
    zurWelt(m.lokal, m.welt);
  }
}

/* ---------- Gestalt der Körper ---------- */
let planetenMesh, mondMesh, sonnenMesh, koepfe, kronen, spuren, perlen, planetenListe = [], licht, gewMarke;
function baueGestalt(){
  planetenListe = KOERPER.filter(b => b.typ === 'planet' || b.typ === 'trabant' || b.typ === 'wanderer');
  const P = planetenListe.length;
  // Planeten: Gasriesen (Apps) mit Bändern, Gesteinswelten (Werke) mit Kontinenten. Licht kommt von ihrer Sonne
  {
    const g = new THREE.SphereGeometry(1, klein ? 40 : 56, klein ? 28 : 40), farbe = new Float32Array(P * 4), art = new Float32Array(P * 4);
    licht = new THREE.InstancedBufferAttribute(new Float32Array(P * 4), 4); licht.setUsage(THREE.DynamicDrawUsage);
    planetenListe.forEach((b, i) => { const o = ortVon(b.k), c = new THREE.Color(ORTFARBE[o] || '#c9c4b8'), hsl = {}; c.getHSL(hsl); const r = zufall(b.seed); c.setHSL((hsl.h + (r() - 0.5) * 0.12 + 1) % 1, Math.min(0.75, hsl.s * (0.45 + r() * 0.5)), 0.32 + r() * 0.3);
      farbe.set([c.r, c.g, c.b, b.k.bildzahl ? 1 : 0], i * 4); art.set([(b.seed % 997) / 97, b.typ === 'trabant' ? 0 : 1, r(), 0], i * 4); b.idx = i; });
    const artAttr = new THREE.InstancedBufferAttribute(art, 4); artAttr.setUsage(THREE.DynamicDrawUsage); const F = instancedBufferAttribute(new THREE.InstancedBufferAttribute(farbe, 4)), A = instancedDynamicBufferAttribute(artAttr), L = instancedDynamicBufferAttribute(licht);
    const m = new THREE.MeshBasicNodeMaterial(), p = positionGeometry, s = A.x;
    const n = normalize(normalWorld), d = dot(n, normalize(L.xyz)), tag = smoothstep(-0.08, 0.7, d).mul(L.w);
    const baender = sin(p.y.mul(float(9).add(A.z.mul(14))).add(mx_fractal_noise_float(p.mul(vec3(1.4, 5, 1.4)).add(s), 4, 2, 0.5).mul(2.6))).mul(0.5).add(0.5);
    const land = smoothstep(0.02, 0.12, mx_fractal_noise_float(p.mul(2.2).add(s.mul(3)), 5, 2, 0.5)), wolke = smoothstep(0.15, 0.55, mx_fractal_noise_float(p.mul(3.3).add(s.mul(9)), 4, 2, 0.5));
    const gas = mix(F.rgb.mul(0.55), F.rgb.mul(1.25).add(0.05), baender), fels = mix(vec3(0.05, 0.12, 0.26), F.rgb.mul(0.9), land).add(wolke.mul(0.5));
    const grundF = mix(fels, gas, A.y), rand = pow(float(1).sub(abs(dot(normalize(normalView), vec3(0, 0, 1)))), 2.6), atmo = mix(F.rgb, vec3(0.6, 0.8, 1), 0.45);
    m.colorNode = grundF.mul(tag.mul(1.25).add(0.015)).add(atmo.mul(rand).mul(tag.mul(1.1).add(0.08))).add(vec3(1, 0.82, 0.5).mul(A.w).mul(rand.mul(0.9)));
    planetenMesh = new THREE.InstancedMesh(g, m, P); planetenMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); planetenMesh.frustumCulled = false;
    planetenMesh.userData.art = art; planetenMesh.userData.artAttr = artAttr; scene.add(planetenMesh);
  }
  // Monde: kleine Körper in der Farbe ihrer Stimme, mit hellem Kopf
  {
    const M = MONDE.length, g = new THREE.IcosahedronGeometry(1, 2), farbe = new Float32Array(M * 4);
    MONDE.forEach((q, i) => { const c = new THREE.Color(q.k.art === 'gespraech' ? '#dfe6ff' : stimmeVon(q.k.stimme).f); farbe.set([c.r, c.g, c.b, q.k.bilder && q.k.bilder.length ? 1 : 0], i * 4); q.idx = i; });
    const F = instancedBufferAttribute(new THREE.InstancedBufferAttribute(farbe, 4)), m = new THREE.MeshBasicNodeMaterial();
    const rand = pow(float(1).sub(abs(dot(normalize(normalView), vec3(0, 0, 1)))), 1.5);
    m.colorNode = F.rgb.mul(rand.mul(1.8).add(0.55));
    mondMesh = new THREE.InstancedMesh(g, m, M); mondMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mondMesh.frustumCulled = false; scene.add(mondMesh);
  }
  // Sonnen: brodelnde Oberfläche, Randverdunklung, Korona
  {
    const S = SONNEN.length, g = new THREE.SphereGeometry(1, 64, 48), farbe = new Float32Array(S * 4);
    SONNEN.forEach((b, i) => { const c = new THREE.Color(ORTFARBE[b.k.name] || ORTFARBE[ortVon(b.k)] || '#ffe2b0'); farbe.set([c.r, c.g, c.b, (b.seed % 1000) / 100], i * 4); b.sIdx = i; });
    const F = instancedBufferAttribute(new THREE.InstancedBufferAttribute(farbe, 4)), m = new THREE.MeshBasicNodeMaterial(), p = positionGeometry;
    const korn = mx_fractal_noise_float(p.mul(5.5).add(vec3(F.w, U.zeit.mul(0.035), F.w.mul(0.3))), 5, 2.1, 0.55), flecken = smoothstep(0.42, 0.62, mx_noise_float(p.mul(1.6).add(F.w.add(U.zeit.mul(0.01)))));
    const mitte = dot(normalize(normalView), vec3(0, 0, 1)).clamp(0, 1), randD = pow(mitte, 0.45);
    const heiss = mix(F.rgb, vec3(1, 0.97, 0.9), 0.55);
    m.colorNode = mix(F.rgb.mul(1.4), heiss.mul(3.2), korn.mul(0.5).add(0.5)).mul(randD.mul(0.85).add(0.15)).mul(float(1).sub(flecken.mul(0.45)));
    sonnenMesh = new THREE.InstancedMesh(g, m, S); sonnenMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); sonnenMesh.frustumCulled = false; scene.add(sonnenMesh);
    // Korona und Schein, dynamisch mitgeführt
    const lage = new Float32Array(S * 2 * 4), fa = new Float32Array(S * 2 * 4);
    SONNEN.forEach((b, i) => { const c = new THREE.Color(ORTFARBE[b.k.name] || '#ffe2b0'); fa.set([c.r, c.g, c.b, 0.85], i * 8); fa.set([c.r * 0.8 + 0.2, c.g * 0.8 + 0.2, c.b * 0.8 + 0.2, 0.26], i * 8 + 4); });
    kronen = leuchtpunkte({lage, farbe: fa, zahl: S * 2, dynamisch: true, form: 'weich', minPx: 4, nah: [0.5, 2]}); scene.add(kronen.sp);
  }
  // Helle Köpfe: jeder Planet und jeder Mond ist auch von fern als Licht zu finden
  {
    const Z = P + MONDE.length, lage = new Float32Array(Z * 4), fa = new Float32Array(Z * 4);
    planetenListe.forEach((b, i) => { const c = new THREE.Color(ORTFARBE[ortVon(b.k)] || '#e6e1d6').lerp(new THREE.Color('#ffffff'), 0.4); fa.set([c.r, c.g, c.b, b.typ === 'trabant' ? 0.5 : 0.9], i * 4); });
    MONDE.forEach((q, i) => { const c = new THREE.Color(q.k.art === 'gespraech' ? '#dfe6ff' : stimmeVon(q.k.stimme).f); fa.set([c.r, c.g, c.b, 0.85], (P + i) * 4); });
    koepfe = leuchtpunkte({lage, farbe: fa, zahl: Z, dynamisch: true, minPx: 2.2, nah: [0.3, 1.5]}); scene.add(koepfe.sp);
  }
  // Kurze Bahnspuren hinter den Planeten: man sieht, dass sie laufen, ohne gezeichnete Kreise
  {
    const SP = 22, g = new THREE.BufferGeometry(), pos = new Float32Array(P * SP * 2 * 3), col = new Float32Array(P * SP * 2 * 3);
    planetenListe.forEach((b, i) => { const c = new THREE.Color(ORTFARBE[ortVon(b.k)] || '#e6e1d6'); for(let s = 0; s < SP; s++) for(let e = 0; e < 2; e++){ const f = Math.pow(1 - (s + e) / SP, 2) * (b.typ === 'trabant' ? 0.16 : b.typ === 'wanderer' ? 0.12 : 0.38); col.set([c.r * f, c.g * f, c.b * f], ((i * SP + s) * 2 + e) * 3); } });
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    spuren = new THREE.LineSegments(g, new THREE.LineBasicNodeMaterial({vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false})); spuren.frustumCulled = false; spuren.userData.SP = SP; scene.add(spuren);
  }
  // Perlen für Beziehungen
  { const Z = 9000; perlen = leuchtpunkte({lage: new Float32Array(Z * 4), farbe: new Float32Array(Z * 4), zahl: 0, dynamisch: true, minPx: 1.8, nah: [0.2, 1]}); perlen.F.setUsage(THREE.DynamicDrawUsage); perlen.max = Z; scene.add(perlen.sp); }
}
const ortVon = k => { const w = wegZu(k); return w[1] ? w[1].name : ''; };

/* Jedes Bild ein Fenster: die echten Bilder der Fassungen schweben am gewählten Planeten */
const TL = new THREE.TextureLoader(), tafelGruppe = new THREE.Group(); scene.add(tafelGruppe); let tafeln = [];
function zeigeTafeln(b){
  for(const t of tafeln){ t.sp.material.dispose(); if(t.tex) t.tex.dispose(); } tafelGruppe.clear(); tafeln = [];
  if(!b) return;
  const monde = (b.monde || []).concat(...(b.kinder || []).map(c => c.monde)).filter(q => q.k.bild).slice(0, klein ? 18 : 36);
  for(const q of monde){
    const tex = TL.load(bildUrl(q.k.bild, 240)); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.SpriteNodeMaterial({transparent: true, depthWrite: false}), d = uv().sub(0.5), ecke = smoothstep(0.5, 0.47, abs(d.x)).mul(smoothstep(0.5, 0.45, abs(d.y)));
    m.colorNode = texture(tex, uv()).rgb.mul(1.15); m.opacityNode = ecke.mul(0.95);
    const sp = new THREE.Sprite(m); sp.center.set(0.5, -0.25); tafelGruppe.add(sp); tafeln.push({sp, tex, q});
  }
}

/* ---------- Beziehungen als Lichtfäden ---------- */
let bezug = null, faeden = [], naeheAn = false;
const knopfNaehe = $('#knNaehe');
knopfNaehe.onclick = () => { naeheAn = !naeheAn; knopfNaehe.setAttribute('aria-pressed', naeheAn); setzeFaeden(gewaehlt); sage(naeheAn ? 'Berechnete Nähe sichtbar: gestrichelt und blau. Sie behauptet keine Verbindung.' : 'Nur belegte Beziehungen.'); };
const koerperFuer = k => { for(let q = k; q; q = q.eltern){ const l = jeSchluessel.get(q.schluessel); if(l) return l[0]; } return null; };
function setzeFaeden(k){
  faeden = [];
  if(!k || !bezug || k.art === 'wurzel' || k.art === 'ort') { $('#legende').hidden = true; return; }
  const von = koerperFuer(k); if(!von) return;
  for(const e of bezug.von(k)){ if(!e.belegt && !naeheAn) continue; const zu = koerperFuer(e.andere); if(!zu || zu === von) continue; faeden.push({von, zu, belegt: e.belegt, art: e.art, aus: e.aus}); if(faeden.length > 140) break; }
  for(const sp of jeSchluessel.get(k.schluessel) || []) if(sp !== von) faeden.push({von, zu: sp, spiegel: true});
  $('#legende').hidden = !faeden.length || klein;
}
const bz = new THREE.Vector3(), bm = new THREE.Vector3();
function faedenSchritt(t){
  const L = perlen.A.array, F = perlen.F.array; let z = 0;
  for(const f of faeden){
    const a = f.von.welt, b = f.zu.welt, d = a.distanceTo(b), n = f.spiegel ? 60 : f.belegt ? Math.min(160, 40 + d * 0.25) : Math.min(60, 14 + d * 0.06);
    bm.copy(a).add(b).multiplyScalar(0.5); bm.y += d * 0.22 + 2;
    const c = f.spiegel ? [0.85, 0.87, 0.92] : f.belegt ? (f.aus ? [1, 0.86, 0.6] : [1, 0.95, 0.85]) : [0.45, 0.62, 1], gr = Math.max(0.05, Math.min(3, d * 0.004)) * (f.belegt ? 1 : 0.8);
    for(let i = 0; i < n && z < perlen.max; i++){
      let u = (i + (f.spiegel ? 0 : (t * (f.belegt ? 0.12 : 0.05)) % 1 * 1)) / n; u = u % 1; if(!f.belegt && !f.spiegel && i % 2) continue;
      const v = 1 - u; bz.set(v * v * a.x + 2 * v * u * bm.x + u * u * b.x, v * v * a.y + 2 * v * u * bm.y + u * u * b.y, v * v * a.z + 2 * v * u * bm.z + u * u * b.z);
      L[z * 4] = bz.x; L[z * 4 + 1] = bz.y; L[z * 4 + 2] = bz.z; L[z * 4 + 3] = gr * (f.spiegel ? 0.6 : 1);
      const kopf = f.belegt ? 0.55 + 0.45 * Math.pow(Math.sin(u * Math.PI), 0.5) : 0.35; F[z * 4] = c[0]; F[z * 4 + 1] = c[1]; F[z * 4 + 2] = c[2]; F[z * 4 + 3] = (f.belegt ? 1.4 : f.spiegel ? 0.5 : 0.8) * kopf; z++;
    }
  }
  perlen.sp.count = z; perlen.A.needsUpdate = true; perlen.F.needsUpdate = true;
}

/* ---------- Bild für Bild ---------- */
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), V3 = new THREE.Vector3();
let gewaehlt = null, gewKoerper = null, I = null, bereit = false;
function schreibeInstanzen(t){
  const kd = steuer.target.distanceTo(camera.position);
  planetenListe.forEach((b, i) => {
    M4.compose(b.welt, Q.identity(), S3.setScalar(b.r)); M4.toArray(planetenMesh.instanceMatrix.array, i * 16);
    let s = b.host; while(s && s.typ !== 'sonne' && s.typ !== 'kern') s = s.host; const q = s ? s.welt : V3.set(0, 0, 0);
    V3.copy(q).sub(b.welt); const dl = V3.length() || 1; licht.array.set([V3.x / dl, V3.y / dl, V3.z / dl, b.typ === 'wanderer' ? 0.35 : 1], i * 4);
    const L = koepfe.A.array; L[i * 4] = b.welt.x; L[i * 4 + 1] = b.welt.y; L[i * 4 + 2] = b.welt.z; L[i * 4 + 3] = b.r * (b.typ === 'trabant' ? 1.2 : 2);
  });
  planetenMesh.instanceMatrix.needsUpdate = true; licht.needsUpdate = true;
  const P = planetenListe.length;
  MONDE.forEach((q, i) => { M4.compose(q.welt, Q.identity(), S3.setScalar(q.r)); M4.toArray(mondMesh.instanceMatrix.array, i * 16); const L = koepfe.A.array, o = (P + i) * 4; L[o] = q.welt.x; L[o + 1] = q.welt.y; L[o + 2] = q.welt.z; L[o + 3] = q.r * 1.6; });
  mondMesh.instanceMatrix.needsUpdate = true; koepfe.A.needsUpdate = true;
  const KL = kronen.A.array;
  SONNEN.forEach((b, i) => { M4.compose(b.welt, Q.identity(), S3.setScalar(b.r)); M4.toArray(sonnenMesh.instanceMatrix.array, i * 16); KL.set([b.welt.x, b.welt.y, b.welt.z, b.r * 4.2], i * 8); KL.set([b.welt.x, b.welt.y, b.welt.z, Math.max(b.r * 16, b.host ? 22 : 38)], i * 8 + 4); });
  sonnenMesh.instanceMatrix.needsUpdate = true; kronen.A.needsUpdate = true;
  // Spuren: dieselbe Bahn zu früheren Zeiten
  const SP = spuren.userData.SP, pos = spuren.geometry.attributes.position.array;
  planetenListe.forEach((b, i) => { const h = b.typ === 'wanderer' ? null : b.host; const bog = Math.min(0.5, 1.6 / Math.max(1, b.a * b.w * 6 + 1)) ; let px, py, pz;
    for(let s = 0; s <= SP; s++){ const tt = t - s * (b.typ === 'wanderer' ? 0.12 : 0.38) / Math.max(b.w, 1e-4) / SP; let x, y, z;
      if(h){ const an = b.phase - b.w * tt; tmp.copy(h.lokal).addScaledVector(h.e.u, Math.cos(an) * b.a).addScaledVector(h.e.v, Math.sin(an) * b.a); }
      else if(b.typ === 'wanderer'){ const an = b.phase - b.w * tt; tmp.copy(b.e.u).multiplyScalar(Math.cos(an) * b.a).addScaledVector(b.e.v, Math.sin(an) * b.a); }
      else tmp.copy(b.lokal);
      zurWelt(tmp, V3); x = V3.x; y = V3.y; z = V3.z;
      if(s){ const o = ((i * SP + s - 1) * 2) * 3; pos[o] = px; pos[o + 1] = py; pos[o + 2] = pz; pos[o + 3] = x; pos[o + 4] = y; pos[o + 5] = z; }
      px = x; py = y; pz = z; } void bog; });
  spuren.geometry.attributes.position.needsUpdate = true;
  // Bildtafeln an ihren Monden
  for(const tf of tafeln){ const q = tf.q, gr = Math.max(q.r * 7, (q.host.mondRand || 1) * 0.16); tf.sp.position.copy(q.welt); tf.sp.scale.set(gr * 1.5, gr, 1); }
  void kd;
}

/* ---------- Namen im Raum: nur so viele, wie lesbar sind, nie übereinander ---------- */
const namenCache = new Map(); let namenFrame = 0;
function namenEl2(c){
  const key = c.klasse + '|' + c.text + '|' + (c.unter || ''); let el = namenCache.get(key);
  if(!el){ el = document.createElement('div'); el.className = 'nm ' + c.klasse; el.textContent = c.text; if(c.unter){ const s = document.createElement('small'); s.textContent = c.unter; el.append(s); } namenEl.append(el); el._w = el.offsetWidth; el._h = el.offsetHeight; namenCache.set(key, el); }
  return el;
}
function namen(){
  if(++namenFrame % 2) return;
  const kand = [], cam = camera.position;
  const fokusSys = gewKoerper ? (function(b){ let s = b; while(s && s.host && s.typ !== 'sonne') s = s.host; return s; })(gewKoerper) : null;
  if(I){
    kand.push({b: KOERPER[0], text: 'Tragwerk System', unter: 'Zentrale', klasse: 'kern', prio: 100});
    for(const s of SONNEN) kand.push({b: s, text: s.k.name, unter: s.host ? 'Bereich' : mengenWort(s.k).split(' · ')[0], klasse: 'sonne', prio: s.host ? 70 : 90});
    for(const b of planetenListe){ const d = cam.distanceTo(b.welt), wichtig = b === gewKoerper || (gewKoerper && b.host === gewKoerper) || (fokusSys && b.host === fokusSys); if(d < Math.max(60, b.ausdehnung * 30) || (wichtig && d < 900)) kand.push({b, text: b.k.name, klasse: b === gewKoerper ? 'gew' : '', prio: (b === gewKoerper ? 95 : wichtig ? 60 : 40) - d * 0.01}); }
    if(gewKoerper && gewKoerper.monde) for(const q of gewKoerper.monde){ const d = cam.distanceTo(q.welt); if(d < gewKoerper.mondRand * 7) kand.push({b: q, text: q.k.name, klasse: 'mond', prio: 20 - d * 0.02}); }
    if(gewaehlt && (gewaehlt.art === 'fassung' || gewaehlt.art === 'gespraech')){ const q = jeKnoten.get(gewaehlt); if(q) kand.push({b: q, text: q.k.name, klasse: 'gew', prio: 99}); }
  }
  kand.sort((a, b) => b.prio - a.prio);
  const boxen = [], w = innerWidth, h = innerHeight, sichtbar = new Set(), grenze = klein ? 16 : 34;
  for(const id of ['leiste', 'blatt']){ const e = document.getElementById(id); if(e && !e.hidden){ for(const c of e.children){ const r = c.getBoundingClientRect(); if(r.width) boxen.push([r.left - 4, r.top - 4, r.right + 4, r.bottom + 4]); } } }
  for(const c of kand){
    if(sichtbar.size >= grenze) break;
    V3.copy(c.b.welt).project(camera); if(V3.z > 1 || V3.z < -1) continue; const x = (V3.x * 0.5 + 0.5) * w, y = (-V3.y * 0.5 + 0.5) * h; if(x < -40 || x > w + 40 || y < -20 || y > h + 20) continue;
    const el = namenEl2(c); if(sichtbar.has(el)) continue;
    const r = (c.b.r || 0.5) / (cam.distanceTo(c.b.welt) * U.pxWelt.value), bw = el._w, bh = el._h; let bx = x + Math.max(6, r + 4), by = y - bh / 2;
    if(bx + bw > w - 4) bx = x - Math.max(6, r + 4) - bw;   // am rechten Rand: Name links vom Körper
    if(boxen.some(o => bx < o[2] && bx + bw > o[0] && by < o[3] && by + bh > o[1])) continue; boxen.push([bx - 3, by - 2, bx + bw + 3, by + bh + 2]);
    el.style.transform = `translate(${bx.toFixed(1)}px,${by.toFixed(1)}px)`; el.classList.add('da'); sichtbar.add(el);
  }
  for(const el of namenCache.values()) if(!sichtbar.has(el)) el.classList.remove('da');
}

/* ---------- Wählen ---------- */
const abstandFuer = b => b.typ === 'kern' ? 430 : b.typ === 'sonne' ? Math.min(b.ausdehnung * 1.7 + 10, 220) : (b.k && (b.k.art === 'fassung' || b.k.art === 'gespraech')) ? Math.max(b.r * 26, b.host.mondRand * 0.9) : Math.max(b.r * 10, b.mondRand * 2.8, 3);
function waehle(k, mitAdresse = true, sanftFlug = true){
  gewaehlt = k && k.art !== 'wurzel' ? k : null; const b = gewaehlt ? (jeKnoten.get(gewaehlt) || koerperFuer(gewaehlt)) : null; gewKoerper = b && !b.j && b.j !== 0 ? b : b ? b.host : null;
  // Hervorhebung am Planeten
  const art = planetenMesh.userData.art; for(const p of planetenListe) art[p.idx * 4 + 3] = 0; if(gewKoerper && gewKoerper.idx != null && planetenListe[gewKoerper.idx] === gewKoerper) art[gewKoerper.idx * 4 + 3] = 1; planetenMesh.userData.artAttr.needsUpdate = true;
  for(const x of KOERPER) x.spiraleZiel = 0;
  zeigeTafeln(gewKoerper && gewKoerper.typ !== 'sonne' && gewKoerper.typ !== 'kern' ? gewKoerper : null);
  setzeFaeden(gewaehlt);
  if(b && sanftFlug){ beendeEinflug(); const ziel = b; fliege(() => ziel.welt, abstandFuer(ziel), b.typ === 'sonne' || b.typ === 'kern' ? 2.8 : 2.3); }
  else if(!b && sanftFlug){ fliege(() => UEBERSICHT.ziel, UEBERSICHT.pos.length(), 2.6, UEBERSICHT.pos.clone().normalize()); }
  zeichneBlatt(); zeichneWeg(); if(mitAdresse) inAdresse(true);
}
function zeichneWeg(){
  const nav = $('#weg'); nav.replaceChildren(); if(!gewaehlt) return;
  wegZu(gewaehlt).slice(1).forEach((q, i, l) => { if(i) { const s = document.createElement('i'); s.textContent = '›'; nav.append(s); } const b = document.createElement('button'); b.textContent = q.name; b.onclick = () => waehle(q); if(i === l.length - 1) b.style.color = 'var(--text)'; nav.append(b); });
}
const ARTNAME = {ort: 'Oberdach · Sonne', bereich: 'Bereich · Begleitstern', app: 'App · Planet', werk: 'Werk · Planet', fassung: 'Fassung · Mond', gespraech: 'Gespräch · Mond'};
function zeichneBlatt(){
  if(!gewaehlt){ blattEl.hidden = true; return; }
  const k = gewaehlt, B = blattEl; B.replaceChildren(); B.hidden = false;
  const zu = document.createElement('button'); zu.className = 'zu'; zu.setAttribute('aria-label', 'Zurück zum Übergeordneten'); zu.textContent = '×'; zu.onclick = () => waehle(k.eltern && k.eltern.art !== 'wurzel' ? k.eltern : null); B.append(zu);
  const bild = k.bild || (k.bilder && k.bilder[0]);
  if(bild){ const im = new Image(); im.className = 'bild'; im.alt = bild.text || ('Bild aus ' + k.name); im.decoding = 'async'; im.src = bildUrl(bild, 960); B.append(im); }
  else { const unterB = []; (function sammle(q){ for(const c of q.kinder || []){ if(unterB.length >= 4) return; if(c.bild && (c.art === 'app' || c.art === 'werk')) unterB.push(c.bild); else if(c.kinder) sammle(c); } })(k);
    if(unterB.length >= 2){ const mo = document.createElement('div'); mo.className = 'mosaik'; for(const ub of unterB){ const im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = bildUrl(ub, 240); mo.append(im); } B.append(mo); }
    else { const o = document.createElement('div'); o.className = 'ohne'; o.textContent = k.art === 'fassung' ? 'Zu dieser Fassung gibt es kein Bild.' : 'Ohne Bild'; B.append(o); } }
  const L = document.createElement('div'); L.className = 'leib'; B.append(L);
  const a = document.createElement('div'); a.className = 'art'; a.textContent = k.art === 'ort' && TRAGEND.has(k.name) ? 'Zentrale · Kern' : k.art === 'ort' && OFFEN.has(k.name) ? 'Noch ohne Ort · Wanderer' : (ARTNAME[k.art] || ARTWORT[k.art]); L.append(a);
  const h = document.createElement('h2'); h.textContent = k.name; L.append(h);
  const p1 = document.createElement('p'); p1.textContent = mengenWort(k) + ' · ' + zeitWort(k); L.append(p1);
  if(k.auch && k.auch.length > 1){ const p = document.createElement('p'); p.textContent = 'Dasselbe Werk liegt auch in: ' + k.auch.filter(o => o !== ortVon(k)).join(', '); L.append(p); }
  // Stimmen
  const fass = (function f(q){ return q.art === 'fassung' ? [q] : (q.kinder || []).flatMap(f); })(k), st = new Map(); for(const f of fass){ const s = stimmeVon(f.stimme); st.set(s.n, [s.f, (st.get(s.n) || [0, 0])[1] + 1]); }
  if(st.size){ const d = document.createElement('div'); d.className = 'stimmen'; [...st].sort((x, y) => y[1][1] - x[1][1]).slice(0, 7).forEach(([n, [f, z]]) => { const s = document.createElement('span'); s.className = 'stimme'; const i = document.createElement('i'); i.style.background = f; s.append(i, `${n}${fass.length > 1 ? ' ' + z : ''}`); d.append(s); }); L.append(d); }
  const tun = document.createElement('div'); tun.className = 'tun'; L.append(tun);
  const kn = (t, f, haupt) => { const b = document.createElement('button'); b.className = 'knopf' + (haupt ? ' haupt' : ''); b.textContent = t; b.onclick = f; tun.append(b); return b; };
  if(k.art === 'fassung' || k.art === 'werk' || k.art === 'app') kn('Lesen', () => { location.href = 'werkansichten.html#zelle/' + adresse(k); }, true);
  const kb = gewKoerper; if(kb && kb.monde && kb.monde.length > 2 && kb.typ !== 'sonne' && kb.typ !== 'kern'){ const s = kn(kb.spiraleZiel ? 'Spirale schließen' : 'Lebensspirale', () => { kb.spiraleZiel = kb.spiraleZiel ? 0 : 1; s.textContent = kb.spiraleZiel ? 'Spirale schließen' : 'Lebensspirale'; sage(kb.spiraleZiel ? 'Lebensspirale: die Fassungen steigen in ihrer Zeitfolge auf, unten die älteste.' : 'Die Monde kehren auf ihre Bahn zurück.'); }); s.setAttribute('aria-pressed', !!kb.spiraleZiel); }
  const kk = document.createElement('a'); kk.className = 'knopf'; kk.textContent = 'In den Karten'; kk.href = 'werkansichten.html#baum/' + adresse(k); kk.style.cssText = 'display:flex;align-items:center;text-decoration:none;height:36px;font-size:14px'; tun.append(kk);
  // Beziehungen
  if(bezug && k.art !== 'ort'){
    const alle = bezug.von(k), bel = alle.filter(e => e.belegt), ber = alle.filter(e => !e.belegt);
    if(bel.length || ber.length){ const h3 = document.createElement('h3'); h3.textContent = 'Beziehungen'; L.append(h3);
      const zeig = bel.slice(0, 6); for(const e of zeig){ const p = document.createElement('div'); p.className = 'bez'; const w = BELEGT[e.art] ? (e.aus ? BELEGT[e.art].wort : BELEGT[e.art].rueck) : e.art; p.append(w + ' '); const b = document.createElement('b'); b.textContent = e.andere.name; p.append(b); p.style.cursor = 'pointer'; p.onclick = () => waehle(e.andere); L.append(p); }
      if(bel.length > 6){ const p = document.createElement('div'); p.className = 'bez'; p.textContent = `und ${bel.length - 6} weitere belegte`; L.append(p); }
      if(ber.length){ const p = document.createElement('div'); p.className = 'bez'; p.textContent = `${ber.length} berechnete Nähen (${[...new Set(ber.map(e => BERECHNET[e.art] ? BERECHNET[e.art].wort : e.art))].join(', ')})${naeheAn ? '' : ', mit „Berechnete Nähe“ sichtbar'}`; L.append(p); }
    }
  }
  // Was darin kreist
  const kinder = (k.kinder || []).slice(); if(kinder.length){
    const h3 = document.createElement('h3'); h3.textContent = k.art === 'ort' || k.art === 'bereich' ? 'Planeten dieser Sonne' : k.art === 'app' ? 'Was um diesen Planeten kreist' : 'Monde'; L.append(h3);
    const li = document.createElement('div'); li.className = 'liste'; L.append(li);
    kinder.slice(0, 40).forEach(c => { const b = document.createElement('button'); const tb = c.bild || (c.bilder && c.bilder[0]); if(tb){ const im = new Image(); im.loading = 'lazy'; im.alt = ''; im.src = bildUrl(tb, 240); b.append(im); } else { const e = document.createElement('i'); e.className = 'leer'; b.append(e); } const s = document.createElement('span'); s.textContent = c.name; const z = document.createElement('small'); z.textContent = c.kinder ? c.fassungen + ' F.' : (c.von != null ? new Date(c.von).toLocaleDateString('de-DE', {month: 'short', year: '2-digit', timeZone: 'UTC'}) : ''); b.append(s, z); b.onclick = () => waehle(c); li.append(b); });
    if(kinder.length > 40){ const p = document.createElement('p'); p.textContent = `und ${kinder.length - 40} weitere, über die Suche erreichbar`; L.append(p); }
  }
}

/* ---------- Adresse: #galaxie/weg?q=… ---------- */
let suchText = '';
function ausAdresse(){ const roh = decodeURIComponent(location.hash.replace(/^#/, '')), [pt, fr = ''] = roh.split('?'), t = pt.split('/').filter(Boolean); if(t[0] === 'galaxie') t.shift(); return {pfad: t.join('/'), q: new URLSearchParams(fr).get('q') || ''}; }
const hashJetzt = () => '#galaxie' + (gewaehlt ? '/' + adresse(gewaehlt) : '') + (suchText ? '?q=' + encodeURIComponent(suchText) : '');
function inAdresse(neu){ const h = hashJetzt(); if(location.hash === h) return; if(neu) history.pushState({g: 1}, '', h); else history.replaceState({g: 1}, '', h); $('#knKarten').href = 'werkansichten.html#baum' + (gewaehlt ? '/' + adresse(gewaehlt) : '') + (suchText ? '?q=' + encodeURIComponent(suchText) : ''); }
const nachPfad = p => !p ? null : I.alle.find(k => k.art !== 'wurzel' && adresse(k) === p) || I.alle.find(k => k.art !== 'wurzel' && bisherigeAdresse(k) === p) || null;
addEventListener('popstate', () => { if(!I) return; const a = ausAdresse(); waehle(nachPfad(a.pfad), false); });

/* ---------- Suche über alles ---------- */
const sucheEl = $('#suche'), trefferEl = $('#treffer'); let treffer = [], trefferAn = 0;
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function suche(q, zeigen = true){
  suchText = q.trim(); inAdresse(false); if(!I || !suchText){ trefferEl.hidden = true; return; }
  const w = norm(suchText).split(/\s+/).filter(Boolean);
  treffer = I.alle.filter(k => k.art !== 'wurzel' && w.every(x => norm(k.name).includes(x))).sort((a, b) => (a.kinder ? 0 : 1) - (b.kinder ? 0 : 1) || a.name.length - b.name.length).slice(0, 30);
  trefferEl.replaceChildren(); trefferAn = 0;
  if(!treffer.length){ const p = document.createElement('button'); p.disabled = true; p.textContent = 'Nichts gefunden'; trefferEl.append(p); }
  treffer.forEach((k, i) => { const b = document.createElement('button'); b.setAttribute('role', 'option'); if(!i) b.classList.add('an'); b.textContent = k.name; const s = document.createElement('small'); s.textContent = (ARTNAME[k.art] || '').split(' · ')[0] + ' · ' + wegZu(k).slice(1, -1).map(q => q.name).join(' › '); b.append(s); b.onclick = () => { trefferEl.hidden = true; waehle(k); }; trefferEl.append(b); });
  trefferEl.hidden = !zeigen;
}
sucheEl.addEventListener('input', () => suche(sucheEl.value));
sucheEl.addEventListener('focus', () => { if(sucheEl.value) suche(sucheEl.value); });
sucheEl.addEventListener('keydown', e => {
  const knoepfe = [...trefferEl.querySelectorAll('button[role=option]')];
  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); e.stopPropagation(); trefferAn = (trefferAn + (e.key === 'ArrowDown' ? 1 : -1) + knoepfe.length) % Math.max(1, knoepfe.length); knoepfe.forEach((b, i) => b.classList.toggle('an', i === trefferAn)); }
  else if(e.key === 'Enter' && treffer[trefferAn]){ trefferEl.hidden = true; waehle(treffer[trefferAn]); sucheEl.blur(); }
  else if(e.key === 'Escape'){ trefferEl.hidden = true; sucheEl.blur(); }
  e.stopPropagation();
});
addEventListener('keydown', e => {
  if(document.activeElement === sucheEl) return;
  if(e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))){ e.preventDefault(); sucheEl.focus(); }
  else if(e.key === 'Escape'){ beendeEinflug(); if(gewaehlt) waehle(gewaehlt.eltern && gewaehlt.eltern.art !== 'wurzel' ? gewaehlt.eltern : null); }
  else if(e.key === 'Enter' && gewaehlt && document.activeElement === canvas){ location.href = 'werkansichten.html#zelle/' + adresse(gewaehlt); }
});
$('#marke').onclick = () => waehle(null);
addEventListener('pointerdown', e => { if(!trefferEl.contains(e.target) && e.target !== sucheEl) trefferEl.hidden = true; });

/* ---------- Tippen und Klicken: der nächste Körper unter dem Finger ---------- */
let unten = null, letzterTipp = {t: 0, k: null};
canvas.addEventListener('pointerdown', e => { unten = {x: e.clientX, y: e.clientY, t: performance.now()}; beendeEinflug(); if(fahrt && fahrt.dauer < 5 && !einflug) fahrt = null; });
canvas.addEventListener('pointerup', e => {
  if(!unten || !I) return; const d = Math.hypot(e.clientX - unten.x, e.clientY - unten.y), dt = performance.now() - unten.t; unten = null; if(d > 7 || dt > 500) return;
  const k = treffe(e.clientX, e.clientY, e.pointerType === 'touch' ? 26 : 16), jetzt = performance.now();
  if(k && letzterTipp.k === k && jetzt - letzterTipp.t < 420 && (k.art === 'fassung' || k.art === 'werk' || k.art === 'app')){ location.href = 'werkansichten.html#zelle/' + adresse(k); return; }
  letzterTipp = {t: jetzt, k};
  if(k) waehle(k); else if(gewaehlt && dt < 300){ /* Tipp ins Leere: Wahl bleibt, damit man frei schauen kann */ }
});
function treffe(x, y, rad){
  let best = null, bd = Infinity; const w = innerWidth, h = innerHeight, cam = camera.position;
  const pruefe = (b, k, r) => { V3.copy(b.welt).project(camera); if(V3.z > 1) return; const sx = (V3.x * 0.5 + 0.5) * w, sy = (-V3.y * 0.5 + 0.5) * h, pr = r / (cam.distanceTo(b.welt) * U.pxWelt.value), d = Math.hypot(sx - x, sy - y); if(d < Math.max(rad, pr * 1.1) && d - pr < bd){ bd = d - pr; best = k; } };
  for(const q of MONDE) pruefe(q, q.k, q.r);
  for(const b of planetenListe) pruefe(b, b.k, b.r);
  for(const s of SONNEN) pruefe(s, s.k, s.r * 1.6);
  if(KOERPER[0] && KOERPER[0].typ === 'kern') pruefe(KOERPER[0], KOERPER[0].k, 26);
  return best;
}

/* ---------- Lauf ---------- */
const versatz = {x: 0, y: 0}; let letzte = performance.now(), zeit = 0, fpsZ = 0, fpsT = 0, ersterFrame = true;
function lauf(){
  const jetzt = performance.now(), dt = Math.min(0.05, (jetzt - letzte) / 1000); letzte = jetzt; zeit += ruhig ? 0 : dt;
  galDreh = zeit * DREH; galaxie.rotation.y = galDreh; U.zeit.value = zeit;
  const alt = gewKoerper ? gewKoerper.welt.clone() : null;
  if(bereit){ lagen(zeit); }
  const fliegt = fahrtSchritt(dt);
  if(!fliegt && gewKoerper && alt){ V3.copy(gewKoerper.welt).sub(alt); camera.position.add(V3); steuer.target.add(V3); }   // mitfliegen
  steuer.enabled = !fliegt; steuer.update();
  // Auge: nah am Kern wird die Belichtung zurückgenommen
  const kd = camera.position.length(), td = camera.position.distanceTo(steuer.target);
  U.kernGlanz.value = THREE.MathUtils.clamp(Math.pow(kd / 1300, 1.4), 0.06, 1); U.scheibe.value = THREE.MathUtils.clamp(td / 600, 0.25, 1); U.grund.value = THREE.MathUtils.clamp(0.3 + td / 700, 0.3, 1);
  camera.near = THREE.MathUtils.clamp(td * 0.004, 0.01, 4); camera.far = 60000;
  // Das Blatt verdeckt nichts: die Mitte des Bilds rückt in den freien Teil
  const offen = !blattEl.hidden, schmal = innerWidth <= 760, zx = offen && !schmal ? (blattEl.offsetWidth + 16) / 2 : 0, zy = offen && schmal ? blattEl.offsetHeight / 2 : 0;
  versatz.x += (zx - versatz.x) * 0.08; versatz.y += (zy - versatz.y) * 0.08;
  if(Math.abs(versatz.x) + Math.abs(versatz.y) > 0.5) camera.setViewOffset(innerWidth, innerHeight, versatz.x, versatz.y, innerWidth, innerHeight); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  if(bereit){ schreibeInstanzen(zeit); faedenSchritt(zeit); namen(); }
  if(canvas.clientWidth && canvas.clientHeight) pipe.render();
  if(ersterFrame){ ersterFrame = false; messung.erstesBild = performance.now() - T0; }
  fpsZ++; if(jetzt - fpsT > 1000){ messung.fps = Math.round(fpsZ * 1000 / (jetzt - fpsT)); fpsZ = 0; fpsT = jetzt; }
}
renderer.setAnimationLoop(lauf);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); setzePx(); });

/* ---------- Start mit dem Bestand ---------- */
try{
  const hole = async u => { const r = await fetch(u); if(!r.ok) throw new Error(u + ' ' + r.status); return r.json(); };
  const bilderDa = hole('/lichtwerk/bilder').catch(() => ({}));
  const [g, gespraeche] = await Promise.all([holeBestand('/api/graph'), holeBestand('/lichtwerk/gespraeche').catch(() => [])]);
  const bilder = await bilderDa;
  I = baueInhalt(g, bilder || {}, gespraeche || []); bezug = baueBezuege(g, I);
  baueBestand(I); baueGestalt(); lagen(zeit); bereit = true; messung.bestand = performance.now() - T0;
  const a = ausAdresse(); if(a.q){ sucheEl.value = a.q; suche(a.q, false); }
  const k0 = nachPfad(a.pfad);
  if(k0){ einflug = false; fahrtKnopf.hidden = true; fahrt = null; waehle(k0, false); history.replaceState({g: 1}, '', hashJetzt()); }
  else { if(a.pfad) sage('Die Adresse führt zu keinem Werk mehr. Hier ist die ganze Galaxie.'); history.replaceState({g: 1}, '', hashJetzt()); }
  const f = I.alle.filter(k => k.art === 'fassung').length;
  sage(`${SONNEN.filter(s => !s.host).length} Sonnen, ${planetenListe.length} Planeten, ${f.toLocaleString('de-DE')} Monde. ${satz0}`, 9000);
}catch(e){ console.error(e); sage('Der Bestand ist gerade nicht erreichbar. Die Galaxie bleibt ohne Werke. Läuft der Lichtwerk-Dienst?', 0); }

/* Für Prüfungen im Browser, ohne Kennungen in der Oberfläche */
window.__galaxie = {messung, get gewaehlt(){ return gewaehlt && gewaehlt.name; }, fliege: name => { const k = I && I.alle.find(x => x.name === name); if(k) waehle(k); return !!k; }, uebersicht: () => waehle(null), zahlen: () => ({sonnen: SONNEN.length, planeten: planetenListe.length, monde: MONDE.length, sterne: grund.sterne.sp.count, webgl: forceWebGL || !renderer.backend.isWebGPUBackend}), ueberspringe: () => fahrtKnopf.onclick()};
