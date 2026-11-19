---
'@calcifer-design/ui': patch
---

`Dialog` warns in a development build (`console.warn`, dropped by a consumer's production build as `TabBar`'s is) when a padding hook (`--sheet-padding-block-start`, `--sheet-padding-inline`, `--sheet-handle-gap` on the bottom sheet, `--drawer-padding-inline` on the end drawer) is a bare number such as `0`, which the dialog cannot use: write `0px`.
