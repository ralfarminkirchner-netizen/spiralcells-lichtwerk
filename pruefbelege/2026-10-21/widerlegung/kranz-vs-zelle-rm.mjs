// Nur rechnen: Winkel- und Schirmgeschwindigkeit des Netz-Kranzes (immer) gegen die Zellköpfe unter RM
const TAU = Math.PI * 2, T = [2.1, 2.7, 1.3, 3.4, 4.2];           // zelle.js:15
const om = T.map(t => TAU / t), omRM = om.map(w => w * 0.15);       // zelle.js:17
const omC_RM = TAU / 2.4 * 0.15, kranz = TAU / 16;                   // zelle.js:17, netz.js:107
console.log('Zelle normal rad/s', om.map(x => x.toFixed(2)).join(' '));
console.log('Zelle RM     rad/s', omRM.map(x => x.toFixed(2)).join(' '), ' Kopplung RM', omC_RM.toFixed(2));
console.log('Netz-Kranz   rad/s', kranz.toFixed(3), '(immer)');
// Zelle: Kopf bei rho ~ orbitR = 1.16 Rs, Schirm-Halbhöhe Sc = memR*1.32 >= 1.2*orbitR*1.32 (zelle.js:174,184,185)
const H = 300, rZelle = H / (1.2 * 1.32);
console.log('Zelle RM Schirm px/s bei 800x600:', omRM.map(w => (w * rZelle).toFixed(0)).join(' '), ' (Radius ~', rZelle.toFixed(0), 'px)');
// Netz, Blick in die Mitte: S = 1.08 R (regie.js:24), Kranz bei 1.06 R
const rMitte = H * 1.06 / 1.08;
console.log('Netz-Kranz in der Mitte px/s:', (kranz * rMitte).toFixed(0), ' (Radius ~', rMitte.toFixed(0), 'px)');
