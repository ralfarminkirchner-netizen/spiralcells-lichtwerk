import {build} from 'esbuild'; import {resolve} from 'node:path';
const w = resolve('node_modules/three/build/three.webgpu.js');
await build({entryPoints: ['haupt.js'], bundle: true, minify: true, format: 'esm', target: 'esnext', outfile: '../../app/welten3d/welten3d.bundle.js', logLevel: 'warning',
  plugins: [{name: 'ein-three', setup(b){ b.onResolve({filter: /^three$/}, () => ({path: w})); }}]});
