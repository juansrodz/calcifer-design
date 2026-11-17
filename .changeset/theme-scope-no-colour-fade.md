---
'@calcifer-design/ui': patch
---

`ThemeScope`: when its `mode` changes, every transition inside the scope (its portalled dialogs, menus and toasts included) is held still for the frame of the change, so text that transitions its colour, such as `NavMenu`'s links, `Segmented` and the icon buttons, flips in the same frame as the surface behind it. Before, that text faded over `--motion-duration-1` (about 120 ms) from its old colour while the surface changed at once, and for that window the pairing could fall below 4.5:1. Transitions run as before from the next frame on, and `prefers-reduced-motion` is unchanged. The scope marks itself with a `data-theme-changing` attribute for that frame; nothing is injected into the document, so a strict `style-src` is not involved. A mode change that comes only from `<html>`'s `data-theme` or the OS preference, under an unpinned scope, is not covered: the page's own theme setter owns that change.
