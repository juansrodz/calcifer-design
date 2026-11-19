---
'@calcifer-design/ui': patch
---

An `IconButton` or `LinkIconButton` marked `aria-disabled="true"` no longer takes its variant's hover tint: under the pointer it looks as it does at rest, in every variant. This changes the default look of such a button, including the `DatePicker`'s month button at the end of its range, which used to tint on hover. A loading button and one marked `disabled` are unchanged.
