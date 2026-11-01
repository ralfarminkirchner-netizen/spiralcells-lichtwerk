/* =====================================================================
   GARTEN — derselbe Bestand als Landschaft. Gezeichnet wird in dieselbe Lichtmaschine wie der Kosmos,
   vor den Lichtpunkten: Himmel, Gelände, Gras, Pflanzen. Darum ist der Übergang ein Umformen:
   jedes Blatt beginnt als das Lichtkorn seiner Fassung, am selben Ort, und entfaltet sich dort.
   Bedeutung steht in gelaende.js. Berge, Wolken und Sonne sind Grund und tragen nichts.
   ===================================================================== */
import {CAM, sstep} from './licht.js';
import {gelaende, sonne, bodenGitter, pflanzen, grasFeld, saum, PFLANZE, FELD} from './gelaende.js';

const HIMMEL = `
uniform vec3 uSun; uniform sampler2D uRausch; uniform float uZeit; uniform float uKuehl;
vec3 himmelsFarbe(vec3 d){ float e=max(d.y,0.0), s=max(dot(d,uSun),0.0);
  vec3 hor=mix(vec3(.20,.17,.27),vec3(1.05,.50,.19),pow(s,3.5)); vec3 c=mix(hor,vec3(.012,.032,.095),pow(e,.38)); return mix(c,c.bgr*vec3(.75,.95,1.25)+vec3(.0,.012,.03),uKuehl); }
vec3 nebel(vec3 c,vec3 d,float dist,float fern){ float f=1.0-exp(-pow(dist/fern,2.2)); return mix(c,himmelsFarbe(normalize(vec3(d.x,.025,d.z))),f); }`;
const V_HIMMEL = `#version 300 es
uniform mat4 uIVP; out vec3 vD; out vec2 vUv;
void main(){ vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2)*2.0-1.0; vec4 a=uIVP*vec4(p,-1.,1.), b=uIVP*vec4(p,1.,1.); vD=b.xyz/b.w-a.xyz/a.w; gl_Position=vec4(p,1.,1.); }`;
const F_HIMMEL = `#version 300 es
precision highp float; in vec3 vD; out vec4 o; uniform float uTag; uniform float uEnc;` + HIMMEL + `
const float TAU=6.28318;
void main(){ vec3 d=normalize(vD); float s=max(dot(d,uSun),0.0), e=d.y; vec3 c=himmelsFarbe(d);
  // Wolken: dünne Schichten, von unten von der Sonne gefärbt
  if(e>0.0){ vec2 q=d.xz/(e+.09)*vec2(.05,.11)+uZeit*.0004; float n=texture(uRausch,q).r*.62+texture(uRausch,q*2.7+.3).g*.38, w=smoothstep(.47,.74,n)*smoothstep(.0,.13,e)*(1.0-smoothstep(.5,.85,e));
    c=mix(c,mix(vec3(.045,.05,.10),vec3(1.7,.72,.30),pow(s,4.0)*.95+.05),w*.9); }
  c+=vec3(2.2,1.0,.38)*pow(s,70.0)*.5+vec3(22.,11.,4.)*smoothstep(.99925,.9997,s);
  // Ferne Bergketten: drei Schichten, je weiter desto dunstiger
  float az=atan(d.z,d.x)/TAU; for(int i=0;i<3;i++){ float fi=float(i), k=mix(3.,11.,fi/2.), h=(.030-.012*fi)+(.085-.024*fi)*(textureLod(uRausch,vec2(az*k,.17+fi*.31),0.).r-.28)+.012*textureLod(uRausch,vec2(az*k*5.,.61+fi*.13),0.).g;
    vec3 dunst=himmelsFarbe(normalize(vec3(d.x,.025,d.z))), berg=mix(dunst,vec3(.03,.03,.05),.2+.16*fi); if(e<h) c=mix(dunst,berg,smoothstep(0.,h*.8,e)); }
  float tag=smoothstep(0.,1.,uTag*1.7-max(e,0.)*1.1); o=vec4(c*tag*uTag*uEnc,1.); }`;
const V_BODEN = `#version 300 es
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in float aL;
uniform mat4 uVP; uniform float uE; uniform float uFlach; out vec3 vW; out vec3 vN; out float vL;
void main(){ float hb=uE*(1.-uFlach); vW=vec3(aP.x,aP.y*hb,aP.z); vN=normalize(vec3(aN.x*hb,aN.y,aN.z*hb)); vL=mix(1.,aL,uE); gl_Position=uVP*vec4(vW,1.); }`;
const F_BODEN = `#version 300 es
precision highp float; in vec3 vW; in vec3 vN; in float vL; out vec4 o;
uniform sampler2D uKarte; uniform sampler2D uSchatten; uniform vec3 uCam; uniform float uRk; uniform float uR; uniform float uRm; uniform float uE; uniform float uFern; uniform float uEnc; uniform vec3 uArt;` + HIMMEL + `
void main(){ vec2 uv=vW.xz/uRk*.5+.5; vec3 k=vec3(0.), sch=vec3(0.); if(all(greaterThan(uv,vec2(.001)))&&all(lessThan(uv,vec2(.999)))){ k=texture(uKarte,uv).rgb; sch=texture(uSchatten,uv).rgb; }
  vec4 a=texture(uRausch,vW.xz/(uR*.09)), b=texture(uRausch,vW.xz/(uR*.012)); vec3 v=vW-uCam; float dist=length(v); vec3 d=v/dist;
  float fein=mix(b.g,.5,smoothstep(uR*.5,uR*1.6,dist));
  vec3 huegel=mix(vec3(.030,.058,.020),vec3(.115,.105,.032),a.r*a.r*1.7)*(0.7+.6*fein);
  vec3 wiese=mix(vec3(.040,.095,.022),vec3(.12,.16,.04),a.g)*(0.65+.7*fein);
  float reihe=.72+.28*smoothstep(-.3,.6,sin(dot(vW.xz,vec2(.7,.71))/uR*210.0+a.r*7.0));
  vec3 erde=mix(vec3(.018,.014,.012),vec3(.058,.040,.026),a.r)*reihe*(.6+.8*fein);
  vec3 licht=mix(vec3(.14,.14,.05),vec3(.30,.25,.10),a.g)*(.7+.6*fein);
  float ra=smoothstep(.34,.66,k.r+(a.b-.5)*.9+(b.a-.5)*.25), bu=smoothstep(.34,.66,k.b+(a.r-.5)*.5);
  erde=mix(erde,wiese*.55,smoothstep(.56,.74,a.a)*.75);   // Bewuchs auf den Beeten: Erde bleibt nie eine glatte Scheibe
  erde=mix(erde,mix(vec3(.10,.085,.055),vec3(.075,.10,.04),a.g)*(.7+.6*fein),uArt.x);   // Dorf: Höfe und Gärten
  erde=mix(erde,mix(vec3(.05,.095,.04),vec3(.065,.12,.05),step(.5,fract(dot(vW.xz,vec2(.7,.71))/uR*26.)))*(.85+.3*fein),uArt.y);   // Campus: gemähter Rasen
  licht=mix(licht,vec3(.17,.15,.12)*(.75+.5*b.r),uArt.x); licht=mix(licht,vec3(.22,.22,.21)*(.85+.3*step(.06,fract(vW.x/2.2))*step(.06,fract(vW.z/2.2))),uArt.y);   // Marktplatz, Innenhof
  vec3 alb=mix(mix(mix(huegel,wiese,k.g),erde,ra),licht,bu);
  float rand=exp(-pow((k.r-.5)/.13,2.))*smoothstep(.42,.62,a.b+b.a*.2), inner=exp(-pow((k.b-.5)/.13,2.))*smoothstep(.42,.62,a.r+b.a*.2); alb=mix(alb,vec3(.20,.17,.13)*(.35+1.3*b.r),max(rand,inner)*.9);
  alb*=1.0-.34*sch.g;   // innere Grenzen der Bereiche
  vec3 n=normalize(vN+vec3(a.g-.5,0.,a.b-.5)*.5+vec3(b.r-.5,0.,b.g-.5)*.25*(1.-smoothstep(uR*.4,uR*1.2,dist))); float sonne=max(dot(n,uSun)+.2,0.)/1.2*vL*(1.-.8*sch.r);
  vec3 c=alb*(vec3(3.4,1.75,.74)*sonne+mix(vec3(.05,.04,.04),vec3(.14,.19,.32),n.y*.5+.5)*.9);
  c+=alb*vec3(1.5,1.05,.5)*exp(-dot(vW.xz,vW.xz)/(uRm*uRm))*1.5;   // die Zentrale ist die hellste Stelle am Boden
  c+=vec3(.9,.5,.2)*max(rand,inner)*.018;
  c=nebel(c,d,dist,uFern);
  if(uArt.z>.001){ float kachel=step(.025,fract(vW.x/2.4))*step(.025,fract(vW.z/2.4)); vec3 boden=mix(vec3(.030,.032,.036),vec3(.062,.066,.074),k.r); boden=mix(boden,vec3(.040,.040,.042),k.g); boden=mix(boden,vec3(.115,.10,.08),k.b); boden*=(.86+.14*kachel)*(.94+.1*b.r); c=mix(c,boden,uArt.z); }
  float q=smoothstep(.1,.9,uE), weit=uR*(.5+19.*q*q*q), rr=length(vW.xz);   // das Gelände breitet sich von der Zentrale her aus
  o=vec4(c*smoothstep(weit,weit*.55,rr)*smoothstep(.1,.3,uE)*uEnc,1.); }`;
const V_PFL = `#version 300 es
layout(location=0) in vec4 a0; layout(location=1) in vec4 a1; layout(location=2) in vec4 a2; layout(location=3) in vec4 a3; layout(location=4) in vec2 a4;
uniform mat4 uVP; uniform vec3 uCam; uniform vec3 uRe; uniform vec3 uHo; uniform float uE; uniform float uGk; uniform float uS; uniform float uZeit; uniform float uWind; uniform float uGross; uniform sampler2D uDim;
out vec2 vUv; out vec3 vF; flat out float vArt; out float vM; out vec3 vW; out float vDim;
void main(){ int i=gl_VertexID; float v=float(i/2)/3., u=float(i%2)*2.-1., art=a1.w, sc=mix(1.,uGross,uE), wann=a3.a;
  float m=art==3. ? smoothstep(.45,1.,uE) : smoothstep(wann*.55,wann*.55+.45,(uE-.18)/.82);
  vec3 F=vec3(a0.x,a0.z*uE,a0.y), A=mix(vec3(a4.x,0.,a4.y),a1.xyz,uGk)*sc, B, pos; vec3 blick=normalize(F+A-uCam); float w=a2.w*sc;
  if(art==0.){ vec3 s=a2.xyz*sc*m; B=A+s; float l=length(a2.xyz)*sc; vec3 seite=normalize(cross(length(s)>1e-4?s:uHo,blick)); vec3 b=mix(A,B,v)+vec3(0.,-1.,0.)*v*v*l*.42*m+seite*u*w*m*.5;
    vec3 q=A+uRe*u*uS+uHo*(v*2.-1.)*uS; pos=mix(q,b,smoothstep(.0,.22,m)); }
  else if(art==1.){ B=mix(a1.xyz,a2.xyz,m)*sc*uGk; A=a1.xyz*sc*uGk; vec3 s=B-A; vec3 seite=normalize(cross(length(s)>1e-4?s:uHo,blick)); pos=mix(A,B,v)+seite*u*w*.5*m; }
  else if(art==3.){ vec3 s=a2.xyz*m; pos=s*v+vec3(0.,0.,0.)+uRe*u*w*.5*(1.-v)+vec3(s.x,0.,s.z)*v*v*2.5; }
  else { float gr=max(w*m,uS*(1.-m)); pos=A+uRe*u*gr+uHo*(v*2.-1.)*gr; }
  float hoehe=max(pos.y,0.); pos.xz+=vec2(sin(uZeit*.62+a0.x*.3+a0.y*.2),cos(uZeit*.47+a0.y*.3))*uWind*hoehe*hoehe*.012;
  vW=F+pos; vUv=vec2(u,v); vF=a3.rgb; vArt=art; vM=m; vDim=art==3.?1.:texelFetch(uDim,ivec2(int(a0.w),0),0).r; gl_Position=uVP*vec4(vW,1.); }`;
const F_PFL = `#version 300 es
precision highp float; in vec2 vUv; in vec3 vF; flat in float vArt; in float vM; in vec3 vW; in float vDim; out vec4 o;
uniform vec3 uCam; uniform float uFern; uniform float uEnc; uniform float uE; uniform float uVis;` + HIMMEL + `
void main(){ vec3 v=vW-uCam; float dist=length(v); vec3 d=v/dist; float gegen=pow(max(dot(d,uSun),0.),2.5), al=1.; vec3 c;
  float r=length(vec2(vUv.x,vUv.y*2.-1.));
  if(vArt==0.){ float fl=sin(3.14159*pow(clamp(vUv.y,0.,1.),.72)); fl=pow(max(fl,0.),.8); float blatt=1.-smoothstep(fl-.14,fl+.02,abs(vUv.x)), korn=exp(-r*r*5.);
    float rippe=1.-.34*exp(-pow(vUv.x/.07,2.)), adern=.9+.1*sin(vUv.y*34.-abs(vUv.x)*16.);
    vec3 lit=vF*(.20+.30*vUv.y+1.5*gegen)*rippe*adern; c=mix(vF*2.4,lit,smoothstep(.25,.8,vM)); al=mix(korn,blatt,smoothstep(.0,.25,vM)); }
  else if(vArt==1.){ c=vF*(.20+.34*gegen)+vec3(.55,.33,.14)*exp(-pow((vUv.x-.45)/.4,2.))*.32; al=1.-smoothstep(.75,1.,abs(vUv.x)); }
  else if(vArt==2.){ float a=atan(vUv.y*2.-1.,vUv.x); float bl=.62+.38*cos(a*6.); al=1.-smoothstep(bl-.1,bl+.04,r); c=vF*(.9+1.2*gegen)*(1.-.35*exp(-r*r*18.)); c=mix(c,vec3(1.8,1.2,.45),exp(-r*r*40.)); }
  else if(vArt==3.){ al=vM*(1.-smoothstep(uFern*.22,uFern*.5,dist)); c=vF*(.07+.26*vUv.y+1.5*gegen*vUv.y*vUv.y); }
  else { al=exp(-r*r*3.5); c=vF*1.1; }
  al*=vDim; if(al<.004) discard; c=nebel(c,d,dist,uFern); o=vec4(c*al*uEnc*uVis,al*uVis); }`;

let B = null;   // alles, was zum aktuellen Netz gehört

function tex(gl, quelle, w, h, wrap){ const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  if(quelle instanceof Uint8Array) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, quelle); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, quelle);
  gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap); const an = gl.getExtension('EXT_texture_filter_anisotropic'); if(an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 4); return t; }
function rausch(){ const S = 256, d = new Uint8Array(S * S * 4), gitter = (x, y, p, sd) => { const h = (a, b) => { const v = Math.sin(((a % p + p) % p) * 127.1 + ((b % p + p) % p) * 311.7 + sd) * 43758.5453; return v - Math.floor(v); }; const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (h(ix, iy) * (1 - u) + h(ix + 1, iy) * u) * (1 - v) + (h(ix, iy + 1) * (1 - u) + h(ix + 1, iy + 1) * u) * v; };
  for(let y = 0; y < S; y++) for(let x = 0; x < S; x++) for(let c = 0; c < 4; c++){ let n = 0, a = 0.5, p = 8; for(let o = 0; o < 4; o++){ n += a * gitter(x / S * p, y / S * p, p, c * 7.1 + o); a *= 0.5; p *= 2; } d[(y * S + x) * 4 + c] = Math.min(255, n / 0.9375 * 255); }
  return d; }
export { rausch as rauschTextur, tex as textur };

function karten(N, Rk, S, groesse){
  const leinwand = g => { const c = document.createElement('canvas'); c.width = c.height = g; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, g, g); x.globalCompositeOperation = 'lighter'; return [c, x]; };
  const [c1, a] = leinwand(groesse), [c2, b] = leinwand(groesse >> 1), zu = (w, g) => (w / Rk * 0.5 + 0.5) * g;
  const form = (x, m, R, seed, w, g) => { x.beginPath(); for(let j = 0; j <= 90; j++){ const t = j / 90 * Math.PI * 2, r = R * saum(t, seed, w), px = zu(m[0] + Math.cos(t) * r, g), pz = zu(m[2] + Math.sin(t) * r, g); j ? x.lineTo(px, pz) : x.moveTo(px, pz); } x.closePath(); };
  if('filter' in a) a.filter = `blur(${groesse / 1100}px)`;
  N.daecher.forEach((d, j) => { form(a, d.mitte, d.R, j + 1.3, 0.035, groesse); a.fillStyle = 'rgb(255,0,0)'; a.fill(); });
  if(N.L.ohne){ form(a, N.L.ohne.mitte, N.L.ohne.R * 1.03, 7.7, 0.05, groesse); a.fillStyle = 'rgb(0,255,0)'; a.fill(); }
  form(a, N.L.mitte.mitte, N.L.mitte.R, 4.4, 0.03, groesse); a.fillStyle = 'rgb(0,0,255)'; a.fill();
  // Lange Schatten der Pflanzen, von der Sonne weg; innere Bereichsgrenzen
  const g2 = groesse >> 1, lx = -S[0], lz = -S[2], ll = Math.hypot(lx, lz) || 1; if('filter' in b) b.filter = `blur(${g2 / 420}px)`; b.lineCap = 'round';
  N.B.monde.forEach((m, n) => { const H = N.mini[n].H * PFLANZE; if(!H) return; const o = N.pos[n], len = Math.min(H * 1.9, N.L.R * 0.3), x0 = zu(o[0], g2), z0 = zu(o[2], g2), brt = N.rM[n] * 0.9 / Rk * g2; const gr = b.createLinearGradient(x0, z0, zu(o[0] + lx / ll * len, g2), zu(o[2] + lz / ll * len, g2)); gr.addColorStop(0, 'rgba(255,0,0,.75)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); b.strokeStyle = gr; b.lineWidth = Math.max(1, brt); b.beginPath(); b.moveTo(x0, z0); b.lineTo(zu(o[0] + lx / ll * len, g2), zu(o[2] + lz / ll * len, g2)); b.stroke(); });
  N.daecher.forEach(d => { if(d.bereiche.length > 1) d.bereiche.forEach((q, i) => { form(b, q.mitte, q.R, i + 2.1, 0.03, g2); b.strokeStyle = 'rgb(0,255,0)'; b.lineWidth = Math.max(1, g2 / 900); b.stroke(); }); });
  return [c1, c2];
}

function baue(gl, N, M, yaw){
  if(B){ B.loesche(); B = null; }
  const klein = CAM.cssW < 700, prog = M.prog, S = sonne(yaw), Rk = N.L.R * 1.4;
  const pH = prog(V_HIMMEL, F_HIMMEL), pB = prog(V_BODEN, F_BODEN), pP = prog(V_PFL, F_PFL);
  const gitter = bodenGitter(N.land, S, klein ? 120 : 170, klein ? 160 : 220), vaoB = gl.createVertexArray(), vb = gl.createBuffer(), ib = gl.createBuffer();
  gl.bindVertexArray(vaoB); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, gitter.v, gl.STATIC_DRAW); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gitter.ix, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 28, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 28, 24);
  const instanz = dyn => { const vao = gl.createVertexArray(), buf = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); const st = FELD * 4; [[0, 4, 0], [1, 4, 16], [2, 4, 32], [3, 4, 48], [4, 2, 64]].forEach(([l, g, of]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, g, gl.FLOAT, false, st, of); gl.vertexAttribDivisor(l, 1); }); return {vao, buf}; };
  const P = pflanzen(N), alle = P.werke.reduce((a, w) => a + w.I.length, 0), iP = instanz(), iG = instanz(), gras = grasFeld(N, klein ? 22000 : 75000);
  gl.bindBuffer(gl.ARRAY_BUFFER, iP.buf); gl.bufferData(gl.ARRAY_BUFFER, alle * 4, gl.DYNAMIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER, iG.buf); gl.bufferData(gl.ARRAY_BUFFER, gras, gl.STATIC_DRAW); gl.bindVertexArray(null);
  const [c1, c2] = karten(N, Rk, S, klein ? 1024 : 2048), tR = tex(gl, rausch(), 256, 256, gl.REPEAT), tK = tex(gl, c1, 0, 0, gl.CLAMP_TO_EDGE), tS = tex(gl, c2, 0, 0, gl.CLAMP_TO_EDGE);
  const tD = gl.createTexture(), dim = new Uint8Array(N.N * 4).fill(255); gl.bindTexture(gl.TEXTURE_2D, tD); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N.N, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, dim); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  B = {N, S, Rk, pH, pB, pP, vaoB, nB: gitter.ix.length, iP, iG, nG: gras.length / FELD, nP: alle / FELD, P, tR, tK, tS, tD, dim, reihe: [], yawS: 99, emptyVao: gl.createVertexArray(), scratch: new Float32Array(alle),
    loesche(){ for(const t of [tR, tK, tS, tD]) gl.deleteTexture(t); for(const b of [vb, ib, iP.buf, iG.buf]) gl.deleteBuffer(b); for(const v of [vaoB, iP.vao, iG.vao, this.emptyVao]) gl.deleteVertexArray(v); for(const p of [pH, pB, pP]) gl.deleteProgram(p.p); }};
  return B;
}

const bind = (gl, ein, name, t, u) => { gl.activeTexture(gl.TEXTURE0 + ein); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u, ein); };

export const HIMMELTEXT = HIMMEL;
export function zeichneLandschaft(gl, N, U, M, wall, vis, E, ENC, ort = {bau: 0, art: [0, 0, 0], siedlung: null}){
  const buero = ort.art[2], kuehl = ort.art[1] * 0.75;
  if(!N || vis <= 0.003 || E <= 0.003) return;
  if(!B || B.N !== N) baue(gl, N, M, U.yawBasis ?? 0.35);
  const R = N.L.R, fern = R * 5.2, cam = CAM.P, tag = sstep(0.2, 1, E);
  // Himmel
  gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.useProgram(B.pH.p); gl.bindVertexArray(B.emptyVao);
  gl.uniformMatrix4fv(B.pH.u.uIVP, false, CAM.IVP); gl.uniform3fv(B.pH.u.uSun, B.S); gl.uniform1f(B.pH.u.uKuehl, kuehl); gl.uniform1f(B.pH.u.uTag, tag * vis * (1 - buero)); gl.uniform1f(B.pH.u.uZeit, wall); gl.uniform1f(B.pH.u.uEnc, ENC); bind(gl, 0, 'r', B.tR, B.pH.u.uRausch); gl.drawArrays(gl.TRIANGLES, 0, 3);
  // Boden
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.useProgram(B.pB.p); gl.bindVertexArray(B.vaoB); const ub = B.pB.u;
  gl.uniformMatrix4fv(ub.uVP, false, CAM.VP); gl.uniform3fv(ub.uSun, B.S); gl.uniform3fv(ub.uCam, cam); gl.uniform1f(ub.uRk, B.Rk); gl.uniform1f(ub.uR, R); gl.uniform1f(ub.uRm, N.L.mitte.R); gl.uniform1f(ub.uE, E * vis); gl.uniform1f(ub.uFlach, buero); gl.uniform3fv(ub.uArt, ort.art); gl.uniform1f(ub.uKuehl, kuehl); gl.uniform1f(ub.uFern, fern); gl.uniform1f(ub.uEnc, ENC);
  bind(gl, 0, 'r', B.tR, ub.uRausch); bind(gl, 1, 'k', B.tK, ub.uKarte); bind(gl, 2, 's', B.tS, ub.uSchatten); gl.drawElements(gl.TRIANGLES, B.nB, gl.UNSIGNED_INT, 0);
  if(ort.siedlung) ort.siedlung(B.tR, B.S, fern, kuehl);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.BLEND);
  // Abdunkeln nach Bezirk, Stimme und Blick: dieselben Regeln wie im Kosmos
  const fokus = U.als && U.als.set ? U.als.set : null; for(let n = 0; n < N.N; n++){ let a = U.dach == null || N.bezirk(n) === U.dach ? 1 : 0.4; if(U.solo >= 0 && !N.B.monde[n].stimmen.includes(U.solo)) a *= 0.25; if(fokus && !fokus.has(n)) a *= 0.2; B.dim[n * 4] = a * 255; }
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, B.tD); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N.N, 1, gl.RGBA, gl.UNSIGNED_BYTE, B.dim);
  // Gras und Pflanzen, von hinten nach vorn
  gl.useProgram(B.pP.p); const up = B.pP.u; gl.depthMask(false); gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE); gl.disable(gl.CULL_FACE);
  gl.uniformMatrix4fv(up.uVP, false, CAM.VP); gl.uniform3fv(up.uSun, B.S); gl.uniform3fv(up.uCam, cam); gl.uniform3fv(up.uRe, CAM.R); gl.uniform3fv(up.uHo, CAM.U); gl.uniform1f(up.uE, E * (1 - buero * 0)); gl.uniform1f(up.uGk, U.gartenK); gl.uniform1f(up.uS, Math.max(0.08, CAM.S * 0.0042)); gl.uniform1f(up.uZeit, wall); gl.uniform1f(up.uWind, U.RM ? 0 : 1); gl.uniform1f(up.uGross, PFLANZE); gl.uniform1f(up.uFern, fern); gl.uniform1f(up.uEnc, ENC); gl.uniform1f(up.uVis, vis * (1 - ort.bau)); gl.uniform1f(up.uKuehl, kuehl);
  bind(gl, 0, 'r', B.tR, up.uRausch); bind(gl, 3, 'd', B.tD, up.uDim);
  if(ort.bau < 0.995){ gl.bindVertexArray(B.iG.vao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 8, B.nG);
  const yk = Math.atan2(cam[0], cam[2]); if(Math.abs(yk - B.yawS) > 0.04){ B.yawS = yk; const ws = B.P.werke.slice().sort((a, b) => Math.hypot(b.x - cam[0], b.z - cam[2]) - Math.hypot(a.x - cam[0], a.z - cam[2])); let q = 0; for(const w of ws){ B.scratch.set(w.I, q); q += w.I.length; } gl.bindBuffer(gl.ARRAY_BUFFER, B.iP.buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, B.scratch); }
  gl.bindVertexArray(B.iP.vao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 8, B.nP); }
  gl.bindVertexArray(null); gl.depthMask(true); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.activeTexture(gl.TEXTURE0);
}
export { gelaende };
