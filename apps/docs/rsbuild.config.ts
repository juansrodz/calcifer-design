import { ObservabilityBuildPlugin } from '@module-federation/observability-plugin/build';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';
import { federationConfig } from './module-federation.config';
import { pluginBuildInfo, uiVersion } from './build/build-info-plugin';
import { DEV_PORTS, devProxy } from './build/dev-proxy';
import { pluginHtmlLang } from './build/html-lang-plugin';
import { baseUiVersion } from './build/shared-dependencies';

// `env` is Rsbuild's own notion of the build mode ('production' for `rsbuild build`), which is
// right even when NODE_ENV is unset at config-load time.
export default defineConfig(({ env }) => ({
  plugins: [
    pluginReact(),
    pluginTypedCSSModules(),
    pluginModuleFederation(federationConfig),
    pluginHtmlLang(),
    pluginBuildInfo(),
  ],
  source: {
    entry: { index: './src/index.tsx' },
    define: {
      // The library's version, not this private app's: the same number the build stamp carries
      // and the portfolio's card for this remote displays, so the three cannot disagree.
      DOCS_VERSION: JSON.stringify(uiVersion),
      // The range the library actually depends on, so the Overview's claim about Base UI is read
      // from packages/ui/package.json instead of typed into the copy and left there.
      BASE_UI_VERSION: JSON.stringify(baseUiVersion),
      STORYBOOK_BASE_URL: JSON.stringify(process.env['STORYBOOK_BASE_URL'] ?? '/storybook'),
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
  server: {
    port: DEV_PORTS.docs,
    cors: { origin: ['http://localhost:3000'] },
    proxy: devProxy(),
  },
  tools: {
    rspack: {
      plugins: [new ObservabilityBuildPlugin({ moduleFederation: federationConfig })],
    },
  },
}));
