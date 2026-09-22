import { defineConfig } from 'vitest/config';

// `build/` holds the app's Node-only modules — the Rsbuild config's plugins, the share map and
// the dev proxy — so they run under a Node environment, not the jsdom one `vitest.config.ts`
// gives the browser sources in `src/`. Keeping them apart is what stops a bundler's
// client-environment transforms from touching a plain `readFileSync`, and it is why these
// modules need no workaround to read a manifest off disk. Collected by the root
// `vitest.config.ts` beside the `docs` project, which `apps/*` alone would not pick up.
export default defineConfig({
  test: { name: 'docs-build', environment: 'node', include: ['build/**/*.test.ts'] },
});
