---
'@calcifer-design/ui': minor
---

`Button` and `LinkButton` take four fill hooks, so a consumer can give a button a fill of its own from a class. Nothing changes for an existing button: every default equals today's colour, in every variant, tone and state.

- `--button-fill` and `--button-label-color` set the fill and the label colour at rest; `--button-fill-hover` and `--button-label-color-hover` set them on hover (and on a row's press). Each hover hook falls back to its rest hook, so a fill set without a hover pair keeps its colour on hover. Like the other consumer hooks, they inherit, so a class on a wrapper reaches every button inside it.
- The library declares no hook, so a class that sets them wins in every state at any weight: rest, hover, pressed, focused, disabled, loading, pending and chosen. It no longer has to match `[data-tone]` to get past the accent hover. A disabled inverse primary dims the consumer's pair as it dims its own. Under forced colours the system colours still win.
- One rule now paints a button's fill and label colour, at (0,2,0), the weight of the old variant rules. The tone and hover rules set only the defaults it paints. A consumer rule that sets `background` or `color` directly at (0,2,1) or more now wins in every state, where the accent hover (0,5,0) or a tone (0,3,0) used to beat it. A rule that sets them at a weight under (0,2,0) still loses, as before.
- A consumer's `[data-tone]` workaround keeps working unchanged: a selector such as `button.dangerButton[data-variant='primary'][data-tone]:hover:not([data-disabled])` still wins, and can be dropped for the hooks when convenient.
- New story: `DangerViaHooks`.
