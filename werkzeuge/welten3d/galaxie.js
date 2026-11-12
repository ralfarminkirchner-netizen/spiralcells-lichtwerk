/* Lichtgrund · Welten in 3D · Galaxie (Fable, 12.11.2026)
   Der Grund: eine Spiralgalaxie aus GPU-Sternen (WebGPU-Compute über TSL, WebGL 2 als Rückfall).
   Die Sterne sind Grund und tragen nichts. Kern = Zentrale, Sonnen auf den Armen = die sieben Oberdächer.
   Planeten (Apps, Werke) und Monde (Fassungen) kommen aus dem Bestand; ohne Bestand bleibt das ehrlich sichtbar. */
import * as THREE from 'three';
import {Fn, instancedArray, instanceIndex, hash, uniform, float, vec2, vec3, vec4, uv, sin, cos, log, exp, pow, mix, max, min, smoothstep, length, pass, screenUV,
  cameraPosition, modelWorldMatrix, positionLocal, mx_noise_float, If} from 'three/tsl';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';
import {dof} from 'three/addons/tsl/display/DepthOfFieldNode.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export const R = 100;
const TAU = Math.PI * 2;
export const ARM = r => Math.log(1 + r / (R * 0.11)) * 2.25;          // dieselbe Armform wie app/js/mondbahn.js
const MUSTER = TAU / 2400;                                            // Drehung des Armmusters, Bogenmaß je Sekunde (mondbahn: DREHUNG)

/* Was ohne Bestand feststeht: Ralfs bestätigte Ordnung (inhalt.js FOLGE). */
export const ZENTRALE = 'Zentrale';
export const OBERDAECHER = ['MiND-BODY-SOUL', 'GAMES', 'MUSiC', 'EDUCATiON', 'WRiTING', 'ARTS', 'PERSONAL'];
/* Sternfarben der Sonnen: gestalterisch, sie behaupten nichts (Farbe nach Stimme gilt für Fassungen). */
const SONNENFARBE = ['#ffd9a0', '#ff9a6a', '#9fc4ff', '#fff1c8', '#ffb37a', '#ff8fb0', '#b9d2ff'];

export async function baueGalaxie({canvas, ruhig = false, klein = false, erzwingeWebGL = false, sterne = 0}){
  const renderer = new THREE.WebGPURenderer({canvas, antialias: false, forceWebGL: erzwingeWebGL, powerPreference: 'high-performance'});
  await renderer.init();
  const webgpu = !!renderer.backend.isWebGPUBackend;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#010104');
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 6000);
  const scheibe = new THREE.Group(); scene.add(scheibe);              // dreht mit dem Armmuster

  const uTempo = uniform(ruhig ? 0 : 1), uDt = uniform(0), uPix = uniform(0.0011);

  /* ---------- Sterne: Compute ---------- */
  const N = sterne ? sterne : !webgpu ? (klein ? 90000 : 200000) : klein ? 180000 : 420000;
  const daten = instancedArray(N, 'vec4');                            // Bahnradius, Phase, Höhe, Art+Zufall
  const orte = instancedArray(N, 'vec3');
  const H = k => hash(instanceIndex.add(k * 1000003));
  const armwinkel = r => log(r.div(R * 0.11).add(1)).mul(2.25);
  const ortAus = d => {
    const r = d.x, u = d.y, z = d.w.fract();
    const c = smoothstep(R * 0.08, R * 0.3, r).mul(0.9);              // im Kern keine Arme
    const delta = u.sub(sin(u.mul(2)).mul(c).mul(0.5));               // Dichtewelle: Sterne verweilen im Arm
    const streu = z.sub(0.5).mul(H(11).sub(0.5)).mul(0.7);
    const th = armwinkel(r).add(delta).add(streu);
    return vec3(cos(th).mul(r), d.z, sin(th).mul(r));
  };
  const anfang = Fn(() => {
    const d = daten.element(instanceIndex), kern = H(1).lessThan(0.13);
    const r = float(0).toVar(), y = float(0).toVar();
    If(kern, () => {
      const rr = pow(H(2), 0.75).mul(R * 0.15), ct = H(3).mul(2).sub(1);
      r.assign(rr.mul(ct.mul(ct).oneMinus().sqrt())); y.assign(rr.mul(ct).mul(0.62));
    }).Else(() => {
      r.assign(log(H(2).mul(0.986).oneMinus()).mul(-R * 0.36).add(R * 0.03));
      y.assign(H(3).add(H(4)).add(H(5)).sub(1.5).mul(R * 0.016).mul(exp(r.mul(-1 / (R * 0.9))).add(0.35)));
    });
    d.assign(vec4(r, H(6).mul(TAU), y, H(7).mul(0.999).add(kern.select(1, 0))));
    orte.element(instanceIndex).assign(ortAus(d));
  })().compute(N);
  const schritt = Fn(() => {
    const d = daten.element(instanceIndex);
    const w = float(R * 0.5).div(d.x.add(R * 0.08)).sub(0.62).mul(0.012);   // Umlauf gegen das Muster: innen schneller, außen langsamer
    d.y.assign(d.y.add(w.mul(uDt).mul(uTempo)).mod(TAU));
    orte.element(instanceIndex).assign(ortAus(d));
  })().compute(N);

  const weich = () => { const q = uv().sub(0.5).length().mul(2); return q.oneMinus().max(0).pow(2.4); };
  const fern = p => cameraPosition.distance(modelWorldMatrix.mul(vec4(p, 1)).xyz);

  { const m = new THREE.SpriteNodeMaterial({blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true});
    const p = orte.toAttribute(), d = daten.toAttribute(), z = d.w.fract(), kern = d.w.greaterThanEqual(1);
    const imArm = pow(cos(d.y.mul(2)).mul(0.5).add(0.5), 3).mul(smoothstep(R * 0.1, R * 0.3, d.x));
    const farbe = mix(mix(mix(vec3(1.0, 0.78, 0.52), vec3(0.55, 0.72, 1.0), imArm), vec3(1.0, 0.66, 0.36), kern.select(0.85, 0)), vec3(1.0, 0.45, 0.3), smoothstep(0.93, 1, hash(instanceIndex.add(99))).mul(0.8));     // einzelne rote Riesen
    const hell = pow(z, 7).mul(9).add(0.22).mul(imArm.mul(2.4).add(0.4)).mul(smoothstep(R * 1.5, R * 0.5, d.x).add(0.08));
    const gross = pow(z, 5).mul(2.6).add(0.5).mul(R * 0.0021), sicht = max(gross, fern(p).mul(uPix));
    m.positionNode = p; m.scaleNode = sicht;
    m.colorNode = farbe.mul(hell).mul(gross.div(sicht).pow(2).max(0.05)); m.opacityNode = weich();
    const s = new THREE.Sprite(m); s.count = N; s.frustumCulled = false; s.renderOrder = 1; scheibe.add(s); }

  /* ---------- Wolken: Armschein, Staubbahnen, Sternentstehung ---------- */
  const Z = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  function wolken(zahl, lage, {mischen, farbe, staerke, ordnung, koernung = 3}){
    const a = new Float32Array(zahl * 4); for(let i = 0; i < zahl; i++) a.set(lage(i), i * 4);
    const buf = instancedArray(a, 'vec4'), q = buf.toAttribute(), z = hash(instanceIndex.add(7));
    const m = new THREE.SpriteNodeMaterial({blending: mischen, depthWrite: false, depthTest: false, transparent: true});
    const n = mx_noise_float(vec3(uv().mul(koernung), z.mul(40))).mul(0.5).add(0.5), n2 = mx_noise_float(vec3(uv().mul(koernung * 2.7), z.mul(91))).mul(0.5).add(0.5);
    m.positionNode = q.xyz; m.scaleNode = q.w; m.rotationNode = z.mul(TAU);
    m.colorNode = farbe(z, q); m.opacityNode = weich().mul(n.mul(n2).mul(2.2).min(1)).mul(staerke(z, q));
    const s = new THREE.Sprite(m); s.count = zahl; s.frustumCulled = false; s.renderOrder = ordnung; scheibe.add(s); return s;
  }
  const armOrt = (r, arm, versatz, y = 0) => { const t = ARM(r) + arm * Math.PI + versatz; return [Math.cos(t) * r, y, Math.sin(t) * r]; };
  const daempf = q => smoothstep(R * 1.35, R * 0.7, length(q.xz));
  // weicher Schein der Arme
  wolken(klein ? 900 : 2200, i => { const r = R * (0.1 + 1.2 * Math.sqrt(Z(i, 1))); return [...armOrt(r, i % 2, (Z(i, 2) - 0.5) * (i % 5 ? 0.6 : 3.1), (Z(i, 3) - 0.5) * 1.2), R * (0.07 + 0.13 * Z(i, 4))]; },
    {mischen: THREE.AdditiveBlending, ordnung: 0, farbe: (z, q) => mix(vec3(0.95, 0.6, 0.32), vec3(0.2, 0.34, 0.85), smoothstep(R * 0.16, R * 0.4, length(q.xz))), staerke: (z, q) => daempf(q).mul(0.06)});
  // Staubbahnen an der Innenkante der Arme: dunkel, schluckt Licht
  wolken(klein ? 2600 : 6500, i => { const r = R * (0.13 + 1.0 * Math.pow(Z(i, 1), 0.8)), faser = Z(i, 5) < 0.25 ? (Z(i, 6) - 0.2) * 0.9 : 0; return [...armOrt(r, i % 2, -0.2 + (Z(i, 2) - 0.5) * 0.14 + faser, (Z(i, 3) - 0.5) * 0.5), R * (0.018 + 0.05 * Z(i, 4) * Z(i, 4))]; },
    {mischen: THREE.NormalBlending, ordnung: 2, koernung: 2.2, farbe: () => vec3(0.016, 0.008, 0.005), staerke: (z, q) => daempf(q).mul(z.mul(0.4).add(0.45))});
  // Sternentstehungsgebiete: rosa Wasserstoff, etwas Türkis, in Haufen
  const haufen = klein ? 45 : 90, jeHaufen = 6;
  wolken(haufen * jeHaufen, i => { const h = Math.floor(i / jeHaufen), r = R * (0.2 + 0.95 * Math.sqrt(Z(h, 11))), g = R * (0.005 + 0.015 * Z(h, 14) * Z(h, 15)); const [x, y, zz] = armOrt(r, h % 2, 0.02 + (Z(h, 12) - 0.5) * 0.16);
      return [x + (Z(i, 21) - 0.5) * g * 2.4, y + (Z(i, 22) - 0.5) * g, zz + (Z(i, 23) - 0.5) * g * 2.4, g * (0.6 + 1.3 * Z(i, 24))]; },
    {mischen: THREE.AdditiveBlending, ordnung: 3, koernung: 2.5, farbe: z => mix(vec3(1.0, 0.2, 0.3), vec3(0.3, 0.75, 0.85), smoothstep(0.9, 0.96, z)).mul(1.5), staerke: (z, q) => daempf(q).mul(z.mul(0.4).add(0.25))});
  // junge blaue Sternhaufen in denselben Gebieten
  wolken(haufen * 5, i => { const h = Math.floor(i / 5), r = R * (0.2 + 0.95 * Math.sqrt(Z(h, 11))), g = R * (0.005 + 0.015 * Z(h, 14) * Z(h, 15)); const [x, y, zz] = armOrt(r, h % 2, 0.02 + (Z(h, 12) - 0.5) * 0.16);
      return [x + (Z(i, 31) - 0.5) * g * 2, y + (Z(i, 32) - 0.5) * g, zz + (Z(i, 33) - 0.5) * g * 2, R * 0.0032 * (0.6 + Z(i, 34))]; },
    {mischen: THREE.AdditiveBlending, ordnung: 4, koernung: 0.01, farbe: () => vec3(0.6, 0.78, 1.0).mul(6), staerke: () => float(1)});

  /* ---------- Kern: die Zentrale ---------- */
  const kernLicht = (gr, f, st) => { const m = new THREE.SpriteNodeMaterial({blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true});
    const q = uv().sub(0.5).length().mul(2); m.colorNode = vec3(...f).mul(st); m.opacityNode = exp(q.mul(q).mul(-9)).mul(q.oneMinus().max(0));
    const s = new THREE.Sprite(m); s.scale.setScalar(gr); s.renderOrder = 5; scheibe.add(s); return s; };
  kernLicht(R * 0.62, [1.0, 0.7, 0.4], 0.75); kernLicht(R * 0.2, [1.0, 0.86, 0.66], 2.6); kernLicht(R * 0.055, [1.0, 0.96, 0.9], 9);

  /* ---------- Ferner Himmel ---------- */
  { const zahl = klein ? 2500 : 6000, a = new Float32Array(zahl * 4);
    for(let i = 0; i < zahl; i++){ const c = Z(i, 41) * 2 - 1, s = Math.sqrt(1 - c * c), w = Z(i, 42) * TAU; a.set([Math.cos(w) * s * 2400, c * 2400, Math.sin(w) * s * 2400, 2.2 + 9 * Math.pow(Z(i, 43), 6)], i * 4); }
    const q = instancedArray(a, 'vec4').toAttribute(), z = hash(instanceIndex.add(3)), m = new THREE.SpriteNodeMaterial({blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true});
    m.positionNode = q.xyz; m.scaleNode = q.w; m.colorNode = mix(vec3(1, 0.85, 0.7), vec3(0.7, 0.82, 1), z).mul(z.mul(0.5).add(0.25)); m.opacityNode = weich();
    const s = new THREE.Sprite(m); s.count = zahl; s.frustumCulled = false; s.renderOrder = -1; scene.add(s); }

  /* ---------- Sonnen: die sieben Oberdächer auf den Armen ---------- */
  const uZeit = uniform(0), ziele = [{name: ZENTRALE, art: 'Zentrale', ort: new THREE.Vector3(0, 0, 0), weite: R * 0.2, ding: null}];
  const kugel = new THREE.SphereGeometry(1, 48, 24);
  OBERDAECHER.forEach((name, j) => {
    const r = R * (0.34 + 0.085 * j), [x, , zz] = armOrt(r, j % 2, 0), f = new THREE.Color(SONNENFARBE[j]), fv = vec3(f.r, f.g, f.b), gr = 0.9;
    const g = new THREE.Group(); g.position.set(x, 0, zz);
    const m = new THREE.MeshBasicNodeMaterial(), koerner = mx_noise_float(positionLocal.mul(3.2).add(vec3(0, uZeit.mul(0.11), j * 7))).mul(0.5).add(0.5), fein = mx_noise_float(positionLocal.mul(9).add(vec3(uZeit.mul(0.2), 0, j))).mul(0.5).add(0.5);
    m.colorNode = fv.mul(koerner.mul(1.5).add(fein.mul(0.8)).add(0.25)).mul(1.15);
    const k = new THREE.Mesh(kugel, m); k.scale.setScalar(gr); k.userData.ziel = j + 1; g.add(k);
    const c = new THREE.SpriteNodeMaterial({blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}), q = uv().sub(0.5).length().mul(2);
    c.colorNode = fv.mul(2.2); c.opacityNode = exp(q.mul(-7)).mul(q.oneMinus().max(0)).mul(sin(uZeit.mul(0.6).add(j)).mul(0.06).add(0.94));
    const h = new THREE.Sprite(c); h.scale.setScalar(gr * 16); h.renderOrder = 6; g.add(h);
    scheibe.add(g); ziele.push({name, art: 'Oberdach', ort: g.position, weite: 7, ding: k});
  });

  /* ---------- Nachbearbeitung: Bloom, Tiefenschärfe beim Fokus, Vignette, Korn ---------- */
  const pipeline = new THREE.RenderPipeline(renderer), bild = pass(scene, camera), farbe = bild.getTextureNode('output');
  const uFokus = uniform(20), uBokeh = uniform(0), uVig = uniform(1);
  const fertig = roh => { const b = bloom(roh, 0.55, 0.55, 0.62), q = screenUV.sub(0.5), v = smoothstep(0.95, 0.25, q.length()).mul(uVig).add(float(1).sub(uVig));
    const korn = sin(screenUV.x.mul(12.9898).add(screenUV.y.mul(78.233)).add(uZeit.fract())).mul(43758.5453).fract().sub(0.5).mul(0.014); return roh.add(b).mul(vec4(vec3(v), 1)).add(vec4(vec3(korn), 0)); };
  const ohneDof = fertig(farbe); let mitDof = null, dofAn = false;
  pipeline.outputNode = ohneDof;
  function tiefenschaerfe(an, abstand){ if(klein && !webgpu) an = false; if(an){ uFokus.value = abstand; if(!mitDof) mitDof = fertig(dof(farbe, bild.getViewZNode(), uFokus, uFokus.mul(1.6), uBokeh)); }
    if(an !== dofAn){ dofAn = an; pipeline.outputNode = an ? mitDof : ohneDof; pipeline.needsUpdate = true; } }

  /* ---------- Kamera ---------- */
  const steuer = new OrbitControls(camera, canvas); steuer.enableDamping = true; steuer.dampingFactor = 0.06; steuer.minDistance = 4; steuer.maxDistance = R * 5; steuer.zoomSpeed = 0.8; steuer.rotateSpeed = 0.6; steuer.enabled = false;
  const weltOrt = (z, o = new THREE.Vector3()) => o.copy(z.ort).applyMatrix4(scheibe.matrixWorld);
  const sanft = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let fahrt = null, flug = null, gewaehlt = -1, hoch = 1; const letzter = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  function gesamtblick(){ if(hoch > 1.2) return {p: new THREE.Vector3(R * 0.35, R * 2.25, R * 1.15), z: new THREE.Vector3(0, 0, R * 0.12)};   // Hochformat: steiler von oben, die Arme laufen über den Rand
    const d = R * (hoch > 0.8 ? 2.6 : 1.75); return {p: new THREE.Vector3(d * 0.16, d * 0.62, d * 0.76), z: new THREE.Vector3(0, -R * 0.04, 0)}; }
  function starteFahrt(){                                              // geführter Einstieg: von der Kante über den Arm zum Gesamtbild
    const g = gesamtblick(), s = weltOrt(ziele[4]), punkte = [
      {p: new THREE.Vector3(R * 2.5, R * 0.07, R * 0.9), z: new THREE.Vector3(0, 0, 0)},
      {p: new THREE.Vector3(R * 1.25, R * 0.2, R * 0.75), z: new THREE.Vector3(R * 0.2, 0, 0)},
      {p: s.clone().add(new THREE.Vector3(R * 0.16, R * 0.07, R * 0.2)), z: s.clone()},
      {p: new THREE.Vector3(-R * 0.3, R * 0.32, R * 0.42), z: new THREE.Vector3(0, 0, 0)},
      {p: new THREE.Vector3(-R * 0.55, R * 0.95, R * 0.75), z: new THREE.Vector3(0, 0, 0)}, g];
    fahrt = {t: 0, dauer: 26, p: new THREE.CatmullRomCurve3(punkte.map(q => q.p), false, 'centripetal'), z: new THREE.CatmullRomCurve3(punkte.map(q => q.z), false, 'centripetal')}; steuer.enabled = false; gewaehlt = -1; tiefenschaerfe(false);
  }
  function endeFahrt(sofort){ if(!fahrt) return; fahrt = null; if(sofort){ const g = gesamtblick(); fliege(g.p, g.z, 1.4); } else { steuer.target.set(0, -R * 0.04, 0); steuer.enabled = true; } melde('fahrt', false); }
  function fliege(p, z, dauer = 2.8, nach){ flug = {t: 0, dauer: ruhig ? 0.001 : dauer, p0: camera.position.clone(), z0: steuer.target.clone(), p1: p.clone(), z1: z.clone(), nach}; steuer.enabled = false; }
  function waehle(i, {flieg = true} = {}){
    if(fahrt){ fahrt = null; melde('fahrt', false); }
    gewaehlt = i; if(i < 0){ const g = gesamtblick(); tiefenschaerfe(false); uBokeh.value = 0; if(flieg) fliege(g.p, g.z); melde('wahl', null); return; }
    const z = ziele[i], o = weltOrt(z), weg = v1.copy(camera.position).sub(o); weg.y = 0; if(weg.lengthSq() < 1e-6) weg.set(0, 0, 1); weg.normalize();
    const a = z.weite * (hoch > 1.2 ? 4.2 : 2.6), p = o.clone().addScaledVector(weg, a).add(new THREE.Vector3(0, a * 0.34, 0)); letzter.copy(o);
    if(flieg) fliege(p, o, 3.2, () => { if(i > 0){ tiefenschaerfe(true, camera.position.distanceTo(o)); } }); melde('wahl', z);
  }
  const hoerer = {}; const melde = (was, wert) => (hoerer[was] || []).forEach(f => f(wert));

  function groesse(b, h, dpr){ renderer.setPixelRatio(dpr); renderer.setSize(b, h, false); camera.aspect = b / h; hoch = h / b; camera.fov = hoch > 1.2 ? 62 : 50; camera.updateProjectionMatrix(); uPix.value = Math.tan(camera.fov * Math.PI / 360) * 2 / h * (klein ? 1.5 : 1.25); if(!fahrt && !flug && gewaehlt < 0 && !steuer.enabled){ const g = gesamtblick(); camera.position.copy(g.p); steuer.target.copy(g.z); steuer.enabled = true; } }

  await renderer.computeAsync(anfang);
  let zeit = 0, vorher = performance.now(), bilder = 0, fpsSeit = vorher, fps = 0;
  function bild_(jetzt){
    const dt = Math.min(0.05, (jetzt - vorher) / 1000); vorher = jetzt; zeit += dt; uZeit.value = zeit; uDt.value = dt;
    if(!ruhig) scheibe.rotation.y = -MUSTER * zeit * 6; scheibe.updateMatrixWorld();
    if(fahrt){ fahrt.t += dt / fahrt.dauer; const t = sanft(Math.min(1, fahrt.t)); fahrt.p.getPoint(t, camera.position); fahrt.z.getPoint(t, steuer.target); camera.lookAt(steuer.target); if(fahrt.t >= 1) endeFahrt(false); }
    else if(flug){ flug.t += dt / flug.dauer; const t = sanft(Math.min(1, flug.t)); camera.position.lerpVectors(flug.p0, flug.p1, t); camera.position.y += Math.sin(t * Math.PI) * flug.p0.distanceTo(flug.p1) * 0.08; steuer.target.lerpVectors(flug.z0, flug.z1, t); camera.lookAt(steuer.target);
      if(flug.t >= 1){ const n = flug.nach; flug = null; steuer.enabled = true; n && n(); } }
    else { if(gewaehlt > 0){ const o = weltOrt(ziele[gewaehlt], v2), d = v1.copy(o).sub(letzter); camera.position.add(d); steuer.target.add(d); letzter.copy(o); if(dofAn){ uFokus.value = camera.position.distanceTo(o); uBokeh.value += (2.2 - uBokeh.value) * Math.min(1, dt * 2); } }
      steuer.update(); }
    renderer.compute(schritt); pipeline.render();
    bilder++; if(jetzt - fpsSeit >= 1000){ fps = bilder * 1000 / (jetzt - fpsSeit); bilder = 0; fpsSeit = jetzt; }
    melde('bild', zeit);
  }
  renderer.setAnimationLoop(bild_);

  const strahl = new THREE.Raycaster();
  return {webgpu, sterne: N, ziele, camera, weltOrt, starteFahrt, endeFahrt, waehle, groesse, get fps(){ return fps; }, get gewaehlt(){ return gewaehlt; }, get inFahrt(){ return !!fahrt; },
    auf(was, f){ (hoerer[was] = hoerer[was] || []).push(f); },
    treffer(x, y){ strahl.setFromCamera(new THREE.Vector2(x, y), camera); strahl.params.Mesh = {}; let best = -1, nah = 0.035; ziele.forEach((z, i) => { const o = weltOrt(z, v2).project(camera); if(o.z > 1) return; const d = Math.hypot(o.x - x, (o.y - y) / camera.aspect); if(d < nah){ nah = d; best = i; } }); return best; }};
}
