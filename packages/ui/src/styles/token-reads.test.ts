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

// The band `AvatarGroup` draws around each avatar and around its overflow chip: the one value both
// rules are pinned to, so a ring on one and not the other cannot pass.
const avatarGroupRing = '0 0 0 var(--border-width-emphasis) var(--color-avatar-ring)';

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
      'padding: 0;',
      'background: transparent;',
    ],
    lacks: [],
  },
  // The pointer target is at least 24 px tall (WCAG 2.5.8) without a taller row: the pseudo-element
  // adds only what the row lacks, and the row keeps `padding: 0`.
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
  // The gap between the heading and what it opens. The visual check reads 12 px against the mock.
  {
    file: 'components/Collapsible/Collapsible.module.css',
    rule: /^\.panel \{([^}]*)\}/m,
    contains: ['padding-block-start: var(--space-3);'],
    lacks: [],
  },

  // `NavMenu`'s sidebar form. `flex: 1 1 auto` is what makes the list span the sidebar: `.root` is
  // a row flex container, so without it the list shrinks to its widest label. The link rule makes
  // each link as wide as the list.
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
      'inset-block-end: var(--space-5);',
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
      'padding: var(--space-3);',
      // The edge forced colours paint, since they remove the shadows.
      'border: 1px solid transparent;',
      'border-radius: var(--radius-panel);',
      'background: var(--color-surface-raised);',
      'box-shadow: var(--choice-card-ring);',
      'overflow-wrap: anywhere;',
    ],
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
      'border: 1px solid transparent;',
      'border-radius: var(--radius-full);',
      'box-shadow: var(--choice-card-dot);',
    ],
    lacks: [],
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
  // Forced colours remove the shadows and the fills, so the chosen card and its ring are told
  // apart by system colours on the borders the two boxes keep.
  {
    file: 'components/ChoiceCard/ChoiceCard.module.css',
    rule: /^@media \(forced-colors: active\) \{[\s\S]*?^ {2}\.card\[data-checked\] \{([^}]*)\}/m,
    contains: ['border-color: Highlight;'],
    lacks: [],
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
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^ {2}\.chip\[data-pressed\] \{([^}]*)\}/m,
    contains: ['forced-color-adjust: none;', 'outline-color: CanvasText;'],
    lacks: [],
  },
  {
    file: 'components/ToggleChip/ToggleChip.module.css',
    rule: /^\.chip\[data-disabled\] \{([^}]*)\}/m,
    contains: ['opacity: 0.45;'],
    lacks: [],
  },
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
