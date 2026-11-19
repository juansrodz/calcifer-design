---
'@calcifer-design/ui': patch
---

`AvatarGroup` at `xs` and `sm` no longer cuts the end of the second letter of each avatar's initials. The stack overlapped by two space steps (8 px) at every size, which at `xs` (24 px avatars) and `sm` (28 px) put the next avatar's edge, and the ring round it, across the letters: up to 4.5 px of the initials' box at `xs` and 2.5 px at `sm`, and under forced colours the cut letter ran into the neighbour's outline. Those two sizes now overlap less: half a space step (2 px) at `xs` and one step (4 px) at `sm`. The initials of the stories' names now clear the neighbour's edge by 1.4 px at both sizes (they were 4.5 px and 2.5 px under it), and no pixel of them is covered in light, dark or forced colours. `md`, `lg` and `xl` are unchanged at two steps.

This is a normal-mode change, on purpose: `xs` and `sm` stacks are 6 px and 4 px tighter in the overlap, so a row of them is 6 px (`xs`) and 4 px (`sm`) wider per avatar after the first. The stack still overlaps, at 8% (`xs`) and 14% (`sm`) of an avatar's width, close to `lg`'s 12% and `xl`'s 8%. A pair of the widest capitals (`WW`, `MW`) can still run under the ring at these sizes, as it can at `md`; only an overlap near zero would clear those.

New `AvatarGroup` story `Photos`: a group of photo avatars drawn from inlined data (no network), light and dark portraits side by side, so the forced-colours edge between two photos can be looked at.
