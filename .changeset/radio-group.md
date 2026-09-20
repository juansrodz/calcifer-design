---
'@calcifer-design/ui': minor
---

Add `RadioGroup`: a named group of radio options with arrow-key navigation, a vertical or horizontal layout, and the tier's `description`/`error` props. The group's name is a plain element the group points at rather than a `<label>`, and each option is scoped by a `Field.Item` — without both, Base UI names every radio after the group and gives them one shared id.
