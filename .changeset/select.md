---
'@calcifer-design/ui': minor
---

Add `Select`: a labelled, described, validatable select built on Base UI's `Select`, wearing the Tier 3 field skin on its trigger and the Tier 2 popup skin on its list. Options are an array of `{ value, label, disabled? }` and values are strings, because that is what a form submits. Keyboard navigation, typeahead, collision-aware positioning and `aria-invalid` on the trigger all come from Base UI; what this wrapper adds is the field skin, the popup variant and one prop shape.
