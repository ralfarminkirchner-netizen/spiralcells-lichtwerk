/* Die Bühne: eine Fläche, in die man hineingeht. Ziehen verschiebt, Rad und zwei Finger kommen näher,
   ein Tipp wählt. Jede gezeichnete Ansicht benutzt dieselbe Bühne, damit sich alle gleich anfühlen. */

const ruhig = matchMedia('(prefers-reduced-motion: reduce)');

export function buehne(el, {zeichne, tipp, schwebe, lebendig = () => false}){
  const c = document.createElement('canvas'); c.className = 'flaeche'; c.setAttribute('aria-hidden', 'true'); el.appendChild(c);
  const x = c.getContext('2d');
  const B = {c, x, w: 1, h: 1, dpr: 1, cx: 0, cy: 0, s: 1, sMin: 0.2, sMax: 170, rand: {oben: 0, unten: 0, links: 0, rechts: 0}, ruhig: () => ruhig.matches, zeit: 0};
  let dran = false, flug = null, tot = false, bild = 0;

  B.zuX = wx => (wx - B.cx) * B.s + B.w / 2; B.zuY = wy => (wy - B.cy) * B.s + B.h / 2;
  B.vonX = px => (px - B.w / 2) / B.s + B.cx; B.vonY = py => (py - B.h / 2) / B.s + B.cy;
  B.neu = () => { if(!dran && !tot){ dran = true; requestAnimationFrame(lauf); } };

  /* Der Blick, der einen Rahmen ganz zeigt, mit Platz für das, was darüber liegt (Leiste, Karte) */
  B.blickAuf = (r, luft = 1.08) => {
    const {oben, unten, links, rechts} = B.rand, bw = Math.max(40, B.w - links - rechts), bh = Math.max(40, B.h - oben - unten);
    const s = Math.min(B.sMax, bw / ((r.x1 - r.x0) * luft), bh / ((r.y1 - r.y0) * luft));
    return {s, cx: (r.x0 + r.x1) / 2 - ((links - rechts) / 2) / s, cy: (r.y0 + r.y1) / 2 - ((oben - unten) / 2) / s};
  };
  B.setze = z => { B.cx = z.cx; B.cy = z.cy; B.s = z.s; flug = null; B.neu(); };
  /* Hinfliegen: erst weiter weg, dann näher, wie ein Blick, der sich neu einstellt */
  B.fliege = (z, dauer = 900) => {
    if(B.ruhig() || dauer <= 0) return B.setze(z);
    const d = Math.hypot(z.cx - B.cx, z.cy - B.cy) * Math.min(B.s, z.s), weit = Math.min(1, d / (Math.max(B.w, B.h) * 1.2));
    flug = {t0: performance.now(), dauer: dauer * (0.75 + weit * 0.6), a: {cx: B.cx, cy: B.cy, s: B.s}, z, weit}; B.neu();
  };
  B.fliegt = () => !!flug;

  function lauf(t){
    dran = false; if(tot) return; B.zeit = t;
    if(flug){
      const u = Math.min(1, (t - flug.t0) / flug.dauer), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      const ls = Math.log(flug.a.s) + (Math.log(flug.z.s) - Math.log(flug.a.s)) * e - Math.sin(Math.PI * e) * flug.weit * 0.55;
      B.s = Math.exp(ls); B.cx = flug.a.cx + (flug.z.cx - flug.a.cx) * e; B.cy = flug.a.cy + (flug.z.cy - flug.a.cy) * e;
      if(u >= 1) flug = null;
    }
    const leb = lebendig() && !B.ruhig();
    if(!leb || flug || (bild++ & 1) === 0 || zieh){   // lebendig: jedes zweite Bild reicht für den Wind
      x.setTransform(B.dpr, 0, 0, B.dpr, 0, 0); zeichne(B, t);
    }
    if(flug || leb) B.neu();
  }

  function masse(){
    const r = el.getBoundingClientRect(); B.w = Math.max(1, r.width); B.h = Math.max(1, r.height); B.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    c.width = Math.round(B.w * B.dpr); c.height = Math.round(B.h * B.dpr); B.neu();
  }
  const ro = new ResizeObserver(() => { const w = B.w, h = B.h; masse(); if(B.beiGroesse && (w !== B.w || h !== B.h)) B.beiGroesse(); }); ro.observe(el); masse();

  // Zeiger: einer zieht, zwei kommen näher; ein kurzer Druck ohne Weg ist ein Tipp
  const zeiger = new Map(); let zieh = null, weg = 0, abstand = 0;
  const ort = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const naeher = (px, py, f) => { const wx = B.vonX(px), wy = B.vonY(py), s = Math.max(B.sMin, Math.min(B.sMax, B.s * f)); B.cx = wx - (px - B.w / 2) / s; B.cy = wy - (py - B.h / 2) / s; B.s = s; flug = null; B.neu(); };
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); zeiger.set(e.pointerId, ort(e)); flug = null;
    if(zeiger.size === 1){ zieh = {p: ort(e), t: performance.now()}; weg = 0; } else if(zeiger.size === 2){ const [a, b] = [...zeiger.values()]; abstand = Math.hypot(a[0] - b[0], a[1] - b[1]); weg = 99; } });
  c.addEventListener('pointermove', e => {
    const p = ort(e);
    if(!zeiger.has(e.pointerId)){ if(schwebe && e.pointerType === 'mouse') schwebe(p[0], p[1]); return; }
    const alt = zeiger.get(e.pointerId); zeiger.set(e.pointerId, p);
    if(zeiger.size === 1){ const dx = p[0] - alt[0], dy = p[1] - alt[1]; weg += Math.abs(dx) + Math.abs(dy); if(weg > 6){ B.cx -= dx / B.s; B.cy -= dy / B.s; c.classList.add('zieht'); B.neu(); } }
    else if(zeiger.size === 2){ const [a, b] = [...zeiger.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = (p[0] - alt[0]) / 2, dy = (p[1] - alt[1]) / 2; B.cx -= dx / B.s; B.cy -= dy / B.s; if(abstand > 0) naeher(mx, my, d / abstand); abstand = d; }
  });
  const los = e => { if(!zeiger.has(e.pointerId)) return; const p = zeiger.get(e.pointerId); zeiger.delete(e.pointerId); c.classList.remove('zieht');
    if(zeiger.size === 0){ if(zieh && weg <= 6 && performance.now() - zieh.t < 600 && e.type === 'pointerup') tipp(p[0], p[1], e); zieh = null; } };
  c.addEventListener('pointerup', los); c.addEventListener('pointercancel', los);
  c.addEventListener('pointerleave', () => schwebe && schwebe(-1, -1));
  c.addEventListener('wheel', e => { e.preventDefault(); const [px, py] = ort(e);
    if(e.ctrlKey || e.deltaMode !== 0 || (Math.abs(e.deltaX) < 1 && Math.abs(e.deltaY) >= 40)) naeher(px, py, Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0022)));
    else if(e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.6){ B.cx += e.deltaX / B.s; B.cy += e.deltaY / B.s; flug = null; B.neu(); }
    else naeher(px, py, Math.exp(-e.deltaY * 0.006)); }, {passive: false});
  c.addEventListener('dblclick', e => { const [px, py] = ort(e); const wx = B.vonX(px), wy = B.vonY(py); B.fliege({cx: wx, cy: wy, s: Math.min(B.sMax, B.s * 2.2)}, 450); });

  B.ende = () => { tot = true; ro.disconnect(); c.remove(); };
  return B;
}

/* Bilder: klein aus der Ferne, scharf von nah; nur was zu sehen ist, wird geholt */
export function bildlager(url, grenze = 500){
  const lager = new Map(); let laufend = 0; const warten = [];
  const hole = e => { laufend++; const i = new Image(); i.decoding = 'async';
    i.onload = () => { e.bild = i; e.da = performance.now(); fertig(); }; i.onerror = () => { e.fehlt = true; fertig(); }; i.src = e.url; };
  const fertig = () => { laufend--; L.beiBild && L.beiBild(); while(laufend < 6 && warten.length) hole(warten.pop()); };
  const L = {
    /* gibt das Bild, wenn es da ist; sonst wird es geholt und null kommt zurück */
    nimm(b, breit){ const k = b.pfad + '|' + breit; let e = lager.get(k);
      if(!e){ e = {url: url(b, breit), bild: null}; lager.set(k, e); if(lager.size > grenze){ const erster = lager.keys().next().value; lager.delete(erster); }
        if(laufend < 6) hole(e); else warten.push(e); }
      else { lager.delete(k); lager.set(k, e); }
      return e.bild ? e : null; },
    beiBild: null
  };
  return L;
}
