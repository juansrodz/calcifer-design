---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), a hovered interactive `Card`, toast action, `Upload` drop zone and `Tree` row now draw a `Highlight` edge. Before, forced colours dropped their hover tint or shadow: a `Tree` row and the `Upload` zone showed no hover cue at all, an interactive `Card` only moved 2 px, and a toast action only recoloured its 1 px border. The edge is an outline drawn inside the box, so nothing moves: 3 px with the border on the card, the action and the zone, as on `Button`, and 2 px on a `Tree` row. A focused control keeps its focus ring in place of the edge; a disabled or selected row, a disabled zone and a plain `Card` show none. An `IconButton` marked `aria-disabled`, such as the `DatePicker`'s month button at the end of its range, no longer shows the hover edge. The default look is unchanged.
