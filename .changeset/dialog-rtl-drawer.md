---
'@calcifer-design/ui': patch
---

`Dialog`'s end drawer (`variant="sheet" side="end"`) under `dir="rtl"`: it rounds its free inline-start corners (the right pair) and slides in from the left, the edge it docks to. It had rounded the corners that meet the viewport and slid in from the right. Left-to-right pages are unchanged.
