---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), a hovered `DatePicker` day and a hovered `FilterBar` remove control now draw a 2 px `Highlight` edge. Before, forced colours dropped their hover tint and left no hover cue at all. The edge is drawn inside the cell or the circle, so nothing moves and no neighbouring day is covered; today's edge sits inside its 1 px border. A focused day or control keeps its focus ring in place of the edge, and an unavailable or chosen day shows no hover edge. `SearchField`'s clear control already had `IconButton`'s 3 px edge and is unchanged. The default look is unchanged.
