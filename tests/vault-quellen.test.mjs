import test from 'node:test';
import assert from 'node:assert/strict';
import {bindeVaultquellen} from '../app/js/vault-quellen.js';
import {ursprung} from '../app/js/zusammenhang.js';

const sha='a'.repeat(64), key='b'.repeat(64);
const path='/registered/vault/Original.md';
function antwort(){
  const source={kind:'research', key,source_revision_id:sha,offset:0};
  const selection={start:0,end:5,quote:'Tor😀'};
  const u=new URL('http://127.0.0.1:53450/');
  u.searchParams.set('quelle',JSON.stringify(source));
  u.searchParams.set('stelle',JSON.stringify(selection));
  return {source,selection,source_ref:{system:'lebensspirale',kind:'research',
    content_sha256:sha,source_id:key+'@'+sha+'#0-5@0123456789abcdef',locator:u.href},
    actual_file:{exists:true,revision_matches:false}};
}
const variante=()=>({id:'werkfassung',source_ref:{system:'vault',locator:path,content_sha256:sha}});

test('Vault-Auflösung bleibt lesend, wird geteilt und erhält Originalverweis und Werkfassung',async()=>{
  const v=variante(), daten={variants:[v,{...v,id:'zweite-fassung'}]}, vorher=structuredClone(daten);
  let anfragen=0;
  const r=await bindeVaultquellen(daten,async url=>{
    anfragen++;
    const q=new URL(url,'http://127.0.0.1:8411').searchParams;
    assert.equal(q.get('path'),path); assert.equal(q.get('content_sha256'),sha);
    return antwort();
  });
  assert.equal(anfragen,1); assert.deepEqual(daten,vorher);
  assert.deepEqual(r.variants[0].source_ref,v.source_ref);
  const u=new URL(ursprung(r.variants[0]));
  assert.equal(u.searchParams.get('fassung'),'werkfassung');
  assert.equal(JSON.parse(u.searchParams.get('quelle')).source_revision_id,sha);
  assert.equal(r.variants[0].reader_source.actual_file.revision_matches,false,
    'Gespeicherte Fassung bleibt erreichbar, geänderte Datei wird nicht als gleich behauptet');
});

test('Vault-Rückweg verweigert unaufgelöste und abweichende Bindungen',()=>{
  assert.equal(ursprung(variante()),null);
  const v={...variante(),reader_source:{...antwort(),vault_path:path}};
  assert.ok(ursprung(v));
  for(const change of [
    x=>x.reader_source.vault_path='/other/Original.md',
    x=>x.reader_source.source_ref.content_sha256='c'.repeat(64),
    x=>x.reader_source.source.source_revision_id='c'.repeat(64),
    x=>x.reader_source.selection.quote='Falsch',
    x=>{const u=new URL(x.reader_source.source_ref.locator),q=JSON.parse(u.searchParams.get('quelle'));q.source_revision_id='c'.repeat(64);u.searchParams.set('quelle',JSON.stringify(q));x.reader_source.source_ref.locator=u.href;}
  ]){const x=structuredClone(v);change(x);assert.equal(ursprung(x),null);}
});

test('Nicht registrierte oder fehlende Quellen erhalten keinen Ersatzlink',async()=>{
  const v={...variante(),source_ref:{...variante().source_ref,locator:'/missing/Original.md'}};
  const r=await bindeVaultquellen({variants:[v]},async()=>{throw new Error('Nicht registriert');});
  assert.equal(r.variants[0],v); assert.equal(ursprung(r.variants[0]),null);
});

for(const fehler of ['nicht erreichbar','abweichende Revision']){
  test(`Eine erfolglose Vault-Lesung kann später wieder gebunden werden: ${fehler}`,async()=>{
    const v={...variante(),source_ref:{...variante().source_ref,locator:`/registered/vault/${fehler}.md`}};
    let anfragen=0;
    const lesen=async()=>{
      anfragen++;
      if(anfragen===1){
        if(fehler==='nicht erreichbar') throw new Error('Reader ruht');
        return {...antwort(),source:{...antwort().source,source_revision_id:'c'.repeat(64)}};
      }
      return antwort();
    };
    const erster=await bindeVaultquellen({variants:[v]},lesen);
    assert.equal(anfragen,1,'Kein automatischer Wiederholungsversuch');
    assert.equal(ursprung(erster.variants[0]),null);
    const zweiter=await bindeVaultquellen({variants:[v]},lesen);
    assert.equal(anfragen,2);
    assert.ok(ursprung(zweiter.variants[0]));
    assert.equal(v.reader_source,undefined,'Originalbestand bleibt unverändert');
  });
}
