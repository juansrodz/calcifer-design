---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), a disabled `Menu` item is drawn in `GrayText`. Before, the browser replaced its subtle text colour with the same `CanvasText` as the enabled items, so it did not read as disabled. It still shows no hover cue. The default look is unchanged.
