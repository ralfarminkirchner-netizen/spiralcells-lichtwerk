/* Der Spiralbaum: Ralfs Werke als Baum, der sich in Spiralen einrollt (Ralf, 08.11.2026: dieser Ansatz, als
   eigene Variante). Jeder Knoten sitzt auf seinem Ast, seine Kinder rollen sich in zwei Armen von ihm weg,
   die größten zuerst. Ein Werk rollt seine Fassungen in einer einzigen Spirale auf, die früheste zuerst,
   belegte Zeit als fester Ast, der Rest gepunktet. Antippen zoomt eine Stufe tiefer. Namen stehen nur dort,
   wo sie lesbar sind, höchstens ZAHL zugleich, nie übereinander. */

import {spiralbaum, zahlWort, zeichenWort, zeitWort} from './stufen-daten.js';

const ZAHL = 20, NS = 'http://www.w3.org/2000/svg';
const $ = s => document.querySelector(s);
const svg = $('#baum'), welt = svg.querySelector('.welt'), aesteG = svg.querySelector('.aeste'), knotenG = svg.querySelector('.knoten'), namenEl = $('#namen');

/* ---------- Lage ---------- */
const alle = [];
// Hochformat (Handy): der Baum wächst nach oben statt zur Seite
const HOCH = innerHeight > innerWidth * 1.2;
function lege(k, x, y, dir, r, eltern, tiefe){
  Object.assign(k, {x, y, r, dir, eltern, tiefe, nr: alle.length}); alle.push(k);
  k.box = [x - r, y - r, x + r, y + r];
  if(!k.kinder || !k.kinder.length) return;
  const kids = k.kinder, blaetter = kids.every(c => c.art === 'fassung');
  const wmax = Math.max(...kids.map(c => c.wert));
  const minF = k.art === 'wurzel' ? 0.26 : blaetter ? 0.1 : 0.14;
  // Die Orte stehen gleich lesbar da, ihre Menge zeigt sich flacher; darunter wächst die Größe mit der Menge
  const rad = k.art === 'wurzel' ? c => r * (0.34 + 0.22 * Math.sqrt(c.wert / wmax))
    : c => r * Math.max(minF, (blaetter ? 0.27 : 0.56) * Math.sqrt(c.wert / wmax));
  const weite = c => rad(c) * (c.kinder && c.kinder.length ? (k.art === 'wurzel' ? 1.75 : 2.6) : 1.5);
  // Ein Werk: eine Spirale. Sonst zwei Arme, abwechselnd links und rechts
  const arme = blaetter ? [kids.map((c, i) => i)] : [kids.map((c, i) => i).filter(i => i % 2 === 0), kids.map((c, i) => i).filter(i => i % 2 === 1)];
  k.stiele = [];
  arme.forEach((arm, a) => {
    if(!arm.length) return;
    const s = blaetter ? 1 : a === 0 ? 1 : -1;
    let d = dir + (blaetter ? 0.2 : s * (k.art === 'wurzel' ? (HOCH ? 0.3 : 1.05) : 0.62)), px = x + Math.cos(d) * r, py = y + Math.sin(d) * r, vor = r * 0.25, drehe = blaetter ? 0.38 : k.art === 'wurzel' ? (HOCH ? 0.1 : 0.42) : 0.32;
    const stiel = {punkte: [[x, y]], breiten: [], saum: []};
    arm.forEach((i, j) => {
      const c = kids[i], cr = rad(c), e = weite(c), schritt = (vor + e) * (blaetter ? 1.05 : 0.95);
      px += Math.cos(d) * schritt; py += Math.sin(d) * schritt;
      stiel.punkte.push([px, py]); stiel.breiten.push(Math.max(cr * 0.55, r * 0.04)); stiel.saum.push(c.art === 'fassung' && !c.datiert);
      lege(c, px, py, d - s * (blaetter ? 0.9 : 1.15), cr, k, tiefe + 1);
      d += s * Math.min(1.05, drehe); drehe += blaetter ? 0.05 : k.art === 'wurzel' ? (HOCH ? 0.07 : 0.2) : 0.12; vor = e;
    });
    k.stiele.push(stiel);
  });
  for(const c of kids){ k.box[0] = Math.min(k.box[0], c.box[0]); k.box[1] = Math.min(k.box[1], c.box[1]); k.box[2] = Math.max(k.box[2], c.box[2]); k.box[3] = Math.max(k.box[3], c.box[3]); }
}

/* ---------- Zeichnen ---------- */
const el = (n, a, p) => { const e = document.createElementNS(NS, n); for(const k in a) e.setAttribute(k, a[k]); if(p) p.appendChild(e); return e; };
function blattPfad(c){
  // ein Blatt: Tropfen in Wuchsrichtung, Spitze nach außen
  const r = c.r, a = c.dir, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
  const P = (s, t) => `${(c.x + ux * s * r + vx * t * r).toFixed(2)} ${(c.y + uy * s * r + vy * t * r).toFixed(2)}`;
  return `M${P(-1, 0)} C${P(-1, 1.1)} ${P(0.9, 1.1)} ${P(1.6, 0)} C${P(0.9, -1.1)} ${P(-1, -1.1)} ${P(-1, 0)}Z`;
}
function zeichne(){
  for(const k of alle){
    for(const st of k.stiele || []){
      for(let i = 1; i < st.punkte.length; i++){
        const [x0, y0] = st.punkte[i - 1], [x1, y1] = st.punkte[i];
        (k.aeste ||= []).push(el('path', {d: `M${x0} ${y0}L${x1} ${y1}`, class: 'ast' + (st.saum[i - 1] ? ' saum' : ''), 'stroke-width': st.breiten[i - 1]}, aesteG));
      }
    }
  }
  for(const k of alle){
    if(k.art === 'fassung'){ const p = el('path', {d: blattPfad(k), class: 'blatt ' + (k.datiert ? 'belegt' : 'offen'), 'stroke-width': k.r * 0.08, 'data-nr': k.nr}, knotenG); k.form = p; continue; }
    const g = el('g', {class: `kn ${k.art}${k.auch && k.auch.length > 1 ? ' verschraenkt' : ''}`, 'data-nr': k.nr}, knotenG);
    el('circle', {cx: k.x, cy: k.y, r: k.art === 'wurzel' ? k.r * 0.3 : k.r, 'stroke-width': k.r * 0.07}, g); k.form = g;
  }
}

/* ---------- Blick ---------- */
let W = innerWidth, H = innerHeight, blick = {x: 0, y: 0, s: 1}, ziel = null, fokus = null, gewaehlt = null;
const SCHMAL = () => W < 600;
const oben = () => (SCHMAL() ? 56 : 70), unten = () => (SCHMAL() ? Math.round(H * 0.46) : 40);
function passend(k){
  const [x0, y0, x1, y1] = k.box, bw = W - 32, bh = H - oben() - unten();
  const s = Math.min(bw / (x1 - x0), bh / (y1 - y0)) * 0.94;
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, s, mx: W / 2, my: oben() + bh / 2};
}
const schirm = (x, y) => [(x - blick.x) * blick.s + (blick.mx ?? W / 2), (y - blick.y) * blick.s + (blick.my ?? H / 2)];
function setze(){ welt.setAttribute('transform', `translate(${(blick.mx ?? W / 2) - blick.x * blick.s} ${(blick.my ?? H / 2) - blick.y * blick.s}) scale(${blick.s})`); beschrifte(); }

function fahre(nach, dauer = 650){
  const von = {...blick, mx: blick.mx ?? W / 2, my: blick.my ?? H / 2}, t0 = performance.now(), ls0 = Math.log(von.s), ls1 = Math.log(nach.s);
  ziel = nach;
  const schritt = now => { if(ziel !== nach) return;
    const t = Math.min(1, (now - t0) / dauer), e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    blick = {x: von.x + (nach.x - von.x) * e, y: von.y + (nach.y - von.y) * e, s: Math.exp(ls0 + (ls1 - ls0) * e), mx: von.mx + (nach.mx - von.mx) * e, my: von.my + (nach.my - von.my) * e};
    setze(); if(t < 1) requestAnimationFrame(schritt); else ziel = null; };
  requestAnimationFrame(schritt);
}

/* ---------- Namen: nur lesbare, höchstens ZAHL, nie übereinander ---------- */
function beschrifte(){
  const kand = [];
  for(const k of alle){
    if(k.art === 'wurzel') continue;
    const [sx, sy] = schirm(k.x, k.y), sr = k.r * blick.s;
    if(sx < -sr || sy < -sr || sx > W + sr || sy > H + sr) continue;
    if(sr < (k.art === 'fassung' ? 9 : 11)) continue;
    // Stufe für Stufe: benannt wird, was auf dieser Stufe steht; Tieferes erst, wenn man selbst hineinzoomt
    const stufe = fokus ? fokus.tiefe + 1 : 1;
    if(k.tiefe > stufe && sr < 40) continue;
    if(fokus && !unterhalb(k, fokus)) continue;   // benannt wird nur, was im gewählten Ort, der App, dem Werk liegt
    kand.push({k, sx, sy, sr});
  }
  // Was im Blick ist, kommt zuerst: Kinder des Fokus vor allem anderen, dann nach Größe
  const nah = c => c.k.eltern === fokus ? 2 : c.k === fokus ? 1.5 : 0;
  kand.sort((a, b) => nah(b) - nah(a) || b.sr - a.sr);
  const belegt = [], html = [];
  const frei = r => r[0] > 4 && r[2] < W - 4 && r[1] > oben() - 20 && r[3] < H - unten() + (SCHMAL() ? 0 : 32) && !belegt.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
  // Die Kreise dieser Stufe bleiben frei, kein Schild deckt sie zu
  for(const c of kand) if(c.k.eltern === fokus && c.sr > 6) belegt.push([c.sx - c.sr * .8, c.sy - c.sr * .8, c.sx + c.sr * .8, c.sy + c.sr * .8]);
  const kreise = belegt.length;
  for(const c of kand){
    if(html.length >= ZAHL) break;
    if(SCHMAL() && c.k.eltern === fokus) continue;   // auf dem Handy stehen sie lesbar in der Liste darunter
    const {k, sx, sy, sr} = c, stufig = k.eltern === fokus, wort = Math.max(...k.name.split(/\s+/).map(w => [...w].length));
    const innen = !stufig && k.art !== 'fassung' && sr >= 40 && (k === fokus || wort * Math.max(13, Math.min(24, sr * 0.21)) * 0.62 < sr * 1.7);
    if(innen){
      const fs = Math.max(13, Math.min(24, sr * 0.21)), breit = sr * 1.75, zeilen = sr >= 62 ? 3 : 1, hoehe = fs * 2.4 + (zeilen > 1 ? 30 : 0);
      const r = [sx - breit / 2, sy - hoehe / 2, sx + breit / 2, sy + hoehe / 2];
      if(!frei(r)) continue; belegt.push(r);
      const unter = zeilen > 1 ? `<span style="font-size:${Math.max(12, fs * 0.62)}px">${esc(zahlWort(k))}<br>${esc(zeichenWort(k.zeichen))}</span>` : '';
      html.push(`<div class="nm innen ${k.art}" style="left:${sx}px;top:${sy}px;width:${breit}px;font-size:${fs}px"><b>${esc(kuerze(k.name, 60))}</b>${unter}</div>`);
      continue;
    }
    if(k === fokus) continue;   // der gewählte Ort steht schon im Pfad und auf der Karte
    // Ein Schild: Name, auf dieser Stufe dazu die Menge. Es sucht sich unter, über, rechts oder links vom Kreis Platz
    const name = kuerze(k.name, 40), menge = stufig ? mengeKurz(k) : '';
    const zeilenName = Math.ceil(Math.min(40, [...name].length) * 8.8 / 184);
    const bw = Math.min(200, Math.max(56, Math.min(184, [...name].length * 8.8), menge.length * 6.7) + 18), bh = 8 + 17 * zeilenName + (menge ? 16 : 0);
    const lagen = [];
    for(const d of [3, 16, 34]) lagen.push([sx - bw / 2, sy + sr + d], [sx - bw / 2, sy - sr - d - bh], [sx + sr + d, sy - bh / 2], [sx - sr - d - bw, sy - bh / 2],
      [sx + sr * .7 + d, sy + sr * .7 + d], [sx - sr * .7 - d - bw, sy + sr * .7 + d], [sx + sr * .7 + d, sy - sr * .7 - d - bh], [sx - sr * .7 - d - bw, sy - sr * .7 - d - bh]);
    let l = lagen.find(([x, y]) => frei([x, y, x + bw, y + bh]));
    // Ein Ding dieser Stufe bleibt nie ohne Namen: zur Not darf sein Schild einen fremden Kreis berühren, nie ein Schild
    if(!l && stufig){ const nurSchilder = belegt.splice(0, kreise); l = lagen.find(([x, y]) => frei([x, y, x + bw, y + bh])); belegt.unshift(...nurSchilder); }
    if(!l) continue;
    belegt.push([l[0], l[1], l[0] + bw, l[1] + bh]);
    html.push(`<div class="nm unter ${k.art}" data-nr="${k.nr}" style="left:${l[0]}px;top:${l[1]}px;width:${bw}px"><b>${esc(name)}</b>${menge ? `<span class="menge">${esc(menge)}</span>` : ''}</div>`);
  }
  namenEl.innerHTML = html.join('');
}
const unterhalb = (k, f) => { for(let q = k; q; q = q.eltern) if(q === f) return true; return false; };
const mengeKurz = k => k.art === 'fassung' ? `${zeichenWort(k.zeichen)} · ${k.datiert ? new Date(k.von).toLocaleDateString('de-DE', {month: 'short', year: 'numeric', timeZone: 'UTC'}) : 'ohne Datum'}`
  : k.art === 'ort' ? `${k.anzahl} ${k.anzahl === 1 ? 'App' : 'Apps'} · ${zeichenWort(k.zeichen)}`
  : k.art === 'buendel' || k.art === 'buendel-fassung' ? `${k.fassungen} Fassungen · ${zeichenWort(k.zeichen)}`
  : `${k.fassungen} ${k.fassungen === 1 ? 'Fassung' : 'Fassungen'} · ${zeichenWort(k.zeichen)}`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const kuerze = (s, n) => [...s].length > n ? [...s].slice(0, n - 1).join('').trimEnd() + '…' : s;

/* ---------- Stufen ---------- */
const STUFE = {wurzel: 'Alle Orte', ort: 'Ort', app: 'App', werk: 'Werk', buendel: '', fassung: 'Fassung'};
function geh(k, sanft = true){
  if(k.art === 'fassung'){ waehle(k); return; }
  fokus = k; gewaehlt && gewaehlt.form.classList.remove('gewaehlt'); gewaehlt = null;
  // Was nicht zum gewählten Ort gehört, tritt zurück
  for(const q of alle){ const drin = unterhalb(q, k) || unterhalb(k, q); q.form.classList.toggle('fern', !drin);
    for(const a of q.aeste || []) a.classList.toggle('fern', !unterhalb(q, k)); }
  const p = passend(k); sanft ? fahre(p) : (blick = p, setze());
  karte(k); pfad(k);
  const teile = []; for(let q = k; q; q = q.eltern) teile.unshift(q.name);
  history.replaceState(null, '', '#' + teile.slice(1).map(encodeURIComponent).join('/'));
}
function waehle(f){
  gewaehlt && gewaehlt.form.classList.remove('gewaehlt');
  gewaehlt = f; f.form.classList.add('gewaehlt');
  if(fokus !== f.eltern){ fokus = f.eltern; fahre(passend(f.eltern)); pfad(f.eltern); }
  $('.karte-name').textContent = f.name;
  $('.karte-menge').textContent = `Fassung in „${f.werk}“ · ${zeichenWort(f.zeichen)} · ${f.datiert ? zeitWort(f).replace('belegt ', 'belegt ') : 'Zeit nicht belegt'}`;
  $('.karte-auch').textContent = '';
  hoch(f.eltern, 'zum Werk'); $('.karte-liste').textContent = '';
}
function karte(k){
  $('.karte-name').textContent = k.art === 'wurzel' ? 'Ralfs Werke, zehn Orte' : k.name;
  const teile = k.art === 'wurzel' ? [`${k.kinder.length} Orte`, `${k.fassungen} Fassungen`, zeichenWort(k.zeichen)] : [zahlWort(k), zeichenWort(k.zeichen), zeitWort(k)];
  if(k.art === 'werk' && k.eigen) teile.unshift('eigenes Material der App');
  if(k.art === 'werk' && k.teile && k.teile.length > 1) teile.push(`${k.teile.length} Teile`);
  $('.karte-menge').textContent = teile.join(' · ');
  const ort = (() => { for(let q = k; q; q = q.eltern) if(q.art === 'ort') return q.name; })();
  const auch = (k.auch || []).filter(o => o !== ort);
  $('.karte-auch').textContent = auch.length ? 'dasselbe Werk auch in ' + auch.join(' · ') : '';
  hoch(k.eltern, k.eltern ? 'eine Stufe hinaus' : '');
  liste(k);
}
/* Die Dinge dieser Stufe als Liste: auf dem Handy der Weg hinein, am Rechner verborgen */
function liste(k){
  const ul = $('.karte-liste'); ul.textContent = ''; ul.scrollTop = 0;
  for(const c of k.kinder || []){
    const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
    const n = document.createElement('b'); n.textContent = c.name; const m = document.createElement('span'); m.textContent = mengeKurz(c);
    const p = document.createElement('i'); p.className = c.art === 'fassung' ? (c.datiert ? 'p belegt' : 'p offen') : 'p'; p.style.setProperty('--g', Math.max(8, Math.min(22, 6 + Math.log10(c.wert) * 3)) + 'px');
    b.append(p, n, m); b.onclick = () => geh(c); li.appendChild(b); ul.appendChild(li);
  }
}
function hoch(k, satz){ const b = $('.hoch'); b.hidden = !k; b.onclick = () => k && geh(k); b.querySelector('.hoch-satz').textContent = satz; }
function pfad(k){
  const nav = $('.pfad'); nav.textContent = '';
  const kette = []; for(let q = k; q; q = q.eltern) kette.unshift(q);
  kette.forEach((q, i) => { if(i){ const t = document.createElement('i'); t.textContent = '›'; nav.appendChild(t); }
    const b = document.createElement('button'); b.type = 'button'; b.textContent = kuerze(q.name, 28); b.onclick = () => geh(q); nav.appendChild(b); });
}

/* ---------- Bedienung: tippen, ziehen, Rad, zwei Finger ---------- */
const zeiger = new Map(); let zug = null, bewegt = false;
let getippt = null;
svg.addEventListener('pointerdown', e => { getippt = e.target.closest('[data-nr]'); svg.setPointerCapture(e.pointerId); zeiger.set(e.pointerId, [e.clientX, e.clientY]); bewegt = false; ziel = null;
  zug = {blick: {...blick, mx: blick.mx ?? W / 2, my: blick.my ?? H / 2}, punkte: new Map(zeiger)}; });
svg.addEventListener('pointermove', e => { if(!zeiger.has(e.pointerId)) return; zeiger.set(e.pointerId, [e.clientX, e.clientY]);
  const a = [...zug.punkte.values()], b = [...zeiger.values()]; if(a.length !== b.length) { zug = {blick: {...blick}, punkte: new Map(zeiger)}; return; }
  const mitte = l => [l.reduce((s, p) => s + p[0], 0) / l.length, l.reduce((s, p) => s + p[1], 0) / l.length];
  const abst = l => l.length > 1 ? Math.hypot(l[0][0] - l[1][0], l[0][1] - l[1][1]) : 1;
  const [ax, ay] = mitte(a), [bx, by] = mitte(b), f = abst(b) / abst(a);
  if(Math.hypot(bx - ax, by - ay) > 6 || Math.abs(f - 1) > .03) bewegt = true;
  if(!bewegt) return; svg.classList.add('zieht');
  const z = zug.blick, s = z.s * f;
  const wx = z.x + (ax - z.mx) / z.s, wy = z.y + (ay - z.my) / z.s;   // Weltpunkt unter der alten Mitte
  blick = {s, mx: z.mx, my: z.my, x: wx - (bx - z.mx) / s, y: wy - (by - z.my) / s}; setze(); });
const los = e => { zeiger.delete(e.pointerId); svg.classList.remove('zieht'); if(zeiger.size) zug = {blick: {...blick}, punkte: new Map(zeiger)};
  else if(!bewegt && getippt) geh(alle[+getippt.dataset.nr]); };
svg.addEventListener('pointerup', los); svg.addEventListener('pointercancel', e => { zeiger.delete(e.pointerId); });
svg.addEventListener('wheel', e => { e.preventDefault(); ziel = null; const f = Math.exp(-e.deltaY * 0.0015), mx = blick.mx ?? W / 2, my = blick.my ?? H / 2;
  const wx = blick.x + (e.clientX - mx) / blick.s, wy = blick.y + (e.clientY - my) / blick.s, s = blick.s * f;
  blick = {s, mx, my, x: wx - (e.clientX - mx) / s, y: wy - (e.clientY - my) / s}; setze(); }, {passive: false});
namenEl.addEventListener('click', e => { const t = e.target.closest('[data-nr]'); if(t) geh(alle[+t.dataset.nr]); });
addEventListener('keydown', e => { if(e.key === 'Escape' && fokus && fokus.eltern) geh(fokus.eltern); });
addEventListener('resize', () => { W = innerWidth; H = innerHeight; if(fokus) { blick = passend(fokus); setze(); } });

/* ---------- Laden ---------- */
(async () => {
  try {
    const g = await (await fetch('/api/graph')).json();
    const baum = spiralbaum(g);
    lege(baum, 0, 0, -Math.PI / 2, 100, null, 0);
    zeichne();
    $('#lade').hidden = true;
    // Ankunft: über den Pfad in der Adresse, sonst ganz außen
    const finde = () => { let k = baum; for(const t of location.hash.slice(1).split('/').filter(Boolean).map(decodeURIComponent)){ const n = (k.kinder || []).find(c => c.name === t); if(!n) break; k = n; } return k; };
    geh(finde(), false);
    addEventListener('hashchange', () => geh(finde()));
  } catch(err){ $('#lade').textContent = 'Der Fundus ist gerade nicht erreichbar.'; console.error(err); }
})();
