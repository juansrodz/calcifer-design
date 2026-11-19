---
'@calcifer-design/ui': patch
---

Under forced colours (Windows High Contrast), the `DatePicker`'s month button at the end of its range is drawn like a disabled `IconButton`: a `GrayText` glyph and edge, no longer dimmed to 45%. Before, the dim left the glyph at 3.4:1 and the focus ring at 2.5:1 against the page. It stays focusable, shows its focus ring in full, and still shows no hover cue. The default look is unchanged.
