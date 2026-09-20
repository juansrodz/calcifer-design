---
'@calcifer-design/ui': minor
---

Add `Field` and `TextInput`, the first two Tier 3 form components, on a new shared field skin (`src/styles/field.module.css`). `Field` supplies the label, the required mark, the description and the error message, and wires all four into the control's accessible name and description through Base UI's `Field`. `TextInput` is the native input on that skin; its `render` prop puts any other element — a `<textarea>`, a date or file input — into the same wiring, which is how a consumer builds a control the library does not ship.

The error is a prop, not a validation engine: `error` present means invalid, so Zod, TanStack Form or anything else stays the single source of truth for what is wrong.
