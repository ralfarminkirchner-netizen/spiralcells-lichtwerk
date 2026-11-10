/* Lesen: der Wortlaut einer Fassung oder eines Gesprächs, als ruhiger Text.
   Der Wortlaut wird nicht umgeschrieben. Quelltext und Belegorte liegen in einer geschlossenen Ansicht
   „Technische Details“ (Grundmanifest); sie öffnet sich nur, wenn man sie öffnet. */

const sicher = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function zeile(s, bildUrl){
  let t = sicher(s);
  t = t.replace(/!\[([^\]]*)\]\((?:file:\/\/)?(\/[^)\s]+\.(?:png|jpe?g|webp))\)/gi, (_, alt, pfad) => `<img loading="lazy" alt="${alt}" src="${sicher(bildUrl({pfad: decodeURI(pfad)}, 960))}">`);
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  return t.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
}

export function alsText(roh, bildUrl){
  const aus = []; let liste = null, absatz = [], code = null;
  const schliesse = () => { if(absatz.length){ aus.push('<p>' + absatz.join('<br>') + '</p>'); absatz = []; } if(liste){ aus.push(`</${liste}>`); liste = null; } };
  for(const z of String(roh || '').replace(/\r/g, '').split('\n')){
    if(/^```/.test(z)){ if(code == null){ schliesse(); code = []; } else { aus.push('<pre>' + sicher(code.join('\n')) + '</pre>'); code = null; } continue; }
    if(code != null){ code.push(z); continue; }
    const k = z.match(/^(#{1,6})\s+(.*)$/), p = z.match(/^\s*[-*•]\s+(.*)$/), n = z.match(/^\s*\d+[.)]\s+(.*)$/);
    if(!z.trim()) schliesse();
    else if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(z)){ schliesse(); aus.push('<hr>'); }
    else if(k){ schliesse(); const st = Math.min(4, k[1].length + 1); aus.push(`<h${st}>${zeile(k[2], bildUrl)}</h${st}>`); }
    else if(p || n){ const art = p ? 'ul' : 'ol'; if(absatz.length){ aus.push('<p>' + absatz.join('<br>') + '</p>'); absatz = []; } if(liste !== art){ if(liste) aus.push(`</${liste}>`); aus.push(`<${art}>`); liste = art; } aus.push('<li>' + zeile((p || n)[1], bildUrl) + '</li>'); }
    else if(/^\s*>/.test(z)){ schliesse(); aus.push('<blockquote>' + zeile(z.replace(/^\s*>\s?/, ''), bildUrl) + '</blockquote>'); }
    else { if(liste){ aus.push(`</${liste}>`); liste = null; } absatz.push(zeile(z, bildUrl)); }
  }
  if(code != null) aus.push('<pre>' + sicher(code.join('\n')) + '</pre>'); schliesse();
  return aus.join('\n');
}

export async function lesetext(k, texte, bildUrl){
  if(k.art === 'gespraech'){ const r = await fetch('/lichtwerk/gespraech?n=' + k.nr); if(!r.ok) throw new Error('gespraech'); const d = await r.json(); return alsText(String(d.text || '').replace(/^#\s+.*\n/, ''), bildUrl); }
  const roh = (texte.get(k.kennung) || '').trim();
  if(roh.startsWith('{')){ try { const d = JSON.parse(roh);
      let h = alsText(d.summary || '', bildUrl);
      if(d.scope || (d.sections || []).length){ h += '<details class="technik"><summary>Technische Details</summary>' + (d.scope ? '<p>' + sicher(d.scope) + '</p>' : '');
        for(const s of d.sections || []) h += `<h4>${sicher(s.title || 'Abschnitt')}</h4>` + (s.locator ? `<p><code>${sicher(s.locator)}</code></p>` : '') + '<pre>' + sicher(s.content || '') + '</pre>';
        h += '</details>'; }
      return h; } catch(e){ /* kein JSON: als Text lesen */ } }
  if(/^<!doctype html/i.test(roh)) return '<p class="klein">Diese Fassung ist eine gebaute Seite. Ihr Quelltext:</p><details class="technik"><summary>Technische Details</summary><pre>' + sicher(roh.slice(0, 60000)) + '</pre></details>';
  return alsText(roh, bildUrl);
}
