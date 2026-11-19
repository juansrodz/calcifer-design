// The paint checks' decisions, apart from the test runner and the page: what a check asks for, what
// the page read, and whether the two agree. Pure, so Vitest can load it (the runner's hook in
// `paint-checks.ts` cannot load there) and pin each guard on its own.

export type PaintProperty = 'backgroundColor' | 'color' | 'outlineColor' | 'boxShadow';
export type ColourProperty = Exclude<PaintProperty, 'boxShadow'>;
export const paintProperties: readonly PaintProperty[] = [
  'backgroundColor',
  'color',
  'outlineColor',
  'boxShadow',
];
export const colourProperties: readonly ColourProperty[] = [
  'backgroundColor',
  'color',
  'outlineColor',
];

/**
 * Two colours no check expects, one per reading of an expected colour, set as the inherited
 * `color` around a probe that takes the expected value as its own `color`. A value that resolves
 * paints itself under both; one that does not (a `var()` to a missing token, a token that holds no
 * colour, a value the parser rejects) falls back to inheriting, so it reads as each in turn.
 */
export const unresolvedShades = ['rgb(1, 2, 3)', 'rgb(4, 5, 6)'] as const;

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
   * The expected colours (the background, the text and the outline, whether or not an outline is
   * drawn), as any CSS colour value (a `var()`, a system colour), and the expected `box-shadow`, as
   * any shadow list (`none`, a `var()`, a comma list). Each one is resolved on a probe in the
   * story, with `forced-color-adjust: none`, so a system colour stays itself under forced colours.
   * The probe keeps its shadow there as well, and an element under `forced-color-adjust: auto` does
   * not (forced colours drop it), so a check on one expects `none`; an element that opts out
   * expects what its own CSS paints.
   *
   * A value that does not resolve throws, as it would compare nothing: a colour that falls back
   * (a missing or misspelt token, a token that is no colour, a typo in a keyword) would probe as
   * `transparent` or the inherited colour, and a shadow other than `none` that resolves to `none`
   * would equal an element with no shadow. `inherit` and `currentcolor` count as unresolved too:
   * they would compare against the probe's parent, not the element.
   */
  expected: Partial<Record<PaintProperty, string>>;
}

export interface PaintReading {
  painted: Record<PaintProperty, string>;
  probed: Record<PaintProperty, string>;
  /**
   * Each expected colour, resolved once inside each of the `unresolvedShades`, in that order.
   * Absent for a colour the check does not expect.
   */
  colourResolutions: Partial<Record<ColourProperty, readonly string[]>>;
}

export function describeCheck(check: PaintCheck): string {
  const state = `${check.interaction}${check.forcedColors ? ', forced colours' : ''}`;
  return `paint check on ${check.target} (${state})`;
}

// An expected colour that read as the inherited shade both times never painted itself.
export function assertColoursResolved(
  check: PaintCheck,
  { colourResolutions }: PaintReading,
): void {
  for (const property of colourProperties) {
    const expectedColour = check.expected[property];
    if (expectedColour === undefined) {
      continue;
    }
    const readings = colourResolutions[property];
    if (readings === undefined) {
      throw new Error(`${describeCheck(check)}: the page did not resolve the expected ${property}`);
    }
    if (unresolvedShades.every((shade, index) => readings[index] === shade)) {
      throw new Error(
        `${describeCheck(check)}: the expected ${property} (${expectedColour}) does not resolve to a colour, so nothing can be compared: a missing token or a typo`,
      );
    }
  }
}

// A `var()` to a missing token computes to `none`, and a value the parser rejects is dropped, so
// the expected shadow would equal the `none` of an element with no shadow.
export function assertShadowResolved(check: PaintCheck, { probed }: PaintReading): void {
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

export function findMismatches(check: PaintCheck, { painted, probed }: PaintReading): string[] {
  return paintProperties
    .filter((property) => check.expected[property] !== undefined)
    .filter((property) => painted[property] !== probed[property])
    .map(
      (property) =>
        `${property} is ${painted[property]}, expected ${probed[property]} (${check.expected[property]})`,
    );
}
