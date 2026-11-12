/* =====================================================================
   BAU — der Baukasten des Dorfs. Sammelt Flächen je Stoff in großen Netzen (ein Netz je Stoff für das ganze Dorf).
   Jede Fläche trägt Maße in Metern als Texturkoordinaten, eine Tönung und die Höhe über dem Hausfuß (für Feuchte am Sockel).
   Reine Geometrie, kein Inhalt: was ein Fenster bedeutet, entscheidet haeuser.js.
   ===================================================================== */
import * as THREE from 'three/webgpu';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const _a = V(), _b = V(), _c = V(), _n = V();

export class Sammler {
  constructor(){ this.netze = new Map(); this.M = new THREE.Matrix4(); this.fuss = 0; this.scheiben = {p: [], n: [], u: [], b: [], k: [], i: []}; }
  /* alles in fn wird mit m (zusätzlich) verschoben und gedreht */
  mit(m, fn){ const alt = this.M.clone(); this.M.multiply(m); try{ return fn(); } finally { this.M.copy(alt); } }
  netz(stoff){ let n = this.netze.get(stoff); if(!n){ n = {p: [], n: [], u: [], c: [], i: []}; this.netze.set(stoff, n); } return n; }
  /* Punkt in die Welt */
  welt(p){ return _a.set(p[0], p[1], p[2]).applyMatrix4(this.M).clone(); }

  /* Dreieck oder Viereck, gegen den Uhrzeigersinn von außen gesehen. uv in Metern */
  flaeche(stoff, pkt, uvs, farbe = WEISS){
    const N = this.netz(stoff), i0 = N.p.length / 3, w = pkt.map(p => _a.set(p[0], p[1], p[2]).applyMatrix4(this.M).clone());
    _b.subVectors(w[1], w[0]); _c.subVectors(w[w.length - 1], w[0]); _n.crossVectors(_b, _c).normalize();
    for(let k = 0; k < w.length; k++){ N.p.push(w[k].x, w[k].y, w[k].z); N.n.push(_n.x, _n.y, _n.z); N.u.push(uvs[k][0], uvs[k][1]); N.c.push(farbe[0], farbe[1], farbe[2], Math.max(0, w[k].y - this.fuss)); }
    for(let k = 1; k < w.length - 1; k++) N.i.push(i0, i0 + k, i0 + k + 1);
  }
  quad(stoff, a, b, c, d, farbe, uvVersatz = 0){
    const lu = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), lv = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]), o = uvVersatz;
    this.flaeche(stoff, [a, b, c, d], [[o, o], [o + lu, o], [o + lu, o + lv], [o, o + lv]], farbe);
  }
  tri(stoff, a, b, c, farbe){ const lu = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), lv = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]); this.flaeche(stoff, [a, b, c], [[0, 0], [lu, 0], [lu / 2, lv]], farbe); }

  /* Achsparalleler Kasten im aktuellen Rahmen. seiten: welche Flächen (x X y Y z Z = links rechts unten oben hinten vorn) */
  kasten(stoff, x0, y0, z0, x1, y1, z1, farbe, seiten = 'xXyYzZ'){
    if(x1 < x0) [x0, x1] = [x1, x0]; if(y1 < y0) [y0, y1] = [y1, y0]; if(z1 < z0) [z0, z1] = [z1, z0];
    const o = Math.abs(x0 * 0.37 + z0 * 0.61 + y0 * 0.13) % 1;
    if(seiten.includes('Z')) this.quad(stoff, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], farbe, o);
    if(seiten.includes('z')) this.quad(stoff, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], farbe, o);
    if(seiten.includes('X')) this.quad(stoff, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], farbe, o);
    if(seiten.includes('x')) this.quad(stoff, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], farbe, o);
    if(seiten.includes('Y')) this.quad(stoff, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], farbe, o);
    if(seiten.includes('y')) this.quad(stoff, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], farbe, o);
  }
  /* Balken zwischen zwei Punkten mit Querschnitt b × h (Sparren, Rinne, Stange, Geländer) */
  balken(stoff, p0, p1, b, h, farbe, oben = [0, 1, 0]){
    const d = V(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), L = d.length(); if(L < 1e-4) return; d.normalize();
    let up = V(oben[0], oben[1], oben[2]); if(Math.abs(up.dot(d)) > 0.98) up = V(1, 0, 0);
    const s = V().crossVectors(d, up).normalize(); up = V().crossVectors(s, d).normalize();
    const m = new THREE.Matrix4().makeBasis(s, up, d.clone().negate()).setPosition(p0[0], p0[1], p0[2]);
    this.mit(m, () => this.kasten(stoff, -b / 2, -h / 2, -L, b / 2, h / 2, 0, farbe));
  }
  /* Platte mit Dicke: Oberseite a b c d (gegen den Uhrzeigersinn von oben), Unterseite und Kanten aus zweitem Stoff */
  platte(stoffOben, stoffRand, a, b, c, d, dicke, farbe, farbeRand = farbe){
    _b.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); _c.set(d[0] - a[0], d[1] - a[1], d[2] - a[2]); const n = V().crossVectors(_b, _c).normalize().multiplyScalar(-dicke);
    const u = p => [p[0] + n.x, p[1] + n.y, p[2] + n.z], a2 = u(a), b2 = u(b), c2 = u(c), d2 = u(d);
    this.quad(stoffOben, a, b, c, d, farbe); this.quad(stoffRand, b2, a2, d2, c2, farbeRand);
    this.quad(stoffRand, a2, b2, b, a, farbeRand); this.quad(stoffRand, b2, c2, c, b, farbeRand); this.quad(stoffRand, c2, d2, d, c, farbeRand); this.quad(stoffRand, d2, a2, a, d, farbeRand);
  }
  /* Wandfläche mit Löchern. Rahmen: ursprung, u (nach rechts), v (nach oben) als Einheitsvektoren; kontur und loecher in Metern (2D) */
  wand(stoff, ursprung, u, v, kontur, loecher, farbe){
    const K = kontur.map(p => new THREE.Vector2(p[0], p[1])), H = loecher.map(l => l.map(p => new THREE.Vector2(p[0], p[1])));
    if(THREE.ShapeUtils.isClockWise(K)) K.reverse(); for(const h of H) if(!THREE.ShapeUtils.isClockWise(h)) h.reverse();
    const tris = THREE.ShapeUtils.triangulateShape(K, H), alle = K.concat(...H);
    const N = this.netz(stoff), i0 = N.p.length / 3, nn = _n.set(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]).transformDirection(this.M).clone();
    for(const p of alle){ const w = _a.set(ursprung[0] + u[0] * p.x + v[0] * p.y, ursprung[1] + u[1] * p.x + v[1] * p.y, ursprung[2] + u[2] * p.x + v[2] * p.y).applyMatrix4(this.M);
      N.p.push(w.x, w.y, w.z); N.n.push(nn.x, nn.y, nn.z); N.u.push(p.x, p.y); N.c.push(farbe[0], farbe[1], farbe[2], Math.max(0, w.y - this.fuss)); }
    for(const t of tris) N.i.push(i0 + t[0], i0 + t[1], i0 + t[2]);
  }
  /* Drehkörper um die y-Achse: profil = [[radius, höhe], …] von unten nach oben */
  drehkoerper(stoff, cx, cz, profil, seg, farbe, von = 0, bis = Math.PI * 2){
    for(let k = 0; k < profil.length - 1; k++){ const [r0, y0] = profil[k], [r1, y1] = profil[k + 1];
      for(let s = 0; s < seg; s++){ const a0 = von + (bis - von) * s / seg, a1 = von + (bis - von) * (s + 1) / seg, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const A = [cx + c0 * r0, y0, cz - s0 * r0], B = [cx + c1 * r0, y0, cz - s1 * r0], C = [cx + c1 * r1, y1, cz - s1 * r1], D = [cx + c0 * r1, y1, cz - s0 * r1];
        const um = (r0 + r1) / 2 * (a1 - a0), ho = Math.hypot(r1 - r0, y1 - y0), u0 = (r0 + r1) / 2 * a0;
        if(r1 < 1e-4) this.flaeche(stoff, [A, B, C], [[u0, y0], [u0 + um, y0], [u0 + um / 2, y0 + ho]], farbe);
        else if(r0 < 1e-4) this.flaeche(stoff, [A, C, D], [[u0, y0], [u0 + um, y0 + ho], [u0, y0 + ho]], farbe);
        else this.flaeche(stoff, [A, B, C, D], [[u0, y0], [u0 + um, y0], [u0 + um, y0 + ho], [u0, y0 + ho]], farbe); } }
  }
  /* Fensterscheibe: ein Viereck im eigenen Netz, trägt die Nummer der Fassung und ihr Feld im Bildatlas */
  scheibe(mitte, u, v, b, h, nummer, hatBild){
    const S = this.scheiben, i0 = S.p.length / 3, m = V(mitte[0], mitte[1], mitte[2]).applyMatrix4(this.M), U = V(u[0], u[1], u[2]).transformDirection(this.M), W = V(v[0], v[1], v[2]).transformDirection(this.M), n = V().crossVectors(U, W);
    for(const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ S.p.push(m.x + U.x * su * b / 2 + W.x * sv * h / 2, m.y + U.y * su * b / 2 + W.y * sv * h / 2, m.z + U.z * su * b / 2 + W.z * sv * h / 2); S.n.push(n.x, n.y, n.z); S.u.push((su + 1) / 2, (sv + 1) / 2); S.b.push(0, 0, 0, hatBild ? 1 : 0); S.k.push(nummer); }
    S.i.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    return {mitte: m, u: U, v: W, n, b, h, ecke: i0};
  }
  geometrie(stoff){ const N = this.netze.get(stoff); if(!N || !N.i.length) return null; const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(N.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(N.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(N.c, 4));
    g.setIndex(N.p.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(N.i, 1) : new THREE.Uint16BufferAttribute(N.i, 1)); g.computeBoundingSphere(); g.computeBoundingBox(); return g; }
  scheibenGeometrie(){ const S = this.scheiben, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(S.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(S.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(S.u, 2));
    g.setAttribute('feld', new THREE.Float32BufferAttribute(S.b, 4)); g.setAttribute('nummer', new THREE.Float32BufferAttribute(S.k, 1));
    g.setIndex(S.p.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(S.i, 1) : new THREE.Uint16BufferAttribute(S.i, 1)); g.computeBoundingSphere(); return g; }
}
export const WEISS = [1, 1, 1];
export const farbe = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const toene = (f, k) => [f[0] * k, f[1] * k, f[2] * k];
export const mische = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/* Rahmen einer Fassade: Ursprung p, nach rechts u (waagrecht), nach oben y, nach außen n */
export function fassadenMatrix(p, u){ const U = V(u[0], 0, u[2]).normalize(), Y = V(0, 1, 0), N = V().crossVectors(U, Y); return new THREE.Matrix4().makeBasis(U, Y, N).setPosition(p[0], p[1], p[2]); }
export function zufall(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const hashS = s => { let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
