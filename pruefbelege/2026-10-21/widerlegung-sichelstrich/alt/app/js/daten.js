/* =====================================================================
   DATEN — eine Linse über den SPiRALCELLS-Bestand.
   Baut aus GET /api/graph das Bildmodell: Monde, Keime, Samen, Stimmen,
   Kopplung, Reife, Fäden. Speichert nichts, erfindet nichts, rechnet nur ab.
   Läuft im Browser und in Node (für ABBILDUNG.md und Tests).
   ===================================================================== */

export const STIMMEN = [
  {key:'claude',      name:'Claude',      rolle:'Systemleitung und Tragwerk', schrift:'bindend',  hex:'#ffb45c', muster:/^claude/i},
  {key:'codex',       name:'Codex',       rolle:'Architektur und Prüfung',    schrift:'getaktet', hex:'#38c8ff', muster:/^codex/i},
  {key:'hermes',      name:'Hermes',      rolle:'Bote',                       schrift:'springt quer', hex:'#86e070', muster:/^hermes/i},
  {key:'antigravity', name:'Antigravity', rolle:'Präsentation',               schrift:'Auftrieb', hex:'#9b7bff', muster:/^anti-?\s?gravity/i},
  {key:'kimi',        name:'Kimi',        rolle:'Recherche und Umsetzung',    schrift:'Weite',    hex:'#ff5e8a', muster:/^kimi/i},
];
export const MENSCH = 'mensch', QUELLE = 'quelle';
export const FORM_NOTIZ = 'Form ohne Modell · KiNFORMER';

/* Reife des Monds: Mondphase der Hülle (Anteil beleuchtet) */
export const REIFE = {
  frisch:    {phase:0.10, satz:'Frisch: erst eine Spur.'},
  gesichtet: {phase:0.38, satz:'Gesichtet: mehrere Spuren, noch getrennt.'},
  gereift:   {phase:0.68, satz:'Gereift: die Stimmen lesen einander.'},
  kanonisch: {phase:1.00, satz:'Kanonisch: von Ralf kristallisiert.'},
};

const SPOKE = 144, GOLD = 137.50776;
const ms = s => { const t = Date.parse(s); return Number.isNaN(t) ? 0 : t; };

/* Sichtbare Texte nie mit Kennungen, Prüfsummen oder lokalen Pfaden.
   Der unveränderte Wortlaut bleibt in den Technischen Details erreichbar.
   Gleich in server/lichtwerk_server.py; ein Test vergleicht beide an denselben Beispielen. Längen in Codepunkten. */
const pfadname = p => { const n = p.replace(/\/+$/, '').split('/').pop(); return n && [...n].length <= 60 ? n : '[lokaler Speicherort]'; };
export function menschlich(text){
  return String(text ?? '')
    .replace(/\[([^\]\n]{1,200})\]\((?:[^)\s]{1,600})\)/gu, '$1')                // Markdown-Verweis: nur sein Text
    .replace(/\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi, '[technische Kennung]')
    .replace(/\b[0-9a-f]{40,64}\b/gi, '[Prüfsumme]')
    .replace(/\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,39}\b/gi, '[Prüfsumme]')                      // kurze Hashes, z. B. Commits
    .replace(/(?:file:\/\/)?\/(?:Users|Volumes|home|private|tmp|opt)\/[^\s<>"'`)\]]+/g, pfadname)        // lokaler Pfad: nur der Dateiname
    .replace(/(?:~|\$HOME)\/[^\s<>"'`)\]]+/g, pfadname)
    .replace(/(^|[^A-Za-z0-9])-(?:Users|Volumes)-[A-Za-z0-9._-]+/g, '$1[lokaler Speicherort]');            // Ordnernamen wie -Users-name-Documents-…
}
/* Was man auf einer Seite liest: ohne Kopf, Stil und Zeichen der Auszeichnung */
export function sichtbarerText(html){
  return String(html || '').replace(/<head[\s\S]*?<\/head>/i, ' ').replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#\d+|#x[0-9a-f]+|[a-z]+);/gi, 'x').replace(/\s+/g, ' ').trim();
}
export function kurz(text, n){ const s = menschlich(text).replace(/\s+/g, ' ').trim(), z = [...s]; return z.length > n ? z.slice(0, n - 1).join('').trimEnd() + '…' : s; }
const MONATE = ['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.'];
export function datum(t, mitZeit = true){
  if(!t) return 'ohne Datum';
  const d = new Date(t), tag = `${d.getDate()}. ${MONATE[d.getMonth()]}`;
  return mitZeit ? `${tag}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` : tag;
}

export function stimmeVon(agent){
  if(!agent) return QUELLE;
  if(agent.agent_type === 'human') return MENSCH;
  const h = String(agent.handle || '');
  for(let i = 0; i < STIMMEN.length; i++) if(STIMMEN[i].muster.test(h)) return i;
  return QUELLE;
}
export function nameVon(agent){
  if(!agent) return 'Urheberschaft nicht hinterlegt';
  const s = stimmeVon(agent);
  if(typeof s === 'number') return STIMMEN[s].name;
  return menschlich(String(agent.handle || '').split(' —')[0]) || 'Unbenannter Eintrag';
}

/* ---------------------------------------------------------------- Bestand */
export function bestand(graph){
  const g = {agents:[], works:[], worktrees:[], variants:[], edges:[], findings:[], ...graph};
  const A = new Map(g.agents.map(a => [a.id, a]));
  const W = new Map(g.works.map(w => [w.id, w]));
  const T = new Map(g.worktrees.map(t => [t.id, t]));
  const V = new Map(g.variants.map(v => [v.id, v]));
  const E = new Map(g.edges.map(e => [e.id, e]));
  const werkVon = vid => { const v = V.get(vid); const t = v && T.get(v.worktree_id); return t ? t.work_id : null; };
  const stimmeDer = vid => { const v = V.get(vid); return v ? stimmeVon(A.get(v.author_id)) : QUELLE; };
  const mensch = g.agents.find(a => a.agent_type === 'human') || null;

  /* Form-Körner: Ralf hat eine Form des KiNFORMER behalten. Erkannt an Notiz, Urheber Ralf, Seitenanfang
     und Faden „verweist auf“ zum Original, alles zusammen. Sie zählen für nichts, was die Stimmen tun. */
  const formen = new Map(), formFaden = new Set();   // Form → Original; Formen mit gezogenem Faden
  for(const e of g.edges){
    if(e.edge_type !== 'verweist-auf') continue;
    const v = V.get(e.from_variant_id), a = v && A.get(v.author_id);
    if(v && a && a.agent_type === 'human' && a.handle === 'Ralf' && e.author_id === a.id && String(v.notes || '').startsWith(FORM_NOTIZ)
      && /^<!doctype html>/i.test(String(v.content || '').trimStart()) && V.has(e.to_variant_id) && !formen.has(v.id)){ formen.set(v.id, e.to_variant_id); formFaden.add(v.id); }
  }
  // Fehlt der Faden nach einem Abbruch, gilt das Gesehene, wie auf dem Server: eine halbe Form zählt nie als Gegenlese
  for(const v of g.variants){
    if(formen.has(v.id) || !String(v.notes || '').startsWith(FORM_NOTIZ) || !/^<!doctype html>/i.test(String(v.content || '').trimStart())) continue;
    const a = A.get(v.author_id), gesehen = ((v.contribution || {}).seen_variant_ids || [])[0];
    if(a && a.agent_type === 'human' && a.handle === 'Ralf' && gesehen && V.has(gesehen)) formen.set(v.id, gesehen);
  }

  // Rundenbriefings: Fassungen, auf die eine Erstbearbeitung als gemeinsame Ausgangsfrage verweist
  const briefing = new Set();
  for(const v of g.variants){ const rc = v.contribution && v.contribution.round_context; if(rc && rc.source_variant_id) briefing.add(rc.source_variant_id); }

  const proWerk = new Map(g.works.map(w => [w.id, {baeume:[], fassungen:[]}]));
  for(const t of g.worktrees){ const p = proWerk.get(t.work_id); if(p) p.baeume.push(t); }
  for(const v of g.variants){ const t = T.get(v.worktree_id); const p = t && proWerk.get(t.work_id); if(p) p.fassungen.push(v); }

  // Befunde je Kante bzw. je Variantenpaar
  const befundZuKante = new Map(), befundZuPaar = [];
  for(const f of g.findings){
    if(f.target_edge_id){ if(!befundZuKante.has(f.target_edge_id)) befundZuKante.set(f.target_edge_id, []); befundZuKante.get(f.target_edge_id).push(f); }
    else if(f.target_variant_ids) befundZuPaar.push(f);
  }

  const monde = [];
  for(const w of g.works){
    const p = proWerk.get(w.id), fs = p.fassungen.slice().sort((a,b) => ms(a.created_at) - ms(b.created_at));
    // Keim: das gemeinsame Rundenbriefing samt seiner Fassungen im selben Zweig; sonst die älteste Wurzel
    let keimIds = new Set(fs.filter(v => briefing.has(v.id)).map(v => v.id));
    if(keimIds.size){
      const keimBaeume = new Set(fs.filter(v => keimIds.has(v.id)).map(v => v.worktree_id));
      for(const v of fs) if(keimBaeume.has(v.worktree_id) && (v.tags || []).some(t => /auftrag/i.test(t)) ) keimIds.add(v.id);
    } else {
      // ohne Briefing: die älteste Wurzel nur, wenn keine Stimme sie schrieb (sonst wäre ihr Beitrag als Frage verkleidet)
      const wurzel = fs.find(v => !v.derived_from && !formen.has(v.id));
      if(wurzel && stimmeDer(wurzel.id) === QUELLE) keimIds.add(wurzel.id);   // nur eine übernommene Quelle wird Frage, nie eine Stimme oder Ralfs Einwurf
    }
    const keim = fs.filter(v => keimIds.has(v.id));
    const samen = fs.filter(v => !keimIds.has(v.id)).map(v => { const form = formen.has(v.id); return {
      id: v.id, fassung: v, stimme: stimmeVon(A.get(v.author_id)), zeit: ms(v.created_at),
      // ein Form-Korn: kein Status, der anderswo gesetzt wurde, und Licht nach dem sichtbaren Wortlaut, nicht nach den Bytes der Seite
      status: form ? 'entwurf' : v.status || 'entwurf', laenge: form ? sichtbarerText(v.content).length : (v.content || '').length,
      modus: (v.contribution || {}).mode || null, baum: v.worktree_id, label: v.label || 'Unbenannte Fassung',
      form, original: form ? formen.get(v.id) : null,
    }; });
    const stimmen = new Set(samen.map(s => s.stimme).filter(s => typeof s === 'number'));
    const zweige = STIMMEN.map((_, i) => ({
      baeume: p.baeume.filter(t => stimmeVon(A.get(t.author_id)) === i).length,
      samen: samen.filter(s => s.stimme === i).length,
      zeichen: samen.filter(s => s.stimme === i).reduce((n, s) => n + s.laenge, 0),
      erst: samen.filter(s => s.stimme === i && s.modus === 'independent-first').length,
      gegen: samen.filter(s => s.stimme === i && s.modus === 'review').length,
    }));

    // Fäden: Kanten, die eine Fassung dieses Monds berühren
    const eigene = new Set(fs.map(v => v.id));
    const faeden = [], aussen = [];
    for(const e of g.edges){
      const a = eigene.has(e.from_variant_id), b = eigene.has(e.to_variant_id);
      if(!a && !b) continue;
      const bf = befundZuKante.get(e.id) || [];
      const f = {kante: e, von: e.from_variant_id, nach: e.to_variant_id, typ: e.edge_type, befunde: bf, beleg: beleg(bf), urteil: urteil(bf), verwendung: !!e.usage,
        form: formFaden.has(e.from_variant_id) && formen.get(e.from_variant_id) === e.to_variant_id};   // der Faden einer Form: zart, zählt nicht
      if(a && b) faeden.push(f); else aussen.push({...f, anderesWerk: werkVon(a ? e.to_variant_id : e.from_variant_id)});
    }
    const befunde = g.findings.filter(f => {
      if(f.target_edge_id){ const e = E.get(f.target_edge_id); return e && (eigene.has(e.from_variant_id) || eigene.has(e.to_variant_id)); }
      return (f.target_variant_ids || []).some(id => eigene.has(id));
    });

    // Kopplung: Anteil der gerichteten Stimmenpaare mit belegtem Bezug (gesehen, verbunden, befundet)
    const paare = new Map();   // Stimmenpaar → frühester Beleg (Zeit)
    const bezug = (i, j, t) => { if(typeof i === 'number' && typeof j === 'number' && i !== j && stimmen.has(i) && stimmen.has(j)){ const k = i * 5 + j; paare.set(k, Math.min(paare.get(k) ?? Infinity, t || 0)); } };
    for(const s of samen){ if(s.form) continue;
      for(const sid of ((s.fassung.contribution || {}).seen_variant_ids || [])) if(eigene.has(sid) && !keimIds.has(sid)) bezug(s.stimme, stimmeDer(sid), s.zeit);
    }
    // ein Faden zählt nur, wenn die Stimme ihn selbst gezogen hat: Ralfs Verbinden hebt die Kopplung der Stimmen nicht
    for(const f of faeden) if(f.typ !== 'gehört-zu' && !f.form && stimmeVon(A.get(f.kante.author_id)) === stimmeDer(f.von)) bezug(stimmeDer(f.von), stimmeDer(f.nach), ms(f.kante.created_at));
    for(const bf of befunde){
      const autor = stimmeVon(A.get(bf.author_id));
      const ziele = bf.target_edge_id ? [E.get(bf.target_edge_id)?.from_variant_id, E.get(bf.target_edge_id)?.to_variant_id] : (bf.target_variant_ids || []);
      for(const z of ziele) if(z) bezug(autor, stimmeDer(z), ms(bf.created_at));
    }
    const nv = stimmen.size, kopplung = nv >= 2 ? paare.size / (nv * (nv - 1)) : 0;

    const kristall = samen.filter(s => s.status === 'grundformation');
    const verworfen = samen.filter(s => s.status === 'verworfen').length;
    const geprueft = samen.filter(s => s.status === 'geprüft').length;
    const probe = befunde.some(f => f.evidence_status === 'executed-probe');
    const gegenlesen = samen.filter(s => s.modus === 'review' && !s.form).length;
    const echteFaeden = faeden.filter(f => !f.form).length;   // weder Form noch Formfaden machen einen Mond reifer
    let reife = 'frisch';
    if(kristall.length) reife = 'kanonisch';
    else if(kopplung >= 0.5 || (probe && nv >= 2) || geprueft) reife = 'gereift';
    else if(nv >= 2 || echteFaeden || befunde.length || gegenlesen) reife = 'gesichtet';

    const zeiten = fs.map(v => ms(v.created_at)).filter(Boolean);
    monde.push({
      id: w.id, werk: w, titel: menschlich(w.title || '') || 'Unbenannter Mond', art: w.work_type, tags: (w.tags || []).map(menschlich),
      erstellt: ms(w.created_at), keim, keimKristall: keim.some(v => v.status === 'grundformation'),
      keimSatz: keim.length ? kurz(keim[0].label, 80) : 'Ohne Ausgangsfrage',
      samen, stimmen: [...stimmen].sort(), zweige, kopplung, paare: [...paare.keys()].map(k => [Math.floor(k / 5), k % 5]),
      paarZeiten: [...paare.values()].sort((a, b) => a - b),
      paarBelege: [...paare.entries()].map(([k, t]) => [Math.floor(k / 5), k % 5, t]),
      reife, phase: REIFE[reife].phase, kristall, verworfen, geprueft, gegenlesen, probe,
      winkel: kristall.length ? GOLD : nv === 0 ? null : SPOKE + (GOLD - SPOKE) * 0.84 * kopplung,   // Traumfeld: keine Ordnung, der goldene Winkel bleibt Ralfs Kristallisieren
      faeden, aussen, befunde, zeitspanne: zeiten.length ? [Math.min(...zeiten), Math.max(...zeiten)] : [0, 0],
      traumfeld: nv === 0 && !samen.some(s => s.stimme === MENSCH && !s.form),   // eine behaltene Form bewohnt kein Traumfeld
      baeume: p.baeume.length,
    });
  }
  monde.sort((a, b) => a.erstellt - b.erstellt);
  return {monde, mondVon: new Map(monde.map(m => [m.id, m])), agenten: A, fassungen: V, kanten: E, baeume: T, werkVon, stimmeDer, mensch, formen, roh: g};
}

/* Belegqualität eines Fadens: ausgeführte Probe fest, Erwartung mittel, Behauptung zart, ohne Befund kaum sichtbar */
export function beleg(bf){
  if(!bf || !bf.length) return 0;
  let b = 0.25;
  for(const f of bf){ const e = f.evidence_status; b = Math.max(b, e === 'executed-probe' ? 1 : e === 'expectation' ? 0.55 : 0.35); }
  return b;
}
/* Kappung statt Mittelung (konzept.md §13.1): das schwächste Urteil zählt */
export function urteil(bf){
  if(!bf || !bf.length) return null;
  const rang = {'nicht-tragfähig':0, 'teilweise':1, 'tragfähig':2};
  return bf.reduce((m, f) => (rang[f.verdict] ?? 1) < (rang[m] ?? 1) ? f.verdict : m, 'tragfähig');
}
export const URTEIL_SATZ = {'tragfähig':'trägt', 'teilweise':'trägt teilweise', 'nicht-tragfähig':'trägt nicht'};
export const BELEG_SATZ = {'executed-probe':'ausgeführte Probe', 'expectation':'Erwartung', 'claim':'Behauptung'};
export const TYP_SATZ = {'remixt-aus':'ist neu gemischt aus', 'erweitert':'erweitert', 'testet':'prüft', 'widerspricht':'widerspricht', 'bewertet':'bewertet', 'verweist-auf':'verweist auf', 'gehört-zu':'gehört zu'};
export const MODUS_SATZ = {'independent-first':'unabhängiger Erstbeitrag', 'review':'Gegenlese', 'joint-trial':'gemeinsame Probe', 'continuation':'Weiterarbeit'};
export const STATUS_SATZ = {'entwurf':'Entwurf', 'geprüft':'geprüft', 'grundformation':'Grundformation', 'verworfen':'verworfen'};
