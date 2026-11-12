/* Lichtgrund · Welten in 3D · Seite und Bedienung. Adresse wie in den Werkansichten: #galaxie/<adresse>?q=<suche> */
import {baueGalaxie, ZENTRALE} from './galaxie.js';

const t0 = performance.now(), $ = s => document.querySelector(s);
const frage = new URLSearchParams(location.search);
const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches || frage.has('ruhig');
const klein = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
const namensAdresse = name => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const leseHash = () => { const roh = decodeURIComponent(location.hash.replace(/^#/, '')), [pfad, f = ''] = roh.split('?'), teile = pfad.split('/').filter(Boolean); return {welt: teile[0] || 'galaxie', adresse: teile.slice(1).join('/'), q: new URLSearchParams(f).get('q') || ''}; };
const Zu = {adresse: '', q: ''};
const hashJetzt = () => '#galaxie' + (Zu.adresse ? '/' + Zu.adresse : '') + (Zu.q ? '?q=' + encodeURIComponent(Zu.q) : '');
const schreibeHash = neu => { const h = hashJetzt(); if(location.hash === h) return; neu ? history.pushState({w: 1}, '', h) : history.replaceState({w: 1}, '', h); };

(async function los(){
  const canvas = $('#buehne');
  let G;
  try { G = await baueGalaxie({canvas, ruhig, klein, erzwingeWebGL: frage.has('webgl'), sterne: Math.max(0, Math.min(2000000, +frage.get('sterne') || 0))}); }
  catch(e){ $('#stand').textContent = 'Dieser Browser kann die Galaxie nicht zeichnen (weder WebGPU noch WebGL 2).'; console.error(e); return; }
  window.__galaxie = G;

  /* Namen im Raum */
  const schilder = G.ziele.map((z, i) => { const b = document.createElement('button'); b.className = 'schild' + (i ? '' : ' kern'); b.type = 'button';
    b.innerHTML = `<span class="art">${z.art === 'Zentrale' ? 'Kern' : 'Sonne'}</span><span class="nm"></span>`; b.querySelector('.nm').textContent = z.name;
    b.setAttribute('aria-label', `${z.name}, ${z.art}. Hinfliegen`); b.addEventListener('click', () => waehle(i, true)); $('#schilder').append(b); return b; });
  /* Namen weichen einander aus: der nähere bleibt an seinem Ort, der fernere rückt darunter */
  const masse = schilder.map(s => ({b: s.offsetWidth || 120, h: s.offsetHeight || 40}));
  G.auf('bild', () => { const b = canvas.clientWidth, h = canvas.clientHeight, gesetzt = [];
    const lage = G.ziele.map((z, i) => { const o = G.weltOrt(z).project(G.camera); return {i, x: (o.x + 1) / 2 * b, y: (1 - o.y) / 2 * h, t: o.z, sicht: o.z < 1 && Math.abs(o.x) < 1.1 && Math.abs(o.y) < 1.1}; }).sort((p, q) => (q.i === G.gewaehlt) - (p.i === G.gewaehlt) || !q.i - !p.i || p.t - q.t);
    for(const l of lage){ const s = schilder[l.i]; s.style.display = l.sicht ? '' : 'none'; if(!l.sicht) continue; if(!masse[l.i].b || masse[l.i].b === 120) masse[l.i] = {b: s.offsetWidth, h: s.offsetHeight};
      const m = masse[l.i], frei = (x, y) => !gesetzt.some(g => x < g.x + g.b + 4 && x + m.b + 4 > g.x && y < g.y + g.h + 2 && y + m.h + 2 > g.y);
      const plaetze = [[l.x + 12, l.y - m.h / 2, 0], [l.x - 12 - m.b, l.y - m.h / 2, 1], [l.x + 12, l.y + 10, 0], [l.x - 12 - m.b, l.y + 10, 1], [l.x + 12, l.y - m.h - 10, 0], [l.x - 12 - m.b, l.y - m.h - 10, 1]];
      const p = plaetze.find(q => frei(q[0], q[1])) || plaetze[0];
      gesetzt.push({x: p[0], y: p[1], b: m.b, h: m.h}); s.style.transform = `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px)`; s.classList.toggle('links', !!p[2]); s.classList.toggle('an', G.gewaehlt === l.i); } });

  function groesse(){ G.groesse(innerWidth, innerHeight, Math.min(devicePixelRatio || 1, klein ? 1.5 : 2)); }
  addEventListener('resize', groesse); groesse();

  /* Wahl, Tafel, Adresse */
  function zeigeTafel(z){ const t = $('#tafel'); if(!z){ t.hidden = true; return; } t.hidden = false;
    $('#tafel-art').textContent = z.art === 'Zentrale' ? 'Kern der Galaxie' : 'Oberdach · Sonne auf dem Arm'; $('#tafel-name').textContent = z.name;
    $('#tafel-text').textContent = 'Apps, Werke und Fassungen dieses Orts erscheinen als Planeten und Monde, sobald der Bestand angeschlossen ist. Hier ist er nicht erreichbar; es wird nichts erfunden.'; }
  function waehle(i, neu){ G.waehle(i); Zu.adresse = i < 0 ? '' : namensAdresse(G.ziele[i].name); schreibeHash(neu); zeigeTafel(i < 0 ? null : G.ziele[i]); $('#fahrt-aus').hidden = true; $('#zurueck').hidden = i < 0; }
  const findeZiel = adr => G.ziele.findIndex(z => namensAdresse(z.name) === adr);
  $('#tafel-zu').addEventListener('click', () => waehle(-1, true)); $('#zurueck').addEventListener('click', () => waehle(-1, true));

  /* Zeiger: Tippen wählt, Ziehen dreht (OrbitControls), Kneifen zoomt */
  let unten = null;
  canvas.addEventListener('pointerdown', e => { unten = {x: e.clientX, y: e.clientY}; if(G.inFahrt) ueberspringe(); });
  canvas.addEventListener('pointerup', e => { if(!unten || Math.hypot(e.clientX - unten.x, e.clientY - unten.y) > 6) return; const r = canvas.getBoundingClientRect(), i = G.treffer((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)); if(i >= 0) waehle(i, true); });
  canvas.addEventListener('wheel', () => { if(G.inFahrt) ueberspringe(); }, {passive: true});
  function ueberspringe(){ G.endeFahrt(true); $('#fahrt-aus').hidden = true; }
  $('#fahrt-aus').addEventListener('click', ueberspringe); $('#fahrt-neu').addEventListener('click', () => { waehle(-1, true); G.starteFahrt(); $('#fahrt-aus').hidden = false; });
  G.auf('fahrt', an => { if(!an) $('#fahrt-aus').hidden = true; });

  /* Suche: bleibt in der Adresse und damit beim Weltwechsel */
  const feld = $('#suche'), liste = $('#treffer');
  function suche(){ const q = feld.value.trim().toLowerCase(); Zu.q = feld.value.trim(); schreibeHash(false); liste.replaceChildren();
    if(!q){ liste.hidden = true; return; } const t = G.ziele.map((z, i) => ({z, i})).filter(x => x.z.name.toLowerCase().includes(q)); liste.hidden = false;
    if(!t.length){ const li = document.createElement('li'); li.className = 'leer'; li.textContent = 'Nichts gefunden. Durchsucht werden hier nur Kern und Oberdächer, der Bestand ist nicht angeschlossen.'; liste.append(li); return; }
    for(const x of t){ const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.textContent = x.z.name; const s = document.createElement('span'); s.textContent = x.z.art; b.append(s); b.addEventListener('click', () => { waehle(x.i, true); liste.hidden = true; }); li.append(b); liste.append(li); } }
  feld.addEventListener('input', suche); feld.addEventListener('keydown', e => { if(e.key === 'Enter'){ const b = liste.querySelector('button'); if(b) b.click(); } if(e.key === 'Escape'){ feld.blur(); liste.hidden = true; } });
  addEventListener('keydown', e => { if(e.target === feld) return; if(e.key === '/'){ e.preventDefault(); feld.focus(); } else if(e.key === 'Escape'){ if(G.inFahrt) ueberspringe(); else waehle(-1, true); } else if(e.key === 'd' && !e.metaKey && !e.ctrlKey) $('#diagnose').hidden = !$('#diagnose').hidden; });

  /* Zurück, Vor, Neuladen, Direktlink */
  function ausAdresse(erst){ const h = leseHash(); Zu.q = h.q; feld.value = h.q; const i = h.adresse ? findeZiel(h.adresse) : -1; Zu.adresse = i < 0 ? '' : h.adresse;
    if(i >= 0){ G.waehle(i); zeigeTafel(G.ziele[i]); $('#zurueck').hidden = false; $('#fahrt-aus').hidden = true; }
    else if(erst && !ruhig){ G.starteFahrt(); $('#fahrt-aus').hidden = false; }
    else { G.waehle(-1); zeigeTafel(null); $('#zurueck').hidden = true; } }
  addEventListener('popstate', () => ausAdresse(false)); addEventListener('hashchange', () => ausAdresse(false));
  ausAdresse(true); history.replaceState({w: 1}, '', hashJetzt()); if(Zu.q) suche();

  $('#stand').textContent = 'Zu sehen: Kern und die sieben Oberdächer. Der Bestand (Apps, Werke, Fassungen) ist hier nicht angeschlossen.';
  let erstes = 0; G.auf('bild', () => { if(!erstes){ erstes = performance.now() - t0; document.body.classList.add('bereit'); }
    if(!$('#diagnose').hidden) $('#diagnose').textContent = `${G.webgpu ? 'WebGPU' : 'WebGL 2'} · ${G.sterne.toLocaleString('de-DE')} Sterne · ${G.fps.toFixed(0)} Bilder je Sekunde · erstes Bild nach ${(erstes / 1000).toFixed(2).replace('.', ',')} s`; });
  window.__mess = () => ({webgpu: G.webgpu, sterne: G.sterne, fps: G.fps, erstesBildMs: erstes});
})();
