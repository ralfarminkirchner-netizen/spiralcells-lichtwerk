// Bündelt die 3D-Welten: node baue.mjs [welt …]  (three liegt in werkzeuge/neu/node_modules). Gemeinsames (three) als eigener Teil.
// Ohne Angabe werden alle Welten gebaut; mit Angabe nur diese (für die Arbeit an einer Welt, während eine andere offen ist).
const {build} = await import(new URL('../neu/node_modules/esbuild/lib/main.js', import.meta.url));
import {resolve, dirname} from 'node:path'; import {fileURLToPath} from 'node:url';
const hier = dirname(fileURLToPath(import.meta.url)), nm = resolve(hier, '../neu/node_modules'), w = resolve(nm, 'three/build/three.webgpu.js');
const ALLE = ['galaxie', 'garten', 'dorf'], welten = process.argv.slice(2).filter(a => ALLE.includes(a)), bau = welten.length ? welten : ALLE;
await build({entryPoints: Object.fromEntries(bau.map(n => [n, resolve(hier, n + '.js')])), bundle: true, splitting: true, format: 'esm', target: 'es2022', minify: !process.argv.includes('--roh'), outdir: resolve(hier, '../../app/welten3d'), chunkNames: 'teil-[hash]', nodePaths: [nm], logLevel: 'warning', plugins: [{name: 'ein-three', setup(b){ b.onResolve({filter: /^three$/}, () => ({path: w})); }}]});
console.log('gebaut: ' + bau.map(n => `app/welten3d/${n}.js`).join(', '));
