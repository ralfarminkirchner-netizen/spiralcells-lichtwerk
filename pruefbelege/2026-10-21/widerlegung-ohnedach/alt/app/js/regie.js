/* =====================================================================
   REGIE — die Kamera fährt zwischen drei Blickweisen auf denselben Zustand:
   Zelle von oben (ein Werk), Kelch von der Seite (seine Geschichte),
   Netz der Werke (die größere Zelle). Weich wie die Plansequenz des Lichtwerks.
   ===================================================================== */
import {DEG, clamp, mix, sstep, eio, CAM} from './licht.js';

export function regie(U, Z, N, RM){
  const asp = CAM.cssW / CAM.cssH, fit = 1 / Math.min(1, asp * 1.08), portrait = asp < 0.75;
  const kk = RM ? Math.round(U.kelchK) : eio(U.kelchK), nk = RM ? Math.round(U.netK) : eio(U.netK);
  // Zelle und Kelch
  let elev = mix(90 * DEG, 13 * DEG, kk), fov = mix(6 * DEG, (RM ? 30 : 44) * DEG, kk), yaw = mix(0, 2.1, kk) + (RM ? 0.01 : 0.03) * U.kelchZeit;
  let Sv = Z ? Z.S.Sc * mix(1, 1.1, kk) : 1.4, tg = Z ? Z.center() : [0, 0, 0];
  if(Z && U.lese && !portrait) tg = [tg[0], tg[1], tg[2]];
  // Netz
  if(N){
    // Im Netz: das Ganze, oder ein Dach nah (U.dachK blendet weich hinüber)
    const d = U.dach != null && N.bezirkZiel ? N.bezirkZiel(U.dach) : null;
    if(d) U.dachZiel = d; const dz = U.dachZiel, dk = dz ? (RM ? Math.round(U.dachK) : eio(U.dachK)) : 0;
    const nMitte = dz ? [mix(N.mitte[0], dz.mitte[0], dk), mix(N.mitte[1], dz.mitte[1], dk), mix(N.mitte[2], dz.mitte[2], dk)] : N.mitte;
    const nS = Math.exp(mix(Math.log(N.Rm2 * 0.9), Math.log(dz ? dz.R * 1.08 : N.Rm2 * 0.9), dk)), inward = U.netDir < 0;
    const tk = inward ? sstep(0.0, 0.7, nk) : sstep(0.3, 1.0, nk);
    Sv = Math.exp(mix(Math.log(Math.max(0.05, Sv)), Math.log(nS), nk));
    tg = [mix(tg[0], nMitte[0], tk), mix(tg[1], nMitte[1], tk), mix(tg[2], nMitte[2], tk)];
    // im Bezirk steiler von oben: die Ordnung liest sich wie eine Karte
    elev = mix(elev, mix(50, 66, dk) * DEG, sstep(0, 0.8, nk)); fov = mix(fov, 40 * DEG, sstep(0, 0.6, nk)); yaw = mix(yaw, 0.35 + (RM ? 0 : 0.012) * U.netZeit, sstep(0.2, 1, nk));
  }
  // Flug von einer Zelle zur nächsten: Ziel gleitet, Maßstab atmet weit auf
  if(U.flug && Z){ const e = eio(clamp((performance.now() - U.flug.t0) / U.flug.dauer, 0, 1)), hoch = Math.sin(Math.PI * e);
    tg = [mix(U.flug.von[0], tg[0], e), mix(U.flug.von[1], tg[1], e), mix(U.flug.von[2], tg[2], e)];
    Sv = Math.exp(mix(Math.log(Math.max(0.05, U.flug.S)), Math.log(Math.max(0.05, Sv)), e)) * (1 + 4.5 * hoch); elev = mix(elev, 55 * DEG, hoch); }
  const par = RM ? 0 : 1;
  U.baseElev = elev;
  elev = clamp(elev + U.elevOff - U.py * 0.07 * par, 2 * DEG, 90 * DEG);
  yaw += U.yawOff + U.px * 0.06 * par;
  Sv *= fit * U.zoom * (portrait ? mix(1, 0.82, Math.max(kk, nk)) : 1);
  // Lesefläche rechts: die Zelle rückt nach links, damit beides sichtbar bleibt
  const shiftX = U.leseK * (portrait ? 0 : 0.22);
  const d = Sv / Math.tan(fov / 2);
  if(portrait) Sv *= 1 + 0.35 * U.leseK;   // Handy: beim Lesen rückt die Zelle kleiner nach oben, weg vom Titel
  const d2 = Sv / Math.tan(fov / 2);
  return {target: tg, dist: d2, yaw, pitch: elev, fov, S: Sv, shift: portrait ? 0.1 + 0.5 * U.leseK : 0, shiftX};
}
