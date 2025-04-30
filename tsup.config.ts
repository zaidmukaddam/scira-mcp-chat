import { defineConfig } from 'tsup';

const main = './electron/main.ts';
const preload = './electron/preload.ts';

export default defineConfig({
  entry: [main, preload],
  outDir: 'electron-build',
  external: ['electron'],
  format: ['cjs'],
  target: 'node20',
  cjsInterop: true,
  shims: true,
  clean: true,
  splitting: false,
  sourcemap: false,
  skipNodeModulesBundle: true,
  treeshake: true,
  bundle: true,
});
