import {P,L,CAM,setCamera,toScreen,lichtmaschine,lin,hash,TAU,sm5,mix} from './licht.js';

const seed = str => [...str].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,17);
const lerp3 = (a,b,t) => a.map((x,i)=>mix(x,b[i],t));
const add = (a,b) => a.map((x,i)=>x+b[i]);
const white = lin('#e5f3dc');
const thread = lin('#b2c8b5');
export function nearestProjectedVariant(points,x,y,fallback=null) {
  let nearest=fallback,distance=Infinity;
  for(const point of points){
    const d=(point.x-x)**2+(point.y-y)**2;
    if(Number.isFinite(d)&&d<distance){distance=d;nearest=point.id;}
  }
  return nearest;
}
export function makeLayout(model) {
  const nodes = model.works.map((work,i)=>{
    const s=seed(work.id);
    return {work,s,x:(hash(s)-.5)*25,y:(hash(s+8)-.5)*15,z:(hash(s+3)-.5)*2,
      r:.4+Math.min(1.0,Math.log2(work.variants.length+1)*.14),v:[0,0]};
  });
  const map=new Map(nodes.map(n=>[n.work.id,n]));
  const pairs=new Map();
  for(const rel of model.relations) {
    const a=map.get(rel.fromWork.id),b=map.get(rel.toWork.id);
    if(a&&b&&a!==b) pairs.set([a.work.id,b.work.id].sort().join('|'),[a,b]);
  }
  for(let k=0;k<240;k++){
    for(const n of nodes)n.v=[-n.x*.0025,-n.y*.004];
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||.01;
      const f=Math.min(.5,(a.r+b.r+.4)**2/(d*d)*.032);
      a.v[0]+=dx/d*f;a.v[1]+=dy/d*f;b.v[0]-=dx/d*f;b.v[1]-=dy/d*f;
    }
    for(const [a,b] of pairs.values()){
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,f=(d-3)*.011;
      a.v[0]+=dx/d*f;a.v[1]+=dy/d*f;b.v[0]-=dx/d*f;b.v[1]-=dy/d*f;
    }
    for(const n of nodes){n.x+=n.v[0];n.y+=n.v[1];}
  }
  return {nodes,map,pairs:[...pairs.values()]};
}

// Ordinal geometry, explicitly not a metric of elapsed time or quality.
export function historyPoint(index,count,chalice=0) {
  const t=count<2?.5:index/(count-1),a=t*TAU*(count>30?4:2.25)-1.5;
  const r=.35+1.78*Math.sqrt(t);
  const top=[Math.cos(a)*r,Math.sin(a)*r,.15*Math.sin(a*1.3)];
  const cup=[Math.cos(a)*(.48+t*1.75),t*4-2,Math.sin(a)*(.48+t*1.75)];
  return lerp3(top,cup,chalice);
}

export function createMycel(canvas,labels,{onWork,onVariant,onViewChange,onError}) {
  let model,layout,current={workId:null,variantId:null,view:'spiral'},reduced=false;
  let W=innerWidth,H=innerHeight,frame=0,zoom=1,pan=[0,0],yaw=0;
  let transition=null,focus=0,cup=0,center=[0,0,0],born=null;
  let projectedVariants=[];
  let engine;
  try{engine=lichtmaschine(canvas,onError);}catch(e){onError(e);return {set(){},setReduced(){},reset(){},zoom(){},dispose(){}};}
  const buttons=new Map();
  function point(p,size,col,alpha){P(...p,size,...col,alpha);}
  function curve(a,b,col,alpha,width=.025,bend=.1,progress=1){
    const d=Math.hypot(...a.map((v,i)=>v-b[i]));
    const N=Math.max(28,Math.ceil(d*33));
    for(let j=0;j<=N*progress;j++){
      const t=j/N,p=lerp3(a,b,t),s=Math.sin(t*Math.PI);
      p[0]+=s*bend;p[1]+=s*.12;p[2]+=s*.35;
      point(p,width,col,alpha);
    }
  }
  function authorColor(v){return lin(model.author(v).color);}
  function cell(n,alpha,scale=1,detail=0){
    const s=n.s,r=n.r*scale,c=[n.x,n.y,n.z],cA=authorColor(n.work.variants.at(-1));
    const sx=.82+hash(s+7)*.48,sy=.68+hash(s+13)*.42,rot=hash(s+9)*TAU;
    // Stable, folded membranes. Tissue is entirely local to this work.
    const turns=detail?36:12,steps=detail?280:80;
    for(let ring=0;ring<turns;ring++){
      const q=ring/(turns-1),lat=(q-.5)*Math.PI,rr=Math.cos(lat);
      for(let j=0;j<steps;j++){
        const a=j/steps*TAU,fold=1+.10*Math.sin(a*3+s)+.055*Math.cos(a*5+s/2);
        let x=Math.cos(a)*rr*r*sx*fold,y=Math.sin(a)*rr*r*sy*fold;
        const p=[c[0]+x*Math.cos(rot)-y*Math.sin(rot),c[1]+x*Math.sin(rot)+y*Math.cos(rot),c[2]+Math.sin(lat)*r*.39];
        point(p,detail?.017:.029,cA,alpha*(.2+.6*Math.abs(Math.sin(lat))));
      }
    }
    const vars=n.work.variants,voices=[...new Set(vars.map(v=>model.author(v).id))];
    for(let k=0;k<Math.min(voices.length,7);k++){
      const v=vars.find(v=>model.author(v).id===voices[k]),col=authorColor(v);
      for(let j=0;j<220;j++){
        const t=j/219,a=t*TAU*2.6+k*.46,rho=r*(.12+.75*t),x=Math.cos(a)*rho,y=Math.sin(a)*rho*.82;
        point([c[0]+x,c[1]+y,c[2]+.1*Math.sin(a)],.029,col,alpha*.8);
      }
    }
  }
  function button(key,name,fn,className){
    let el=buttons.get(key);
    if(!el){
      el=document.createElement('button');el.className=className;el.addEventListener('click',fn);
      el.setAttribute('aria-label',name);labels.append(el);buttons.set(key,el);
    }
    el.hidden=false;return el;
  }
  function place(el,p){const [x,y,z]=toScreen(...p);el.style.left=`${x}px`;el.style.top=`${y}px`;el.hidden=z<0||x<-80||x>W+80||y<75||y>H-50;return[x,y];}
  function selectVariant(event,explicitId){
    // Keyboard and assistive clicks belong to their focused, named button.
    if(event.detail===0){onVariant(explicitId);return;}
    const rect=canvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)*W/rect.width,y=(event.clientY-rect.top)*H/rect.height;
    const id=nearestProjectedVariant(projectedVariants,x,y,explicitId);
    buttons.get(`v:${id}`)?.focus({preventScroll:true});
    onVariant(id);
  }
  function draw(now=performance.now()){
    frame=0;if(!model||document.querySelector('#room')?.hidden)return;
    if(transition){
      const raw=Math.min(1,(now-transition.start)/transition.duration),t=sm5(raw);
      focus=mix(transition.a.focus,transition.b.focus,t);
      cup=mix(transition.a.cup,transition.b.cup,t);
      center=lerp3(transition.a.center,transition.b.center,t);
      if(raw===1)transition=null;
    }
    W=canvas.clientWidth;H=canvas.clientHeight;CAM.cssW=W;CAM.cssH=H;
    const mobile=W<800;
    // On a narrow screen the history lives between the heading and bottom rail.
    // Fit its width as well as its height; projection offsets are screen-relative.
    const mobileDist=Math.max(17,9.3*H/Math.max(320,W));
    const networkDist=(mobile?43:31)/zoom,focusDist=(mobile?mobileDist:9.3)/zoom;
    setCamera({target:[center[0]+pan[0],center[1]+pan[1],center[2]],dist:mix(networkDist,focusDist,focus),
      pitch:mix(.11,.13*cup,focus),yaw:yaw*focus,fov:.72,shift:mobile?.18*focus:0,shiftX:mobile?0:.13*focus,S:1},W,H);
    engine.resize();L.pc=0;
    projectedVariants=[];
    for(const el of buttons.values())el.hidden=true;
    const focused=layout.map.get(current.workId),base=focused?[focused.x,focused.y,focused.z]:[0,0,0];
    for(const [a,b]of layout.pairs){
      const involved=a===focused||b===focused;
      const alpha=(1-focus)*.19+(involved?.11:0)*focus;
      for(let strand=0;strand<3;strand++){
        curve([a.x,a.y,a.z],[b.x,b.y,b.z],thread,alpha,.025,(strand-1)*.15);
      }
    }
    const named=new Set([...layout.nodes].sort((a,b)=>b.work.relations.length-a.work.relations.length||b.work.variants.length-a.work.variants.length).slice(0,mobile?7:19).map(n=>n.work.id));
    for(const n of layout.nodes){
      if(n===focused&&focus>.01)continue;
      cell(n,(1-focus)*.74+.025,1,0);
      if(focus<.2){
        const isNamed=named.has(n.work.id),el=button(n.work.id,`${n.work.title} · ${n.work.variants.length} Fassungen`,()=>onWork(n.work.id),'cell-label');
        el.classList.toggle('named',isNamed);el.style.setProperty('--voice',model.author(n.work.variants.at(-1)).color);
        if(!el.firstChild){const span=document.createElement('span');span.textContent=n.work.title;const small=document.createElement('small');small.textContent=`${n.work.variants.length} Fassungen`;el.append(span,small);}
        place(el,[n.x,n.y-n.r*.9,n.z]);el.style.opacity=1-focus*4;
      }
    }
    if(focused&&focus>0){
      // The original membrane expands into the history, maintaining its center.
      const expanded={...focused,r:mix(focused.r,2.6,focus)};
      cell(expanded,focus*(1-cup)*.42,1,1);
      const vars=focused.work.variants,N=vars.length,col=authorColor(vars.at(-1));
      if(cup>0){
        for(let j=0;j<42;j++)for(let i=0;i<150;i++){
          const t=i/149,a=j/42*TAU+.35*t,r=(.48+t*1.75)*(1+.028*Math.sin(a*5+t*9));
          point(add(base,[Math.cos(a)*r,t*4-2,Math.sin(a)*r]),.015,col,focus*cup*.28);
        }
      }
      // A faint continuous ordering thread is distinct from brighter ancestry.
      for(let i=0;i<Math.max(300,N*12);i++){
        const t=i/(Math.max(300,N*12)-1),p=historyPoint(t*(N-1),N,cup);
        point(add(base,p),.022,col,focus*.48);
      }
      const positions=new Map(vars.map((v,i)=>[v.id,historyPoint(i,N,cup)]));
      for(const v of vars){
        const child=positions.get(v.id);
        for(const parent of model.parents(v)){
          const pp=positions.get(parent.id);if(!pp)continue;
          const selected=v.id===current.variantId||parent.id===current.variantId;
          const isBorn=born?.id===v.id;
          const progress=isBorn?Math.min(1,(now-born.start)/1100):1;
          curve(add(base,pp),add(base,child),white,focus*(selected?.75:.17),selected?.035:.018,.15,progress);
        }
      }
      vars.forEach((v,i)=>{
        const p=add(base,positions.get(v.id)),selected=v.id===current.variantId,vc=authorColor(v);
        const size=selected?.14:.075;
        point(p,size,vc,focus*2.4);
        if(selected){
          for(let j=0;j<70;j++){const a=j/70*TAU;point(add(p,[Math.cos(a)*.16,Math.sin(a)*.16,0]),.022,white,focus);}
        }
        if(focus>.8){
          const el=button(`v:${v.id}`,`${i+1}. ${model.title(v)} · ${model.author(v).name}`,event=>selectVariant(event,v.id),'version-dot');
          el.textContent=String(i+1);el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));
          const [x,y]=place(el,p);
          if(!el.hidden)projectedVariants.push({id:v.id,x,y});
        }
      });
    }
    engine.render(0,{neb:.035,thr:.7,bloom:.48,exp:1.2,par:[0,0],grain:.018,still:true});
    if(born&&now-born.start>1300)born=null;
    if(transition||born)frame=requestAnimationFrame(draw);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
  function targetState(workId,view){
    const n=layout?.map.get(workId);
    return {focus:n?1:0,cup:view==='chalice'?1:0,center:n?[n.x,n.y,n.z]:[0,0,0]};
  }
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,pan:[...pan],yaw};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
    if(!drag)return;
    if(current.workId){yaw=drag.yaw+(e.clientX-drag.x)*.003;}
    else{pan=[drag.pan[0]-(e.clientX-drag.x)*.025/zoom,drag.pan[1]+(e.clientY-drag.y)*.025/zoom];}
    schedule();
  });
  canvas.addEventListener('pointerup',()=>{drag=null;onViewChange?.({zoom,pan,yaw});});
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(2.5,zoom*Math.exp(-e.deltaY*.001)));schedule();onViewChange?.({zoom,pan,yaw});},{passive:false});
  const resize=()=>schedule();window.addEventListener('resize',resize);
  return{
    set(nextModel,state,{animate=true,bornId,viewState}={}){
      if(nextModel!==model){
        model=nextModel;layout=makeLayout(model);
        for(const el of buttons.values())el.remove();buttons.clear();
      }
      const changed=state.workId!==current.workId||state.view!==current.view;
      current={...state};
      if(changed){pan=[0,0];zoom=1;yaw=0;}
      if(viewState){zoom=viewState.zoom||1;pan=viewState.pan||[0,0];yaw=viewState.yaw||0;}
      const b=targetState(current.workId,current.view);
      if(changed&&animate&&!reduced)transition={a:{focus,cup,center:[...center]},b,start:performance.now(),duration:880};
      else{({focus,cup,center}=b);transition=null;}
      if(bornId&&!reduced)born={id:bornId,start:performance.now()};
      schedule();
    },
    setReduced(value){reduced=value;if(reduced){transition=null;born=null;Object.assign({},current);if(layout)({focus,cup,center}=targetState(current.workId,current.view));}schedule();},
    reset(){zoom=1;pan=[0,0];yaw=0;schedule();onViewChange?.({zoom,pan,yaw});},
    zoom(factor){zoom=Math.max(.55,Math.min(2.5,zoom*factor));schedule();onViewChange?.({zoom,pan,yaw});},
    dispose(){cancelAnimationFrame(frame);window.removeEventListener('resize',resize);}
  };
}
