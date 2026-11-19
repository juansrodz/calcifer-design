---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), the item under the pointer in a `Menu`, a `Select` popup or `NavMenu`'s small-screen menu now takes the system highlight, a `Highlight` fill with `HighlightText` text, as the platform's own menus do. Before, forced colours dropped the highlight's tint and left no hover cue at all. A hovered `Select` trigger draws a 3 px `Highlight` edge, as `Button` does, and `NavMenu`'s menu button the same edge, where neither showed any change; and a hovered `NavMenu` link gains a 2 px underline. The edges are drawn inside the box, so nothing moves. A focused item or control keeps its focus ring in place of the cue, and a disabled item, the chosen option and the current page's link or item show none. `Breadcrumb` is unchanged: its links already drop their underline on hover. The default look is unchanged.
