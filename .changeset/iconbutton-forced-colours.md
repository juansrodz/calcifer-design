---
'@calcifer-design/ui': patch
---

`IconButton` and `LinkIconButton` read correctly under forced colours (Windows High Contrast). An audit of every variant, size and state in both themes found four defects, all in `IconButton`'s stylesheet; the default look is unchanged.

A disabled or loading button is now `GrayText`, the system's disabled colour, and no longer dimmed on top of it. The 45% dim took the glyph and the edge down to about 3:1 or under, and took a focused loading button's focus ring down to 2.4:1; a loading button, which is not natively disabled, was drawn in the ordinary text colour. A pressed button that is disabled or loading is filled `GrayText` instead of showing a dimmed `Highlight`, so it reads disabled while the fill still says pressed, and a loading one's spinner turns as a `Canvas` arc on that fill (the `Spinner` change in this release) instead of a token-coloured quarter that all but vanished.

The count badge gets a 1 px border in forced colours. Its fill is the page colour there, so it had no shape of its own and cut a gap in the button's border; it is 2 px larger in forced colours. A pressed badge names its border, `Highlight`, so the half that sits beyond the button no longer disappears into the page, and a disabled badge is `GrayText` with the button.
