// The test runner's post-visit hook, installed from `test-runner-jest.config.js` as a Jest setup
// file. A `.storybook/test-runner.ts` would be the documented place, but Storybook 10 loads that
// file through `module.register()`, which Jest 30 refuses, so every suite would fail to run.
import { getStoryContext, setPostVisit } from '@storybook/test-runner';
import type { Page } from 'playwright';

/**
 * A paint check a story asks for in `parameters.paintChecks`. A play function cannot test these:
 * the synthetic events `userEvent.hover` sends never apply `:hover`, so the test runner puts the
 * element in the state itself, then compares its computed colours with probes of the expected
 * values.
 */
export interface PaintCheck {
  /** A selector for the element, inside the story root. */
  target: string;
  /**
   * `hover` moves a real pointer over the element. `press` forces `:active` with no pointer over
   * it, as a touch press is: no hover rule runs.
   */
  interaction: 'hover' | 'press';
  /** Runs the check under forced colours (`forced-colors: active`). */
  forcedColors?: boolean;
  /**
   * The expected colours, as any CSS colour value (a `var()`, a system colour). Each one is
   * resolved on a probe in the story, with `forced-color-adjust: none`, so a system colour stays
   * itself under forced colours.
   */
  expected: { backgroundColor?: string; color?: string };
}

async function readPaint(page: Page, selector: string, expected: PaintCheck['expected']) {
  return page.evaluate(
    async ({ selector: elementSelector, expected: expectedValues }) => {
      const element = document.querySelector(elementSelector);
      if (!element) {
        throw new Error(`paint check: ${elementSelector} matches nothing`);
      }
      // A colour transition still running would read as a midpoint.
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
      const probe = document.createElement('span');
      probe.style.setProperty('forced-color-adjust', 'none');
      probe.style.backgroundColor = expectedValues.backgroundColor ?? 'transparent';
      probe.style.color = expectedValues.color ?? 'inherit';
      document.querySelector('#storybook-root')?.append(probe);
      try {
        const painted = getComputedStyle(element);
        const probed = getComputedStyle(probe);
        return {
          painted: { backgroundColor: painted.backgroundColor, color: painted.color },
          probed: { backgroundColor: probed.backgroundColor, color: probed.color },
        };
      } finally {
        probe.remove();
      }
    },
    { selector, expected },
  );
}

async function runPaintCheck(page: Page, check: PaintCheck) {
  const selector = `#storybook-root ${check.target}`;
  const session = await page.context().newCDPSession(page);
  let forcedNode: number | undefined;
  try {
    if (check.forcedColors) {
      await page.emulateMedia({ forcedColors: 'active' });
    }
    if (check.interaction === 'hover') {
      await page.hover(selector);
    } else {
      await page.mouse.move(0, 0);
      await session.send('DOM.enable');
      await session.send('CSS.enable');
      const { root } = await session.send('DOM.getDocument', { depth: -1 });
      const { nodeId } = await session.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector,
      });
      forcedNode = nodeId;
      await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
    }
    const { painted, probed } = await readPaint(page, selector, check.expected);
    const mismatches = (['backgroundColor', 'color'] as const)
      .filter((property) => check.expected[property] !== undefined)
      .filter((property) => painted[property] !== probed[property])
      .map(
        (property) =>
          `${property} is ${painted[property]}, expected ${probed[property]} (${check.expected[property]})`,
      );
    if (mismatches.length > 0) {
      const state = `${check.interaction}${check.forcedColors ? ', forced colours' : ''}`;
      throw new Error(`paint check on ${check.target} (${state}): ${mismatches.join('; ')}`);
    }
  } finally {
    if (forcedNode !== undefined) {
      await session.send('CSS.forcePseudoState', { nodeId: forcedNode, forcedPseudoClasses: [] });
    }
    await session.detach();
    await page.mouse.move(0, 0);
    if (check.forcedColors) {
      await page.emulateMedia({ forcedColors: 'none' });
    }
  }
}

setPostVisit(async (page, context) => {
  const storyContext = await getStoryContext(page, context);
  const checks = storyContext.parameters['paintChecks'] as readonly PaintCheck[] | undefined;
  for (const check of checks ?? []) {
    await runPaintCheck(page, check);
  }
});
