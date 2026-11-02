// Baut die Handy-Fassung und legt die Weltbeschreibung unverändert daneben. Aufruf: node werkzeuge/handy/baue.mjs
import {createRequire} from 'node:module'; import {copyFileSync, mkdirSync} from 'node:fs'; import {dirname, resolve} from 'node:path'; import {fileURLToPath} from 'node:url';
const HIER = dirname(fileURLToPath(import.meta.url)), WURZEL = resolve(HIER, '../..'), NM = resolve(WURZEL, 'werkzeuge/neu/node_modules');
const {build} = createRequire(resolve(NM, 'x.js'))('esbuild');
mkdirSync(resolve(WURZEL, 'app/handy'), {recursive: true});
copyFileSync(resolve(WURZEL, 'welt/weltbeschreibung.json'), resolve(WURZEL, 'app/handy/welt.json'));
await build({entryPoints: [resolve(HIER, 'handy.js')], bundle: true, format: 'esm', target: 'es2022', minify: true, outfile: resolve(WURZEL, 'app/handy/handy.bundle.js'), nodePaths: [NM], logLevel: 'warning'});
