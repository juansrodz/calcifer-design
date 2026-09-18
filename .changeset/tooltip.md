---
'@calcifer-design/ui': minor
---

Add `Tooltip` and `TooltipProvider`, with the hover delay exported as `TOOLTIP_DELAY`. `label` is required and becomes both the tip's text and the trigger's `aria-label`, because Base UI's tooltip contributes nothing to the accessibility tree — no `role="tooltip"`, no `aria-describedby` — and is disabled on touch devices, so a tip nobody names is a tip some people never get. The provider renders no DOM and attaches no listeners, which is what makes it safe for a federated remote to mount its own.
