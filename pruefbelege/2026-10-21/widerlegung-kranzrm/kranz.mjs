// Nur lesen: Stimmkranz im Netz, alt (26356a7) gegen neu (35c59bc), Schirmgeschwindigkeit, Kopfgröße, Spurlänge, mit echter Kamera (regie, RM=true)
import {readFileSync} from 'node:fs';
const ST = JSON.parse(readFileSync('/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/testdaten/kette-gewebe/state.json', 'utf8'));
for(const ver of ['alt', 'neu']){
  const R = new URL('./' + ver + '/app/', import.meta.url).pathname;
  const {bestand} = await import(R + 'js/daten.js');
  const {Netz, bigHead, baueNetz} = await import(R + 'js/netz.js');
  const {regie} = await import(R + 'js/regie.js');
  const {setCamera, CAM, L, toScreen} = await import(R + 'js/licht.js');
  const {U} = await import(R + 'js/welt.js');
  const B = bestand(ST), N = new Netz(B, JSON.parse(readFileSync(R + 'ordnung.json', 'utf8')));
  const Rm = N.L.mitte.R;
  const kopfW = ver === 'alt' ? Rm * 0.1 : Math.min(Rm * 0.07, 0.65), spurN = ver === 'alt' ? 90 : 30;
  for(const [w, h] of [[800, 600], [1200, 800], [375, 812]]){ CAM.cssW = w; CAM.cssH = h;
    for(const dach of [null, 'mitte']){
      Object.assign(U, {netK: 1, netT: 1, dach, dachK: dach == null ? 0 : 1, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 0, netDir: 1, flug: null, sel: null, hover: null, kelchZeit: 0});
      const cam = regie(U, null, N, true); setCamera(cam, w, h);
      // px/s über einen Umlauf, Kopf 0
      const a = [0,0,0], b = [0,0,0]; let weg = 0, mx = 0; const dt = 0.02;
      for(let t = 0; t < 16; t += dt){ bigHead(N, 0, t, a); bigHead(N, 0, t + dt, b); const p = toScreen(a[0],a[1],a[2]), q = toScreen(b[0],b[1],b[2]); const v = Math.hypot(q[0]-p[0], q[1]-p[1]) / dt; weg += v * dt; mx = Math.max(mx, v); }
      // Kopfgröße auf dem Schirm: Abstand zweier Punkte im Abstand kopfW
      bigHead(N, 0, 0, a); const p0 = toScreen(a[0],a[1],a[2]), p1 = toScreen(a[0]+kopfW, a[1], a[2]);
      // Ausdehnung der Bahn auf dem Schirm
      let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(let t=0;t<16;t+=0.1){ bigHead(N,0,t,a); const p=toScreen(a[0],a[1],a[2]); x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]); }
      console.log(`${ver} ${w}x${h} ${dach ?? 'Überblick'}: Rm=${Rm.toFixed(2)} Kopf ${(Math.hypot(p1[0]-p0[0],p1[1]-p0[1])).toFixed(1)} px, mittel ${(weg/16).toFixed(0)} px/s, max ${mx.toFixed(0)} px/s, Bahn x ${x0.toFixed(0)}..${x1.toFixed(0)} y ${y0.toFixed(0)}..${y1.toFixed(0)}, Spur ${(spurN*0.018).toFixed(2)} s ≈ ${(weg/16*spurN*0.018).toFixed(0)} px`);
    } } }
