---
'@calcifer-design/ui': patch
---

`Select`: a keyboard-focused disabled option draws its focus ring at full strength, 4.63:1 against the popup in light and 7.45:1 in dark (it was 1.87:1 and 2.49:1, dimmed with the option). The 45% dim now falls on the option's text and check mark instead of the row that draws the ring, and the highlight's tint behind a focused disabled option is mixed down to the same 45%, so nothing else changes in normal mode (glyph pixels on that tint move by at most 5/255). Under forced colours the check mark of a chosen, disabled option is `GrayText` like the rest of the option, not `CanvasText`.
