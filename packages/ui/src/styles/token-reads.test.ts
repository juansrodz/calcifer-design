import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The component CSS reads the type tokens (`--font-display`, `--font-body`, `--font-sans` and the
// weight, stretch and transform tokens) instead of naming a face, a weight or a case, and the
// purpose radii and control sizes (`--radius-control`, `--size-control` and their siblings) instead
// of a scale step or a literal, so a theme restyles type and shape without touching library DOM.
// Shadows read the surface roles (`--shadow-soft`, `--shadow-raised`, `--shadow-dialog` and their
// siblings) instead of the elevation scale, and the chosen state, the navigation and the segmented
// track read the selected, nav and segmented colours instead of the accent and the neutrals.
// Each row below pins the declarations a rule gained (`contains`) and the literals it lost
// (`lacks`). A row with no `rule` asserts on the whole file; with a `rule` it asserts on the rule's
// body only, the regex's first capture group, and a rule that matches nothing fails the row rather
// than skipping it.
interface Expectation {
  file: string;
  rule?: RegExp;
  // A RegExp where the layout of a declaration is Prettier's to choose (a wrapped value).
  contains: readonly (string | RegExp)[];
  lacks: readonly (string | RegExp)[];
}

// Read as plain text via the filesystem for the reason `base.test.ts` records.
const sourceRoot = join(import.meta.dirname, '..');

// Any `font-weight` that is not a `var(...)` read: a number, a keyword (`bold`, `bolder`, `inherit`).
// The lookahead sits right after the colon so `\s*` cannot backtrack to zero and let
// `font-weight: var(--x)` through as if the space were the value.
const anyWeightLiteral = /font-weight:(?!\s*var\()/;

// The display role on a library heading is these four (plan ruling L1-1). Each reader keeps its own
// letter-spacing and line-height; PageHeading's size variants read `--tracking-display` and
// `--leading-display` themselves.
const displayRole = [
  'font-family: var(--font-display);',
  'font-weight: var(--font-weight-display);',
  'font-stretch: var(--font-stretch-display);',
  'text-transform: var(--text-transform-display);',
] as const;

const bodyRole = [
  'font-family: var(--font-body);',
  'font-weight: var(--font-weight-body);',
] as const;

const sansFamily = 'font-family: var(--font-sans);';

// Any `border` shorthand declaration: the property name is not preceded by a hyphen, so the longhands
// and `border-radius` do not match.
const noBorderShorthand = /(?:^|\s)border\s*:/;

// Any declaration that sizes a rule on the block axis or pads it there: a height, a block size, a
// block padding or margin in any longhand, a line height. `Select`'s trigger keeps `.control`'s
// floor and padding with a start icon only while the trigger and the icon's row declare none.
const blockSizing =
  /(?:^|\s)(?:(?:min-|max-)?height|(?:min-|max-)?block-size|padding(?:-block(?:-start|-end)?|-top|-bottom)?|margin(?:-block(?:-start|-end)?|-top|-bottom)?|line-height)\s*:/;

// A physical side, which would not mirror in a right-to-left page: `left`, `right`, a left or right
// margin or padding, or a left or right `text-align`.
const physicalSide =
  /(?:^|\s)(?:left|right|margin-left|margin-right|padding-left|padding-right)\s*:|text-align:\s*(?:left|right)/;

// The band `AvatarGroup` draws around each avatar and around its overflow chip: the one value both
// rules are pinned to, so a ring on one and not the other cannot pass.
const avatarGroupRing = '0 0 0 var(--border-width-emphasis) var(--color-avatar-ring)';

// The consumer-content rules in a component's forced-colours block carry `!important`, so a
// consumer's inline colour cannot beat the system colours, as the browser's own recolouring beats
// it outside an opt-out. The declaration lives in that block only: this row reads what precedes the
// block and requires it free of `!important`.
function importantOnlyInForcedBlock(file: string): Expectation {
  return {
    file,
    rule: /^([\s\S]*?)^@media \(forced-colors: active\) \{/m,
    contains: [],
    lacks: [/!important;/],
  };
}

// The consumer-content rules in a forced-colours block (a chosen or pressed control's content takes
// its ink) set colours only. A `Spinner` among that content has its head and track painted in one
// ink, so the track's dotted style is the only cue left; a border shorthand or border style in the
// rule, on any side and in any spelling (`border-top-style`, `border-block-style`, `border-top:`),
// would reset it.
const optionalBorderSide = '(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?';
const consumerContentKeepsStyles = [
  new RegExp(`border${optionalBorderSide}-style`),
  new RegExp(`(?:^|\\s)border${optionalBorderSide}\\s*:`),
] as const;

const expectations: ReadonlyArray<Expectation> = [
  // Whole-file rows: every weight in these files is a token now.
  {
    file: 'components/Button/Button.module.css',
    contains: [sansFamily, 'font-weight: var(--font-weight-button);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    contains: [
      sansFamily,
      'font-weight: var(--font-weight-label);',
      'font-weight: var(--font-weight-button);',
    ],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Tabs/Tabs.module.css',
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Avatar/Avatar.module.css',
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    contains: [
      sansFamily,
      'font-weight: var(--font-weight-nav);',
      'font-weight: var(--font-weight-nav-selected);',
    ],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Dialog/Dialog.module.css',
    contains: [...displayRole, ...bodyRole],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Popover/Popover.module.css',
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);', ...bodyRole],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Alert/Alert.module.css',
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);', ...bodyRole],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/ToastRegion/ToastRegion.module.css',
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);', ...bodyRole],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/PageHeading/PageHeading.module.css',
    contains: displayRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Card/Card.module.css',
    contains: [...displayRole, ...bodyRole],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Descriptions/Descriptions.module.css',
    contains: displayRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'styles/field.module.css',
    contains: [sansFamily, 'font-weight: var(--font-weight-label);', ...bodyRole],
    lacks: [anyWeightLiteral],
  },

  // Rule-scoped rows for the three files that keep weight literals this plan leaves alone (a
  // whole-file regex could not say which literal went), and for `NavMenu`'s `.link`, whose family
  // and weight are pinned to the rule that reads them.
  {
    file: 'components/DatePicker/DatePicker.module.css',
    rule: /^\.month \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-label);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/DataTable/DataTable.module.css',
    rule: /^\.caption \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: displayRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.link \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-nav);'],
    lacks: [anyWeightLiteral],
  },

  // The display readers: a library heading.
  {
    file: 'components/PageHeading/PageHeading.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: displayRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: displayRole,
    lacks: [anyWeightLiteral],
  },
  {
    // R22: this heading had no weight of its own and read the browser's bold, 700. It now reads
    // the display weight, 600.
    file: 'components/Card/Card.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: displayRole,
    lacks: [anyWeightLiteral],
  },
  {
    // R22, as for `Card`.
    file: 'components/Descriptions/Descriptions.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: displayRole,
    lacks: [anyWeightLiteral],
  },

  // The body readers: prose and values.
  {
    file: 'styles/field.module.css',
    rule: /^\.description \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.control \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Card/Card.module.css',
    rule: /^\.body \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Alert/Alert.module.css',
    rule: /^\.body \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\.description \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Popover/Popover.module.css',
    rule: /^\.description \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/ToastRegion/ToastRegion.module.css',
    rule: /^\.description \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'styles/popup.module.css',
    rule: /^\.surface\[data-popup='tooltip'\] \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/CardList/CardList.module.css',
    rule: /^\.empty \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/DataTable/DataTable.module.css',
    rule: /^\.table \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.cell \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Timeline/Timeline.module.css',
    rule: /^\.description \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },
  {
    file: 'styles/pair.module.css',
    rule: /^\.value \{([^}]*)\}/m,
    contains: bodyRole,
    lacks: [anyWeightLiteral],
  },

  // The sans readers: a control or a label inside a body region keeps the label face.
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-button);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-label);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option\[data-pressed\] \{([^}]*)\}/m,
    contains: ['font-weight: var(--font-weight-button);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Tabs/Tabs.module.css',
    rule: /^\.tab \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Tag/Tag.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: [sansFamily],
    lacks: [],
  },
  {
    file: 'components/Avatar/Avatar.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.link\[aria-current='page'\] \{([^}]*)\}/m,
    contains: ['font-weight: var(--font-weight-nav-selected);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.item \{([^}]*)\}/m,
    contains: [sansFamily],
    lacks: [],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.label,\n\.legend \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-label);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.optionLabel \{([^}]*)\}/m,
    contains: [sansFamily],
    lacks: [],
  },
  {
    file: 'components/Alert/Alert.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Popover/Popover.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/ToastRegion/ToastRegion.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: [sansFamily, 'font-weight: var(--font-weight-heading);'],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/ToastRegion/ToastRegion.module.css',
    rule: /^\.action \{([^}]*)\}/m,
    contains: [sansFamily],
    lacks: [],
  },
  {
    file: 'components/Menu/Menu.module.css',
    rule: /^\.item \{([^}]*)\}/m,
    contains: [sansFamily],
    lacks: [],
  },
  {
    file: 'components/Select/Select.module.css',
    rule: /^\.option \{([^}]*)\}/m,
    contains: [sansFamily],
    lacks: [],
  },
  // `Select`'s start icon: the slot and the value share `.lead`, a row at the affix gap that takes
  // the room the chevron leaves. Neither it nor the trigger sizes the block axis, so the trigger
  // keeps `.control`'s floor and padding, and neither names a physical side, so the row mirrors in
  // a right-to-left page. The entries carry a leading space: `gap:` alone is also found in
  // `row-gap:`.
  {
    file: 'components/Select/Select.module.css',
    rule: /^\.lead \{([^}]*)\}/m,
    contains: [
      ' display: flex;',
      ' flex: 1;',
      ' align-items: center;',
      ' gap: var(--space-2);',
      ' min-width: 0;',
    ],
    lacks: [blockSizing, physicalSide],
  },
  {
    file: 'components/Select/Select.module.css',
    rule: /^\.trigger \{([^}]*)\}/m,
    contains: [' text-align: start;'],
    lacks: [blockSizing, physicalSide],
  },

  // The purpose radii (R4) and the control floors (R17). A control reads `--radius-control` and
  // `--size-control` (`--size-control-sm` for the `sm` step), an option inside a track
  // `--radius-option`, a panel `--radius-panel`, a floating surface `--radius-popup`, a card
  // `--radius-card`, a dialog and a sheet `--radius-dialog`; every default equals the step it
  // replaces. Readers this plan leaves alone keep their size tokens (Checkbox `sm`, Menu and Select
  // items `md`, Avatar square `md`, Skeleton, Tag `full`, DatePicker day `md`, Button primary
  // `full`), and a field keeps `--size-touch` as its floor.
  {
    file: 'components/Button/Button.module.css',
    contains: [
      'min-height: var(--size-control);',
      'min-height: var(--size-control-sm);',
      'min-width: var(--size-touch);',
    ],
    // Whole-file: the row variant (O-21) reads `--radius-md` and `--size-touch`, so only the
    // rule-scoped rows below pin each variant's own radius and floor.
    lacks: ['2.5rem'],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    // Primary keeps the pill: the whole-file guard on `--radius-md` went with the row variant, so
    // the base rule pins its own radius here.
    contains: [
      'min-height: var(--size-control);',
      'min-width: var(--size-touch);',
      'border-radius: var(--radius-full);',
    ],
    lacks: ['min-height: var(--size-touch);', '--radius-md'],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-size='sm'\] \{([^}]*)\}/m,
    contains: ['min-height: var(--size-control-sm);'],
    lacks: ['2.5rem'],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='secondary'\] \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-control);'],
    lacks: ['--radius-md'],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='ghost'\] \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-control);'],
    lacks: ['--radius-md'],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    contains: [
      'min-height: var(--size-control);',
      'min-width: var(--size-control);',
      'min-height: var(--size-control-sm);',
      'min-width: var(--size-control-sm);',
      'border-radius: var(--radius-control);',
    ],
    lacks: ['2.5rem', '--radius-md', '--size-touch'],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: ['min-height: var(--size-control);', 'min-width: var(--size-control);'],
    lacks: ['--size-touch'],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.root\[data-size='sm'\] \{([^}]*)\}/m,
    contains: ['min-height: var(--size-control-sm);', 'min-width: var(--size-control-sm);'],
    lacks: ['2.5rem'],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.root\[data-variant='secondary'\] \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-control);'],
    lacks: ['--radius-md'],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    contains: [
      'min-height: var(--size-control);',
      'min-width: var(--size-control);',
      'min-height: var(--size-control-sm);',
      'min-width: var(--size-control-sm);',
      'border-radius: var(--radius-control);',
      'border-radius: var(--radius-option);',
    ],
    lacks: ['2.5rem', '--radius-md', '--radius-sm', '--size-touch'],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-control);'],
    lacks: ['--radius-md'],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option \{([^}]*)\}/m,
    contains: [
      'min-height: var(--size-control);',
      'min-width: var(--size-control);',
      'border-radius: var(--radius-option);',
    ],
    lacks: ['--size-touch', '--radius-sm'],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.root\[data-size='sm'\] \.option \{([^}]*)\}/m,
    contains: ['min-height: var(--size-control-sm);', 'min-width: var(--size-control-sm);'],
    lacks: ['2.5rem'],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    contains: [
      'min-height: var(--size-control);',
      'width: var(--size-control);',
      'height: var(--size-control);',
      'border-radius: var(--radius-option);',
      'border-radius: var(--radius-control);',
    ],
    lacks: ['--radius-md', '--radius-sm', '--size-touch'],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.link \{([^}]*)\}/m,
    contains: ['min-height: var(--size-control);', 'border-radius: var(--radius-option);'],
    lacks: ['--size-touch', '--radius-sm'],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.trigger \{([^}]*)\}/m,
    contains: [
      'width: var(--size-control);',
      'height: var(--size-control);',
      'border-radius: var(--radius-control);',
    ],
    lacks: ['--size-touch', '--radius-md'],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.item \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-control);'],
    lacks: ['--radius-md'],
  },
  {
    // A field keeps `--size-touch` as its floor; only its radius moves to the control purpose. The
    // padding is pinned too: `Select`'s doc promises 26 px of room for a start icon inside the
    // floor, which is 44 less this padding twice and the 1px border twice.
    file: 'styles/field.module.css',
    rule: /^\.control \{([^}]*)\}/m,
    contains: [
      'min-height: var(--size-touch);',
      'padding: var(--space-2) var(--space-3);',
      'border-radius: var(--radius-control);',
    ],
    lacks: ['--radius-md'],
  },
  {
    // The type-qualified selector out-ranks `.control`, which `TextArea` puts on the same element.
    file: 'components/TextArea/TextArea.module.css',
    rule: /^textarea\.root \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-panel);'],
    lacks: [],
  },
  {
    file: 'components/Alert/Alert.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-panel);'],
    lacks: ['--radius-md'],
  },
  {
    file: 'styles/popup.module.css',
    contains: ['border-radius: var(--radius-popup);', 'border-radius: var(--radius-dialog);'],
    lacks: ['--radius-xl', '--radius-lg'],
  },
  {
    file: 'styles/popup.module.css',
    rule: /^\.surface \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-popup);'],
    lacks: ['--radius-lg'],
  },
  {
    file: 'styles/popup.module.css',
    rule: /^\.surface\[data-popup='dialog'\] \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-dialog);'],
    lacks: ['--radius-xl'],
  },
  {
    file: 'styles/popup.module.css',
    rule: /^\.surface\[data-popup='sheet'\] \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-dialog) var(--radius-dialog) 0 0;'],
    lacks: ['--radius-xl'],
  },
  {
    // R4: the end drawer rounds its free leading corners, and its width is the drawer token.
    file: 'styles/popup.module.css',
    rule: /^\.surface\[data-popup='sheet'\]\[data-side='end'\] \{([^}]*)\}/m,
    contains: [
      'width: min(var(--size-drawer), 100%);',
      'border-radius: var(--radius-dialog) 0 0 var(--radius-dialog);',
    ],
    lacks: ['min(28rem', 'border-radius: 0;'],
  },
  {
    file: 'components/DataTable/DataTable.module.css',
    rule: /^\.scroll \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-popup);'],
    lacks: ['--radius-lg'],
  },
  {
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.card \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-popup);'],
    lacks: ['--radius-lg'],
  },
  {
    file: 'components/ToastRegion/ToastRegion.module.css',
    rule: /^\.toast \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-popup);'],
    lacks: ['--radius-lg'],
  },
  {
    file: 'components/Card/Card.module.css',
    contains: ['border-radius: var(--radius-card);'],
    lacks: ['--radius-xl'],
  },
  {
    file: 'components/Card/Card.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: ['border-radius: var(--radius-card);'],
    lacks: ['--radius-xl'],
  },

  // Shadows by surface. Every default equals the elevation it replaces; the three roles that are
  // new on their element (`--shadow-drawer`, `--shadow-segmented`, `--shadow-action`) default to
  // what the element shows today.
  {
    file: 'components/Card/Card.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: ['box-shadow: var(--shadow-soft);'],
    lacks: ['--elevation-1'],
  },
  {
    // The hover lift keeps the elevation scale: it is a motion, not a surface role.
    file: 'components/Card/Card.module.css',
    rule: /^ {2}\.root\[data-interactive\]:hover \{([^}]*)\}/m,
    contains: ['box-shadow: var(--elevation-2);'],
    lacks: ['--shadow-'],
  },
  {
    file: 'styles/popup.module.css',
    contains: [
      'box-shadow: var(--shadow-raised);',
      'box-shadow: var(--shadow-dialog);',
      'box-shadow: var(--shadow-sheet);',
      'box-shadow: var(--shadow-drawer);',
    ],
    lacks: ['--elevation-3'],
  },
  {
    file: 'styles/popup.module.css',
    rule: /^\.surface \{([^}]*)\}/m,
    contains: ['box-shadow: var(--shadow-raised);'],
    lacks: ['--elevation'],
  },
  {
    file: 'styles/popup.module.css',
    rule: /^\.surface\[data-popup='dialog'\] \{([^}]*)\}/m,
    contains: ['box-shadow: var(--shadow-dialog);'],
    lacks: ['--elevation'],
  },
  {
    file: 'styles/popup.module.css',
    rule: /^\.surface\[data-popup='sheet'\] \{([^}]*)\}/m,
    contains: ['box-shadow: var(--shadow-sheet);'],
    lacks: ['--elevation'],
  },
  {
    file: 'styles/popup.module.css',
    rule: /^\.surface\[data-popup='sheet'\]\[data-side='end'\] \{([^}]*)\}/m,
    contains: ['box-shadow: var(--shadow-drawer);'],
    lacks: ['--elevation'],
  },
  {
    file: 'components/ToastRegion/ToastRegion.module.css',
    contains: ['box-shadow: var(--shadow-raised);'],
    lacks: ['--elevation-2'],
  },
  {
    file: 'components/ToastRegion/ToastRegion.module.css',
    rule: /^\.toast \{([^}]*)\}/m,
    contains: ['box-shadow: var(--shadow-raised);'],
    lacks: ['--elevation'],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: ['box-shadow: var(--shadow-segmented);'],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='primary'\] \{([^}]*)\}/m,
    contains: ['box-shadow: var(--shadow-action);'],
    lacks: [],
  },

  // The selected family: the chosen option, the tab indicator and the chosen day read
  // `--color-selected` and `--color-selected-text`, not the accent pair. A theme can now colour a
  // selection apart from a primary action. `aria-current` (today) keeps its accent border.
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option\[data-pressed\] \{([^}]*)\}/m,
    contains: [
      'background: var(--color-selected);',
      'color: var(--color-selected-text);',
      'font-weight: var(--font-weight-button);',
    ],
    lacks: ['--color-accent'],
  },
  {
    // No read of the accent pair. The chosen option's badge re-declares `--color-accent-soft` and
    // `--color-border-accent` for a nested pill (row below), which is a declaration, not a read.
    file: 'components/Segmented/Segmented.module.css',
    contains: [],
    lacks: [/var\(--color-accent/],
  },
  {
    // The track and its border: the defaults are the neutrals they replace, and the width stays
    // the 1px it was.
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: [
      'border: 1px solid var(--color-segmented-border);',
      'background: var(--color-segmented-track);',
    ],
    lacks: ['--color-border-strong', '--color-surface-2'],
  },
  {
    file: 'components/Tabs/Tabs.module.css',
    rule: /^\.indicator \{([^}]*)\}/m,
    contains: ['background: var(--color-selected);'],
    lacks: ['--color-accent'],
  },
  {
    file: 'components/Tabs/Tabs.module.css',
    contains: [],
    lacks: ['--color-accent'],
  },
  {
    // A pressed toggle wears the soft selected pair, as a selected secondary `Button` does.
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.root\[data-pressed\] \{([^}]*)\}/m,
    contains: [
      'background: var(--color-selected-soft);',
      'color: var(--color-selected-soft-text);',
    ],
    lacks: ['--color-accent'],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^ {2}\.root\[data-pressed\]:hover:not\(\[data-disabled\]\) \{([^}]*)\}/m,
    contains: [
      'background: var(--color-selected-soft);',
      'color: var(--color-selected-soft-text);',
    ],
    lacks: ['--color-accent'],
  },
  // Forced colours on `IconButton` and `LinkIconButton`. They erase the selected tint, so a pressed
  // button is filled `Highlight` and drawn outside the browser's own recolouring, with a `Highlight`
  // edge as on a chosen `Button`: inside the opt-out a secondary button's token border was a faint
  // ring on the fill.
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^@media \(forced-colors: active\) \{\n {2}\.root\[data-pressed\],\n {2}\.root\[data-pressed\]:hover:not\(\[data-disabled\]\) \{([^}]*)\}/m,
    contains: [
      'forced-color-adjust: none;',
      'border-color: Highlight;',
      'background: Highlight;',
      ' color: HighlightText;',
      'outline-color: CanvasText;',
    ],
    lacks: [],
  },
  // The block's rules win by coming later: `.root[data-disabled]` weighs what the variants' border
  // colours and the base 0.45 opacity weigh, and `.root[data-disabled] .badge` what the primary
  // badge weighs. The regex starts at the last normal-mode rule they override, so a block moved
  // above it fails to match.
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.root\[data-variant='primary'\]\[data-pressed\] \.badge \{[^}]*\}[\s\S]*?^@media \(forced-colors: active\) \{\n {2}\.root\[data-pressed\],\n {2}\.root\[data-pressed\]:hover:not\(\[data-disabled\]\) \{([^}]*)\}/m,
    contains: ['forced-color-adjust: none;'],
    lacks: [],
  },
  // Nothing follows the block either: a normal-mode rule appended after it would win the cascade
  // back from the block, and the row above, which anchors on a rule before it, would not notice.
  // Every rule inside the block is indented, so the first `}` at the start of a line closes it.
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^\}\n([\s\S]*)/m,
    contains: [],
    lacks: [/\{/],
  },
  // The icon a caller puts in a pressed button sits inside the opt-out, so its token colours were
  // painted as they are (a tinted icon at 1.4:1 on the fill). It takes the button's ink, as in
  // `Button`, with `!important` so an inline colour cannot beat it; a loading button is left out,
  // as its spinner sits in the same slot and draws its own track.
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-pressed\]:not\(\[data-loading\]\) \.icon \* \{([^}]*)\}/m,
    contains: [
      '--icon-button-content-edge: currentcolor;',
      'border-color: var(--icon-button-content-edge) !important;',
      'background-color: transparent !important;',
      ' color: inherit !important;',
    ],
    lacks: consumerContentKeepsStyles,
  },
  importantOnlyInForcedBlock('components/IconButton/IconButton.module.css'),
  // The browser paints a hovered button's border `Highlight` and a link's not at all, so a
  // `LinkIconButton` had no hover cue under forced colours. The rule gives it the one an
  // `IconButton`, a `Button` and a `LinkButton` have; a disabled button keeps its `GrayText` edge,
  // and a pressed one, as on `Segmented`, its fill alone.
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}@media \(hover: hover\) \{\n {4}\.root:hover:not\(\[data-disabled\], \[data-pressed\]\) \{([^}]*)\}/m,
    contains: ['border-color: Highlight;'],
    lacks: [],
  },
  // A disabled or loading button (`data-disabled` is set on both) is not dimmed on top of
  // `GrayText`: the dim took the glyph, the edge and a focused loading button's ring under 3:1.
  // The bare `color:` entries here and below carry a leading space: `contains` is a substring test,
  // and `color: GrayText;` alone is also found in `border-color: GrayText;`, so the entry could not
  // fail.
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-disabled\] \{([^}]*)\}/m,
    contains: ['opacity: 1;', 'border-color: GrayText;', ' color: GrayText;'],
    lacks: [],
  },
  // A pressed one that is disabled reads disabled while its fill still says pressed: the pressed
  // rule would otherwise leave it `Highlight`.
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-pressed\]\[data-disabled\] \{([^}]*)\}/m,
    contains: ['background: GrayText;', 'color: Canvas;'],
    lacks: ['Highlight'],
  },
  // The badge's fill is the page colour in forced colours, so its shape needs an edge of its own.
  // The border is declared in the forced-colours block only; the top-level rule keeps none.
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.badge \{([^}]*)\}/m,
    contains: ['border: 1px solid transparent;'],
    lacks: [],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.badge \{([^}]*)\}/m,
    contains: [],
    lacks: [noBorderShorthand],
  },
  // A disabled or loading button's badge is `GrayText` too. Without this rule a loading button's
  // badge would be drawn in the text colour, as the browser does not hold that button disabled.
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-disabled\] \.badge \{([^}]*)\}/m,
    contains: [' color: GrayText;', 'border-color: GrayText;'],
    lacks: [],
  },
  // The pressed badge is drawn outside the recolouring, so its border is named: `Highlight`, the
  // button's own fill, or half of the badge would vanish into the page. Disabled, it is `GrayText`.
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-variant\]\[data-pressed\] \.badge \{([^}]*)\}/m,
    contains: ['background: HighlightText;', ' color: Highlight;', 'border-color: Highlight;'],
    lacks: [],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-variant\]\[data-pressed\]\[data-disabled\] \.badge \{([^}]*)\}/m,
    contains: ['background: Canvas;', ' color: GrayText;', 'border-color: GrayText;'],
    lacks: ['Highlight'],
  },
  {
    // The grid's selected and highlighted rows take the soft selected tint and its text colour.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.row\[data-highlighted\],\n\.row\[aria-selected='true'\] \{([^}]*)\}/m,
    contains: ['background: var(--color-selected-soft);'],
    lacks: ['--color-accent'],
  },
  {
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.row\[data-highlighted\] \.cell,\n\.row\[aria-selected='true'\] \.cell \{([^}]*)\}/m,
    contains: ['color: var(--color-selected-soft-text);'],
    lacks: [],
  },
  {
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.row\[data-highlighted\] \.cell\.pinnedCell,\n\.row\[aria-selected='true'\] \.cell\.pinnedCell \{([^}]*)\}/m,
    contains: ['var(--color-selected-soft)'],
    lacks: ['--color-accent'],
  },
  {
    // A body row's divider is the line along the top of each of its cells, drawn by every row but
    // the first. Along the bottom, a pinned (sticky) cell's line went missing or jogged at
    // fractional row offsets; the stylesheet says why.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^tr:not\(:first-child\) > :is\(\.cell, \.detailCell, \.errorCell\) \{([^}]*)\}/m,
    contains: ['box-shadow: inset 0 1px 0 var(--color-border);'],
    lacks: [],
  },
  {
    // No cell draws a line along its bottom edge any more, and the last row needs no rule to drop
    // one; the expanded row's panel draws the line above itself and the row after it the one below.
    file: 'components/DataGrid/DataGrid.module.css',
    contains: [],
    lacks: ['inset 0 -1px 0', /^\.row:last-child \.cell/m, /^\.detailRow \{/m],
  },
  {
    // The divider rule above is the only place a cell gets a shadow.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.cell \{([^}]*)\}/m,
    contains: [],
    lacks: ['box-shadow'],
  },
  {
    // The grid's checkboxes are blocks centred in their cells, not inline boxes on the cell's text
    // baseline, where a box sat above the middle by 3.2px unchecked and 1.7px checked. Two classes,
    // so the field skin's `display: inline-flex` loses in whatever order the stylesheets load.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.selectHeader > \.checkbox,\n\.selectCell > \.checkbox \{([^}]*)\}/m,
    contains: ['display: flex;', 'margin-inline: auto;'],
    lacks: [],
  },
  {
    // The error cell spans the table, which can be wider than the scroll area (a phone), so its
    // focus ring goes on the in-view box rather than on the cell, whose far edge is out of view.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.errorCell:focus-visible \{([^}]*)\}/m,
    contains: ['outline: none;'],
    lacks: [],
  },
  {
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.errorCell:focus-visible > \.inView \{([^}]*)\}/m,
    contains: [
      'outline: var(--focus-ring-width) solid var(--color-focus);',
      'outline-offset: calc(var(--focus-ring-width) * -1);',
    ],
    lacks: [],
  },
  {
    // The cell's block padding moves onto the in-view box, so the ring keeps clear of the button.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.errorCell \{([^}]*)\}/m,
    contains: ['padding: 0;'],
    lacks: ['var(--space-3)'],
  },
  {
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.errorContent \{([^}]*)\}/m,
    contains: ['padding-block: var(--space-3);'],
    lacks: [],
  },
  {
    // The shared ring rule no longer names the error cell.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^(\.headerCell:focus-visible,[^{]*)\{/m,
    contains: ['.detailCell:focus-visible'],
    lacks: ['.errorCell'],
  },
  {
    // The band sticks 1px above the scroll area's top edge. A composited sticky layer can land up
    // to a device pixel below the clip (headed, GPU-composited Chrome), which let one row of body
    // text show above the band; the overlap puts that rounding under the band instead.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.head \{([^}]*)\}/m,
    contains: ['position: sticky;', 'inset-block-start: -1px;'],
    lacks: ['inset-block-start: 0;'],
  },
  {
    // The band's top hairline is the scroll area's own border: outside the clip, so it stays put
    // while the band sticks 1px above it.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.scroll \{([^}]*)\}/m,
    contains: ['border-block-start: 1px solid var(--color-border);'],
    lacks: [],
  },
  {
    // The header cells draw only their bottom hairline: the top one is the scroll area's border.
    file: 'components/DataGrid/DataGrid.module.css',
    contains: [],
    lacks: [/\.headerCell::before/],
  },
  {
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.headerCell::after \{([^}]*)\}/m,
    contains: ['inset-block-end: 0;', 'border-block-start: 1px solid var(--color-border);'],
    lacks: ['inset-block-start'],
  },
  {
    // The row actions header's hairline joins that border to the bottom one, so it draws no top
    // line of its own.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.headerCell\.actionsHeader::after \{([^}]*)\}/m,
    contains: ['border-block-start: 0;', 'border-block-end: 1px solid var(--color-border);'],
    lacks: [],
  },
  {
    // The state and error rows' content sticks to the scroll area's inline start, so it stays in
    // view while the body scrolls sideways, and keeps to the width the grid measures and sets on
    // the scroll area; jsdom lays nothing out, so the stylesheet is the pin.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.inView \{([^}]*)\}/m,
    contains: [
      'position: sticky;',
      'inset-inline-start: 0;',
      'max-inline-size: var(--data-grid-view-inline-size, none);',
    ],
    lacks: [],
  },
  {
    // Forced colours drop box-shadow, so there each row and each open panel draws the line under
    // it as a border instead, all but the last.
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^@media \(forced-colors: active\) \{\n {2}\.row,\n {2}\.detailRow \{([^}]*)\}/m,
    contains: ['border-block-end: 1px solid var(--color-border);'],
    lacks: [],
  },
  {
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^ {2}\.row:last-child,\n {2}\.detailRow:last-child \{([^}]*)\}/m,
    contains: ['border-block-end: 0;'],
    lacks: [],
  },
  {
    file: 'components/DataGrid/DataGrid.module.css',
    rule: /^\.row \{([^}]*)\}/m,
    contains: ['transition-property: background-color;'],
    lacks: ['border'],
  },
  {
    file: 'components/DatePicker/DatePicker.module.css',
    rule: /^\.day\[aria-selected='true'\] \{([^}]*)\}/m,
    contains: ['background: var(--color-selected);', 'color: var(--color-selected-text);'],
    lacks: ['--color-accent'],
  },
  {
    // Today keeps its accent border: `aria-current` is not a selection.
    file: 'components/DatePicker/DatePicker.module.css',
    rule: /^\.day\[aria-current='date'\] \{([^}]*)\}/m,
    contains: ['border: 1px solid var(--color-accent);'],
    lacks: ['--color-selected'],
  },

  // The room kept for a sixth week is kept only while the calendar sits above its trigger, where a
  // shorter month would move the buttons out from under a pointer; below it, nothing moves.
  {
    file: 'components/DatePicker/DatePicker.module.css',
    rule: /^\.popup\[data-side='top'\] \.gridSlot \{([^}]*)\}/m,
    contains: ['min-height: calc(7 * var(--size-touch));'],
    lacks: [],
  },
  {
    file: 'components/DatePicker/DatePicker.module.css',
    contains: [],
    lacks: [/^\.gridSlot \{[^}]*min-height/m],
  },

  // The checkbox's box and the radio's dot are known by their boundary alone, so it reads the
  // opaque control border, which the tokens hold to 3:1 (WCAG 1.4.11), not the translucent hairline.
  // The hairline stays as the fallback only: a page still on a tokens sheet older than 0.4.0 has
  // no `--color-border-control`, and without a fallback the whole `border` would drop to none.
  {
    file: 'styles/field.module.css',
    rule: /^\.controlBox \{([^}]*)\}/m,
    contains: ['border: 1px solid var(--color-border-control, var(--color-border-strong));'],
    lacks: [/border: 1px solid var\(--color-border-strong\)/],
  },
  {
    // Forced colours replace the mixed border and fill, so a dimmed control's edge takes `GrayText`,
    // the system's own disabled colour, as a disabled `ChoiceCard`'s does. It is read after the
    // `@supports` block, because both rules weigh the same and the later one wins the tie.
    file: 'styles/field.module.css',
    rule: /^@supports \(color: color-mix\(in srgb, red, blue\)\) \{[\s\S]*?^@media \(forced-colors: active\) \{\n {2}\.dimmedControl \{([^}]*)\}/m,
    contains: ['border-color: GrayText;'],
    lacks: [],
  },

  // Invalid, the box is still unchecked and its boundary still all that marks it, so the error
  // colour is the opaque danger the tokens hold to 3:1, not the translucent danger border.
  {
    file: 'styles/field.module.css',
    rule: /^\.controlBox\[data-invalid\] \{([^}]*)\}/m,
    contains: ['border-color: var(--color-danger);'],
    lacks: ['--color-danger-border'],
  },

  // The navigation colours. The current link's background defaults to `transparent`, so the link
  // looks as it does today until a theme gives it a fill.
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.link \{([^}]*)\}/m,
    contains: ['color: var(--color-nav-text);'],
    lacks: ['--color-text-muted'],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.link\[aria-current='page'\] \{([^}]*)\}/m,
    contains: [
      'background: var(--color-nav-selected);',
      'color: var(--color-nav-selected-text);',
      'font-weight: var(--font-weight-nav-selected);',
    ],
    lacks: ['color: var(--color-text);'],
  },
  {
    // The hover rule skips the current link: `.link:hover` ties `.link[aria-current='page']` on
    // specificity and comes later, so a bare hover rule would repaint the current link in
    // `--color-text` and lose `--color-nav-selected-text` the moment a theme sets them apart.
    file: 'components/NavMenu/NavMenu.module.css',
    contains: [".link:hover:not([aria-current='page'])"],
    lacks: [/\.link:hover\s*\{/],
  },
  {
    // Hover on the other links is unchanged.
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^ {2}\.link:hover:not\(\[aria-current='page'\]\) \{([^}]*)\}/m,
    contains: ['color: var(--color-text);'],
    lacks: ['--color-nav-selected'],
  },

  // The sheet's scrim has its own hook. The centred dialog and the end drawer keep `--color-scrim`.
  {
    file: 'styles/popup.module.css',
    rule: /^\.scrim \{([^}]*)\}/m,
    contains: ['background: var(--color-scrim);'],
    lacks: ['--color-scrim-sheet'],
  },
  {
    file: 'styles/popup.module.css',
    rule: /^\.scrim\[data-variant='sheet'\]\[data-side='bottom'\] \{([^}]*)\}/m,
    contains: ['background: var(--color-scrim-sheet);'],
    lacks: [],
  },

  // `Button`'s tones (plan L2, Task 10). The inverse and selected fills read their colour families
  // and the inverse primary its own shadow role; a toned fill keeps its colour on hover, so the
  // two hover rules name the accent tone; the inverse primary's disabled state paints a dimmed fill
  // and ink (L2-3: the two `color-mix` values live in local custom properties on that rule) in
  // place of the house 0.45 opacity; and the `lg` size reads the display role (L2-17).
  {
    file: 'components/Button/Button.module.css',
    contains: [
      'var(--color-inverse)',
      'var(--color-inverse-soft)',
      'var(--shadow-action-inverse)',
      'var(--color-selected-soft)',
    ],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    contains: [
      "[data-tone='inverse'][data-disabled]",
      '--button-inverse-disabled-fill',
      '--button-inverse-disabled-ink',
    ],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    contains: [
      "[data-size='lg']",
      '--button-lg-padding-inline',
      'var(--font-display)',
      'var(--font-stretch-display)',
    ],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='primary'\]\[data-tone='inverse'\] \{([^}]*)\}/m,
    contains: [
      'background: var(--color-inverse);',
      'color: var(--color-inverse-text);',
      'box-shadow: var(--shadow-action-inverse);',
    ],
    lacks: ['--color-accent'],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='secondary'\]\[data-tone='inverse'\] \{([^}]*)\}/m,
    contains: [
      'background: var(--color-inverse-soft);',
      'color: var(--color-inverse-soft-text);',
      'border-color: transparent;',
    ],
    lacks: ['--color-border-strong'],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='primary'\]\[data-tone='selected'\] \{([^}]*)\}/m,
    contains: ['background: var(--color-selected);', 'color: var(--color-selected-text);'],
    lacks: ['--color-accent'],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='secondary'\]\[data-tone='selected'\] \{([^}]*)\}/m,
    contains: [
      'background: var(--color-selected-soft);',
      'color: var(--color-selected-soft-text);',
      'border-color: transparent;',
    ],
    lacks: ['--color-accent', '--color-border-strong'],
  },
  // Forced colours: a chosen primary or secondary is a `Highlight` fill with `HighlightText` ink,
  // drawn outside the browser's own recolouring (`forced-color-adjust: none`) as a pressed
  // `IconButton` is. The `Highlight` edge alone moved it only 1.9:1 (light) and 2.3:1 (dark) from
  // the resting edge, so the fill is the cue. The opt-out would keep the primary's shadow, so it is
  // cleared, and the ring is `CanvasText`, as the fill would swallow a `Highlight` one. The bare
  // `[data-variant]` weighs it (0,4,0), over the selected secondary's (0,3,0) transparent border,
  // so it does not win by source order alone.
  {
    file: 'components/Button/Button.module.css',
    rule: /^@media \(forced-colors: active\) \{\n {2}\.root\[data-tone='selected'\]\[data-variant\]:is\(\s*\[data-variant='primary'\],\s*\[data-variant='secondary'\]\s*\) \{([^}]*)\}/m,
    contains: [
      'forced-color-adjust: none;',
      'box-shadow: none;',
      'border-color: Highlight;',
      'background: Highlight;',
      ' color: HighlightText;',
      'outline-color: CanvasText;',
    ],
    lacks: [],
  },
  // A disabled or loading button (Base UI sets `data-disabled` on both) is `GrayText`, the system's
  // own disabled colour, and not dimmed as well, as on `ChoiceCard`: the 45% dim on top of it left
  // the label and the edge at 3.0 and 3.3:1, and a loading button (not natively disabled) was
  // `ButtonText` at 45%. A pending button is exempt: it is busy, not dimmed. The rule weighs
  // (0,5,0), as the inverse primary's disabled rule inside `@supports` does, so it comes after that
  // one in the file.
  {
    file: 'components/Button/Button.module.css',
    rule: /^@supports \(color: color-mix\(in srgb, red, blue\)\) \{[\s\S]*?^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-variant\]\[data-tone\]\[data-disabled\]:not\(\[data-pending\]\) \{([^}]*)\}/m,
    contains: ['opacity: 1;', 'border-color: GrayText;', ' color: GrayText;'],
    lacks: ['opacity: 0.45'],
  },
  // A chosen button that is disabled or loading reads disabled while its fill still says chosen: a
  // `GrayText` fill with a `Canvas` ink, as a pressed disabled `IconButton`. It weighs (0,6,0),
  // over the disabled rule above whatever the order.
  {
    file: 'components/Button/Button.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-tone='selected'\]\[data-variant\]\[data-disabled\]:not\(\[data-pending\]\):is\(\s*\[data-variant='primary'\],\s*\[data-variant='secondary'\]\s*\) \{([^}]*)\}/m,
    contains: ['background: GrayText;', ' color: Canvas;'],
    lacks: ['Highlight'],
  },
  // What the caller puts inside a chosen button (a `Tag`, an icon with a colour of its own) sits
  // inside the opt-out, where its token colours were painted as they are: a light `Tag` pill, a
  // tinted icon at 1.3:1 on the fill. Every descendant takes the button's ink, drops its fill and
  // draws any border in that ink; a disabled or loading button's content follows its `GrayText`. In
  // a pending button only the spinner is left out, as it draws its own track; with a start icon it
  // takes that slot, and the third selector covers the label, badge and end icon that stay in view.
  {
    file: 'components/Button/Button.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-tone='selected'\]\[data-variant\]:not\(\[data-pending\]\):is\(\s*\[data-variant='primary'\],\s*\[data-variant='secondary'\]\s*\)\s*\*,\n {2}\.root\[data-variant\]\[data-tone\]\[data-disabled\]:not\(\[data-pending\]\) \*,\n {2}\.root\[data-tone='selected'\]\[data-variant\]\[data-pending\]:is\(\s*\[data-variant='primary'\],\s*\[data-variant='secondary'\]\s*\)\s*:is\(\.label, \.badge, \.endIcon\)\s*\* \{([^}]*)\}/m,
    contains: [
      '--button-content-edge: currentcolor;',
      'border-color: var(--button-content-edge) !important;',
      'background-color: transparent !important;',
      ' color: inherit !important;',
    ],
    lacks: consumerContentKeepsStyles,
  },
  importantOnlyInForcedBlock('components/Button/Button.module.css'),
  // The browser paints a hovered button's border `Highlight` and a link's not at all, so a
  // `LinkButton` had no hover cue under forced colours. The rule gives it the one a `Button` has
  // (a ghost `Button`'s, painted in the text colour before, turns `Highlight` too). A disabled
  // button keeps its `GrayText` edge.
  {
    file: 'components/Button/Button.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}@media \(hover: hover\) \{\n {4}\.root:hover:not\(\[data-disabled\]\) \{([^}]*)\}/m,
    contains: ['border-color: Highlight;'],
    lacks: [],
  },
  // The loading label's own 70% dim would take the `GrayText` label under 7:1. A pending button is
  // left to the rule after this one.
  {
    file: 'components/Button/Button.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-loading\]:not\(\[data-pending\]\) \.label \{([^}]*)\}/m,
    contains: ['opacity: 1;'],
    lacks: [],
  },
  // A pending button's label is hidden under the spinner by `opacity: 0` alone in forced colours:
  // the `color: transparent` that hides it in the default look reverts to the system text colour.
  // A button that is `loading` as well meets the loading rule's 70% at (0,3,0), which beats the
  // overlay rule's (0,2,0), so the label showed through at 70%; this rule weighs (0,4,0).
  {
    file: 'components/Button/Button.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.root\[data-pending\] \.pendingOverlay \+ \.label \{([^}]*)\}/m,
    contains: ['opacity: 0;'],
    lacks: [],
  },
  // Nothing follows the block: a normal-mode rule appended after it would win the cascade back, as
  // the block's rules tie with the `@supports` rule and the base rules and win by coming later.
  // Every rule inside the block is indented, so the first `}` at the start of a line closes it.
  {
    file: 'components/Button/Button.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^\}\n([\s\S]*)/m,
    contains: [],
    lacks: [/\{/],
  },
  {
    // The dimmed fill and ink sit inside the `@supports` block, and nothing else in the file mixes a
    // colour: a browser without `color-mix()` keeps the house 0.45 opacity of `.root[data-disabled]`
    // instead of an unset fill at full opacity. The regex takes the `@supports` header and the rule
    // directly inside it, so a rule hoisted out of the block fails to match.
    file: 'components/Button/Button.module.css',
    rule: /^@supports \(color: color-mix\(in srgb, red, blue\)\) \{\n {2}\.root\[data-variant='primary'\]\[data-tone='inverse'\]\[data-disabled\]:not\(\[data-pending\]\) \{([^}]*)\}\n\}/m,
    contains: [
      '--button-inverse-disabled-fill: color-mix(in srgb, var(--color-inverse) 55%, transparent);',
      '--button-inverse-disabled-ink: color-mix(in srgb, var(--color-inverse-text) 50%, transparent);',
      'opacity: 1;',
      'background: var(--button-inverse-disabled-fill);',
      'color: var(--button-inverse-disabled-ink);',
    ],
    lacks: ['opacity: 0.45;'],
  },
  {
    // Outside the `@supports` block nothing reads the two disabled properties, and the house
    // disabled rule keeps its 0.45 opacity for every tone.
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-disabled\] \{([^}]*)\}/m,
    contains: ['opacity: 0.45;'],
    lacks: ['--button-inverse-disabled', 'color-mix'],
  },
  {
    // Hover repaints the accent tone only; a toned fill keeps its colour.
    file: 'components/Button/Button.module.css',
    contains: [
      ".root[data-variant='primary'][data-tone='accent']:hover:not([data-disabled])",
      ".root[data-variant='secondary'][data-tone='accent']:hover:not([data-disabled])",
    ],
    lacks: [
      ".root[data-variant='primary']:hover",
      ".root[data-variant='secondary']:hover",
      /\[data-tone='(?:inverse|selected)'\]:hover/,
    ],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-size='lg'\] \{([^}]*)\}/m,
    contains: [
      '--button-lg-padding-inline: calc(var(--space-5) + var(--space-1));',
      'min-height: 3rem;',
      'padding: var(--space-2) var(--button-lg-padding-inline);',
      'font-size: var(--text-lg);',
      ...displayRole,
    ],
    lacks: [anyWeightLiteral, 'var(--font-sans)', 'padding: var(--space-3)'],
  },
  {
    // The label-to-count distance is the button's own `gap`; the badge adds no margin of its own.
    file: 'components/Button/Button.module.css',
    rule: /^\.badge \{([^}]*)\}/m,
    contains: ['display: inline-flex;'],
    lacks: ['margin'],
  },

  // `Button`'s list-row variant (plan L2, Task 15; O-21, L2-19). A row is as wide as the box it
  // sits in, start-aligned, with no fill or border at rest, the 44 px touch floor where R17 lowers
  // `--size-control` for the other variants, and `--color-surface-2` on hover and press. jsdom
  // loads no CSS, so these rows are where the full width is pinned; Task 14 measures it.
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='row'\] \{([^}]*)\}/m,
    contains: [
      'display: flex;',
      'width: 100%;',
      'justify-content: flex-start;',
      'text-align: start;',
      'white-space: normal;',
      'min-height: var(--size-touch);',
      'padding: var(--space-2) var(--space-3);',
      'border-color: transparent;',
      'border-radius: var(--radius-md);',
      'background: transparent;',
      'color: var(--color-text);',
    ],
    lacks: ['--size-control', '--radius-control', '--radius-full', '--color-link'],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='row'\] \.label \{([^}]*)\}/m,
    contains: ['flex: 1 1 auto;', 'min-width: 0;'],
    lacks: [],
  },
  {
    // Hover sits inside the `@media (hover: hover)` block (two-space indent); the press is outside
    // it, so a touch press paints too, and it also drops the 2 % shrink that would move both edges
    // of a full-width row.
    file: 'components/Button/Button.module.css',
    rule: /^ {2}\.root\[data-variant='row'\]:hover:not\(\[data-disabled\]\) \{([^}]*)\}/m,
    contains: ['background: var(--color-surface-2);'],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='row'\]:active:not\(\[data-disabled\]\) \{([^}]*)\}/m,
    contains: ['background: var(--color-surface-2);', 'transform: none;'],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    contains: [
      "[data-variant='row']:hover:not([data-disabled])",
      "[data-variant='row']:active:not([data-disabled])",
      'var(--color-surface-2)',
      '.endIcon',
      'var(--color-text-muted)',
    ],
    lacks: [],
  },
  {
    // The two icon slots share one rule: a decorative holder that never shrinks and sizes its glyph.
    // The end icon is pushed to the row's end by the label, and only the row draws it in the muted
    // ink.
    file: 'components/Button/Button.module.css',
    rule: /^\.icon,\n\.endIcon \{([^}]*)\}/m,
    contains: ['display: inline-flex;', 'flex: none;'],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.icon > svg,\n\.endIcon > svg \{([^}]*)\}/m,
    contains: ['width: 1rem;', 'height: 1rem;'],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='row'\] \.endIcon \{([^}]*)\}/m,
    contains: ['color: var(--color-text-muted);'],
    lacks: [],
  },

  // `Button`'s leading icon and pending state (plan L2, Task 16; O-22, L2-20). A pending button
  // keeps the label in the layout and the accessible name, so the label is hidden with `opacity`
  // and a transparent ink, never `visibility`; the spinner's head reads the accent, which vanishes
  // on the accent fill, so the primary variant hands it the button's own ink; the pending look
  // lifts the disabled dimming; and the inverse primary's dimmed fill leaves a pending button
  // alone. jsdom loads no CSS, so these rows pin it and Task 14 checks the name in the browser.
  {
    file: 'components/Button/Button.module.css',
    contains: ['.icon > svg', '--color-accent: currentcolor', ':not([data-pending])'],
    lacks: [],
  },
  {
    // One rule for both places the spinner sits: the start slot and the overlay.
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='primary'\] \.icon,\n\.root\[data-variant='primary'\] \.pendingOverlay \{([^}]*)\}/m,
    contains: ['--color-accent: currentcolor;'],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-pending\] \{([^}]*)\}/m,
    contains: ['position: relative;', 'opacity: 1;', 'cursor: progress;'],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.pendingOverlay \{([^}]*)\}/m,
    contains: [
      'position: absolute;',
      'inset: 0;',
      'display: flex;',
      'align-items: center;',
      'justify-content: center;',
      'pointer-events: none;',
    ],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.pendingOverlay \+ \.label \{([^}]*)\}/m,
    contains: ['opacity: 0;', 'color: transparent;'],
    lacks: ['visibility'],
  },
  {
    // The badge and the end icon hide under the spinner too, by opacity: the badge is named.
    file: 'components/Button/Button.module.css',
    rule: /^\.pendingOverlay ~ \.badge,\n\.pendingOverlay ~ \.endIcon \{([^}]*)\}/m,
    contains: ['opacity: 0;'],
    lacks: ['visibility', 'display'],
  },

  // `Skeleton`'s radius hook (plan L2, Task 16; O-22): a consumer rounds the text and block bars
  // through `--skeleton-radius`, each falling back to the step it read before; the circle keeps
  // the full radius and never reads the hook.
  {
    file: 'components/Skeleton/Skeleton.module.css',
    contains: [
      'var(--skeleton-radius, var(--radius-sm))',
      'var(--skeleton-radius, var(--radius-md))',
    ],
    lacks: [],
  },
  {
    file: 'components/Skeleton/Skeleton.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: ['border-radius: var(--skeleton-radius, var(--radius-sm));'],
    lacks: [],
  },
  {
    file: 'components/Skeleton/Skeleton.module.css',
    rule: /^\.root\[data-variant='block'\] \{([^}]*)\}/m,
    contains: ['border-radius: var(--skeleton-radius, var(--radius-md));'],
    lacks: [],
  },
  {
    file: 'components/Skeleton/Skeleton.module.css',
    rule: /^\.root\[data-variant='circle'\] \{([^}]*)\}/m,
    contains: ['var(--radius-full)'],
    lacks: ['--skeleton-radius'],
  },

  // `IconButton`'s `soft` variant: a quiet fill that reads the surface roles, a hover one step up,
  // the one consumer hook (L2-17, `--icon-button-shadow`, on `soft` only) and the 16 px glyph in
  // both sizes (L2-12).
  {
    file: 'components/IconButton/IconButton.module.css',
    contains: [
      "[data-variant='soft']",
      'var(--color-surface-3)',
      "[data-variant='soft'] .icon > svg",
      'var(--icon-button-shadow, none)',
    ],
    lacks: [],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.root\[data-variant='soft'\] \{([^}]*)\}/m,
    contains: [
      'background: var(--color-surface-2);',
      'color: var(--color-text);',
      'border-color: transparent;',
      'box-shadow: var(--icon-button-shadow, none);',
    ],
    lacks: [],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.root\[data-variant='soft'\] \.icon > svg \{([^}]*)\}/m,
    contains: ['width: 1rem;', 'height: 1rem;'],
    lacks: [],
  },
  {
    // The hook is read on `soft` alone: the base, secondary and primary rules do not read it (ghost
    // has no rule of its own beyond its hover).
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: [],
    lacks: ['--icon-button-shadow'],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.root\[data-variant='secondary'\] \{([^}]*)\}/m,
    contains: [],
    lacks: ['--icon-button-shadow'],
  },
  {
    file: 'components/IconButton/IconButton.module.css',
    rule: /^\.root\[data-variant='primary'\] \{([^}]*)\}/m,
    contains: [],
    lacks: ['--icon-button-shadow'],
  },

  // `Segmented`'s badge slot (contract §2.2, styled as `Button`'s badge), the full-width group
  // (L2-17) and the one consumer hook on the chosen option, `--segmented-pressed-shadow`.
  {
    // As on `Button`: the option's `gap` spaces the count from the label, the badge adds no margin.
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.badge \{([^}]*)\}/m,
    contains: ['display: inline-flex;'],
    lacks: ['margin'],
  },
  {
    // A pill in the chosen option is drawn as the option's inverse: every token a `Tag` reads is
    // re-pointed to the selected pair, so it stays legible on `--color-selected`.
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option\[data-pressed\] \.badge \{([^}]*)\}/m,
    contains: [
      '--color-surface-2: var(--color-selected-text);',
      '--color-accent-soft: var(--color-selected-text);',
      '--color-border: transparent;',
      '--color-border-accent: transparent;',
      '--color-text: var(--color-selected);',
      '--color-text-muted: var(--color-selected);',
    ],
    lacks: [],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.root\[data-fill\] \{([^}]*)\}/m,
    contains: ['display: flex;', 'width: 100%;'],
    lacks: [],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.root\[data-fill\] \.option \{([^}]*)\}/m,
    contains: ['flex: 1 1 0;'],
    lacks: [],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option\[data-pressed\] \{([^}]*)\}/m,
    contains: ['box-shadow: var(--segmented-pressed-shadow, none);'],
    lacks: [],
  },
  {
    // The hook is read on the chosen option alone.
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option \{([^}]*)\}/m,
    contains: [],
    lacks: ['--segmented-pressed-shadow'],
  },

  // `Dialog`'s header slots, pinned sheet footer, grab handle and heading hooks (contract §2.2,
  // L2-17). Its close control wears the shared close circle (the rows below).
  {
    file: 'components/Dialog/Dialog.module.css',
    contains: [
      'margin-top: auto',
      'flex: 1 1 auto',
      'var(--color-sheet-handle)',
      'var(--dialog-heading-size, var(--text-h3))',
      'var(--dialog-heading-tracking, var(--tracking-heading))',
      'var(--dialog-heading-leading, var(--leading-snug))',
      'h4.heading',
      'var(--sheet-handle-width, 2.5rem)',
    ],
    lacks: [],
  },
  // The close circle `Dialog`'s close and `SearchField`'s clear control wear (L2-21 / O-33, PF-8):
  // drawn at `--size-close` by a three-class rule that beats `IconButton`'s
  // `.root[data-size='sm']`, and a `::before` grows its pointer target to `--size-touch` without
  // changing the drawn size.
  {
    file: 'styles/closeCircle.module.css',
    rule: /^\.close\[data-variant\]\[data-size\] \{([^}]*)\}/m,
    contains: [
      'position: relative;',
      'min-height: var(--size-close);',
      'min-width: var(--size-close);',
    ],
    lacks: ['--size-touch', '--size-control'],
  },
  {
    file: 'styles/closeCircle.module.css',
    rule: /^\.close\[data-variant\]\[data-size\]::before \{([^}]*)\}/m,
    contains: ["content: '';", 'position: absolute;', 'inset: calc(50% - var(--size-touch) / 2);'],
    lacks: [],
  },
  {
    // The mock centres every close-circle header row, so the row centres its children.
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\.header \{([^}]*)\}/m,
    contains: ['display: flex;', 'align-items: center;'],
    lacks: ['flex-start'],
  },
  {
    // The body pads the focus ring's room and takes it back as a negative margin, so a focused
    // control at its edge is not clipped by `overflow-y: auto` and the layout does not move.
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\.body \{([^}]*)\}/m,
    contains: [
      '--dialog-body-ring-room: calc(var(--focus-ring-width) + var(--focus-ring-offset));',
      '--dialog-body-ring-reach: calc(var(--dialog-body-ring-room) * -1);',
      'margin: var(--dialog-body-ring-reach);',
      'padding: var(--dialog-body-ring-room);',
      'overflow-y: auto;',
    ],
    lacks: [],
  },
  {
    // A body that overflows is a Tab stop; its ring is drawn inward, inside the ring room.
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\.body:focus-visible \{([^}]*)\}/m,
    contains: ['outline-offset: calc(-1 * var(--focus-ring-width));'],
    lacks: [],
  },
  {
    // The sheet pin, one row per rule. The footer's own rule is told apart from the grouped one by
    // what precedes it: the grouped rule's last selector follows a comma.
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\[data-popup='sheet'\] > \.header,\n\[data-popup='sheet'\] > \.description,\n\[data-popup='sheet'\] > \.footer \{([^}]*)\}/m,
    contains: ['flex: none;'],
    lacks: ['margin-top', 'min-height'],
  },
  {
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\[data-popup='sheet'\] > \.body \{([^}]*)\}/m,
    contains: ['flex: 1 1 auto;', 'min-height: 0;'],
    lacks: ['flex: none'],
  },
  {
    file: 'components/Dialog/Dialog.module.css',
    rule: /(?<!,\n)^\[data-popup='sheet'\] > \.footer \{([^}]*)\}/m,
    contains: ['margin-top: auto;'],
    lacks: ['flex: none'],
  },
  {
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\.headerEnd \{([^}]*)\}/m,
    contains: ['margin-inline-start: auto;', 'display: flex;', 'gap: var(--space-2);'],
    lacks: [],
  },
  {
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\.handle \{([^}]*)\}/m,
    contains: [
      'width: var(--sheet-handle-width, 2.5rem);',
      'height: var(--sheet-handle-height, 0.3125rem);',
      'align-self: center;',
      'flex: none;',
      'border-radius: var(--radius-full);',
      'background: var(--color-sheet-handle);',
    ],
    lacks: [],
  },
  {
    // `base.css` tracks `h1` to `h3` only, so an `h4` heading keeps the browser's `normal`; the hook
    // still moves it (the default of the hook on `h4.heading` is `normal`, not the heading tracking).
    file: 'components/Dialog/Dialog.module.css',
    rule: /^h4\.heading \{([^}]*)\}/m,
    contains: ['letter-spacing: var(--dialog-heading-tracking, normal);'],
    lacks: ['--tracking-heading'],
  },
  {
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: [
      'font-size: var(--dialog-heading-size, var(--text-h3));',
      'letter-spacing: var(--dialog-heading-tracking, var(--tracking-heading));',
      'line-height: var(--dialog-heading-leading, var(--leading-snug));',
    ],
    lacks: [],
  },

  // The affix pieces (`field.module.css`, PF-9): a wrapper that wears `.control` plus `.affix`, an
  // input that wears `.affixInput`, a glyph that wears `.affixIcon`. One ring, drawn on the wrapper
  // and never on the input; one placeholder colour, because the input has no `.control` to give it.
  {
    file: 'styles/field.module.css',
    rule: /^\.affix \{([^}]*)\}/m,
    // The pill's non-input area says text, as a press there focuses the input.
    contains: ['gap: var(--space-2);', 'cursor: text;'],
    // The padding and the floor stay `.control`'s: a single-class re-declaration would tie with it.
    lacks: ['padding', 'min-height'],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.affix:has\(> \.affixInput:focus-visible\) \{([^}]*)\}/m,
    contains: [
      'border-color: var(--color-accent);',
      'outline: var(--focus-ring-width) solid var(--color-focus);',
      'outline-offset: var(--focus-ring-offset);',
    ],
    lacks: [],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.affixInput \{([^}]*)\}/m,
    contains: [
      'flex: 1;',
      'align-self: stretch;',
      'min-width: 0;',
      'padding: 0;',
      'border: 0;',
      'background: transparent;',
    ],
    lacks: ['outline'],
  },
  {
    // Two classes' worth of weight over `base.css`'s `:focus-visible` ring, whatever the bundle order,
    // and only where `:has()` draws the pill's ring instead.
    file: 'styles/field.module.css',
    rule: /^@supports selector\(:has\(\*\)\) \{\n {2}\.affixInput:focus-visible \{([^}]*)\}/m,
    contains: ['outline: none;'],
    lacks: [],
  },
  {
    // A disabled input would show the browser's arrow over the wrapper's `not-allowed`; `:disabled`
    // reaches `SearchField`'s plain input too.
    file: 'styles/field.module.css',
    rule: /^\.affixInput:disabled \{([^}]*)\}/m,
    contains: ['cursor: not-allowed;'],
    lacks: [],
  },
  {
    // `TimePicker`'s leading icon opens the picker, so the browser's own button is hidden.
    file: 'styles/field.module.css',
    rule: /^\.affix\[data-icon-opens-picker\] > \.affixInput::-webkit-calendar-picker-indicator \{([^}]*)\}/m,
    contains: ['display: none;'],
    lacks: [],
  },
  {
    // The icon that opens the picker shows a pointer, unless the field is disabled.
    file: 'styles/field.module.css',
    rule: /^\.affix\[data-icon-opens-picker\]:not\(:has\(> \.affixInput\[data-disabled\]\)\) > \.affixIcon \{([^}]*)\}/m,
    contains: ['cursor: pointer;'],
    lacks: [],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.affixInput::placeholder \{([^}]*)\}/m,
    contains: ['color: var(--color-text-subtle);'],
    lacks: [],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.affixIcon \{([^}]*)\}/m,
    contains: ['display: inline-flex;', 'flex: none;', 'color: var(--color-text-muted);'],
    // `Select`'s start icon wears this rule too, so its content alone sets its height.
    lacks: [blockSizing],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.affixIcon > svg \{([^}]*)\}/m,
    contains: ['width: 1rem;', 'height: 1rem;'],
    lacks: [],
  },

  // `TextInput` and `TimePicker` with a leading icon (L2-18): the wrapper is not the input, so the
  // input's `data-invalid` and `data-disabled` are read through `:has`, repeating `.control`'s own
  // declarations. Both rules weigh (0,3,0), the focus ring's weight, and follow it, so an invalid
  // focused field keeps the danger border as a bare `.control` one does.
  {
    file: 'styles/field.module.css',
    contains: [
      '.affix:has(> .affixInput:focus-visible)',
      '.affix:has(> .affixInput[data-invalid])',
      '.affix:has(> .affixInput[data-disabled])',
      'var(--focus-ring-width)',
    ],
    lacks: [],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.affix:has\(> \.affixInput\[data-invalid\]\) \{([^}]*)\}/m,
    contains: [
      'border-color: var(--color-danger-border);',
      'background: var(--color-danger-surface);',
    ],
    lacks: [],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.affix:has\(> \.affixInput\[data-disabled\]\) \{([^}]*)\}/m,
    contains: ['cursor: not-allowed;', 'opacity: 0.55;'],
    lacks: [],
  },
  {
    // `PickerField`'s icon at the start: the trigger packs its parts to the start instead of
    // spreading them across it, and says so through the attribute.
    file: 'components/Field/PickerField.module.css',
    contains: ["[data-icon-placement='start']"],
    lacks: [],
  },
  {
    file: 'components/Field/PickerField.module.css',
    rule: /^\.trigger\[data-icon-placement='start'\] \{([^}]*)\}/m,
    // One gap after a leading icon across `DatePicker`, `TextInput` and `TimePicker`.
    contains: ['justify-content: flex-start;', 'gap: var(--space-2);'],
    lacks: [],
  },

  // `SearchField` (L2-8, PF-8): the pill is one height with or without the clear control. Its
  // padding-block is zero, so the `--size-touch` floor alone sets it (`.control`'s); the clear
  // control is drawn at `--size-close` rather than a 40 px `IconButton` floor, and the 44 px hit
  // area is an absolutely positioned `::before` that adds nothing to the layout.
  {
    file: 'components/SearchField/SearchField.module.css',
    rule: /^\.root \.box \{([^}]*)\}/m,
    contains: [
      'padding-block: 0;',
      'padding-inline: var(--space-4) var(--space-1);',
      // The larger of the touch floor and the clear circle plus the pill's two 1px borders, so a
      // larger root font (the circle is `rem`, the floor `px`) cannot make the circle outgrow it.
      'min-height: max(var(--size-touch), calc(var(--size-close) + 2px));',
    ],
    lacks: ['gap'],
  },
  {
    file: 'components/SearchField/SearchField.module.css',
    rule: /^\.root\[data-size='sm'\] \.box \{([^}]*)\}/m,
    // The same `max()` over the small floor: the md rule above reads `--size-touch`, this one never.
    contains: ['min-height: max(var(--size-control-sm), calc(var(--size-close) + 2px));'],
    lacks: ['padding', '--size-touch'],
  },
  {
    // The small pill's target stops at the pill's inner edge, not the shared circle's 44 px. Four
    // classes' worth of weight, over the shared rule's three.
    file: 'components/SearchField/SearchField.module.css',
    rule: /^\.root\[data-size='sm'\] \.clear\[data-size\]::before \{([^}]*)\}/m,
    contains: ['inset-block: -1px;'],
    lacks: [],
  },
  {
    file: 'components/SearchField/SearchField.module.css',
    rule: /^\.input \{([^}]*)\}/m,
    contains: ['appearance: none;', ...bodyRole],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/SearchField/SearchField.module.css',
    rule: /^\.input::-webkit-search-cancel-button \{([^}]*)\}/m,
    contains: ['appearance: none;'],
    lacks: [],
  },
  {
    // No bare `.box` rule: every declaration the box adds sits under `.root`, out-ranking `.control`.
    file: 'components/SearchField/SearchField.module.css',
    contains: [],
    lacks: [/^\.box\b/m],
  },
  // The clear control's hover is one surface step off the input's, so it shows where a theme gives
  // the input `--color-surface-2`; the small pill's keyboard ring is drawn inward.
  {
    file: 'components/SearchField/SearchField.module.css',
    rule: /^@media \(hover: hover\) \{\n {2}\.root \.clear\[data-size\]:hover:not\(\[data-disabled\]\) \{([^}]*)\}/m,
    contains: ['background: var(--color-surface-3);'],
    lacks: ['--color-surface-2'],
  },
  {
    file: 'components/SearchField/SearchField.module.css',
    rule: /^\.root\[data-size='sm'\] \.clear:focus-visible \{([^}]*)\}/m,
    contains: ['outline-offset: calc(-1 * var(--focus-ring-width));'],
    lacks: [],
  },

  // `Avatar` sizes from its two consumer hooks over the five presets, and wears the theme's six
  // fill and ink pairs through `data-color`. The hooks are read, never declared, so only this row
  // and the dist scan's allow-list stand between a misspelt one and a silent fallback.
  {
    file: 'components/Avatar/Avatar.module.css',
    contains: [
      'inline-size: var(--avatar-size, var(--avatar-preset));',
      'block-size: var(--avatar-size, var(--avatar-preset));',
      'font-size: var(--avatar-font-size, var(--avatar-preset-font));',
      '--avatar-preset: 1.5rem;',
      '--avatar-preset: 1.75rem;',
      '--avatar-preset: 2.5rem;',
      '--avatar-preset: 4rem;',
      '--avatar-preset: 6rem;',
      ...[1, 2, 3, 4, 5, 6].flatMap((index) => [
        `.root[data-color='${index}']`,
        `background: var(--color-avatar-fill-${index});`,
        `color: var(--color-avatar-ink-${index});`,
      ]),
    ],
    lacks: [],
  },

  // `Collapsible`'s heading is a display reader (the four declarations and nothing else of the
  // role: its tracking and leading stay its own) at one consumer hook, which is read here and
  // never declared, so only this row and the dist scan's allow-list stand between a misspelt hook
  // and a silent fallback. The chevron turns on the motion tokens.
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: [
      ...displayRole,
      'font-size: var(--collapsible-heading-size, var(--text-md));',
      'letter-spacing: var(--tracking-heading);',
      'line-height: var(--leading-snug);',
      'color: var(--color-text);',
    ],
    lacks: [anyWeightLiteral, '--tracking-display', '--leading-display'],
  },
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.trigger \{([^}]*)\}/m,
    contains: [
      'position: relative;',
      'display: flex;',
      'align-items: center;',
      'gap: var(--space-2);',
      'width: 100%;',
      // Two consumer hooks, read here and never declared, so a misspelt one falls back silently
      // past everything but this row and the dist scan's allow-list. Both default to no padding.
      'padding-block: var(--collapsible-trigger-padding-block, 0);',
      'padding-inline: var(--collapsible-trigger-padding-inline, 0);',
      'background: transparent;',
    ],
    lacks: ['padding: 0;'],
  },
  // The pointer target is at least 24 px tall (WCAG 2.5.8) without a taller row: the pseudo-element
  // adds only what the row lacks, and by default the row has no padding.
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.trigger::before \{([^}]*)\}/m,
    contains: [
      "content: '';",
      'position: absolute;',
      'inset-inline: 0;',
      'inset-block: min(0px, calc((100% - 1.5rem) / 2));',
    ],
    lacks: ['--size-touch'],
  },
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.trigger\[data-disabled\] \{([^}]*)\}/m,
    contains: ['cursor: not-allowed;'],
    // The button itself is not dimmed, so a ring round it keeps its strength; what it shows is.
    lacks: ['opacity'],
  },
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.trigger\[data-disabled\] > \* \{([^}]*)\}/m,
    contains: ['opacity: 0.45;'],
    lacks: [],
  },
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.chevron \{([^}]*)\}/m,
    contains: [
      'width: 1rem;',
      'height: 1rem;',
      'margin-inline-start: auto;',
      'color: var(--color-text-muted);',
      'transition-duration: var(--motion-duration-1);',
      'transition-timing-function: var(--motion-ease);',
    ],
    lacks: [],
  },
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.trigger\[data-panel-open\] \.chevron \{([^}]*)\}/m,
    contains: ['transform: rotate(180deg);'],
    lacks: [],
  },
  // `chevron="end-down"`: closed, the down glyph turns a quarter to the reading end (right, or left
  // in a right-to-left page); open, it is the glyph as drawn. Each rule outranks the one before it,
  // so the open rule wins in both directions and the default rule above, at (0,3,0), loses to it.
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.chevron\[data-chevron='end-down'\] \{([^}]*)\}/m,
    contains: ['transform: rotate(-90deg);'],
    lacks: [],
  },
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.chevron\[data-chevron='end-down'\]\[data-direction='rtl'\] \{([^}]*)\}/m,
    contains: ['transform: rotate(90deg);'],
    lacks: [],
  },
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.trigger\[data-panel-open\] \.chevron\[data-chevron='end-down'\] \{([^}]*)\}/m,
    contains: ['transform: none;'],
    lacks: [],
  },
  // The gap between the heading and what it opens. The visual check reads 12 px against the mock.
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.panel \{([^}]*)\}/m,
    contains: ['padding-block-start: var(--space-3);'],
    lacks: [],
  },

  // `Tree` writes its direction under this mark, and this rule is what holds the closed chevrons'
  // turns still for that write, so a closed branch mounting in a right-to-left page does not spin
  // to its angle. A jsdom test sees the mark come and go, not what the rule does with it.
  {
    file: 'components/Tree/Tree.module.css',
    rule: /^\.root\[data-direction-changing\] \.toggle > svg \{([^}]*)\}/m,
    contains: ['transition: none;'],
    lacks: [],
  },

  // `NavMenu`'s sidebar form. `flex: 1 1 auto` is what makes the list span the sidebar: `.root` is
  // a row flex container, so without it the list shrinks to its widest label. The link rule makes
  // each link as wide as the list, and the nav's own rule keeps the list at the top of a grown nav.
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.root\[data-orientation='vertical'\] \{([^}]*)\}/m,
    contains: ['align-items: stretch;'],
    lacks: [],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.list\[data-orientation='vertical'\] \{([^}]*)\}/m,
    contains: [
      'flex: 1 1 auto;',
      'flex-direction: column;',
      'align-items: stretch;',
      'gap: var(--space-2);',
    ],
    lacks: [],
  },
  {
    file: 'components/NavMenu/NavMenu.module.css',
    rule: /^\.list\[data-orientation='vertical'\] \.link \{([^}]*)\}/m,
    contains: ['display: flex;'],
    lacks: [],
  },

  // `SkipLink` reads the inverse pair, which no brand's accent exemption reaches, not the accent.
  {
    file: 'components/SkipLink/SkipLink.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: ['background: var(--color-inverse);', 'color: var(--color-inverse-text);'],
    lacks: ['--color-accent'],
  },

  // `TabBar`'s measure. The pill is 44 + 2 x 2.5 = 49 px through its block padding alone (the mock
  // draws 49; the items keep the 44 px target), and the current link's fill is its `::before`, 33 px
  // high, so a 44 px link carries a smaller fill. A jsdom test sees none of this, so each declaration
  // that produces a number is pinned here and the browser check measures the result.
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: [
      'position: fixed;',
      'inset-inline: var(--space-4);',
      'inset-block-end: calc(var(--space-5) + env(safe-area-inset-bottom, 0px));',
      'display: flex;',
      'gap: var(--space-3);',
      'align-items: center;',
      'z-index: 40;',
    ],
    lacks: [],
  },
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^\.nav \{([^}]*)\}/m,
    contains: ['display: flex;', 'flex: 1;', 'min-width: 0;'],
    lacks: [],
  },
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^\.pill \{([^}]*)\}/m,
    contains: [
      '--tab-bar-pill-padding-block: calc(var(--space-1) * 0.625);',
      'padding-block: var(--tab-bar-pill-padding-block);',
      'padding-inline: var(--space-1);',
      'border-radius: var(--radius-full);',
      'background: var(--color-tab-bar);',
      'box-shadow: var(--shadow-tab-bar);',
      'justify-content: space-around;',
      'flex: 1;',
      'min-width: 0;',
    ],
    lacks: [],
  },
  // A short bar (five items and the action at 360 px) shrinks the current label rather than
  // overflowing: the pill and the label may go below their content, the item keeps the 44 px floor.
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^\.item \{([^}]*)\}/m,
    contains: ['min-width: var(--size-touch);'],
    lacks: [],
  },
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^\.link \{([^}]*)\}/m,
    contains: [
      '--tab-bar-current-inset: calc((var(--size-touch) - 1.0625rem) / 2 - var(--space-2));',
      'position: relative;',
      'isolation: isolate;',
      'min-height: var(--size-touch);',
      'min-width: var(--size-touch);',
      'border-radius: var(--radius-full);',
      'color: var(--color-tab-bar-text);',
    ],
    lacks: [],
  },
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^\.link\[aria-current='page'\] \{([^}]*)\}/m,
    contains: [
      'gap: var(--space-2);',
      'padding-inline: var(--space-3);',
      'color: var(--color-tab-bar-active-text);',
    ],
    lacks: [],
  },
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^\.link\[aria-current='page'\]::before \{([^}]*)\}/m,
    contains: [
      "content: '';",
      'position: absolute;',
      'inset-inline: 0;',
      'inset-block: var(--tab-bar-current-inset);',
      'z-index: -1;',
      'border-radius: var(--radius-full);',
      'background: var(--color-tab-bar-active);',
      'box-shadow: var(--shadow-soft);',
    ],
    lacks: [],
  },
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^\.icon > svg \{([^}]*)\}/m,
    contains: ['width: 1.3125rem;', 'height: 1.3125rem;'],
    lacks: [],
  },
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^\.link\[aria-current='page'\] \.icon > svg \{([^}]*)\}/m,
    contains: ['width: 1.0625rem;', 'height: 1.0625rem;'],
    lacks: [],
  },
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^\.label \{([^}]*)\}/m,
    contains: [
      sansFamily,
      'font-size: var(--text-sm);',
      'font-weight: var(--font-weight-button);',
      'min-width: 0;',
      'overflow: hidden;',
      'text-overflow: ellipsis;',
      'white-space: nowrap;',
    ],
    lacks: [anyWeightLiteral],
  },
  // Forced colours: the pill keeps an edge and the current link's fill a `Highlight` outline.
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.pill \{([^}]*)\}/m,
    contains: ['border: 1px solid transparent;'],
    lacks: [],
  },
  {
    file: 'components/TabBar/TabBar.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.link\[aria-current='page'\]::before \{([^}]*)\}/m,
    contains: ['outline: 1px solid Highlight;'],
    lacks: [],
  },

  // `EmptyState`'s card. The tone and the alignment are data attributes the component always
  // writes, so each rule is pinned on its own: a misspelt attribute selector would fall silent.
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: [
      'position: relative;',
      'display: flex;',
      'flex-direction: column;',
      'gap: var(--space-3);',
      'padding: var(--space-5);',
      'border-radius: var(--radius-card);',
      'background: var(--color-surface-raised);',
      'box-shadow: var(--shadow-soft);',
      'color: var(--color-text);',
    ],
    lacks: [],
  },
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.root\[data-align='center'\] \{([^}]*)\}/m,
    contains: ['align-items: center;', 'text-align: center;'],
    lacks: [],
  },
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.root\[data-align='start'\] \{([^}]*)\}/m,
    contains: ['align-items: flex-start;', 'text-align: start;'],
    lacks: [],
  },
  // `bare` drops the card's shadow and, under the neutral tone, its surface, for a container that
  // already frames it. The selected tone keeps its fill, which its text colour needs.
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.root\[data-bare\] \{([^}]*)\}/m,
    contains: ['box-shadow: none;'],
    lacks: ['background'],
  },
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.root\[data-bare\]\[data-tone='neutral'\] \{([^}]*)\}/m,
    contains: ['background: none;'],
    lacks: [],
  },
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.root\[data-tone='selected'\] \{([^}]*)\}/m,
    contains: ['background: var(--color-selected);', 'color: var(--color-selected-text);'],
    lacks: [],
  },
  // The picture's slot places nothing itself: a `position` here would make an absolutely
  // positioned picture spill from the slot's box instead of the card's.
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.illustration \{([^}]*)\}/m,
    contains: ['display: flex;'],
    lacks: ['position'],
  },
  // The headline is the display role at one consumer hook (read, never declared) and the one
  // library reader of `--leading-display`; it reads no `--tracking-display`, and its tracking is
  // the house heading's at every level.
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.heading \{([^}]*)\}/m,
    contains: [
      ...displayRole,
      'margin: 0;',
      'font-size: var(--empty-state-heading-size, var(--text-h3));',
      'letter-spacing: var(--tracking-heading);',
      'line-height: var(--leading-display);',
    ],
    lacks: [anyWeightLiteral, '--tracking-display', '--leading-snug'],
  },
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.body \{([^}]*)\}/m,
    contains: [
      ...bodyRole,
      'max-width: 28ch;',
      'font-size: var(--text-md);',
      'line-height: var(--leading-prose);',
    ],
    lacks: [anyWeightLiteral, 'color:'],
  },
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.root\[data-tone='neutral'\] \.body \{([^}]*)\}/m,
    contains: ['color: var(--color-text-muted);'],
    lacks: [],
  },
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.actions \{([^}]*)\}/m,
    contains: [
      'display: flex;',
      'flex-wrap: wrap;',
      'gap: var(--space-2);',
      'margin-top: var(--space-2);',
    ],
    lacks: ['justify-content'],
  },
  // Only under `center`: the row shrink-wraps its buttons, so a wrapped line would otherwise
  // start-align inside it. `start` keeps the default `flex-start`, which no rule restates.
  {
    file: 'components/EmptyState/EmptyState.module.css',
    rule: /^\.root\[data-align='center'\] \.actions \{([^}]*)\}/m,
    contains: ['justify-content: center;'],
    lacks: [],
  },

  // `AvatarGroup`'s overlap and its ring. The overlap is a local property, because a `calc` of a
  // token is not a value the token lint accepts as a `margin` declaration, and the avatars after
  // the first read it. The ring is the ground colour, so where two avatars overlap a band of the
  // page cuts the later one from the earlier one.
  {
    file: 'components/AvatarGroup/AvatarGroup.module.css',
    rule: /^\.list \{([^}]*)\}/m,
    contains: [
      '--avatar-group-overlap: calc(-1 * var(--space-2));',
      'display: flex;',
      'list-style: none;',
    ],
    lacks: [],
  },
  {
    file: 'components/AvatarGroup/AvatarGroup.module.css',
    rule: /^\.item \{([^}]*)\}/m,
    contains: ['display: flex;', 'flex: none;'],
    lacks: [],
  },
  {
    file: 'components/AvatarGroup/AvatarGroup.module.css',
    rule: /^\.item \+ \.item \{([^}]*)\}/m,
    contains: ['margin-inline-start: var(--avatar-group-overlap);'],
    lacks: [],
  },
  {
    file: 'components/AvatarGroup/AvatarGroup.module.css',
    rule: /^\.ring \{([^}]*)\}/m,
    contains: [`box-shadow: ${avatarGroupRing};`],
    lacks: [],
  },
  // The chip: a pill as tall as the avatars beside it, with its count at their initials size. Its
  // box and text read the avatars' own two consumer hooks (`--avatar-size`, `--avatar-font-size`:
  // read here, never declared) and fall back to the group's `--avatar-group-size` and
  // `--avatar-group-font-size`, which the size test at the end of the file keeps equal to
  // `Avatar`'s presets. A chip with no hook read would stay at the preset when a wrapper resizes
  // the avatars. The fill is the raised neutral with the muted ink, ringed as the avatars are and
  // over the chip shadow. The two shadows are one local property, because a two-shadow value is
  // not one the token lint accepts as a `box-shadow` declaration.
  {
    file: 'components/AvatarGroup/AvatarGroup.module.css',
    rule: /^\.overflow \{([^}]*)\}/m,
    contains: [
      `${avatarGroupRing}, var(--shadow-chip);`,
      'box-shadow: var(--avatar-group-chip-shadow);',
      'min-width: var(--avatar-size, var(--avatar-group-size));',
      'height: var(--avatar-size, var(--avatar-group-size));',
      'padding-inline: var(--space-1);',
      'border-radius: var(--radius-full);',
      'background: var(--color-surface-3);',
      'color: var(--color-text-muted);',
      sansFamily,
      'font-size: var(--avatar-font-size, var(--avatar-group-font-size));',
      'font-weight: var(--font-weight-heading);',
    ],
    lacks: [anyWeightLiteral, 'font-size: var(--text-'],
  },

  // `ChoiceCard`: a radio group drawn as cards. The grid's column count is a local property set per
  // `data-columns`; the card's outline and the ring's hollow circle are inset shadows held in local
  // properties too, because an `inset` value is not one the token lint accepts as a `box-shadow`
  // declaration. The checked card swaps the outline for the selected colour at the emphasis width.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.grid \{([^}]*)\}/m,
    contains: [
      'display: grid;',
      'grid-template-columns: repeat(var(--choice-card-columns), minmax(0, 1fr));',
      'gap: var(--space-2);',
    ],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.grid\[data-columns='1'\] \{([^}]*)\}/m,
    contains: ['--choice-card-columns: 1;'],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.grid\[data-columns='2'\] \{([^}]*)\}/m,
    contains: ['--choice-card-columns: 2;'],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.card \{([^}]*)\}/m,
    contains: [
      '--choice-card-ring: inset 0 0 0 1px var(--color-border-strong);',
      '--choice-card-dot: inset 0 0 0 var(--border-width-emphasis) var(--color-border-strong);',
      // The ring's size is named once; the clearance reads it, so the two cannot drift apart.
      '--choice-card-ring-size: 1.125rem;',
      '--choice-card-ring-clearance: calc(var(--choice-card-ring-size) + var(--space-2));',
      // The card is a column that starts every part at the start edge, so the disc keeps its own
      // width instead of stretching, and a long word breaks inside the card instead of widening it.
      'position: relative;',
      'display: flex;',
      'flex-direction: column;',
      'align-items: flex-start;',
      // The card fills its grid cell, so the cards of a row are one height.
      'flex-grow: 1;',
      'padding: var(--space-3);',
      'border-radius: var(--radius-panel);',
      'background: var(--color-surface-raised);',
      'box-shadow: var(--choice-card-ring);',
      'overflow-wrap: anywhere;',
    ],
    // No border at the top level, not even a transparent one: an inset shadow is drawn inside the
    // padding box, so a border holds the empty ring in a smaller circle than the filled one, leaves
    // a halo outside the chosen card's ring and pushes the content in. The forced-colours block
    // below declares the border, which is then the only edge left.
    lacks: [noBorderShorthand],
  },
  // The wrapper Base UI renders for each option is the grid's item. A column the card grows to fill.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.item \{([^}]*)\}/m,
    contains: ['display: flex;', 'flex-direction: column;'],
    lacks: [],
  },
  // The keyboard focus rings the whole card, with the base focus ring's own width, colour and
  // offset. Where `:has()` is understood the ring's own outline is dropped, and only there: an
  // unconditional `.ring:focus-visible { outline: none }` would leave a browser without `:has()`
  // with no focus indicator, so the whole-file row below refuses one at the top level.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.card:has\(\.ring:focus-visible\) \{([^}]*)\}/m,
    contains: [
      'outline: var(--focus-ring-width) solid var(--color-focus);',
      'outline-offset: var(--focus-ring-offset);',
    ],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^@supports selector\(:has\(\*\)\) \{\s*\.ring:focus-visible \{([^}]*)\}/m,
    contains: ['outline: none;'],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    contains: [],
    lacks: [/^\.ring:focus-visible/m, /^\.ring:focus-visible,/m],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.card\[data-checked\] \{([^}]*)\}/m,
    contains: [
      '--choice-card-ring: inset 0 0 0 var(--border-width-emphasis) var(--color-selected);',
      'background: var(--color-selected-soft);',
    ],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.card\[data-disabled\] \{([^}]*)\}/m,
    contains: ['opacity: 0.45;'],
    lacks: [],
  },
  // The icon disc: a circle on the second neutral surface with the muted ink, and on a chosen card
  // the raised surface with the selected-soft ink.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.disc \{([^}]*)\}/m,
    contains: [
      'width: 1.875rem;',
      'height: 1.875rem;',
      'border-radius: var(--radius-full);',
      'background: var(--color-surface-2);',
      'color: var(--color-text-muted);',
    ],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.card\[data-checked\] \.disc \{([^}]*)\}/m,
    contains: [
      'background: var(--color-surface-raised);',
      'color: var(--color-selected-soft-text);',
    ],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.disc > svg \{([^}]*)\}/m,
    contains: ['width: 0.9375rem;', 'height: 0.9375rem;'],
    lacks: [],
  },
  // The title is the sans heading weight and the line under it the body role, as the contract's
  // type roles name them; the gap under the disc exists only where a disc does.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.title \{([^}]*)\}/m,
    contains: [
      sansFamily,
      'font-weight: var(--font-weight-heading);',
      'font-size: var(--text-md);',
      'line-height: var(--leading-snug);',
    ],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.disc \+ \.title \{([^}]*)\}/m,
    contains: ['margin-top: var(--space-2);'],
    lacks: [],
  },
  // A card with no icon starts with its title, on the row the ring sits in, so that title keeps
  // clear of the ring by the clearance the card computes.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.title:first-child \{([^}]*)\}/m,
    contains: ['padding-inline-end: var(--choice-card-ring-clearance);'],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.description \{([^}]*)\}/m,
    contains: [
      'margin-top: var(--space-1);',
      ...bodyRole,
      'font-size: var(--text-sm);',
      'line-height: var(--leading-snug);',
      'color: var(--color-text-muted);',
    ],
    lacks: [anyWeightLiteral],
  },
  // The ring: the radio itself, 18 px in the card's corner, hollow until chosen and then filled
  // with the selected colour around an 11 px check in the selected text colour.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.ring \{([^}]*)\}/m,
    contains: [
      'inset-block-start: var(--space-3);',
      'inset-inline-end: var(--space-3);',
      'width: var(--choice-card-ring-size);',
      'height: var(--choice-card-ring-size);',
      'border-radius: var(--radius-full);',
      'box-shadow: var(--choice-card-dot);',
    ],
    // No border here either: with one the empty ring would draw at 16 px and grow to 18 when chosen.
    lacks: [noBorderShorthand],
  },
  // An errored group's rings take the danger border, as `RadioGroup`'s dots do.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.ring\[data-invalid\] \{([^}]*)\}/m,
    contains: [
      '--choice-card-dot: inset 0 0 0 var(--border-width-emphasis) var(--color-danger-border);',
    ],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.ring\[data-checked\] \{([^}]*)\}/m,
    contains: [
      '--choice-card-dot: none;',
      'background: var(--color-selected);',
      'color: var(--color-selected-text);',
    ],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^\.mark > svg \{([^}]*)\}/m,
    contains: ['width: 0.6875rem;', 'height: 0.6875rem;'],
    lacks: [],
  },
  // Forced colours remove the shadows and the fills, so each box gets the 1 px border that is then
  // its only edge, and the chosen card and its ring are told apart by system colours on it.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.card,\n {2}\.ring \{([^}]*)\}/m,
    contains: ['border: 1px solid transparent;'],
    lacks: [],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.card\[data-checked\] \{([^}]*)\}/m,
    contains: ['border-color: Highlight;'],
    lacks: [],
  },
  {
    // A disabled card reads the system's disabled colour, after the chosen card's rule. `GrayText`
    // is the cue, so the card is not dimmed as well.
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.card\[data-checked\] \{[^}]*\}\n\n {2}\.card\[data-disabled\] \{([^}]*)\}/m,
    contains: ['opacity: 1;', 'border-color: GrayText;', ' color: GrayText;'],
    lacks: ['opacity: 0.45'],
  },
  // A disabled card's disc and description, and what the caller put in them, kept the system text
  // colour the browser gives a coloured element; they take the card's `GrayText`. The ring is not in
  // the selector, so a chosen one keeps its `Highlight` fill.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.card\[data-disabled\] :is\(\.disc, \.description, \.disc \*, \.description \*\) \{([^}]*)\}/m,
    contains: [
      '--choice-card-content-edge: currentcolor;',
      'border-color: var(--choice-card-content-edge) !important;',
      'background-color: transparent !important;',
      ' color: inherit !important;',
    ],
    lacks: consumerContentKeepsStyles,
  },
  importantOnlyInForcedBlock('components/ChoiceCard/ChoiceCard.module.css'),
  // Nothing follows the block: a normal-mode rule appended after it would win the cascade back, and
  // the `!important` guard above reads only what precedes it. Every rule inside the block is
  // indented, so the first `}` at the start of a line closes it.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^\}\n([\s\S]*)/m,
    contains: [],
    lacks: [/\{/],
  },
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.ring\[data-checked\] \{([^}]*)\}/m,
    contains: [
      'forced-color-adjust: none;',
      'border-color: Highlight;',
      'background: Highlight;',
      'color: HighlightText;',
    ],
    lacks: [],
  },

  // `ToggleChip` and `ToggleChipGroup`, one stylesheet. An unpressed chip is the quiet surface fill
  // and a pressed one the selected pair, whose ring an app sets through `--toggle-chip-pressed-ring`
  // (default `none`, so the look without the hook is the fill alone). The chip's label is the sans
  // face at the label weight, in a token size.
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.chip \{([^}]*)\}/m,
    contains: [
      'display: inline-flex;',
      'gap: var(--space-1);',
      'padding: var(--space-2) var(--space-3);',
      'border: 0;',
      'border-radius: var(--radius-full);',
      'background: var(--color-surface-2);',
      'color: var(--color-text);',
      sansFamily,
      'font-weight: var(--font-weight-label);',
      'font-size: var(--text-sm);',
      'line-height: var(--leading-tight);',
    ],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.chip\[data-with-icon\] \{([^}]*)\}/m,
    contains: ['padding-inline-start: var(--space-1);'],
    lacks: [],
  },
  // `size="sm"` is the WBW mock's chip (4e, 4f, 10g): 28 px tall with no icon and 36 px with the
  // 26 px disc, in the 12 px type, against md's 32 and 42 px at 14 px. The heights are floors, not
  // padding sums, so the line's leading cannot move them and a wrapped label still grows the chip.
  // Both are past WCAG 2.5.8's 24 px.
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.chip\[data-size='sm'\] \{([^}]*)\}/m,
    contains: [
      ' min-height: 1.75rem;',
      ' padding-block: var(--space-1);',
      ' font-size: var(--text-xs);',
    ],
    // The inline padding and the icon chip's start inset stay md's: a `padding` shorthand here,
    // at the icon rule's (0,2,0) and after it, would silently drop the inset.
    lacks: [' padding:', ' padding-inline', ' height:'],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.chip\[data-size='sm'\]\[data-with-icon\] \{([^}]*)\}/m,
    contains: [' min-height: 2.25rem;'],
    lacks: [],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^ {2}\.chip:hover:not\(\[data-disabled\], \[data-pressed\]\) \{([^}]*)\}/m,
    contains: ['background: var(--color-surface-3);'],
    lacks: [],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.chip\[data-pressed\] \{([^}]*)\}/m,
    contains: [
      'background: var(--color-selected);',
      'color: var(--color-selected-text);',
      'box-shadow: var(--toggle-chip-pressed-ring, none);',
    ],
    lacks: [],
  },
  // An errored group's unpressed chips draw the danger ring `ChoiceCard`'s rings draw.
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.group\[data-invalid\] \.chip:not\(\[data-pressed\]\) \{([^}]*)\}/m,
    contains: [
      '--toggle-chip-invalid-ring: inset 0 0 0 var(--border-width-emphasis) var(--color-danger-border);',
      'box-shadow: var(--toggle-chip-invalid-ring);',
    ],
    lacks: [],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^ {2}\.chip\[data-pressed\] \{([^}]*)\}/m,
    contains: ['forced-color-adjust: none;', 'outline-color: CanvasText;'],
    lacks: [],
  },
  // An unpressed chip has no fill in forced colours and no border by default, so it would have no
  // edge. The border is declared in the forced-colours block only; the top-level rule keeps none.
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.chip \{([^}]*)\}/m,
    contains: ['border: 1px solid transparent;'],
    lacks: [],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.chip\[data-disabled\] \{([^}]*)\}/m,
    contains: ['opacity: 0.45;'],
    lacks: [],
  },
  // A disabled chip is `GrayText` and not dimmed as well: the 45% dim on top of it left the label
  // and the edge at 3.0 and 3.3:1. A pressed one is a `GrayText` fill with a `Canvas` ink, not a
  // dimmed `Highlight` (2.4:1): it reads disabled and its fill still says pressed. Both follow the
  // top-level disabled rule, as the first ties it at (0,2,0) and wins by coming later.
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.chip\[data-disabled\] \{[^}]*\}[\s\S]*?^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.chip\[data-disabled\] \{([^}]*)\}/m,
    contains: ['opacity: 1;', 'border-color: GrayText;', ' color: GrayText;'],
    lacks: [],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.chip\[data-disabled\] \{[^}]*\}[\s\S]*?^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.chip\[data-pressed\]\[data-disabled\] \{([^}]*)\}/m,
    contains: ['background: GrayText;', ' color: Canvas;'],
    lacks: ['Highlight'],
  },
  // A pressed chip's icon sits inside the opt-out, so its own token colours were painted as they
  // are (a tinted icon at 1.4:1 on the fill). It takes the chip's ink, as in `Button`.
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.chip\[data-pressed\] \.icon \* \{([^}]*)\}/m,
    contains: [
      '--toggle-chip-content-edge: currentcolor;',
      'border-color: var(--toggle-chip-content-edge) !important;',
      'background-color: transparent !important;',
      ' color: inherit !important;',
    ],
    lacks: consumerContentKeepsStyles,
  },
  importantOnlyInForcedBlock('components/ToggleChip/ToggleChip.module.css'),
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.icon > \* \{([^}]*)\}/m,
    contains: ['width: 1.625rem;', 'height: 1.625rem;', 'border-radius: var(--radius-full);'],
    lacks: [],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.check > svg \{([^}]*)\}/m,
    contains: ['width: 0.75rem;', 'height: 0.75rem;'],
    lacks: [],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.group \{([^}]*)\}/m,
    contains: ['min-width: 0;', 'margin: 0;', 'padding: 0;', 'border: 0;'],
    lacks: [],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.row \{([^}]*)\}/m,
    contains: ['display: flex;', 'flex-wrap: wrap;', 'gap: var(--space-2);'],
    lacks: [],
  },
  // The forced-colours block comes after the last normal-mode rule (`.row`), as in `Button` and
  // `IconButton`: its rules tie with the top-level ones they override, or beat them by a little.
  // This row pins the position only; the next one pins that nothing follows the block, as a
  // normal-mode rule appended after it would win the cascade back (and the `!important` guard above
  // reads only what precedes the block). Every rule inside the block is indented, so the first `}`
  // at the start of a line closes it.
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.row \{[^}]*\}\n\n(?:\/\*[\s\S]*?\*\/\n)?@media \(forced-colors: active\) \{([\s\S]*?)^\}\n/m,
    contains: ['.chip[data-pressed] {'],
    lacks: [],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^\}\n([\s\S]*)/m,
    contains: [],
    lacks: [/\{/],
  },

  // Forced colours on `Segmented`: the chosen option is a `Highlight` fill with `HighlightText`
  // ink, drawn outside the recolouring. A disabled option is `GrayText` and not dimmed as well (the
  // dim took the label to 3.0 and 3.3:1), and a chosen one that is disabled is a `GrayText` fill
  // with a `Canvas` ink, not a dimmed `Highlight` (2.4:1). Both follow the top-level disabled rule,
  // as the first ties it at (0,2,0) and wins by coming later.
  //
  // An option has no border, so the `Highlight` edge the browser paints on a hovered button had
  // nothing to draw on and an option had no hover cue. In forced colours only, each option takes a
  // 1 px `Canvas` border, unseen on the track, and hover turns it `Highlight`; the chosen and the
  // disabled chosen fills carry it in their own colour, so they stay flush. The top-level option
  // keeps no border.
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^@media \(forced-colors: active\) \{\n {2}\.option \{([^}]*)\}/m,
    contains: ['border: 1px solid Canvas;'],
    lacks: [],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option \{([^}]*)\}/m,
    contains: ['border: 0;'],
    lacks: ['Canvas', 'Highlight'],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}@media \(hover: hover\) \{\n {4}\.option:hover:not\(\[data-disabled\], \[data-pressed\]\) \{([^}]*)\}/m,
    contains: ['border-color: Highlight;'],
    lacks: [],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.option\[data-pressed\] \{([^}]*)\}/m,
    contains: [
      'forced-color-adjust: none;',
      'border-color: Highlight;',
      'background: Highlight;',
      ' color: HighlightText;',
      'outline-color: CanvasText;',
    ],
    lacks: [],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option\[data-disabled\] \{[^}]*\}[\s\S]*?^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.option\[data-disabled\] \{([^}]*)\}/m,
    contains: ['opacity: 1;', ' color: GrayText;'],
    lacks: [],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option\[data-disabled\] \{[^}]*\}[\s\S]*?^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.option\[data-pressed\]\[data-disabled\] \{([^}]*)\}/m,
    contains: ['border-color: GrayText;', 'background: GrayText;', ' color: Canvas;'],
    lacks: ['Highlight'],
  },
  // A badge or an icon inside the chosen option sits inside the opt-out: a `Tag` kept the token
  // pill the default look re-points, and a tinted icon fell to 1.4:1. They take the option's ink.
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.option\[data-pressed\] :is\(\.icon, \.badge\) \* \{([^}]*)\}/m,
    contains: [
      '--segmented-content-edge: currentcolor;',
      'border-color: var(--segmented-content-edge) !important;',
      'background-color: transparent !important;',
      ' color: inherit !important;',
    ],
    lacks: consumerContentKeepsStyles,
  },
  importantOnlyInForcedBlock('components/Segmented/Segmented.module.css'),
  // The block comes after the chosen option's badge rule (the last normal-mode rule), and nothing
  // follows it, for the reasons given for `ToggleChip` above.
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^\.option\[data-pressed\] \.badge \{[^}]*\}\n\n(?:\/\*[\s\S]*?\*\/\n)?@media \(forced-colors: active\) \{([\s\S]*?)^\}\n/m,
    contains: ['.option[data-pressed] {'],
    lacks: [],
  },
  {
    file: 'components/Segmented/Segmented.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^\}\n([\s\S]*)/m,
    contains: [],
    lacks: [/\{/],
  },

  // `ProgressBar`: a label row, a track and a helper line. The fill's colour is a local property,
  // so each tone and status names a colour once: the accent by default, the selected colour for the
  // `selected` tone, and the success and danger colours for the statuses, which win over a tone.
  // The label is the sans face at the label weight and the value at the button weight, both in a
  // token size; every weight in the file is a token.
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    contains: [],
    lacks: [anyWeightLiteral],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: [
      '--progress-bar-fill: var(--color-accent);',
      'position: relative;',
      'display: flex;',
      'flex-direction: column;',
      'gap: var(--space-2);',
    ],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.root\[data-tone='selected'\] \{([^}]*)\}/m,
    contains: ['--progress-bar-fill: var(--color-selected);'],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.root\[data-status='finished'\] \{([^}]*)\}/m,
    contains: ['--progress-bar-fill: var(--color-success);'],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.root\[data-status='error'\] \{([^}]*)\}/m,
    contains: ['--progress-bar-fill: var(--color-danger);'],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.row \{([^}]*)\}/m,
    contains: ['display: flex;', 'justify-content: space-between;', 'gap: var(--space-2);'],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.label,\n\.value \{([^}]*)\}/m,
    contains: [
      'color: var(--color-text);',
      sansFamily,
      'font-size: var(--text-sm);',
      'line-height: var(--leading-snug);',
    ],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.label \{([^}]*)\}/m,
    contains: ['font-weight: var(--font-weight-label);'],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    // After a blank line: `.value {` also begins the line of the shared `.label,\n.value {` rule.
    rule: /\n\n\.value \{([^}]*)\}/,
    contains: ['font-weight: var(--font-weight-button);'],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.track \{([^}]*)\}/m,
    contains: [
      'position: relative;',
      // The consumer hook, read and never declared, over the default height.
      'height: var(--progress-bar-track-size, 0.5rem);',
      'border-radius: var(--radius-full);',
      'background: var(--color-surface-3);',
      'overflow: hidden;',
    ],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.root\[data-size='sm'\] \.track \{([^}]*)\}/m,
    contains: ['height: var(--progress-bar-track-size, 0.25rem);'],
    lacks: [],
  },
  // The fill: the local colour, and a width transition on the motion tokens (Base UI writes the
  // width itself, inline).
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.indicator \{([^}]*)\}/m,
    contains: [
      'border-radius: var(--radius-full);',
      'background: var(--progress-bar-fill);',
      'transition-property: width;',
      'transition-duration: var(--motion-duration-2);',
      'transition-timing-function: var(--motion-ease);',
    ],
    lacks: [],
  },
  // Indeterminate: a 40% segment that rests centred and slides on `translate`, symmetrically about
  // its rest (its own width's percentages: 175% is 70% of the track, fully off either edge).
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.indicator\[data-indeterminate\] \{([^}]*)\}/m,
    contains: [
      'position: absolute;',
      'inset-inline-start: 30%;',
      'inline-size: 40%;',
      'animation-name: slide;',
      'animation-duration: var(--motion-duration-4);',
      'animation-timing-function: var(--motion-ease);',
      'animation-iteration-count: infinite;',
    ],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    contains: ['translate: -175% 0;', 'translate: 175% 0;'],
    lacks: [],
  },
  // Reduced motion: `base.css` only shortens an animation to its end frame, which here lies off the
  // track, so the slide stops and the segment stays at its rest: centred, 40% wide, 30% in.
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^ {2}\.indicator\[data-indeterminate\] \{([^}]*)\}/m,
    contains: ['animation-name: none;'],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.helper \{([^}]*)\}/m,
    contains: [
      'color: var(--color-text-muted);',
      ...bodyRole,
      'font-size: var(--text-xs);',
      'line-height: var(--leading-snug);',
    ],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^\.root\[data-status='error'\] \.helper \{([^}]*)\}/m,
    contains: ['color: var(--color-danger);'],
    lacks: [],
  },
  // Forced colours: the track keeps an edge in the text colour and the fill the system highlight.
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^ {2}\.track \{([^}]*)\}/m,
    contains: ['outline: 1px solid CanvasText;'],
    lacks: [],
  },
  {
    file: 'components/ProgressBar/ProgressBar.module.css',
    rule: /^ {2}\.indicator \{([^}]*)\}/m,
    contains: ['forced-color-adjust: none;', 'background: Highlight;'],
    lacks: [],
  },

  // `Spinner`: a ring with one quarter in the accent colour. Forced colours collapse every border to
  // the text colour, so the ring was uniform and its rotation invisible, and an ancestor with
  // `forced-color-adjust: none` (a pressed control) let the token colours through. The forced rule
  // names the colours: a head in the ink the spinner inherits (a local property holds `currentcolor`
  // because the style lint takes `currentColor` from one rule and `currentcolor` from another) and a
  // thinner, dotted `GrayText` track under a solid head, so the head is told apart by weight and
  // style, not by colour alone: where one ink paints both (a loading `IconButton`'s `GrayText`, the
  // content rule of a chosen or pressed control) the style is the cue that survives, which
  // `consumerContentKeepsStyles` guards. The head keeps its width; the track is 1 px.
  {
    file: 'components/Spinner/Spinner.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: [
      'border: var(--border-width-emphasis) solid var(--color-border-strong);',
      'border-top-color: var(--color-accent);',
    ],
    lacks: ['GrayText', 'currentcolor', 'dotted'],
  },
  {
    file: 'components/Spinner/Spinner.module.css',
    rule: /^\.root \{[\s\S]*?^@media \(forced-colors: active\) \{\n {2}\.root \{([^}]*)\}/m,
    contains: [
      '--spinner-head: currentcolor;',
      'border-width: 1px;',
      'border-style: dotted;',
      'border-color: GrayText;',
      'border-top: var(--border-width-emphasis) solid var(--spinner-head);',
    ],
    lacks: ['--color-accent', '--color-border-strong'],
  },
  // Nothing follows the block either: the forced rule ties the base `.root` at (0,1,0) and wins by
  // coming later, so a rule appended after it would win the borders back.
  {
    file: 'components/Spinner/Spinner.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^\}\n([\s\S]*)/m,
    contains: [],
    lacks: [/\{/],
  },

  // `Switch`'s unchecked track. Its fill and its border colour are two consumer hooks, read here and
  // never declared, so a misspelt one falls back silently past everything but this row and the dist
  // scan's allow-list. The default border is the opaque control colour, as the checkbox's: unchecked,
  // the boundary is what says a switch is there, and WCAG 1.4.11 asks 3:1 of it. The hairline it
  // replaces measured 1.44 to 1.78:1 on the five surfaces. The border hook is a colour, not a
  // shorthand, so the 1 px width the thumb's travel counts stays, and forced colours still paint it.
  // Prettier wraps the border's value, so the pin allows any whitespace where a wrap can fall.
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^\.track \{([^}]*)\}/m,
    contains: [
      / border: 1px solid\s+var\(\s*--switch-track-unchecked-border-color,\s*var\(--color-border-control,\s*var\(--color-border-strong\)\)\s*\);/,
      ' background: var(--switch-track-unchecked-background, var(--color-surface-3));',
    ],
    lacks: [
      ' border: 1px solid var(--color-border-strong);',
      ' background: var(--color-surface-3);',
    ],
  },
  // Checked, the track is the accent whatever the hooks say: they are the unchecked look only.
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^\.track\[data-checked\] \{([^}]*)\}/m,
    contains: [' border-color: var(--color-accent);', ' background: var(--color-accent);'],
    lacks: ['--switch-track-unchecked'],
  },

  // Forced colours on `Switch`. The browser drops the fills to Canvas, so the thumb (no border of its
  // own) vanished into the track in both states. The track opts out (`forced-color-adjust` inherits
  // to the thumb) and names system colours: unchecked, a Canvas track with a ButtonText edge and a
  // solid ButtonText thumb; checked, a Highlight track with a HighlightText thumb; disabled,
  // GrayText and not dimmed as well; the focus ring CanvasText, not the token the opt-out lets
  // through. The block overrides the unchecked-track hooks too.
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.track \{([^}]*)\}/m,
    contains: [' forced-color-adjust: none;', ' border-color: ButtonText;', ' background: Canvas;'],
    lacks: [],
  },
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.track:focus-visible \{([^}]*)\}/m,
    contains: [' outline-color: CanvasText;'],
    lacks: [],
  },
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.thumb \{([^}]*)\}/m,
    contains: [' background: ButtonText;', ' box-shadow: none;'],
    lacks: [],
  },
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.track\[data-checked\] \{([^}]*)\}/m,
    contains: [' border-color: Highlight;', ' background: Highlight;'],
    lacks: [],
  },
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.track\[data-checked\] \.thumb \{([^}]*)\}/m,
    contains: [' background: HighlightText;'],
    lacks: [],
  },
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.track\[data-disabled\] \{([^}]*)\}/m,
    contains: [' opacity: 1;', ' border-color: GrayText;'],
    lacks: [],
  },
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.track\[data-disabled\] \.thumb \{([^}]*)\}/m,
    contains: [' background: GrayText;'],
    lacks: [],
  },
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.track\[data-checked\]\[data-disabled\] \{([^}]*)\}/m,
    contains: [' border-color: GrayText;', ' background: GrayText;'],
    lacks: ['Highlight'],
  },
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.track\[data-checked\]\[data-disabled\] \.thumb \{([^}]*)\}/m,
    contains: [' background: Canvas;'],
    lacks: [],
  },
  // The block comes right after the last normal-mode rule (`.thumb[data-checked]`), and nothing
  // follows it: its rules tie the top-level ones they override and win by coming later, so a
  // normal-mode rule appended after it would win the cascade back. Every rule inside is indented,
  // so the first `}` at the start of a line closes the block.
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^\.thumb\[data-checked\] \{[^}]*\}\n\n(?:\/\*[\s\S]*?\*\/\n)?@media \(forced-colors: active\) \{([\s\S]*?)^\}\n/m,
    contains: [' .track {', ' .thumb {'],
    lacks: [],
  },
  {
    file: 'components/Switch/Switch.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^\}\n([\s\S]*)/m,
    contains: [],
    lacks: [/\{/],
  },
];

// The chip's box is `--avatar-group-size` and its text `--avatar-group-font-size`, and each
// `data-size` on the list must set them to what `Avatar` draws for that size (`--avatar-preset` and
// `--avatar-preset-font`), or the chip is taller, shorter or smaller-typed than the avatars beside
// it. Both stylesheets declare one `[data-size='…'] { --name: value; }` rule per size; this reads
// the two sets and requires them equal, so a size added to `Avatar` and not to the group (or a
// preset changed in one place) fails here instead of drawing a chip that does not match.
function sizeDeclarations(file: string, property: string): Record<string, string> {
  const contents = readFileSync(join(sourceRoot, file), 'utf-8');
  const byRule: Record<string, string> = {};
  for (const rule of contents.matchAll(/\[data-size='(\w+)'\] \{([^}]*)\}/g)) {
    const [, size, body] = rule;
    const value = body?.match(new RegExp(`${property}: ([^;]+);`))?.[1];
    if (size !== undefined && value !== undefined) {
      byRule[size] = value;
    }
  }
  return byRule;
}

describe('the theme tokens the component CSS reads', () => {
  for (const { file, rule, contains, lacks } of expectations) {
    it(rule ? `${file} ${rule.source}` : `${file} (whole file)`, () => {
      const contents = readFileSync(join(sourceRoot, file), 'utf-8');
      let scope = contents;
      if (rule) {
        const match = contents.match(rule);
        expect(match, `${rule.source} matches nothing in ${file}`).not.toBeNull();
        expect(match?.[1], `${rule.source} has no capture group in ${file}`).toBeDefined();
        scope = match?.[1] ?? '';
      }
      for (const declaration of contains) {
        if (typeof declaration === 'string') {
          expect(scope).toContain(declaration);
        } else {
          expect(scope).toMatch(declaration);
        }
      }
      for (const forbidden of lacks) {
        if (typeof forbidden === 'string') {
          expect(scope).not.toContain(forbidden);
        } else {
          expect(scope).not.toMatch(forbidden);
        }
      }
    });
  }
});

describe('AvatarGroup’s chip box', () => {
  it.each([
    ['--avatar-group-size', '--avatar-preset'],
    ['--avatar-group-font-size', '--avatar-preset-font'],
  ])('%s equals Avatar’s %s at every size', (groupProperty, avatarProperty) => {
    const avatarPresets = sizeDeclarations('components/Avatar/Avatar.module.css', avatarProperty);
    const groupSizes = sizeDeclarations(
      'components/AvatarGroup/AvatarGroup.module.css',
      groupProperty,
    );
    // An empty read on both sides would pass the equality below, so the presets must be found.
    expect(Object.keys(avatarPresets).length).toBeGreaterThan(0);
    expect(groupSizes).toEqual(avatarPresets);
  });
});
