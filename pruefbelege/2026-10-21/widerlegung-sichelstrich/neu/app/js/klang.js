/* =====================================================================
   KLANG — fünf Töne, die im Einklang aufhören zu schweben (aus dem Lichtwerk).
   Nur die Stimmen, die im Mond sprechen, klingen. Zuschaltbar, nie automatisch.
   ===================================================================== */
import {mix, clamp, CAM} from './licht.js';

const BASEF = [146.83, 220.00, 493.88, 369.99, 329.63], DET = [0, -0.5, 0.65, -0.75, 0.4];
export const AU = {ctx: null, on: false, master: null, v: [], lastSeed: 0, drone: null, noise: null};

function build(){
  const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return false;
  try{ if(navigator.audioSession) navigator.audioSession.type = 'playback'; }catch(e){}
  const ctx = new AC(); AU.ctx = ctx;
  const master = ctx.createGain(); master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
  const verb = ctx.createConvolver(); const len = Math.floor(ctx.sampleRate * 3.4), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for(let ch = 0; ch < 2; ch++){ const d = buf.getChannelData(ch); for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  verb.buffer = buf;
  const wet = ctx.createGain(); wet.gain.value = 0.6; const dry = ctx.createGain(); dry.gain.value = 0.75;
  master.connect(dry); master.connect(verb); verb.connect(wet); dry.connect(comp); wet.connect(comp); comp.connect(ctx.destination);
  AU.master = master;
  for(let i = 0; i < 5; i++){
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = BASEF[i];
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = BASEF[i] * 2.003;
    const g2 = ctx.createGain(); g2.gain.value = 0.10;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600; lp.Q.value = 0.4;
    const g = ctx.createGain(); g.gain.value = 0;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp);
    if(pan){ lp.connect(pan); pan.connect(master); } else lp.connect(master);
    o1.start(); o2.start(); AU.v.push({o1, o2, g, lp, pan});
  }
  const dr = ctx.createOscillator(); dr.type = 'sine'; dr.frequency.value = 73.42; const dg = ctx.createGain(); dg.gain.value = 0; dr.connect(dg); dg.connect(master); dr.start(); AU.drone = dg;
  const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate), nd = nb.getChannelData(0); for(let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nd.length, 3);
  AU.noise = nb;
  return true;
}
export function toggle(){
  if(!AU.ctx && !build()) return false;
  AU.on = !AU.on;
  if(AU.on) AU.ctx.resume(); else { AU.master.gain.setTargetAtTime(0, AU.ctx.currentTime, 0.08); setTimeout(() => { if(!AU.on && AU.ctx) AU.ctx.suspend(); }, 700); }
  return AU.on;
}
export function wake(){ if(AU.on && AU.ctx && AU.ctx.state !== 'running') AU.ctx.resume(); }
document.addEventListener('visibilitychange', () => { if(!AU.ctx) return; if(document.hidden) AU.ctx.suspend(); else if(AU.on) AU.ctx.resume(); });
function ping(f, g, dur){ if(!AU.on) return; const c = AU.ctx, t = c.currentTime;
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; const e = c.createGain(); e.gain.setValueAtTime(0, t);
  e.gain.linearRampToValueAtTime(g, t + 0.006); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(e); e.connect(AU.master); o.start(t); o.stop(t + dur + 0.05); }
function thud(){ if(!AU.on) return; const c = AU.ctx, s = c.createBufferSource(); s.buffer = AU.noise; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  const g = c.createGain(); g.gain.value = 0.22; s.connect(lp); lp.connect(g); g.connect(AU.master); s.start(); }
export const klang = {
  seed(v, locked){ if(!AU.on) return; const now = AU.ctx.currentTime; if(now - AU.lastSeed < (locked ? 0.11 : 0.07)) return; AU.lastSeed = now; ping(BASEF[v] * 2, locked ? 0.012 : 0.02, locked ? 0.5 : 0.32); },
  bell(k){ if(!AU.on) return; const fs = [587.33, 880, 1174.66, 1318.51, 1760], gs = [0.07, 0.04, 0.034, 0.022, 0.014]; for(let i = 0; i < fs.length; i++) ping(fs[i], gs[i] * k, 3.8 - i * 0.5); },
  wurf(){ ping(1318.51, 0.02, 0.6); },
  landung(){ thud(); ping(987.77, 0.03, 1.4); },
  tuer(){ ping(659.25, 0.02, 1.2); },
};
export function klangFrame(Z, U, HP, netK){
  if(!AU.ctx || !AU.on) return; const c = AU.ctx, t = c.currentTime;
  const S = Z ? Z.S : null;
  const mg = S && S.still > 0 ? 0.08 : 0.85 * (U.paused ? 0.3 : 1);
  AU.master.gain.setTargetAtTime(mg, t, S && S.still > 0 ? 0.08 : 0.25);
  const oct = mix(1, 0.5, netK), C = S ? S.C : 0;
  for(let i = 0; i < 5; i++){ const a = AU.v[i];
    if(!Z || !Z.has[i]){ a.g.gain.setTargetAtTime(0, t, 0.2); continue; }
    Z.headPos(i, HP);
    let semi = (DET[i] + 0.2 * Math.sin(S.theta[i] * 0.5)) * (1 - C) + S.kv[i] * 0.5;
    if(i === 2 && S.hopP >= 0) semi += 7 * Math.sin(Math.PI * S.hopP) * (1 - C);
    const f = BASEF[i] * Math.pow(2, semi / 12) * oct;
    a.o1.frequency.setTargetAtTime(f, t, 0.05); a.o2.frequency.setTargetAtTime(f * 2.003, t, 0.05);
    let g = HP[3] * (0.045 + 0.035 * C) * (1 - 0.6 * netK) * U.soloA[i];
    if(i === 1) g *= mix(0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(S.clock * Math.PI * 2 * 6)), 2), 1, C);
    a.g.gain.setTargetAtTime(g, t, 0.06);
    a.lp.frequency.setTargetAtTime(mix(1700, 800, netK) * (0.7 + 0.5 * C), t, 0.2);
    if(a.pan){ const sx = (U.heads[i][0] || 0) / CAM.cssW * 2 - 1; a.pan.pan.setTargetAtTime(clamp(sx * 0.7, -0.9, 0.9), t, 0.1); }
  }
  AU.drone.gain.setTargetAtTime(0.09 * (S ? S.hold : 0), t, 0.2);
}
