import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// The library's own manifest — the same file `build/build-info-plugin.ts` and
// `build/shared-dependencies.ts` read for the values rsbuild.config.ts defines from them. Read
// here rather than imported so this config stays loadable by a Vite config loader that does not
// bundle TypeScript; either way a library release needs no edit in this file, and none in the
// tests that render the values.
const uiPackageJson = JSON.parse(
  readFileSync(new URL('../../packages/ui/package.json', import.meta.url), 'utf8'),
) as { version: string; dependencies: Record<string, string> };

export default defineConfig({
  define: {
    DOCS_VERSION: JSON.stringify(uiPackageJson.version),
    BASE_UI_VERSION: JSON.stringify(uiPackageJson.dependencies['@base-ui/react']),
    // Tests exercise the production value; the dev fallback is build/dev-proxy.test.ts.
    STORYBOOK_BASE_URL: JSON.stringify('/storybook'),
  },
  test: {
    name: 'docs',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    // Inlining @calcifer-design/ui lets Vite resolve the plain `*_module.css` side-effect
    // imports that Node cannot load; the class-name objects come from the package's own
    // compiled `*.module.js` files in dist, which `bun run typecheck` has already built.
    server: { deps: { inline: [/@calcifer-design\/ui/] } },
  },
});
