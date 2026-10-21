// Nachrechnung setzeMarke (bedienung.js:60-65 @35c59bc): liegt die Marke über ihrem eigenen Knoten?
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function lage(sx, sy, w, W, H){ const links = sx > W - w - 40;
  const x = clamp(links ? sx - w - 22 : sx + 22, 12, Math.max(12, W - w - 12)), y = clamp(sy - 16, 60, H - 140); return {x, y, links}; }
for(const [W, H] of [[375, 812], [800, 600]]) for(const w of [160, 220, Math.min(360, 0.72 * W)]){
  let gedeckt = 0, n = 0, bsp = [];
  for(let sx = 20; sx <= W - 20; sx += 5){ n++; const {x, y} = lage(sx, H / 2, w, W, H);
    if(sx >= x && sx <= x + w && H / 2 >= y && H / 2 <= y + 44){ gedeckt++; if(bsp.length < 3 || sx === 185) bsp.push(sx); } }
  console.log(`${W}x${H} Markenbreite ${w}: Knoten unter der eigenen Marke bei ${gedeckt}/${n} Lagen (sx z.B. ${bsp.join(', ')})`);
}
