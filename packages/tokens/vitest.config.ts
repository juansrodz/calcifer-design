import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'tokens',
    globals: true,
    include: ['test/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'test/dist/**'],
  },
});
