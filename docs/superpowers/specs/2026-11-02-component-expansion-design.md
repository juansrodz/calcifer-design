# Component expansion: page structure, forms, data display

## Intent

`@calcifer-design/ui` has 27 components. It should cover the everyday needs of a business-style web
app as well: page structure, richer form controls and data display. This document adds 17 components
in three groups. Each group is its own branch and its own minor release, so the work can stop after
any of them.

## Goals

- Every component is original work for this library: new code, styles, tests and stories, written
  from this document and the conventions of this repository.
- Base UI (`@base-ui/react`, staying on `^1.8.0`) is the foundation wherever it has a matching part.
- Every component works by keyboard, passes axe, works in both themes, works at 390px and honours
  reduced motion.

## Non-goals

- Product-specific components: notification bells, sharing, record metadata, task progress.
- A document viewer, file manager or rich text editor. Each is its own project.
- Any change to the published API of the existing 27 components, except what is named below.
- Any new runtime dependency. A component that seems to need one stops and asks.
- Base UI's `internals/*` entry points, which are not public API.

## Conventions every component follows

- Folder `packages/ui/src/components/<Name>/` holding `<Name>.tsx`, `<Name>.module.css`, the generated
  `.module.css.d.ts`, `<Name>.stories.tsx` and `<Name>.test.tsx`.
- Tests compose the stories and run axe on each one, as `Switch.test.tsx` does.
- Styles use tokens only. Field-like controls wear `styles/field.module.css`, and floating surfaces
  wear `styles/popup.module.css`. New tokens are a last resort and go through the tokens package.
- A heading slot is `heading` + `headingLevel`.
- Change callbacks take one argument: `onValueChange(value)`, not Base UI's `(value, eventDetails)`.
- No `forwardRef`, and no `ref` on any control, as `Field.tsx` records.
- Field-like controls extend `FieldFrameProps` and reuse `FieldMessages` and `RequiredMark`.
- Links are customisable the way `NavMenu` does it, using `LinkRenderProps`, so a router can supply
  them.
- A list drawn with `list-style: none` outside a `nav` sets `role="list"` on its `ol` or `ul`, with a
  comment saying why: WebKit drops list semantics otherwise. `Steps` set the pattern, and `Timeline`
  and `CardList` follow it.
- Each component is exported from `src/index.ts`, added to `test/dist/ui-dist.test.ts` and listed in
  the root `README.md` table.
- Each group adds one `minor` changeset for `@calcifer-design/ui`.

## Group 1: page structure (branch `epsilon/page-structure`)

| Component      | Foundation                      | Behaviour                                                                                                                                                                                                                                                                                                     |
| -------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ViewField`    | Markup on tokens                | One read-only label and value. `label`, `children`, `layout: 'stacked' \| 'inline'` (default stacked), `emptyText` (default an em dash, shown for `undefined`, `null`, `false` and `''`). Renders `dl > div > dt + dd`.                                                                                       |
| `Descriptions` | Markup on tokens                | A set of label and value pairs. `items: { id, label, value, span? }[]`, `columns: 1 \| 2 \| 3` (default 2, one column at narrow widths), `heading`, `headingLevel`, `emptyText`. One `<dl>`; a heading names it via `aria-labelledby`.                                                                        |
| `PageShell`    | `SkipLink`                      | The page's landmarks. `header`, `sidebar`, `sidebarLabel` (required with `sidebar`), `footer`, `children`, `mainId` (default `main`), `skipLinkLabel`. Renders the skip link, then `header`, `aside`, `main` (focusable as the skip target), `footer`. The sidebar stacks above the content at narrow widths. |
| `Segmented`    | Base UI `ToggleGroup`, `Toggle` | Choose exactly one of a few options. `options: { value, label, icon?, disabled? }[]`, `value`, `defaultValue`, `onValueChange(value)`, `aria-label` or `aria-labelledby` (one required by the type), `size: 'sm' \| 'md'`. Pressing the active option never clears it.                                        |
| `Breadcrumb`   | Markup on tokens                | `items: { label, href? }[]`, `aria-label` (default `Breadcrumb`), `renderLink`. Renders `nav > ol`; the last item is plain text with `aria-current="page"`. Separators are decorative. Long trails wrap.                                                                                                      |
| `Toolbar`      | Base UI `Toolbar`               | Exports `Toolbar` (requires `aria-label`, `orientation`), `ToolbarButton`, `ToolbarGroup` and `ToolbarSeparator`. Arrow keys move focus between controls. `ToolbarButton` keeps the look of `Button` or `IconButton` through `render`.                                                                        |
| `Steps`        | Markup on tokens                | Progress display only. `items: { id, title, description? }[]`, `current` (zero-based), `currentStatus: 'active' \| 'error'`, `orientation`, `aria-label`. Renders `ol`, marks the current item `aria-current="step"`, and states each status in text available to screen readers, never by colour alone.      |

## Group 2: forms (branch `epsilon/forms`, stacked on group 1)

| Component    | Foundation                                    | Behaviour                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TextArea`   | Base UI `Input` rendering `<textarea>`        | Goes inside `Field`, like `TextInput`. `value`, `defaultValue`, `onValueChange`, `rows` (default 4), `autoResize` (uses CSS `field-sizing: content` where supported and stays a normal resizable textarea elsewhere).                                                                                                                                                                                                                                                                                                                                                                       |
| `Form`       | Base UI `Form`                                | `onSubmit(values)` with the values as a plain object, `errors: Record<string, string>` keyed by field `name`, `noValidate` (default true), `children`. An entry in `errors` shows on the matching `Field`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `DatePicker`, `TimePicker` or `Upload`, marks it invalid, and is cleared as Base UI clears it. An explicit `error` prop wins. On submit, focus moves to the first invalid control.                                                                                                                                                 |
| `DatePicker` | Base UI `Field`, `Popover`; own calendar grid | Base UI has no public calendar, so the grid is ours and follows the WAI-ARIA date picker dialog pattern. Extends `FieldFrameProps`. `value`, `defaultValue` and `onValueChange` use `YYYY-MM-DD` strings or `null`. `min`, `max`, `isDateDisabled`, `locale`, `weekStartsOn`, `clearable`. A trigger button shows the formatted date and opens the grid. Arrow keys, Home, End, PageUp and PageDown navigate. Date arithmetic and formatting use the platform (`Date`, `Intl.DateTimeFormat`), working in local dates so no value shifts across time zones. Submits through a hidden input. |
| `TimePicker` | Base UI `Input` rendering `type="time"`       | Goes inside `Field`. The native control is the choice here: it handles locale, 12/24-hour entry, keyboard and mobile wheels well. `value`, `defaultValue`, `onValueChange` (`HH:mm`), `min`, `max`, `step`.                                                                                                                                                                                                                                                                                                                                                                                 |
| `Upload`     | Base UI `Field`, native file input, `Button`  | Selects files; it does not transfer them. Extends `FieldFrameProps`. `files`, `defaultFiles`, `onFilesChange(files)`, `accept`, `multiple`, `maxSizeBytes`, `onReject(rejections)` with a reason per file. A real file input is the keyboard and screen-reader path, and the drop zone is an enhancement over it. Lists chosen files with a named remove button for each. Announces changes through `LiveRegion`.                                                                                                                                                                           |

## Group 3: data display (branch `epsilon/data-display`, stacked on group 2)

| Component    | Foundation                                 | Behaviour                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tree`       | Own markup (Base UI has no tree)           | The WAI-ARIA tree view pattern. `items: { id, label, icon?, disabled?, children? }[]`; `expandedIds`, `defaultExpandedIds`, `onExpandedChange(ids)`; `selectionMode: 'none' \| 'single' \| 'multiple'`; `selectedIds`, `defaultSelectedIds`, `onSelectedChange(ids)`; `aria-label` or `aria-labelledby` required. Roving tabindex, arrows, Home, End, type-ahead. Items are static data; lazy loading is out of scope. |
| `TreeSelect` | Base UI `Field`, `Popover`; `Tree`         | Choose one node from a hierarchy. Extends `FieldFrameProps`. `items`, `value`, `defaultValue`, `onValueChange(id \| null)`, `placeholder`, `clearable`. The trigger wears `.control`. Selecting closes the popup and returns focus. Submits through a hidden input.                                                                                                                                                    |
| `FilterBar`  | `TextInput`, `Tag`, `Button`, `LiveRegion` | The row above a results list. `searchValue`, `onSearchChange`, `searchLabel`; `children` as slots for filter controls; `activeFilters: { id, label }[]` shown as chips with named remove buttons; `onRemoveFilter(id)`, `onClearAll`; `resultCount`, announced politely when it changes. Holds no filter logic. Wraps at narrow widths.                                                                                |
| `CardList`   | Markup on tokens, `Skeleton`               | A responsive list of cards. Generic over the item type. `items`, `getKey`, `renderItem`, `minColumnWidth`, `loading`, `skeletonCount`, `emptyState`, `aria-label`. Renders `ul > li` on a CSS grid. Exposes `aria-busy` while loading.                                                                                                                                                                                 |
| `Timeline`   | Markup on tokens                           | A chronological record. `items: { id, title, timestamp?, description?, tone? }[]` where `timestamp` is ISO 8601 and renders in `<time>`, formatted with `Intl` using an optional `locale`. `tone` is `neutral`, `accent`, `success` or `danger`, stated in text as well as colour. Renders `ol`.                                                                                                                       |

## Done for each group

- `bun run check` is green, including lint, typecheck, unit, dist and the Storybook build.
- A whole-branch code review and a simplifier pass are complete, with their findings resolved.
- Nothing is merged or published without the maintainer's approval.
