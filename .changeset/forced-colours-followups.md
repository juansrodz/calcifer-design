---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), what you put inside a chosen or pressed control now follows that control's colours, and the link controls get a hover cue. The default look is unchanged.

A chosen `Button` or `LinkButton`, a chosen `Segmented` option, a pressed `IconButton` and a pressed `ToggleChip` keep their `Highlight` fill by opting out of the browser's recolouring. The content inside them was opted out too: a `Tag` in a badge kept its token pill, and an icon with its own colour fell to 1.3:1 on the fill. Now the content takes the control's ink: `HighlightText`, or `Canvas` on a disabled chosen control's `GrayText` fill. It has no fill of its own and draws any border in that ink, so a `Tag` reads as an outlined pill. This applies to everything inside a chosen `Button` (also while it is `pending`, except its spinner), to the badge and icon of a `Segmented` option, and to the icon of a pressed `IconButton` or `ToggleChip`.

The content of a loading `Button` and of a disabled `ChoiceCard` (its icon disc and description) now reads `GrayText` with the label. Before, it kept the system text colour.

Colours of your own give way to the control's ink there, whether they are inline or not, and so does a forced-colours system colour you chose. An SVG coloured by a `fill` attribute is not reached, so colour icons with `currentColor`.

A `Segmented` option now shows the hover cue a `Button` and a `ToggleChip` already have: its border turns `Highlight`. It has a 1 px border in forced colours only, so an option is 2 px wider there. A hovered `LinkButton` or `LinkIconButton` now gets the same `Highlight` border; a link showed no hover cue at all before. A hovered ghost `Button`'s border turns `Highlight` too, where it stayed in the text colour.
