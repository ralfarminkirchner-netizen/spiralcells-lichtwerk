/* =====================================================================
   ICH-ANSICHT — durch eine Welt gehen oder fliegen, aus den eigenen Augen.
   Gehen (Garten, Dorf): W A S D oder Pfeile, Maus schaut, Umschalt rennt, Leertaste springt. Fliegen (Galaxie): dazu E hoch, Q runter,
   die Richtung folgt dem Blick. Am Handy und iPad: linke Hälfte ziehen = gehen, rechte Hälfte ziehen = schauen, zwei Finger links = rennen.
   Die Welt gibt nur: wo der Boden ist, was gesperrt ist, wie schnell. Esc oder der Knopf beendet.
   ===================================================================== */
import * as THREE from 'three/webgpu';

export function ego({camera, canvas, steuer, boden = null, sperre = null, augen = 1.7, tempo = 8, schnell = 26, fliegen = false, knopf, sage, beiStart, beiEnde}){
  const E = {an: false}, tasten = new Set(), v = new THREE.Vector3(), wunsch = new THREE.Vector3(), vor = new THREE.Vector3(), quer = new THREE.Vector3();
  let gier = 0, nick = 0, vy = 0, amBoden = true, beruehr = new Map(), stick = {x: 0, y: 0, renn: false}, wipp = 0, fovAlt = camera.fov;
  const beruehrung = matchMedia('(pointer: coarse)').matches;
  const hilfe = () => beruehrung ? (fliegen ? 'Links ziehen fliegt · rechts ziehen schaut · zwei Finger links: schnell' : 'Links ziehen geht · rechts ziehen schaut · zwei Finger links: rennen') : (fliegen ? 'W A S D fliegt in Blickrichtung · E hoch · Q runter · Umschalt: sehr schnell · Esc beendet' : 'W A S D geht · Maus schaut · Umschalt rennt · Leertaste springt · Esc beendet');
  E.start = (pos, blick) => { if(beiStart) beiStart(); if(!E.an){ fovAlt = camera.fov; }
    if(pos) camera.position.copy(pos); else if(!fliegen){ /* dort landen, wohin die Kamera schaut */ camera.position.set(steuer.target.x + (camera.position.x - steuer.target.x) * 0.08, 0, steuer.target.z + (camera.position.z - steuer.target.z) * 0.08); }
    if(!fliegen && boden){ let n = 0; while(sperre && sperre(camera.position.x, camera.position.z) && n++ < 60){ camera.position.x += Math.cos(n) * 1.5; camera.position.z += Math.sin(n) * 1.5; } camera.position.y = boden(camera.position.x, camera.position.z) + augen; }
    const z = blick || steuer.target, d = new THREE.Vector3().subVectors(z, camera.position); gier = Math.atan2(-d.x, -d.z); nick = fliegen ? Math.atan2(d.y, Math.hypot(d.x, d.z)) : (pos ? Math.max(-0.2, Math.min(0.35, Math.atan2(d.y, Math.hypot(d.x, d.z)))) : 0.04);
    E.an = true; steuer.enabled = false; v.set(0, 0, 0); vy = 0; if(knopf){ knopf.setAttribute('aria-pressed', 'true'); knopf.textContent = 'Beenden'; } if(sage) sage(hilfe(), 9000);
    if(!beruehrung && canvas.requestPointerLock){ try{ const p = canvas.requestPointerLock(); if(p && p.catch) p.catch(() => {}); }catch(e){ /* dann mit gedrückter Maus schauen */ } } };
  E.ende = () => { if(!E.an) return; E.an = false; tasten.clear(); stick.x = stick.y = 0; if(document.pointerLockElement === canvas) document.exitPointerLock();
    camera.fov = fovAlt; camera.updateProjectionMatrix(); const d = new THREE.Vector3(); camera.getWorldDirection(d); steuer.target.copy(camera.position).addScaledVector(d, fliegen ? 40 : 14); if(!fliegen){ camera.position.y += 4; camera.position.addScaledVector(d, -6); }
    steuer.enabled = true; if(knopf){ knopf.setAttribute('aria-pressed', 'false'); knopf.textContent = fliegen ? 'Fliegen' : 'Gehen'; } if(beiEnde) beiEnde(); };
  if(knopf){ knopf.hidden = false; knopf.textContent = fliegen ? 'Fliegen' : 'Gehen'; knopf.title = fliegen ? 'Selbst durch die Galaxie fliegen' : 'Zu Fuß hindurchgehen, aus den eigenen Augen'; knopf.onclick = () => E.an ? E.ende() : E.start(); }
  addEventListener('keydown', e => { if(!E.an || e.target.tagName === 'INPUT') return; if(e.code === 'Escape'){ E.ende(); e.stopImmediatePropagation(); return; } tasten.add(e.code); if(/^(Key[WASDQE]|Arrow|Space|Shift)/.test(e.code)){ e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  addEventListener('keyup', e => tasten.delete(e.code)); addEventListener('blur', () => tasten.clear());
  document.addEventListener('pointerlockchange', () => { if(E.an && !beruehrung && document.pointerLockElement !== canvas && E._gesperrt) E.ende(); E._gesperrt = document.pointerLockElement === canvas; });
  const schau = (dx, dy, k) => { gier -= dx * k; nick = Math.max(-1.45, Math.min(1.45, nick - dy * k)); };
  canvas.addEventListener('pointermove', e => { if(!E.an) return;
    if(e.pointerType === 'touch'){ const b = beruehr.get(e.pointerId); if(!b) return; if(b.links){ stick.x = Math.max(-1, Math.min(1, (e.clientX - b.x0) / 60)); stick.y = Math.max(-1, Math.min(1, (e.clientY - b.y0) / 60)); } else schau(e.clientX - b.x, e.clientY - b.y, 0.0045); b.x = e.clientX; b.y = e.clientY; }
    else if(document.pointerLockElement === canvas || e.buttons) schau(e.movementX, e.movementY, 0.0022); });
  canvas.addEventListener('pointerdown', e => { if(!E.an) return; if(e.pointerType === 'touch'){ const links = e.clientX < innerWidth / 2; beruehr.set(e.pointerId, {x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, links}); stick.renn = [...beruehr.values()].filter(b => b.links).length > 1; } else if(document.pointerLockElement !== canvas && canvas.requestPointerLock){ try{ const p = canvas.requestPointerLock(); if(p && p.catch) p.catch(() => {}); }catch(err){ /* gedrückt schauen */ } } });
  const los = e => { const b = beruehr.get(e.pointerId); if(b && b.links){ stick.x = stick.y = 0; } beruehr.delete(e.pointerId); stick.renn = [...beruehr.values()].filter(b => b.links).length > 1; }; canvas.addEventListener('pointerup', los); canvas.addEventListener('pointercancel', los);
  canvas.addEventListener('wheel', e => { if(E.an){ tempoFaktor = Math.max(0.25, Math.min(8, tempoFaktor * (e.deltaY < 0 ? 1.15 : 0.87))); e.preventDefault(); e.stopImmediatePropagation(); } }, {capture: true, passive: false});
  let tempoFaktor = 1;
  E.schritt = dt => { if(!E.an) return;
    const T = k => tasten.has(k), fx = (T('KeyD') || T('ArrowRight') ? 1 : 0) - (T('KeyA') || T('ArrowLeft') ? 1 : 0) + stick.x, fz = (T('KeyW') || T('ArrowUp') ? 1 : 0) - (T('KeyS') || T('ArrowDown') ? 1 : 0) - stick.y, renn = T('ShiftLeft') || T('ShiftRight') || stick.renn;
    const cg = Math.cos(gier), sg = Math.sin(gier), cn = Math.cos(nick), sn = Math.sin(nick), ziel = (renn ? schnell : tempo) * tempoFaktor;
    if(fliegen) vor.set(-sg * cn, sn, -cg * cn); else vor.set(-sg, 0, -cg); quer.set(cg, 0, -sg);
    wunsch.set(0, 0, 0).addScaledVector(vor, fz).addScaledVector(quer, fx); if(fliegen) wunsch.y += (T('KeyE') || T('Space') ? 1 : 0) - (T('KeyQ') ? 1 : 0); if(wunsch.lengthSq() > 1) wunsch.normalize(); wunsch.multiplyScalar(ziel);
    v.lerp(wunsch, 1 - Math.exp(-dt * (fliegen ? 3.2 : 9)));
    const p = camera.position, nx = p.x + v.x * dt, nz = p.z + v.z * dt;
    if(fliegen){ p.addScaledVector(v, dt); }
    else { if(!sperre || !sperre(nx, nz)){ p.x = nx; p.z = nz; } else if(!sperre(nx, p.z)){ p.x = nx; v.z = 0; } else if(!sperre(p.x, nz)){ p.z = nz; v.x = 0; } else v.set(0, 0, 0);
      const g = boden ? boden(p.x, p.z) : 0; if(amBoden && T('Space')){ vy = 6.5; amBoden = false; } if(!amBoden){ vy -= 19 * dt; p.y += vy * dt; if(p.y <= g + augen){ p.y = g + augen; amBoden = true; vy = 0; } }
      else { const tempoJetzt = Math.hypot(v.x, v.z); wipp += dt * tempoJetzt * 0.9; p.y = g + augen + Math.sin(wipp * 2) * 0.035 * Math.min(1, tempoJetzt / 6); } }
    camera.quaternion.setFromEuler(new THREE.Euler(nick, gier, 0, 'YXZ'));
    const soll = fovAlt + Math.min(18, v.length() / schnell * 16), f = camera.fov + (soll - camera.fov) * Math.min(1, dt * 4); if(Math.abs(f - camera.fov) > 0.02){ camera.fov = f; camera.updateProjectionMatrix(); } };
  return E;
}
