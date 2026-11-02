---
'@calcifer-design/ui': minor
---

Add five form components.

- `TextArea`: a textarea for `Field`, four rows tall by default. `autoResize` grows it with its content through CSS `field-sizing: content`; a browser without that keeps a normal textarea the user can drag taller.
- `Form`: collects values and hands `onSubmit` a plain object. `errors`, keyed by field `name`, shows each message on the matching `Field`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `DatePicker`, `TimePicker` or `Upload`, marks it invalid and clears it when that control's value changes. An explicit `error` prop wins. On submit, focus moves to the first invalid control, and an invalid control stops the submit. Inside a `Form`, a `required` control left empty now shows a message on its own frame. A plain `<form>` behaves as it did.
- `DatePicker`: a button showing the formatted date opens a calendar following the WAI-ARIA date picker dialog pattern. `value` is a `YYYY-MM-DD` string or `null`, so no date shifts across time zones. Takes `min`, `max`, `isDateDisabled`, `locale`, `weekStartsOn` and `clearable`, reads right-to-left locales the right way round, and submits through a hidden input. A string that names no real date reads as nothing chosen, and `Form` refuses a date the bounds refuse, with `labels.unavailableMessage`. Always draws the Gregorian calendar, in the locale's language and digits.
- `TimePicker`: the native time input for `Field`, with `min`, `max` and `step`.
- `Upload`: selects files without transferring them, on a real file input with a drop zone over it. `accept`, `maxSizeBytes` and the one-file limit are checked for dropped files as well as chosen ones, and `onReject` gets a reason per file, including a `duplicate` when `multiple` is on. Lists the chosen files with a named remove button each, and announces changes to screen readers. Inside `Form`, its value is an array of `File`s. `DatePicker` and `Upload` also follow a native reset of their form, going back to their defaults when uncontrolled. `Form` itself is reset by remounting with a new `key`.
