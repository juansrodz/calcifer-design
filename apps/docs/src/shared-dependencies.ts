import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// This module's own directory, resolved via `fileURLToPath` rather than a
// `new URL(literal, import.meta.url)` expression: that expression reads as an asset reference
// to a bundler (and Vite's dev/test pipeline acts on exactly that reading — under a
// client-consumer environment, which this project's `environment: 'jsdom'` is, it rewrites the
// expression into a browser URL, which breaks `readFileSync` on the result), when what both
// reads below actually are is a plain Node.js file lookup relative to this file on disk.
// `path.resolve` from this directory says that directly, and behaves the same whether the
// caller is `vitest run --project docs`, `bun run --filter @calcifer-design/docs build`, or
// `module-federation.config.ts` loading this module directly — none of which is a bundler.
const thisModuleDirectory = dirname(fileURLToPath(import.meta.url));

interface RootPackageJson {
  catalog?: Record<string, string>;
  workspaces?: { catalog?: Record<string, string> };
}

function readCatalogReactVersion(): string {
  // ../../../package.json from apps/docs/src/ is the workspace root, the single place this
  // repository pins React (`"react": "catalog:"` in every package). Hard-coding the range here
  // would let the two drift apart silently, which is the failure mode Module Federation
  // reports as a version mismatch at runtime, in the browser, inside someone else's shell.
  const rootPackageJson = JSON.parse(
    readFileSync(resolve(thisModuleDirectory, '../../../package.json'), 'utf8'),
  ) as RootPackageJson;
  const catalog = rootPackageJson.workspaces?.catalog ?? rootPackageJson.catalog;
  const version = catalog?.['react'];
  if (!version) {
    throw new Error('The root package.json workspace catalog has no `react` entry.');
  }
  return version;
}

export const reactVersion = readCatalogReactVersion();

interface UiPackageJson {
  dependencies?: Record<string, string>;
}

function readUiPackageBaseUiVersion(): string {
  // ../../../packages/ui/package.json from apps/docs/src/ — the root workspace catalog has no
  // Base UI entry (only React does), so the range this app negotiates on has to be read from
  // the one package that actually declares the dependency. Hard-coding it here risks the same
  // silent drift readCatalogReactVersion above is written to avoid.
  const uiPackageJson = JSON.parse(
    readFileSync(resolve(thisModuleDirectory, '../../../packages/ui/package.json'), 'utf8'),
  ) as UiPackageJson;
  const version = uiPackageJson.dependencies?.['@base-ui/react'];
  if (!version) {
    throw new Error('packages/ui/package.json has no `@base-ui/react` dependency entry.');
  }
  return version;
}

export const baseUiVersion = readUiPackageBaseUiVersion();

interface SharedDependencyConfig {
  singleton: boolean;
  strictVersion?: boolean;
  requiredVersion?: string;
}

/**
 * What this remote negotiates with the host. React must be a singleton, and the trailing-slash
 * key is what covers `react-dom/client` — without it the Bridge's `createRoot` pulls a second
 * copy of React DOM into the page.
 */
export const sharedDependencies: Record<string, SharedDependencyConfig> = {
  react: { singleton: true, requiredVersion: reactVersion },
  'react-dom': { singleton: true, requiredVersion: reactVersion },
  'react-dom/': { singleton: true, requiredVersion: reactVersion },
  // Every import in `@calcifer-design/ui` is a subpath, so the bare key matches nothing on its
  // own and the trailing-slash entry is what covers `@base-ui/react/popover` and its siblings,
  // exactly as `react-dom/` covers `react-dom/client`; `strictVersion` makes a major drift fail
  // loudly, in the remote's own error boundary, instead of producing two Base UI copies whose
  // floating-UI state does not agree.
  '@base-ui/react': { singleton: true, strictVersion: true, requiredVersion: baseUiVersion },
  '@base-ui/react/': { singleton: true, strictVersion: true, requiredVersion: baseUiVersion },
};
