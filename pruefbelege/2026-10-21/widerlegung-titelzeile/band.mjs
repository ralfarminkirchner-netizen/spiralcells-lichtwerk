// Bildzeile (#line, stil.css Z.36-39) gegen die Grenzen der Namen (haupt.js Z.46 und Z.498)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
for (const [w, h, zeilen] of [[800, 600, 1], [1280, 800, 1], [1440, 900, 1], [1920, 1080, 1], [375, 812, 3], [390, 844, 3]]) {
  const font = clamp(0.009 * w + 10, 15, 21), lh = 1.5 * font, unten = 0.09 * h;
  const zeileOben = h - unten - zeilen * lh, zeileUnten = h - unten;
  // Dachname: Rechteck y0..y0+16 erlaubt bis y0 <= h-64; überdeckt die Zeile, wenn y0+16 > zeileOben
  const dachBand = [Math.max(60, zeileOben - 16), h - 64];
  // Werkname: y..y+14 erlaubt bis y <= h-70
  const werkBand = [Math.max(56, zeileOben - 14), h - 70];
  console.log(`${w}x${h}: Zeile ${zeileOben.toFixed(1)}–${zeileUnten.toFixed(1)} | Dachname deckt Zeile bei y0 in ${dachBand.map(v => v.toFixed(0)).join('–')} (${(dachBand[1] - dachBand[0]).toFixed(0)} px) | Werkname bei y in ${werkBand.map(v => v.toFixed(0)).join('–')} (${(werkBand[1] - werkBand[0]).toFixed(0)} px)`);
}
// Titelblock .mark: top 20, 11px + span margin 7 + 10px, Zeilenhöhe normal ≈ 1.2
const titelUnten = 20 + 11 * 1.2 + 7 + 10 * 1.2;
console.log('Titelblock endet bei ≈', titelUnten.toFixed(1), 'px; Dachname darf ab 60 stehen → Abstand ≈', (60 - titelUnten).toFixed(1), 'px');
