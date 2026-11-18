---
'@calcifer-design/ui': minor
---

`Collapsible` gains a `chevron` option and two trigger padding hooks. Nothing changes for an existing collapsible.

- `chevron` (new type `CollapsibleChevron`) chooses which way the chevron points, closed then open. The default, `'down-up'`, is today's: down while closed, up while open. `'end-down'` points to the reading end while closed (right, or left in a right-to-left page) and down at the panel while open, as a disclosure triangle does. The component reads the computed direction, so a `dir` on any ancestor, or a stylesheet's `direction`, is enough.
- `--collapsible-trigger-padding-block` and `--collapsible-trigger-padding-inline` pad the trigger row inside its edges. Like `--collapsible-heading-size`, they are set from a class on the root or on any wrapper (they inherit), take what `padding-block` and `padding-inline` take, and default to no padding. The padding is inside the button, so it is pointer target too and the focus ring goes round it.
- New stories: `ChevronEndDown`, `ChevronEndDownRightToLeft` and `TriggerPadding`.
