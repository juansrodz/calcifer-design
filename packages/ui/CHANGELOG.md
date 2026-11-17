# @calcifer-design/ui

## 0.7.0

### Minor Changes

- 247bd28: Add eight components, with their prop types: `Collapsible`, `TabBar`, `EmptyState`, `AvatarGroup`, `ChoiceCard`, `ToggleChip` with `ToggleChipGroup`, `ProgressBar` and `SearchField`. Also new in the exports: `avatarColorIndex` and `AVATAR_COLOR_COUNT`, and the `AvatarColorIndex`, `AvatarSize` and `ButtonTone` types.

  Existing components gain props. `Avatar` takes `colorSeed`, the `xs` and `xl` sizes and `className`. `Button` takes `tone`, `badge` and `size="lg"`; `LinkButton` takes `tone` and `size="lg"`. `IconButton` takes `variant="soft"`. `Segmented` takes `fill`, and its options take `badge` and `hideLabel`. `Dialog` takes `headerStart`, `headerEnd`, `headingHidden`, `closeVariant` and `closeHidden`. `NavMenu` takes `orientation`, `labels` (`{ open, close }`, the names of the phone menu button) and a generic item type, and its `items` are `readonly`. `TextInput` and `TimePicker` take `startIcon`; `DatePicker` takes `formatOptions` and `iconPlacement`. `Alert` and `ErrorBoundary` take `headingLevel={1}` for a full-page error. `ButtonVariant`, `ButtonSize`, `IconButtonVariant` and `Avatar`'s `size` are wider, so an exhaustive `switch` over one of them stops compiling until it handles the new members.

  Fourteen consumer hooks let an app restyle a part from a class on the component or on a wrapper of its own, each defaulting to the look it replaces: `--toggle-chip-pressed-ring`, `--icon-button-shadow`, `--segmented-pressed-shadow`, `--dialog-heading-size`, `--dialog-heading-tracking`, `--dialog-heading-leading`, `--sheet-handle-width`, `--sheet-handle-height`, `--avatar-size`, `--avatar-font-size`, `--skeleton-radius`, `--empty-state-heading-size`, `--collapsible-heading-size` and `--progress-bar-track-size`.

  `Button` gains `variant="row"` (full width, start-aligned, no fill at rest, a 44 px target) and `endIcon`, which `LinkButton` takes too; a `startIcon` slot; and `pending`, which shows a spinner in place of the leading icon, keeps the label, sets `aria-busy` and `aria-disabled` and blocks activation while the button stays focusable. `Skeleton` reads `--skeleton-radius` on its text and block shapes. Every default renders as before.

  What looks different under the house theme:

  - Bottom sheets have a grab handle, 40 by 5 px in `--color-sheet-handle`.
  - `Dialog`'s close control is a 36 px circle (`--size-close`, new in tokens 0.3.0) with an invisible 44 px hit area, and the header row centres its children instead of aligning them to the top.
  - A sheet pins its footer: only the body scrolls, and in an end sheet with a short body the footer rests at the bottom.
  - The dialog body's scroll clip sits 4 px further out, so a focused control at its edge shows its whole ring. The content does not move.
  - `SkipLink` uses the inverse colours (`--color-inverse`, `--color-inverse-text`) instead of the accent: a dark pill in light mode and a light one in dark mode.
  - `base.css` sets `margin: 0` on `h4`, `h5` and `h6` across the page.

  Behaviour changes in existing components. `Dialog`'s header puts its close control in an end group after `headerEnd`, so the header's DOM changes; with `closeHidden` and an empty `headerEnd` there is no end group. A dialog opens with focus on its close control, on the popup itself when opened by touch, and on its first tabbable control with `closeHidden`. While the body's content overflows, the body is a Tab stop and a `region` named by the heading, with an inward focus ring, so a keyboard can scroll text that holds no control; a body that fits adds no Tab stop. `Button` and `LinkButton` always write `data-tone` (`accent` by default), and their accent hover rules weigh one attribute more, which an app's own hover override may need to match. `NavMenu`'s wide list writes `data-orientation`. `Avatar`'s initials skip words that are only punctuation and take each word's first letter or digit: "Juan –" gives "J" and "Dad (Pablo)" gives "DP"; a name that is only punctuation keeps its marks.

  How the new parts behave. `loading` is unchanged beside `pending`; a button that is both `disabled` and `pending` keeps the disabled look, without a spinner, and stays focusable and `aria-busy`. Without a `startIcon`, the spinner sits over the label, and the badge and end icon are hidden by opacity, so the button keeps its size. A secondary button with `tone="selected"` or `tone="inverse"` has a transparent border; in forced colours a selected primary or secondary button draws a `Highlight` edge. A chosen `Segmented` option draws its badge in the inverse colours. `TabBar` sits above `env(safe-area-inset-bottom)` (with `viewport-fit=cover`); in forced colours its pill has an edge and the current link a `Highlight` outline. `ToggleChipGroup` and `SearchField` take part in a `Form`: a group's `error` blocks submit and takes focus, a single-choice group's Tab stop is its pressed chip, and a search field's value is in the form's values under its `name`, except while disabled. `ChoiceCard` draws its border only in forced colours, where a disabled card is `GrayText`. A disabled `Collapsible` dims its label, aside and chevron but not its focus ring, and an aside of `null`, `false` or `''` takes no space. `EmptyState` and `ChoiceCard` draw `0` and `NaN` as content, and `null`, `false` and `''` as nothing. `ProgressBar`'s `statusLabels` include `indeterminate`, and a `helperText` of `''` or `true` renders no helper and no `aria-describedby`. `DatePicker` falls back to `{ dateStyle: 'medium' }`, with one development warning per picker, when `Intl` refuses `formatOptions`. A leading icon in `DatePicker`, `TextInput` or `TimePicker` is followed by a `--space-2` gap. With `startIcon`, `TimePicker` hides the browser's picker button and the icon opens the picker instead, with a pointer cursor unless disabled; a browser that refuses `showPicker` leaves the field as it is.

- d52795b: Add `ThemeScope` and `usePortalContainer`, so an app can restyle the library inside one part of a page. `ThemeScope` takes a theme from `defineTheme` in `@calcifer-design/tokens` and applies it to everything inside it. Every dialog, menu, select, tooltip, toast, date picker, tree select and nav menu opened from within a scope renders inside that scope, so it wears the scope's theme and stays within its box, and `usePortalContainer` gives your own overlays the same place to render. Scopes nest and can be pinned to light or dark; an unpinned scope follows `<html>`'s `data-theme` and then the operating system, never an outer scope's pin. With no scope mounted nothing changes. Components now read the theme's tokens for headings (the display font), body text (the body font), font weights, six purpose radii, shadows by surface, the selected and nav colours, the control floors and the drawer width, and every default equals the value 0.6.0 used. Two things look different under the house theme: the end drawer's leading corners now round at `--radius-dialog`, 16 px (R4), and `Card` and `Descriptions` headings go from weight 700 to 600 (R22). A third, smaller change comes with R5, which sizes overlays from their fixed viewport in percentages, as it does `ToastRegion`'s width: the centred dialog's height cap is 85% of its padded viewport rather than `85dvh`, up to about 27 px shorter when standalone. Class names now carry the package version (R7), so two versions of ui on one page never share a class.

  To upgrade, move `@calcifer-design/tokens` to `^0.3.0` together with ui and import `tokens.css` from it. ui's own dependency on tokens now requires `^0.3.0`, and ui reads names that only that file declares, so with an older `tokens.css` the control size, radii, shadows, selected colour and heading weight are missing. Components read role tokens, not the variables an app may override by hand. Segmented's pressed option, the Tabs indicator and `DatePicker`'s selected day read `--color-selected` and `--color-selected-text`, not `--color-accent`; `NavMenu` reads `--color-nav-*`; Segmented's track and border read `--color-segmented-*`; radii, sizes and shadows follow the same rule. An app that restyles by overriding `--color-accent` or another house variable directly should move to `defineTheme` and `themeToCss`, or also override the role tokens. One known limit: the end drawer's rounded corners and its slide are physical, so right-to-left layouts are not supported yet.

### Patch Changes

- Updated dependencies [057c4d2]
  - @calcifer-design/tokens@0.3.0

## 0.6.0

### Minor Changes

- ea40f6c: Add `DataGrid`, a virtualised data grid for large and server-backed lists, with `createDataGridColumnHelper` to build its columns. The first release renders only the rows in view (5,000 rows stay smooth) under a sticky header; sorts by one or several columns; moves by keyboard with one tab stop (arrows, Home, End, Page Up and Down, Ctrl+Home and Ctrl+End) and a row count and position that screen readers announce; and offers comfortable and compact density, loading, empty and error states, a toolbar with refresh and app-supplied actions, and a footer count. Rows can be highlighted on click, selected with checkboxes (shift-click ranges, select-all, locked rows), expanded to a detail panel, given a pinned actions column, and hear `onRowClick`, `onRowDoubleClick` and `onRowContextMenu`, with the context menu also on the keyboard. `mode="server"` hands sorting to the app, loads the next page as the user nears the end of the loaded rows, shows a retry when a load fails, and uses `totalRowCount` for the footer and `aria-rowcount`. Every word the grid shows can be replaced through `labels`.

## 0.5.0

### Minor Changes

- 7ce57f6: Add five data display components.

  - `Tree`: a hierarchy following the WAI-ARIA tree view pattern, with `selectionMode` `none`, `single` or `multiple`. One tab stop, on the selected item or else the first enabled one; arrow keys, Home, End and type-ahead, with Left and Right swapping in right-to-left pages. Disabled items can be focused but do nothing. If an item goes, by removal or by being collapsed away, focus moves to its nearest ancestor still shown. Ids must be unique in the whole tree; a repeated one is left out, with what it holds.
  - `TreeSelect`: choose one node from a hierarchy, as a full field with `label`, `description`, `error`, `required`, `disabled` and `clearable`. Opens by press or by the Up and Down keys, on the chosen node with the branches around it open; choosing closes it and returns focus, as Escape does. Submits the node's `id` through a hidden input, and works inside `Form`, including a `null` value when nothing is chosen, and a native reset of the form. A value no node holds reads as nothing chosen, and with no items the popup says so through `labels.empty`.
  - `FilterBar`: the row above a results list, with a search, slots for filter controls, the active filters as chips and a count announced politely when it changes. It holds no filter logic. Removing a chip moves focus to the next one, or to the search when none are left. Every word can be replaced through `labels`.
  - `CardList`: a responsive grid of cards, generic over the item type, with `loading`, `skeletonCount` and `emptyState`. Items already there stay while loading; skeletons stand in only for an empty list and are not read out.
  - `Timeline`: a chronological record with `<time>` elements on the Gregorian calendar, in an optional `locale`. `tone` is stated in visible words, through `toneLabels`, as well as colour. A `timestamp` may be a year, a month, a date or a date and time, in ISO 8601; anything else is shown as written, without a `<time>`.

- eb2eba3: Add five form components.

  - `TextArea`: a textarea for `Field`, four rows tall by default. `autoResize` grows it with its content through CSS `field-sizing: content`; a browser without that keeps a normal textarea the user can drag taller.
  - `Form`: collects values and hands `onSubmit` a plain object. `errors`, keyed by field `name`, shows each message on the matching `Field`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `DatePicker`, `TimePicker` or `Upload`, marks it invalid and clears it when that control's value changes. An explicit `error` prop wins. On submit, focus moves to the first invalid control, and an invalid control stops the submit. Inside a `Form`, a `required` control left empty now shows a message on its own frame. A plain `<form>` behaves as it did.
  - `DatePicker`: a button showing the formatted date opens a calendar following the WAI-ARIA date picker dialog pattern. `value` is a `YYYY-MM-DD` string or `null`, so no date shifts across time zones. Takes `min`, `max`, `isDateDisabled`, `locale`, `weekStartsOn` and `clearable`, reads right-to-left locales the right way round, and submits through a hidden input. A string that names no real date reads as nothing chosen, and `Form` refuses a date the bounds refuse, with `labels.unavailableMessage`. Always draws the Gregorian calendar, in the locale's language and digits.
  - `TimePicker`: the native time input for `Field`, with `min`, `max` and `step`.
  - `Upload`: selects files without transferring them, on a real file input with a drop zone over it. `accept`, `maxSizeBytes` and the one-file limit are checked for dropped files as well as chosen ones, and `onReject` gets a reason per file, including a `duplicate` when `multiple` is on. Lists the chosen files with a named remove button each, and announces changes to screen readers. Inside `Form`, its value is an array of `File`s. `DatePicker` and `Upload` also follow a native reset of their form, going back to their defaults when uncontrolled. `Form` itself is reset by remounting with a new `key`.

- 7977acd: Add seven components for structuring a page.

  - `ViewField`: one read-only label and value, stacked or inline, showing an em dash (or your own `emptyText`) when there is no value. `0` counts as a value.
  - `Descriptions`: a set of label and value pairs in one `<dl>`, in one to three columns that collapse to one at narrow widths. An item can span columns, and a `heading` names the list.
  - `PageShell`: a page's landmarks, in reading order, behind a skip link: `header`, an optional named `aside`, a focusable `main` and `footer`. The sidebar stacks above the content at narrow widths.
  - `Segmented`: choose exactly one of a few options, on Base UI's `ToggleGroup`. Pressing the active option never clears it. With no `value` or `defaultValue`, the first enabled option starts out chosen.
  - `Breadcrumb`: `nav > ol` with the last item as plain text marked `aria-current="page"`. Long trails wrap, and `renderLink` supplies router links the way `NavMenu`'s does.
  - `Toolbar`, with `ToolbarButton`, `ToolbarGroup` and `ToolbarSeparator`: one tab stop whose arrow keys move focus, on Base UI's `Toolbar`. A `ToolbarButton` wears `Button` or `IconButton` through `render`, and a disabled one stays focusable so its name can still be read.
  - `Steps`: a progress display as an `ol`, with `aria-current="step"` on the current item and each status stated in text for screen readers, not by colour alone. `statusLabels` translates those words. Horizontal steps stack at narrow widths.

## 0.4.0

### Minor Changes

- b99f36a: Add `Checkbox`: an inline field whose label wraps the box and the text on one row, with a mixed (`aria-checked="mixed"`) state for the "select all" case, a required marking, and the same `description`/`error` props as the rest of Tier 3.
- a4297a3: Add `Field` and `TextInput`, the first two Tier 3 form components, on a new shared field skin (`src/styles/field.module.css`). `Field` supplies the label, the required mark, the description and the error message, and wires all four into the control's accessible name and description through Base UI's `Field`. `TextInput` is the native input on that skin; its `render` prop puts any other element — a `<textarea>`, a date or file input — into the same wiring, which is how a consumer builds a control the library does not ship.

  The error is a prop, not a validation engine: `error` present means invalid, so Zod, TanStack Form or anything else stays the single source of truth for what is wrong.

- ae4d493: Add `RadioGroup`: a named group of radio options with arrow-key navigation, a vertical or horizontal layout, and the tier's `description`/`error` props. The group's name is a plain element the group points at rather than a `<label>`, and each option is scoped by a `Field.Item` — without both, Base UI names every radio after the group and gives them one shared id.
- 0465fe1: Add `Select`: a labelled, described, validatable select built on Base UI's `Select`, wearing the Tier 3 field skin on its trigger and the Tier 2 popup skin on its list. Options are an array of `{ value, label, disabled? }` and values are strings, because that is what a form submits. Keyboard navigation, typeahead, collision-aware positioning and `aria-invalid` on the trigger all come from Base UI; what this wrapper adds is the field skin, the popup variant and one prop shape.
- c2dc15c: Add `Switch`: an inline on/off field with `role="switch"`, toggled by space and by enter, with the tier's `description` and `error` props. Tier 3 is complete with it — `Field`, `TextInput`, `Select`, `Checkbox`, `RadioGroup` and `Switch`.

### Patch Changes

- 312b008: Add a Storybook example that composes all six Tier 3 components into one form, with the field adapter a form library such as TanStack Form needs — about twenty lines, and not one lambda at a call site, because `error` is a string prop and every control reports its value directly. The example and its test ship in the repository only; neither reaches `dist`.

## 0.3.0

### Minor Changes

- b69d18d: Add `Dialog`: a modal surface in two variants — centred, and a sheet docked to the bottom edge or, with `side="end"`, a full-height panel on the trailing edge — on the same popup skin as `Popover`. Escape always closes it, because Base UI treats that as non-negotiable and offers no prop to turn it off; `dismissOnOutsidePress` covers the case a caller actually needs to control. Focus moves to the header's close control on open and back to the trigger on close.

  Its backdrop is `var(--color-scrim)`, new in `@calcifer-design/tokens@0.2.0`: an app that imports `tokens.css` from its own top-level dependency needs that dependency at `^0.2.0`, or the dialog opens over a fully transparent page.

- 5523c8f: Add `Menu`: a list of actions anchored to a trigger, on the same popup skin as `Popover`, with roving focus, typeahead and optional separators supplied by Base UI. `modal` defaults to `false` rather than Base UI's `true`: a menu hanging off a toolbar button has no business locking page scroll, and `NavMenu` already made the same call.
- c467959: `NavMenu`'s dropdown now uses the same popup skin as `Popover`, `Dialog`, `Menu` and `Tooltip` instead of its own copy of half of it. Its props are unchanged, so nothing about this is breaking — but it is a deliberate change to how a published component looks and behaves, which on a pre-1.0 package is a minor rather than a patch, so it does not reach a `^0.2.x` consumer with no signal at all.

  What changes: the popup's generated class name; the menu fades and scales as it opens and closes where it used to appear instantly, growing out of its trigger rather than its own centre, and collapsed to nothing under `prefers-reduced-motion` as all of this library's motion is; the dropdown now clamps to the viewport and scrolls inside itself (`max-width`/`max-height` from the positioner, with `overflow-y: auto` and `overscroll-behavior: contain`) instead of overflowing the window; `color` is set explicitly where it was inherited, with no change to the computed value; and Base UI's `[data-instant]` hook now suppresses the transition where Base UI asks it to. Item spacing is unchanged: the shared surface's `gap` is switched off for `data-popup='menu'`.

- b42bf62: Add `Popover`: an anchored dialog with a heading, an optional description and collision-aware placement. Setting `modal` also renders a visually-hidden close control, because Base UI only arms its focus trap when a close part is present inside the popup — `modal` alone traps nothing. `modal={true}` paints a scrim; `modal="trap-focus"` does not, because that mode leaves page scroll and outside clicks working and a full-viewport backdrop would swallow both. Its surface, viewport clamp and entry transition come from a shared popup skin that `Dialog`, `Menu` and `Tooltip` wear too. That skin also fixes the tier's stacking order in one place: anchored popups and dialogs both sit at `z-index: 50`, so the order their portals open is what decides which one nests above which, while toasts sit at `70` above them both — so chrome of your own given a `z-index` between the two paints above every dialog and below every toast.

  That scrim is `var(--color-scrim)`, new in `@calcifer-design/tokens@0.2.0`. An app that imports `tokens.css` from its own top-level dependency must move that dependency to `^0.2.0` as well — the range inside this package only nests a second copy nobody imports, and a missing custom property falls back to `transparent` with no error anywhere.

- dffb0c7: Add `ToastRegion` and `createToastManager`: the toast provider, portal and viewport as one component, because it is the viewport — not the provider — that renders the notifications landmark and four window-level listeners, and mounting two of those is the failure this shape makes impossible. The manager is a plain object created outside React, so a federated host can hand it to a remote through props and have it work across a separate React root, where context cannot reach. Its payload is `string` rather than `ReactNode` for the same reason: an element authored in a remote would render under the host's CSS.
- c00eaff: Add `Tooltip` and `TooltipProvider`, with the hover delay exported as `TOOLTIP_DELAY`. `label` is required and becomes both the tip's text and the trigger's `aria-label`, because Base UI's tooltip contributes nothing to the accessibility tree — no `role="tooltip"`, no `aria-describedby` — and is disabled on touch devices, so a tip nobody names is a tip some people never get. The provider renders no DOM and attaches no listeners, which is what makes it safe for a federated remote to mount its own.

### Patch Changes

- c405f8d: Share one visually-hidden class across the library instead of copying the block into each component's stylesheet. `LiveRegion`, `Alert`, `Avatar`, `Spinner`, `StatusDot` and `DataTable` all used it, and `DataTable`'s stacked header had already lost four of its nine declarations — including the negative margin that takes the 1px box out of layout. The hidden elements' generated class names change; nothing in the public API does.
- Updated dependencies [b34ca2e]
  - @calcifer-design/tokens@0.2.0

## 0.2.1

### Patch Changes

- 0149429: Fix `base.css` shipping with 122 stale bytes after its last brace. Two steps of the build wrote `dist/styles/base.css` — the bundleless compile and the explicit copy — and when the shorter write landed second it did not truncate the longer one, so 0.2.0's file ends in half a declaration and two stray braces. Browsers skip it; Vite's production minifier rejects it, which failed every Vite consumer's build. The copy is now the file's only writer and the dist tests assert it is byte-identical to the source and that every shipped stylesheet is structurally whole.

## 0.2.0

### Minor Changes

- dae50c9: Add `Alert`: a four-tone message panel with an optional heading and dismiss control. Its live-region role is opt-in through `announce` rather than automatic, because an alert that is already on the page at first paint would otherwise announce at an arbitrary moment. The tone is always in the accessibility tree as text, so colour is never the only signal.
- 42e25bc: Add `Avatar`: a Base UI avatar in three sizes and two shapes, falling back to initials derived from `name` when there is no image or the image fails to load. The full name is always in the accessibility tree; the initials are decorative.
- 70de156: Add `ErrorBoundary`: catches a render error below it and shows a recoverable fallback. Takes an `onError` callback for logging, a `fallback` render prop, and `resetKeys` so a failure clears itself when the route changes. Its default fallback is an announced danger `Alert` with a retry control.
- 09de97e: Add `IconButton`: a square sibling of `Button` for controls whose only content is an icon. `label` is required and becomes the accessible name; `loading` swaps the icon for a `Spinner`, keeps the button focusable and blocks activation.
- d1d6539: Add `Skeleton`: a content placeholder in text, block and circle variants. It is always hidden from assistive technology — the wait itself is announced by a live region, not by the placeholder.
- 7dbaa13: Add `Spinner`: an indeterminate busy indicator in three sizes. It is decorative by default and announces through a `role="status"` region only when given a `label`, so a spinner inside an already-busy control does not announce twice.

## 0.1.2

### Patch Changes

- f0369bd: Depend on `@calcifer-design/tokens` by a caret range that Changesets bumps with each release, instead of `workspace:*`, so the published manifest always names the matching tokens version.

## 0.1.1

### Patch Changes

- b18fbd1: First release staged by CI through npm trusted publishing.
- Updated dependencies [b18fbd1]
  - @calcifer-design/tokens@0.1.1

## 0.1.0

### Minor Changes

- 59a2bf4: First published release of the design tokens and the UI components (moved from portfolio-mfe).

### Patch Changes

- Updated dependencies [59a2bf4]
  - @calcifer-design/tokens@0.1.0
