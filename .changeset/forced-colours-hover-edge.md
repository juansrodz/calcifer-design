---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), a hovered `Button`, `LinkButton`, `IconButton` or `LinkIconButton` now thickens its edge to 3 px as well as turning it `Highlight`. The colour change alone was faint in High Contrast White, where the link and button text colours sit close to `Highlight`. The thicker edge is drawn inside the control, so nothing moves, and it stays clear of the focus ring, which is drawn outside it. A focused control keeps its focus ring on hover instead. A chosen `Button` or pressed `IconButton` keeps its fill alone, and a disabled one shows no hover cue, as before. The default look is unchanged.
