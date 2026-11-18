---
'@calcifer-design/ui': patch
---

`DataGrid`: the focus ring of the server-mode error row (the message and its Try again button) stays in view on a narrow screen. The row's cell spans the whole table, which can be wider than the scroll area, so on a phone the ring along its far edge was off-screen; the ring is now drawn on the box that keeps the message and button in view, in either reading direction, and that box carries the cell's vertical padding so the ring keeps clear of the button.
