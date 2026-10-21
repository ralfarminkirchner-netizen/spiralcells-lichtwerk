import fs from 'fs';
const s = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const c = {};
for (const e of s.edges) if (e.usage) { const k = e.edge_type + '|' + e.usage.direction; c[k] = (c[k] || 0) + 1; }
console.log(c);
console.log(Object.keys(s));
