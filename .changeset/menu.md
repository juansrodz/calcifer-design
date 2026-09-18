---
'@calcifer-design/ui': minor
---

Add `Menu`: a list of actions anchored to a trigger, on the same popup skin as `Popover`, with roving focus, typeahead and optional separators supplied by Base UI. `modal` defaults to `false` rather than Base UI's `true`: a menu hanging off a toolbar button has no business locking page scroll, and `NavMenu` already made the same call.
