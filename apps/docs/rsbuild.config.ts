import { readFileSync } from 'node:fs';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';
import { federationConfig } from './module-federation.config';
import { pluginHtmlLang } from './src/html-lang-plugin';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};

// `env` is Rsbuild's own notion of the build mode ('production' for `rsbuild build`), which is
// right even when NODE_ENV is unset at config-load time.
export default defineConfig(({ env }) => ({
  plugins: [
    pluginReact(),
    pluginTypedCSSModules(),
    pluginModuleFederation(federationConfig),
    pluginHtmlLang(),
  ],
  source: {
    entry: { index: './src/index.tsx' },
    define: {
      DOCS_VERSION: JSON.stringify(packageJson.version),
      STORYBOOK_BASE_URL: JSON.stringify('/storybook'),
    },
  },
  html: {
    title: 'Calcifer Design',
    meta: { viewport: 'width=device-width, initial-scale=1, viewport-fit=cover' },
  },
  output: {
    // Live, this app is served from the `/design/` prefix by its own pod; in dev it is served
    // from the root of its own origin and the shell proxies the prefix to it.
    assetPrefix: env === 'production' ? '/design/' : undefined,
    cssModules: { localIdentName: '[local]-[hash:base64:5]' },
  },
  // Federated, a dev bundle's second react-refresh runtime remounts the *host's* React tree
  // when the remote entry loads; live reload still covers standalone dev.
  dev: { assetPrefix: true, hmr: false },
  server: { port: 3002, cors: { origin: ['http://localhost:3000'] } },
}));
