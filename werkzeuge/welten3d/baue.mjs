// Bündelt die 3D-Welten: node baue.mjs  (three liegt in werkzeuge/neu/node_modules). Gemeinsames (three) als eigener Teil.
const {build} = await import(new URL('../neu/node_modules/esbuild/lib/main.js', import.meta.url));
import {resolve, dirname} from 'node:path'; import {fileURLToPath} from 'node:url';
const hier = dirname(fileURLToPath(import.meta.url)), nm = resolve(hier, '../neu/node_modules'), w = resolve(nm, 'three/build/three.webgpu.js');
await build({entryPoints: {galaxie: resolve(hier, 'galaxie.js'), garten: resolve(hier, 'garten.js')}, bundle: true, splitting: true, format: 'esm', target: 'es2022', minify: true, outdir: resolve(hier, '../../app/welten3d'), chunkNames: 'teil-[hash]', nodePaths: [nm], logLevel: 'warning', plugins: [{name: 'ein-three', setup(b){ b.onResolve({filter: /^three$/}, () => ({path: w})); }}]});
console.log('gebaut: app/welten3d/galaxie.js, garten.js');
