'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
  const map = $('map-scroll'), world = $('map-world'), space = $('map-space'), islands = $('islands'), svg = $('voyage-lines');
  let works = [], positions = new Map(), buttons = new Map(), mode = 'theme', selected = null, history = [], visited = new Set(), zoom = 1, dimensions = {width:1600,height:1050};
  const title = work => {
    const raw = window.KinSource.human(work.title || '').trim();
    return raw || 'Werk ohne lesbaren Titel';
  };
  const count = work => Math.max(0, Number.isFinite(Number(work.count)) ? Number(work.count) : (Array.isArray(work.variants) ? work.variants.length : Number(work.variants) || 0));
  function topic(work) {
    const name = title(work).toLocaleLowerCase('de');
    if (/klang|musik|music|audio|reim|song|faska|chor|sound|beat/.test(name)) return 'Klang und Sprache';
    if (/atlas|forsch|phenom|phänom|mind|brain|adhs|psych|trauma|erkennt|durkheim|brown/.test(name)) return 'Wissen und Wahrnehmen';
    if (/game|racer|spiel|jump|godot|welt|raum|space|galax|fingers|atem/.test(name)) return 'Räume und Bewegung';
    if (/kin|moon|system|tisch|werk|os\b|spiral|tool|app|studio/.test(name)) return 'Werkzeuge und Gefüge';
    return 'Offene Gewässer';
  }
  const extent = work => count(work) === 0 ? 'Noch keine Fassung' : count(work) === 1 ? 'Eine Fassung' : count(work) < 4 ? 'Zwei bis drei Fassungen' : 'Vier oder mehr Fassungen';
  function place() {
    const groups = new Map();
    const ordered = [...works].sort((a,b) => mode === 'state' ? count(a)-count(b) || title(a).localeCompare(title(b),'de') : topic(a).localeCompare(topic(b),'de') || title(a).localeCompare(title(b),'de'));
    ordered.forEach(work => { const name = mode === 'theme' ? topic(work) : extent(work); if (!groups.has(name)) groups.set(name,[]); groups.get(name).push(work); });
    positions.clear(); buttons.clear(); islands.replaceChildren();
    const columns = 3, blockWidth = 660, gap = 70, left = 70, top = 75;
    const groupList = [...groups]; const rowHeights = [];
    groupList.forEach(([,members],i) => {const row=Math.floor(i/columns);rowHeights[row]=Math.max(rowHeights[row]||0,95+Math.ceil(members.length/3)*126);});
    groupList.forEach(([name,members],g) => {
      const col=g%columns,row=Math.floor(g/columns),baseX=left+col*(blockWidth+gap),baseY=top+rowHeights.slice(0,row).reduce((a,b)=>a+b+65,0);
      const label=el('div','group-label',name), note=el('span','group-note',members.length+(members.length===1?' Werk':' Werke'));
      label.append(note);label.style.left=(baseX+30)+'px';label.style.top=baseY+'px';islands.append(label);
      members.forEach((work,i) => {
        const x=baseX+35+(i%3)*202+((Math.floor(i/3)%2)*21), y=baseY+90+Math.floor(i/3)*126;
        const key=work.key;positions.set(key,{x:x+77,y:y+44});
        const button=el('button','island');button.type='button';button.style.left=x+'px';button.style.top=y+'px';button.style.setProperty('--land-size',String(.94+Math.min(.22,Math.log2(count(work)+1)*.045)));
        button.append(el('span','island-title',title(work)),el('span','island-count',count(work)+(count(work)===1?' Fassung':' Fassungen')));
        button.setAttribute('aria-pressed',String(key===selected));button.addEventListener('click',()=>visit(key));buttons.set(key,button);islands.append(button);
      });
    });
    dimensions={width:left*2+Math.min(columns,groupList.length)*(blockWidth+gap)-gap,height:top*2+rowHeights.reduce((a,b)=>a+b+65,0)};
    world.style.width=dimensions.width+'px';world.style.height=dimensions.height+'px';svg.setAttribute('width',String(dimensions.width));svg.setAttribute('height',String(dimensions.height));
    scale();updateSelection();drawRoute();
  }
  function scale(){world.style.transform='scale('+zoom+')';space.style.width=Math.ceil(dimensions.width*zoom)+'px';space.style.height=Math.ceil(dimensions.height*zoom)+'px';}
  function focus(key){const p=positions.get(key);if(!p)return;map.scrollTo({left:Math.max(0,p.x*zoom-map.clientWidth/2),top:Math.max(0,p.y*zoom-map.clientHeight/2),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  function drawRoute(){svg.replaceChildren();const keys=[...history,selected].filter(Boolean);for(let i=1;i<keys.length;i++){const a=positions.get(keys[i-1]),b=positions.get(keys[i]);if(!a||!b)continue;const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M ${a.x} ${a.y} Q ${(a.x+b.x)/2} ${(a.y+b.y)/2-65} ${b.x} ${b.y}`);svg.append(path);}}
  function updateSelection(){buttons.forEach((button,key)=>{button.classList.toggle('selected',key===selected);button.classList.toggle('visited',visited.has(key));button.setAttribute('aria-pressed',String(key===selected));});}
  function showHarbour(){const work=works.find(w=>w.key===selected);if(!work)return;$('harbour-title').textContent=title(work);$('voyage-state').textContent=history.length?'Reise · '+(history.length+1)+' besuchte Häfen':'Der erste Hafen';$('harbour-copy').textContent=count(work)+(count(work)===1?' vorhandene Fassung.':' vorhandene Fassungen.')+' Die Inselgröße folgt dem Fassungsumfang. Daraus lässt sich keine technische Prüfung oder menschliche Zustimmung ableiten.';$('back').disabled=!history.length;const link=$('original'),raw=work.rootVariant;const root=typeof raw==='string'?raw:raw?.id||raw?.key||work.variantsRaw?.[0]?.id;if(root&&window.KinSource?.materialUrl){link.href=window.KinSource.materialUrl(root);link.hidden=false;}else{link.hidden=true;link.removeAttribute('href');}}
  function visit(key){if(selected===key){focus(key);return;}if(selected)history.push(selected);selected=key;visited.add(key);if(zoom<.65){zoom=.85;scale();}updateSelection();drawRoute();showHarbour();focus(key);}
  function switchMode(next){mode=next;$('by-theme').classList.toggle('active',mode==='theme');$('by-state').classList.toggle('active',mode==='state');$('by-theme').setAttribute('aria-pressed',String(mode==='theme'));$('by-state').setAttribute('aria-pressed',String(mode==='state'));$('basis').textContent=mode==='theme'?'Lage: UI-Vorschlag nach Werkbezeichnungen.':'Lage: UI-Vorschlag nach Fassungsumfang. Kein Freigabestatus.';place();focus(selected||works[0]?.key);}
  $('by-theme').addEventListener('click',()=>switchMode('theme'));$('by-state').addEventListener('click',()=>switchMode('state'));
  $('zoom-in').addEventListener('click',()=>{zoom=Math.min(1.5,zoom*1.25);scale();focus(selected||works[0]?.key);});$('zoom-out').addEventListener('click',()=>{zoom=Math.max(.25,zoom/1.25);scale();focus(selected||works[0]?.key);});
  $('overview').addEventListener('click',()=>{zoom=Math.max(.18,Math.min(map.clientWidth/dimensions.width,map.clientHeight/dimensions.height));scale();map.scrollTo({top:0,left:0});});
  $('next-island').addEventListener('click',()=>{if(!works.length)return;const keys=[...positions.keys()],index=keys.indexOf(selected);visit(keys[(index+1)%keys.length]);});
  $('back').addEventListener('click',()=>{if(!history.length)return;selected=history.pop();updateSelection();drawRoute();showHarbour();focus(selected);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&history.length){$('back').click();}});
  function unavailable(){ $('source-state').textContent='SPiRALCELLS nicht lesbar';$('empty').textContent='Der Materialbestand ist gerade nicht lesbar. Öffne die Übersicht und lade diesen Entwurf später erneut.';$('harbour-copy').textContent='Es wurden keine Ersatzwerke eingesetzt. Die Karte braucht die vorhandenen Werke und Fassungen aus SPiRALCELLS.';['zoom-in','zoom-out','overview','next-island','by-theme','by-state'].forEach(id=>$(id).disabled=true);}
  async function start(){try{if(!window.KinSource?.load){unavailable();return;}const data=await window.KinSource.load();works=Array.isArray(data.works)?data.works:[];if(!data.live||!works.length){unavailable();return;}$('empty').hidden=true;$('source-state').textContent='SPiRALCELLS live · '+works.length+' Werke';place();zoom=map.clientWidth<600?.9:.85;scale();focus(works[0]?.key);}catch(_error){unavailable();}}
  start();
})();
