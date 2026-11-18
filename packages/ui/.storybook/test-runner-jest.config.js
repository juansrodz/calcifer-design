import { URL, fileURLToPath } from 'node:url';
import { getJestConfig } from '@storybook/test-runner';

// The test runner's own Jest configuration, plus one setup file that installs the paint checks
// (`paint-checks.ts`). The runner finds this file in the config directory by its name.
const testRunnerConfig = getJestConfig();

/** @type {import('@jest/types').Config.InitialOptions} */
export default {
  ...testRunnerConfig,
  setupFilesAfterEnv: [
    ...(testRunnerConfig.setupFilesAfterEnv ?? []),
    fileURLToPath(new URL('./paint-checks.ts', import.meta.url)),
  ],
};
