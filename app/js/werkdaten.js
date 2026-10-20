/*
 * Datenlinse für den Werkraum. Kein eigener Bestand, keine erfundenen Kanten.
 * Originalmaterial bleibt unverändert; human() dient ausschließlich Beschriftungen.
 */

const VOICES = [
  [/^claude\b/i, '#ffb45c'],
  [/^codex\b/i, '#38c8ff'],
  [/^hermes\b/i, '#86e070'],
  [/^anti-?\s?gravity\b/i, '#9b7bff'],
  [/^kimi\b/i, '#ff5e8a'],
];
const EXTRA_COLORS = ['#80d6c5', '#c3b6ee', '#e8a3bc', '#95b8e7', '#d4ca89', '#b6d5ab', '#e8ac8f'];
const UNKNOWN_AUTHOR = 'Urheberschaft nicht hinterlegt';
const ORIGIN_TYPES = new Set(['erweitert', 'remixt-aus']);

function plainLabel(value) {
  return String(value ?? '')
    .replace(/\[([^\]\n]+)\]\([^)]+\)/g, '$1')
    .replace(/(?:https?|file|obsidian):\/\/[^\s<>"'`)]+/gi, '')
    .replace(/(?:\/(?:Users|Volumes|home|private|tmp|opt|var|mnt)\/|[A-Za-z]:\\)[^\s<>"'`)\]]+/g, '')
    .replace(/\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi, '')
    .replace(/\b(?:thread|chat|record|project|job|run|provider|variant|worktree|agent|source|session|request|sha256|sha1|hash|id)[_:-][A-Za-z0-9_-]+\b/gi, '')
    .replace(/\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,64}\b/gi, '')
    .replace(/\b[0-9a-f]{32,128}\b/gi, '')
    .replace(/\b(?=[A-Za-z0-9_-]{20,}\b)(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]+\b/g, '')
    .replace(/\b\d{12,}\b/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s·|:;,–—-]+|[\s·|:;,–—-]+$/g, '')
    .trim();
}

export function human(text, fallback = 'Ohne Titel') {
  return plainLabel(text) || plainLabel(fallback) || 'Ohne Titel';
}

function time(value) {
  const result = Date.parse(value);
  return Number.isFinite(result) ? result : Infinity;
}

function extraColor(name) {
  let hash = 0;
  for (const char of name) hash = (Math.imul(hash, 31) + char.codePointAt(0)) | 0;
  return EXTRA_COLORS[(hash >>> 0) % EXTRA_COLORS.length];
}

function describeAuthor(agent, authorId) {
  if (!agent) return {id: authorId ?? null, name: UNKNOWN_AUTHOR, color: '#a3adb8', kind: 'unknown'};
  const name = human(agent.handle, UNKNOWN_AUTHOR);
  if (agent.agent_type === 'human') return {id: agent.id, name, color: '#eee9dc', kind: 'human'};
  // These handles identify the importing application, not the original author.
  if (agent.agent_type === 'import' || /(?:quellenübernahme|quellenimport|app-bestand|kapitelverbindungen|\bimport(?:iert)?\b)/i.test(agent.handle || '')) {
    return {id: agent.id, name, color: '#bfb3a1', kind: 'import'};
  }
  const voice = VOICES.find(([pattern]) => pattern.test(agent.handle || ''));
  if (agent.agent_type === 'model' || voice) {
    return {id: agent.id, name, color: voice?.[1] || extraColor(name), kind: 'model'};
  }
  return {id: agent.id, name, color: '#a3adb8', kind: 'unknown'};
}

export function buildModel(graph) {
  const raw = graph && typeof graph === 'object' ? graph : {};
  const list = key => Array.isArray(raw[key]) ? raw[key] : [];
  const agents = new Map(list('agents').map(agent => [agent.id, agent]));
  const trees = new Map(list('worktrees').map(tree => [tree.id, tree]));
  const byVariant = new Map(list('variants').map(variant => [variant.id, variant]));
  const works = list('works').map(work => ({
    ...work, title: human(work.title, 'Unbenanntes Werk'), variants: [], relations: [],
  }));
  const byWork = new Map(works.map(work => [work.id, work]));
  const asVariant = value => typeof value === 'string' ? byVariant.get(value) : value;
  const workOf = value => {
    const variant = asVariant(value);
    return byWork.get(trees.get(variant?.worktree_id)?.work_id) || null;
  };
  for (const variant of byVariant.values()) workOf(variant)?.variants.push(variant);
  for (const work of works) {
    // Equal or absent dates retain source order; no invented timestamp precision.
    work.variants.sort((a, b) => {
      const first = time(a.created_at), second = time(b.created_at);
      return first === second ? 0 : first - second;
    });
  }
  const origins = new Map();
  const addOrigin = (child, parent) => {
    if (!byVariant.has(child) || !byVariant.has(parent) || child === parent) return;
    if (!origins.has(child)) origins.set(child, new Set());
    origins.get(child).add(parent);
  };
  for (const variant of byVariant.values()) addOrigin(variant.id, variant.derived_from);
  const relations = [];
  for (const edge of list('edges')) {
    const fromVariant = byVariant.get(edge.from_variant_id);
    const toVariant = byVariant.get(edge.to_variant_id);
    if (!fromVariant || !toVariant) continue;
    if (ORIGIN_TYPES.has(edge.edge_type)) addOrigin(fromVariant.id, toVariant.id);
    const fromWork = workOf(fromVariant), toWork = workOf(toVariant);
    if (!fromWork || !toWork || fromWork.id === toWork.id) continue;
    const relation = {edge, fromWork, toWork, fromVariant, toVariant, type: edge.edge_type};
    relations.push(relation);
    fromWork.relations.push(relation);
    toWork.relations.push(relation);
  }
  return {
    raw, works, byWork, byVariant, agents, relations, workOf,
    author(value) {
      const variant = asVariant(value);
      return describeAuthor(agents.get(variant?.author_id), variant?.author_id);
    },
    parents(value) {
      const variant = asVariant(value);
      return [...(origins.get(variant?.id) || [])].map(id => byVariant.get(id));
    },
    title(value) {
      const variant = asVariant(value);
      const index = workOf(variant)?.variants.findIndex(item => item.id === variant?.id) ?? -1;
      return human(variant?.label, index >= 0 ? `Fassung ${index + 1}` : 'Unbenannte Fassung');
    },
  };
}

function requestError(status, writing) {
  let message = writing
    ? 'Die Fassung konnte nicht gespeichert werden. Dein Text bleibt im Entwurf.'
    : 'Der Werkbestand konnte nicht geladen werden.';
  if (status === 503 || status === 0) message = 'Der Werkbestand ist gerade nicht erreichbar. Bitte versuche es erneut.';
  if (status === 403 && writing) message = 'Dieser Schreibweg ist hier nicht freigegeben. Dein Text bleibt im Entwurf.';
  if ((status === 409 || status === 422) && writing) message = 'Die Ausgangsfassung oder der Speicherversuch passt nicht mehr. Prüfe deine Auswahl; dein Text bleibt im Entwurf.';
  const error = new Error(message);
  error.status = status;
  return error;
}

async function request(path, body) {
  const writing = body !== undefined;
  let response;
  try {
    response = await fetch(path, {
      method: writing ? 'POST' : 'GET',
      cache: 'no-store',
      headers: writing
        ? {'Accept': 'application/json', 'Content-Type': 'application/json'}
        : {'Accept': 'application/json'},
      ...(writing ? {body: JSON.stringify(body)} : {}),
    });
  } catch {
    throw requestError(0, writing);
  }
  if (!response.ok) throw requestError(response.status, writing);
  try { return await response.json(); }
  catch { throw requestError(response.status, writing); }
}

export async function loadModel() {
  const graph = await request('/lichtwerk/graph');
  if (!graph || !['agents', 'works', 'worktrees', 'variants', 'edges'].every(key => Array.isArray(graph[key]))) {
    throw new Error('Der Werkbestand ist unvollständig. Bitte lade ihn erneut.');
  }
  return buildModel(graph);
}

export async function loadEnvironment() {
  const raw = await request('/api/health');
  const isTest = raw?.instance_id === 'spiralcells-testkopie';
  return {
    isTest,
    authorSelection: raw?.lichtwerk?.capabilities?.authorSelection === true,
    name: isTest ? 'Getrennte Testumgebung' : raw?.instance_id === 'mooncells-local' ? 'Arbeitsbestand' : 'Verbundener Bestand',
    raw,
  };
}

/**
 * Only call after the person's explicit save action. Uses the existing writer.
 * Keep requestId with the draft across retries/reload; never regenerate on retry.
 * With an omitted requestId, an uncertain failure exposes it on error.requestId
 * for internal retry handling, not for normal on-screen labels.
 */
export async function saveBranch({workId, sourceId, label, content, notes = '', seenIds = [], requestId, authorId = null} = {}) {
  const rid = requestId ?? `lichtwerk-${globalThis.crypto.randomUUID()}`;
  try {
    if (!/^lichtwerk-[A-Za-z0-9-]{8,80}$/.test(rid)) throw new Error('Dieser Speicherversuch ist nicht mehr gültig. Öffne den Entwurf erneut.');
    if (typeof label !== 'string' || !label.trim()) throw new Error('Gib der neuen Fassung einen Namen.');
    if (typeof content !== 'string' || !content.trim()) throw new Error('Die neue Fassung braucht Material.');
    if (typeof notes !== 'string' || !Array.isArray(seenIds)) throw new Error('Die Angaben zur Bearbeitung sind unvollständig.');
    const model = await loadModel();
    if (!model.byWork.has(workId) || model.workOf(sourceId)?.id !== workId) {
      throw new Error('Die Ausgangsfassung gehört nicht zum gewählten Werk. Bitte wähle sie erneut.');
    }
    const seen = [...new Set([sourceId, ...seenIds])].sort();
    if (seen.some(id => !model.byVariant.has(id))) throw new Error('Eine gelesene Vergleichsfassung ist nicht mehr erreichbar. Bitte prüfe die Auswahl.');
    let author;
    if (authorId !== null) {
      author = typeof authorId === 'string' ? model.agents.get(authorId) : null;
      if (!author?.id) throw new Error('Das ausgewählte Urheberprofil ist nicht mehr erreichbar. Bitte prüfe die Auswahl.');
    } else {
      author = [...model.agents.values()].find(agent => agent.agent_type === 'human' && agent.handle === 'Ralf');
      if (!author) {
        author = await request('/api/agents', {
          handle: 'Ralf', agent_type: 'human',
          description: 'Eigene Fassungen, im SPiRALCELLS-Werkraum gespeichert. Keine automatische Bewertung.',
        });
      }
      if (!author?.id || author.agent_type !== 'human' || author.handle !== 'Ralf') {
        throw new Error('Die eigene Urheberschaft konnte nicht zugeordnet werden. Dein Text bleibt im Entwurf.');
      }
    }
    const result = await request('/api/variant-branches', {
      work_id: workId, new_worktree: true, source_variant_id: sourceId,
      author_id: author.id, label: label.trim(), content, notes,
      request_id: rid,
      contribution: {mode: 'continuation', seen_variant_ids: seen},
    });
    if (!result?.variant?.id || !result?.worktree?.id) {
      throw new Error('Die Speicherung konnte nicht bestätigt werden. Wiederhole denselben Speicherversuch.');
    }
    return result;
  } catch (error) {
    error.requestId = rid;
    throw error;
  }
}
