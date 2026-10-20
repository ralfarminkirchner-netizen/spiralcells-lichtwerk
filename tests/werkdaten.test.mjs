import test from 'node:test';
import assert from 'node:assert/strict';
import {buildModel, human, loadEnvironment, loadModel, saveBranch} from '../app/js/werkdaten.js';

// Exclusively synthetic unit-test material. Never posted to a running server.
function fixture() {
  return {
    agents: [
      {id: 'person', handle: 'Ralf', agent_type: 'human'},
      {id: 'claude', handle: 'Claude — Systemleitung und Tragwerk', agent_type: 'model'},
      {id: 'future', handle: 'Weiteres Modell — Versuch', agent_type: 'model'},
      {id: 'importer', handle: 'Moonfingers Quellenübernahme', agent_type: 'model'},
    ],
    works: [{id: 'first', title: 'Testwerk · Erstes'}, {id: 'second', title: 'Testwerk · Zweites'}],
    worktrees: [
      {id: 'origin-tree', work_id: 'first'},
      {id: 'branch-tree', work_id: 'first'},
      {id: 'second-tree', work_id: 'second'},
    ],
    variants: [
      {id: 'child', worktree_id: 'origin-tree', label: 'Bearbeitung', author_id: 'claude', derived_from: 'origin', created_at: '2026-02-02', content: 'Testbearbeitung'},
      {id: 'branch', worktree_id: 'branch-tree', label: '', author_id: 'person', derived_from: null, created_at: '2026-02-03', content: 'Testzweig'},
      {id: 'origin', worktree_id: 'origin-tree', label: 'Testquelle', author_id: 'importer', created_at: '2026-02-01', content: 'Unverändert: 0459c2de-fcbc-400c-939d-aa75dc97f08b'},
      {id: 'other', worktree_id: 'second-tree', label: 'Vergleichsquelle', author_id: 'future', created_at: '2026-01-01'},
      {id: 'undated', worktree_id: 'origin-tree', label: '', author_id: 'absent'},
    ],
    edges: [
      {id: 'source-edge', edge_type: 'erweitert', from_variant_id: 'branch', to_variant_id: 'origin'},
      {id: 'duplicate-parent', edge_type: 'erweitert', from_variant_id: 'child', to_variant_id: 'origin'},
      {id: 'reference', edge_type: 'verweist-auf', from_variant_id: 'branch', to_variant_id: 'other'},
      {id: 'contradiction', edge_type: 'widerspricht', from_variant_id: 'branch', to_variant_id: 'child'},
      {id: 'transfer', edge_type: 'remixt-aus', from_variant_id: 'child', to_variant_id: 'other'},
      {id: 'dangling', edge_type: 'erweitert', from_variant_id: 'branch', to_variant_id: 'missing'},
    ],
    findings: [],
  };
}

test('actual origin links are deduplicated; references and contradictions are not parents', () => {
  const model = buildModel(fixture());
  assert.deepEqual(model.parents('branch').map(v => v.id), ['origin']);
  assert.deepEqual(model.parents('child').map(v => v.id), ['origin', 'other']);
  assert.deepEqual(model.parents('origin'), []);
  assert.equal(model.workOf('branch').id, 'first');
  assert.equal(model.workOf('missing'), null);
});

test('each real interwork relation is accessible in both works with its exact source versions', () => {
  const model = buildModel(fixture());
  assert.deepEqual(model.relations.map(r => r.type), ['verweist-auf', 'remixt-aus']);
  for (const relation of model.relations) {
    assert.equal(relation.fromWork, model.byWork.get('first'));
    assert.equal(relation.toWork, model.byWork.get('second'));
    assert.equal(relation.toVariant, model.byVariant.get('other'));
    assert.ok(relation.fromWork.relations.includes(relation));
    assert.ok(relation.toWork.relations.includes(relation));
  }
});

test('chronology preserves raw material, with absent dates last and readable fallbacks', () => {
  const graph = fixture(), original = JSON.stringify(graph), model = buildModel(graph);
  assert.deepEqual(model.byWork.get('first').variants.map(v => v.id), ['origin', 'child', 'branch', 'undated']);
  assert.equal(model.title('branch'), 'Fassung 3');
  assert.equal(model.title('undated'), 'Fassung 4');
  assert.equal(JSON.stringify(graph), original);
  assert.equal(model.byVariant.get('origin').content, graph.variants[2].content);
});

test('human, known models, additional models, imports and missing authors remain distinguishable', () => {
  const model = buildModel(fixture());
  assert.equal(model.author('branch').kind, 'human');
  assert.equal(model.author('child').name, 'Claude — Systemleitung und Tragwerk');
  assert.equal(model.author('child').color, '#ffb45c');
  assert.equal(model.author('other').kind, 'model');
  assert.equal(model.author('other').name, 'Weiteres Modell — Versuch');
  assert.match(model.author('other').color, /^#[0-9a-f]{6}$/);
  assert.equal(model.author('origin').kind, 'import');
  assert.equal(model.author('undated').kind, 'unknown');
  assert.equal(model.author('undated').name, 'Urheberschaft nicht hinterlegt');
});

test('labels hide technical identifiers and locations without rewriting source material', () => {
  assert.equal(human('0459c2de-fcbc-400c-939d-aa75dc97f08b'), 'Ohne Titel');
  assert.equal(human('/Volumes/Disk/Technical/file.json'), 'Ohne Titel');
  assert.equal(human('Thread thread_abc123456 — mein Werk'), 'Thread — mein Werk');
  assert.equal(human('Mein Werk · abcd1234'), 'Mein Werk');
  assert.equal(human('[Lesbare Quelle](https://example.test/source/abc123)'), 'Lesbare Quelle');
  assert.equal(human('2026-02-03 · Fassung 12'), '2026-02-03 · Fassung 12');
  assert.equal(human(null, 'Fassung 7'), 'Fassung 7');
});

async function mockedFetch(routes, operation) {
  const original = globalThis.fetch, calls = [];
  globalThis.fetch = async (path, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({path, options, body});
    const route = routes[`${options.method || 'GET'} ${path}`];
    assert.ok(route, `Unexpected request in isolated test: ${path}`);
    return typeof route === 'function' ? route(body) : new Response(JSON.stringify(route), {status: 200});
  };
  try { await operation(calls); } finally { globalThis.fetch = original; }
}

test('loading uses the existing graph and identifies the separate test environment', async () => {
  await mockedFetch({
    'GET /lichtwerk/graph': fixture(),
    'GET /api/health': {instance_id: 'spiralcells-testkopie'},
  }, async calls => {
    assert.equal((await loadModel()).works.length, 2);
    const environment = await loadEnvironment();
    assert.equal(environment.isTest, true);
    assert.equal(environment.authorSelection, false);
    assert.equal(calls.length, 2);
  });
});

test('author selection is enabled only by an explicit proxy capability', async () => {
  for (const capability of [true, false, 'true', 1, undefined]) {
    await mockedFetch({
      'GET /api/health': {instance_id: 'spiralcells-testkopie', lichtwerk: {capabilities: {authorSelection: capability}}},
    }, async () => {
      assert.equal((await loadEnvironment()).authorSelection, capability === true);
    });
  }
});

test('save branch uses selected origin and unchanged request identity; does not advance another branch', async () => {
  const result = {worktree: {id: 'saved-tree'}, variant: {id: 'saved'}, edges: []};
  await mockedFetch({
    'GET /lichtwerk/graph': fixture(),
    'POST /api/variant-branches': result,
  }, async calls => {
    const options = {workId: 'first', sourceId: 'origin', label: 'Testvariante', content: ' Testmaterial\n', seenIds: ['child', 'origin'], requestId: 'lichtwerk-unit-test-00001'};
    assert.deepEqual(await saveBranch(options), result);
    await saveBranch(options);
    const writes = calls.filter(call => call.body);
    assert.equal(writes.length, 2);
    assert.deepEqual(writes[0].body, writes[1].body);
    assert.equal(writes[0].body.source_variant_id, 'origin');
    assert.equal(writes[0].body.new_worktree, true);
    assert.equal(writes[0].body.content, options.content);
    assert.deepEqual(writes[0].body.contribution.seen_variant_ids, ['child', 'origin']);
    assert.ok(!('derived_from' in writes[0].body));
    assert.ok(!('worktree_id' in writes[0].body));
  });
});

test('validating source and seen material occurs before any registration or write', async () => {
  await mockedFetch({'GET /lichtwerk/graph': fixture()}, async calls => {
    await assert.rejects(saveBranch({workId: 'first', sourceId: 'other', label: 'Test', content: 'Test', requestId: 'lichtwerk-unit-test-00002'}), /Ausgangsfassung/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.method, 'GET');
  });
});

test('missing own author is registered only during save, then checked before the branch write', async () => {
  const graph = fixture();
  graph.agents = graph.agents.filter(agent => agent.id !== 'person');
  await mockedFetch({
    'GET /lichtwerk/graph': graph,
    'POST /api/agents': {id: 'new-person', handle: 'Ralf', agent_type: 'human'},
    'POST /api/variant-branches': {worktree: {id: 'saved-tree'}, variant: {id: 'saved'}},
  }, async calls => {
    await saveBranch({workId: 'first', sourceId: 'origin', label: 'Test', content: 'Test', requestId: 'lichtwerk-unit-test-00003'});
    assert.deepEqual(calls.map(call => call.path), ['/lichtwerk/graph', '/api/agents', '/api/variant-branches']);
    assert.equal(calls[2].body.author_id, 'new-person');
  });
});

test('an explicitly selected existing author is preserved without registering a human', async () => {
  const graph = fixture();
  graph.agents = graph.agents.filter(agent => agent.id !== 'person');
  await mockedFetch({
    'GET /lichtwerk/graph': graph,
    'POST /api/variant-branches': {worktree: {id: 'saved-tree'}, variant: {id: 'saved'}},
  }, async calls => {
    const options = {workId: 'first', sourceId: 'origin', authorId: 'future', label: 'Ausdrückliche Testfassung', content: 'Nur Testmaterial', requestId: 'lichtwerk-unit-test-00005'};
    await saveBranch(options);
    await saveBranch(options);
    const writes = calls.filter(call => call.body);
    assert.equal(writes.length, 2);
    assert.equal(writes[0].path, '/api/variant-branches');
    assert.equal(writes[0].body.author_id, 'future');
    assert.deepEqual(writes[0].body, writes[1].body);
  });
});

test('an unavailable author never silently becomes a human author', async () => {
  await mockedFetch({'GET /lichtwerk/graph': fixture()}, async calls => {
    await assert.rejects(saveBranch({workId: 'first', sourceId: 'origin', authorId: 'missing-profile', label: 'Test', content: 'Nur Testmaterial', requestId: 'lichtwerk-unit-test-00006'}), /Urheberprofil/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.method, 'GET');
  });
});

test('server errors never disclose backend identifiers and retain retry identity internally', async () => {
  await mockedFetch({
    'GET /lichtwerk/graph': fixture(),
    'POST /api/variant-branches': () => new Response(JSON.stringify({detail: 'Missing UUID 0459c2de-fcbc-400c-939d-aa75dc97f08b'}), {status: 422}),
  }, async () => {
    await assert.rejects(saveBranch({workId: 'first', sourceId: 'origin', label: 'Test', content: 'Test', requestId: 'lichtwerk-unit-test-00004'}), error => {
      assert.ok(!/0459c2de|UUID/.test(error.message));
      assert.equal(error.requestId, 'lichtwerk-unit-test-00004');
      return true;
    });
  });
});
