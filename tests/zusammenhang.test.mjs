import test from 'node:test';
import assert from 'node:assert/strict';
import {teilnahmen, entstehung, ursprung} from '../app/js/zusammenhang.js';

function quellfassung(){
  const source = {kind:'chronology', key:'chat:original', offset:0, source_revision_id:'rev_archiv'};
  const passage = {start:180, end:185, quote:'Tor😀'};
  const u = new URL('http://127.0.0.1:53450/?day=2026-06-09');
  u.searchParams.set('quelle',JSON.stringify(source));
  u.searchParams.set('stelle',JSON.stringify(passage));
  u.searchParams.set('fassung','originalfassung');
  return {id:'werkfassung',worktree_id:'baum-material',label:'Lesekarte',content:'Eigene Bearbeitung',
    source_ref:{system:'lebensspirale',kind:'chronology-original',
      source_id:'chat:original@rev_archiv#180-185@0123456789abcdef',locator:u.href,content_sha256:'a'.repeat(64)}};
}
function bestand(){
  return {roh:{works:[{id:'material',title:'Spiralwellentexte'},{id:'kontext',title:'Gemeinsame Monde'},{id:'anderer',title:'Gegenlesen'}],
    worktrees:[{id:'baum-material',work_id:'material'},{id:'baum-kontext',work_id:'kontext'}],
    agents:[{id:'modell',handle:'Codex · Formbeitrag',agent_type:'model'}],
    variants:[quellfassung(),{id:'spaetere-fassung',worktree_id:'baum-material',label:'Zweite Lesekarte'}],
    participations:[
      {id:'erste',work_id:'material',context_work_id:'kontext',variant_id:'werkfassung',role:'source',reason:'Originalstelle lesen',author_id:'modell',status:'active',version_binding:'pinned',created_at:'2026-10-22T08:00:00Z'},
      {id:'rueckzug',work_id:'material',context_work_id:'kontext',variant_id:'werkfassung',role:'source',reason:'Diese Verwendung zurücknehmen',author_id:'modell',status:'withdrawn',supersedes_id:'erste',created_at:'2026-10-22T09:00:00Z'},
      {id:'vorschlag',work_id:'material',context_work_id:'anderer',variant_id:'werkfassung',role:'counterexample',reason:'Widerspruch prüfen',author_id:'modell',status:'proposed',version_binding:'latest',created_at:'2026-10-22T10:00:00Z'}],
    emergence_events:[
      {id:'deutung',work_id:'material',title:'Ein eigener Zusammenhang?',body:'Ein Modellvorschlag.',kind:'interpretation',author_id:'modell',variant_ids:['werkfassung'],event_time:'irgendwann im Juni; unsicher',interpretation_time:'2026-10-22',recorded_at:'2026-10-22T08:00:00Z',conditions:['Mit gemeinsamem Material'],status:'proposed',contradicts_event_ids:[],source_ref:quellfassung().source_ref},
      {id:'gegenbefund',work_id:'kontext',title:'Kein belegter Rollenwechsel',body:'Fokuswechsel belegt keine neue Lebensrolle.',kind:'counterevidence',author_id:'modell',variant_ids:['werkfassung'],recorded_at:'2026-10-22T09:00:00Z',status:'documented',contradicts_event_ids:['deutung']},
      {id:'luecke',work_id:'material',title:'Erprobung fehlt',body:'Keine angenommene Rolle belegt.',kind:'gap',author_id:'fehlend',variant_ids:['fehlende-fassung'],recorded_at:'2026-10-22T10:00:00Z',status:'documented'}]}};
}
const einfrieren = o => { if(o && typeof o === 'object'){Object.freeze(o); for(const x of Object.values(o)) einfrieren(x);} return o; };

test('Teilnahme, Rücknahme und verdrängte Vorgeschichte bleiben unterscheidbar',()=>{
  const B=bestand(), p=teilnahmen(B,'material');
  assert.equal(p.length,3);
  assert.equal(p.find(x=>x.id==='erste').verdraengt,true);
  assert.deepEqual(p.find(x=>x.id==='erste').abgeloestDurch,['rueckzug']);
  const rueckzug=p.find(x=>x.id==='rueckzug');
  assert.equal(rueckzug.aktuell,true); assert.equal(rueckzug.wirksam,false);
  assert.equal(rueckzug.statusText,'Zurückgezogene Teilnahme');
  const vorschlag=p.find(x=>x.id==='vorschlag');
  assert.equal(vorschlag.wirksam,false); assert.equal(vorschlag.statusText,'Vorgeschlagene Teilnahme');
  assert.equal(vorschlag.rolleName,'Gegenbeispiel'); assert.equal(vorschlag.kontextTitel,'Gegenlesen');
  assert.equal(vorschlag.akteurName,'Codex · Formbeitrag');
  assert.equal(vorschlag.fassung.id,'werkfassung','latest ersetzt keine tatsächlich verwendete Fassung');
  assert.equal(teilnahmen(B,'kontext')[0].richtung,'material-im-kontext');
});

test('Nur explizite Ablösung verdrängt; parallele Teilnahmen bleiben bestehen',()=>{
  const B=bestand();
  B.roh.participations.push({...B.roh.participations[0],id:'parallel',created_at:'2026-10-22T11:00:00Z'});
  const p=teilnahmen(B,'material');
  assert.equal(p.find(x=>x.id==='parallel').wirksam,true);
  assert.equal(p.find(x=>x.id==='rueckzug').aktuell,true);
  assert.equal(p.find(x=>x.id==='vorschlag').aktuell,true);
});

test('Entstehung erhält unsichere Zeiten, Gegenlesart, Quelle und konkrete Fassungsrollen',()=>{
  const e=entstehung(bestand(),'material');
  assert.deepEqual(e.map(x=>x.id),['deutung','gegenbefund','luecke']);
  assert.equal(e[0].ereigniszeit,'irgendwann im Juni; unsicher');
  assert.equal(e[0].deutungszeit,'2026-10-22');
  assert.equal(e[0].aufzeichnungszeit,'2026-10-22T08:00:00Z');
  assert.equal(e[0].statusText,'Vorschlag');
  assert.deepEqual(e[0].bedingungen,['Mit gemeinsamem Material']);
  assert.equal(e[0].quelle.source_id,quellfassung().source_ref.source_id);
  assert.equal(e[0].fassungen[0].id,'werkfassung');
  assert.equal(e[0].fassungen[0].rollen.length,3);
  assert.equal(e[0].widersprochenDurch[0].titel,'Kein belegter Rollenwechsel');
  assert.equal(e[1].widerspricht[0].id,'deutung');
  assert.equal(e[1].ereigniszeit,null,'Aufzeichnungszeit wird nicht zur Ereigniszeit');
  assert.equal(e[1].deutungszeit,null);
  assert.equal(e[2].typName,'Offene Lücke');
  assert.equal(e[2].akteurName,'Akteur nicht hinterlegt');
  assert.equal(e[2].fassungen[0].fehlt,true);
});

test('Projektion nutzt ausschließlich B.roh und verändert keine Bestandsdaten',()=>{
  const B=bestand(); B.fassungen=new Map([['werkfassung',{label:'Falsche Ersatzfassung'}]]);
  const vorher=JSON.stringify(B.roh); einfrieren(B.roh);
  assert.equal(teilnahmen(B,'material')[0].fassung.titel,'Lesekarte');
  assert.equal(entstehung(B,'material')[0].fassungen[0].titel,'Lesekarte');
  assert.equal(JSON.stringify(B.roh),vorher);
  assert.deepEqual(teilnahmen({},'unbekannt'),[]); assert.deepEqual(entstehung({},'unbekannt'),[]);
});

test('Lesbare Beschriftungen verbergen Kennungen; ursprüngliche Belege bleiben erhalten',()=>{
  const B=bestand(), id='9b9ec75e-f287-4b34-8987-e6f93539a8ef';
  B.roh.works[0].title='Spiralwellentexte '+id;
  B.roh.agents[0].handle='Codex · Formbeitrag '+id;
  B.roh.participations[0].reason='Nachlesen https://example.test/'+id;
  const p=teilnahmen(B,'material').find(x=>x.id==='erste');
  assert.equal(p.werkTitel,'Spiralwellentexte');
  assert.equal(p.akteurName,'Codex · Formbeitrag');
  assert.equal(p.begruendung,'Nachlesen');
  assert.ok(p.reason.includes(id),'Rohbeleg bleibt unverändert');
});

test('Ursprung öffnet die tatsächliche Werkfassung bei unveränderter Originalbindung',()=>{
  const v=quellfassung(), vorher=structuredClone(v), u=new URL(ursprung(v));
  assert.equal(u.origin,'http://127.0.0.1:53450');
  assert.equal(u.searchParams.get('fassung'),'werkfassung');
  assert.equal(JSON.parse(u.searchParams.get('quelle')).source_revision_id,'rev_archiv');
  assert.deepEqual(JSON.parse(u.searchParams.get('stelle')),{start:180,end:185,quote:'Tor😀'});
  assert.deepEqual(v,vorher);
});

test('Ursprung verweigert ungepinnte, fremde oder widersprüchliche Bindungen',()=>{
  const falsch = aendern => {const v=quellfassung(); aendern(v); assert.equal(ursprung(v),null);};
  for(const host of ['http://localhost:53450','https://127.0.0.1:53450','http://127.0.0.1:9030','http://example.test:53450'])
    falsch(v=>{v.source_ref.locator=v.source_ref.locator.replace('http://127.0.0.1:53450',host);});
  falsch(v=>{v.source_ref.locator='http://127.0.0.1:53450/?day=2026-06-09';});
  falsch(v=>{v.source_ref=null;});
  falsch(v=>{v.source_ref.system='fremd';});
  falsch(v=>{v.id='';});
  falsch(v=>{v.source_ref.source_id=v.source_ref.source_id.replace('rev_archiv','rev_anders');});
  falsch(v=>{v.source_ref.source_id=v.source_ref.source_id.replace('#180-185','#180-184');});
  falsch(v=>{const u=new URL(v.source_ref.locator), q=JSON.parse(u.searchParams.get('quelle')); delete q.source_revision_id; u.searchParams.set('quelle',JSON.stringify(q)); v.source_ref.locator=u.href;});
  falsch(v=>{const u=new URL(v.source_ref.locator), s=JSON.parse(u.searchParams.get('stelle')); s.quote='anderer Text'; u.searchParams.set('stelle',JSON.stringify(s)); v.source_ref.locator=u.href;});
  for(const key of ['quelle','stelle','fassung']) falsch(v=>{const u=new URL(v.source_ref.locator);u.searchParams.append(key,u.searchParams.get(key));v.source_ref.locator=u.href;});
  falsch(v=>{v.source_ref.locator+='#fremder-anker';});
});
