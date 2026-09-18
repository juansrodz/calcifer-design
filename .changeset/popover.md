---
'@calcifer-design/ui': minor
---

Add `Popover`: an anchored dialog with a heading, an optional description and collision-aware placement. Setting `modal` also renders a visually-hidden close control, because Base UI only arms its focus trap when a close part is present inside the popup — `modal` alone traps nothing. `modal={true}` paints a scrim; `modal="trap-focus"` does not, because that mode leaves page scroll and outside clicks working and a full-viewport backdrop would swallow both. Its surface, viewport clamp and entry transition come from a shared popup skin that `Dialog`, `Menu` and `Tooltip` wear too. That skin also fixes the tier's stacking order in one place: anchored popups and dialogs both sit at `z-index: 50`, so the order their portals open is what decides which one nests above which, while toasts sit at `70` above them both — so chrome of your own given a `z-index` between the two paints above every dialog and below every toast.

That scrim is `var(--color-scrim)`, new in `@calcifer-design/tokens@0.2.0`. An app that imports `tokens.css` from its own top-level dependency must move that dependency to `^0.2.0` as well — the range inside this package only nests a second copy nobody imports, and a missing custom property falls back to `transparent` with no error anywhere.
