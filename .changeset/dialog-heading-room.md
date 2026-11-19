---
'@calcifer-design/ui': patch
---

`Dialog`'s heading no longer runs on under the close circle or a `headerEnd` control at large text sizes (200% text on a 390 px phone). The heading is never narrower than its longest word: when that word does not fit beside the end group, the header row wraps and the end group takes a row of its own, so the heading reads in whole words. Only a word wider than the whole row breaks, inside that row. The close keeps its 36 px circle. Nothing moves while the row fits.
