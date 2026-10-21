(() => {
  'use strict';
  const $ = id => document.getElementById(id), human = KinSource.human;
  let data, ordered = [], lens = 'arrival', sector = 0, selected = null, visited = [], ship = {x:50,y:88}, zoom = 1, pan = {x:0,y:0};
  const pageSize = () => window.innerWidth <= 700 ? 6 : 12;
  const date = value => new Date(value).toLocaleDateString('de-DE', {day:'numeric',month:'short'});
  function theme(w) {
    const title = w.title.toLocaleLowerCase('de');
    if (/klang|musik|audio|song|reim|faska|hörni/.test(title)) return 'Klang und Gestaltung';
    if (/atlas|adhs|traum|wahrnehm|phänomen|mind/.test(title)) return 'Wahrnehmen und Fragen';
    if (/kin|tisch|werk|moon|system|spiral/.test(title)) return 'Werk und Verbindung';
    return 'Offene Nachbarschaft';
  }
  function transform() { $('world').style.transform = `translate(${pan.x}px,${pan.y}px) scale(${zoom})`; }
  function reorder() {
    if (!data) return;
    ordered = [...data.works];
    if (lens !== 'arrival') ordered.sort((a,b) => (lens === 'themes' ? theme(a).localeCompare(theme(b),'de') : a.source.localeCompare(b.source,'de')) || a.title.localeCompare(b.title,'de'));
    sector = 0; render();
  }
  function position(i) {
    const mobile = pageSize() === 6, columns = mobile ? 2 : 3;
    return {x: mobile ? 25 + (i%2)*50 : 17 + (i%3)*33, y: mobile ? 23 + Math.floor(i/2)*23 : 19 + Math.floor(i/3)*18};
  }
  function render() {
    $('targets').replaceChildren();
    const size = pageSize(), offset = sector * size;
    ordered.slice(offset,offset + size).forEach((w,i) => {
      const p=position(i), button=document.createElement('button');
      button.className='target'; button.style.left=p.x+'%'; button.style.top=p.y+'%'; button.style.setProperty('--size', Math.min(23,7+Math.sqrt(w.count)*2)+'px');
      button.setAttribute('aria-label', `${w.title}, ${w.count} Fassungen. Als Ziel wählen.`); button.setAttribute('aria-pressed', String(selected?.key===w.key));
      const point=document.createElement('span'); point.className='point'; point.setAttribute('aria-hidden','true');
      const name=document.createElement('span'); name.className='target-title'; name.textContent=w.title.length > 50 ? w.title.slice(0,47)+'…' : w.title;
      button.append(point,name); button.addEventListener('click',()=>choose(w)); $('targets').append(button);
    });
    $('sector').textContent = ordered.length ? `${offset+1}–${Math.min(offset+size,ordered.length)} von ${ordered.length} Werken` : 'Kein lesbarer Bestand';
    $('next-sector').disabled = ordered.length <= size;
    $('empty').hidden = ordered.length > 0;
    $('map-note').textContent = lens==='arrival' ? 'Jüngste Fassungsdaten zuerst · Lage ist eine Leseordnung.' : lens==='themes' ? 'Themen aus Titeln · Ordnungsvorschlag von Codex.' : 'Nach eingetragener Herkunft · keine inhaltliche Nähe.';
    $('lens-reason').textContent = lens==='themes' ? 'Titelwörter schlagen vier Themen vor. Das ist weder eine überprüfte Bedeutung noch eine neue Zuordnung im Bestand.' : lens==='sources' ? 'Die eingetragene Herkunft bestimmt die Reihenfolge. Gleiche Herkunft belegt keine gemeinsame Aussage.' : 'Werke sind nach dem jüngsten gespeicherten Fassungsdatum sortiert. Das Datum belegt keinen neuen lokalen Eingang.';
    if (selected) plotRoute();
  }
  function plotRoute() {
    const i=ordered.findIndex(w=>w.key===selected.key) - sector*pageSize();
    const visible = i>=0 && i<pageSize(), p=visible ? position(i) : ship;
    $('travel-line').setAttribute('d',`M ${ship.x} ${ship.y} L ${p.x} ${p.y}`);
  }
  function choose(w) {
    selected=w; const index=ordered.indexOf(w); sector=Math.floor(index/pageSize());
    $('destination').textContent=w.title;
    $('destination-note').textContent=`${w.count} ${w.count===1?'Fassung':'Fassungen'} · Herkunft ${w.source}. ${lens==='themes'?theme(w)+' ist ein Titelvorschlag.':'Jüngstes Fassungsdatum '+date(w.updated)+'.'}`;
    $('model-state').textContent=w.latest && data.agents.get(w.latest.author_id)?.agent_type==='model' ? 'Jüngste Fassung: Modell' : 'Einzeln prüfen';
    $('land').disabled=!w.latest; $('arrival').hidden=true; $('preparation').hidden=true; render();
  }
  function land() {
    if(!selected?.latest) return;
    const absoluteIndex=ordered.indexOf(selected); sector=Math.floor(absoluteIndex/pageSize()); render();
    const index=absoluteIndex-sector*pageSize(); ship=position(index); $('ship').style.left=ship.x+'%'; $('ship').style.top=ship.y+'%';
    $('arrival').hidden=false; $('material-link').href=KinSource.materialUrl(selected.latest.id);
    $('compare-link').href=KinSource.materialUrl(selected.latest.id,selected.rootVariant?.id); $('compare-link').hidden=selected.rootVariant?.id===selected.latest.id;
    visited=[selected,...visited.filter(w=>w.key!==selected.key)].slice(0,5); $('log').replaceChildren();
    visited.forEach(w=>{const li=document.createElement('li'), b=document.createElement('button'); b.textContent=w.title;b.onclick=()=>{choose(w);land()};li.append(b);$('log').append(li)});
    $('travel-line').setAttribute('d',`M 50 88 L ${ship.x} ${ship.y}`);
  }
  function home() {
    ship={x:50,y:88}; $('ship').style.left='50%'; $('ship').style.top='88%'; zoom=1;pan={x:0,y:0};transform();
    $('travel-line').setAttribute('d','M 50 88 L 50 88'); $('arrival').hidden=true; selected=null;
    $('destination').textContent='Zurück im Heimathafen'; $('destination-note').textContent='Dein Logbuch hält die besuchten Werke für diesen Besuch bereit.'; $('land').disabled=true; $('model-state').textContent='Ziel wählen'; render();
  }
  document.querySelectorAll('[data-lens]').forEach(b=>b.addEventListener('click',()=>{lens=b.dataset.lens;document.querySelectorAll('[data-lens]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));reorder()}));
  $('next-sector').onclick=()=>{sector=(sector+1)%Math.max(1,Math.ceil(ordered.length/pageSize()));render()};
  $('home').onclick=home; $('land').onclick=land;
  $('zoom-in').onclick=()=>{zoom=Math.min(2.5,zoom+.2);transform()}; $('zoom-out').onclick=()=>{zoom=Math.max(.6,zoom-.2);transform()};
  $('voice').onclick=()=>{$('voice-panel').hidden=!$('voice-panel').hidden};
  $('voice-close').onclick=()=>{$('voice-panel').hidden=true;$('voice').focus()};
  $('voice-next').onclick=()=>{if(ordered.length){choose(ordered[(ordered.indexOf(selected)+1)%ordered.length]);land()}};
  $('voice-home').onclick=home; $('prepare').onclick=()=>{$('preparation').hidden=!$('preparation').hidden};
  $('scene').addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey){zoom=Math.max(.6,Math.min(2.5,zoom-e.deltaY*.01))}else{pan.x-=e.deltaX;pan.y-=e.deltaY;pan.x=Math.max(-500,Math.min(500,pan.x));pan.y=Math.max(-400,Math.min(400,pan.y))}transform()},{passive:false});
  let drag=null;
  $('scene').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};$('scene').setPointerCapture(e.pointerId)});
  $('scene').addEventListener('pointermove',e=>{if(!drag)return;pan.x=drag.px+e.clientX-drag.x;pan.y=drag.py+e.clientY-drag.y;transform()});
  $('scene').addEventListener('pointerup',()=>{drag=null});$('scene').addEventListener('pointercancel',()=>{drag=null});
  $('scene').addEventListener('keydown',e=>{if(e.target.closest('button'))return; if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();if(!ordered.length)return;const step=['ArrowLeft','ArrowUp'].includes(e.key)?-1:1;choose(ordered[(ordered.indexOf(selected)+step+ordered.length)%ordered.length])}else if(e.key===' '||e.key==='Enter'){e.preventDefault();land()}else if(e.key.toLowerCase()==='h'||e.key==='Escape'){home()}});
  window.addEventListener('resize',()=>{if(data)render()});
  KinSource.load().then(result=>{data=result;$('source-state').textContent=result.message;reorder();result.works.slice(0,3).forEach(w=>{const b=document.createElement('button'),s=document.createElement('span'),d=document.createElement('small');s.textContent=w.title;d.textContent=date(w.updated);b.append(s,d);b.onclick=()=>{choose(w);$('destination').scrollIntoView({block:'nearest',behavior:'smooth'})};$('radio').append(b)})});
})();
