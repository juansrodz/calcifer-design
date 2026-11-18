---
'@calcifer-design/ui': patch
---

`DataGrid`: the row divider no longer goes missing, or jogs by a pixel, in the pinned columns (checkbox, expand and row actions) when rows sit at fractional pixel offsets, as they did on a phone with the filter strip open. Each row now draws the line above it, along the top edge of its cells, instead of the line under it along the bottom edge: the browser puts a pinned (sticky) cell's top edge on the same pixel as the rest of its row, but could round its bottom edge to the next pixel, where the next row's pinned cell covered the line or moved it. An open detail panel's lines are drawn the same way. Plain rows keep their heights; an open panel and the row after it are each half a pixel shorter, and an open panel at the end of the body has no line under it, like any last row. Each line sits on the other side of the same boundary, one pixel lower than before. Forced colours keep the row borders they drew before.
