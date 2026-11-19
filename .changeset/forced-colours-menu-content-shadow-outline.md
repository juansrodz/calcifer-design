---
'@calcifer-design/ui': patch
---

Under forced colours, the content of a hovered `Menu` or `NavMenu` item drops its shadows and draws its outlines in the item's `HighlightText`, as the browser does everywhere outside the item's opt-out. An `AvatarGroup` in a `Menu` item's `startIcon` painted its ring in a theme colour on the `Highlight` fill (2.0 to 2.4:1 when the system scheme and the app's theme differ), and an avatar's edge disappeared; the avatars and the `+N` chip now keep a 1 px `HighlightText` edge, matching their `CanvasText` edge at rest. Normal mode is unchanged.
