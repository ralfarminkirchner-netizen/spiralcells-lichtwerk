import test from 'node:test';
import assert from 'node:assert/strict';
import {spiralbaum, BIS} from '../app/js/stufen-daten.js';

const w = (id, title, work_type = 'App') => ({id, title, work_type});
const k = (von, zu) => ({art: 'gehört zu', form: 'B', gespeichert: true, von, zu});
function graph(){
  const works = [w('o1', 'MUSiC', 'Oberdach'), w('o2', 'WRiTING', 'Oberdach'), w('a', 'Narben'), w('s1', 'Stelle aus „Reim“', 'text'), w('s2', 'Stelle aus „Takt“', 'text'),
    w('v1', 'Invaria 2 · Blatt', 'App-Variante'), w('v2', 'Invaria 2 · Netz', 'App-Variante'), w('d1', 'Lied', 'text'), w('d2', 'Lied', 'text')];
  const kanten = [k('a', 'o1'), k('a', 'o2'), k('s1', 'a'), k('s2', 'a'), k('v1', 'a'), k('v2', 'a'), k('d1', 'a'), k('d2', 'a')];
  const ids = ['a', 's1', 's2', 'v1', 'v2', 'd1', 'd2'];
  return {works, worktrees: ids.map(i => ({id: 't' + i, work_id: i})), variants: ids.map(i => ({id: 'f' + i, worktree_id: 't' + i, label: 'Fassung ' + i, content: 'x'.repeat(500)})),
    fundus: {kanten}};
}

test('Stellen liegen im eigenen Material der App, Zwischenstände und Gleichnamige sind je ein Werk', () => {
  const b = spiralbaum(graph()), musik = b.kinder.find(o => o.name === 'MUSiC'), narben = musik.kinder[0];
  const namen = narben.kinder.map(c => c.name).sort();
  assert.deepEqual(namen, ['Invaria 2', 'Lied', 'Narben']);
  const eigen = narben.kinder.find(c => c.eigen);
  assert.equal(eigen.kinder.length, 3);   // die App selbst und zwei Stellen
  assert.equal(narben.kinder.find(c => c.name === 'Lied').kinder.length, 2);
});

test('ein Werk an zwei Orten ist an beiden dasselbe Werk', () => {
  const b = spiralbaum(graph()), [m, s] = ['MUSiC', 'WRiTING'].map(n => b.kinder.find(o => o.name === n).kinder[0]);
  assert.equal(m.schluessel, s.schluessel);
  assert.deepEqual(m.auch, ['MUSiC', 'WRiTING']);
});

test('auf keiner Stufe mehr als BIS Dinge und ein Bündel', () => {
  const g = graph();
  for(let i = 0; i < 40; i++){ g.works.push(w('x' + i, 'Werk ' + i, 'text')); g.fundus.kanten.push(k('x' + i, 'a')); }
  const b = spiralbaum(g), lauf = n => { if(n.kinder){ assert.ok(n.kinder.length <= BIS + 1, n.name); n.kinder.forEach(lauf); } };
  lauf(b);
});
