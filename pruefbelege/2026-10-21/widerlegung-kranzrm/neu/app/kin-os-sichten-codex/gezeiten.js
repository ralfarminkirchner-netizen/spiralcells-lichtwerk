(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const oneDay = 86400000;
  const dayFormat = new Intl.DateTimeFormat('de-DE', {day:'numeric', month:'long', timeZone:'Europe/Berlin'});
  const shortDay = new Intl.DateTimeFormat('de-DE', {day:'2-digit', month:'2-digit', timeZone:'Europe/Berlin'});
  const fullDate = new Intl.DateTimeFormat('de-DE', {day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin'});
  const clockTime = new Intl.DateTimeFormat('de-DE', {hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
  let source, items = [], visible = [], availableDays = [], chosenDay, chosenItem, period = '7';
  const dayKey = value => new Intl.DateTimeFormat('sv-SE', {year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Berlin'}).format(new Date(value));
  const dateForKey = key => new Date(key + 'T12:00:00Z');
  const technical = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b|\b[0-9a-f]{32,64}\b/gi;
  const human = (text, fallback) => {
    const prepared = window.KinSource?.human ? window.KinSource.human(text) : String(text || '').replace(technical, '').replace(/(?:file:\/\/)?\/(?:Users|Volumes|home|private|tmp)\/[^\s<>"`]+/g,'lokaler Speicherort');
    const cleaned = prepared.replace(/\s{2,}/g, ' ').replace(/^[\s·:|—–-]+|[\s·:|—–-]+$/g,'').trim();
    return cleaned || fallback;
  };
  const variantKey = variant => variant.id || variant.key;
  const getVariants = work => Array.isArray(work.variantsRaw) ? work.variantsRaw : [];
  function notify(text) {$('connection-note').textContent = text;}
  function materialLink(key) {
    return key && window.KinSource?.materialUrl ? window.KinSource.materialUrl(key) : 'http://127.0.0.1:8401/';
  }
  function prepare() {
    items = [];
    for (const work of source.works || []) {
      for (const variant of getVariants(work)) {
        const date = new Date(variant.created_at || variant.createdAt || '');
        if (!Number.isFinite(date.getTime())) continue;
        items.push({work, variant, date, day:dayKey(date), key:variantKey(variant)});
      }
    }
    items.sort((a,b) => b.date-a.date);
    const when = new Date(source.fetchedAt || Date.now());
    const current = Number.isFinite(when.getTime()) ? when : new Date();
    const updated = fullDate.format(current);
    notify(source.live ? `SPiRALCELLS gelesen · ${updated} Uhr. Nur gespeicherte Fassungen.` : 'SPiRALCELLS ist gerade nicht lesbar. Keine Quelldaten verfügbar.');
    document.querySelector('.live-dot').classList.toggle('connected', Boolean(source.live));
    applyPeriod();
  }
  function applyPeriod() {
    const current = new Date(source.fetchedAt || Date.now());
    const nowKey = dayKey(Number.isFinite(current.getTime()) ? current : Date.now());
    const nowNoon = dateForKey(nowKey);
    const limit = period === 'all' ? null : dayKey(new Date(nowNoon.getTime() - (Number(period)-1)*oneDay));
    visible = items.filter(item => item.day <= nowKey && (!limit || item.day >= limit));
    availableDays = [...new Set(visible.map(item=>item.day))].sort();
    if (!availableDays.includes(chosenDay)) chosenDay = availableDays[availableDays.length-1];
    document.querySelectorAll('[data-period]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.period===period)));
    renderChart(limit || (availableDays[0] || nowKey), nowKey);
    renderRail(); renderArrivals();
  }
  function renderChart(startKey,endKey) {
    const start = dateForKey(startKey).getTime(), end = dateForKey(endKey).getTime();
    const days = Math.max(1,Math.round((end-start)/oneDay)+1);
    const counts = new Map();
    for (const item of visible) counts.set(item.day,(counts.get(item.day)||0)+1);
    const maximum = Math.max(1,...counts.values());
    const chart=$('tide-chart');
    chart.replaceChildren();
    const svgNode=(type,attributes)=>{
      const element=document.createElementNS('http://www.w3.org/2000/svg',type);
      for(const [key,value] of Object.entries(attributes))element.setAttribute(key,String(value));
      return element;
    };
    const title=svgNode('title',{id:'chart-title'});title.textContent='Zeitverlauf gespeicherter Fassungen';chart.append(title);
    const desc=svgNode('desc',{id:'chart-description'});desc.textContent=`${visible.length} gespeicherte Fassungen vom ${dayFormat.format(dateForKey(startKey))} bis ${dayFormat.format(dateForKey(endKey))}. Die Höhe entspricht der Anzahl pro Tag. Tage unten auswählen.`;chart.append(desc);
    const points=[];
    for(let index=0;index<days;index++){
      const key=dayKey(new Date(start+index*oneDay));
      const count=counts.get(key)||0;
      const x=days===1?500:24+index/(days-1)*952;
      const y=210-(Math.sqrt(count/maximum)*136);
      points.push({x,y,key,count});
    }
    if(visible.length){
      const path=points.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
      chart.append(svgNode('path',{d:`M 0 210 ${path.replace(/^M/,'L')} L 1000 210 Z`,class:'tide-area'}));
      chart.append(svgNode('path',{d:path,class:'tide-line'}));
      for(const point of points){if(!point.count)continue;chart.append(svgNode('line',{x1:point.x,y1:point.y,x2:point.x,y2:210,class:'day-stem'}));chart.append(svgNode('circle',{cx:point.x,cy:point.y,r:2.5,class:'day-point'}));}
      if(chosenDay){
        const offset=Math.round((dateForKey(chosenDay).getTime()-start)/oneDay);
        const x=days===1?500:24+offset/(days-1)*952;
        const y=210-Math.sqrt((counts.get(chosenDay)||0)/maximum)*136;
        chart.append(svgNode('line',{x1:x,y1:10,x2:x,y2:210,class:'selected-stem'}));
        chart.append(svgNode('circle',{cx:x,cy:y,r:5,class:'selected-point'}));
      }
    }
    $('window-summary').textContent=visible.length?`${visible.length} Fassungen · ${new Set(visible.map(item=>item.work.key)).size} Werke`:'In diesem Zeitraum keine gespeicherten Fassungen';
    $('date-span').textContent=`${shortDay.format(dateForKey(startKey))} – ${shortDay.format(dateForKey(endKey))} · Berliner Ortszeit`;
  }
  function renderRail(){
    const rail=$('day-rail');rail.replaceChildren();
    for(const day of availableDays){
      const count=visible.filter(item=>item.day===day).length;
      const button=document.createElement('button');button.type='button';button.className='day-button';button.setAttribute('aria-pressed',String(day===chosenDay));button.setAttribute('aria-label',`${dayFormat.format(dateForKey(day))}, ${count} Fassungen`);
      const date=document.createElement('strong');date.textContent=shortDay.format(dateForKey(day));
      const amount=document.createElement('span');amount.textContent=`${count} ${count===1?'Fassung':'Fassungen'}`;button.append(date,amount);
      button.addEventListener('click',()=>chooseDay(day));rail.append(button);
    }
    const index=availableDays.indexOf(chosenDay);
    $('previous-day').disabled=index<=0;$('next-day').disabled=index<0||index===availableDays.length-1;
    requestAnimationFrame(()=>{const selected=rail.querySelector('[aria-pressed="true"]');if(selected){const x=selected.offsetLeft-rail.offsetLeft-rail.clientWidth/2+selected.clientWidth/2;rail.scrollTo({left:x,behavior:'auto'});}});
  }
  function chooseDay(day){chosenDay=day;chosenItem=null;applyPeriod();}
  function renderArrivals(){
    const list=$('arrival-list');list.replaceChildren();
    const arrivals=visible.filter(item=>item.day===chosenDay);
    $('arrivals-title').textContent=chosenDay?dayFormat.format(dateForKey(chosenDay)):'Keine datierte Fassung';
    $('day-total').textContent=arrivals.length?`${arrivals.length} ${arrivals.length===1?'Fassung':'Fassungen'}`:'';
    if(!arrivals.length){const empty=document.createElement('p');empty.className='empty-note';empty.textContent='Hier bleibt das Ufer leer. Wähle einen anderen Zeitraum.';list.append(empty);hideReading();return;}
    for(const item of arrivals){
      const button=document.createElement('button');button.type='button';button.className='arrival';button.setAttribute('aria-pressed',String(item.key===chosenItem?.key));
      const time=document.createElement('span');time.className='arrival-time';time.textContent=clockTime.format(item.date);
      const label=document.createElement('span');
      const work=document.createElement('span');work.className='arrival-work';work.textContent=human(item.work.title,'Werk ohne Titel');
      const variant=document.createElement('span');variant.className='arrival-label';variant.textContent=human(item.variant.label,'Fassung ohne Bezeichnung');label.append(work,variant);
      const arrow=document.createElement('span');arrow.className='arrival-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');button.append(time,label,arrow);
      button.addEventListener('click',()=>{chosenItem=item;renderArrivals();if(matchMedia('(max-width:700px)').matches)$('reading-content').scrollIntoView({behavior:'smooth',block:'start'});});list.append(button);
    }
    if(!chosenItem||!arrivals.includes(chosenItem))chosenItem=arrivals[0];
    Array.from(list.children).forEach((button,index)=>button.setAttribute('aria-pressed',String(arrivals[index].key===chosenItem.key)));
    showReading(chosenItem);
  }
  function hideReading(){$('reading-empty').hidden=false;$('reading-content').hidden=true;}
  function showReading(item){
    $('reading-empty').hidden=true;$('reading-content').hidden=false;$('source-reader').hidden=true;
    $('reading-work').textContent=human(item.work.title,'Werk ohne Titel');
    $('variant-title').textContent=human(item.variant.label,'Fassung ohne Bezeichnung');
    $('variant-date').textContent=`Gespeichert am ${fullDate.format(item.date)} Uhr`;
    const notes=human(item.variant.notes,'Zu dieser Fassung wurden keine Erläuterungen hinterlegt.');
    $('variant-note').textContent=notes.length>650?notes.slice(0,650)+' …':notes;
    const agent=source.agents?.get(item.variant.author_id);
    $('model-proof').textContent=agent?.agent_type==='model'?'Durch ein Modellkonto eingetragen; Quellinhalt separat lesen':item.variant.contribution?'Beitragsangaben hinterlegt; siehe Quelle':'Nicht gesondert belegt';
    $('open-material').href=materialLink(item.key);
    const variantsByKey=new Map(source.works.flatMap(work=>getVariants(work).map(variant=>[variantKey(variant),variant])));
    const parentOf=variant=>{
      if(variant.derived_from)return {key:variant.derived_from,ambiguous:false};
      const incoming=(source.edges||[]).filter(edge=>edge.edge_type==='erweitert'&&edge.to_variant_id===variantKey(variant));
      return {key:incoming.length===1?incoming[0].from_variant_id:null,ambiguous:incoming.length>1};
    };
    let root=item.variant;
    let parentRef=parentOf(root);
    const visited=new Set();
    while(parentRef.key&&!visited.has(variantKey(root))){
      visited.add(variantKey(root));
      const parent=variantsByKey.get(parentRef.key);
      if(!parent||visited.has(variantKey(parent)))break;
      root=parent;
      parentRef=parentOf(root);
    }
    const rootKey=variantKey(root);
    const unresolvedParent=parentRef.key&&!variantsByKey.has(parentRef.key);
    const cyclicParent=parentRef.key&&visited.has(parentRef.key);
    $('open-root').href=materialLink(unresolvedParent?parentRef.key:rootKey||item.key);
    $('open-root').textContent=unresolvedParent?'Zur belegten Vorgängerfassung ↗':root.source_ref?'Zur Quellfassung ↗':parentRef.ambiguous||cyclicParent?'Zur Fassung am Ende dieser Spur ↗':'Zur Ausgangsfassung dieser Spur ↗';
    const ref=item.variant.source_ref||root.source_ref;
    const sourceName=ref?.title?human(ref.title,'Herkunft in der Fassung'):unresolvedParent?'Vorgänger ist verknüpft; Inhalt hier nicht mitgelesen':parentRef.ambiguous?'Mehrere Herkunftsverweise; keine Ausgangsfassung ausgewählt':cyclicParent?'Kreisförmige Herkunftsverweise; keine Ausgangsfassung ausgewählt':rootKey!==item.key?'Abstammung aus gespeicherten Fassungsverweisen':'Keine weitere Ausgangsfassung hinterlegt';
    $('source-route').textContent=sourceName;
    $('source-text').textContent=typeof item.variant.content==='string'?item.variant.content:'Für diese Fassung ist kein Textinhalt hinterlegt.';
  }
  document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{period=button.dataset.period;applyPeriod();}));
  $('previous-day').addEventListener('click',()=>{const index=availableDays.indexOf(chosenDay);if(index>0)chooseDay(availableDays[index-1]);});
  $('next-day').addEventListener('click',()=>{const index=availableDays.indexOf(chosenDay);if(index>=0&&index<availableDays.length-1)chooseDay(availableDays[index+1]);});
  $('day-rail').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const step=event.key==='ArrowLeft'?-1:1;const index=availableDays.indexOf(chosenDay)+step;if(index>=0&&index<availableDays.length){chooseDay(availableDays[index]);$('day-rail').querySelector('[aria-pressed="true"]')?.focus();}});
  $('read-source').addEventListener('click',()=>{$('source-reader').hidden=false;$('source-reader').scrollIntoView({behavior:'smooth',block:'nearest'});$('source-text').focus({preventScroll:true});});
  function closeReader(){$('source-reader').hidden=true;$('read-source').focus();}
  $('close-source').addEventListener('click',closeReader);$('back-to-desk').addEventListener('click',closeReader);
  Promise.resolve().then(()=>{if(!window.KinSource?.load)throw new Error('no source');return window.KinSource.load();}).then(value=>{source=value;prepare();}).catch(()=>{notify('SPiRALCELLS ist gerade nicht lesbar. Keine Fassungen verfügbar.');$('arrival-list').replaceChildren();const empty=document.createElement('p');empty.className='empty-note';empty.textContent='Der Quellenzugang fehlt. Fassungen können nicht gelesen werden.';$('arrival-list').append(empty);$('window-summary').textContent='Keine Quelldaten verfügbar';});
})();
