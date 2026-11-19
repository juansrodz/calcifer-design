---
'@calcifer-design/ui': patch
---

`Dialog`: a body that overflows as the dialog opens is a Tab stop from the first commit, before the browser paints it. It waited for its first resize report, a frame later, and for that frame it was a scroller with no keyboard access, which an accessibility check run as the dialog opens reported as `scrollable-region-focusable`.
