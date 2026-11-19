---
'@calcifer-design/ui': minor
---

`Dialog` holds back the focus ring on the control it focuses as it opens when a pointer (mouse, touch, pen) opened it through its `trigger`, until a key is pressed or focus leaves that control; a keyboard open draws the ring at once, as before. A text field is never held back. Forced colours behave the same as normal mode. The new `quietFocus` prop sets it: left out, the rule above; `true`, quiet for every open but a keyboard one (for a dialog opened from app state, which Base UI cannot see, when the app knows a pointer or a link opened it); `false`, never quiet. An app that held the ring back itself (`--color-focus: transparent` until the first key) can drop that scope.
