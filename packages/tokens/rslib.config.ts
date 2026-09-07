import { defineConfig } from '@rslib/core';

// Bundled ESM with declarations. `target: 'web'` because ui and both apps import the token
// objects in the browser; nothing in src touches Node APIs.
export default defineConfig({
  lib: [{ format: 'esm', bundle: true, dts: true }],
  // A build-only tsconfig scoped to `src`: the package tsconfig.json's `include` also covers
  // `test`/`scripts`/config files (for `tsc -p tsconfig.json`), which would otherwise make
  // Rslib's declaration step treat the package root as `rootDir` and nest `dist/src/index.d.ts`
  // instead of `dist/index.d.ts`.
  source: { entry: { index: './src/index.ts' }, tsconfigPath: './tsconfig.build.json' },
  // `scripts/write-css.ts` writes `dist/tokens.css` alongside Rslib's output, so Rslib's clean
  // must keep it: in watch mode nothing would write it again until `src` changes.
  output: {
    target: 'web',
    distPath: { root: 'dist' },
    cleanDistPath: { keep: [/tokens\.css$/] },
  },
});
