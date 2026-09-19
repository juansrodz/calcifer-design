---
'@calcifer-design/ui': minor
---

Add `Select`: a labelled, described, validatable select built on Base UI's `Select`, wearing the Tier 3 field skin on its trigger and the Tier 2 popup skin on its list. Options are an array of `{ value, label, disabled? }` and values are strings, because that is what a form submits. Keyboard navigation, typeahead and collision-aware positioning come from Base UI; `aria-invalid` on the trigger does not, so this wrapper sets it.
