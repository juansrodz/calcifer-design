---
'@calcifer-design/ui': minor
---

`Switch` gains two unchecked-track hooks, and `ToggleChip` and `ToggleChipGroup` gain a smaller size and a choice of where the check goes. Existing chips look the same as before. An unchecked switch's border is now darker (below).

- `--switch-track-unchecked-background` and `--switch-track-unchecked-border-color` set an unchecked switch's track fill and border colour. Set them from a class on any ancestor (they inherit). They default to today's `--color-surface-3` fill and the control border colour. A checked switch is the accent whatever they say. The border hook takes a colour, not a shorthand, so the track keeps its 1 px border and the thumb's travel. To draw no visible edge, set it to the fill or to `transparent`; forced colours still paint it. A consumer that sets either hook is responsible for 3:1 against its own surface (WCAG 1.4.11).
- An unchecked switch's default border is now `--color-border-control`, the opaque colour the checkbox and radio already use, in place of the `--color-border-strong` hairline. The hairline measured 1.44 to 1.78:1 on the five surfaces, under the 3:1 that WCAG 1.4.11 asks of a control known by its boundary. The control colour measures 3.26:1 or more in both modes. A tokens sheet older than 0.4.0 still gets the hairline.
- `size` (new type `ToggleChipSize`) on `ToggleChip` and `ToggleChipGroup`: `'md'`, the default, is today's chip, 32 px tall in the 14 px type (42 px with an icon). `'sm'` is 28 px in the 12 px type (36 px with an icon). Both are past WCAG 2.5.8's 24 px minimum target.
- `checkPosition` (new type `ToggleChipCheckPosition`) on a multiple `ToggleChipGroup`: `'end'`, the default, draws a pressed chip's check after its label, as today. `'start'` draws it before the label, after any icon. Both follow the reading direction, so a right-to-left page mirrors them.
- New stories: `Switch` `UncheckedTrack`; `ToggleChip` `Small`, `CheckAtStart` and `CheckAtStartRightToLeft`.
