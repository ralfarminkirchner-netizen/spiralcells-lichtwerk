import {build} from 'esbuild'; import {resolve} from 'node:path';
const w = resolve('node_modules/three/build/three.webgpu.js');
await build({entryPoints: ['welten.js'], bundle: true, format: 'esm', target: 'esnext', outfile: '../../app/neu/welten.bundle.js', logLevel: 'warning', logLimit: 6, plugins: [{name: 'ein-three', setup(b){ b.onResolve({filter: /^three$/}, () => ({path: w})); }}]});
