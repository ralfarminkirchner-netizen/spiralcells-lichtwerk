/* SPiRALCELLS · Materialraum
 * Pure view: source records remain authoritative; all writes go through onAction.
 */
import {human} from './werkdaten.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = String(text);
  return n;
};
const humanLabel = (value, fallback = 'Unbenannte Fassung') => human(value, fallback);
const contentOf = v => typeof v?.content === 'string'
  ? v.content : v?.content == null ? '' : JSON.stringify(v.content, null, 2);
const dateLabel = value => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.valueOf()) ? '' : d.toLocaleDateString('de-DE', {day: 'numeric', month: 'long', year: 'numeric'});
};
const words = text => new Set((text.toLocaleLowerCase('de').match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 1));
const similarity = (a, b) => {
  if (a.role || b.role) {
    if (a.role !== b.role) return 0;
    if (a.role === 'source' && a.sectionTitle !== b.sectionTitle) return 0;
    if (a.role === 'source' || a.role === 'summary' || a.role === 'scope') return a.text === b.text ? 1 : .85;
  }
  if (a.text === b.text) return 1;
  if (!a.tokens.size || !b.tokens.size) return 0;
  let common = 0;
  for (const t of a.tokens) if (b.tokens.has(t)) common++;
  return 2 * common / (a.tokens.size + b.tokens.size);
};

/** Recognize only the existing import envelope. Unknown formats remain intact. */
export function appSource(value) {
  let data = value;
  if (typeof value === 'string') { try { data = JSON.parse(value); } catch { return null; } }
  return data?.format === 'moonfingers.app-source.v1'
    && typeof data.summary === 'string' && typeof data.scope === 'string'
    && Array.isArray(data.sections) && data.sections.every(section => section && typeof section.content === 'string')
    ? data : null;
}

// Descriptions belong to the import envelope, unlike the unaltered source code.
const description = value => String(value).split('\n')
  .map(line => line.trim() ? humanLabel(line, 'Technische Angabe in den Importdetails') : '').join('\n');

/** Editing saved sections preserves every other field in the import envelope. */
export function replaceAppSourceSections(value, contents) {
  const source = appSource(value);
  if (!source || contents.length !== source.sections.length || contents.some(text => typeof text !== 'string'))
    throw new TypeError('Quellabschnitte stimmen nicht mit dem gespeicherten Paket überein.');
  if (source.sections.every((section, index) => section.content === contents[index]))
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return JSON.stringify({...source, sections: source.sections.map((section, index) => ({...section, content: contents[index]}))}, null, 2);
}

export function materialParagraphs(value) {
  const text = typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value, null, 2);
  if (!text) return [];
  const source = appSource(value);
  if (source) {
    const parts = [];
    if (source.summary) parts.push({text: description(source.summary), role: 'summary', heading: 'Zur gespeicherten App-Fassung'});
    if (source.scope) parts.push({text: description(source.scope), role: 'scope', heading: 'Umfang des Bestands'});
    source.sections.forEach((section, sourceIndex) => parts.push({
      text: section.content, structured: true, role: 'source', sourceIndex,
      sectionTitle: String(section.title || ''), heading: humanLabel(section.title, `Quellabschnitt ${sourceIndex + 1}`),
      truncated: section.truncated === true,
    }));
    return parts.map((part, index) => ({...part, index, tokens: words(part.text)}));
  }
  const structured = typeof value === 'object' || /^\s*[\[{]/.test(text) && (() => { try { JSON.parse(text); return true; } catch { return false; } })();
  return (structured ? [text] : text.replace(/\r\n/g, '\n').split(/\n[ \t]*\n+/))
    .map((text, index) => ({text, index, tokens: words(text), structured}));
}

/** Monotone text alignment. Similarity describes shared words, never meaning. */
export function alignParagraphs(left, right) {
  const n = left.length, m = right.length;
  if (!n) return right.map(b => ({a: null, b, score: 0}));
  if (!m) return left.map(a => ({a, b: null, score: 0}));
  // Bound the quadratic work for book-length material.
  if (n * m > 100000) {
    const out = [];
    let j = 0;
    for (const a of left) {
      let best = -1, score = .24;
      for (let k = j; k < Math.min(m, j + 24); k++) {
        const s = similarity(a, right[k]);
        if (s > score) { score = s; best = k; }
        if (s === 1) break;
      }
      if (best < 0) out.push({a, b: null, score: 0});
      else {
        while (j < best) out.push({a: null, b: right[j++], score: 0});
        out.push({a, b: right[j++], score});
      }
    }
    while (j < m) out.push({a: null, b: right[j++], score: 0});
    return out;
  }
  const width = m + 1, dp = new Float32Array((n + 1) * width), dir = new Uint8Array(dp.length);
  for (let i = 1; i <= n; i++) { dp[i * width] = -.65 * i; dir[i * width] = 1; }
  for (let j = 1; j <= m; j++) { dp[j] = -.65 * j; dir[j] = 2; }
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const at = i * width + j, s = similarity(left[i - 1], right[j - 1]);
    const together = s >= .24 ? dp[at - width - 1] + (s === 1 ? 3 : 2 * s - .4) : -Infinity;
    const up = dp[at - width] - .65, across = dp[at - 1] - .65;
    if (together >= up && together >= across) { dp[at] = together; dir[at] = 0; }
    else if (up >= across) { dp[at] = up; dir[at] = 1; }
    else { dp[at] = across; dir[at] = 2; }
  }
  const out = [];
  let i = n, j = m;
  while (i || j) {
    const d = dir[i * width + j];
    if (d === 0 && i && j) { const a = left[--i], b = right[--j]; out.push({a, b, score: similarity(a, b)}); }
    else if (d === 1 && i) out.push({a: left[--i], b: null, score: 0});
    else out.push({a: null, b: right[--j], score: 0});
  }
  return out.reverse();
}

function wordDiff(a, b) {
  const aa = a.match(/\s+|[^\s]+/g) || [], bb = b.match(/\s+|[^\s]+/g) || [];
  const keepA = new Set(), keepB = new Set();
  if (aa.length * bb.length > 90000) {
    let first = 0;
    while (first < Math.min(aa.length, bb.length) && aa[first] === bb[first]) { keepA.add(first); keepB.add(first++); }
    let i = aa.length - 1, j = bb.length - 1;
    while (i >= first && j >= first && aa[i] === bb[j]) { keepA.add(i--); keepB.add(j--); }
  } else {
    const w = bb.length + 1, dp = new Uint32Array((aa.length + 1) * w);
    for (let i = aa.length - 1; i >= 0; i--) for (let j = bb.length - 1; j >= 0; j--)
      dp[i * w + j] = aa[i] === bb[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    let i = 0, j = 0;
    while (i < aa.length && j < bb.length) {
      if (aa[i] === bb[j]) { keepA.add(i++); keepB.add(j++); }
      else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++;
      else j++;
    }
  }
  return {aa, bb, keepA, keepB};
}

function appendDiff(node, tokens, kept, kind) {
  let run = '', marked = null;
  const flush = () => {
    if (!run) return;
    node.append(marked ? el(kind, `mr-diff-${kind}`, run) : document.createTextNode(run));
    run = '';
  };
  tokens.forEach((token, index) => {
    const next = !kept.has(index);
    if (marked !== next) { flush(); marked = next; }
    run += token;
  });
  flush();
}

export function renderMaterial(host, options) {
  const {model, work, variant, compareId, mode = 'read', draft, onAction = () => {}, onScroll = () => {}} = options;
  const title = v => humanLabel(model.title?.(v) || v?.label);
  const author = v => { const a = model.author(v); return {...a, name: humanLabel(a?.name, 'Urheberschaft unbekannt')}; };
  const action = (type, payload = {}) => onAction(type, payload);
  const button = (text, fn, cls = '') => {
    const b = el('button', `mr-button ${cls}`, text); b.type = 'button'; b.addEventListener('click', fn); return b;
  };
  host.replaceChildren();
  host.className = `materialraum mr-${mode}`;
  const header = el('header', 'mr-header');
  header.append(button('← Zur Entwicklung', () => action('back'), 'mr-back'));
  const breadcrumb = el('div', 'mr-breadcrumb');
  breadcrumb.append(el('span', 'mr-brand', 'SPiRALCELLS'), el('span', '', humanLabel(work.title, 'Unbenanntes Werk')));
  header.append(breadcrumb);
  const modes = el('nav', 'mr-modes'); modes.setAttribute('aria-label', 'Mit der Fassung arbeiten');
  const read = button('Lesen', () => action('read')); read.setAttribute('aria-current', mode === 'read' ? 'page' : 'false');
  const compare = button('Vergleichen', () => action('compare', {variantId: compareId || (model.parents(variant)[0]?.id) || work.variants.find(v => v.id !== variant.id)?.id}));
  compare.disabled = work.variants.length < 2;
  compare.setAttribute('aria-current', mode === 'compare' ? 'page' : 'false');
  const edit = button('Weiterarbeiten', () => action('edit')); edit.setAttribute('aria-current', mode === 'edit' ? 'page' : 'false');
  let sourcePanel;
  const sourceButton = button('Herkunft', () => {
    sourcePanel.hidden = !sourcePanel.hidden;
    sourceButton.setAttribute('aria-expanded', String(!sourcePanel.hidden));
    if (!sourcePanel.hidden) sourcePanel.querySelector('button')?.focus();
  });
  sourceButton.setAttribute('aria-expanded', 'false');
  sourceButton.setAttribute('aria-controls', 'mr-source-panel');
  modes.append(read, compare, edit, sourceButton); header.append(modes); host.append(header);
  const scroller = el('div', 'mr-scroll'); scroller.tabIndex = -1; host.append(scroller);
  const masthead = el('div', 'mr-masthead');
  const by = author(variant);
  const kicker = el('div', 'mr-kicker', mode === 'compare' ? 'Zwei Fassungen · ein Zusammenhang' : mode === 'edit' ? 'Aus dieser Fassung weiterarbeiten' : 'Raum für das Material');
  masthead.append(kicker, el('h1', '', title(variant)));
  const byline = el('div', 'mr-byline');
  const dot = el('span', 'mr-author-dot'); dot.style.backgroundColor = /^#[a-f0-9]{3,8}$/i.test(by.color || '') ? by.color : '#807063'; dot.setAttribute('aria-hidden', 'true');
  byline.append(dot, el('span', '', by.name));
  const created = dateLabel(variant.created_at);
  if (created) byline.append(el('span', '', `Im Bestand seit ${created}`));
  masthead.append(byline); scroller.append(masthead);

  const parents = model.parents(variant);
  function provenance(target = variant) {
    const box = el('section', 'mr-provenance');
    box.setAttribute('aria-label', 'Herkunft und Verbindungen');
    const ps = model.parents(target);
    const source = el('div', 'mr-provenance-source');
    source.append(el('span', 'mr-small-label', 'Herkunft'));
    if (ps.length) {
      source.append(el('span', '', 'Entstanden aus '));
      ps.forEach((p, index) => {
        if (index) source.append(document.createTextNode(' · '));
        source.append(button(title(p), () => action('source', {variantId: p.id}), 'mr-link'));
      });
    } else source.append(el('span', '', target.source_ref ? 'Importiertes Material · Ursprung in den technischen Details' : 'Keine Ausgangsfassung im Bestand verzeichnet'));
    const contribution = target.contribution || {};
    const notes = contribution.notes || target.notes;
    if (notes) source.append(el('p', 'mr-note', humanLabel(notes, 'Bearbeitungshinweis in den technischen Details')));
    box.append(source);
    const relations = work.relations || [];
    const destinations = new Map();
    const ownIds = new Set(work.variants.map(v => v.id));
    for (const entry of relations) {
      const edge = entry.edge || entry.kante || entry;
      const from = edge.from_variant_id, to = edge.to_variant_id;
      const targetId = entry.targetVariantId || (ownIds.has(from) ? to : ownIds.has(to) ? from : null);
      const dest = model.byVariant.get(targetId);
      if (!dest || model.workOf(dest.id)?.id === work.id) continue;
      const key = `${from}:${to}:${edge.edge_type || entry.type || ''}`;
      if (!destinations.has(key)) destinations.set(key, {dest, edge, outgoing: ownIds.has(from), local: model.byVariant.get(ownIds.has(from) ? from : to)});
    }
    if (destinations.size) {
      const links = el('div', 'mr-related'); links.append(el('span', 'mr-small-label', 'Mit anderen Werken verbunden'));
      for (const {dest, edge, outgoing, local} of destinations.values()) {
        const destWork = model.workOf(dest.id), line = el('div', 'mr-relation');
        const kind = edge.edge_type || 'Verbindung';
        const names = {'verwendet': outgoing ? 'Verwendet Material aus' : 'Wird verwendet in', 'verwendung': outgoing ? 'Verwendet Material aus' : 'Wird verwendet in', 'abgeleitet-von': outgoing ? 'Geht zurück auf' : 'Ausgangspunkt für', 'erweitert': outgoing ? 'Erweitert' : 'Wird erweitert in', 'remixt-aus': outgoing ? 'Übernimmt Material aus' : 'Material übernommen in', 'widerspricht': 'Widerspricht', 'inspiriert': outgoing ? 'Inspiriert' : 'Inspiriert durch', 'gehört-zu': 'Gehört zum Zusammenhang'};
        line.append(el('span', 'mr-relation-kind', names[kind] || humanLabel(kind, 'Verbindung')));
        line.append(button(`${humanLabel(destWork?.title, 'Verbundenes Werk')} · ${title(dest)}`, () => action('follow', {variantId: dest.id}), 'mr-link'));
        if (local && local.id !== target.id) line.append(el('span', 'mr-relation-via', `Verbindung über „${title(local)}“ in diesem Werk`));
        links.append(line);
      }
      box.append(links);
    }
    const details = el('details', 'mr-technical');
    details.append(el('summary', '', 'Technische Details'));
    const raw = {Fassung: target.id, Werk: work.id, Ausgangsfassungen: ps.map(p => p.id), Quelle: target.source_ref || null, Bearbeitung: target.contribution || null, Gespeichert: target.created_at || null};
    details.append(el('pre', '', JSON.stringify(raw, null, 2))); box.append(details);
    return box;
  }
  sourcePanel = el('aside', 'mr-source-panel');
  sourcePanel.id = 'mr-source-panel'; sourcePanel.hidden = true;
  sourcePanel.setAttribute('aria-label', 'Herkunft und verbundene Werke');
  const closeSource = () => { sourcePanel.hidden = true; sourceButton.setAttribute('aria-expanded', 'false'); sourceButton.focus(); };
  sourcePanel.append(button('Schließen ×', closeSource, 'mr-source-close'), el('div', 'mr-kicker', 'Der Weg dieses Materials'), el('h2', '', 'Herkunft & Verbindungen'), provenance());
  sourcePanel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); closeSource(); } });
  host.append(sourcePanel);

  const currentParagraphs = materialParagraphs(variant.content);
  const positions = [];
  let selected = Number.isInteger(options.passage) ? options.passage : 0;
  const mark = (index, notify = true) => {
    selected = index;
    host.querySelectorAll('[data-passage]').forEach(node => node.classList.toggle('is-passage', Number(node.dataset.passage) === index));
    if (notify) { action('passage', {index}); onScroll({scroll: scroller.scrollTop, passage: index}); }
  };
  function paragraph(part, index, diff = null, side = 'left') {
    const wrap = el('section', 'mr-paragraph'); wrap.dataset.passage = String(index);
    const anchor = button(`Passage ${index + 1}`, () => mark(index), 'mr-passage-anchor');
    anchor.setAttribute('aria-label', `Passage ${index + 1} als Lesestelle merken`);
    const text = el(part.structured ? 'pre' : 'p', 'mr-text');
    if (diff) appendDiff(text, side === 'left' ? diff.aa : diff.bb, side === 'left' ? diff.keepA : diff.keepB, side === 'left' ? 'del' : 'ins');
    else text.textContent = part.text;
    wrap.append(anchor);
    if (part.heading) wrap.append(el('h3', 'mr-section-title', part.heading));
    if (part.role === 'source') {
      wrap.classList.add('mr-source-section');
      wrap.append(el('p', 'mr-source-scope', part.truncated ? 'Gespeicherter Ausschnitt · beim Import gekürzt' : 'Gespeicherter Quellabschnitt'));
    }
    wrap.append(text);
    text.addEventListener('click', () => { if (!window.getSelection()?.toString()) mark(index); });
    return wrap;
  }
  function sourceDetails(target) {
    const source = appSource(target.content);
    if (!source) return null;
    const details = el('details', 'mr-technical mr-envelope-details');
    details.append(el('summary', '', 'Technische Importdetails und unverändertes Quellpaket'));
    details.append(el('p', '', 'Hier bleibt das vollständige gespeicherte Paket einschließlich Dateipfaden und Importmetadaten zugänglich.'));
    details.append(el('pre', '', contentOf(target)));
    return details;
  }
  if (mode === 'edit') {
    const editor = el('form', 'mr-editor');
    editor.append(el('p', 'mr-editor-origin', `Neue Variante aus „${title(variant)}“. Die Ausgangsfassung bleibt erhalten. Das Material unten wird als neue Fassung gespeichert.`));
    const label = el('input', 'mr-input'); label.name = 'label'; label.id = 'mr-variant-label'; label.required = true; label.maxLength = 240; label.value = draft?.label ?? '';
    label.placeholder = 'Zum Beispiel: Der offene Schluss';
    const ll = el('label', 'mr-field-label', 'Name der neuen Fassung'); ll.htmlFor = label.id;
    editor.append(ll, label);
    const profiles = [...(model.agents?.values() || [])];
    const ralf = profiles.find(profile => profile.agent_type === 'human' && /^Ralf(?:\s|$)/i.test(profile.handle || ''));
    const authorChoice = el('select', 'mr-input'); authorChoice.id = 'mr-variant-author'; authorChoice.name = 'authorId';
    if (!ralf) { const own = el('option', '', 'Ralf · eigene Fassung'); own.value = ''; authorChoice.append(own); }
    for (const profile of profiles) {
      const identity = author({author_id: profile.id});
      const option = el('option', '', `${identity.name} · ${identity.kind === 'human' ? 'Person' : identity.kind === 'model' ? 'Modellprofil' : 'vorhandenes Profil'}`);
      option.value = profile.id; authorChoice.append(option);
    }
    const defaultAuthorId = draft?.authorId ?? ralf?.id ?? '';
    authorChoice.value = defaultAuthorId;
    if (options.authorSelection === true) {
      const al = el('label', 'mr-field-label', 'Urheberschaft der neuen Fassung'); al.htmlFor = authorChoice.id;
      editor.append(al, authorChoice, el('p', 'mr-editor-origin', 'Die Auswahl ordnet deine gespeicherte Bearbeitung einem vorhandenen Profil zu. Hier wird kein Modell ausgeführt.'));
    }
    const initialContent = draft?.content ?? contentOf(variant), source = appSource(initialContent);
    let editedContent;
    if (source) {
      editor.classList.add('mr-source-editor');
      editor.append(el('p', 'mr-editor-origin', 'Bearbeite die tatsächlich gespeicherten Quellabschnitte. Die Importangaben bleiben im Quellpaket erhalten. Beim Import gekürzte Abschnitte enthalten nur den damals gespeicherten Ausschnitt.'));
      const fields = source.sections.map((section, index) => {
        const cl = el('label', 'mr-field-label mr-section-title', humanLabel(section.title, `Quellabschnitt ${index + 1}`));
        const content = el('textarea', 'mr-edit-content mr-edit-source');
        content.id = `mr-source-content-${index}`; content.name = `section-${index}`; content.value = section.content;
        content.spellcheck = false; content.autocapitalize = 'off'; cl.htmlFor = content.id;
        editor.append(cl, el('p', 'mr-source-scope', section.truncated ? 'Gespeicherter Ausschnitt · beim Import gekürzt' : 'Gespeicherter Quellabschnitt'), content);
        return content;
      });
      editedContent = () => replaceAppSourceSections(initialContent, fields.map(field => field.value));
      const details = sourceDetails({content: initialContent});
      if (details) editor.append(details);
    } else {
      const content = el('textarea', 'mr-edit-content'); content.name = 'content'; content.id = 'mr-variant-content'; content.value = initialContent; content.spellcheck = true;
      const cl = el('label', 'mr-field-label', 'Material bearbeiten'); cl.htmlFor = content.id;
      editor.append(cl, content); editedContent = () => content.value;
    }
    const notes = el('textarea', 'mr-edit-notes'); notes.name = 'notes'; notes.id = 'mr-variant-notes'; notes.rows = 3; notes.value = draft?.notes ?? ''; notes.placeholder = 'Was hast du verändert oder übernommen?';
    const nl = el('label', 'mr-field-label', 'Bearbeitungshinweis · optional'); nl.htmlFor = notes.id;
    const values = () => ({label: label.value, content: editedContent(), notes: notes.value, authorId: options.authorSelection === true ? authorChoice.value : defaultAuthorId});
    editor.addEventListener('input', () => action('draft', values()));
    const footer = el('div', 'mr-editor-footer');
    const save = el('button', 'mr-button mr-primary', 'Variante speichern'); save.type = 'submit';
    footer.append(button('Zur Fassung zurück', () => action('read')), save);
    editor.addEventListener('submit', event => {
      event.preventDefault();
      if (!label.value.trim()) { label.setCustomValidity('Bitte gib der Fassung einen verständlichen Namen.'); label.reportValidity(); return; }
      label.setCustomValidity('');
      if (editor.reportValidity()) action('save', {...values(), label: label.value.trim()});
    });
    label.addEventListener('input', () => label.setCustomValidity(''));
    editor.append(nl, notes, footer); scroller.append(editor, provenance());
  } else if (mode === 'compare') {
    let other = model.byVariant.get(compareId);
    if (!other || other.id === variant.id) other = parents.find(v => v.id !== variant.id) || work.variants.find(v => v.id !== variant.id);
    if (!other) {
      scroller.append(el('p', 'mr-empty', 'Für dieses Werk ist noch keine zweite Fassung vorhanden.'), provenance());
    } else {
      const controls = el('div', 'mr-compare-controls');
      const label = el('label', '', 'Vergleichen mit'); label.htmlFor = 'mr-compare-choice';
      const choice = el('select', 'mr-input'); choice.id = label.htmlFor;
      const candidates = [...new Map([...work.variants, ...parents, other].filter(v => v.id !== variant.id).map(v => [v.id, v])).values()];
      for (const v of candidates) {
        const owner = model.workOf(v.id);
        const workLabel = owner && owner.id !== work.id ? ` · ${humanLabel(owner.title)}` : '';
        const o = el('option', '', `${title(v)} · ${author(v).name}${workLabel}`); o.value = v.id; o.selected = v.id === other.id; choice.append(o);
      }
      choice.addEventListener('change', () => action('compare', {variantId: choice.value}));
      controls.append(label, choice); scroller.append(controls);
      const legend = el('p', 'mr-compare-explanation');
      const sourceComparison = appSource(variant.content) || appSource(other.content);
      const explanation = sourceComparison
        ? 'Quellabschnitte sind anhand gleicher gespeicherter Abschnittstitel in ihrer Reihenfolge zugeordnet. Verglichen wird der gespeicherte Code, einschließlich gekürzter Ausschnitte. '
        : 'Passagen sind nach gemeinsamen Wörtern und ihrer Reihenfolge zugeordnet. Das ist ein Textabgleich, keine Aussage über gleiche Bedeutung. ';
      legend.append(document.createTextNode(`${explanation}Bei langen Abschnitten werden zusammenhängende Änderungsbereiche markiert. `), el('del', 'mr-diff-del', 'Links entfallen'), document.createTextNode(' · '), el('ins', 'mr-diff-ins', 'Rechts hinzugekommen'));
      scroller.append(legend);
      const headings = el('div', 'mr-compare-headings');
      for (const v of [variant, other]) {
        const h = el('div', ''); h.append(el('span', 'mr-small-label', v.id === variant.id ? 'Deine Ausgangsfassung' : 'Vergleichsfassung'), el('h2', '', title(v)), el('p', '', author(v).name));
        if (v.id !== variant.id) h.append(button('Diese Fassung lesen →', () => action('select', {variantId: v.id}), 'mr-link'));
        headings.append(h);
      }
      scroller.append(headings);
      const aligned = alignParagraphs(currentParagraphs, materialParagraphs(other.content));
      const comparison = el('article', 'mr-comparison'); comparison.setAttribute('aria-label', 'Vollständiger Fassungsvergleich');
      const changes = [];
      for (const pair of aligned) {
        const row = el('section', 'mr-compare-row');
        const sameText = pair.a && pair.b && pair.a.text === pair.b.text;
        const equal = sameText && pair.a.truncated === pair.b.truncated;
        row.classList.toggle('mr-unchanged', Boolean(equal));
        const correspondence = el('div', 'mr-correspondence', pair.a && pair.b ? `Passage ${pair.a.index + 1} ↔ ${pair.b.index + 1}${equal ? ' · unverändert' : sameText ? ' · Speicherumfang verändert' : ' · Text verändert'}` : pair.a ? `Passage ${pair.a.index + 1} · ohne Zuordnung rechts` : `Passage ${pair.b.index + 1} · ohne Zuordnung links`);
        row.append(correspondence);
        const diff = pair.a && pair.b && !equal ? wordDiff(pair.a.text, pair.b.text) : null;
        for (const [side, part] of [['left', pair.a], ['right', pair.b]]) {
          const cell = el('div', `mr-compare-cell mr-${side}`);
          if (part) {
            const p = paragraph(part, pair.a?.index ?? selected, diff, side);
            p.querySelector('.mr-passage-anchor').textContent = `${side === 'left' ? 'Links' : 'Rechts'} · Passage ${part.index + 1}`;
            p.querySelector('.mr-passage-anchor').setAttribute('aria-label', side === 'left' ? `Passage ${part.index + 1} als Lesestelle merken` : `Zugeordnete Passage ${part.index + 1} rechts`);
            if (!pair.a || !pair.b) {
              const kind = side === 'left' ? 'del' : 'ins';
              p.querySelector('.mr-text').replaceChildren(el(kind, `mr-diff-${kind}`, part.text));
            }
            if (!pair.a) {
              p.removeAttribute('data-passage');
              p.querySelector('.mr-passage-anchor').disabled = true;
              p.querySelector('.mr-passage-anchor').setAttribute('aria-label', `Passage ${part.index + 1} rechts, ohne Zuordnung`);
            }
            cell.append(p);
          } else cell.append(el('p', 'mr-no-passage', 'Keine zugeordnete Passage'));
          row.append(cell);
        }
        comparison.append(row);
        if (pair.a) positions.push({node: row, index: pair.a.index});
        if (!equal) changes.push(row);
      }
      const navigation = el('div', 'mr-compare-navigation');
      let changeAt = -1;
      const move = delta => {
        if (!changes.length) return;
        changeAt = changeAt < 0 ? delta < 0 ? changes.length - 1 : 0 : (changeAt + delta + changes.length) % changes.length;
        changes[changeAt].scrollIntoView({block: 'start', behavior: 'instant'});
        changes[changeAt].tabIndex = -1; changes[changeAt].focus({preventScroll: true});
      };
      navigation.append(el('span', '', `${changes.length} ${changes.length === 1 ? 'abweichende Passage' : 'abweichende Passagen'}`), button('← Vorige', () => move(-1)), button('Nächste →', () => move(1)), button('Daraus weiterarbeiten', () => action('edit'), 'mr-primary'));
      scroller.append(navigation, comparison);
      for (const target of [variant, other]) {
        const details = sourceDetails(target);
        if (details) {
          details.querySelector('summary').textContent = `Technische Importdetails · ${title(target)}`;
          scroller.append(details);
        }
      }
      scroller.append(provenance());
    }
  } else {
    const body = el('article', 'mr-reading'); body.setAttribute('aria-label', 'Vollständiges Material der ausgewählten Fassung');
    if (appSource(variant.content)) body.classList.add('mr-app-reading');
    if (!currentParagraphs.length) body.append(el('p', 'mr-empty', 'Für diese Fassung ist kein Textmaterial im Bestand hinterlegt.'));
    for (const part of currentParagraphs) {
      const node = paragraph(part, part.index); body.append(node); positions.push({node, index: part.index});
    }
    scroller.append(body);
    const details = sourceDetails(variant);
    if (details) scroller.append(details);
    scroller.append(provenance());
  }
  const end = el('footer', 'mr-end');
  end.append(el('span', '', 'Das Material endet hier.'), button('Zur räumlichen Entwicklung ↑', () => action('back'), 'mr-link'));
  scroller.append(end);
  mark(selected, false);
  let scheduled = false, restoring = true;
  scroller.addEventListener('scroll', () => {
    if (restoring || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (!host.contains(scroller)) return;
      const top = scroller.getBoundingClientRect().top + 130;
      let active = positions[0]?.index ?? selected;
      for (const p of positions) {
        if (p.node.getBoundingClientRect().top > top) break;
        active = p.index;
      }
      mark(active, false);
      onScroll({scroll: scroller.scrollTop, passage: active});
    });
  }, {passive: true});
  requestAnimationFrame(() => {
    if (!host.contains(scroller)) return;
    if (typeof options.scroll === 'number') scroller.scrollTop = options.scroll;
    else if (selected > 0) positions.find(p => p.index === selected)?.node.scrollIntoView({block: 'start', behavior: 'instant'});
    requestAnimationFrame(() => { restoring = false; });
  });
  return {scroller, passage: () => selected};
}
