---
'@calcifer-design/ui': minor
---

Add seven components for structuring a page.

- `ViewField`: one read-only label and value, stacked or inline, showing an em dash (or your own `emptyText`) when there is no value. `0` counts as a value.
- `Descriptions`: a set of label and value pairs in one `<dl>`, in one to three columns that collapse to one at narrow widths. An item can span columns, and a `heading` names the list.
- `PageShell`: a page's landmarks, in reading order, behind a skip link: `header`, an optional named `aside`, a focusable `main` and `footer`. The sidebar stacks above the content at narrow widths.
- `Segmented`: choose exactly one of a few options, on Base UI's `ToggleGroup`. Pressing the active option never clears it. With no `value` or `defaultValue`, the first enabled option starts out chosen.
- `Breadcrumb`: `nav > ol` with the last item as plain text marked `aria-current="page"`. Long trails wrap, and `renderLink` supplies router links the way `NavMenu`'s does.
- `Toolbar`, with `ToolbarButton`, `ToolbarGroup` and `ToolbarSeparator`: one tab stop whose arrow keys move focus, on Base UI's `Toolbar`. A `ToolbarButton` wears `Button` or `IconButton` through `render`, and a disabled one stays focusable so its name can still be read.
- `Steps`: a progress display as an `ol`, with `aria-current="step"` on the current item and each status stated in text for screen readers, not by colour alone. `statusLabels` translates those words. Horizontal steps stack at narrow widths.
