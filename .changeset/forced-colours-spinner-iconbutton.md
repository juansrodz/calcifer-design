---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), a `Spinner`'s track is now dotted under its solid head, as well as thinner and `GrayText`. Where one colour paints both, the head was told from the track by weight alone: in a loading `IconButton` both are `GrayText`, and a `Spinner` you put inside a chosen `Button`, `LinkButton` or `Segmented` option, or a pressed `ToggleChip` or `IconButton`, takes the control's ink all round. The dots now show which way the head turns there too. The default look is unchanged.

A pressed secondary `IconButton` no longer keeps its faint token border under forced colours: its edge is `Highlight`, the colour of its fill, as on a chosen `Button`.
