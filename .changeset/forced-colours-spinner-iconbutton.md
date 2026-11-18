---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), every `Spinner` now draws its track dotted under its solid head, including the ones `Button` (`loading`, `pending`), `IconButton` (`loading`) and `DataGrid` draw themselves. The track was already a thin `GrayText` ring; the dots are new. Where one colour paints both head and track, they were told apart by weight alone: in a loading `IconButton` both are `GrayText`, and a `Spinner` you put inside a chosen `Button`, `LinkButton` or `Segmented` option, or a pressed `ToggleChip` or `IconButton`, takes the control's ink all round. The dots now show where the head is there too. The default look is unchanged.

A pressed `IconButton`, whatever its variant, now draws its edge in `Highlight`, the colour of its fill, as a chosen `Button` does; a pressed secondary one no longer keeps its faint token border.
