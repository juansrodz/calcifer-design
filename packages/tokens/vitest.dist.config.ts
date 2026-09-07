import { defineConfig } from 'vitest/config';

// Runs against `dist` after `bun run build`; not part of `bun run test`, which must pass on a
// fresh clone. Root `vitest.dist.config.ts` collects every package's dist project.
export default defineConfig({
  test: { name: 'tokens-dist', environment: 'node', include: ['test/dist/**/*.test.ts'] },
});
