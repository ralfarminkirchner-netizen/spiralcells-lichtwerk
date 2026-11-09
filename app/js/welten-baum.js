/* Der Baum ist eine Ansicht wie die Welten: vorn in derselben Leiste, mit dem gewählten Werk (#werk=…) */
import {mitWerk, werkAus} from './auswahl.js';
const da = () => { const w = document.getElementById('wahl'); if(!w){ requestAnimationFrame(da); return; } if(w.querySelector('.zubaum')) return;
  const a = document.createElement('a'); a.className = 'zuseite zubaum'; a.textContent = 'Baum'; a.href = 'stufen.html'; a.style.borderLeft = '0'; a.style.marginLeft = '0';
  a.addEventListener('click', () => { a.href = 'stufen.html' + mitWerk('', werkAus(location.hash)); }); w.prepend(a); };
da();
