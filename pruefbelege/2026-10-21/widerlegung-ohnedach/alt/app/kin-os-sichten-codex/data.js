/* Read-only adapter. No copied content store, no writes, no providers. */
(() => {
  'use strict';
  const human = value => String(value ?? '').replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, 'technische Kennung').replace(/\b[0-9a-f]{40,64}\b/gi, 'Prüfsumme').replace(/(?:file:\/\/)?\/(?:Users|Volumes|home|private|tmp)\/[^\s<>"`]+/g, 'lokaler Speicherort');
  const materialUrl = (variantId, comparisonId) => 'http://127.0.0.1:8401/#material=' + encodeURIComponent(JSON.stringify({ variantId, ...(comparisonId ? { comparisonId } : {}) }));
  let pending;
  async function read() {
    try {
      const response = await fetch('/api/graph', { cache: 'no-store', signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('unavailable');
      const graph = await response.json();
      if (!Array.isArray(graph.works) || !Array.isArray(graph.variants) || !Array.isArray(graph.worktrees)) throw new Error('shape');
      const agents = new Map((graph.agents || []).map(a => [a.id, a]));
      const trees = new Map(graph.worktrees.map(t => [t.id, t]));
      const variantsById = new Map(graph.variants.map(v => [v.id, v]));
      function ancestor(variant) {
        let current = variant;
        const seen = new Set();
        while (current && !seen.has(current.id)) {
          seen.add(current.id);
          const parents = (graph.edges || []).filter(e => e.to_variant_id === current.id && e.edge_type === 'erweitert');
          const parent = current.derived_from || (parents.length === 1 ? parents[0].from_variant_id : null);
          if (!parent || !variantsById.has(parent) || seen.has(parent)) break;
          current = variantsById.get(parent);
        }
        return current;
      }
      const grouped = new Map();
      for (const v of graph.variants) {
        const work = trees.get(v.worktree_id)?.work_id;
        if (!work) continue;
        if (!grouped.has(work)) grouped.set(work, []);
        grouped.get(work).push(v);
      }
      const works = graph.works.map(w => {
        const raw = (grouped.get(w.id) || []).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        const root = ancestor(raw[0]);
        return { key: w.id, title: human(w.title || 'Unbenanntes Werk'), count: raw.length,
          variants: raw.length, status: 'Geltung einzeln prüfen', variantsRaw: raw, rootVariant: root,
          latest: raw[0], source: human(w.source_ref?.system || 'SPiRALCELLS'), tags: (w.tags || []).map(human),
          kind: human(w.work_type || 'Werk'), updated: raw[0]?.created_at || w.created_at };
      }).sort((a,b) => new Date(b.updated) - new Date(a.updated));
      return { works, edges: graph.edges || [], agents, live: true, fetchedAt: new Date().toISOString(),
        message: 'SPiRALCELLS · Bestand jetzt gelesen' };
    } catch {
      return { works: [], edges: [], agents: new Map(), live: false, fetchedAt: new Date().toISOString(),
        message: 'SPiRALCELLS ist gerade nicht lesbar. Erneut öffnen, sobald der Dienst wieder erreichbar ist.' };
    }
  }
  window.KinSource = { human, materialUrl, load: () => pending ||= read() };
})();
