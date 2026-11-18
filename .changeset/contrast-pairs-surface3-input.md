---
'@calcifer-design/tokens': patch
---

`uiContrastPairs` holds two more pairs to 3:1, so `checkThemeContrast` checks them for every theme: `borderControl` on `surface3`, the deepest surface a control sits on, and `danger` on `surfaceInput`, the fill an invalid checkbox or radio draws its `danger` boundary around. No value changes: the house theme clears both, `borderControl` at 3.26:1 in light and 4.82:1 in dark on `surface3`, `danger` at 4.74:1 in light and 5.93:1 in dark on `surfaceInput`. A theme whose `surface3` sits close to the inherited `borderControl` may now be reported, and should set its own `borderControl`.
