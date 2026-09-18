---
'@calcifer-design/ui': minor
---

Add `Dialog`: a modal surface in two variants — centred, and a sheet docked to the bottom edge or, with `side="end"`, a full-height panel on the trailing edge — on the same popup skin as `Popover`. Escape always closes it, because Base UI treats that as non-negotiable and offers no prop to turn it off; `dismissOnOutsidePress` covers the case a caller actually needs to control. Focus moves to the header's close control on open and back to the trigger on close.

Its backdrop is `var(--color-scrim)`, new in `@calcifer-design/tokens@0.2.0`: an app that imports `tokens.css` from its own top-level dependency needs that dependency at `^0.2.0`, or the dialog opens over a fully transparent page.
