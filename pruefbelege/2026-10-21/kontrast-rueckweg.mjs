const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const mix = (fg, bg, a) => fg.map((v, i) => bg[i] + a * (v - bg[i]));
const kr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const ink = [255, 246, 224];
for (const bg of [[5, 4, 9], [4, 3, 10], [12, 10, 18]]) {
  console.log('bg', bg.join(','), 'ohne dim', kr(mix(ink, bg, 0.5), bg).toFixed(2), 'mit dim', kr(mix(ink, bg, 0.5 * 0.45), bg).toFixed(2));
}
