import { readFileSync } from 'node:fs';

// Read once, into a variable, and never inlined as the literal `import.meta.url` expression:
// Vite's dev/test pipeline pattern-matches the source text `new URL('...', import.meta.url)`
// and rewrites it into a browser asset URL for any client-consumer environment, which this
// project's `environment: 'jsdom'` (vitest.config.ts) is — under that rewrite the two reads
// below resolve against jsdom's default `http://localhost:3000` origin instead of the
// filesystem, and `readFileSync` throws `The URL must be of scheme file`. Assigning the value
// first defeats that source-text match; `thisModuleUrl` still holds this module's own real
// `file:` URL at runtime; `bun run --filter @calcifer-design/docs build` and
// `module-federation.config.ts` never go through Vite at all, so this only matters for
// `vitest run --project docs`, but it has to be right there too.
const thisModuleUrl = import.meta.url;

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
    readFileSync(new URL('../../../package.json', thisModuleUrl), 'utf8'),
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
    readFileSync(new URL('../../../packages/ui/package.json', thisModuleUrl), 'utf8'),
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
