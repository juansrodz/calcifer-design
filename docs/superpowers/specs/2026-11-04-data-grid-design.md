# DataGrid: a full data grid for `@calcifer-design/ui`

## Intent

`DataTable` is a light, accessible table that sorts. Business apps also need a working grid: find rows
in a large set, shape the columns, act on one row or many, and come back to the same view tomorrow.
`DataGrid` is that component. It is a new component; `DataTable` stays as it is for simple read-only
lists.

The feature set comes from a written inventory of an enterprise grid the maintainer used before. That
inventory describes behaviour and layout only. This document and every line of the implementation are
original work for this library. Nobody building it reads the other grid's code, and nothing in this
repository names it.

## Goals

- One component that handles both a full dataset in the browser and a server that hands out pages.
- Everything works by keyboard and with a screen reader, including the things grids usually leave to
  the mouse: column resize, column reorder and row moves.
- Large sets stay fast: only the visible rows are rendered.
- It looks like Calcifer. Every colour, size and radius comes from tokens, and both themes work.
- Apps own their data and their storage. The grid never fetches, and never assumes a backend.

## Non-goals

- Cell editing. Cells render what the app supplies.
- Grouping, aggregation, tree data, pivoting, and row or cell spanning.
- Columns invented from the data. Apps define every column.
- Permission models. An app hides a column by leaving it out, or disables an action itself.
- A stacked phone layout. Narrow screens scroll sideways; `DataTable` keeps the stacked layout for
  simple lists.
- Page buttons. Large sets load as the user scrolls. A `Pagination` component may come later with the
  Carbon gap work, and the grid's state is shaped so it could drive one.
- Breaking changes to an existing component. Optional additions are allowed where the grid needs them:
  a danger tone and labelled groups on `Menu`, and a pressed state and a count badge on `IconButton`.
- Selecting every matching row in server mode, including rows not loaded yet. It can come later as an
  addition without breaking the selection API.
- Reordering rows by dragging. Rows can be dropped onto other rows (a file into a folder), not between
  them.

## Anti-goals

- A grid that only works with a mouse. Every pointer interaction has a keyboard path that is tested.
- A grid tied to one data library or backend.
- Copying another product's code, styles, names or brand.

## Decisions

The maintainer decided:

- The name is `DataGrid`, separate from `DataTable`.
- Dragging uses dnd-kit.
- The grid supports the full feature set below, including dragging rows onto other rows and dropping
  files from the desktop.

Calls made for the maintainer while they opted out of further questions. Each can be revisited:

- **Data.** Both modes. In client mode the app passes every row and the grid sorts, filters and
  searches. In server mode the app passes the rows loaded so far, the total, and a callback for the next
  page. The grid reports the query (sort, filters, match mode, search) and the app fetches however it
  likes. No data-fetching library is added.
- **Dependencies.** Add `@tanstack/react-virtual` (row virtualisation) and the stable dnd-kit line:
  `@dnd-kit/core` ^6.3.1, `@dnd-kit/sortable` ^10.0.0, `@dnd-kit/utilities` ^3.2.2. The newer
  `@dnd-kit/react` is still 0.x, so it is not used. Lock each new package to a version at least two
  weeks old at the time it is added. `@tanstack/react-table` stays on its current range; v9 already has
  every feature module the grid needs (filtering, ordering, pinning, sizing, resizing, visibility,
  selection, expanding).
- **Storage.** The grid reports its settings and accepts saved settings back through a small storage
  adapter. A browser-storage adapter ships with the library for apps without a server.
- **First consumer.** None is fixed, so the stories carry realistic, neutral sample data (an inventory
  list and a file list) and are the acceptance surface.
- **Releases.** Five minor releases, listed at the end, each usable on its own.
- **Selection scope.** Selection covers loaded rows. Select-all selects every loaded, selectable row.
  Any query change (sort, filter, match mode, search) clears the selection in both modes, so a selected
  row is never hidden and the snapshot and export never act on rows the user cannot see.
- **Layout persistence.** With a storage adapter, column order, widths, visibility and density save
  automatically, about a second after the last change, as the user's layout for that grid. "Reset
  layout" returns to the app's column definitions. There is no separate "save as default".
- **Density** is the user's choice, from the more menu, with the app's `density` as the default.
- **Search matching** is case-insensitive and unanchored: a term matches anywhere in a value, so `ab?d`
  matches "xabcdx". It reads each searchable column's text value, the same text export uses. The
  exported helper follows the same rules, so client and server results agree.

## Conventions

Everything in the library's existing conventions applies (see
`2026-11-02-component-expansion-design.md`, "Conventions every component follows"): token-only CSS
Modules, one-argument change callbacks, no `forwardRef`, stories composed in tests with axe, a
changeset per release, exports in `src/index.ts`, `test/dist/ui-dist.test.ts` and the README table. In
addition:

- The component lives in `packages/ui/src/components/DataGrid/` and may split into internal files and
  folders. Only the public surface is exported.
- Existing components are reused rather than restyled copies: `Checkbox`, `IconButton`, `Toolbar`,
  `Popover`, `Menu`, `Dialog`, `TextInput`, `Select`, `Segmented`, `Tag`, `Spinner`, `LiveRegion`.
  A multi-choice filter uses Base UI's `Combobox` with multiple selection.
- Every user-visible string has an English default and can be replaced through one `labels` prop.
  Strings with values in them (counts, names) are functions.

## Data and query

- `rows`, `columns` (built with a column helper, like `DataTable`'s), `getRowId` (required),
  `gridId` (required; names the stored settings).
- **Client mode** (default): the grid sorts, filters and searches `rows` itself.
- **Server mode** (`mode="server"`): `rows` are the rows loaded so far; `totalRowCount`, `hasMore`,
  `loadingMore`, `onLoadMore()`, and `onQueryChange(query)`. The grid never sorts or filters in this
  mode. A query change scrolls to the top and is the app's cue to start again from the first page; the
  previous rows stay visible until the app replaces them.
- `onLoadMore` fires when the user is within a few screens of the end of the loaded rows, and again
  if the loaded rows do not fill the viewport. A failed load is the app's to report: `loadError`
  shows an error row at the end with a retry button that calls `onLoadMore` again. Auto-loading
  pauses while `loadError` is set.
- Query shape: `{ sorting, filters: { [columnId]: value }, matchMode: 'all' | 'any', search }`.
  Typing in a text filter waits about 300ms before the query changes; search waits about 400ms, or
  runs at once on Enter or on clearing.
- `loading` (first load) and `emptyState` / `filteredEmptyState` overrides.

## Features

### Layout and look

- One card: header row, column header band, optional filter strip, scrolling body, footer.
- **Header row.** `heading` + `headingLevel` on the left. On the right, a labelled `Toolbar` of quiet
  icon buttons in this order: search, match toggle (only while filtering), filters (with a count
  badge), saved filters, columns, refresh (if `onRefresh` is given), more. Then an `actions` slot for
  the app's buttons (batch actions, "Add"). The cluster wraps on narrow screens; the heading does not.
  An icon button whose feature is active shows the accent state.
- **Column header band.** Small, semibold labels, a hairline under the band. The band stays in place
  while the body scrolls and follows it sideways.
- **Rows.** Hairline dividers, no stripes. Hover is a very faint tint. Selected and highlighted rows
  share an accent tint that deepens slightly on hover. Empty data cells show an em dash.
- **Density.** `density: 'comfortable' | 'compact'`. Comfortable rows are about 40px and wrap text;
  compact rows are about 34px, one line, with an ellipsis and the full value in a title.
- **Height.** The card shrinks to fit a few rows and stops growing at `maxHeight` (default about the
  viewport minus room for a page header), after which the body scrolls. It can also fill a parent.
- **Footer.** Right-aligned, small, muted: "Showing 50 of 1,240 rows" in server mode, "1,240 rows" or
  "12 of 1,240 rows" (filtered) in client mode. Hideable. A "loading more" line shows while
  `loadingMore`.
- **States.** First load: a centred spinner and message, header visible. Empty: a centred message, the
  header and its actions still usable. Filtered to nothing: a message and a "Clear filters" button that
  clears filters and search. All three are announced politely.
- **Narrow screens.** The body scrolls sideways; columns never shrink below about 60px.

### Sorting

- Activating a sortable header cycles ascending, descending, off. A glyph shows the direction and
  `aria-sort` states it. Shift with a click or Enter adds a secondary sort when `multiSort` is on.
- Sorting can be turned off for the grid or per column. Client sorting uses the same natural-order
  functions `DataTable` registers.

### Filtering and search

- A filter strip under the headers, hidden by default and toggled from the toolbar. Active filters
  apply while it is hidden.
- Each filterable column declares one filter type: `text` (contains), `select` (one value, with an
  "All" option) or `multiSelect` (any of several values). Each control is labelled "Filter by <column>".
- `matchMode`: combine different columns' filters with all (AND) or any (OR), from a `Segmented`
  toggle shown while filtering. Values inside one multi-select filter always combine with OR.
- Search: a toolbar button opens a search field with focus in it and a clear button. In client mode it
  matches the searchable columns' text, with `*` for any run of characters and `?` for one; a helper
  that turns a term into a `RegExp` is exported for apps to reuse on a server.
- The filter button's badge counts active filters plus the search.
- `initialQuery` presets filters, sort and search (for "view all" links) and wins over a saved default.

### Selection and row events

- `highlightOnClick`: a click highlights one row; clicking it again clears it. `highlightedRowId` and
  `onHighlightChange` make it controllable.
- `selectionMode: 'none' | 'multiple'`: a checkbox column with select-all (showing the mixed state),
  `isRowSelectable` per row, controlled or uncontrolled `selectedRowIds`. Space toggles the focused row.
  Shift with a click or Space selects a range from the last toggled row; Ctrl or Cmd with a click toggles
  one row.
- `onRowClick`, `onRowDoubleClick`, `onRowContextMenu`. Pressing Enter on a row cell counts as a click;
  the context menu key and Shift+F10 count as a context menu.

### Columns

- **Resize.** A handle on each header's trailing edge. By pointer: drag. By keyboard: the handle is a
  focusable separator with its width as its value; arrow keys change it, Home restores the default.
- **Reorder.** A grip on each header. By pointer and by keyboard (dnd-kit's keyboard sensor: Space to
  pick up, arrows to move, Space to drop, Escape to cancel), with announcements of each step. A floating
  copy of the header follows the pointer and its neighbours slide aside.
- **Show and hide.** A columns button opens a popover titled with the visible and total counts. It
  lists every column with a checkbox, adds a search field once there are about ten or more, and ends
  with "Show all" and "Hide all". If every column is hidden, the body says so and offers the same list.
- **Pinning.** The selection and expand columns stay at the start and the row actions column at the end
  while the body scrolls sideways. Apps may pin their own columns to the start or end by column
  definition; users do not pin.

### Row actions, menus and expansion

- `renderRowActions(row)` fills a narrow column pinned to the end; `rowActionsHeader` fills its header.
- The **more menu** holds: save current filter, density, reset layout, export, then the app's own
  items. Each app item receives a snapshot: selected rows (or the highlighted row), the
  query, the column layout, and `refresh`. Items can be disabled or marked as dangerous.
- **Expandable rows.** `renderExpandedRow(row)` adds an expand column with a chevron (a real button
  with `aria-expanded`), `isRowExpandable`, controlled or uncontrolled `expandedRowIds`. The detail
  panel spans the row under it on a slightly tinted surface. Expanded rows change height and the
  virtualiser measures them.

### Saved filters and layout

- A storage adapter: `{ load(gridId), save(gridId, settings) }`, both async. `createBrowserGridStorage()`
  ships as the browser-storage adapter. Without an adapter the save features are hidden.
- **Settings:** saved filters (name, query, layout, default flag) and the default layout (column order,
  widths, visibility, density).
- **Save filter** opens a `Dialog`: a required name up to 80 characters, a warning when the name matches
  an existing one (ignoring case), and "Use as my default".
- **Saved filters** popover: each entry applies on selection; the applied one is marked; the default
  shows a "Default" tag; each has a set-default toggle button and a delete button. Changing any filter
  unmarks the applied entry. Applying a saved filter also applies its saved layout.
- The default filter applies on load unless `initialQuery` is given or the user has already changed
  something.
- Saves are optimistic and roll back on failure; success and failure are announced, and
  `onSettingsError` tells the app.

### Export

- Export uses the visible columns in their current order and the current query.
- Client mode builds a CSV in the browser and downloads it: the selected rows if any, otherwise every
  row that matches. Columns declare how their value becomes text; a column without one is left out.
- Server mode calls `onExport({ query, selectedRowIds, columns })` and the app does the work.

### Dragging rows and dropping files

- **Rows onto rows.** `canDropOnRow(target, dragged)` and `onRowDrop(target, dragged)`, where
  `dragged` is always an array: the selected rows when the dragged row is selected, otherwise that row
  alone. The dragged rows fade, a small floating label follows the pointer (with a count for more than
  one), and a valid target shows an accent outline. Dropping onto a dragged row does nothing. Keyboard and screen-reader path: dnd-kit's keyboard sensor on a
  row grip, with announcements, plus a "Move to…" more-menu item the app can supply.
- **Files from the desktop.** `onFilesDrop(files)` shows a dashed accent overlay with a "Drop files"
  badge while files are dragged over the card. In-page drags do not trigger it. The overlay is an
  enhancement; apps keep an `Upload` or button path for keyboard users.

### Keyboard and screen readers

- The table is a `role="grid"` on native table markup, with `aria-rowcount` and `aria-rowindex` so
  virtualised rows report their real position, and `aria-colcount`/`aria-colindex`.
- One Tab stop for the whole grid (roving focus). Arrows move between cells; Home and End go to the
  row's ends; Ctrl+Home and Ctrl+End to the first and last cell; Page Up and Page Down move by a screen.
  Moving past the rendered rows scrolls and renders them.
- A body cell that holds interactive content: Enter or F2 moves focus into it, Escape returns to the
  cell, Tab moves between its controls. A body cell without interactive content: Enter counts as a row
  click.
- Headers are part of the grid. Enter on a sortable header sorts it (Shift+Enter adds a secondary
  sort). F2 moves focus into the header's controls, the reorder grip and the resize handle, where their
  own keys apply; Escape returns to the header.
- In the checkbox column Space toggles the row, and on the header toggles select-all. In the expand
  column Enter or Space toggles the row.
- Toolbar, popovers and dialogs follow the existing components' keyboard behaviour.
- Forced colours: focus, selection, highlight, drop targets and the drag overlay stay visible.

## Releases

Each release is a minor version of `@calcifer-design/ui`, with its own branch, review and simplifier
pass. Each one is useful on its own.

1. **Grid core.** Both data modes with sorting, the card and header, virtualised rows, density,
   height, footer, loading and empty states, keyboard grid navigation, highlight, checkbox selection,
   row events, row actions column, expandable rows. Adds `@tanstack/react-virtual`.
2. **Finding rows.** Filter strip with the three filter types, match mode, search with wildcards, the
   badge, filtered-empty state, `initialQuery`, and the query's debounce. Adds the optional
   `IconButton` pressed state and count badge, which the search and filter buttons are the first to
   need.
3. **Columns.** Resize, reorder, show and hide, pinning. Adds the dnd-kit packages.
4. **Saving and menus.** Storage adapter and browser adapter, saved filters, saved layout, the more
   menu with app items and snapshot, export. Adds the optional `Menu` danger tone and groups.
5. **Dragging rows and files.** Rows onto rows with the keyboard path, and the desktop file overlay.

## Done for each release

- `bun run check` is green: lint, typecheck, unit, dist and the Storybook build.
- Stories cover client and server modes with a mock server that delays and can fail.
- Tests compose the stories, run axe on each, and cover each keyboard path named above.
- A real-browser check in Chromium of scrolling, virtualisation, dragging and both themes.
- A whole-branch code review and a simplifier pass are complete, with their findings resolved.
- Nothing is merged or published without the maintainer's approval.

## Left to the builder

- Internal structure, hook boundaries and file layout.
- Exact prop names where this document describes a behaviour without naming a prop.
- Exact sizes, within the approximate values above, and which existing tokens express them.
- How many rows ahead to render and to start loading.
