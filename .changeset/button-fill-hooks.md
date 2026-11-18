---
'@calcifer-design/ui': minor
---

`Button` and `LinkButton` take four fill hooks, so a consumer can give a button a fill of its own from a class. Nothing changes for a button that no consumer rule recolours: every default equals today's colour, in every variant, tone and state.

- `--button-fill` and `--button-label-color` set the fill and the label colour at rest; `--button-fill-hover` and `--button-label-color-hover` set them on hover and on a row's press (a touch press too). Each hover hook falls back to its rest hook, so a fill set without a hover pair keeps its colour on hover. Set the hover pair with these two, not by changing `--button-fill` under your own `:hover`, which also reaches a disabled button.
- The library declares no hook, so a class that sets them wins in every state at any weight: rest, hover, pressed, focused, disabled, loading, pending and chosen. It no longer has to match `[data-tone]` to get past the accent hover. A disabled button dims the consumer's pair as it dims its own. Under forced colours the system colours still win.
- Like the other consumer hooks they inherit, so a class on a wrapper reaches every `Button` and `LinkButton` inside it, whatever the variant, including the ones the library renders there (a `Toolbar`'s buttons, a `DataGrid`'s Clear filters and Retry, an `ErrorBoundary`'s reset, an `Upload`'s browse button, a `DatePicker`'s close), and it overrides the chosen tone's fill. Prefer the class on the button itself.
- One rule now paints a button's fill and label colour, at (0,2,0), the weight of the old variant rules; the tone and hover rules set only the defaults it paints. The disabled inverse primary still paints at (0,5,0), as before, so its dimming holds.
- New stories: `DangerViaHooks` and `RowViaHooks`.

**Migration.** A rule that sets `background` or `color` on a `Button` at (0,2,0) or more, loaded after the library, now applies in every state, including hover and the inverse and selected tones, where the accent hover (0,5,0) or a tone (0,3,0) used to beat it. A rest-only override therefore loses the library's hover colour. A rule under (0,2,0) still loses, as before. Prefer the hooks: `.x { --button-fill: …; --button-fill-hover: …; --button-label-color: …; }`.

A `[data-tone]` workaround keeps working unchanged and can move to the hooks when convenient. WhosBringingWhat's danger button, for example:

```css
/* before */
button.dangerButton[data-variant='primary'],
button.dangerButton[data-variant='primary'][data-tone]:hover:not([data-disabled]) {
  background: var(--wbw-danger-fill);
  color: var(--color-text-inverse);
}

/* after */
.dangerButton {
  --button-fill: var(--wbw-danger-fill);
  --button-label-color: var(--color-text-inverse);
}
```
