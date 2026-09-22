import { createModuleFederationConfig } from '@module-federation/rsbuild-plugin';
import { DESIGN_REMOTE_NAME, EXPOSED_APP_KEY } from './src/app-identity';
import { sharedDependencies } from './src/shared-dependencies';

export const federationConfig = createModuleFederationConfig({
  name: DESIGN_REMOTE_NAME,
  exposes: { [EXPOSED_APP_KEY]: './src/federation/export-app.tsx' },
  manifest: true,
  shared: sharedDependencies,
  shareStrategy: 'loaded-first',
  // This app has no router, so the Bridge must not try to drive one.
  bridge: { enableBridgeRouter: false },
  // RUNTIME-006: without an async startup boundary the entry can require a shared module
  // (react) synchronously before Module Federation has finished negotiating it.
  experiments: { asyncStartup: true },
});
