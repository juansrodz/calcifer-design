---
'@calcifer-design/ui': patch
---

`Button`, `Spinner`, `ToggleChip` and `Segmented` read correctly under forced colours (Windows High Contrast). An audit of every variant, size and state in both themes found the same defects in each; the default look is unchanged.

`Spinner` is no longer a uniform ring there. Forced colours painted every border in the text colour, so nothing showed it turning, and an ancestor that opts out of the recolouring (a pressed control) let the token colours through. The head is now the ink the spinner inherits at the usual width and the track is a thinner `GrayText` ring, so the open arc that turns reads in either theme, in a `Button` and on a filled control alike.

A disabled `Button`, `ToggleChip` or `Segmented` option is now `GrayText`, the system's disabled colour, and no longer dimmed on top of it: the 45% dim took the label and the edge down to about 3:1. A loading `Button` was the ordinary text colour at 45% with its label at 70% (2.2:1); it is `GrayText` at full strength now. A pending `Button` keeps its ink and its spinner at full strength, as before, and its label stays hidden under the spinner when the button is also `loading`: forced colours turned the hiding ink into the system text colour, and the loading label's 70% then showed through.

A chosen `Button` (the `selected` tone) is a `Highlight` fill with `HighlightText` ink, as a pressed `IconButton` is: its `Highlight` border alone was only 1.9:1 (light) and 2.3:1 (dark) from the resting border, so it hardly showed. A chosen `Button`, pressed `ToggleChip` or chosen `Segmented` option that is disabled is a `GrayText` fill with a `Canvas` ink instead of a dimmed `Highlight` fill (2.4:1), so it reads disabled while its fill still says chosen.
