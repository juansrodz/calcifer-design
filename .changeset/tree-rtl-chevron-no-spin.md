---
'@calcifer-design/ui': patch
---

`Tree` (and the tree inside `TreeSelect`): in a right-to-left page, the closed chevrons no longer spin through a half turn when the tree mounts. The tree reads the computed direction in an effect and writes it to its root as `data-direction`, and the chevrons' starting angle is fixed from the left-to-right rule before that write. Writing it then changed the transform, and the transform transitions, so every closed chevron turned from pointing right to pointing left over about 120 ms (reduced-motion users never saw it). In a left-to-right page nothing changes, and neither does what a chevron does when a branch opens or closes.

The direction is now written only when it is new or differs from what the root already holds, and with the chevrons' transitions held still for that one write (the root carries a `data-direction-changing` mark for the write, which the stylesheet reads, and it is gone again before the browser paints). A render that finds the direction unchanged writes nothing, so the hold never lands on a turn that is running. Keyboard handling is unchanged: Left and Right still swap by the computed direction, read when the key is pressed.

Two limits, now in `Tree`'s documentation. The direction is read after each render, so a `dir` changed under a memoised subtree takes effect on that subtree's next render. Server-rendered HTML carries no direction until hydration, so before then a closed chevron in a right-to-left page points right.
