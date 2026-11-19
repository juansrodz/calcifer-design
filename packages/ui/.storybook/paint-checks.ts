// The test runner's post-visit hook, installed from `test-runner-jest.config.js` as a Jest setup
// file. A `.storybook/test-runner.ts` would be the documented place, but Storybook 10 loads that
// file through `module.register()`, which Jest 30 refuses, so every suite would fail to run.
import { getStoryContext, setPostVisit } from '@storybook/test-runner';
import type { CDPSession, Page } from 'playwright';

type PaintProperty = 'backgroundColor' | 'color' | 'boxShadow';
const paintProperties: readonly PaintProperty[] = ['backgroundColor', 'color', 'boxShadow'];

/**
 * A paint check a story asks for in `parameters.paintChecks`. A play function cannot test these:
 * the synthetic events `userEvent.hover` sends never apply `:hover`, so the test runner puts the
 * element in the state itself, then compares its computed colours and shadow with a probe of the
 * expected values.
 */
export interface PaintCheck {
  /** A selector for the element, inside the story root. */
  target: string;
  /**
   * `rest` leaves the element as it is, with the pointer away from it: the state to read when there
   * is no pointer or `:active` to set, as in a forced-colours reading. `hover` moves a real pointer
   * over the element. `press` forces `:active` with no pointer over it, as a touch press is: no
   * hover rule runs. Any other value throws.
   */
  interaction: 'rest' | 'hover' | 'press';
  /** Runs the check under forced colours (`forced-colors: active`). */
  forcedColors?: boolean;
  /**
   * The expected colours, as any CSS colour value (a `var()`, a system colour), and the expected
   * `box-shadow`, as any shadow list (`none`, a `var()`, a comma list). Each one is resolved on a
   * probe in the story, with `forced-color-adjust: none`, so a system colour stays itself under
   * forced colours. The probe keeps its shadow there as well, and an element under
   * `forced-color-adjust: auto` does not (forced colours drop it), so a check on one expects
   * `none`; an element that opts out expects what its own CSS paints. A shadow other than `none`
   * that the probe resolves to `none` (a missing token, a typo) throws: it would equal an element
   * with no shadow and compare nothing.
   */
  expected: Partial<Record<PaintProperty, string>>;
}

interface PaintReading {
  painted: Record<PaintProperty, string>;
  probed: Record<PaintProperty, string>;
}

async function readPaint(
  page: Page,
  selector: string,
  expected: PaintCheck['expected'],
): Promise<PaintReading> {
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
      probe.style.boxShadow = expectedValues.boxShadow ?? 'none';
      document.querySelector('#storybook-root')?.append(probe);
      try {
        const painted = getComputedStyle(element);
        const probed = getComputedStyle(probe);
        return {
          painted: {
            backgroundColor: painted.backgroundColor,
            color: painted.color,
            boxShadow: painted.boxShadow,
          },
          probed: {
            backgroundColor: probed.backgroundColor,
            color: probed.color,
            boxShadow: probed.boxShadow,
          },
        };
      } finally {
        probe.remove();
      }
    },
    { selector, expected },
  );
}

async function findNodeId(session: CDPSession, selector: string): Promise<number> {
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const { root } = await session.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  return nodeId;
}

async function forceActive(session: CDPSession, nodeId: number, forced: boolean): Promise<void> {
  await session.send('CSS.forcePseudoState', {
    nodeId,
    forcedPseudoClasses: forced ? ['active'] : [],
  });
}

function describeCheck(check: PaintCheck): string {
  const state = `${check.interaction}${check.forcedColors ? ', forced colours' : ''}`;
  return `paint check on ${check.target} (${state})`;
}

// A `var()` to a missing token computes to `none`, and a value the parser rejects is dropped, so
// the expected shadow would equal the `none` of an element with no shadow.
function assertShadowResolved(check: PaintCheck, { probed }: PaintReading): void {
  const expectedShadow = check.expected.boxShadow;
  if (
    expectedShadow !== undefined &&
    expectedShadow.trim().toLowerCase() !== 'none' &&
    probed.boxShadow === 'none'
  ) {
    throw new Error(
      `${describeCheck(check)}: the expected shadow (${expectedShadow}) resolved to none, so nothing can be compared: a missing token or a typo`,
    );
  }
}

function findMismatches(check: PaintCheck, { painted, probed }: PaintReading): string[] {
  return paintProperties
    .filter((property) => check.expected[property] !== undefined)
    .filter((property) => painted[property] !== probed[property])
    .map(
      (property) =>
        `${property} is ${painted[property]}, expected ${probed[property]} (${check.expected[property]})`,
    );
}

async function runPaintCheck(page: Page, check: PaintCheck): Promise<void> {
  const selector = `#storybook-root ${check.target}`;
  const session = await page.context().newCDPSession(page);
  let forcedNode: number | undefined;
  try {
    if (check.forcedColors) {
      await page.emulateMedia({ forcedColors: 'active' });
    }
    switch (check.interaction) {
      case 'hover':
        await page.hover(selector);
        break;
      case 'press':
        await page.mouse.move(0, 0);
        forcedNode = await findNodeId(session, selector);
        await forceActive(session, forcedNode, true);
        break;
      case 'rest':
        await page.mouse.move(0, 0);
        break;
      default: {
        // A story cast past the type, or written in JavaScript, must not read the wrong state.
        const unknownInteraction: never = check.interaction;
        throw new Error(
          `paint check on ${check.target}: unknown interaction ${String(unknownInteraction)}`,
        );
      }
    }
    const reading = await readPaint(page, selector, check.expected);
    assertShadowResolved(check, reading);
    const mismatches = findMismatches(check, reading);
    if (mismatches.length > 0) {
      throw new Error(`${describeCheck(check)}: ${mismatches.join('; ')}`);
    }
  } finally {
    if (forcedNode !== undefined) {
      await forceActive(session, forcedNode, false);
    }
    await session.detach();
    await page.mouse.move(0, 0);
    if (check.forcedColors) {
      await page.emulateMedia({ forcedColors: 'none' });
    }
  }
}

setPostVisit(async (page, context) => {
  // After a failed play the runner calls this hook and then rethrows the play's own error, so a
  // check that threw here would replace it. The runner names the flag `hasFailure`.
  if (context.hasFailure) {
    return;
  }
  const storyContext = await getStoryContext(page, context);
  const checks = storyContext.parameters['paintChecks'] as readonly PaintCheck[] | undefined;
  for (const check of checks ?? []) {
    await runPaintCheck(page, check);
  }
});
