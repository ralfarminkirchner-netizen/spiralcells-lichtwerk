/* =====================================================================
   LICHT — die Lichtmaschine aus dem Lichtwerk „Spiral Cells“, unverändert im Kern:
   HDR-Punkte, Nebel, Dual-Kawase-Glühen, ACES, Korn. Punkte werden auf der CPU gebaut.
   ===================================================================== */
export const TAU = Math.PI * 2, DEG = Math.PI / 180;
export const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
export const mix = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const sm5 = t => t * t * t * (t * (t * 6 - 15) + 10);
export const eio = t => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));
export const lin = h => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(c => Math.pow(c, 2.2)); };
export const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const mixc = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
export const desat = (c, k) => { const g = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; return [mix(c[0], g, k), mix(c[1], g, k), mix(c[2], g, k)]; };

export const WG = lin('#fff6e0'), KEIMC = lin('#fff1d6'), GOLDC = lin('#f2c46d'), SILVER = lin('#e6ecff'), DUSTC = lin('#d8cfc0'), ASCHE = lin('#c4786a');

/* ---------------------------------------------------------- Punktpuffer */
export const MAXP = 160000, STR = 8;
export const PD = new Float32Array(MAXP * STR);
export const L = {pc: 0};
export function P(x, y, z, s, r, g, b, a){
  if(L.pc >= MAXP || a <= 0.0005) return; const i = L.pc * STR;
  PD[i] = x; PD[i + 1] = y; PD[i + 2] = z; PD[i + 3] = s; PD[i + 4] = r; PD[i + 5] = g; PD[i + 6] = b; PD[i + 7] = a; L.pc++;
}

/* ------------------------------------------------------------- Matrizen */
export function mul4(a, b){ const o = new Float32Array(16);
  for(let c = 0; c < 4; c++) for(let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }
export function persp(fy, asp, n, f, shiftY, shiftX){ const t = 1 / Math.tan(fy / 2), o = new Float32Array(16); o[0] = t / asp; o[5] = t; o[8] = 2 * (shiftX || 0); o[9] = -(shiftY || 0); o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o; }
export function viewM(tg, d, yaw, pitch){ const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const T = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, -tg[0],-tg[1],-tg[2],1]);
  const RY = new Float32Array([cy,0,sy,0, 0,1,0,0, -sy,0,cy,0, 0,0,0,1]);
  const RX = new Float32Array([1,0,0,0, 0,cp,sp,0, 0,-sp,cp,0, 0,0,0,1]);
  const D = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-d,1]);
  return mul4(D, mul4(RX, mul4(RY, T))); }
export function inv4(a){ const o = new Float32Array(16);
  const a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7],a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
  const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,
        b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06; if(!det) return null; det=1/det;
  o[0]=(a11*b11-a12*b10+a13*b09)*det;o[1]=(a02*b10-a01*b11-a03*b09)*det;o[2]=(a31*b05-a32*b04+a33*b03)*det;o[3]=(a22*b04-a21*b05-a23*b03)*det;
  o[4]=(a12*b08-a10*b11-a13*b07)*det;o[5]=(a00*b11-a02*b08+a03*b07)*det;o[6]=(a32*b02-a30*b05-a33*b01)*det;o[7]=(a20*b05-a22*b02+a23*b01)*det;
  o[8]=(a10*b10-a11*b08+a13*b06)*det;o[9]=(a01*b08-a00*b10-a03*b06)*det;o[10]=(a30*b04-a31*b02+a33*b00)*det;o[11]=(a21*b02-a20*b04-a23*b00)*det;
  o[12]=(a11*b07-a10*b09-a12*b06)*det;o[13]=(a00*b09-a01*b07+a02*b06)*det;o[14]=(a31*b01-a30*b03-a32*b00)*det;o[15]=(a20*b03-a21*b01+a22*b00)*det;
  return o; }
export function xf(m, x, y, z){ const w = m[3] * x + m[7] * y + m[11] * z + m[15];
  return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w, w]; }

/* --------------------------------------------------------------- Kamera */
export const CAM = {VP: null, IVP: null, P: [0, 0, 0], R: [1, 0, 0], U: [0, 1, 0], cssW: 1, cssH: 1, S: 1, dist: 1, fov: 0.1, target: [0, 0, 0]};
export function setCamera(cam, W, H){
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
  CAM.P = [cam.target[0] + cam.dist * cp * sy, cam.target[1] + cam.dist * sp, cam.target[2] + cam.dist * cp * cy];
  CAM.R = [cy, 0, -sy]; CAM.U = [-sp * sy, cp, -sp * cy];
  const proj = persp(cam.fov, W / H, Math.max(0.005, cam.dist * 0.002), Math.max(600, cam.dist * 40), cam.shift, cam.shiftX), view = viewM(cam.target, cam.dist, cam.yaw, cam.pitch);
  CAM.VP = mul4(proj, view); CAM.IVP = inv4(CAM.VP); CAM.S = cam.S; CAM.dist = cam.dist; CAM.fov = cam.fov; CAM.target = cam.target;
}
export function toScreen(x, y, z){ const c = xf(CAM.VP, x, y, z); return [(c[0] * 0.5 + 0.5) * CAM.cssW, (0.5 - c[1] * 0.5) * CAM.cssH, c[3]]; }
/* Bildschirmpunkt → Punkt auf der Ebene durch tgt, senkrecht zur Blickrichtung */
export function pointerWorld(sx, sy, tgt){
  if(!CAM.IVP) return [tgt[0], tgt[1], tgt[2]];
  const nx = sx / CAM.cssW * 2 - 1, ny = 1 - sy / CAM.cssH * 2;
  const a = xf(CAM.IVP, nx, ny, -1), b = xf(CAM.IVP, nx, ny, 1);
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], f = [CAM.P[0] - tgt[0], CAM.P[1] - tgt[1], CAM.P[2] - tgt[2]];
  const den = d[0] * f[0] + d[1] * f[1] + d[2] * f[2]; if(Math.abs(den) < 1e-9) return [tgt[0], tgt[1], tgt[2]];
  const t = ((tgt[0] - a[0]) * f[0] + (tgt[1] - a[1]) * f[1] + (tgt[2] - a[2]) * f[2]) / den;
  return [a[0] + d[0] * t, a[1] + d[1] * t, a[2] + d[2] * t];
}
export function screenRing(c, rad, col, a, frac){ const n = 72, f = frac == null ? 1 : frac;
  for(let j = 0; j < n * f; j++){ const an = j / n * TAU - Math.PI / 2, ca = Math.cos(an) * rad, sa = Math.sin(an) * rad;
    P(c[0] + CAM.R[0] * ca + CAM.U[0] * sa, c[1] + CAM.R[1] * ca + CAM.U[1] * sa, c[2] + CAM.R[2] * ca + CAM.U[2] * sa, 0.0035 * CAM.S, col[0], col[1], col[2], a); } }

/* ------------------------------------------------------- WebGL-Grundlage */
const VS_TRI = `#version 300 es
out vec2 vUv; void main(){ vec2 p=vec2((gl_VertexID<<1)&2, gl_VertexID&2); vUv=p; gl_Position=vec4(p*2.0-1.0,0.0,1.0); }`;
const FS = {
POINT_V:`#version 300 es
precision highp float;
layout(location=0) in vec4 aPos; layout(location=1) in vec4 aCol;
uniform mat4 uVP; uniform float uPx; uniform float uMin; uniform float uMax;
out vec3 vCol;
void main(){
  vec4 c=uVP*vec4(aPos.xyz,1.0); gl_Position=c;
  float w=max(c.w,1e-4); float px=aPos.w*uPx/w;
  float s=clamp(px,uMin,uMax); float e=min((px*px)/(s*s),1.0);
  gl_PointSize=s;
  vCol=c.w>0.0?aCol.rgb*aCol.a*e:vec3(0.0);
}`,
POINT_F:`#version 300 es
precision mediump float;
in vec3 vCol; out vec4 o; uniform float uEnc;
void main(){ vec2 p=gl_PointCoord*2.0-1.0; float r2=dot(p,p); if(r2>1.0) discard;
  float k=exp(-r2*7.0)+exp(-r2*2.3)*0.26; o=vec4(vCol*k*uEnc,1.0); }`,
NEB:`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uT; uniform vec2 uPar; uniform float uI; uniform float uEnc;
float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=0.5,s=0.0; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ s+=a*n(p); p=m*p; a*=0.5; } return s; }
void main(){
  vec2 uv=(vUv-0.5)*vec2(uRes.x/uRes.y,1.0);
  vec2 q=uv*1.4+uPar; float t=uT*0.008;
  vec2 w=vec2(fbm(q+vec2(0.0,t)), fbm(q+vec2(5.2,1.3)-t));
  float k=fbm(q+2.4*w);
  vec3 c=mix(vec3(0.010,0.008,0.014), vec3(0.030,0.024,0.020), smoothstep(0.3,0.85,k));
  c=mix(c, vec3(0.036,0.020,0.030), smoothstep(0.55,0.95,w.y*k*1.3));
  c*=(0.3+0.7*k*k)*uI*(1.0-0.6*smoothstep(0.1,1.1,length(uv)));
  o=vec4(c*uEnc,1.0);
}`,
DOWN:`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex; uniform vec2 uTx; uniform float uThr; uniform float uPre;
void main(){ vec2 d=uTx;
  vec3 s=texture(uTex,vUv).rgb*4.0+texture(uTex,vUv-d).rgb+texture(uTex,vUv+d).rgb
       +texture(uTex,vUv+vec2(d.x,-d.y)).rgb+texture(uTex,vUv-vec2(d.x,-d.y)).rgb;
  s*=0.125;
  if(uPre>0.5){ float b=max(s.r,max(s.g,s.b)); float kn=uThr*0.7;
    float so=clamp(b-uThr+kn,0.0,2.0*kn); so=so*so/(4.0*kn+1e-5); s*=max(so,b-uThr)/max(b,1e-5); }
  o=vec4(s,1.0); }`,
UP:`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex; uniform vec2 uTx;
void main(){ vec2 d=uTx;
  vec3 s=texture(uTex,vUv+vec2(-2.0*d.x,0.0)).rgb+texture(uTex,vUv+vec2(2.0*d.x,0.0)).rgb
        +texture(uTex,vUv+vec2(0.0,-2.0*d.y)).rgb+texture(uTex,vUv+vec2(0.0,2.0*d.y)).rgb;
  s+=2.0*(texture(uTex,vUv+vec2(-d.x,d.y)).rgb+texture(uTex,vUv+vec2(d.x,d.y)).rgb
         +texture(uTex,vUv+vec2(d.x,-d.y)).rgb+texture(uTex,vUv+vec2(-d.x,-d.y)).rgb);
  o=vec4(s/12.0,1.0); }`,
COMP:`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uScene; uniform sampler2D uBloom; uniform sampler2D uNeb;
uniform float uBloomK; uniform float uExp; uniform float uT; uniform vec2 uRes; uniform float uGrain; uniform float uEnc;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
float h(vec2 p){ vec3 q=fract(vec3(p.xyx)*0.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
void main(){
  vec2 c=vUv-0.5; float r2=dot(c,c);
  vec3 col=(texture(uNeb,vUv).rgb+texture(uScene,vUv).rgb+texture(uBloom,vUv).rgb*uBloomK)/uEnc;
  col=aces(col*uExp);
  col*=mix(1.0,0.22,smoothstep(0.10,0.70,r2*1.25));
  col=pow(col,vec3(1.0/2.2));
  col+=(h(vUv*uRes+fract(uT)*173.0)-0.5)*uGrain;
  o=vec4(col,1.0);
}`};

export function lichtmaschine(canvas, onLost){
  const gl = canvas.getContext('webgl2', {antialias:false, alpha:false, depth:false, stencil:false, premultipliedAlpha:false, powerPreference:'high-performance', preserveDrawingBuffer:false});
  if(!gl) return null;
  let HDR = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  let ENC = HDR ? 1 : 0.125;
  const PSR = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE), MAX_PT = Math.min(PSR[1], 384);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); onLost && onLost(); }, false);
  canvas.addEventListener('webglcontextrestored', () => location.reload(), false);
  function sh(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function prog(vs, fs){ const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for(let i = 0; i < n; i++){ const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); } return {p, u}; }
  const P_POINT = prog(FS.POINT_V, FS.POINT_F), P_NEB = prog(VS_TRI, FS.NEB), P_DOWN = prog(VS_TRI, FS.DOWN), P_UP = prog(VS_TRI, FS.UP), P_COMP = prog(VS_TRI, FS.COMP);

  function makeTarget(w, h){
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    const alloc = () => { if(HDR) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); };
    alloc();
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    if(HDR && gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE){ HDR = false; ENC = 0.125; gl.bindTexture(gl.TEXTURE_2D, t); alloc();
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); }
    return {t, f, w, h};
  }
  const freeTarget = x => { if(!x) return; gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); };

  const M = {W: 1, H: 1, DPR: 1, qScale: 1, sceneT: null, nebT: null, mips: [], gl, prog};
  M.resize = function(){
    CAM.cssW = innerWidth; CAM.cssH = innerHeight;
    M.DPR = Math.min(window.devicePixelRatio || 1, CAM.cssW < 700 ? 1.5 : 2);
    const w = Math.max(2, Math.round(CAM.cssW * M.DPR * M.qScale)), h = Math.max(2, Math.round(CAM.cssH * M.DPR * M.qScale));
    if(w === M.W && h === M.H && M.sceneT) return;
    M.W = w; M.H = h; canvas.width = w; canvas.height = h;
    freeTarget(M.sceneT); freeTarget(M.nebT); M.mips.forEach(freeTarget); M.mips = [];
    M.sceneT = makeTarget(w, h);
    if(M.tiefe) gl.deleteRenderbuffer(M.tiefe); M.tiefe = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, M.tiefe); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, M.sceneT.f); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, M.tiefe);
    M.nebT = makeTarget(Math.max(2, w >> 2), Math.max(2, h >> 2));
    let mw = w, mh = h; for(let i = 0; i < 6; i++){ mw = Math.max(2, mw >> 1); mh = Math.max(2, mh >> 1); M.mips.push(makeTarget(mw, mh)); }
  };

  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, PD.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, STR * 4, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, STR * 4, 16);
  const emptyVao = gl.createVertexArray();
  const blit = t => { gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.f : null); gl.viewport(0, 0, t ? t.w : M.W, t ? t.h : M.H); gl.bindVertexArray(emptyVao); gl.drawArrays(gl.TRIANGLES, 0, 3); };

  /* look: {neb, thr, bloom, exp, par:[x,y], grain, still} */
  M.render = function(wall, look){
    gl.disable(gl.BLEND);
    gl.useProgram(P_NEB.p);
    gl.uniform2f(P_NEB.u.uRes, M.nebT.w, M.nebT.h); gl.uniform1f(P_NEB.u.uT, wall);
    gl.uniform2f(P_NEB.u.uPar, look.par[0], look.par[1]); gl.uniform1f(P_NEB.u.uI, look.neb); gl.uniform1f(P_NEB.u.uEnc, ENC);
    blit(M.nebT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, M.sceneT.f); gl.viewport(0, 0, M.W, M.H);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(M.vorPunkte) M.vorPunkte(gl, ENC);   // eigene Bühnen (Landschaft, Galaxie) liegen unter den Lichtpunkten, im selben Licht
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P_POINT.p);
    gl.uniformMatrix4fv(P_POINT.u.uVP, false, CAM.VP);
    gl.uniform1f(P_POINT.u.uPx, M.H * 0.5 / Math.tan(CAM.fov / 2));
    gl.uniform1f(P_POINT.u.uMin, 1.6 * M.DPR * M.qScale); gl.uniform1f(P_POINT.u.uMax, MAX_PT); gl.uniform1f(P_POINT.u.uEnc, ENC);
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, PD, 0, L.pc * STR);
    gl.drawArrays(gl.POINTS, 0, L.pc);
    gl.disable(gl.BLEND);
    gl.useProgram(P_DOWN.p); gl.activeTexture(gl.TEXTURE0); gl.uniform1i(P_DOWN.u.uTex, 0);
    let src = M.sceneT;
    for(let i = 0; i < M.mips.length; i++){ gl.bindTexture(gl.TEXTURE_2D, src.t); gl.uniform2f(P_DOWN.u.uTx, 1 / src.w, 1 / src.h);
      gl.uniform1f(P_DOWN.u.uPre, i === 0 ? 1 : 0); gl.uniform1f(P_DOWN.u.uThr, look.thr * ENC); blit(M.mips[i]); src = M.mips[i]; }
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P_UP.p); gl.uniform1i(P_UP.u.uTex, 0);
    for(let i = M.mips.length - 1; i > 0; i--){ gl.bindTexture(gl.TEXTURE_2D, M.mips[i].t); gl.uniform2f(P_UP.u.uTx, 1 / M.mips[i].w, 1 / M.mips[i].h); blit(M.mips[i - 1]); }
    gl.disable(gl.BLEND);
    gl.useProgram(P_COMP.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, M.sceneT.t); gl.uniform1i(P_COMP.u.uScene, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, M.mips[0].t); gl.uniform1i(P_COMP.u.uBloom, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, M.nebT.t); gl.uniform1i(P_COMP.u.uNeb, 2);
    gl.uniform1f(P_COMP.u.uBloomK, look.bloom); gl.uniform1f(P_COMP.u.uExp, look.exp); gl.uniform1f(P_COMP.u.uEnc, ENC);
    gl.uniform1f(P_COMP.u.uT, look.still ? 0 : wall); gl.uniform2f(P_COMP.u.uRes, M.W, M.H); gl.uniform1f(P_COMP.u.uGrain, look.grain ?? 0.02);
    blit(null);
    gl.activeTexture(gl.TEXTURE0);
  };
  return M;
}
