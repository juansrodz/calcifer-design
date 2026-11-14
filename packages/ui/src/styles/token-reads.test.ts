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
    lacks: ['2.5rem', '--radius-md', 'min-height: var(--size-touch);'],
  },
  {
    file: 'components/Button/Button.module.css',
    rule: /^\.root \{([^}]*)\}/m,
    contains: ['min-height: var(--size-control);', 'min-width: var(--size-touch);'],
    lacks: ['min-height: var(--size-touch);'],
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
    file: 'components/Segmented/Segmented.module.css',
    contains: [],
    lacks: ['--color-accent'],
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
