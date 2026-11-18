import { composeStories } from '@storybook/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PaintCheck } from '../.storybook/paint-checks';
import * as buttonStories from './components/Button/Button.stories';

// A story's `paintChecks` (hover, press and forced colours, which jsdom cannot show) run in the
// Storybook test runner, and every link between a story and the runner fails silently: a config
// file the runner no longer discovers, a setup line that drops the hook, a hook that reads another
// parameter, a story that misspells it. Each leaves `storybook:test` green with no check run. The
// two `.storybook` files are read as text, code only, because the runner's Jest config cannot load
// under Vitest; the stories are imported.
const storybookDirectory = join(import.meta.dirname, '..', '.storybook');

function readCode(fileName: string): string {
  return readFileSync(join(storybookDirectory, fileName), 'utf-8').replace(/^\s*\/\/.*$/gm, '');
}

describe('the paint checks wiring', () => {
  it('has the runner config install paint-checks.ts as a Jest setup file', () => {
    // The runner finds the config in `.storybook` by its `test-runner-jest` name, so reading the
    // file at this path pins the name as well.
    expect(readCode('test-runner-jest.config.js')).toMatch(
      /setupFilesAfterEnv:[\s\S]*new URL\('\.\/paint-checks\.ts', import\.meta\.url\)/,
    );
  });

  it('has paint-checks.ts install the post-visit hook, reading the parameter the stories set', () => {
    const hook = readCode('paint-checks.ts');
    expect(hook).toMatch(/^setPostVisit\(/m);
    expect(hook).toContain("storyContext.parameters['paintChecks']");
  });

  it('has a story declare paintChecks that the hook can run', () => {
    const checks = Object.values(composeStories(buttonStories)).flatMap(
      (story) => (story.parameters['paintChecks'] ?? []) as readonly PaintCheck[],
    );
    expect(checks.length).toBeGreaterThan(0);
    for (const check of checks) {
      expect(check.target).toEqual(expect.any(String));
      // Any other value would fall through to the press branch.
      expect(['hover', 'press']).toContain(check.interaction);
      // A check with nothing to compare passes whatever the element paints.
      expect(check.expected.backgroundColor ?? check.expected.color).toEqual(expect.any(String));
    }
  });
});
