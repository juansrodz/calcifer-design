---
'@calcifer-design/tokens': minor
---

`uiContrastPairs` holds two more pairs to 3:1, so `checkThemeContrast` checks them for every theme: `borderControl` on `surface3`, the deepest surface a control sits on, and `danger` on `surfaceInput`, the fill an invalid checkbox or radio draws its `danger` boundary around. No value changes: the house theme clears both, `borderControl` at 3.26:1 in light and 4.82:1 in dark on `surface3`, `danger` at 4.74:1 in light and 5.93:1 in dark on `surfaceInput`. The check is stricter, so a theme's own `checkThemeContrast` test can now fail on either pair. A theme whose `surface3` sits close to the inherited `borderControl` should set its own `borderControl`: WBW's dark `surface3` (`#4A4A51`) measures 2.74:1 against the inherited `#8A909C`, and `#9298A4` clears it at 3.03:1 while keeping 3:1 on every other surface. A theme whose `surfaceInput` sits close to `danger` should set its own `danger` the same way.
