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
      index: ['./src/**', '!./src/**/*.test.{ts,tsx}', '!./src/**/*.stories.{ts,tsx}'],
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
