---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), a hovered `ToggleChip` now thickens its edge to 3 px as well as turning it `Highlight`, as `Button` and `IconButton` do. The colour change alone was faint in High Contrast White. The thicker edge is drawn inside the chip, so nothing moves, and it stays clear of the focus ring outside it. A focused chip keeps its focus ring on hover, in place of the thicker edge. A pressed chip keeps its fill alone, and a disabled one shows no hover cue, as before. `AvatarGroup`'s `+N` chip also gets a 1 px edge in the system text colour there, since forced colours drop its fill and ring. The default look is unchanged.
