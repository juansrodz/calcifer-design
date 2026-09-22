import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { projects: ['packages/*/vitest.dist.config.ts', 'apps/*/vitest.dist.config.ts'] },
});
