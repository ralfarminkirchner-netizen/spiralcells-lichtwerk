import fs from 'fs';
for (const p of process.argv.slice(2)) {
  let s; try { s = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { console.log(p, 'nicht lesbar', e.message); continue; }
  const edges = s.edges || (s.state && s.state.edges) || [];
  const c = {};
  for (const e of edges) { const k = e.edge_type + '|' + (e.usage ? 'usage' : 'ohne'); c[k] = (c[k] || 0) + 1; }
  console.log(p, edges.length, c);
  const ex = edges.filter(e => e.usage && (e.edge_type === 'remixt-aus' || e.edge_type === 'erweitert')).slice(0, 3);
  for (const e of ex) console.log(JSON.stringify({t: e.edge_type, usage: e.usage}).slice(0, 600));
  const ex2 = edges.filter(e => e.usage).slice(0, 2);
  for (const e of ex2) console.log('BSP', JSON.stringify({t: e.edge_type, keys: Object.keys(e), usage: e.usage}).slice(0, 800));
}
