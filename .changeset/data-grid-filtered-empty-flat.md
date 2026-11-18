---
'@calcifer-design/ui': patch
---

`DataGrid`: the filtered-empty state sits flat in the grid's body. It used to draw `EmptyState`'s raised card inside the grid's card: almost invisible in dark mode, a card in a card in light. It now renders the empty state `bare`, on the grid's own surface. A `filteredEmptyState` the app passes is unchanged.
