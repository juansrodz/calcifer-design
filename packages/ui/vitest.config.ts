import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'ui',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'test/dist/**'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
