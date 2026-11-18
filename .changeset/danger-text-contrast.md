---
'@calcifer-design/tokens': minor
---

`danger` is now held to 4.5:1 as text. A field's error message, a rejected upload's reason, a failed `ProgressBar`'s helper and the required mark all paint `--color-danger` as text, and WCAG 1.4.3 asks 4.5:1 of text, but the pair lists held `danger` to the 3:1 of a non-text role. The four pairs `danger` on `surface1`, `surface2`, `surface3` and `surfaceRaised` move from `uiContrastPairs` to `textContrastPairs`, so `checkThemeContrast` now asks 4.5:1 of them for every theme. `danger` on `surfaceInput`, the boundary an invalid checkbox or radio draws around the input fill, stays a 3:1 ui pair.

The house light `danger` changes from `#D23B3B` to `#C62F2F`, the same hue a step darker: the old value was 3.91:1 on `surface3` and 4.24:1 on `surface2`; the new one is 4.50:1 on `surface3`, 4.88:1 on `surface2`, 5.23:1 on `surface1` and 5.46:1 on `surfaceRaised`. The light `dangerSurface` and `dangerBorder` washes are unchanged. The dark `danger` (`#F07070`) already clears 4.5:1 on all four, at 5.34:1 or better, and is unchanged.

A theme's own `checkThemeContrast` test can now report `danger` with `required: 4.5`. A theme that sets its own `danger`, or its own page surfaces under the inherited one, must give `danger` 4.5:1 on each of the four page surfaces in both modes; the least change is usually to darken a light `danger` (or lighten a dark one) on its own hue until the deepest surface, typically `surface3`, clears 4.5:1. Exempt a pair through `contrastExemptions` only if the app never draws a field, an upload or a progress bar on that surface.
