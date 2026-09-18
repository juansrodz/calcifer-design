---
'@calcifer-design/ui': minor
---

`NavMenu`'s dropdown now uses the same popup skin as `Popover`, `Dialog`, `Menu` and `Tooltip` instead of its own copy of half of it. Its props are unchanged, so nothing about this is breaking — but it is a deliberate change to how a published component looks and behaves, which on a pre-1.0 package is a minor rather than a patch, so it does not reach a `^0.2.x` consumer with no signal at all.

What changes: the popup's generated class name; the menu fades and scales as it opens and closes where it used to appear instantly, growing out of its trigger rather than its own centre, and collapsed to nothing under `prefers-reduced-motion` as all of this library's motion is; the dropdown now clamps to the viewport and scrolls inside itself (`max-width`/`max-height` from the positioner, with `overflow-y: auto` and `overscroll-behavior: contain`) instead of overflowing the window; `color` is set explicitly where it was inherited, with no change to the computed value; and Base UI's `[data-instant]` hook now suppresses the transition where Base UI asks it to. Item spacing is unchanged: the shared surface's `gap` is switched off for `data-popup='menu'`.
