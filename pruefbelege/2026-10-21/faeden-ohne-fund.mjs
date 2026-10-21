// Fäden über Werkgrenzen (netz.js:69-75), erste Kante k=0 wie folgeFaden(fi, U.fadenK||0): wie oft öffnet der Leseraum ohne Fund?
import fs from 'node:fs';
const root = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe';
globalThis.document = {querySelector(){return null}, createElement(){return {}}};
const {materialParagraphs} = await import(root + '/app/js/materialraum.js');
const {verorte} = await import(root + '/app/js/stoff.js');
for(const name of ['kette-gewebe', 'kette-claude']){
  const s = JSON.parse(fs.readFileSync(`${root}/testdaten/${name}/state.json`, 'utf8'));
  const V = new Map(s.variants.map(v => [v.id, v])), WT = new Map(s.worktrees.map(w => [w.id, w]));
  const werkVon = id => { const v = V.get(id); const w = v && WT.get(v.worktree_id); return w ? w.work_id : null; };
  const buendel = new Map();
  for(const e of s.edges){ const a = werkVon(e.from_variant_id), b = werkVon(e.to_variant_id); if(!a || !b || a === b) continue;
    const fl = e.edge_type === 'remixt-aus' || e.edge_type === 'erweitert'; const k = `${fl ? b : a}>${fl ? a : b}:${e.edge_type}`;
    const f = buendel.get(k) || {kanten: []}; f.kanten.push(e); buendel.set(k, f); }
  const faeden = [...buendel.values()]; for(const f of faeden) f.kanten.sort((p, q) => (q.usage ? 1 : 0) - (p.usage ? 1 : 0));
  let ohneTeil = 0, fund = 0, ohneFund = 0, alleK = {mitTeil: 0, fund: 0, ohne: 0};
  for(const f of faeden) for(const e of f.kanten){ const u = e.usage; if(!u || !u.to_part) continue; alleK.mitTeil++; const v = V.get(e.to_variant_id); const wo = v ? verorte(u.to_part, materialParagraphs(v.content)) : null; wo ? alleK.fund++ : alleK.ohne++; }
  console.log(name, "alle Kanten in Fäden", alleK);
  for(const f of faeden){ const e = f.kanten[0], u = e.usage; if(!u || !u.to_part){ ohneTeil++; continue; }
    const v = V.get(e.to_variant_id); const wo = v ? verorte(u.to_part, materialParagraphs(v.content)) : null; if(wo) fund++; else ohneFund++; }
  console.log(name, {faeden: faeden.length, ohneTeil_Leseflaeche: ohneTeil, leseraumMitFund: fund, leseraumOhneFund: ohneFund});
}
