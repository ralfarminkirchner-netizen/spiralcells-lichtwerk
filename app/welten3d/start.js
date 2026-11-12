/* Wählt die Welt aus der Adresse (#galaxie/…, #garten/…) und baut den Weltwechsel.
   Beim Wechsel geht nur die Adresse mit: dieselbe Wahl, dieselbe Suche. Kein Übergang zwischen den Welten. */
const WELTEN = [['galaxie', 'Galaxie'], ['garten', 'Garten'], ['dorf', 'Dorf']];
const jetzt = () => { const t = location.hash.replace(/^#/, '').split(/[/?]/)[0]; return WELTEN.some(w => w[0] === t) ? t : 'galaxie'; };
const welt = jetzt(), nav = document.getElementById('welten');
for(const [id, name] of WELTEN){
  const b = document.createElement('button'); b.textContent = name; b.setAttribute('aria-pressed', id === welt);
  b.onclick = () => { if(id === jetzt()) return; const h = location.hash.replace(/^#/, ''), rest = WELTEN.some(w => h.split(/[/?]/)[0] === w[0]) ? h.replace(/^[^/?]+/, '') : (h ? '/' + h : ''); location.hash = '#' + id + rest; location.reload(); };
  nav.append(b);
}
import(`./${welt}.js`);
