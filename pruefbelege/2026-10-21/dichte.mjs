import {N, B} from './lage.mjs';
const bn = b => b === 'mitte' ? 'Mitte' : b === 'ohne' ? 'ohne Dach' : N.daecher[b].name;
const STa = {'verweist-auf': 0.3, 'remixt-aus': 0.5, 'erweitert': 0.42, 'testet': 0.34, 'widerspricht': 0.4, 'gehört-zu': 0.28};
console.log('\n--- Bündel: Länge, Punktzahl, Überdeckung (S=58 wie Mac 800x600)');
const S = 58, bz = Math.max(0.16, S * 0.006);
for(const x of N.buendel){ const za = N.bezirkZiel(x.von), zb = N.bezirkZiel(x.nach);
  const dist = Math.hypot(za.mitte[0] - zb.mitte[0], za.mitte[2] - zb.mitte[2]), rand = dist - za.R - zb.R;
  const n = Math.round(Math.min(120, Math.max(20, dist * 3)));
  const lift = rand * 0.12 + 0.6, bogenL = rand * 1.05 + lift * 1.2;   // grob: Sehne plus Hub
  const dicke = bz * (1 + 0.1 * Math.min(8, x.kanten)), abst = bogenL / n, al = STa[x.typ] + 0.03 * Math.min(8, x.kanten);
  console.log(`${bn(x.von)} -> ${bn(x.nach)}: Mittenabstand ${dist.toFixed(1)}, Rand zu Rand ${rand.toFixed(1)}, Punkte ${n}, Abstand ${abst.toFixed(2)}, Punktgröße ${dicke.toFixed(2)}, Überdeckung ${(dicke / abst).toFixed(1)}x, Alpha je Punkt bis ${(al * 1.1).toFixed(2)} -> Summe ~${(al * 1.1 * dicke / abst).toFixed(2)}`); }
