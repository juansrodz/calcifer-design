---
'@calcifer-design/ui': minor
---

`Dialog` takes ten consumer hooks for its padding, set on a `ThemeScope` (whose portal host holds the popup) or another ancestor, as the heading hooks are. `--dialog-padding-block-start`, `--dialog-padding-block-end` and `--dialog-padding-inline` pad every placement. `--sheet-padding-*` (the same three edges) pads the bottom sheet over them, and `--drawer-padding-*` pads the end drawer (`side="end"`); a `--sheet-padding-*` hook never reaches the drawer. Each takes a length or a percentage, a bare `0` included, and defaults to `--space-5` (24 px), the padding every placement drew before. The padding sits inside the popup's 1 px border. `--sheet-handle-gap` sets the space between the bottom sheet's grab handle and its header, defaulting to the sheet's `--space-4` gap. The bottom sheet's block-start padding is the space above its handle, so `--sheet-padding-block-start` and `--sheet-handle-gap` together set how far down its first content starts.

The space above the bottom sheet's first content was not a bug: it was the sheet's 24 px padding above the handle and its 16 px gap under it, the same padding and gap every placement uses. The hooks expose both instead of changing them.

The close keeps its 36 px circle and its 44 px touch target inside the popup under any padding: where an edge's padding is under the 4 px the target reaches past the circle, the header pads the difference on that edge. With no hook set, every dialog, sheet and drawer looks as it did.
