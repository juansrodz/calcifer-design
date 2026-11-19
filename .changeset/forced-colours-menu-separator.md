---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), the `Menu` separator is drawn in `CanvasText`. Before, forced colours erased its 1 px fill and the groups it parts ran together. The default look is unchanged.
