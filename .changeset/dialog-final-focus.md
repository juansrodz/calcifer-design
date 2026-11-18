---
'@calcifer-design/ui': minor
---

`Dialog` takes a `finalFocus` prop: where focus goes when the dialog closes. Base UI returns focus to the dialog's `trigger`, or to the control that held it when the dialog opened; for a dialog opened with no trigger and nothing focused (from a URL parameter, say), or whose opener unmounted while it was open, that target is gone and focus fell to `<body>`. `finalFocus` takes what Base UI's `Dialog.Popup` takes: a ref (focus moves to its element, and an empty ref falls back to the default), a function called with how the dialog was closed (return an element, or `true` or `null` for the default, or `false` to move focus nowhere), or `false` to move focus nowhere, not even back to the trigger. It applies to every variant (`center` and both sheets). Left out, nothing changes. The opening focus stays as `Dialog` sets it, so there is no `initialFocus` prop.
