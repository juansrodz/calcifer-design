---
'@calcifer-design/ui': patch
---

The house light `danger` the components inherit from `@calcifer-design/tokens` 0.6.0 is a step darker, `#C62F2F` (was `#D23B3B`), and its washes follow it. No ui stylesheet changes, but every light-mode danger use looks a little darker: a field's error message and required mark, a rejected upload's reason, a failed `ProgressBar`'s helper and fill, the invalid field's wash and ring, the invalid checkbox and radio edge, the `StatusDot`, the `Alert` and `Toast` rails, the `Alert` icon, the `Timeline` marker and the `Steps` error ring. The error text now reaches 4.5:1 on every page surface. Dark mode is unchanged.
