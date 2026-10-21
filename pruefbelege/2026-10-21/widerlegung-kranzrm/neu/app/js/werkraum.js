import {loadModel, loadEnvironment, saveBranch, human} from './werkdaten.js';
import {createMycel} from './mycel.js';
import {renderMaterial} from './materialraum.js';

const $ = id => document.getElementById(id);
const KEY = 'spiralcells.werkraum.navigation.v1';
const defaults = {mode:'network',workId:null,variantId:null,compareId:null,view:'spiral',scroll:0,passage:0,viewState:null,networkViewState:null,returnStack:[],locations:{},drafts:{},reduced:null};
let stored;
try { stored=JSON.parse(localStorage.getItem(KEY)||'null'); } catch {}
let state={...defaults,...stored},model,environment,materialView,saving=false,noticeTimer;
state.returnStack=Array.isArray(state.returnStack)?state.returnStack:[];
state.locations=state.locations||{};state.drafts=state.drafts||{};
const media=matchMedia('(prefers-reduced-motion: reduce)');
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{notify('Die Ansicht konnte im Browser nicht gesichert werden. Gespeicherte Fassungen bleiben im Bestand.');}};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=(text,fn,cls)=>{const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n;};
function notify(text){$('notice').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').textContent='',6500);}
function locationKey(){return `${state.variantId}:${state.mode}:${state.mode==='compare'?state.compareId:''}`;}
function remember(){
  if(materialView&&!$('material').hidden){state.scroll=materialView.scroller.scrollTop;state.passage=materialView.passage();}
  if(['read','compare','edit'].includes(state.mode))state.locations[locationKey()]={scroll:state.scroll,passage:state.passage};
}
function snapshot(){remember();return Object.fromEntries(['mode','workId','variantId','compareId','view','scroll','passage','viewState'].map(k=>[k,state[k]]));}
function restoreLocation(){const p=state.locations[locationKey()];state.scroll=p?.scroll??0;state.passage=p?.passage??0;}
function go(change,{push=false,restore=true,bornId}={}){
  if(saving)return;
  if(push)state.returnStack.push(snapshot());else remember();
  if(state.mode==='network')state.networkViewState=state.viewState;
  if(change.mode==='network')change={...change,viewState:state.networkViewState};
  Object.assign(state,change);
  if(restore)restoreLocation();
  persist();render({bornId});
}
function returnToPlace(){
  if(saving)return;
  const previous=state.returnStack.pop();if(!previous)return;
  remember();Object.assign(state,previous);persist();render();
  notify('Vorherige Fassung und Lesestelle wieder geöffnet.');
}
function openWork(workId){
  if(saving)return;
  const work=model.byWork.get(workId);if(!work)return;
  const variant=work.variants.find(v=>v.id===state.variantId)||work.variants.at(-1);
  closeOverlays();go({mode:'cell',workId,variantId:variant?.id??null,compareId:null,viewState:null});
}
function follow(variantId){
  const work=model.workOf(variantId);if(!work)return notify('Diese Fassung ist im verbundenen Bestand nicht erreichbar.');
  go({mode:'read',workId:work.id,variantId,compareId:null,viewState:null},{push:true});
}
function date(v){
  const d=new Date(v.created_at);return Number.isFinite(d.getTime())?`Gespeichert am ${d.toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric'})}`:'Speicherzeit nicht hinterlegt';
}
const scene=createMycel($('field'),$('spatial-labels'),{
  onWork:openWork,
  onVariant:variantId=>go({variantId}),
  onViewChange:viewState=>{state.viewState=viewState;if(state.mode==='network')state.networkViewState=viewState;persist();},
  onError:()=>notify('Die räumliche Grafik ist hier nicht verfügbar. Über „Werke finden“ bleiben alle Materialien zugänglich.')
});
function reduced(){return state.reduced??media.matches;}
scene.setReduced(reduced());$('reduced-motion').checked=reduced();
media.addEventListener('change',()=>{scene.setReduced(reduced());$('reduced-motion').checked=reduced();});
$('reduced-motion').addEventListener('change',e=>{state.reduced=e.target.checked;scene.setReduced(reduced());persist();});
function closeOverlays(){for(const id of ['catalog','guide']){$(id).hidden=true;$(`${id}-toggle`).setAttribute('aria-expanded','false');}}
for(const id of ['catalog','guide']){
  $(`${id}-toggle`).addEventListener('click',()=>{const opening=$(id).hidden;closeOverlays();$(id).hidden=!opening;$(`${id}-toggle`).setAttribute('aria-expanded',String(opening));if(id==='catalog'&&opening)$('work-search').focus();});
  $(`${id}-close`).addEventListener('click',closeOverlays);
}
$('network').addEventListener('click',()=>{closeOverlays();go({mode:'network',viewState:null});});
$('return').addEventListener('click',returnToPlace);
$('zoom-in').addEventListener('click',()=>scene.zoom(1.2));
$('zoom-out').addEventListener('click',()=>scene.zoom(1/1.2));
$('reset-view').addEventListener('click',()=>scene.reset());
$('work-search').addEventListener('input',renderCatalog);
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||saving)return;
  if(!$('catalog').hidden||!$('guide').hidden)return closeOverlays();
  if(['read','compare','edit'].includes(state.mode))go({mode:'cell'});
  else if(state.mode==='cell')go({mode:'network'});
});
function renderCatalog(){
  if(!model)return;
  const query=$('work-search').value.toLocaleLowerCase('de');
  const works=model.works.filter(w=>`${w.title} ${w.variants.map(v=>model.author(v).name).join(' ')}`.toLocaleLowerCase('de').includes(query));
  $('work-count').textContent=`${works.length} von ${model.works.length} Werken`;
  $('work-list').replaceChildren(...works.map(w=>{
    const b=button(w.title,()=>openWork(w.id));
    b.append(el('small','',`${w.variants.length} Fassungen · ${w.relations.length} dokumentierte Werkverbindungen`));return b;
  }));
}
function renderHistory(work,variant){
  const heading=$('focus-heading');heading.replaceChildren(el('span','eyebrow','Ein Werk · seine Entwicklung'),el('h1','',work.title));
  const perspectives=el('div','perspectives');
  for(const [view,title]of [['spiral','Draufsicht'],['chalice','Geschichtskelch']]){
    const b=button(title,()=>go({view,viewState:null}));b.setAttribute('aria-pressed',String(state.view===view));perspectives.append(b);
  }
  heading.append(perspectives);
  const rail=$('history');rail.replaceChildren();
  if(!variant){rail.append(el('p','','Dieses Werk enthält noch keine Fassung.'));return;}
  const selection=el('div','history-selection'),author=model.author(variant),by=el('div','author'),dot=el('i','voice-dot');
  dot.style.setProperty('--voice',author.color);by.append(dot,document.createTextNode(author.name));
  const title=model.title(variant),index=work.variants.findIndex(v=>v.id===variant.id);
  selection.append(by,el('h2','',title),el('p','',`Fassung ${index+1} von ${work.variants.length} · ${date(variant)}`));
  const parents=model.parents(variant);
  if(parents.length)selection.append(el('p','',`Aus ${parents.map(v=>model.title(v)).join(' · ')}`));
  selection.append(button('Material öffnen ↗',()=>go({mode:'read'}),'open-material'));rail.append(selection);
  const legend=el('div','legend-voices');
  const voices=new Map(work.variants.map(v=>{const a=model.author(v);return[a.id||a.name,a];}));
  for(const a of voices.values()){const span=el('span','',a.name),d=el('i','voice-dot');d.style.setProperty('--voice',a.color);span.prepend(d);legend.append(span);}
  rail.append(legend,el('p','history-note','Reihenfolge der Speicherung · Fäden zeigen Abstammung. Abstände sind keine Zeitdauer.'));
  const list=el('div','version-list');list.setAttribute('aria-label','Fassungen dieses Werks');
  work.variants.forEach((v,i)=>{
    const b=button('',()=>go({variantId:v.id}));b.setAttribute('aria-pressed',String(v.id===variant.id));
    const label=el('span','',model.title(v));label.append(el('small','',model.author(v).name));
    b.append(el('span','ordinal',String(i+1).padStart(2,'0')),label);list.append(b);
  });
  rail.append(list);
  if(work.relations.length){
    const relations=el('div','work-relations');relations.append(el('span','eyebrow','In andere Werke'));
    const seen=new Set;
    for(const rel of work.relations){
      const other=rel.fromWork.id===work.id?rel.toWork:rel.fromWork;
      if(seen.has(other.id))continue;seen.add(other.id);
      const destination=rel.fromWork.id===work.id?rel.toVariant:rel.fromVariant;
      relations.append(button(`${other.title} ↗`,()=>follow(destination.id)));
    }
    rail.append(relations);
  }
  requestAnimationFrame(()=>list.querySelector('[aria-pressed=true]')?.scrollIntoView({block:'nearest'}));
}
function render({bornId}={}){
  const material=['read','compare','edit'].includes(state.mode),work=model.byWork.get(state.workId),variant=model.byVariant.get(state.variantId);
  $('room').hidden=material;$('material').hidden=!material;$('return').hidden=!state.returnStack.length;
  document.body.classList.toggle('scene-focus',state.mode==='cell');
  $('network').classList.toggle('active',state.mode==='network');
  $('focus-heading').hidden=state.mode!=='cell';$('history').hidden=state.mode!=='cell';
  if(material&&work&&variant){
    materialView=renderMaterial($('material'),{model,work,variant,compareId:state.compareId,mode:state.mode,scroll:state.scroll,passage:state.passage,draft:state.drafts[state.variantId],
      authorSelection:environment?.authorSelection===true,
      onAction:materialAction,onScroll:position=>{Object.assign(state,position);state.locations[locationKey()]=position;persist();}
    });
    if(state.returnStack.length){
      const b=button('↶ Zurück zur Lesestelle',returnToPlace,'mr-button mr-return');
      $('material').querySelector('.mr-header').prepend(b);
    }
    if(environment?.isTest){const badge=el('span','mr-test-indicator','Getrennte Testumgebung');$('material').querySelector('.mr-breadcrumb').append(badge);}
  }else{
    materialView=null;
    if(state.mode==='cell'&&work)renderHistory(work,variant);
    $('field-caption').replaceChildren(el('span','eyebrow',state.mode==='cell'?'Fassung im Zusammenhang':'Das verbundene Werk'),
      el('p','',state.mode==='cell'?(state.view==='chalice'?'Von unten nach oben: die gespeicherte Entwicklung.':'Von innen nach außen: die gespeicherte Entwicklung.'):'Jede Zelle bewahrt ihr Werden.'),
      el('small','',state.mode==='cell'?'Eine Fassung wählen. Ihr Material öffnen.':'Ein Werk berühren, seine Entwicklung öffnen.'));
    scene.set(model,{workId:state.mode==='cell'?state.workId:null,variantId:state.variantId,view:state.view},{bornId,viewState:state.viewState});
  }
}
async function materialAction(type,payload={}){
  if(saving)return;
  const ownAuthorId=[...model.agents.values()].find(agent=>agent.agent_type==='human'&&agent.handle==='Ralf')?.id||null;
  const sameDraft=(a,b)=>['label','content','notes'].every(k=>a[k]===b[k])
    &&(a.authorId||ownAuthorId)===(b.authorId||ownAuthorId);
  if(type==='draft'){
    const old=state.drafts[state.variantId];
    const unchanged=old&&sameDraft(old,payload);
    state.drafts[state.variantId]={...payload,...(unchanged?{requestId:old.requestId,submission:old.submission}:{})};persist();return;
  }
  if(type==='passage'){state.passage=payload.index;persist();return;}
  if(type==='source'||type==='follow')return follow(payload.variantId);
  if(type==='select'){
    if(model.workOf(payload.variantId)?.id!==state.workId)return follow(payload.variantId);
    return go({mode:'read',variantId:payload.variantId,compareId:null});
  }
  if(type==='back')return go({mode:'cell'});
  if(type==='read')return go({mode:'read'});
  if(type==='compare')return go({mode:'compare',compareId:payload.variantId});
  if(type==='edit')return go({mode:'edit'});
  if(type!=='save')return;
  const sourceId=state.variantId,workId=state.workId;
  const values={label:payload.label,content:payload.content,notes:payload.notes||'',authorId:payload.authorId||null};
  const draft=state.drafts[sourceId],previous=draft?.submission;
  const retry=previous?.request?.sourceId===sourceId&&previous.request.workId===workId
    &&sameDraft(previous.request,values);
  const legacyRequestId=!previous&&draft&&sameDraft(draft,values)?draft.requestId:null;
  // An uncertain save must retry the complete original request, including the
  // versions seen and return position, even after a different comparison/reload.
  const submission=retry?previous:{
    request:{workId,sourceId,...values,requestId:legacyRequestId||`lichtwerk-${crypto.randomUUID()}`,
      seenIds:state.compareId?[state.compareId]:[]},
    origin:{...snapshot(),mode:'read',...(state.locations[`${sourceId}:read:`]||{scroll:0,passage:0})}
  };
  state.drafts[sourceId]={...values,requestId:submission.request.requestId,submission};persist();
  saving=true;
  const roots=[$('room'),$('material')].map(node=>({node,inert:node.inert}));
  const controls=[...document.querySelectorAll('button,input,textarea,select')].map(node=>({node,disabled:node.disabled}));
  const submit=$('material').querySelector('[type=submit]'),submitLabel=submit?.textContent;
  for(const {node} of roots)node.inert=true;
  for(const {node} of controls)node.disabled=true;
  $('material').setAttribute('aria-busy','true');
  if(submit)submit.textContent='Fassung wird gespeichert …';
  let completed=false;
  try{
    const result=await saveBranch(submission.request);
    const updated=await loadModel();model=updated;
    state.returnStack.push(submission.origin);delete state.drafts[sourceId];
    Object.assign(state,{mode:'cell',workId,variantId:result.variant.id,compareId:null,scroll:0,passage:0,
      view:submission.origin.view,viewState:submission.origin.viewState});
    persist();renderCatalog();render({bornId:result.variant.id});
    completed=true;
    notify('Neue Fassung gespeichert. Ihr Herkunftsfaden führt zur Ausgangsfassung.');
  }catch(error){
    notify(error.message||'Die Speicherung wurde nicht bestätigt. Dein Entwurf bleibt erhalten.');
  }finally{
    saving=false;
    for(const {node,inert} of roots)node.inert=inert;
    for(const {node,disabled} of controls)node.disabled=disabled;
    $('material').removeAttribute('aria-busy');
    if(submit){submit.textContent=submitLabel;if(!completed&&submit.isConnected)submit.focus();}
  }
}
window.addEventListener('pagehide',()=>{remember();persist();});
try{
  [model,environment]=await Promise.all([loadModel(),loadEnvironment()]);
  $('environment').textContent=`${environment.name} · ${model.works.length} Werke`;
  if(!model.byWork.has(state.workId)||!model.byVariant.has(state.variantId)){state.mode='network';state.workId=null;state.variantId=null;}
  state.returnStack=state.returnStack.filter(p=>model.byVariant.has(p.variantId));
  renderCatalog();render();persist();
}catch{
  $('load-error').hidden=false;
  $('load-error').querySelector('p').textContent='Der verbundene Datenbestand ist gerade nicht erreichbar. Bitte prüfe, ob SPiRALCELLS läuft, und lade die Ansicht erneut.';
}
