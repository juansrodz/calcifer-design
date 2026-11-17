---
'@calcifer-design/tokens': minor
---

Add `color.borderControl` (`--color-border-control`), an opaque boundary for a control known by its outline alone: the unchecked checkbox and the radio. It is `#857F79` in light and `#8A909C` in dark. `borderStrong` is a translucent hairline that falls to about 1.1–1.4:1 on a raised surface; WCAG 1.4.11 asks 3:1 of a control's boundary. The component pair list now holds `borderControl` to 3:1 on `surface1`, `surface2`, `surfaceRaised` and `surfaceInput`, so `checkThemeContrast` checks it for every theme: the house values clear it at 3.54:1 or better in light and 5.35:1 or better in dark. A theme that overrides those surfaces may need to set `borderControl` too, and the check will say so.
