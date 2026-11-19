---
'@calcifer-design/ui': minor
---

`Dialog` holds back the focus ring on the control it focuses as it opens when a pointer (mouse, touch, pen) opened it through its `trigger`, until a key is pressed or focus leaves that control; a keyboard open draws the ring at once, as before. Only the focus the dialog itself places is held back: with focus already inside at open (an `autoFocus` field), nothing is, and a key pressed before the opening focus lands cancels it. A text-entry field is never held back. Under forced colours the ring is held back too, and the browser's `Highlight` border on a focused button still shows focus. The new `quietFocus` prop sets it: left out, the rule above; `true`, quiet for every open but a keyboard one (for a dialog opened from app state, which Base UI cannot see, when the app knows a pointer or a link opened it); `false`, never quiet. An app that held the ring back itself (`--color-focus: transparent` until the first key) can drop that scope.
