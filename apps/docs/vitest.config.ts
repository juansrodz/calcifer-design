import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// The same source rsbuild.config.ts defines DOCS_VERSION from, so a version bump needs neither
// this file nor the tests that assert the version edited alongside it.
const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};

export default defineConfig({
  define: {
    DOCS_VERSION: JSON.stringify(packageJson.version),
    // Tests exercise the production value; the dev fallback is Task 5's own test.
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
