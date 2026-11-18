---
'@calcifer-design/ui': patch
---

`Upload`: a disabled drop zone keeps its hint ("or drop it here") readable. The whole zone used to go translucent, which took the hint down to about 2.6:1 in light themes and 3.1:1 in dark ones; now only the frame's dashed border and fill dim (by the same 0.55), the button dims as any disabled `Button` does, and the hint stays at `--color-text-muted`, at 4.5:1 or better on the dimmed frame in every theme. An invalid disabled zone keeps its danger colours, dimmed. A browser without `color-mix()` keeps the old look. An enabled zone is unchanged.
