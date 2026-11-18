---
'@calcifer-design/ui': patch
---

`TreeSelect`: the tree opens above or below its trigger and never beside it, as the `DatePicker` has since 0.8.0. Before, when neither side had room for the whole tree, as halfway down an end drawer at 1280 × 800, it fell back to the trigger's side, which in a drawer is over the scrim. It now takes the roomier of the two and fits itself to that space, scrolling if it must.
