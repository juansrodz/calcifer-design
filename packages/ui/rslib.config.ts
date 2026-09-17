import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';
import { defineConfig } from '@rslib/core';

// Bundleless ESM: `dist` mirrors `src`, each `X.module.css` becomes a plain `X_module.css`
// with the hashed class names baked in plus an `X.module.js` class map, so any bundler with
// CSS support consumes it. `dts: true` writes the component declarations; the typed CSS
// Modules plugin writes the gitignored `*.module.css.d.ts` that `tsc` needs. react,
// react-dom and the dependencies stay external (`output.autoExternal` default).
export default defineConfig({
  plugins: [pluginReact(), pluginTypedCSSModules()],
  lib: [{ format: 'esm', bundle: false, dts: true }],
  // A build-only tsconfig scoped to `src`: the package tsconfig.json's `include` also covers
  // `test`/`.storybook`/config files (for `tsc -p tsconfig.json`), which would otherwise make
  // Rslib's declaration step treat the package root as `rootDir` and nest the declarations
  // under `dist/src/`.
  source: {
    entry: {
      // `base.css` is excluded on purpose: `output.copy` below ships it verbatim, and letting the
      // bundleless compile emit it as well gave `dist/styles/base.css` two writers. The second
      // did not truncate the first, so 0.2.0 shipped the processed file with 122 stale bytes of
      // the source after its last brace -- valid to a browser, a syntax error to a minifier.
      index: [
        './src/**',
        '!./src/**/*.test.{ts,tsx}',
        '!./src/**/*.stories.{ts,tsx}',
        '!./src/styles/base.css',
      ],
    },
    tsconfigPath: './tsconfig.build.json',
  },
  output: {
    target: 'web',
    distPath: { root: 'dist' },
    cssModules: { localIdentName: '[local]-[hash:base64:5]' },
    copy: [{ from: './src/styles/base.css', to: 'styles' }],
  },
});
