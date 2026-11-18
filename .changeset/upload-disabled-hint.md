---
'@calcifer-design/ui': patch
---

`Upload`: a disabled drop zone keeps its hint ("or drop it here") readable. The dashed face used to go translucent, hint and all, which took the hint down to about 2.6:1 in light and 3.1:1 in dark. Now only the face's dashed border and fill dim (by the same 0.55), and the hint stays at `--color-text-muted`, at 4.5:1 or better on the dimmed face in the house and demo themes, light and dark. The button dims once, as any disabled `Button` does (0.45, where it used to compound to about 0.25), so it is visibly a little stronger than before. An invalid disabled zone keeps its danger colours, dimmed. Under forced colours the disabled face's edge is `GrayText` (an invalid one keeps the text colour). A browser without `color-mix()` keeps the old look. An enabled zone is unchanged.
