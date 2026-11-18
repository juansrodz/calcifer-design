---
'@calcifer-design/ui': minor
---

`EmptyState` takes a `bare` prop. It drops the card's shadow and, under the neutral tone, its surface, for a container that already frames the empty state, such as a panel or `DataGrid`'s body: the content sits flat on the container's own surface instead of a card nested in it. The padding and the layout stay, and the root carries `data-bare`. Under `tone="selected"` the fill stays, because its text colour is chosen against it. Without `bare`, nothing changes.
