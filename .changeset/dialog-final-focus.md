---
'@calcifer-design/ui': minor
---

`Dialog` takes a `finalFocus` prop: where focus goes when the dialog closes.

- Base UI returns focus to the dialog's `trigger`, or to the control that held it when the dialog opened. A dialog opened with no trigger and nothing focused (from a URL parameter, say), or whose opener unmounted while it was open, has neither. Focus then falls to `<body>`, or to a control an earlier popup remembered. `finalFocus` says where it goes instead.
- It takes what Base UI's `Dialog.Popup` takes. A ref moves focus to its element, and an empty ref keeps the default. A function is called with how the dialog was closed and returns the element to focus, `true` or `null` for the default, or `false` or nothing for no move at all, so write `ref.current ?? null`, not `ref.current ?? undefined`. Passing `false` instead of a function moves focus nowhere too, not even back to the trigger.
- The element has to be able to take focus. A heading needs `tabIndex={-1}`. An element that is not in the tab order hands focus to its first tabbable descendant, so a `tabIndex={-1}` heading that holds a link focuses the link. An element that cannot take focus moves nothing, and focus falls to `<body>`.
- A ref or function target also wins over focus your own `onOpenChange` moves as the dialog closes. On a nested dialog, leave `finalFocus` out: it would pull focus out of the outer dialog while that dialog is still open.
- It applies to every variant (`center` and both sheets). Left out, nothing changes. The opening focus stays as `Dialog` sets it, so there is no `initialFocus` prop.
