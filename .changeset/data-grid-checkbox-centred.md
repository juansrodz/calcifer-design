---
'@calcifer-design/ui': patch
---

`DataGrid`: the selection checkboxes sit at the centre of their cells. Before, each one sat on the cell's text baseline, about 3px above the centre unchecked and 1.7px checked, so ticking a box moved it; the boxes in the header and in every row are now blocks centred in the cell, checked or not. That baseline also stretched the line the box sat on, so in a grid with checkboxes a row whose other cells hold one line of text is now 1 to 4px shorter, and ticking a row no longer changes its height (at 1280px, comfortable rows were 50.4px unticked and 47.4px ticked; both are now 46.4px). The header band is 1 to 4px shorter for the same reason.
