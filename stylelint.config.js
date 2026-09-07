// Keywords every token-governed property may use without a design token.
const sharedIgnoreValues = [
  'inherit',
  'initial',
  'unset',
  'transparent',
  'currentColor',
  'none',
  '0',
  'auto',
  '/^0 /',
];

// The border/outline shorthands additionally accept their structural width and
// style keywords ("1px", "solid"), which are not design-token material: there is
// no border-width token, and "solid" has no colour or spacing meaning. Scoping
// them per property keeps "margin: 1px" or "border-radius: 1px" flagged, and the
// colour part of the shorthands is still enforced.
const borderIgnoreValues = [...sharedIgnoreValues, '1px', 'solid'];

// `padding` additionally accepts a `max()` call whose first argument is a spacing
// token, combined with an `env(safe-area-inset-*)` fallback: there is no design token
// for a safe-area inset, and the whole point of the call is to compare it against the
// token, so the value can never be a bare `var(...)` reference. The pattern is anchored
// on `max(var(--` (not just `max(`) so a token-free value like `max(10px, 2vw)` is
// still flagged. Scoped to `padding`/`padding-inline`, per the same per-property
// pattern as the border/outline shorthands above.
const paddingIgnoreValues = [...sharedIgnoreValues, '/^max\\(var\\(--/'];

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  ignoreFiles: ['**/node_modules/**', '**/dist/**', '**/storybook-static/**'],
  rules: {
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'property-no-vendor-prefix': null,
    // The project's breakpoint scale is expressed as `min-width` thresholds
    // (40rem/48rem/64rem/80rem); keep that prefix notation rather than the
    // range-context syntax (`(width >= 48rem)`) stylelint-config-standard defaults to.
    'media-feature-range-notation': 'prefix',
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/',
        'background',
        'fill',
        'stroke',
        'outline-color',
        'border-color',
        'font-size',
        'font-family',
        'line-height',
        'letter-spacing',
        'margin',
        'margin-block',
        'margin-block-start',
        'margin-block-end',
        'margin-inline',
        'margin-inline-start',
        'margin-inline-end',
        'padding',
        'padding-block',
        'padding-block-start',
        'padding-block-end',
        'padding-inline',
        'padding-inline-start',
        'padding-inline-end',
        'gap',
        'row-gap',
        'column-gap',
        'border-radius',
        'box-shadow',
        'transition-duration',
        'transition-timing-function',
        'border',
        'border-top',
        'border-right',
        'border-bottom',
        'border-left',
        'border-block',
        'border-block-start',
        'border-block-end',
        'border-inline',
        'border-inline-start',
        'border-inline-end',
        'outline',
        'animation-duration',
        'animation-timing-function',
        'transition',
        'text-shadow',
      ],
      {
        ignoreVariables: true,
        ignoreFunctions: false,
        expandShorthand: true,
        // Keyed by property: '' is the default list; a property key replaces the
        // default for that property, so the border/outline lists include it.
        ignoreValues: {
          '': sharedIgnoreValues,
          border: borderIgnoreValues,
          'border-top': borderIgnoreValues,
          'border-right': borderIgnoreValues,
          'border-bottom': borderIgnoreValues,
          'border-left': borderIgnoreValues,
          'border-block': borderIgnoreValues,
          'border-block-start': borderIgnoreValues,
          'border-block-end': borderIgnoreValues,
          'border-inline': borderIgnoreValues,
          'border-inline-start': borderIgnoreValues,
          'border-inline-end': borderIgnoreValues,
          outline: borderIgnoreValues,
          padding: paddingIgnoreValues,
          'padding-inline': paddingIgnoreValues,
        },
      },
    ],
  },
  overrides: [
    {
      files: ['packages/tokens/**/*.css'],
      rules: { 'scale-unlimited/declaration-strict-value': null },
    },
    // Shared base/reset stylesheet: like tokens/**, these are foundational literal
    // values (percentage/UA resets, the prefers-reduced-motion near-zero duration
    // idiom) with no design-token equivalent, not component design decisions.
    {
      files: ['packages/ui/src/styles/base.css'],
      rules: { 'scale-unlimited/declaration-strict-value': null },
    },
  ],
};
