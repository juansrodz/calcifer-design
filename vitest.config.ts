import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `apps/*` resolves each app directory to its single `vitest.config.ts`, so the docs app's
    // Node-environment project for `apps/docs/build/` is named here as well.
    projects: ['packages/*', 'apps/*', 'apps/docs/vitest.build.config.ts', 'scripts'],
  },
});
