---
'@calcifer-design/ui': minor
---

Three accessibility and placement fixes from the redesign's visual checks.

- `DatePicker`: the calendar opens above or below its trigger and never beside it. Before, when neither side had room, as halfway down an end drawer at 1280 × 800, it fell back to the trigger's side, which in a drawer is over the scrim. It now takes the roomier of the two and fits itself to that space, scrolling if it must, as other popups do. Below its trigger the calendar no longer keeps an empty sixth week of room, so a four or five-week month is shorter there; above it the room stays, so the month buttons do not move under the pointer.
- `Dialog`: the popup carries `aria-modal="true"`. The page behind was already hidden from assistive technology (`aria-hidden`) while the dialog is open, and this is unchanged.
- `Checkbox` and `RadioGroup` (and the `DataGrid` row checkbox, which shares the rule): the unchecked boundary reads the new `--color-border-control` instead of `--color-border-strong`, so it reaches WCAG 1.4.11's 3:1 on every surface. This is a visible change: the empty box and the radio ring are darker in light mode and lighter in dark mode. It needs `@calcifer-design/tokens` 0.4.0, which declares the token.
