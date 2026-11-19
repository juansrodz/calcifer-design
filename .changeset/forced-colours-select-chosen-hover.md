---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), the chosen `Select` option takes the same `Highlight` fill as the other options when it is highlighted, and its check mark stays on the fill in `HighlightText`. Before, it showed no hover cue. Base UI highlights the chosen option when the popup opens, so it opens filled, as it opens tinted outside forced colours. The default look is unchanged.
