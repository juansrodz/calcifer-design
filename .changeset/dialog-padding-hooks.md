---
'@calcifer-design/ui': minor
---

`Dialog` takes four padding hooks, set on a `ThemeScope` (whose portal host holds the popup) or another ancestor, as its heading hooks are:

- `--sheet-padding-block-start`, the space above the bottom sheet's grab handle;
- `--sheet-handle-gap`, the space between the handle and the header;
- `--sheet-padding-inline`, the bottom sheet's inline padding;
- `--drawer-padding-inline`, the end drawer's inline padding.

The gap defaults to `--space-4` and the paddings to `--space-5`, which is what each placement drew before, so no dialog changes until a hook is set, in any theme whose `--radius-dialog` is under about 68 px. Each hook takes a length with a unit: `0px`, not `0`, and no percentage. The padding sits inside the popup's 1 px border.

The space above a bottom sheet's first content was not a bug. It is the sheet's 24 px padding and 16 px gap around the handle, which these hooks now expose.

Under a thin inline padding, the header insets the close so that its 44 px touch target stays inside the popup's rounded corner. The body's focus-ring margin no longer scrolls the popup sideways. In the bottom sheet, keep `--sheet-padding-block-start` plus `--sheet-handle-gap` at 4 px or more at the default radius.
