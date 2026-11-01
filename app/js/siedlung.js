/* =====================================================================
   SIEDLUNG — Dorf, Campus und Büro im selben Licht wie die Landschaft. Bedeutung steht in bauplan.js.
   Die Bauten stehen aus dem Boden auf; jedes Fenster und jedes Blatt beginnt als das Lichtkorn seiner Fassung und fliegt an seinen Platz.
   ===================================================================== */
import {CAM} from './licht.js';
import {HIMMELTEXT} from './garten.js';
import {bauplan, KISTE, FENSTER, BODENTEIL} from './bauplan.js';
import {innenPlan} from './innen.js';

const V_K = `#version 300 es
layout(location=0) in vec4 a0; layout(location=1) in vec4 a1; layout(location=2) in vec4 a2; layout(location=3) in vec2 a3;
uniform mat4 uVP; uniform float uBau, uHoch; out vec3 vW; out vec3 vL; out vec3 vF; flat out float vForm; flat out vec3 vMass; out float vT;
const int I[36]=int[36](0,2,1,1,2,3,4,5,6,5,7,6,0,1,4,1,5,4,2,6,3,3,6,7,0,4,2,2,4,6,1,3,5,3,7,5);
void main(){ int c=I[gl_VertexID]; vec3 p=vec3(float(c&1)-.5,float((c>>1)&1),float((c>>2)&1)-.5); vL=p; float m=smoothstep(a3.y*.6,a3.y*.6+.4,uBau), form=a2.w;
  if(form==1.&&p.y>.5) p.x=0.;
  vec3 g=p*vec3(a1.x,a1.y*m,form==5.?a1.x:a1.z); float ch=cos(a1.w), sh=sin(a1.w); vec3 r=vec3(ch*g.x+sh*g.z,g.y+a0.w*m,-sh*g.x+ch*g.z);
  vW=vec3(a0.x,a0.z*uHoch,a0.y)+r; vF=a2.rgb; vForm=form; vMass=a1.xyz; vT=m; gl_Position=uVP*vec4(vW,1.); }`;
const F_K = `#version 300 es
precision highp float; in vec3 vW; in vec3 vL; in vec3 vF; flat in float vForm; flat in vec3 vMass; in float vT; out vec4 o;
uniform vec3 uCam, uArt; uniform float uFern, uEnc, uVis, uSchnitt, uTief;` + HIMMELTEXT + `
void main(){ if(vW.y>uSchnitt) discard;
  if(vForm>3.5){ float dm=vMass.x, r=length(vL.xz)*dm; if(vForm==4.&&(r>dm*.5||r<1.9)) discard; if(vForm==5.&&(r>dm*.5||r<2.05||abs(atan(vL.z,vL.x))>vMass.z)) discard; if(vForm==6.&&(r>dm*.5||r<dm*.5-.1)) discard; } vec3 v=vW-uCam; float dist=length(v); vec3 d=v/dist, n=normalize(cross(dFdx(vW),dFdy(vW))); if(dot(n,d)>0.) n=-n; vec3 alb=vF; float seite=abs(n.y)<.5?1.:0.;
  vec2 q=vec2(abs(n.x)>abs(n.z)?vL.z*vMass.z:vL.x*vMass.x,vL.y*vMass.y); float glanz=0.;
  if(vForm==0.&&uArt.x>.2){ float b=smoothstep(.05,.03,abs(fract(q.y/.9)-.5)*.9)+smoothstep(.04,.025,abs(fract(q.x/1.1)-.5)*1.1); alb=mix(alb,vec3(.06,.04,.025),clamp(b,0.,1.)*seite*.7*uArt.x); }
  if(vForm==1.){ float r=texture(uRausch,vW.xz*.7+vW.y*.5).r; alb*=.55+.9*r; alb*=.82+.18*smoothstep(.2,.8,fract(q.y*7.)); }
  if(vForm==0.&&uArt.y>.2&&seite>.5){ vec2 g=vec2(fract(q.x/.55),fract(q.y/.5)); float rahmen=step(.08,g.x)*step(.1,g.y); alb=mix(vec3(.10,.105,.11),alb*.55,rahmen); glanz=rahmen*uArt.y; }
  float s=max(dot(n,uSun)+.15,0.)/1.15, sonne=s; vec3 c=alb*(vec3(3.2,1.7,.75)*sonne*(1.-uArt.z)+mix(vec3(.05,.04,.04),vec3(.15,.2,.33),n.y*.5+.5));
  if(glanz>0.){ vec3 rf=reflect(d,n); c+=himmelsFarbe(normalize(vec3(rf.x,abs(rf.y)+.02,rf.z)))*glanz*.16; }
  if(uArt.z>.001){ vec3 l=normalize(vec3(.35,.85,.25)); c=mix(c,alb*(.30+.62*max(dot(n,l),0.)),uArt.z); if(vForm==3.) c*=.55; if(vForm==6.) c=c*.6+vec3(.03,.04,.05); }
  c=mix(nebel(c,d,dist,uFern),c,uArt.z); c*=mix(1.,.22,smoothstep(0.,uTief,uSchnitt-vW.y-3.0)*step(uTief,99.)); o=vec4(c*uEnc*uVis,1.); }`;
const V_F = `#version 300 es
layout(location=0) in vec4 a0; layout(location=1) in vec4 a1; layout(location=2) in vec4 a2; layout(location=3) in vec3 a3;
uniform mat4 uVP; uniform vec3 uRe, uHo; uniform float uBau, uHoch, uS; out vec2 vUv; out vec3 vF; out float vM; out vec3 vW; flat out float vLiegt;
void main(){ int i=gl_VertexID; vec2 c=vec2(float(i&1)*2.-1.,float((i>>1)&1)*2.-1.); vUv=c; float m=smoothstep(a2.a*.5+.2,a2.a*.5+.5,uBau), liegt=length(a1.xy)<.01?1.:0.; vLiegt=liegt; vM=m;
  float rise=smoothstep(a2.a*.6,a2.a*.6+.4,uBau); vec3 Z=vec3(a0.x,a0.z*uHoch+a0.w*rise,a0.y), St=vec3(a3.x,a0.z*uHoch+.2,a3.y), q=mix(St,Z,m);
  vec3 sei=liegt>.5?vec3(1.,0.,0.):vec3(a1.y,0.,-a1.x), hoch=liegt>.5?vec3(0.,0.,1.):vec3(0.,1.,0.); vec3 b=q+sei*c.x*a1.z*.5*m+hoch*c.y*a1.w*.5*m; vec3 g=q+(uRe*c.x+uHo*c.y)*uS; vW=mix(g,b,smoothstep(.05,.3,m)); vF=a2.rgb; gl_Position=uVP*vec4(vW,1.); }`;
const F_F = `#version 300 es
precision mediump float; in vec2 vUv; in vec3 vF; in float vM; in vec3 vW; flat in float vLiegt; out vec4 o; uniform float uEnc, uVis; uniform vec3 uArt;
void main(){ float r=dot(vUv,vUv), m=smoothstep(.05,.3,vM); vec3 lit=vLiegt>.5?mix(vec3(.78,.76,.70),vF*1.25,.9)*1.05:vF*(2.0+1.3*exp(-r*1.5)); float al=mix(exp(-r*4.),1.,m); vec3 c=mix(vF*2.5,lit,m); o=vec4(c*al*uEnc*uVis,al); }`;

const V_B = `#version 300 es
layout(location=0) in vec3 a0; layout(location=1) in vec3 a1; layout(location=2) in float a2; uniform mat4 uVP; uniform float uHoch; out vec3 vW; out vec3 vF; out float vS;
void main(){ vW=vec3(a0.x,a0.y*uHoch+.03,a0.z); vF=a1; vS=a2; gl_Position=uVP*vec4(vW,1.); }`;
const F_B = `#version 300 es
precision highp float; in vec3 vW; in vec3 vF; in float vS; out vec4 o; uniform vec3 uCam; uniform float uFern, uEnc, uVis, uBau;` + HIMMELTEXT + `
void main(){ if(uBau<.25) discard; vec3 v=vW-uCam; float dist=length(v); vec3 d=v/dist, n=normalize(cross(dFdx(vW),dFdy(vW))); if(n.y<0.) n=-n; float r=texture(uRausch,vW.xz*.31).r; vec3 alb=vF*(.72+.56*r); if(vS>-.5||vS<-1.5) alb*=.8+.4*smoothstep(.3,.5,abs(fract(vS)-.5));
  float s=max(dot(n,uSun)+.15,0.)/1.15; vec3 c=alb*(vec3(3.2,1.7,.75)*s+mix(vec3(.05,.04,.04),vec3(.15,.2,.33),n.y*.5+.5)); c=nebel(c,d,dist,uFern); o=vec4(c*uEnc*uVis,1.); }`;

let B = null;
function baue(gl, N, M, stil){ if(!B || B.N !== N){ if(B) B.alle.forEach(x => x()); B = {N, alle: [], plaene: {}, pK: M.prog(V_K, F_K), pF: M.prog(V_F, F_F), pB: M.prog(V_B, F_B)}; B.alle.push(() => { gl.deleteProgram(B.pK.p); gl.deleteProgram(B.pF.p); gl.deleteProgram(B.pB.p); }); }
  if(B.plaene[stil]) return B.plaene[stil]; const P = bauplan(N, stil), vao = (daten, st, lay) => { const v = gl.createVertexArray(), b = gl.createBuffer(); gl.bindVertexArray(v); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, daten, gl.STATIC_DRAW); lay.forEach(([l, g, of]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, g, gl.FLOAT, false, st * 4, of * 4); gl.vertexAttribDivisor(l, 1); }); B.alle.push(() => { gl.deleteBuffer(b); gl.deleteVertexArray(v); }); return v; };
  const q = {vK: vao(P.kisten, KISTE, [[0, 4, 0], [1, 4, 4], [2, 4, 8], [3, 2, 12]]), vF: vao(P.fenster, FENSTER, [[0, 4, 0], [1, 4, 4], [2, 4, 8], [3, 3, 12]]), nK: P.kisten.length / KISTE, nF: P.fenster.length / FENSTER, nB: P.boden.length / BODENTEIL}; if(q.nB){ const v = gl.createVertexArray(), b = gl.createBuffer(); gl.bindVertexArray(v); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, P.boden, gl.STATIC_DRAW); [[0, 3, 0], [1, 3, 12], [2, 1, 24]].forEach(([l, g, of]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, g, gl.FLOAT, false, BODENTEIL * 4, of); }); B.alle.push(() => { gl.deleteBuffer(b); gl.deleteVertexArray(v); }); q.vB = v; } gl.bindVertexArray(null); B.plaene[stil] = q; return q; }

export function zeichneSiedlung(gl, N, U, M, stil, bau, E, vis, ENC, tR, S, fern, kuehl, wall){
  const q = baue(gl, N, M, stil), hoch = E * (1 - U.art[2]), wert = E * bau;
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
  if(q.nB){ gl.useProgram(B.pB.p); const b = B.pB.u; gl.uniformMatrix4fv(b.uVP, false, CAM.VP); gl.uniform3fv(b.uCam, CAM.P); gl.uniform3fv(b.uSun, S); gl.uniform1f(b.uHoch, hoch); gl.uniform1f(b.uBau, wert); gl.uniform1f(b.uFern, fern); gl.uniform1f(b.uEnc, ENC); gl.uniform1f(b.uVis, vis); gl.uniform1f(b.uKuehl, kuehl); gl.uniform1f(b.uZeit, wall); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tR); gl.uniform1i(b.uRausch, 0); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4); gl.bindVertexArray(q.vB); gl.drawArrays(gl.TRIANGLES, 0, q.nB); gl.disable(gl.POLYGON_OFFSET_FILL); }
  gl.useProgram(B.pK.p); const u = B.pK.u; gl.uniformMatrix4fv(u.uVP, false, CAM.VP); gl.uniform3fv(u.uCam, CAM.P); gl.uniform3fv(u.uSun, S); gl.uniform3fv(u.uArt, U.art); gl.uniform1f(u.uSchnitt, 1e6); gl.uniform1f(u.uTief, 100); gl.uniform1f(u.uBau, wert); gl.uniform1f(u.uHoch, hoch); gl.uniform1f(u.uFern, fern); gl.uniform1f(u.uEnc, ENC); gl.uniform1f(u.uVis, vis); gl.uniform1f(u.uKuehl, kuehl); gl.uniform1f(u.uZeit, wall);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tR); gl.uniform1i(u.uRausch, 0); gl.bindVertexArray(q.vK); gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, q.nK);
  gl.useProgram(B.pF.p); const f = B.pF.u; gl.uniformMatrix4fv(f.uVP, false, CAM.VP); gl.uniform3fv(f.uRe, CAM.R); gl.uniform3fv(f.uHo, CAM.U); gl.uniform1f(f.uBau, wert); gl.uniform1f(f.uHoch, hoch); gl.uniform1f(f.uS, Math.max(0.08, CAM.S * 0.0042)); gl.uniform1f(f.uEnc, ENC); gl.uniform1f(f.uVis, vis); gl.uniform3fv(f.uArt, U.art);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.bindVertexArray(q.vF); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, q.nF);
  gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);
}

/* Ein Gebäude von innen. Über der gewählten Etage ist alles abgetragen, darunter wird es dunkler */
let I = null;
export function zeichneInnen(gl, N, U, M, vis, ENC, tR, S){
  if(!U.innen || vis <= 0.003) return; const inn = U.innen; baue(gl, N, M, inn.stil);
  if(!I || I.plan !== inn.plan){ if(I){ gl.deleteBuffer(I.b); gl.deleteVertexArray(I.v); } const v = gl.createVertexArray(), b = gl.createBuffer(); gl.bindVertexArray(v); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, inn.plan.kisten, gl.STATIC_DRAW); [[0, 4, 0], [1, 4, 4], [2, 4, 8], [3, 2, 12]].forEach(([l, g, of]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, g, gl.FLOAT, false, KISTE * 4, of * 4); gl.vertexAttribDivisor(l, 1); }); I = {plan: inn.plan, v, b, n: inn.plan.kisten.length / KISTE}; }
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
  gl.useProgram(B.pK.p); const u = B.pK.u, schnitt = inn.schnittGlatt ?? 1e6; gl.uniformMatrix4fv(u.uVP, false, CAM.VP); gl.uniform3fv(u.uCam, CAM.P); gl.uniform3fv(u.uSun, S || [0.4, 0.5, 0.3]); gl.uniform3f(u.uArt, 0, 0, 1); gl.uniform1f(u.uBau, 1); gl.uniform1f(u.uHoch, 0); gl.uniform1f(u.uFern, 1e4); gl.uniform1f(u.uEnc, ENC); gl.uniform1f(u.uVis, vis * 1.5); gl.uniform1f(u.uKuehl, 0); gl.uniform1f(u.uZeit, 0); gl.uniform1f(u.uSchnitt, schnitt); gl.uniform1f(u.uTief, inn.etage >= 0 ? 3 : 100);
  if(tR){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tR); gl.uniform1i(u.uRausch, 0); }
  gl.bindVertexArray(I.v); gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, I.n); gl.bindVertexArray(null); gl.disable(gl.DEPTH_TEST);
}
export {innenPlan};
