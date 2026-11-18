# @calcifer-design/ui

## 0.12.0

### Minor Changes

- f3cf47b: `Collapsible` gains a `chevron` option and two trigger padding hooks. Nothing changes for an existing collapsible.

  - `chevron` (new type `CollapsibleChevron`) chooses which way the chevron points, closed then open. The default, `'down-up'`, is today's: down while closed, up while open. `'end-down'` points to the reading end while closed (right, or left in a right-to-left page) and down at the panel while open, as a disclosure triangle does. The component reads the computed direction, so a `dir` on any ancestor, or a stylesheet's `direction`, is enough. It reads it after each render, so a direction changed under a memoised subtree takes effect on that subtree's next render, and server-rendered HTML carries none until hydration: before then, a closed chevron in a right-to-left page points right. A new direction is applied without the turn's transition, so a closed group mounting in a right-to-left page does not spin.
  - `--collapsible-trigger-padding-block` and `--collapsible-trigger-padding-inline` pad the trigger row inside its edges. Like `--collapsible-heading-size`, they are set from a class on the root or on any wrapper (they inherit), take what `padding-block` and `padding-inline` take, and default to no padding. The padding is inside the button, so it is pointer target too and the focus ring goes round it.
  - New stories: `ChevronEndDown`, `ChevronEndDownRightToLeft` (its play checks that a closed chevron mounts pointing left with no turn running) and `TriggerPadding` (a start-and-end block value, `0 2px`).

- ddded7c: `Dialog` takes a `finalFocus` prop: where focus goes when the dialog closes.

  - Base UI returns focus to the dialog's `trigger`, or to the control that held it when the dialog opened. A dialog opened with no trigger and nothing focused (from a URL parameter, say), or whose opener unmounted while it was open, has neither. Focus then falls to `<body>`, or to a control an earlier popup remembered. `finalFocus` says where it goes instead.
  - It takes what Base UI's `Dialog.Popup` takes. A ref moves focus to its element, and an empty ref keeps the default. A function is called with how the dialog was closed and returns the element to focus, `true` or `null` for the default, or `false` or nothing for no move at all, so write `ref.current ?? null`, not `ref.current ?? undefined`. Passing `false` instead of a function moves focus nowhere too, not even back to the trigger.
  - The element has to be able to take focus. A heading needs `tabIndex={-1}`. An element that is not in the tab order hands focus to its first tabbable descendant, so a `tabIndex={-1}` heading that holds a link focuses the link. An element that cannot take focus moves nothing, and focus falls to `<body>`.
  - A ref or function target also wins over focus your own `onOpenChange` moves as the dialog closes. On a nested dialog, leave `finalFocus` out: it would pull focus out of the outer dialog while that dialog is still open.
  - It applies to every variant (`center` and both sheets). Left out, nothing changes. The opening focus stays as `Dialog` sets it, so there is no `initialFocus` prop.

### Patch Changes

- ee0ccd9: Under forced colours (Windows High Contrast), what you put inside a chosen or pressed control now follows that control's colours, and the link controls get a hover cue. The default look is unchanged.

  A chosen `Button` or `LinkButton`, a chosen `Segmented` option, a pressed `IconButton` and a pressed `ToggleChip` keep their `Highlight` fill by opting out of the browser's recolouring. The content inside them was opted out too: a `Tag` in a badge kept its token pill, and an icon with its own colour fell to 1.3:1 on the fill. Now the content takes the control's ink: `HighlightText`, or `Canvas` on a disabled chosen control's `GrayText` fill. It has no fill of its own and draws any border in that ink, so a `Tag` reads as an outlined pill. This applies to everything inside a chosen `Button` (also while it is `pending`, except its spinner), to the badge and icon of a `Segmented` option, and to the icon of a pressed `IconButton` or `ToggleChip`.

  The content of a loading `Button` and of a disabled `ChoiceCard` (its icon disc and description) now reads `GrayText` with the label. Before, it kept the system text colour.

  Colours of your own give way to the control's ink there, whether they are inline or not, and so does a forced-colours system colour you chose. An SVG coloured by a `fill` attribute is not reached, so colour icons with `currentColor`.

  A `Segmented` option now shows the hover cue a `Button` and a `ToggleChip` already have: its border turns `Highlight`. It has a 1 px border in forced colours only, so an option is 2 px wider there. A hovered `LinkButton` or `LinkIconButton` now gets the same `Highlight` border; a link showed no hover cue at all before. A hovered ghost `Button`'s border turns `Highlight` too, where it stayed in the text colour.

- 0c43c18: `Tree` (and the tree inside `TreeSelect`): in a right-to-left page, the closed chevrons no longer spin through a half turn when the tree mounts. The tree reads the computed direction in an effect and writes it to its root as `data-direction`, and the chevrons' starting angle is fixed from the left-to-right rule before that write. Writing it then changed the transform, and the transform transitions, so every closed chevron turned from pointing right to pointing left over about 120 ms (reduced-motion users never saw it). In a left-to-right page nothing changes, and neither does what a chevron does when a branch opens or closes.

  The direction is now written only when it is new or differs from what the root already holds, and with the chevrons' transitions held still for that one write (the root carries a `data-direction-changing` mark for the write, which the stylesheet reads, and it is gone again before the browser paints). A render that finds the direction unchanged writes nothing, so the hold never lands on a turn that is running. Keyboard handling is unchanged: Left and Right still swap by the computed direction, read when the key is pressed.

  Two limits, now in `Tree`'s documentation. The direction is read after each render, so a `dir` changed under a memoised subtree takes effect on that subtree's next render. Server-rendered HTML carries no direction until hydration, so before then a closed chevron in a right-to-left page points right.

## 0.11.0

### Minor Changes

- 62df13f: `DataGrid` gains `enableFilters` and announces its result counts.

  - `enableFilters` (default `true`, so nothing changes for existing grids) turns off the grid's own filter controls: the filters button with its badge, the filter strip it opens (the sticky second header row and its keyboard row) and the All / Any switch. A column's `filter` still applies, from a controlled `query` or `initialQuery`, so an app that sets a column's filter from its own tabs over the grid keeps the grid's matching without a second set of filter controls. The search is unaffected.
  - When a change to the search, a filter or the match mode settles, the grid's live region announces, politely, how many rows it found: 500ms after the last such change, and in server mode once the new query's rows have arrived (while `loading` is set, or while the rows on screen still answer the old query, it waits). It says nothing on the first render, for a sort, for pages loaded as the user scrolls, or for rows the app replaces under the same query. A loading, empty or filtered-empty state, or a failed first page, speaks its own message instead. The same count is spoken again for a new change, as the region is cleared at each change.
  - New label `resultCount(count, moreToLoad)`, by default "24 rows found", or "More than 50 rows found" in server mode when the app gives no `totalRowCount` and says `hasMore`. In server mode the count is `totalRowCount`, or else the rows loaded. A `Partial` `labels` object needs nothing; code that builds a whole `DataGridLabels` object must add the key.
  - New stories: `FiltersOff` (an app's tabs drive the Status filter with `enableFilters={false}`) and `ResultAnnouncement` (shows the last announcement under the grid).

### Patch Changes

- 243acc0: `Button`, `Spinner`, `ToggleChip` and `Segmented` read correctly under forced colours (Windows High Contrast). An audit of every variant, size and state in both themes found the same defects in each; the default look is unchanged.

  `Spinner` is no longer a uniform ring there. Forced colours painted every border in the text colour, so nothing showed it turning, and an ancestor that opts out of the recolouring (a pressed control) let the token colours through. The head is now the ink the spinner inherits at the usual width and the track is a thinner `GrayText` ring, so the open arc that turns reads in either theme, in a `Button` and on a filled control alike.

  A disabled `Button`, `ToggleChip` or `Segmented` option is now `GrayText`, the system's disabled colour, and no longer dimmed on top of it: the 45% dim took the label and the edge down to about 3:1. A loading `Button` was the ordinary text colour at 45% with its label at 70% (2.2:1); it is `GrayText` at full strength now. A pending `Button` keeps its ink and its spinner at full strength, as before, and its label stays hidden under the spinner when the button is also `loading`: forced colours turned the hiding ink into the system text colour, and the loading label's 70% then showed through.

  A chosen `Button` (the `selected` tone) is a `Highlight` fill with `HighlightText` ink, as a pressed `IconButton` is: its `Highlight` border alone was only 1.9:1 (light) and 2.3:1 (dark) from the resting border, so it hardly showed. A chosen `Button`, pressed `ToggleChip` or chosen `Segmented` option that is disabled is a `GrayText` fill with a `Canvas` ink instead of a dimmed `Highlight` fill (2.4:1), so it reads disabled while its fill still says chosen.

- 740cf25: `IconButton` and `LinkIconButton` read correctly under forced colours (Windows High Contrast). An audit of every variant, size and state in both themes found four defects, all in `IconButton`'s stylesheet; the default look is unchanged.

  A disabled or loading button is now `GrayText`, the system's disabled colour, and no longer dimmed on top of it. The 45% dim took the glyph and the edge down to about 3:1 or under, and took a focused loading button's focus ring down to 2.4:1; a loading button, which is not natively disabled, was drawn in the ordinary text colour. A pressed button that is disabled or loading is filled `GrayText` instead of showing a dimmed `Highlight`, so it reads disabled while the fill still says pressed, and a loading one's spinner turns as a `Canvas` arc on that fill (the `Spinner` change in this release) instead of a token-coloured quarter that all but vanished.

  The count badge gets a 1 px border in forced colours. Its fill is the page colour there, so it had no shape of its own and cut a gap in the button's border; it is 2 px larger in forced colours. A pressed badge names its border, `Highlight`, so the half that sits beyond the button no longer disappears into the page, and a disabled badge is `GrayText` with the button.

- 3194ef8: The house light `danger` the components inherit from `@calcifer-design/tokens` 0.6.0 is a step darker, `#C62F2F` (was `#D23B3B`), and its washes follow it. No ui stylesheet changes, but every light-mode danger use looks a little darker: a field's error message and required mark, a rejected upload's reason, a failed `ProgressBar`'s helper and fill, the invalid field's wash and ring, the invalid checkbox and radio edge, the `StatusDot`, the `Alert` and `Toast` rails, the `Alert` icon, the `Timeline` marker and the `Steps` error ring. The error text now reaches 4.5:1 on every page surface. Dark mode is unchanged.
- Updated dependencies [1c41983]
  - @calcifer-design/tokens@0.6.0

## 0.10.0

### Minor Changes

- 305a78b: `EmptyState` takes a `bare` prop. It drops the card's shadow and, under the neutral tone, its surface, for a container that already frames the empty state, such as a panel or `DataGrid`'s body: the content sits flat on the container's own surface instead of a card nested in it. The padding and the layout stay, and the root carries `data-bare`. Under `tone="selected"` the fill stays, because its text colour is chosen against it. Without `bare`, nothing changes.
- 73de890: Add `LinkIconButton`, an icon button that is a link. It is to `IconButton` what `LinkButton` is to `Button`: an `<a>`, or the element given to `render` (a router link), that wears `IconButton`'s variants, sizes, badge, focus ring and 44 px / 40 px hit area, with none of its button semantics. It takes `label`, `variant`, `size`, `badge`, `render` and the anchor's own props. Before, an `IconButton` given a router link through `render` was announced as a button (an app had to pass `role="link"` itself) and followed the link on Space, through Base UI's keyup click; a `LinkIconButton` is announced as a link, Enter follows it once and Space does not activate it. A link is never pressed, busy or disabled, so it has no `pressed`, `loading` or `disabled`. `IconButton` itself is unchanged, and its stylesheet now sets `text-decoration: none`, which only an anchor can show.

### Patch Changes

- 37bf243: `DataGrid`: no row of body text shows above the sticky header band any more. In a GPU-composited Chrome (an ordinary headed window) the compositor could place the sticky band up to a device pixel below the scroll area's top edge, so while the body was scrolled a one-pixel slice of the rows under it showed between the card header and the band. The band now sticks 1px above that edge, and its top hairline is the scroll area's own top border, which stays in place while the band slides under it. At rest the grid sits 1px lower than before (the border adds a pixel above the band); while scrolled, the stuck band shows 1px less of its own top padding. The top hairline now lies on the card's surface rather than the band's, so it reads lighter. In headed Chrome at a device pixel ratio of 1, when the scroll area's top falls at a fractional offset, it can also spread over two device rows at rest, softer still, and sits on one row once the band sticks. A row scrolled up to the band, as ArrowUp and PageUp do and as the browser does for a focused cell, now lands one pixel higher than the band's height: its top line sits right under the band's hairline, with no gap between them, and a focused cell's focus ring stays whole below the band.
- f579bca: `DataGrid`: the selection checkboxes sit at the centre of their cells. Before, each one sat on the cell's text baseline, about 3px above the centre unchecked and 1.7px checked, so ticking a box moved it; the boxes in the header and in every row are now blocks centred in the cell, checked or not. That baseline also stretched the line the box sat on, so in a grid with checkboxes a row whose other cells hold one line of text is now 1 to 4px shorter, and ticking a row no longer changes its height (at 1280px, comfortable rows were 50.4px unticked and 47.4px ticked; both are now 46.4px). The header band is 1 to 4px shorter for the same reason.
- c26b4e7: `DataGrid`: the focus ring of the server-mode error row (the message and its Try again button) stays in view on a narrow screen. The row's cell spans the whole table, which can be wider than the scroll area, so on a phone the ring along its far edge was off-screen; the ring is now drawn on the box that keeps the message and button in view, in either reading direction, and that box carries the cell's vertical padding so the ring keeps clear of the button.
- fe22b44: `DataGrid`: the filtered-empty state sits flat in the grid's body. It used to draw `EmptyState`'s raised card inside the grid's card: almost invisible in dark mode, a card in a card in light. It now renders the empty state `bare`, on the grid's own surface. A `filteredEmptyState` the app passes is unchanged.
- 16c4140: `DataGrid`: the row divider no longer goes missing, or jogs by a pixel, in the pinned columns (checkbox, expand and row actions) when rows sit at fractional pixel offsets, as they did on a phone with the filter strip open. Each row now draws the line above it, along the top edge of its cells, instead of the line under it along the bottom edge: the browser puts a pinned (sticky) cell's top edge on the same pixel as the rest of its row, but could round its bottom edge to the next pixel, where the next row's pinned cell covered the line or moved it. An open detail panel's lines are drawn the same way. Plain rows keep their heights; an open panel and the row after it are each half a pixel shorter, and an open panel at the end of the body has no line under it, like any last row. Each line sits on the other side of the same boundary, one pixel lower than before. Forced colours keep the row borders they drew before.
- 7549f4d: `Upload`: a disabled drop zone keeps its hint ("or drop it here") readable. The dashed face used to go translucent, hint and all, which took the hint down to about 2.6:1 in light and 3.1:1 in dark. Now only the face's dashed border and fill dim (by the same 0.55), and the hint stays at `--color-text-muted`, at 4.5:1 or better on the dimmed face in the house and demo themes, light and dark. The button dims once, as any disabled `Button` does (0.45, where it used to compound to about 0.25), so it is visibly a little stronger than before. An invalid disabled zone keeps its danger colours, dimmed. Under forced colours the disabled face's edge is `GrayText` (an invalid one keeps the text colour). A browser without `color-mix()` keeps the old look. An enabled zone is unchanged.
- Updated dependencies [73de890]
  - @calcifer-design/tokens@0.5.0

## 0.9.1

### Patch Changes

- abe75a2: `ThemeScope`: when the scope's mode changes, every transition inside it (its portalled dialogs, menus and toasts included) is held still for the frame of the change, so text that transitions its colour, such as `NavMenu`'s links, `Segmented` and the icon buttons, flips in the same frame as the surface behind it. Before, that text faded over `--motion-duration-1` (about 120 ms) from its old colour while the surface changed at once, and for that window the pairing could fall below 4.5:1. This covers every way the mode can change: a change of the `mode` prop and, while no `mode` is pinned, a change of `<html>`'s `data-theme` (a host page's own theme toggle) or of the OS colour scheme. Transitions run as before from the next frame on, and `prefers-reduced-motion` is unchanged. A nested `ThemeScope` is left alone, because its colours never follow its parent's mode. The scope marks itself with a `data-theme-changing` attribute for that frame; nothing is injected into the document, so a strict `style-src` is not involved. The rule is an `@scope` block, so a browser without `@scope` support (before Chrome 118, Safari 17.4 or Firefox 146) ignores it and keeps the old fade.
- e747c46: `TreeSelect`: the tree opens above or below its trigger and never beside it, as the `DatePicker` has since 0.8.0. Before, when neither side had room for the whole tree, as halfway down an end drawer at 1280 × 800, it fell back to the trigger's side, which in a drawer is over the scrim. It now takes the roomier of the two and fits itself to that space, scrolling if it must.

## 0.9.0

### Minor Changes

- 7fc8381: DataGrid can now find rows: a filter strip with text, select and multi-select filters, all/any matching, wildcard search, `initialQuery`, a controlled `query`, and a filtered-empty state. `IconButton` gains an optional pressed state and count badge. `onQueryChange` now also fires in client mode.

  `dataGridSearchPattern` is exported, so a JavaScript server can match a search term exactly as client mode does.

  Existing grids look slightly different: selected and highlighted rows take the soft selected tint (`--color-selected-soft`), stronger than the accent wash they used before; the row divider is now drawn by each cell, so it stays unbroken across pinned columns and rows are about 1px shorter; and the loading, empty, filtered-empty and error rows keep their message and button inside the visible scroll area when the table is wider than it, as on a phone.

  Three changes to check when upgrading. `DataGridLabels` has 14 new keys, `search`, `searchField`, `clearSearch`, `filters`, `matchMode`, `matchAll`, `matchAny`, `filterBy`, `filterAll`, `filterSelectedCount`, `filterNoOptions`, `filteredRowCount`, `filteredEmpty` and `clearFilters`: a labels object typed as the full `DataGridLabels` must add them, while a `Partial` one, as the `labels` prop takes, needs nothing. In client mode a sort change now scrolls the body back to the top, as any query change does. `IconButton`'s root is now `position: relative` (for the badge), so give an absolutely positioned one a selector with more weight than one class.

## 0.8.0

### Minor Changes

- 04856c3: Three accessibility and placement fixes from the redesign's visual checks.

  - `DatePicker`: the calendar opens above or below its trigger and never beside it. Before, when neither side had room, as halfway down an end drawer at 1280 × 800, it fell back to the trigger's side, which in a drawer is over the scrim. It now takes the roomier of the two and fits itself to that space, scrolling if it must, as other popups do. Below its trigger the calendar no longer keeps an empty sixth week of room, so a four or five-week month is shorter there; above it the room stays, so the month buttons do not move under the pointer.
  - `Dialog`: the popup carries `aria-modal="true"`. The page behind was already hidden from assistive technology (`aria-hidden`) while the dialog is open, and this is unchanged.
  - `Checkbox` and `RadioGroup` (and the `DataGrid` row checkbox, which shares the rule): the unchecked boundary reads the new `--color-border-control` instead of `--color-border-strong`, and the invalid boundary reads `--color-danger` instead of the translucent `--color-danger-border`. The unchecked boundary reaches WCAG 1.4.11's 3:1 on the surfaces the theme check covers (`surface1`, `surface2`, `surfaceRaised` and `surfaceInput`), and the invalid edge on the ones the check holds `--color-danger` to (`surface1`, `surface2`, `surface3` and `surfaceRaised`); elsewhere, such as the control border on `surface3`, the ratio is not checked. This is a visible change: the empty box and the radio ring are darker in light mode and lighter in dark mode, and an invalid one has a solid red edge. Upgrading: move `@calcifer-design/tokens` to `^0.4.0` together with ui and import its `tokens.css`, which declares `--color-border-control`. A page still on an older `tokens.css` keeps today's faint border, which does not reach 3:1: without the token the border would vanish altogether, so ui falls back to `--color-border-strong`.

### Patch Changes

- Updated dependencies [04856c3]
  - @calcifer-design/tokens@0.4.0

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
