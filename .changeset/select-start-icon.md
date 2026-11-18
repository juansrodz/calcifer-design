---
'@calcifer-design/ui': minor
---

`Select` takes a `startIcon`: content inside the trigger, before the value, such as an icon from your own set or an `<Avatar size="xs" />` for the person the value names. It is the name `TextInput`, `TimePicker` and `Button` already use for leading content, and an `<svg>` in it is sized and coloured as on `TextInput`. The slot sits right before the value at the same 8 px gap, and the chevron stays at the end; in a right-to-left page the row mirrors.

The slot is decorative: it is `aria-hidden`, so the trigger's accessible name stays its label and nothing in the slot is read with the value. When the content carries meaning the value text does not, put it in the option's `label` or the field's `description`. A press on the slot opens the select, keyboard handling is unchanged, and the trigger keeps its 44 px floor (a 24 px avatar fits inside it). Without the prop the trigger renders exactly as before. A new `WithStartIcon` story shows an avatar that follows the chosen value.
