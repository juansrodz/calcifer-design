---
'@calcifer-design/ui': patch
---

`Dialog` keeps focus inside the popup while Base UI's focus guard hands a Tab back to the other end of the dialog. The guard did that a frame later, and a second Tab inside the frame (a held key on a busy page) went on from the guard to the page behind, onto the trigger. The popup now takes focus at once from its own two guards and Base UI's own redirect lands as before; the guards of a popover or a nested dialog inside it are left to them.
