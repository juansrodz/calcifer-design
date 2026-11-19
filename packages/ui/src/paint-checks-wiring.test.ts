import { composeStories } from '@storybook/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PaintCheck } from '../.storybook/paint-checks';
import * as buttonStories from './components/Button/Button.stories';

// A story's `paintChecks` (rest, hover, press and forced colours, which jsdom cannot show) run in the
// Storybook test runner, and every link between a story and the runner fails silently: a config
// file the runner no longer discovers, a setup line that drops the hook, a hook that reads another
// parameter, a story that misspells it. Each leaves `storybook:test` green with no check run. The
// two `.storybook` files are read as text, code only, because the runner's Jest config cannot load
// under Vitest; the stories are imported.
const storybookDirectory = join(import.meta.dirname, '..', '.storybook');

function declaredChecks(): readonly PaintCheck[] {
  return Object.values(composeStories(buttonStories)).flatMap(
    (story) => (story.parameters['paintChecks'] ?? []) as readonly PaintCheck[],
  );
}

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

  it('has paint-checks.ts read the box shadow from the element and from its probe', () => {
    // A property the helper does not read leaves every check that expects it comparing nothing, so
    // each reading is pinned: the list the mismatches loop over, the element's, and the probe's.
    const hook = readCode('paint-checks.ts');
    expect(hook).toMatch(/paintProperties[^=]*=\s*\[[^\]]*'boxShadow'/);
    expect(hook).toContain('painted.boxShadow');
    expect(hook).toContain('probe.style.boxShadow');
    expect(hook).toContain('probed.boxShadow');
  });

  it('has a story declare paintChecks that the hook can run', () => {
    const checks = declaredChecks();
    expect(checks.length).toBeGreaterThan(0);
    for (const check of checks) {
      expect(check.target).toEqual(expect.any(String));
      // Any other value would fall through to the press branch.
      expect(['rest', 'hover', 'press']).toContain(check.interaction);
      // A check with nothing to compare passes whatever the element paints.
      expect(
        check.expected.backgroundColor ?? check.expected.color ?? check.expected.boxShadow,
      ).toEqual(expect.any(String));
    }
  });

  it('has stories check a box shadow, at rest and on hover, and its absence under forced colours', () => {
    const shadowChecks = declaredChecks().filter((check) => check.expected.boxShadow !== undefined);
    const shadowStates = (forcedColors: boolean) =>
      shadowChecks
        .filter((check) => Boolean(check.forcedColors) === forcedColors)
        .map((check) => check.interaction);
    expect(shadowStates(false)).toEqual(expect.arrayContaining(['rest', 'hover']));
    // Forced colours drop a shadow, the hook's too: `none`, at rest and on hover.
    expect(shadowStates(true)).toEqual(expect.arrayContaining(['rest', 'hover']));
    for (const check of shadowChecks.filter((candidate) => candidate.forcedColors)) {
      expect(check.expected.boxShadow).toBe('none');
    }
  });
});
