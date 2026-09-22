import { defineConfig } from 'vitest/config';

// Runs against `dist` after `bun run build:docs` (`check`'s typecheck step produces it as
// `css-types`); not part of `bun run test`. Root `vitest.dist.config.ts` collects it beside the
// packages' dist projects.
export default defineConfig({
  test: { name: 'docs-dist', environment: 'node', include: ['test/dist/**/*.test.ts'] },
});
