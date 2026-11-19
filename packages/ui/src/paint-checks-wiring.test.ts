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

const composedStories = composeStories(buttonStories);

function checksOf(story: { parameters: Record<string, unknown> }): readonly PaintCheck[] {
  return (story.parameters['paintChecks'] ?? []) as readonly PaintCheck[];
}

function declaredChecks(): readonly PaintCheck[] {
  return Object.values(composedStories).flatMap((story) => checksOf(story));
}

// Comments are stripped, whole-line `//` and `/* */` blocks, so a pin on a line of code cannot be
// met by a comment that quotes it.
function readCode(fileName: string): string {
  return readFileSync(join(storybookDirectory, fileName), 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
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

  it('has paint-checks.ts list the box shadow among the properties it compares', () => {
    // A property left out of this list leaves every check that expects it comparing nothing, and
    // `storybook:test` stays green: the one failure here with no other signal. A reading of it
    // missing from the element or the probe fails `tsc` or the shadow checks themselves.
    expect(readCode('paint-checks.ts')).toMatch(/paintProperties[^=]*=\s*\[[^\]]*'boxShadow'/);
  });

  it('has a story declare paintChecks that the hook can run', () => {
    const checks = declaredChecks();
    expect(checks.length).toBeGreaterThan(0);
    for (const check of checks) {
      expect(check.target).toEqual(expect.any(String));
      // The helper throws on any other value, so a cast or hand-written story fails at the runner.
      expect(['rest', 'hover', 'press']).toContain(check.interaction);
      // A check with nothing to compare passes whatever the element paints.
      expect(
        check.expected.backgroundColor ?? check.expected.color ?? check.expected.boxShadow,
      ).toEqual(expect.any(String));
    }
  });

  // Each story is read on its own: a read pooled over every Button story would stay green while one
  // of these lost all of its shadow checks.
  it.each(['ElevationViaHook', 'ElevationOnChosenViaHook'] as const)(
    'has %s check its box shadow at rest and on hover, and its absence under forced colours',
    (storyName) => {
      const shadowChecks = checksOf(composedStories[storyName]).filter(
        (check) => check.expected.boxShadow !== undefined,
      );
      const interactions = (forcedColors: boolean) =>
        shadowChecks
          .filter((check) => Boolean(check.forcedColors) === forcedColors)
          .map((check) => check.interaction);
      expect(interactions(false)).toEqual(expect.arrayContaining(['rest', 'hover']));
      expect(interactions(true)).toEqual(expect.arrayContaining(['rest', 'hover']));
      // These buttons lose their shadow under forced colours (the browser drops it, and the chosen
      // opt-out's own rule clears it), so `none`. A component that opts out of forced colours and
      // keeps a shadow on purpose would pin that shadow instead.
      for (const check of shadowChecks.filter((candidate) => candidate.forcedColors)) {
        expect(check.expected.boxShadow).toBe('none');
      }
    },
  );
});
