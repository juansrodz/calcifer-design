---
'@calcifer-design/ui': patch
---

What you put inside a `Button`, `LinkButton`, `Segmented` option, `ToggleChip` or `ChoiceCard` now follows the control's colours under forced colours (Windows High Contrast). The default look is unchanged.

A chosen `Button` or `LinkButton`, a chosen `Segmented` option and a pressed `ToggleChip` keep their `Highlight` fill by opting out of the browser's recolouring, and the content inside them was opted out too. A `Tag` in a badge kept its token pill, and an icon with its own colour fell to 1.3:1 on the fill. That content now takes the control's ink (`HighlightText`, or `Canvas` on a disabled chosen control's `GrayText` fill), has no fill of its own and draws any border in the same ink, so a `Tag` reads as an outlined pill. The content of a disabled or loading `Button` and of a disabled `ChoiceCard` (its icon disc and description) now reads `GrayText` with the label, where it used to keep the system text colour. Colours set with an inline `style` still take precedence.

A `Segmented` option now shows the hover cue a `Button` and a `ToggleChip` already have: its border turns `Highlight`. It has a 1 px border in forced colours only, so an option is 2 px wider there. A hovered `LinkButton` now gets the same `Highlight` border. Before, a link showed no hover cue at all.
