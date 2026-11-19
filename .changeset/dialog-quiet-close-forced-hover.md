---
'@calcifer-design/ui': patch
---

`Dialog`: under forced colours, a hovered close whose opening ring is held back (`quietFocus`) shows the same 3 px `Highlight` edge as any hovered close. When Chromium also marked that close `:focus-visible` (a quiet open with no trigger, or a mouse reopen from a keyboard-focused trigger), it showed only the browser's 1 px `Highlight` border on hover. Normal mode is unchanged.
