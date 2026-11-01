/* =====================================================================
   GALAXIE — derselbe Bestand als Galaxie, gezeichnet in dieselbe Lichtmaschine.
   Was die Bahnen bedeuten, steht in mondbahn.js. Die Spuren rechnet die Grafikkarte aus derselben Formel:
   jeder Punkt einer Spur ist der Mond zu einer früheren Zeit, nichts wird gespeichert.
   ===================================================================== */
import {CAM, toScreen, hash} from './licht.js';
import {galaxie, sterne, nebel, DREHUNG, FLUG} from './mondbahn.js';

const PF = `#version 300 es
precision mediump float; in vec3 vC; out vec4 o; uniform float uEnc;
void main(){ vec2 p=gl_PointCoord*2.-1.; float r=dot(p,p); if(r>1.) discard; o=vec4(vC*(exp(-r*7.)+exp(-r*2.3)*.26)*uEnc,1.); }`;
const V_STERN = `#version 300 es
layout(location=0) in vec4 aP; layout(location=1) in vec4 aC; uniform mat4 uVP; uniform float uPx, uMin, uDreh, uVis, uFlug, uSpanne; out vec3 vC;
void main(){ float c=cos(uDreh), s=sin(uDreh); vec3 w=vec3(c*aP.x-s*aP.z,aP.y,s*aP.x+c*aP.z); float rand=1.;
  if(uSpanne>0.){ w.y=mod(aP.y+uFlug+uSpanne,2.*uSpanne)-uSpanne; rand=smoothstep(uSpanne,uSpanne*.7,abs(w.y)); }
  vec4 k=uVP*vec4(w,1.); gl_Position=k; float px=aP.w*uPx/max(k.w,1e-4), g=max(px,uMin); gl_PointSize=min(g,384.); vC=k.w>0.?aC.rgb*aC.a*min(px*px/(g*g)+.28,1.)*uVis*rand:vec3(0.); }`;
const V_MOND = `#version 300 es
layout(location=0) in vec4 a0; layout(location=1) in vec4 a1; layout(location=2) in vec4 a2; layout(location=3) in vec4 a3; layout(location=4) in float aW;
uniform mat4 uVP; uniform float uPx, uMin, uT, uE, uN, uVis, uDreh, uFlug; uniform sampler2D uDim; out vec3 vC;
void main(){ float k=float(gl_VertexID)/(uN-1.), tau=k*a2.x*uE, t=uT-tau, a=a1.x*t, c=cos(a), s=sin(a), an=a1.z+a1.w*t;
  float x=a0.x+c*a0.z-s*a0.w+cos(an)*a1.y, z=a0.y+s*a0.z+c*a0.w+sin(an)*a1.y, g=uDreh*t, cg=cos(g), sg=sin(g);
  vec3 w=vec3(cg*x-sg*z,sin(an+a1.z)*a1.y*a2.y+uFlug*tau,sg*x+cg*z), st=vec3(a0.x+a0.z+a2.w,0.,a0.y+a0.w+a3.w); w=mix(st,w,smoothstep(0.,.5,uE));
  vec4 q=uVP*vec4(w,1.); gl_Position=q; float kopf=step(k,0.), gr=a2.z*mix(.55,1.9,kopf), px=gr*uPx/max(q.w,1e-4), sz=max(px,uMin); gl_PointSize=min(sz,64.);
  vC=q.w>0.?a3.rgb*mix(pow(1.-k,1.15)*.5,2.2,kopf)*min(px*px/(sz*sz)+.5,1.)*uVis*texelFetch(uDim,ivec2(int(aW),0),0).r:vec3(0.); }`;
const V_PL = `#version 300 es
layout(location=0) in vec4 aP; layout(location=1) in vec3 aC; layout(location=2) in vec2 aL; uniform mat4 uVP; uniform float uPx, uMin; out vec3 vC; out vec2 vL;
void main(){ vec4 q=uVP*vec4(aP.xyz,1.); gl_Position=q; gl_PointSize=clamp(aP.w*2.*uPx/max(q.w,1e-4),uMin,160.); vC=aC; vL=aL; }`;
const F_PL = `#version 300 es
precision mediump float; in vec3 vC; in vec2 vL; out vec4 o; uniform float uEnc, uVis;
void main(){ vec2 p=gl_PointCoord*2.-1.; p.y=-p.y; float r=dot(p,p); if(r>1.) discard; vec3 n=vec3(p,sqrt(1.-r)); float l=max(dot(n,normalize(vec3(vL,.45))),0.), rand=pow(1.-n.z,3.);
  vec3 c=vC*(.05+1.5*l)+vC*rand*.7*(.25+l); float al=smoothstep(1.,.8,r); o=vec4(c*al*uEnc*uVis,al*uVis); }`;

let G = null;
function baue(gl, N, M, arbeit){
  if(G){ G.loesche(); G = null; }
  const klein = CAM.cssW < 700, R = N.L.R, D = galaxie(N, arbeit), pS = M.prog(V_STERN, PF), pM = M.prog(V_MOND, PF), pL = M.prog(V_PL, F_PL);
  const statisch = daten => { const vao = gl.createVertexArray(), buf = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, daten, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16); return {vao, buf, n: daten.length / 8}; };
  const sc = statisch(sterne(R, klein ? 26000 : 70000)), ne = statisch(nebel(R, klein ? 500 : 1100));
  const fern = sterne(R * 16, klein ? 2500 : 6000, 5); for(let i = 0; i < fern.length; i += 8){ const a = hash(i * 0.713) * Math.PI * 2, b = (hash(i * 1.937) * 2 - 1) * 0.95; fern[i] = Math.cos(a) * R * 9 * Math.sqrt(1 - b * b); fern[i + 1] = b * R * 6; fern[i + 2] = Math.sin(a) * R * 9 * Math.sqrt(1 - b * b); fern[i + 3] = R * 0.006; fern[i + 7] = 0.5 + Math.abs(Math.sin(i * 1.3)) * 0.7; }
  const fr = statisch(fern);
  const F = 15, mv = new Float32Array(D.monde.length * F); const pl = D.planeten, zahlJe = {}; D.monde.forEach(q => { zahlJe[q.planet] = (zahlJe[q.planet] || 0) + 1; }); D.monde.forEach((q, j) => { const p = pl[q.planet]; const eng = Math.min(1, Math.pow(12 / zahlJe[q.planet], 0.75)); mv.set([p.sx, p.sz, p.rx, p.rz, p.wp, q.rm, q.ph, q.wm, q.tau, q.kipp, Math.max(0.05, p.rM * 0.04), q.kx, q.farbe[0] * eng, q.farbe[1] * eng, q.farbe[2] * eng], j * F); });
  // eigene Reihe, damit a3.w (kz) und die Werknummer Platz haben
  const mx = new Float32Array(D.monde.length * 17); D.monde.forEach((q, j) => { mx.set(mv.subarray(j * F, j * F + F), j * 17); mx[j * 17 + 15] = q.kz; mx[j * 17 + 16] = q.planet; });
  const vaoM = gl.createVertexArray(), bm = gl.createBuffer(); gl.bindVertexArray(vaoM); gl.bindBuffer(gl.ARRAY_BUFFER, bm); gl.bufferData(gl.ARRAY_BUFFER, mx, gl.STATIC_DRAW); [[0, 4, 0], [1, 4, 16], [2, 4, 32], [3, 4, 48], [4, 1, 64]].forEach(([l, g, of]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, g, gl.FLOAT, false, 68, of); gl.vertexAttribDivisor(l, 1); });
  const pd = new Float32Array(pl.length * 9), vaoP = gl.createVertexArray(), bp = gl.createBuffer(); gl.bindVertexArray(vaoP); gl.bindBuffer(gl.ARRAY_BUFFER, bp); gl.bufferData(gl.ARRAY_BUFFER, pd.byteLength, gl.DYNAMIC_DRAW); [[0, 4, 0], [1, 3, 16], [2, 2, 28]].forEach(([l, g, of]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, g, gl.FLOAT, false, 36, of); });
  gl.bindVertexArray(null);
  const tD = gl.createTexture(), dim = new Uint8Array(N.N * 4).fill(255); gl.bindTexture(gl.TEXTURE_2D, tD); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N.N, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, dim); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  G = {N, D, pS, pM, pL, sc, ne, fr, vaoM, nM: D.monde.length, S: klein ? 96 : 220, vaoP, bp, pd, tD, dim, R,
    loesche(){ gl.deleteTexture(tD); for(const b of [sc.buf, ne.buf, fr.buf, bm, bp]) gl.deleteBuffer(b); for(const v of [sc.vao, ne.vao, fr.vao, vaoM, vaoP]) gl.deleteVertexArray(v); for(const p of [pS, pM, pL]) gl.deleteProgram(p.p); }};
  return G;
}
export function zeichneGalaxie(gl, N, U, M, arbeit, vis, E, ENC, T){
  if(!N || vis <= 0.003 || E <= 0.003) return;
  if(!G || G.N !== N) baue(gl, N, M, arbeit);
  const px = M.H * 0.5 / Math.tan(CAM.fov / 2), mn = 1.05 * M.DPR * M.qScale, dreh = DREHUNG * T;
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  gl.useProgram(G.pS.p); const us = G.pS.u; gl.uniformMatrix4fv(us.uVP, false, CAM.VP); gl.uniform1f(us.uPx, px); gl.uniform1f(us.uMin, mn); gl.uniform1f(us.uEnc, ENC);
  const stern = (b, d, sp, f, hell) => { gl.uniform1f(us.uDreh, d); gl.uniform1f(us.uSpanne, sp); gl.uniform1f(us.uFlug, f); gl.uniform1f(us.uVis, vis * E * hell); gl.bindVertexArray(b.vao); gl.drawArrays(gl.POINTS, 0, b.n); };
  stern(G.fr, 0, G.R * 6, FLUG * T * 6, 1); stern(G.ne, dreh, 0, 0, 1); stern(G.sc, dreh, 0, 0, 1);
  // Planeten: Kugeln, von ihrer Sonne her beschienen
  const oben = U.gal || (U.gal = {}); let q = 0, sa = [0, 0, 0];
  for(const p of G.D.planeten){ const o = N.ort[p.n]; const m = toScreen(o[0], o[1], o[2]), g = DREHUNG * T, ax = Math.cos(g) * p.sx - Math.sin(g) * p.sz, az = Math.sin(g) * p.sx + Math.cos(g) * p.sz; sa = toScreen(ax, 0, az); const dx = sa[0] - m[0], dy = m[1] - sa[1], l = Math.hypot(dx, dy) || 1;
    G.pd.set([o[0], o[1], o[2], p.r * Math.min(1, E * 2), p.farbe[0] * 1.4, p.farbe[1] * 1.4, p.farbe[2] * 1.4, dx / l, dy / l], q); q += 9; }
  gl.useProgram(G.pL.p); gl.uniformMatrix4fv(G.pL.u.uVP, false, CAM.VP); gl.uniform1f(G.pL.u.uPx, px); gl.uniform1f(G.pL.u.uMin, mn); gl.uniform1f(G.pL.u.uEnc, ENC); gl.uniform1f(G.pL.u.uVis, vis * E); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.bindVertexArray(G.vaoP); gl.bindBuffer(gl.ARRAY_BUFFER, G.bp); gl.bufferSubData(gl.ARRAY_BUFFER, 0, G.pd); gl.drawArrays(gl.POINTS, 0, G.D.planeten.length);
  // Monde und ihre Spuren
  const fokus = U.als && U.als.set ? U.als.set : null; for(let n = 0; n < N.N; n++){ let a = U.dach == null || N.bezirk(n) === U.dach ? 1 : 0.3; if(U.solo >= 0 && !N.B.monde[n].stimmen.includes(U.solo)) a *= 0.2; if(fokus && !fokus.has(n)) a *= 0.2; G.dim[n * 4] = a * 255; }
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, G.tD); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N.N, 1, gl.RGBA, gl.UNSIGNED_BYTE, G.dim);
  gl.blendFunc(gl.ONE, gl.ONE); gl.useProgram(G.pM.p); const um = G.pM.u; gl.uniformMatrix4fv(um.uVP, false, CAM.VP); gl.uniform1f(um.uPx, px); gl.uniform1f(um.uMin, mn); gl.uniform1f(um.uEnc, ENC); gl.uniform1f(um.uT, T); gl.uniform1f(um.uE, E); gl.uniform1f(um.uN, G.S); gl.uniform1f(um.uVis, vis); gl.uniform1f(um.uDreh, DREHUNG); gl.uniform1f(um.uFlug, FLUG); gl.uniform1i(um.uDim, 3);
  gl.bindVertexArray(G.vaoM); gl.drawArraysInstanced(gl.POINTS, 0, G.S, G.nM);
  gl.bindVertexArray(null); gl.disable(gl.BLEND); gl.activeTexture(gl.TEXTURE0);
}
