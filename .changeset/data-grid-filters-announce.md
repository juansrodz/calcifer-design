---
'@calcifer-design/ui': minor
---

`DataGrid` gains `enableFilters` and announces its result counts.

- `enableFilters` (default `true`, so nothing changes for existing grids) turns off the grid's own filter controls: the filters button with its badge, the filter strip it opens (the sticky second header row and its keyboard row) and the All / Any switch. A column's `filter` still applies, from a controlled `query` or `initialQuery`, so an app that sets a column's filter from its own tabs over the grid keeps the grid's matching without a second set of filter controls. The search is unaffected.
- When a change to the search, a filter or the match mode settles, the grid's live region announces, politely, how many rows it found: 500ms after the last such change, and in server mode once the new query's rows have arrived (while `loading` is set, or while the rows on screen still answer the old query, it waits). It says nothing on the first render, for a sort, for pages loaded as the user scrolls, or for rows the app replaces under the same query. A loading, empty or filtered-empty state, or a failed first page, speaks its own message instead. The same count is spoken again for a new change, as the region is cleared at each change.
- New label `resultCount(count, moreToLoad)`, by default "24 rows found", or "More than 50 rows found" in server mode when the app gives no `totalRowCount` and says `hasMore`. In server mode the count is `totalRowCount`, or else the rows loaded. A `Partial` `labels` object needs nothing; code that builds a whole `DataGridLabels` object must add the key.
- New stories: `FiltersOff` (an app's tabs drive the Status filter with `enableFilters={false}`) and `ResultAnnouncement` (shows the last announcement under the grid).
