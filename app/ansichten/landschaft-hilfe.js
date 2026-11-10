import {ARTWORT, mengenWort, zeitWort} from './inhalt.js';

export const e = (tag, klasse, text) => {
  const n = document.createElement(tag);
  if(klasse) n.className = klasse;
  if(text != null) n.textContent = text;
  return n;
};

export function blaetter(k){
  return k.kinder ? k.kinder.flatMap(blaetter) : [k];
}

export function bildVon(k){
  if(k.bild) return k.bild;
  if(k.bilder?.length) return k.bilder[0];
  const mitBild = blaetter(k).filter(b => b.bilder?.length);
  mitBild.sort((a, b) => (b.von ?? -1) - (a.von ?? -1));
  return mitBild[0]?.bilder[0] || null;
}

export function juengste(k, n = 3, mitBildern = false){
  const gesehen = new Set();
  const folge = blaetter(k).filter(b => !gesehen.has(b.schluessel) && gesehen.add(b.schluessel))
    .sort((a, b) => (b.von != null) - (a.von != null) || (b.von ?? 0) - (a.von ?? 0));
  if(!mitBildern || !folge.length) return folge.slice(0, n);
  // Die jüngste Fassung bleibt zuerst. Daneben stehen jüngste belegte Bilder.
  const auswahl = [folge[0]];
  for(const f of [...folge.filter(f => f.bilder?.length), ...folge]){
    if(auswahl.length >= n) break;
    if(!auswahl.includes(f)) auswahl.push(f);
  }
  return auswahl;
}

/* Nur die gemeinsame Bedienung. Die drei Ansichten ordnen ihren Inhalt selbst. */
export function landschaft(el, K, art, titel, satz, baue){
  const css = e('link'); css.rel = 'stylesheet'; css.href = new URL('./landschaft-stil.css', import.meta.url).href;
  document.head.append(css);
  const vorherTouch = el.style.touchAction; el.style.touchAction = 'pan-y';
  const boden = e('div', 'landschaft landschaft-' + art);
  const raum = e('div', 'landschaft-raum'); raum.tabIndex = 0;
  raum.setAttribute('aria-label', titel + ': Inhalt erkunden');
  boden.append(raum); el.append(boden);
  let ort = null, tot = false;
  let knoepfe = [];

  function auswahl(){
    const k = K.gewaehlt();
    for(const [b, q] of knoepfe){
      b.classList.toggle('ist-gewaehlt', q === k);
      b.classList.toggle('selbes-werk', q !== k && q.schluessel === k.schluessel);
      b.setAttribute('aria-pressed', String(q === k));
    }
  }
  function rand(){
    const r = K.rand();
    Object.assign(raum.style, {top: r.oben + 'px', right: r.rechts + 'px', bottom: r.unten + 'px', left: r.links + 'px'});
  }
  function waehle(q){
    if(q === K.gewaehlt() && !q.kinder) K.oeffne(q);
    else K.waehle(q);
  }
  function knopf(q, klasse, text){
    const b = e('button', klasse, text); b.type = 'button';
    b.setAttribute('aria-label', (ARTWORT[q.art] || '') + ': ' + q.name + (!q.kinder ? '. Wählen, dann erneut öffnen.' : '. Betreten.'));
    b.onclick = () => waehle(q); knoepfe.push([b, q]); return b;
  }
  function bild(q, klasse = ''){
    const f = e('span', 'landschaft-bild ' + klasse), b = bildVon(q);
    if(b){
      const im = new Image(); im.loading = 'lazy'; im.decoding = 'async'; im.alt = 'Bild aus ' + q.name;
      im.src = K.bildUrl(b, 960); f.append(im);
      im.onerror = () => { im.remove(); f.classList.add('ohne-bild'); f.append(e('span', 'papierwort', 'Bild nicht erreichbar')); };
    } else { f.classList.add('ohne-bild'); f.append(e('span', 'papierzeichen', '↳'), e('span', 'papierwort', q.art === 'gespraech' ? 'Gespräch' : 'Ohne Bild')); }
    return f;
  }
  function material(q, klasse = ''){
    const b = knopf(q, 'landschaft-material ' + klasse);
    b.append(bild(q), e('span', 'material-name', q.name), e('span', 'material-zeit', zeitWort(q)));
    return b;
  }
  function textknopf(q, klasse = ''){
    const b = knopf(q, 'landschaft-textknopf ' + klasse);
    b.append(e('span', 'textname', q.name), e('span', 'textmenge', q.kinder ? mengenWort(q) : zeitWort(q)));
    return b;
  }
  const S = {K, e, knopf, bild, material, textknopf, blaetter, juengste, bildVon};

  function zeichne(q){
    knoepfe = []; raum.replaceChildren();
    const kopf = e('header', 'landschaft-kopf'), oben = e('div', 'landschaft-einstieg');
    oben.append(e('span', 'landschaft-art', titel));
    if(q.eltern){ const zurueck = e('button', 'landschaft-zurueck', '← ' + q.eltern.name); zurueck.type = 'button'; zurueck.onclick = () => K.waehle(q.eltern); oben.append(zurueck); }
    const h = e('h1', '', q.art === 'wurzel' ? titel : q.name);
    kopf.append(oben, h, e('p', 'landschaft-satz', q.art === 'wurzel' ? satz : mengenWort(q)));
    raum.append(kopf, baue(q, S));
    if(!(q.kinder || []).length) raum.append(e('p', 'landschaft-leer', 'Hier ist noch kein Material eingeordnet. Über den Weg oben kommst du zurück.'));
    auswahl();
  }
  function zeige(k){
    if(tot) return;
    rand();
    const q = k.kinder ? k : k.eltern || K.inhalt.wurzel;
    if(q !== ort){ ort = q; zeichne(q); raum.scrollTop = 0; }
    else auswahl();
    if(!k.kinder){ const b = knoepfe.find(([b, q]) => q === k)?.[0]; b?.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'}); }
  }
  const ro = new ResizeObserver(rand); ro.observe(el);
  zeige(K.gewaehlt());
  return {zeige, neu(){ if(!tot) { rand(); auswahl(); } }, ende(){ tot = true; ro.disconnect(); boden.remove(); css.remove(); el.style.touchAction = vorherTouch; }};
}
