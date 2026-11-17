---
'@calcifer-design/ui': minor
---

DataGrid can now find rows: a filter strip with text, select and multi-select filters, all/any matching, wildcard search, `initialQuery`, a controlled `query`, and a filtered-empty state. `IconButton` gains an optional pressed state and count badge. `onQueryChange` now also fires in client mode.

`dataGridSearchPattern` is exported, so a server can match a search term exactly as client mode does.

Existing grids look slightly different: selected and highlighted rows take the soft selected tint (`--color-selected-soft`), stronger than the accent wash they used before; the row divider is now drawn by each cell, so it stays unbroken across pinned columns and rows are about 1px shorter; and the loading, empty, filtered-empty and error rows keep their message and button inside the visible scroll area when the table is wider than it, as on a phone.
