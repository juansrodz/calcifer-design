---
'@calcifer-design/ui': patch
---

A sheet whose long body holds absolutely placed content (screen-reader-only text, a live region)
now swipes closed from its handle and header. The drag's transform made the popup that content's
containing block, so the content stretched the popup into a scroller and Drawer took the drag as a
scroll. The sheet's body is now `position: relative`, so it holds that content and clips it.
