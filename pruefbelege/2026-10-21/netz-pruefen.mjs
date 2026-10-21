// Nur lesend: baut Netz und Zellen aus den Testkopien und prüft Lagen, Kamera und Bildaufbau auf NaN und Ausnahmen.
import {readFileSync} from 'node:fs';
const ROOT = '/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe/';
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
const {bestand} = await import(ROOT + 'app/js/daten.js');
const {Netz, baueNetz} = await import(ROOT + 'app/js/netz.js');
const {Zelle, baueZelle} = await import(ROOT + 'app/js/zelle.js');
const {regie} = await import(ROOT + 'app/js/regie.js');
const {setCamera, L, CAM, PD, STR} = await import(ROOT + 'app/js/licht.js');
const {U} = await import(ROOT + 'app/js/welt.js');
const O = JSON.parse(readFileSync(ROOT + 'app/ordnung.json', 'utf8'));
const fin = a => a == null || (Array.isArray(a) ? a.every(x => x == null || Number.isFinite(x)) : Number.isFinite(a));
const pdOk = () => { for(let i = 0; i < L.pc * STR; i++) if(!Number.isFinite(PD[i])) return false; return true; };

for(const datei of ['testdaten/kette-gewebe/state.json', 'testdaten/kette-claude/state.json']){
  const B = bestand(JSON.parse(readFileSync(ROOT + datei, 'utf8')));
  console.log('\n===', datei, 'Monde', B.monde.length, 'Kanten', B.roh.edges.length);
  for(const [name, ord] of [['mit Ordnung', O], ['ohne Ordnung', null]]){
    const N = new Netz(B, ord);
    console.log('--', name, 'Dächer', N.daecher.length, 'Fäden', N.faeden.length, 'Bündel', N.buendel.length, 'ohne', N.baum.ohne.length, 'Material', N.baum.material.size, 'fehlt', N.baum.fehlt);
    // Lage: jedes Werk liegt im Kreis seines Bezirks
    for(let i = 0; i < N.N; i++){ const b = N.bezirk(i), z = N.bezirkZiel(b), p = N.pos[i];
      if(!p || !p.every(Number.isFinite)){ console.log('POS NICHT ENDLICH', i, B.monde[i].titel); continue; }
      if(!z){ console.log('KEIN BEZIRKZIEL', i, B.monde[i].titel, b); continue; }
      const d = Math.hypot(p[0] - z.mitte[0], p[2] - z.mitte[2]);
      if(d > z.R * 1.05) console.log('AUSSERHALB SEINES BEZIRKS', B.monde[i].titel, 'Bezirk', b, 'Abstand', d.toFixed(2), 'R', z.R.toFixed(2), N.baum.material.has(i) ? '(Material)' : ''); }
    // Material an Werk: liegt es auf einem fremden Werk?
    for(const [i] of N.baum.material){ for(let j = 0; j < N.N; j++){ if(j === i) continue; const d = Math.hypot(N.pos[i][0] - N.pos[j][0], N.pos[i][2] - N.pos[j][2]); if(d < N.rM[j] * 0.9) console.log('Material über Werk', B.monde[i].titel, '→', B.monde[j].titel, d.toFixed(2), N.rM[j].toFixed(2)); } }
    const zustaende = [null, 'mitte', 'ohne', ...N.daecher.map((_, j) => j)];
    for(const [w, h] of [[1200, 800], [375, 812]]){
      CAM.cssW = w; CAM.cssH = h;
      for(const dach of zustaende){ if(dach === 'ohne' && !N.L.ohne) continue;
        Object.assign(U, {netK: 1, netT: 1, dach, dachK: dach == null ? 0 : 1, dachZiel: null, kelchK: 0, leseK: 0, zoom: 1, yawOff: 0, elevOff: 0, px: 0, py: 0, netZeit: 37, netDir: 1, flug: null, sel: null, hover: null, solo: -1});
        let cam; try{ cam = regie(U, null, N, false); }catch(e){ console.log('REGIE WIRFT', dach, e.message); continue; }
        if(![cam.dist, cam.yaw, cam.pitch, cam.S, ...cam.target].every(Number.isFinite)) console.log('KAMERA NaN', w, dach, cam);
        setCamera(cam, w, h); L.pc = 0;
        try{ baueNetz(N, U, 12.3, 1, -1, 0); }catch(e){ console.log('BAUENETZ WIRFT', w, dach, e.stack.split('\n').slice(0, 3).join(' | ')); continue; }
        if(!pdOk()) console.log('PUNKTE NaN', w, dach);
        const sch = [U.mitteSchirm, U.ohneSchirm, ...U.daecherSchirm, ...U.knoten, ...U.buendelKnoten, ...U.monde, ...U.bigHeads];
        if(!sch.every(fin)) console.log('SCHIRM NaN', w, dach);
        // Wie viel der Bezirke liegt im Bild (Überblick)
        if(dach == null){ let aus = 0; for(const k of N.kreise){ for(let s = 0; s < 16; s++){ const t = s / 16 * Math.PI * 2, x = k.x + Math.cos(t) * k.R, z = k.z + Math.sin(t) * k.R;
              const c = toScr(x, 0, z); if(c[0] < 0 || c[0] > w || c[1] < 0 || c[1] > h) aus++; } }
          console.log(`  ${w}x${h} Überblick: S=${cam.S.toFixed(2)} Punkte=${L.pc} Ringpunkte außerhalb=${aus}/${N.kreise.length * 16} sichtbare Bündelknoten=${U.buendelKnoten.filter(p => p && p[2] > 0 && p[0] >= 0 && p[0] <= w && p[1] >= 0 && p[1] <= h).length}/${N.buendel.length}`); }
      }
    }
  }
}
function toScr(x, y, z){ const c = CAM.VP; const X = c[0] * x + c[4] * y + c[8] * z + c[12], Y = c[1] * x + c[5] * y + c[9] * z + c[13], Wv = c[3] * x + c[7] * y + c[11] * z + c[15]; return [(X / Wv * 0.5 + 0.5) * CAM.cssW, (0.5 - Y / Wv * 0.5) * CAM.cssH, Wv]; }
