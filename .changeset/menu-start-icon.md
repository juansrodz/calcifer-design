---
'@calcifer-design/ui': minor
---

`Menu` items take a `startIcon`: an icon or a small avatar before the label, in a decorative slot hidden from assistive technology. The item's name and its typeahead match stay the `label`. Under forced colours, the hovered item's content takes its `HighlightText` ink, borders and backgrounds included, so a tinted icon or an avatar's fill is not left in its own colour on the `Highlight` fill. A literal `fill` or `stroke` attribute, a shadow or an image is drawn as authored, so an icon should paint with `currentColor`. A disabled item's icon takes the item's colour, its label's: the subtle text colour, and `GrayText` under forced colours. An item without the prop renders as before.
