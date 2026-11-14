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
  contains: readonly string[];
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
    // A field keeps `--size-touch` as its floor; only its radius moves to the control purpose.
    file: 'styles/field.module.css',
    rule: /^\.control \{([^}]*)\}/m,
    contains: ['min-height: var(--size-touch);', 'border-radius: var(--radius-control);'],
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
    ],
    lacks: ['--color-accent'],
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
      'padding: var(--space-3) var(--button-lg-padding-inline);',
      'font-size: var(--text-lg);',
      ...displayRole,
    ],
    lacks: [anyWeightLiteral, 'var(--font-sans)'],
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
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='primary'\] \.icon \{([^}]*)\}/m,
    contains: ['--color-accent: currentcolor;'],
    lacks: [],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root\[data-variant='primary'\] \.pendingOverlay \{([^}]*)\}/m,
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
  // L2-17, L2-21 / O-33): the close is drawn at the `--size-close` circle by a three-class rule that
  // beats `IconButton`'s `.root[data-size='sm']`, and a `::before` grows its pointer target to
  // `--size-touch` without changing the drawn size.
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
      'var(--size-close)',
      '.headerEnd > .close[data-variant]',
    ],
    lacks: [],
  },
  {
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\.headerEnd > \.close\[data-variant\] \{([^}]*)\}/m,
    contains: [
      'position: relative;',
      'min-height: var(--size-close);',
      'min-width: var(--size-close);',
    ],
    lacks: ['--size-touch'],
  },
  {
    file: 'components/Dialog/Dialog.module.css',
    rule: /^\.headerEnd > \.close\[data-variant\]::before \{([^}]*)\}/m,
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
      '--ring-room: calc(var(--focus-ring-width) + var(--focus-ring-offset));',
      '--ring-room-reach: calc(var(--ring-room) * -1);',
      'margin: var(--ring-room-reach);',
      'padding: var(--ring-room);',
      'overflow-y: auto;',
    ],
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
    contains: ['gap: var(--space-2);'],
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
      'min-width: 0;',
      'padding: 0;',
      'border: 0;',
      'background: transparent;',
    ],
    lacks: ['outline'],
  },
  {
    // Two classes' worth of weight over `base.css`'s `:focus-visible` ring, whatever the bundle order.
    file: 'styles/field.module.css',
    rule: /^\.affixInput:focus-visible \{([^}]*)\}/m,
    contains: ['outline: none;'],
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
    lacks: [],
  },
  {
    file: 'styles/field.module.css',
    rule: /^\.affixIcon > svg \{([^}]*)\}/m,
    contains: ['width: 1rem;', 'height: 1rem;'],
    lacks: [],
  },

  // `SearchField` (L2-8, PF-8): the pill is one height with or without the clear control. Its
  // padding-block is zero, so the `--size-touch` floor alone sets it (`.control`'s); the clear
  // control is drawn at `--size-close` rather than a 40 px `IconButton` floor, and the 44 px hit
  // area is an absolutely positioned `::before` that adds nothing to the layout.
  {
    file: 'components/SearchField/SearchField.module.css',
    rule: /^\.root \.box \{([^}]*)\}/m,
    contains: ['padding-block: 0;', 'padding-inline: var(--space-4) var(--space-1);'],
    lacks: ['min-height', 'gap'],
  },
  {
    file: 'components/SearchField/SearchField.module.css',
    rule: /^\.root\[data-size='sm'\] \.box \{([^}]*)\}/m,
    contains: ['min-height: var(--size-control-sm);'],
    lacks: ['padding'],
  },
  {
    file: 'components/SearchField/SearchField.module.css',
    rule: /^\.root \.clear\[data-size\] \{([^}]*)\}/m,
    contains: [
      'position: relative;',
      'min-height: var(--size-close);',
      'min-width: var(--size-close);',
    ],
    lacks: ['--size-touch', '--size-control'],
  },
  {
    file: 'components/SearchField/SearchField.module.css',
    rule: /^\.root \.clear\[data-size\]::before \{([^}]*)\}/m,
    contains: ["content: '';", 'position: absolute;', 'inset: calc(50% - var(--size-touch) / 2);'],
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
];

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
        expect(scope).toContain(declaration);
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
