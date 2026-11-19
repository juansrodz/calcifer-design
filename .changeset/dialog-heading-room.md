---
'@calcifer-design/ui': patch
---

`Dialog`'s heading no longer runs on under the close circle or a `headerEnd` control at large text sizes (200% text on a 390 px phone): a word wider than the room beside the end group breaks inside it, and when less than three of the heading's ems are left beside a `headerStart` and the end group, the header row wraps. The close keeps its 36 px circle. Nothing moves while the row fits.
