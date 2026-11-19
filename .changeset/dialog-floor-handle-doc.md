---
'@calcifer-design/ui': patch
---

`Dialog`'s docs say that the bottom sheet's 4 px floor for `--sheet-padding-block-start` plus `--sheet-handle-gap` assumes the default 5 px handle: a shorter `--sheet-handle-height` raises it by the difference.
