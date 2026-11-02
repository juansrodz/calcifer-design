---
'@calcifer-design/ui': minor
---

Add five data display components.

- `Tree`: a hierarchy following the WAI-ARIA tree view pattern, with `selectionMode` `none`, `single` or `multiple`. One tab stop, on the selected item or else the first enabled one; arrow keys, Home, End and type-ahead, with Left and Right swapping in right-to-left pages. Disabled items can be focused but do nothing. If an item goes, by removal or by being collapsed away, focus moves to its nearest ancestor still shown. Ids must be unique in the whole tree; a repeated one is left out, with what it holds.
- `TreeSelect`: choose one node from a hierarchy, as a full field with `label`, `description`, `error`, `required`, `disabled` and `clearable`. Opens on the chosen node with the branches around it open; choosing closes it and returns focus, as Escape does. Submits the node's `id` through a hidden input, and works inside `Form`, including a `null` value when nothing is chosen, and a native reset of the form. A value no node holds reads as nothing chosen.
- `FilterBar`: the row above a results list, with a search, slots for filter controls, the active filters as chips and a count announced politely when it changes. It holds no filter logic. Removing a chip moves focus to the next one, or to the search when none are left. Every word can be replaced through `labels`.
- `CardList`: a responsive grid of cards, generic over the item type, with `loading`, `skeletonCount` and `emptyState`. Items already there stay while loading; skeletons stand in only for an empty list and are not read out.
- `Timeline`: a chronological record with `<time>` elements on the Gregorian calendar, in an optional `locale`. `tone` is stated in visible words, through `toneLabels`, as well as colour. A `timestamp` that is not ISO 8601 is shown as written.
